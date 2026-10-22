// lib/storage/open-mic.ts
import { Redis } from '@upstash/redis'
import type { OpenMicSubmission, OpenMicSession } from '@/types/open-mic'

const redis = Redis.fromEnv()
const POOL_KEY = 'open_mic_pool'
const SESSIONS_KEY = 'open_mic_sessions'

// ============================================
// THE POOL (Raw Submissions)
// ============================================

export async function getPool(): Promise<OpenMicSubmission[]> {
  try {
    const raw = await redis.get(POOL_KEY)
    return (raw as OpenMicSubmission[]) || []
  } catch (error) {
    console.error('Redis get error (open_mic_pool):', error)
    return []
  }
}

export async function createSubmission(
  input: Omit<OpenMicSubmission, 'id' | 'createdAt' | 'updatedAt'>
): Promise<OpenMicSubmission> {
  const pool = await getPool()

  // Check for duplicates in the pool
  const normalizedEmail = input.email.trim().toLowerCase()
  if (pool.some((s) => s.email.trim().toLowerCase() === normalizedEmail)) {
    const err = new Error('This email is already in the submission pool')
    err.name = 'DuplicateSubmission'
    throw err
  }

  const now = new Date().toISOString()
  const submission: OpenMicSubmission = {
    ...input,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  }

  await redis.set(POOL_KEY, [...pool, submission])
  return submission
}

export async function updatePoolSubmission(
  id: string,
  updates: Partial<OpenMicSubmission>
): Promise<OpenMicSubmission | null> {
  const pool = await getPool()
  const idx = pool.findIndex((s) => s.id === id)
  if (idx === -1) return null

  pool[idx] = {
    ...pool[idx],
    ...updates,
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

/**
 * Delete an entire session by its date.
 *
 * Returns true if a session was removed, false if no session existed for
 * that date. Does NOT touch the artist pool — artists who were in this
 * session's lineup remain available for future sessions.
 */
export async function deleteSession(dateIso: string): Promise<boolean> {
  const sessions = await getAllSessions()
  const filtered = sessions.filter((s) => s.date !== dateIso)
  if (filtered.length === sessions.length) return false
  await redis.set(SESSIONS_KEY, filtered)
  return true
}