// app/api/open-mic/submit/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createSubmission } from '@/lib/storage/open-mic'
import {
  getNextSessionIso,
  isSessionOpen,
} from '@/lib/open-mic/sessions'
import type { OpenMicSubmitPayload } from '@/types/open-mic'

// ============================================
// HELPERS
// ============================================

function isValidEmail(v: unknown): v is string {
  return typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0
}

function generateConfirmationNumber(): string {
  return `OM-${Date.now().toString(36).toUpperCase()}`
}

// ============================================
// POST — public submission
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { fullName, artistName, genre, instagram, email } =
      body as Partial<OpenMicSubmitPayload>

    // ---- Field validation ----
    if (!isNonEmptyString(fullName)) {
      return NextResponse.json(
        { error: 'Full name is required' },
        { status: 400 }
      )
    }
    if (!isNonEmptyString(artistName)) {
      return NextResponse.json(
        { error: 'Artist name is required' },
        { status: 400 }
      )
    }
    if (!isNonEmptyString(genre)) {
      return NextResponse.json(
        { error: 'Music genre is required' },
        { status: 400 }
      )
    }
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'A valid email is required' },
        { status: 400 }
      )
    }

    // ---- Determine target session ----
    const sessionIso = getNextSessionIso(new Date())
    if (!sessionIso) {
      return NextResponse.json(
        { error: 'Open Mic sessions have not started yet' },
        { status: 400 }
      )
    }

    if (!isSessionOpen(sessionIso, new Date())) {
      return NextResponse.json(
        {
          error:
            'Submissions are closed right now. Sign-ups reopen on Thursday.',
        },
        { status: 400 }
      )
    }

    // ---- Persist ----
    const confirmationNumber = generateConfirmationNumber()
    const submission = await createSubmission(sessionIso, {
      fullName: fullName.trim(),
      artistName: artistName.trim(),
      genre: genre.trim(),
      instagram: instagram?.trim() ? instagram.trim() : undefined,
      email: email.trim().toLowerCase(),
      confirmationNumber,
      addedByAdmin: false,
      submittedAt: new Date().toISOString(),
    })

    // ---- Fire confirmation email (non-blocking) ----
    try {
      await fetch(
        `${request.nextUrl.origin}/api/send-open-mic-email`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName: submission.fullName,
            artistName: submission.artistName,
            genre: submission.genre,
            instagram: submission.instagram,
            email: submission.email,
            sessionDate: sessionIso,
            confirmationNumber: submission.confirmationNumber,
          }),
        }
      )
    } catch {
      // Non-blocking — submission is already saved
    }

    return NextResponse.json({
      success: true,
      id: submission.id,
      sessionDate: sessionIso,
      confirmationNumber: submission.confirmationNumber,
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'DuplicateSubmission') {
      return NextResponse.json({ error: error.message }, { status: 409 })
    }
    console.error('Open Mic submit error:', error)
    return NextResponse.json(
      { error: 'Failed to save submission' },
      { status: 500 }
    )
  }
}