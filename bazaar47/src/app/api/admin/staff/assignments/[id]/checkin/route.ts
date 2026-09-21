// app/api/staff/assignments/[id]/checkin/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getStaffSession } from '@/lib/staff/auth'
import { checkInAssignment } from '@/lib/staff/assignment-actions'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // 1. Resolve the session. Never trust a staffId from the request.
    const session = await getStaffSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Delegate to the shared core, passing the session's staffId as the
    //    required owner. The core enforces assignment.staffId === expectedStaffId
    //    and returns 403 on mismatch.
    const result = await checkInAssignment(id, session.staffId)

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    return NextResponse.json({
      success: true,
      message: 'Checked in successfully',
      assignment: result.assignment,
    })
  } catch (error) {
    console.error('Error checking in staff (staff route):', error)
    return NextResponse.json(
      { error: 'Failed to check in' },
      { status: 500 }
    )
  }
}