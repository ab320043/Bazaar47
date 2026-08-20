import { NextRequest, NextResponse } from 'next/server'
import { checkOutStaff, getAssignments } from '@/lib/storage/staff-assignments'

// ============================================
// POST - Check out staff member
// ============================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Check if assignment exists
    const assignments = await getAssignments()
    const assignment = assignments.find(a => a.id === id)
    
    if (!assignment) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      )
    }
    
    // Check if already checked out
    if (assignment.checkOutTime) {
      return NextResponse.json(
        { error: 'Staff already checked out' },
        { status: 400 }
      )
    }
    
    // Check if checked in
    if (!assignment.checkInTime) {
      return NextResponse.json(
        { error: 'Staff must be checked in first' },
        { status: 400 }
      )
    }
    
    const updated = await checkOutStaff(id)
    
    return NextResponse.json({
      success: true,
      message: 'Staff checked out successfully',
      assignment: updated,
      hoursWorked: updated?.hoursWorked,
      amountEarned: (updated?.hoursWorked ?? 0) * (updated?.hourlyRate ?? 0),
    })
  } catch (error) {
    console.error('Error checking out staff:', error)
    return NextResponse.json(
      { error: 'Failed to check out staff' },
      { status: 500 }
    )
  }
}