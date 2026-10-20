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
      console.warn('[checkout] 401: no valid session')
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

    return NextResponse.json({
      success: true,
      message: 'Checked out successfully',
      assignment: result.assignment,
      hoursWorked: result.assignment.hoursWorked,
      amountEarned:
        (result.assignment.hoursWorked ?? 0) *
        (result.assignment.hourlyRate ?? 0),
    })
  } catch (error) {
    console.error('[checkout] unexpected error:', error)
    return NextResponse.json(
      { error: 'Something went wrong on our end. Please try again.' },
      { status: 500 }
    )
  }
}