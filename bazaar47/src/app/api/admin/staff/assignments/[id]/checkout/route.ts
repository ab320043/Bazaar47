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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await checkOutAssignment(id, session.staffId)

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    return NextResponse.json({
      success: true,
      message: 'Checked out successfully',
      assignment: result.assignment,
      hoursWorked: result.assignment.hoursWorked,
      amountEarned:
        (result.assignment.hoursWorked ?? 0) * (result.assignment.hourlyRate ?? 0),
    })
  } catch (error) {
    console.error('Error checking out staff (staff route):', error)
    return NextResponse.json(
      { error: 'Failed to check out' },
      { status: 500 }
    )
  }
}