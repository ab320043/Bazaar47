import { NextRequest, NextResponse } from 'next/server'
import { checkInStaff, getAssignments } from '@/lib/storage/staff-assignments'

// ============================================
// POST - Check in staff member
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
    
    // Check if already checked in
    if (assignment.checkInTime) {
      return NextResponse.json(
        { error: 'Staff already checked in' },
        { status: 400 }
      )
    }
    
    // Check if assignment is cancelled
    if (assignment.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Cannot check in cancelled assignment' },
        { status: 400 }
      )
    }
    
    const updated = await checkInStaff(id)
    
    return NextResponse.json({
      success: true,
      message: 'Staff checked in successfully',
      assignment: updated,
    })
  } catch (error) {
    console.error('Error checking in staff:', error)
    return NextResponse.json(
      { error: 'Failed to check in staff' },
      { status: 500 }
    )
  }
}