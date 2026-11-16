// app/api/admin/open-mic/route.ts
import { NextRequest, NextResponse } from 'next/server'
import {
  getPool,
  getSubmissionsForSession,
  getUnscheduledSubmissions,
  createSubmission,
  getAllSessions,
} from '@/lib/storage/open-mic'
import { isAdminAuthenticated } from '@/lib/admin/auth'
import { getTargetSessionIso } from '@/lib/open-mic/dates'

export async function GET(request: NextRequest) {
  if (!(await isAdminAuthenticated()))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = request.nextUrl
  const sessionFilter = url.searchParams.get('sessionIso')

  const [pool, sessions] = await Promise.all([
    sessionFilter
      ? getSubmissionsForSession(sessionFilter)
      : getPool(),
    getAllSessions(),
  ])

  const unscheduled = await getUnscheduledSubmissions()

  return NextResponse.json({ pool, sessions, unscheduled })
}

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated()))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()

  if (body.action === 'add_to_pool') {
    const sessionIso: string =
      typeof body.sessionIso === 'string' && body.sessionIso.trim() !== ''
        ? body.sessionIso.trim()
        : getTargetSessionIso() || ''

    if (!sessionIso) {
      return NextResponse.json(
        { error: 'Could not determine a target session' },
        { status: 500 }
      )
    }

    const result = await createSubmission(
      {
        fullName: body.fullName,
        artistName: body.artistName,
        genre: body.genre,
        email: body.email,
        instagram: body.instagram,
        musicLink: body.musicLink,
        submittedAt: new Date().toISOString(),
        addedByAdmin: true,
      },
      sessionIso
    )

    if (result.kind === 'duplicate-week') {
      return NextResponse.json(
        {
          error: `This artist is already signed up for that Wednesday.`,
          submission: result.submission,
        },
        { status: 409 }
      )
    }

    return NextResponse.json({
      success: true,
      submission: result.submission,
      sessionIso,
      appended: result.kind === 'appended',
    })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}