// app/api/admin/staff/assignments/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { 
  getAssignments, 
  updateAssignment, 
  deleteAssignment 
} from '@/lib/storage/staff-assignments'
import { STAFF_ROLES } from '@/data/staff-roles'
import type { StaffAssignment, StaffRole } from '@/types/staff'

// ============================================
// HELPERS
// ============================================

function isStaffRole(v: unknown): v is StaffRole {
  return typeof v === 'string' && STAFF_ROLES.some((r) => r.id === v)
}

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
    
    const assignments = await getAssignments()
    const existing = assignments.find(a => a.id === id)
    if (!existing) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      )
    }
    
    const updates: Partial<StaffAssignment> = {}
    
    if (body.status) updates.status = body.status
    if (body.shiftStart) updates.shiftStart = body.shiftStart
    if (body.shiftEnd) updates.shiftEnd = body.shiftEnd
    if (body.hourlyRate !== undefined) updates.hourlyRate = body.hourlyRate
    if (body.hoursWorked !== undefined) updates.hoursWorked = body.hoursWorked
    if (body.checkInTime !== undefined) updates.checkInTime = body.checkInTime
    if (body.checkOutTime !== undefined) updates.checkOutTime = body.checkOutTime
    if (body.breakStart !== undefined) updates.breakStart = body.breakStart
    if (body.breakEnd !== undefined) updates.breakEnd = body.breakEnd
    if (body.notes !== undefined) updates.notes = body.notes
    if (body.responsibilities) updates.responsibilities = body.responsibilities
    if (body.position) updates.position = body.position
    
    // Roles: accept new array shape, or legacy singular
    if (Array.isArray(body.roles)) {
      const filtered = body.roles.filter(isStaffRole)
      if (filtered.length === 0) {
        return NextResponse.json(
          { error: 'At least one valid role is required' },
          { status: 400 }
        )
      }
      updates.roles = Array.from(new Set(filtered))
    } else if (isStaffRole(body.role)) {
      updates.roles = [body.role]
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