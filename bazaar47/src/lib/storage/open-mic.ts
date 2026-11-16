// lib/storage/open-mic.ts
import { Redis } from '@upstash/redis'
import type { OpenMicSubmission, OpenMicSession } from '@/types/open-mic'

const redis = Redis.fromEnv()
const POOL_KEY = 'open_mic_pool'
const SESSIONS_KEY = 'open_mic_sessions'

// ============================================
// THE POOL (Raw Submissions)
// ============================================

/**
 * Read every pool submission. Legacy records (missing `sessionDates`)
 * are normalized to `sessionDates: []` on read — the shape on disk is
 * left alone so the migration is lazy and idempotent.
 */
export async function getPool(): Promise<OpenMicSubmission[]> {
  try {
    const raw = await redis.get(POOL_KEY)
    const list = (raw as OpenMicSubmission[]) || []
    return list.map((s) => ({
      ...s,
      sessionDates: Array.isArray(s.sessionDates) ? s.sessionDates : [],
    }))
  } catch (error) {
    console.error('Redis get error (open_mic_pool):', error)
    return []
  }
}

/**
 * Every submission whose `sessionDates` includes the given Wednesday.
 * Used by the admin dashboard's per-session pool view and by the
 * LineupBuilder (via the parent page).
 */
export async function getSubmissionsForSession(
  sessionIso: string
): Promise<OpenMicSubmission[]> {
  const pool = await getPool()
  return pool.filter((s) => s.sessionDates.includes(sessionIso))
}

/**
 * Every submission with no session dates yet — legacy records that
 * predate per-week signups. Surfaced in the admin dashboard's
 * "Unscheduled legacy" section.
 */
export async function getUnscheduledSubmissions(): Promise<OpenMicSubmission[]> {
  const pool = await getPool()
  return pool.filter((s) => s.sessionDates.length === 0)
}

export type CreateSubmissionResult =
  | { kind: 'created'; submission: OpenMicSubmission }
  | { kind: 'appended'; submission: OpenMicSubmission }
  | { kind: 'duplicate-week'; submission: OpenMicSubmission }

/**
 * Create or append a pool submission for a specific Wednesday.
 *
 * - New email → create a fresh record with `sessionDates: [iso]`.
 * - Existing email, week not in their list → append the week, update
 *   their contact details from the latest submission, return 'appended'.
 * - Existing email, week already in their list → return 'duplicate-week'
 *   so the route can 409 with a clear message.
 *
 * The duplicate-email check is now per-session, not global. Artists
 * can (and should) be able to sign up for multiple weeks.
 */
export async function createSubmission(
  input: Omit<OpenMicSubmission, 'id' | 'createdAt' | 'updatedAt' | 'sessionDates'>,
  sessionIso: string
): Promise<CreateSubmissionResult> {
  const pool = await getPool()
  const normalizedEmail = input.email.trim().toLowerCase()
  const now = new Date().toISOString()

  const existingIdx = pool.findIndex(
    (s) => s.email.trim().toLowerCase() === normalizedEmail
  )

  // ---- New artist ----
  if (existingIdx === -1) {
    const submission: OpenMicSubmission = {
      ...input,
      id: crypto.randomUUID(),
      sessionDates: [sessionIso],
      createdAt: now,
      updatedAt: now,
    }
    await redis.set(POOL_KEY, [...pool, submission])
    return { kind: 'created', submission }
  }

  // ---- Existing artist ----
  const existing = pool[existingIdx]

  if (existing.sessionDates.includes(sessionIso)) {
    return { kind: 'duplicate-week', submission: existing }
  }

  // Append the week, refresh their contact details from this
  // submission. This means "latest signup wins" for genre, musicLink,
  // instagram, artistName, fullName — the artist's most recent
  // self-description is what the admin sees on any week's pool.
  const updated: OpenMicSubmission = {
    ...existing,
    fullName: input.fullName,
    artistName: input.artistName,
    genre: input.genre,
    musicLink: input.musicLink,
    instagram: input.instagram,
    sessionDates: [...existing.sessionDates, sessionIso],
    updatedAt: now,
  }

  const next = [...pool]
  next[existingIdx] = updated
  await redis.set(POOL_KEY, next)
  return { kind: 'appended', submission: updated }
}

/**
 * Manually assign a session to a submission. Used by the admin
 * "Unscheduled legacy" section to place pre-per-week records into a
 * week. Idempotent — assigning an already-assigned week is a no-op.
 */
export async function assignSubmissionToSession(
  submissionId: string,
  sessionIso: string
): Promise<OpenMicSubmission | null> {
  const pool = await getPool()
  const idx = pool.findIndex((s) => s.id === submissionId)
  if (idx === -1) return null

  const existing = pool[idx]
  if (existing.sessionDates.includes(sessionIso)) return existing

  const updated: OpenMicSubmission = {
    ...existing,
    sessionDates: [...existing.sessionDates, sessionIso],
    updatedAt: new Date().toISOString(),
  }
  pool[idx] = updated
  await redis.set(POOL_KEY, pool)
  return updated
}

/**
 * Remove one session from a submission's list. Does NOT delete the
 * submission; use `deletePoolSubmission` for that. Used when an admin
 * wants to move an artist to a different week.
 */
export async function removeSubmissionFromSession(
  submissionId: string,
  sessionIso: string
): Promise<OpenMicSubmission | null> {
  const pool = await getPool()
  const idx = pool.findIndex((s) => s.id === submissionId)
  if (idx === -1) return null

  const updated: OpenMicSubmission = {
    ...pool[idx],
    sessionDates: pool[idx].sessionDates.filter((d) => d !== sessionIso),
    updatedAt: new Date().toISOString(),
  }
  pool[idx] = updated
  await redis.set(POOL_KEY, pool)
  return updated
}

export async function updatePoolSubmission(
  id: string,
  updates: Partial<OpenMicSubmission>
): Promise<OpenMicSubmission | null> {
  const pool = await getPool()
  const idx = pool.findIndex((s) => s.id === id)
  if (idx === -1) return null

  // Never let callers overwrite sessionDates via this path — use the
  // dedicated assign/remove functions so the per-week invariant holds.
  const { sessionDates: _ignored, ...safeUpdates } = updates

  pool[idx] = {
    ...pool[idx],
    ...safeUpdates,
    updatedAt: new Date().toISOString(),
  }
  await redis.set(POOL_KEY, pool)
  return pool[idx]
}

export async function deletePoolSubmission(id: string): Promise<boolean> {
  const pool = await getPool()
  const filtered = pool.filter((s) => s.id !== id)
  if (filtered.length === pool.length) return false
  await redis.set(POOL_KEY, filtered)

  // Also remove from any lineups
  const sessions = await getAllSessions()
  for (const session of sessions) {
    session.lineup = session.lineup.filter((slot) => slot.submissionId !== id)
  }
  await saveAllSessions(sessions)

  return true
}

// ============================================
// SCHEDULED SESSIONS
// ============================================

export async function getAllSessions(): Promise<OpenMicSession[]> {
  try {
    const raw = await redis.get(SESSIONS_KEY)
    return (raw as OpenMicSession[]) || []
  } catch (error) {
    console.error('Redis get error (open_mic_sessions):', error)
    return []
  }
}

export async function getSession(
  dateIso: string
): Promise<OpenMicSession | null> {
  const sessions = await getAllSessions()
  return sessions.find((s) => s.date === dateIso) || null
}

export async function saveSession(session: OpenMicSession): Promise<void> {
  const sessions = await getAllSessions()
  const idx = sessions.findIndex((s) => s.date === session.date)

  if (idx !== -1) {
    sessions[idx] = session
  } else {
    sessions.push(session)
  }

  await redis.set(SESSIONS_KEY, sessions)
}

export async function saveAllSessions(
  sessions: OpenMicSession[]
): Promise<void> {
  await redis.set(SESSIONS_KEY, sessions)
}

export async function deleteSession(dateIso: string): Promise<boolean> {
  const sessions = await getAllSessions()
  const filtered = sessions.filter((s) => s.date !== dateIso)
  if (filtered.length === sessions.length) return false
  await redis.set(SESSIONS_KEY, filtered)
  return true
}