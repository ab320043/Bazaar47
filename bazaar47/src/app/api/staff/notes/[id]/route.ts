// app/api/staff/notes/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentStaff } from '@/lib/staff/auth'
import {
  getNoteById,
  updateNote,
  deleteNote,
} from '@/lib/storage/staff-notes'

const MAX_TITLE = 120
const MAX_BODY = 20000

// ============================================
// GET
// ============================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const current = await getCurrentStaff()
    if (!current) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const note = await getNoteById(current.staff.id, id)
    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 })
    }

    return NextResponse.json({ note })
  } catch (error) {
    console.error('Error fetching note:', error)
    return NextResponse.json(
      { error: 'Failed to fetch note' },
      { status: 500 }
    )
  }
}

// ============================================
// PATCH
// ============================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const current = await getCurrentStaff()
    if (!current) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Ownership check — the note must belong to the logged-in staff.
    const existing = await getNoteById(current.staff.id, id)
    if (!existing) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 })
    }

    const body = await request.json()
    const updates: { title?: string; body?: string } = {}

    if (typeof body.title === 'string') {
      const trimmed = body.title.trim()
      if (trimmed === '') {
        return NextResponse.json(
          { error: 'Title cannot be empty' },
          { status: 400 }
        )
      }
      if (trimmed.length > MAX_TITLE) {
        return NextResponse.json(
          { error: `Title must be ${MAX_TITLE} characters or fewer` },
          { status: 400 }
        )
      }
      updates.title = trimmed
    }

    if (typeof body.body === 'string') {
      if (body.body.length > MAX_BODY) {
        return NextResponse.json(
          { error: `Note body must be ${MAX_BODY} characters or fewer` },
          { status: 400 }
        )
      }
      updates.body = body.body
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      )
    }

    const updated = await updateNote(current.staff.id, id, updates)
    if (!updated) {
      return NextResponse.json(
        { error: 'Failed to update note' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, note: updated })
  } catch (error) {
    console.error('Error updating note:', error)
    return NextResponse.json(
      { error: 'Failed to update note' },
      { status: 500 }
    )
  }
}

// ============================================
// DELETE
// ============================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const current = await getCurrentStaff()
    if (!current) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const deleted = await deleteNote(current.staff.id, id)
    if (!deleted) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting note:', error)
    return NextResponse.json(
      { error: 'Failed to delete note' },
      { status: 500 }
    )
  }
}