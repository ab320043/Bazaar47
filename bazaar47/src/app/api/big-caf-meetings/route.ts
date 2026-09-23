// app/api/big-caf-meetings/route.ts
import { NextRequest, NextResponse } from 'next/server'
import {
  getResponses,
  upsertResponseByEmail,
} from '@/lib/storage/big-caf-meetings'
import { isMeetingDayIso } from '@/lib/big-caf-meetings/dates'
import { isAdminAuthenticated } from '@/lib/admin/auth'
import type {
  BigCafMeetingSubmitPayload,
  BigCafAvailabilityEntry,
} from '@/types/big-caf-meetings'

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

/**
 * Validate a raw availability entry from the request body.
 * Returns the normalized entry, or null if invalid.
 *
 * Rules:
 *   - entry must be an object
 *   - entry.date must be a string and a valid meeting day in the window
 *   - entry.timeWindow must be a string (may be empty — means "anytime")
 */
function validateAvailabilityEntry(
  raw: unknown
): BigCafAvailabilityEntry | null {
  if (typeof raw !== 'object' || raw === null) return null

  const entry = raw as { date?: unknown; timeWindow?: unknown }

  if (typeof entry.date !== 'string') return null
  if (!isMeetingDayIso(entry.date)) return null

  if (entry.timeWindow === undefined) {
    return { date: entry.date, timeWindow: '' }
  }

  if (typeof entry.timeWindow !== 'string') return null

  return {
    date: entry.date,
    timeWindow: entry.timeWindow.trim(),
  }
}

// ============================================
// POST — public submission (create or upsert by email)
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { fullName, email, phone, availability } = body as {
      fullName?: unknown
      email?: unknown
      phone?: unknown
      availability?: unknown
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

    // ---- availability validation ----
    if (!Array.isArray(availability) || availability.length === 0) {
      return NextResponse.json(
        { error: 'Please select at least one day' },
        { status: 400 }
      )
    }

    const cleaned: BigCafAvailabilityEntry[] = []
    for (const raw of availability) {
      const entry = validateAvailabilityEntry(raw)
      if (!entry) {
        return NextResponse.json(
          { error: 'One or more selected days are invalid' },
          { status: 400 }
        )
      }
      cleaned.push(entry)
    }

    // De-dupe by date. If a duplicate arrives, the last one wins
    // (defensive — the UI shouldn't send duplicates).
    const byDate = new Map<string, BigCafAvailabilityEntry>()
    for (const e of cleaned) byDate.set(e.date, e)
    const unique = Array.from(byDate.values())

    const payload: BigCafMeetingSubmitPayload = {
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      availability: unique,
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
    // Most-recently-updated first.
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