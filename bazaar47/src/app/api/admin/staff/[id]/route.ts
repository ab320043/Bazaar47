// app/api/admin/staff/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getStaffById, updateStaff, deleteStaff } from '@/lib/storage/staff'
import { getAssignmentsByStaff } from '@/lib/storage/staff-assignments'
import type { StaffMember, StaffType } from '@/types/staff'

// ============================================
// GET - Get single staff member
// ============================================

export async function GET(
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

    return NextResponse.json({ staff })
  } catch (error) {
    console.error('Error fetching staff:', error)
    return NextResponse.json(
      { error: 'Failed to fetch staff member' },
      { status: 500 }
    )
  }
}

// ============================================
// PUT - Update staff member
// ============================================

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await getStaffById(id)
    if (!existing) {
      return NextResponse.json(
        { error: 'Staff member not found' },
        { status: 404 }
      )
    }

    const updates: Partial<StaffMember> = {}

    if (body.name !== undefined) updates.name = body.name
    if (body.email !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(body.email)) {
        return NextResponse.json(
          { error: 'Invalid email format' },
          { status: 400 }
        )
      }
      updates.email = body.email
    }
    if (body.phone !== undefined) updates.phone = body.phone
    if (body.primaryRole !== undefined) updates.primaryRole = body.primaryRole
    if (body.position !== undefined) updates.position = body.position
    if (body.hourlyRate !== undefined) {
      if (typeof body.hourlyRate !== 'number' || body.hourlyRate < 0) {
        return NextResponse.json(
          { error: 'Hourly rate must be a positive number' },
          { status: 400 }
        )
      }
      updates.hourlyRate = body.hourlyRate
    }
    if (body.nonprofitRate !== undefined) {
      if (typeof body.nonprofitRate !== 'number' || body.nonprofitRate < 0) {
        return NextResponse.json(
          { error: 'Nonprofit rate must be a positive number' },
          { status: 400 }
        )
      }
      updates.nonprofitRate = body.nonprofitRate
    }
    if (body.isActive !== undefined) updates.isActive = body.isActive
    if (body.notes !== undefined) updates.notes = body.notes

    if (body.staffType !== undefined) {
      if (body.staffType !== 'permanent' && body.staffType !== 'temp') {
        return NextResponse.json(
          { error: 'staffType must be "permanent" or "temp"' },
          { status: 400 }
        )
      }
      updates.staffType = body.staffType as StaffType
    }

    const updated = await updateStaff(id, updates)

    return NextResponse.json({
      success: true,
      staff: updated,
    })
  } catch (error) {
    console.error('Error updating staff:', error)
    return NextResponse.json(
      { error: 'Failed to update staff member' },
      { status: 500 }
    )
  }
}

// ============================================
// DELETE - Delete staff member
// ============================================
//
// Deletion is refused if the staff member has any non-cancelled
// assignments. Admin must either cancel/reassign those assignments
// first, or deactivate the staff member instead (set isActive: false).
//
// This protects payroll history and prevents orphaned assignments.

export async function DELETE(
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

    // Gather blocking assignments (any status except 'cancelled')
    const assignments = await getAssignmentsByStaff(id)
    const blocking = assignments.filter(a => a.status !== 'cancelled')

    if (blocking.length > 0) {
      return NextResponse.json(
        {
          error: `${staff.name} has ${blocking.length} active assignment${
            blocking.length === 1 ? '' : 's'
          }. Cancel or reassign them first, or deactivate the staff member instead.`,
          blockingAssignments: blocking.map(a => ({
            id: a.id,
            eventId: a.eventId,
            eventName: a.eventName,
            shiftStart: a.shiftStart,
            status: a.status,
          })),
        },
        { status: 409 }
      )
    }

    const deleted = await deleteStaff(id)

    if (!deleted) {
      return NextResponse.json(
        { error: 'Staff member not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Staff member deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting staff:', error)
    return NextResponse.json(
      { error: 'Failed to delete staff member' },
      { status: 500 }
    )
  }
}