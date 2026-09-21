// lib/storage/staff-sessions.ts
import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()
const SESSIONS_KEY = 'staff_sessions'

// ============================================
// TYPES
// ============================================

export interface StaffSessionRecord {
  token: string
  staffId: string
  createdAt: string
  expiresAt: string
}

type SessionsMap = Record<string, StaffSessionRecord>

/** 24 hours, matching the admin cookie lifetime. */
export const STAFF_SESSION_TTL_MS = 24 * 60 * 60 * 1000

// ============================================
// READ / WRITE
// ============================================

async function getSessionsMap(): Promise<SessionsMap> {
  try {
    const raw = await redis.get(SESSIONS_KEY)
    return (raw as SessionsMap) || {}
  } catch (error) {
    console.error('Redis get error (staff_sessions):', error)
    return {}
  }
}

async function saveSessionsMap(map: SessionsMap): Promise<void> {
  try {
    await redis.set(SESSIONS_KEY, map)
  } catch (error) {
    console.error('Redis set error (staff_sessions):', error)
    throw new Error('Failed to save staff sessions')
  }
}

// ============================================
// SESSION LIFECYCLE
// ============================================

function nowMs(): number {
  return Date.now()
}

function isExpired(record: StaffSessionRecord): boolean {
  return new Date(record.expiresAt).getTime() <= nowMs()
}

/**
 * Create a brand new opaque session token for a staff member.
 * Returns the token (to be stored in the `staff_session` cookie).
 */
export async function createSession(staffId: string): Promise<StaffSessionRecord> {
  const map = await getSessionsMap()

  // Opportunistically prune expired sessions so the map doesn't grow forever.
  const pruned = pruneExpired(map)

  const token = crypto.randomUUID() + '.' + crypto.randomUUID()
  const now = new Date()
  const record: StaffSessionRecord = {
    token,
    staffId,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + STAFF_SESSION_TTL_MS).toISOString(),
  }

  pruned[token] = record
  await saveSessionsMap(pruned)
  return record
}

/**
 * Look up a session by token. Returns null if missing or expired.
 * Expired records are pruned on read.
 */
export async function getSession(
  token: string | undefined | null
): Promise<StaffSessionRecord | null> {
  if (!token) return null

  const map = await getSessionsMap()
  const record = map[token]
  if (!record) return null

  if (isExpired(record)) {
    delete map[token]
    await saveSessionsMap(map)
    return null
  }

  return record
}

/**
 * Sliding expiry: if the session is valid, extend its expiresAt by the TTL
 * and return the updated record. If it's missing/expired, return null.
 *
 * This is what makes the 24h cookie "refresh on activity" — the caller
 * (middleware or route handler) invokes this on every authenticated
 * request, and the cookie's own maxAge is also re-set by the API layer.
 */
export async function refreshSession(
  token: string | undefined | null
): Promise<StaffSessionRecord | null> {
  if (!token) return null

  const map = await getSessionsMap()
  const record = map[token]
  if (!record) return null

  if (isExpired(record)) {
    delete map[token]
    await saveSessionsMap(map)
    return null
  }

  const refreshed: StaffSessionRecord = {
    ...record,
    expiresAt: new Date(nowMs() + STAFF_SESSION_TTL_MS).toISOString(),
  }
  map[token] = refreshed
  await saveSessionsMap(map)
  return refreshed
}

export async function deleteSession(token: string | undefined | null): Promise<boolean> {
  if (!token) return false
  const map = await getSessionsMap()
  if (!(token in map)) return false
  delete map[token]
  await saveSessionsMap(map)
  return true
}

/**
 * Invalidate every session for a given staff member.
 * Used when admin resets a password, or deletes the staff member.
 */
export async function deleteSessionsForStaff(staffId: string): Promise<number> {
  const map = await getSessionsMap()
  let removed = 0
  for (const [token, record] of Object.entries(map)) {
    if (record.staffId === staffId) {
      delete map[token]
      removed++
    }
  }
  if (removed > 0) await saveSessionsMap(map)
  return removed
}

// ============================================
// INTERNAL
// ============================================

function pruneExpired(map: SessionsMap): SessionsMap {
  const out: SessionsMap = {}
  for (const [token, record] of Object.entries(map)) {
    if (!isExpired(record)) out[token] = record
  }
  return out
}