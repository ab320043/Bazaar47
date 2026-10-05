// lib/staff/auth.ts
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import { getStaffById } from '@/lib/storage/staff'
import {
  getCredential,
  setCredential,
  clearMustChangePassword,
} from '@/lib/storage/staff-credentials'
import {
  createSession,
  getSession,
  refreshSession,
  deleteSession,
  deleteSessionsForStaff,
  STAFF_SESSION_TTL_MS,
  type StaffSessionRecord,
} from '@/lib/storage/staff-sessions'
import type { StaffMember } from '@/types/staff'

// ============================================
// CONSTANTS
// ============================================

export const STAFF_SESSION_COOKIE = 'staff_session'

const BCRYPT_ROUNDS = 12

// ============================================
// PASSWORD HASHING
// ============================================

export async function hashStaffPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS)
}

export async function verifyStaffPassword(
  staffId: string,
  plain: string
): Promise<boolean> {
  const credential = await getCredential(staffId)
  if (!credential) return false
  return bcrypt.compare(plain, credential.passwordHash)
}

export async function setStaffPassword(
  staffId: string,
  plain: string,
  mustChangePassword: boolean = true
): Promise<void> {
  const hash = await hashStaffPassword(plain)
  await setCredential(staffId, hash, mustChangePassword)
  await deleteSessionsForStaff(staffId)
}

export async function markPasswordChanged(staffId: string): Promise<void> {
  await clearMustChangePassword(staffId)
}

// ============================================
// COOKIE OPTIONS
// ============================================

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: Math.floor(STAFF_SESSION_TTL_MS / 1000),
}

// ============================================
// SESSION LIFECYCLE
// ============================================

/**
 * Create a new session for a staff member and write the cookie.
 * Call this from the login route handler.
 */
export async function createStaffSession(staffId: string): Promise<string> {
  const record = await createSession(staffId)
  const cookieStore = await cookies()
  cookieStore.set(STAFF_SESSION_COOKIE, record.token, COOKIE_OPTIONS)
  return record.token
}

/**
 * READ-ONLY session lookup. Safe to call from a Server Component or
 * Server Action — never attempts to modify cookies.
 *
 * Returns the session record if the token is valid and unexpired,
 * null otherwise. Does NOT slide the expiry.
 */
export async function getStaffSession(): Promise<StaffSessionRecord | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(STAFF_SESSION_COOKIE)?.value
  return getSession(token)
}

/**
 * Sliding-expiry refresh. Modifies Redis AND writes a new cookie.
 * MUST only be called from a Route Handler or Server Action —
 * Server Components are not allowed to set cookies in Next.js 15+.
 */
export async function touchStaffSession(): Promise<StaffSessionRecord | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(STAFF_SESSION_COOKIE)?.value
  if (!token) return null

  const refreshed = await refreshSession(token)
  if (!refreshed) {
    cookieStore.delete(STAFF_SESSION_COOKIE)
    return null
  }

  cookieStore.set(STAFF_SESSION_COOKIE, refreshed.token, COOKIE_OPTIONS)
  return refreshed
}

/**
 * Destroy the current session and clear the cookie.
 * Call from a route handler.
 */
export async function destroyStaffSession(): Promise<void> {
  const cookieStore = await cookies()
  const token = cookieStore.get(STAFF_SESSION_COOKIE)?.value
  if (token) {
    await deleteSession(token)
  }
  cookieStore.delete(STAFF_SESSION_COOKIE)
}

// ============================================
// HIGH-LEVEL: CURRENT STAFF
// ============================================

export interface CurrentStaff {
  staff: StaffMember
  session: StaffSessionRecord
  mustChangePassword: boolean
}

/**
 * Resolve the currently logged-in staff member from the session cookie.
 *
 * Two modes:
 *
 *   getCurrentStaff()                     → refresh the session (route handlers)
 *   getCurrentStaff({ refresh: false })   → read-only (Server Components / layouts)
 *
 * The refresh path writes a new cookie and must NOT be called from a
 * Server Component (Next.js 15+ forbids it). Pass `refresh: false`
 * there — the sliding expiry still happens because the client polls
 * `/api/staff/dashboard` every 60s, which is a route handler and will
 * refresh on the client's behalf.
 *
 * Returns null if there's no valid session, or if the staff record
 * was deleted / deactivated after the session was issued.
 */
export async function getCurrentStaff(
  opts: { refresh?: boolean } = {}
): Promise<CurrentStaff | null> {
  const shouldRefresh = opts.refresh !== false

  let session: StaffSessionRecord | null
  if (shouldRefresh) {
    session = await touchStaffSession()
  } else {
    session = await getStaffSession()
  }

  if (!session) return null

  const staff = await getStaffById(session.staffId)
  if (!staff) {
    await deleteSession(session.token)
    return null
  }

  if (!staff.isActive) {
    await deleteSession(session.token)
    return null
  }

  const credential = await getCredential(staff.id)

  return {
    staff,
    session,
    mustChangePassword: credential?.mustChangePassword ?? false,
  }
}