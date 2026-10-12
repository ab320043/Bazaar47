// app/api/admin/open-mic/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import {
  updateSubmission,
  deleteSubmission,
} from '@/lib/storage/open-mic'
import { isAdminAuthenticated } from '@/lib/admin/auth'

// ============================================
// PATCH — edit a submission
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

    const updates: {
      fullName?: string
      artistName?: string
      genre?: string
      instagram?: string
      email?: string
    } = {}

    if (typeof body.fullName === 'string' && body.fullName.trim()) {
      updates.fullName = body.fullName.trim()
    }
    if (typeof body.artistName === 'string' && body.artistName.trim()) {
      updates.artistName = body.artistName.trim()
    }
    if (typeof body.genre === 'string' && body.genre.trim()) {
      updates.genre = body.genre.trim()
    }
    if (typeof body.instagram === 'string') {
      updates.instagram = body.instagram.trim()
    }
    if (typeof body.email === 'string' && body.email.trim()) {
      updates.email = body.email.trim().toLowerCase()
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      )
    }

    const updated = await updateSubmission(id, updates)
    if (!updated) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, submission: updated })
  } catch (error) {
    console.error('Open Mic update error:', error)
    return NextResponse.json(
      { error: 'Failed to update submission' },
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
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const deleted = await deleteSubmission(id)
    if (!deleted) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      )
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Open Mic delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete submission' },
      { status: 500 }
    )
  }
}