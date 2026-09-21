// app/api/admin/staff/[id]/reset-password/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getStaffById } from '@/lib/storage/staff'
import { setStaffPassword } from '@/lib/staff/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const staff = await getStaffById(id)
    if (!staff) {
      return NextResponse.json(
        { error: 'Staff member not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const newPassword = body?.newPassword

    if (typeof newPassword !== 'string' || newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    // setStaffPassword also invalidates all existing sessions for this
    // staff member (see lib/staff/auth.ts), so a logged-in staff member
    // gets booted to the login screen on their next request.
    await setStaffPassword(id, newPassword, true)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error resetting staff password:', error)
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    )
  }
}