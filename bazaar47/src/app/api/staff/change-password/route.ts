// app/api/staff/change-password/route.ts
import { NextRequest, NextResponse } from 'next/server'
import {
  getCurrentStaff,
  verifyStaffPassword,
  hashStaffPassword,
  markPasswordChanged,
} from '@/lib/staff/auth'
import { setCredential } from '@/lib/storage/staff-credentials'

const MIN_PASSWORD_LENGTH = 8

/**
 * Self-service password change for a logged-in staff member.
 *
 * Requires the current password even when mustChangePassword is true.
 * Rationale: on a shared-device scenario, forcing a change without
 * proof of the current password lets anyone who finds an unlocked
 * session take over the account. The current-password check costs
 * one bcrypt compare and closes that hole.
 *
 * On success:
 *   - Saves the new bcrypt hash
 *   - Clears mustChangePassword
 *   - Does NOT rotate the session (the caller is still authenticated)
 */
export async function POST(request: NextRequest) {
  const current = await getCurrentStaff({ refresh: false })
  if (!current) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { currentPassword?: unknown; newPassword?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const currentPassword = body.currentPassword
  const newPassword = body.newPassword

  if (typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
    return NextResponse.json(
      { error: 'Current and new password are required' },
      { status: 400 }
    )
  }

  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json(
      { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` },
      { status: 400 }
    )
  }

  if (currentPassword === newPassword) {
    return NextResponse.json(
      { error: 'New password must differ from current password' },
      { status: 400 }
    )
  }

  const valid = await verifyStaffPassword(current.staff.id, currentPassword)
  if (!valid) {
    return NextResponse.json(
      { error: 'Current password is incorrect' },
      { status: 401 }
    )
  }

  try {
    const hash = await hashStaffPassword(newPassword)
    // mustChangePassword: false — they just changed it.
    await setCredential(current.staff.id, hash, false)
    await markPasswordChanged(current.staff.id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[change-password] failed:', err)
    return NextResponse.json(
      { error: 'Failed to save new password' },
      { status: 500 }
    )
  }
}