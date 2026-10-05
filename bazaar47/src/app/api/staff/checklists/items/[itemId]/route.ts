// app/api/staff/checklists/items/[itemId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentStaff } from '@/lib/staff/auth'
import {
  updateItem,
  deleteItem,
  getChecklistForStaff,
} from '@/lib/storage/staff-checklists'

const MAX_TITLE = 200
const MAX_DETAIL = 500

function isHttpUrl(v: string): boolean {
  try {
    const url = new URL(v)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

// ============================================
// PATCH
// ============================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await params
    const current = await getCurrentStaff()
    if (!current) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Ownership gate — the item must belong to the logged-in staff's checklist.
    const checklist = await getChecklistForStaff(current.staff.id)
    const existing = checklist.items.find((i) => i.id === itemId)
    if (!existing) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    const body = await request.json()
    const updates: { title?: string; detail?: string; done?: boolean } = {}

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

    if (typeof body.detail === 'string') {
      const trimmed = body.detail.trim()
      if (trimmed.length > MAX_DETAIL) {
        return NextResponse.json(
          { error: `Detail must be ${MAX_DETAIL} characters or fewer` },
          { status: 400 }
        )
      }
      // If it's a link item and detail is being changed, it must be a valid URL
      if (existing.kind === 'link' && trimmed !== '' && !isHttpUrl(trimmed)) {
        return NextResponse.json(
          { error: 'A valid http(s) URL is required for link items' },
          { status: 400 }
        )
      }
      updates.detail = trimmed
    }

    if (typeof body.done === 'boolean') {
      updates.done = body.done
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      )
    }

    const updated = await updateItem(current.staff.id, itemId, updates)
    if (!updated) {
      return NextResponse.json(
        { error: 'Failed to update item' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, item: updated })
  } catch (error) {
    console.error('Error updating checklist item:', error)
    return NextResponse.json(
      { error: 'Failed to update item' },
      { status: 500 }
    )
  }
}

// ============================================
// DELETE
// ============================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await params
    const current = await getCurrentStaff()
    if (!current) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const deleted = await deleteItem(current.staff.id, itemId)
    if (!deleted) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting checklist item:', error)
    return NextResponse.json(
      { error: 'Failed to delete item' },
      { status: 500 }
    )
  }
}