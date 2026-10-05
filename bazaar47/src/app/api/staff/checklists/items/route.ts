// app/api/staff/checklists/items/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentStaff } from '@/lib/staff/auth'
import { createItem } from '@/lib/storage/staff-checklists'
import type { ChecklistItemKind } from '@/types/staff'

const MAX_TITLE = 200
const MAX_DETAIL = 500

function isValidKind(v: unknown): v is ChecklistItemKind {
  return v === 'text' || v === 'link'
}

function isHttpUrl(v: string): boolean {
  try {
    const url = new URL(v)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    const current = await getCurrentStaff()
    if (!current) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { kind, title, detail } = body as {
      kind?: unknown
      title?: unknown
      detail?: unknown
    }

    if (!isValidKind(kind)) {
      return NextResponse.json(
        { error: 'Kind must be "text" or "link"' },
        { status: 400 }
      )
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

    const safeDetail = typeof detail === 'string' ? detail.trim() : ''

    if (safeDetail.length > MAX_DETAIL) {
      return NextResponse.json(
        { error: `Detail must be ${MAX_DETAIL} characters or fewer` },
        { status: 400 }
      )
    }

    if (kind === 'link') {
      if (safeDetail === '' || !isHttpUrl(safeDetail)) {
        return NextResponse.json(
          { error: 'A valid http(s) URL is required for link items' },
          { status: 400 }
        )
      }
    }

    const item = await createItem(current.staff.id, {
      kind,
      title: title.trim(),
      detail: safeDetail || undefined,
    })

    return NextResponse.json({ success: true, item }, { status: 201 })
  } catch (error) {
    console.error('Error creating checklist item:', error)
    return NextResponse.json(
      { error: 'Failed to create item' },
      { status: 500 }
    )
  }
}