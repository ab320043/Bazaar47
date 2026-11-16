// app/api/open-mic/submit/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createSubmission } from '@/lib/storage/open-mic'
import { isSubmissionWindowOpen } from '@/lib/open-mic/window'
import { getTargetSessionIso } from '@/lib/open-mic/dates'
import type { OpenMicSubmitPayload } from '@/types/open-mic'

function isValidEmail(v: unknown): v is string {
  return typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0
}

function normalizeOptionalUrl(v: unknown): string | undefined {
  if (typeof v !== 'string' || v.trim() === '') return undefined
  try {
    const url = new URL(v.trim())
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return undefined
    return v.trim()
  } catch {
    return undefined
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isSubmissionWindowOpen()) {
      return NextResponse.json(
        {
          error:
            'Submissions are currently closed. The form reopens Thursday at midnight.',
        },
        { status: 403 }
      )
    }

    // Every submission targets the coming Wednesday. The submission
    // window (Thu–Tue) guarantees this is the Wednesday the artist is
    // signing up for.
    const sessionIso = getTargetSessionIso()
    if (!sessionIso) {
      return NextResponse.json(
        { error: 'Could not determine target session. Please try again.' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { fullName, artistName, genre, musicLink, instagram, email } =
      body as Partial<OpenMicSubmitPayload>

    if (!isNonEmptyString(fullName))
      return NextResponse.json({ error: 'Full name is required' }, { status: 400 })
    if (!isNonEmptyString(artistName))
      return NextResponse.json({ error: 'Artist name is required' }, { status: 400 })
    if (!isNonEmptyString(genre))
      return NextResponse.json({ error: 'Music genre is required' }, { status: 400 })
    if (!isValidEmail(email))
      return NextResponse.json({ error: 'A valid email is required' }, { status: 400 })

    const result = await createSubmission(
      {
        fullName: fullName.trim(),
        artistName: artistName.trim(),
        genre: genre.trim(),
        musicLink: normalizeOptionalUrl(musicLink),
        instagram: instagram?.trim() ? instagram.trim() : undefined,
        email: email.trim().toLowerCase(),
        submittedAt: new Date().toISOString(),
        addedByAdmin: false,
      },
      sessionIso
    )

    if (result.kind === 'duplicate-week') {
      return NextResponse.json(
        {
          error: `You're already signed up for ${formatDateForMessage(sessionIso)}. If you need to change your details, reach out to us directly.`,
          sessionIso,
        },
        { status: 409 }
      )
    }

    const submission = result.submission

    // Fire confirmation email (non-blocking)
    try {
      await fetch(`${request.nextUrl.origin}/api/send-open-mic-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: submission.fullName,
          artistName: submission.artistName,
          genre: submission.genre,
          musicLink: submission.musicLink,
          instagram: submission.instagram,
          email: submission.email,
          sessionIso,
        }),
      })
    } catch {}

    return NextResponse.json({
      success: true,
      id: submission.id,
      sessionIso,
      appended: result.kind === 'appended',
    })
  } catch (error) {
    console.error('Open Mic submit error:', error)
    return NextResponse.json(
      { error: 'Failed to save submission' },
      { status: 500 }
    )
  }
}

function formatDateForMessage(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(y, (m || 1) - 1, d || 1)
  return dt.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}