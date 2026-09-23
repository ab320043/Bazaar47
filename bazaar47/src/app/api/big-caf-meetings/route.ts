// app/api/big-caf-meetings/route.ts
import { NextRequest, NextResponse } from 'next/server'
import {
  getResponses,
  upsertResponseByEmail,
} from '@/lib/storage/big-caf-meetings'
import { isMeetingDayIso } from '@/lib/big-caf-meetings/dates'
import { isAdminAuthenticated } from '@/lib/admin/auth'
import type { BigCafMeetingSubmitPayload } from '@/types/big-caf-meetings'

// ============================================
// HELPERS
// ============================================

function isValidEmail(email: unknown): email is string {
  return (
    typeof email === 'string' &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  )
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0
}

// ============================================
// POST — public submission (create or upsert by email)
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { fullName, email, phone, selectedDays } = body as {
      fullName?: unknown
      email?: unknown
      phone?: unknown
      selectedDays?: unknown
    }

    // ---- Field validation ----
    if (!isNonEmptyString(fullName)) {
      return NextResponse.json(
        { error: 'Full name is required' },
        { status: 400 }
      )
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'A valid email is required' },
        { status: 400 }
      )
    }

    if (!isNonEmptyString(phone)) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      )
    }

    // ---- selectedDays validation ----
    if (!Array.isArray(selectedDays) || selectedDays.length === 0) {
      return NextResponse.json(
        { error: 'Please select at least one day' },
        { status: 400 }
      )
    }

    // Every entry must be a string and a valid meeting day.
    // This prevents someone from POSTing arbitrary dates or dates
    // outside the window (including past dates).
    const cleanedDays: string[] = []
    for (const day of selectedDays) {
      if (typeof day !== 'string') {
        return NextResponse.json(
          { error: 'Invalid date in selection' },
          { status: 400 }
        )
      }
      if (!isMeetingDayIso(day)) {
        return NextResponse.json(
          { error: `"${day}" is not an available meeting day` },
          { status: 400 }
        )
      }
      cleanedDays.push(day)
    }

    // De-dupe in case the client sent duplicates (defensive — the UI
    // shouldn't, but nothing stops a hand-crafted POST).
    const uniqueDays = Array.from(new Set(cleanedDays))

    const payload: BigCafMeetingSubmitPayload = {
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      selectedDays: uniqueDays,
    }

    const saved = await upsertResponseByEmail(payload)

    return NextResponse.json({
      success: true,
      id: saved.id,
      message: 'Availability saved. We will reach out to schedule.',
    })
  } catch (error) {
    console.error('Error saving Big Caf meeting response:', error)
    return NextResponse.json(
      { error: 'Failed to save availability' },
      { status: 500 }
    )
  }
}

// ============================================
// GET — admin-only, list all responses
// ============================================

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const responses = await getResponses()
    // Sort: most-recently-updated first, so newly submitted or changed
    // responses float to the top of the admin list.
    responses.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
    return NextResponse.json({ responses, count: responses.length })
  } catch (error) {
    console.error('Error fetching Big Caf meeting responses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch responses' },
      { status: 500 }
    )
  }
}