// app/api/admin/open-mic/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import {
  updatePoolSubmission,
  deleteSubmission,
} from '@/lib/storage/open-mic'
import { isAdminAuthenticated } from '@/lib/admin/auth'

// ============================================
// HELPERS
// ============================================

function normalizeOptionalUrl(v: unknown): string | undefined | null {
  // null signals "explicitly clear this field"
  if (v === null || v === '') return null
  if (typeof v !== 'string') return undefined

  const trimmed = v.trim()
  if (trimmed === '') return null

  try {
    const url = new URL(trimmed)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return undefined
    return trimmed
  } catch {
    return undefined
  }
}

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
      musicLink?: string
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
    if ('musicLink' in body) {
      const normalized = normalizeOptionalUrl(body.musicLink)
      if (normalized === null) {
        // Explicit clear
        updates.musicLink = ''
      } else if (normalized !== undefined) {
        updates.musicLink = normalized
      }
      // If invalid (undefined), silently ignore
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