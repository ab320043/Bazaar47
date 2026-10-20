// app/api/staff/assignments/[id]/staff-note/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getStaffSession } from '@/lib/staff/auth'
import {
  getAssignments,
  updateAssignment,
} from '@/lib/storage/staff-assignments'

const MAX_STAFF_NOTE_LENGTH = 500

export async function PATCH(
  request: NextRequest,
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

    const assignments = await getAssignments()
    const assignment = assignments.find((a) => a.id === id)
    if (!assignment) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      )
    }

    if (assignment.staffId !== session.staffId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const rawNote = body?.staffNote

    if (typeof rawNote !== 'string') {
      return NextResponse.json(
        { error: 'staffNote must be a string' },
        { status: 400 }
      )
    }

    const trimmed = rawNote.trim()
    if (trimmed.length > MAX_STAFF_NOTE_LENGTH) {
      return NextResponse.json(
        {
          error: `Note must be ${MAX_STAFF_NOTE_LENGTH} characters or fewer`,
        },
        { status: 400 }
      )
    }

    const updated = await updateAssignment(id, { staffNote: trimmed })
    if (!updated) {
      return NextResponse.json(
        { error: 'Failed to update note' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, staffNote: updated.staffNote })
  } catch (error) {
    console.error('Error updating staff note:', error)
    return NextResponse.json(
      { error: 'Failed to update note' },
      { status: 500 }
    )
  }
}