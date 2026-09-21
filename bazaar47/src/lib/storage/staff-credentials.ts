// lib/storage/staff-credentials.ts
import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()
const CREDENTIALS_KEY = 'staff_credentials'

// ============================================
// TYPES
// ============================================

export interface StaffCredential {
  staffId: string
  passwordHash: string
  mustChangePassword: boolean
  createdAt: string
  updatedAt: string
}

type CredentialsMap = Record<string, StaffCredential>

// ============================================
// READ
// ============================================

async function getCredentialsMap(): Promise<CredentialsMap> {
  try {
    const raw = await redis.get(CREDENTIALS_KEY)
    return (raw as CredentialsMap) || {}
  } catch (error) {
    console.error('Redis get error (staff_credentials):', error)
    return {}
  }
}

async function saveCredentialsMap(map: CredentialsMap): Promise<void> {
  try {
    await redis.set(CREDENTIALS_KEY, map)
  } catch (error) {
    console.error('Redis set error (staff_credentials):', error)
    throw new Error('Failed to save staff credentials')
  }
}

// ============================================
// CRUD
// ============================================

export async function getCredential(
  staffId: string
): Promise<StaffCredential | undefined> {
  const map = await getCredentialsMap()
  return map[staffId]
}

/**
 * Create or overwrite a staff member's credential.
 * Used by admin "Add Staff" (initial temp password) and "Reset password".
 */
export async function setCredential(
  staffId: string,
  passwordHash: string,
  mustChangePassword: boolean = true
): Promise<StaffCredential> {
  const map = await getCredentialsMap()
  const now = new Date().toISOString()

  const existing = map[staffId]
  const record: StaffCredential = {
    staffId,
    passwordHash,
    mustChangePassword,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  }

  map[staffId] = record
  await saveCredentialsMap(map)
  return record
}

export async function deleteCredential(staffId: string): Promise<boolean> {
  const map = await getCredentialsMap()
  if (!(staffId in map)) return false
  delete map[staffId]
  await saveCredentialsMap(map)
  return true
}

export async function clearMustChangePassword(staffId: string): Promise<void> {
  const map = await getCredentialsMap()
  const existing = map[staffId]
  if (!existing) return
  map[staffId] = {
    ...existing,
    mustChangePassword: false,
    updatedAt: new Date().toISOString(),
  }
  await saveCredentialsMap(map)
}

/**
 * Verify a plaintext password against the stored hash for a staff member.
 * Returns false (never throws) if the staff member has no credential yet —
 * that way callers can uniformly return "invalid email or password" without
 * leaking whether an account exists.
 *
 * NOTE: the actual bcrypt comparison is performed by the caller in
 * `lib/staff/auth.ts` so that this module stays free of the bcrypt import
 * and remains purely a storage layer. This function only fetches.
 */
export async function hasCredential(staffId: string): Promise<boolean> {
  const map = await getCredentialsMap()
  return staffId in map
}