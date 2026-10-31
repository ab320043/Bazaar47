// app/api/admin/worklogs/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin/auth'
import {
  getWorkLogById,
  updateWorkLog,
} from '@/lib/storage/staff-worklogs'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const workLog = await getWorkLogById(id)
  if (!workLog) {
    return NextResponse.json({ error: 'Work log not found' }, { status: 404 })
  }
  return NextResponse.json({ workLog })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  // ---- Validate ----
  const reason = typeof body.reason === 'string' ? body.reason.trim() : ''
  if (reason === '') {
    return NextResponse.json(
      { error: 'A reason is required for every edit' },
      { status: 400 }
    )
  }

  const updates: Parameters<typeof updateWorkLog>[1] = {
    editedBy: 'admin',
    editReason: reason,
  }

  if (body.hoursWorked !== undefined) {
    if (typeof body.hoursWorked !== 'number' || body.hoursWorked < 0) {
      return NextResponse.json(
        { error: 'hoursWorked must be a non-negative number' },
        { status: 400 }
      )
    }
    updates.hoursWorked = body.hoursWorked
  }

  if (body.checkOutTime !== undefined) {
    if (typeof body.checkOutTime !== 'string') {
      return NextResponse.json(
        { error: 'checkOutTime must be an ISO string' },
        { status: 400 }
      )
    }
    updates.checkOutTime = body.checkOutTime
  }

  if (body.breakStart !== undefined) {
    updates.breakStart =
      body.breakStart === null ? null : String(body.breakStart)
  }
  if (body.breakEnd !== undefined) {
    updates.breakEnd = body.breakEnd === null ? null : String(body.breakEnd)
  }

  // Only set needsReview false if the caller asks; otherwise leave it.
  if (body.markReviewed === true) {
    updates.needsReview = false
    updates.resolution = 'admin-edit'
  }

  if (body.markReviewed === false) {
    updates.needsReview = true
  }

  try {
    const updated = await updateWorkLog(id, updates)
    if (!updated) {
      return NextResponse.json(
        { error: 'Work log not found' },
        { status: 404 }
      )
    }
    return NextResponse.json({ success: true, workLog: updated })
  } catch (error) {
    console.error('Error updating work log:', error)
    return NextResponse.json(
      { error: 'Failed to update work log' },
      { status: 500 }
    )
  }
}