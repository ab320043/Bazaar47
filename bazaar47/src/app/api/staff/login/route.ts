// app/api/staff/login/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getStaff } from '@/lib/storage/staff'
import {
  createStaffSession,
  verifyStaffPassword,
} from '@/lib/staff/auth'

/**
 * Uniform error message for both "no such account" and "wrong password".
 * This prevents account enumeration via login timing/messaging.
 */
const GENERIC_INVALID = 'Invalid email or password'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body as {
      email?: unknown
      password?: unknown
    }

    if (typeof email !== 'string' || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.trim().toLowerCase()

    // 1. Find a staff member with this email (case-insensitive).
    const staffList = await getStaff()
    const staff = staffList.find(
      (s) => s.email.trim().toLowerCase() === normalizedEmail
    )

    // 2. Verify password. If no staff match, still return the generic error.
    if (!staff) {
      return NextResponse.json({ error: GENERIC_INVALID }, { status: 401 })
    }

    if (!staff.isActive) {
      return NextResponse.json({ error: GENERIC_INVALID }, { status: 401 })
    }

    const valid = await verifyStaffPassword(staff.id, password)
    if (!valid) {
      return NextResponse.json({ error: GENERIC_INVALID }, { status: 401 })
    }

    // 3. Success — mint a session and write the cookie.
    await createStaffSession(staff.id)

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      redirect: '/staff/dashboard',
    })
  } catch (error) {
    console.error('Staff login error:', error)
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    )
  }
}