// app/api/admin/open-mic/[id]/assign-session/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin/auth'
import { assignSubmissionToSession } from '@/lib/storage/open-mic'

/**
 * Attach a session date to a legacy pool submission that predates
 * per-week signups. Idempotent: assigning the same week twice is a
 * no-op and returns 200.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  let body: { sessionIso?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const sessionIso = body.sessionIso
  if (typeof sessionIso !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(sessionIso)) {
    return NextResponse.json(
      { error: 'sessionIso must be YYYY-MM-DD' },
      { status: 400 }
    )
  }

  try {
    const updated = await assignSubmissionToSession(id, sessionIso)
    if (!updated) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      )
    }
    return NextResponse.json({ success: true, submission: updated })
  } catch (err) {
    console.error('[assign-session] failed:', err)
    return NextResponse.json(
      { error: 'Failed to assign session' },
      { status: 500 }
    )
  }
}