// app/api/big-caf-meetings/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import {
  updateResponse,
  deleteResponse,
} from '@/lib/storage/big-caf-meetings'
import { isAdminAuthenticated } from '@/lib/admin/auth'
import type { BigCafMeetingUpdatePayload } from '@/types/big-caf-meetings'

// ============================================
// PATCH — admin-only, update confirmed / confirmedNote
// ============================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await request.json()

    const updates: BigCafMeetingUpdatePayload = {}

    if (typeof body.confirmed === 'boolean') {
      updates.confirmed = body.confirmed
    }

    if (typeof body.confirmedNote === 'string') {
      updates.confirmedNote = body.confirmedNote
    }

    // Allow clearing the note explicitly with null.
    if (body.confirmedNote === null) {
      updates.confirmedNote = ''
    }

    if (
      updates.confirmed === undefined &&
      updates.confirmedNote === undefined
    ) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    const updated = await updateResponse(id, updates)

    if (!updated) {
      return NextResponse.json(
        { error: 'Response not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, response: updated })
  } catch (error) {
    console.error('Error updating Big Caf meeting response:', error)
    return NextResponse.json(
      { error: 'Failed to update response' },
      { status: 500 }
    )
  }
}

// ============================================
// DELETE — admin-only
// ============================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const deleted = await deleteResponse(id)

    if (!deleted) {
      return NextResponse.json(
        { error: 'Response not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting Big Caf meeting response:', error)
    return NextResponse.json(
      { error: 'Failed to delete response' },
      { status: 500 }
    )
  }
}