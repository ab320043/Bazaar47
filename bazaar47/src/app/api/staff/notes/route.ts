// app/api/staff/notes/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentStaff } from '@/lib/staff/auth'
import { getNotesForStaff, createNote } from '@/lib/storage/staff-notes'

const MAX_TITLE = 120
const MAX_BODY = 20000

// ============================================
// GET — list own notes
// ============================================

export async function GET() {
  try {
    const current = await getCurrentStaff()
    if (!current) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const notes = await getNotesForStaff(current.staff.id)
    return NextResponse.json({ notes })
  } catch (error) {
    console.error('Error fetching notes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notes' },
      { status: 500 }
    )
  }
}

// ============================================
// POST — create a note
// ============================================

export async function POST(request: NextRequest) {
  try {
    const current = await getCurrentStaff()
    if (!current) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, body: noteBody } = body as {
      title?: unknown
      body?: unknown
    }

    if (typeof title !== 'string' || title.trim() === '') {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    if (title.trim().length > MAX_TITLE) {
      return NextResponse.json(
        { error: `Title must be ${MAX_TITLE} characters or fewer` },
        { status: 400 }
      )
    }

    const safeBody = typeof noteBody === 'string' ? noteBody : ''
    if (safeBody.length > MAX_BODY) {
      return NextResponse.json(
        { error: `Note body must be ${MAX_BODY} characters or fewer` },
        { status: 400 }
      )
    }

    const note = await createNote(current.staff.id, {
      title: title.trim(),
      body: safeBody,
    })

    return NextResponse.json({ success: true, note }, { status: 201 })
  } catch (error) {
    console.error('Error creating note:', error)
    return NextResponse.json(
      { error: 'Failed to create note' },
      { status: 500 }
    )
  }
}