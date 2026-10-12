// app/api/admin/open-mic/route.ts
import { NextRequest, NextResponse } from 'next/server'
import {
  getAllSessionsWithSubmissions,
  createSubmission,
} from '@/lib/storage/open-mic'
import { isAdminAuthenticated } from '@/lib/admin/auth'
import {
  getCurrentSessionIso,
  getNextSessionIso,
  isSessionOpen,
  FIRST_SESSION_ISO,
  fromIsoLocal,
  toIsoLocal,
} from '@/lib/open-mic/sessions'
import type { OpenMicAdminCreatePayload } from '@/types/open-mic'

// ============================================
// HELPERS
// ============================================

function isValidEmail(v: unknown): v is string {
  return typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0
}

function isWednesday(iso: string): boolean {
  const d = fromIsoLocal(iso)
  if (!d) return false
  return d.getDay() === 3
}

function normalizeOptionalUrl(v: unknown): string | undefined {
  if (typeof v !== 'string' || v.trim() === '') return undefined
  const trimmed = v.trim()
  try {
    const url = new URL(trimmed)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return undefined
    return trimmed
  } catch {
    return undefined
  }
}

/**
 * Merge every session from FIRST_SESSION up through the current week
 * with the stored submissions. Sessions with no submissions still
 * appear. Handles the pre-launch case (before the first session) by
 * including the first session.
 */
function buildFullSessionList(
  stored: Record<string, { id: string; sessionDate: string; submittedAt: string; fullName: string; artistName: string; genre: string; musicLink?: string; instagram?: string; email: string; confirmationNumber: string; addedByAdmin?: boolean; createdAt: string; updatedAt: string }[]>
): string[] {
  const first = fromIsoLocal(FIRST_SESSION_ISO)
  if (!first) return []

  const current = getCurrentSessionIso(new Date())
  if (!current) return []

  const currentDate = fromIsoLocal(current)
  if (!currentDate) return []

  const set = new Set<string>()
  const cursor = new Date(first)

  const endDate =
    currentDate.getTime() < first.getTime() ? first : currentDate

  while (cursor.getTime() <= endDate.getTime()) {
    set.add(toIsoLocal(cursor))
    cursor.setDate(cursor.getDate() + 7)
  }

  for (const iso of Object.keys(stored)) {
    set.add(iso)
  }

  return Array.from(set).sort()
}

// ============================================
// GET — full session list with submissions
// ============================================

export async function GET(_request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const stored = await getAllSessionsWithSubmissions()
    const sessionDates = buildFullSessionList(stored)

    const currentIso = getCurrentSessionIso(new Date())
    const nextIso = getNextSessionIso(new Date())

    const sessions = sessionDates.map((sessionDate) => {
      const submissions = stored[sessionDate] || []
      const windowOpen = isSessionOpen(sessionDate, new Date())

      const d = fromIsoLocal(sessionDate)
      const today = new Date()
      const todayMidnight = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      )
      const isPast = d ? d.getTime() < todayMidnight.getTime() : false
      const isToday = d ? d.getTime() === todayMidnight.getTime() : false

      return {
        sessionDate,
        submissions,
        isOpen: windowOpen,
        isToday,
        isPast,
      }
    })

    return NextResponse.json({
      sessions,
      currentSessionIso: currentIso,
      nextSessionIso: nextIso,
      totalSubmissions: sessions.reduce(
        (sum, s) => sum + s.submissions.length,
        0
      ),
    })
  } catch (error) {
    console.error('Error fetching Open Mic sessions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Open Mic sessions' },
      { status: 500 }
    )
  }
}

// ============================================
// POST — admin adds a submission retroactively
// ============================================

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const {
      sessionDate,
      fullName,
      artistName,
      genre,
      musicLink,
      instagram,
      email,
      sendConfirmation,
    } = body as Partial<OpenMicAdminCreatePayload>

    if (!isNonEmptyString(sessionDate) || !isWednesday(sessionDate)) {
      return NextResponse.json(
        { error: 'sessionDate must be a valid Wednesday (YYYY-MM-DD)' },
        { status: 400 }
      )
    }
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
        { error: 'Genre is required' },
        { status: 400 }
      )
    }
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'A valid email is required' },
        { status: 400 }
      )
    }

    const confirmationNumber = `OM-${Date.now().toString(36).toUpperCase()}`

    const submission = await createSubmission(sessionDate, {
      fullName: fullName.trim(),
      artistName: artistName.trim(),
      genre: genre.trim(),
      musicLink: normalizeOptionalUrl(musicLink),
      instagram: instagram?.trim() || undefined,
      email: email.trim().toLowerCase(),
      confirmationNumber,
      addedByAdmin: true,
      submittedAt: new Date().toISOString(),
    })

    if (sendConfirmation) {
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
              musicLink: submission.musicLink,
              instagram: submission.instagram,
              email: submission.email,
              sessionDate,
              confirmationNumber: submission.confirmationNumber,
            }),
          }
        )
      } catch {
        // non-blocking
      }
    }

    return NextResponse.json({ success: true, submission })
  } catch (error) {
    if (error instanceof Error && error.name === 'DuplicateSubmission') {
      return NextResponse.json({ error: error.message }, { status: 409 })
    }
    console.error('Open Mic admin create error:', error)
    return NextResponse.json(
      { error: 'Failed to create submission' },
      { status: 500 }
    )
  }
}