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

/** bcrypt cost factor. 12 is a good balance for a small roster on Vercel. */
const BCRYPT_ROUNDS = 12

// ============================================
// PASSWORD HASHING
// ============================================

export async function hashStaffPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS)
}

/**
 * Verify a plaintext password for a staff member.
 * Returns false if the staff member has no credential (never throws),
 * so callers can return a uniform "invalid email or password".
 */
export async function verifyStaffPassword(
  staffId: string,
  plain: string
): Promise<boolean> {
  const credential = await getCredential(staffId)
  if (!credential) return false
  return bcrypt.compare(plain, credential.passwordHash)
}

/**
 * Set (or reset) a staff member's password.
 * `mustChangePassword` defaults to true for admin-provisioned temp passwords.
 * Also invalidates any existing sessions for that staff member.
 */
export async function setStaffPassword(
  staffId: string,
  plain: string,
  mustChangePassword: boolean = true
): Promise<void> {
  const hash = await hashStaffPassword(plain)
  await setCredential(staffId, hash, mustChangePassword)
  await deleteSessionsForStaff(staffId)
}

/**
 * Mark the "must change password" flag as satisfied.
 * (Tier 1 does not expose a self-service change form, but the flag exists
 * so the staff dashboard can prompt when the admin-set temp password is
 * still in use. Call this once a change is completed.)
 */
export async function markPasswordChanged(staffId: string): Promise<void> {
  await clearMustChangePassword(staffId)
}

// ============================================
// COOKIE HELPERS
// ============================================

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: Math.floor(STAFF_SESSION_TTL_MS / 1000), // seconds
}

// ============================================
// SESSION LIFECYCLE (Next.js cookies() based)
// ============================================

/**
 * Create a new session for a staff member and write the cookie.
 * Call this from the login route.
 */
export async function createStaffSession(staffId: string): Promise<string> {
  const record = await createSession(staffId)
  const cookieStore = await cookies()
  cookieStore.set(STAFF_SESSION_COOKIE, record.token, COOKIE_OPTIONS)
  return record.token
}

/**
 * Read the current session record from the cookie.
 * Does NOT refresh expiry — use `touchStaffSession` for that.
 */
export async function getStaffSession(): Promise<StaffSessionRecord | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(STAFF_SESSION_COOKIE)?.value
  return getSession(token)
}

/**
 * Sliding expiry: refresh the session record AND re-set the cookie's maxAge.
 * Call this on authenticated requests to implement "refresh on activity".
 */
export async function touchStaffSession(): Promise<StaffSessionRecord | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(STAFF_SESSION_COOKIE)?.value
  if (!token) return null

  const refreshed = await refreshSession(token)
  if (!refreshed) {
    // Token was missing/expired — clear the stale cookie.
    cookieStore.delete(STAFF_SESSION_COOKIE)
    return null
  }

  cookieStore.set(STAFF_SESSION_COOKIE, refreshed.token, COOKIE_OPTIONS)
  return refreshed
}

/**
 * Destroy the current session and clear the cookie.
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
 * Returns null if there is no valid session, or if the staff record
 * was deleted / deactivated after the session was issued.
 *
 * Also refreshes the session (sliding expiry) as a side effect.
 */
export async function getCurrentStaff(): Promise<CurrentStaff | null> {
  const session = await touchStaffSession()
  if (!session) return null

  const staff = await getStaffById(session.staffId)
  if (!staff) {
    // Staff record was deleted while the session was alive — tear it down.
    await deleteSession(session.token)
    return null
  }

  if (!staff.isActive) {
    // Staff member was deactivated — tear down the session too.
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