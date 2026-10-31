// app/api/staff/assignments/[id]/checkout/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getStaffSession } from '@/lib/staff/auth'
import { checkOutAssignment } from '@/lib/staff/assignment-actions'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const session = await getStaffSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Your session has expired. Please log in again.' },
        { status: 401 }
      )
    }

    const result = await checkOutAssignment(id, session.staffId)

    if (!result.ok) {
      console.warn('[checkout] failed:', {
        status: result.status,
        error: result.error,
        assignmentId: id,
        staffId: session.staffId,
      })
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      )
    }

    const hoursWorked = result.workLog.hoursWorked
    const amountEarned =
      Math.round(hoursWorked * result.workLog.hourlyRate * 100) / 100

    return NextResponse.json({
      success: true,
      message: 'Checked out successfully',
      assignment: {
        ...result.assignment,
        checkInTime: result.workLog.checkInTime,
        checkOutTime: result.workLog.checkOutTime,
        hoursWorked,
        status: 'completed',
      },
      workLog: result.workLog,
      hoursWorked,
      amountEarned,
    })
  } catch (error) {
    console.error('[checkout] unexpected error:', error)
    return NextResponse.json(
      { error: 'Something went wrong on our end. Please try again.' },
      { status: 500 }
    )
  }
}