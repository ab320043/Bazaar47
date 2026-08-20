import { NextRequest, NextResponse } from 'next/server'
import { 
  getAssignments, 
  updateAssignment, 
  deleteAssignment 
} from '@/lib/storage/staff-assignments'
import type { StaffAssignment } from '@/types/staff'

// ============================================
// GET - Get single assignment
// ============================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const assignments = await getAssignments()
    const assignment = assignments.find(a => a.id === id)
    
    if (!assignment) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ assignment })
  } catch (error) {
    console.error('Error fetching assignment:', error)
    return NextResponse.json(
      { error: 'Failed to fetch assignment' },
      { status: 500 }
    )
  }
}

// ============================================
// PUT - Update assignment
// ============================================

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    // Check if assignment exists
    const assignments = await getAssignments()
    const existing = assignments.find(a => a.id === id)
    if (!existing) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      )
    }
    
    // Build update object
    const updates: Partial<StaffAssignment> = {}
    
    if (body.status) updates.status = body.status
    if (body.shiftStart) updates.shiftStart = body.shiftStart
    if (body.shiftEnd) updates.shiftEnd = body.shiftEnd
    if (body.hourlyRate !== undefined) updates.hourlyRate = body.hourlyRate
    if (body.notes !== undefined) updates.notes = body.notes
    if (body.responsibilities) updates.responsibilities = body.responsibilities
    if (body.position) updates.position = body.position
    
    // If status is completed, calculate hours
    if (body.status === 'completed' && existing.checkInTime) {
      const checkIn = new Date(existing.checkInTime)
      const now = new Date()
      const hoursWorked = (now.getTime() - checkIn.getTime()) / (1000 * 60 * 60)
      updates.hoursWorked = Math.round(hoursWorked * 100) / 100
      updates.checkOutTime = now.toISOString()
    }
    
    const updated = await updateAssignment(id, updates)
    
    return NextResponse.json({
      success: true,
      assignment: updated,
    })
  } catch (error) {
    console.error('Error updating assignment:', error)
    return NextResponse.json(
      { error: 'Failed to update assignment' },
      { status: 500 }
    )
  }
}

// ============================================
// DELETE - Delete assignment
// ============================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const deleted = await deleteAssignment(id)
    
    if (!deleted) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Assignment deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting assignment:', error)
    return NextResponse.json(
      { error: 'Failed to delete assignment' },
      { status: 500 }
    )
  }
}