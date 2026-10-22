// app/api/admin/open-mic/sessions/[date]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { saveSession, getSession } from '@/lib/storage/open-mic'
import { isAdminAuthenticated } from '@/lib/admin/auth'
import { isWednesdayIso } from '@/lib/open-mic/dates'
import type { LineupSlot } from '@/types/open-mic'

// ============================================
// VALIDATION
// ============================================

/**
 * A LineupSlot must have every field the rest of the system expects.
 * This guards against a hand-crafted or stale request writing a
 * malformed slot into Redis.
 */
function isValidLineupSlot(raw: unknown): raw is LineupSlot {
  if (typeof raw !== 'object' || raw === null) return false
  const s = raw as Record<string, unknown>

  return (
    typeof s.id === 'string' &&
    typeof s.submissionId === 'string' &&
    typeof s.artistName === 'string' &&
    typeof s.startTime === 'string' &&
    typeof s.durationMinutes === 'number' &&
    Number.isFinite(s.durationMinutes) &&
    s.durationMinutes > 0
  )
}

// ============================================
// PUT — save the lineup for a Wednesday session
// ============================================

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { date } = await params

    // ---- Wednesday guard ----
    // The admin UI only offers Wednesdays, but a script or bookmark
    // could still hit this route. Reject anything that isn't a
    // Wednesday so we never persist a session on a non-Open-Mic day.
    if (!isWednesdayIso(date)) {
      return NextResponse.json(
        {
          error:
            'Open Mic sessions can only be saved on Wednesdays (YYYY-MM-DD).',
        },
        { status: 400 }
      )
    }

    const body = await request.json()
    const rawLineup = body?.lineup

    if (!Array.isArray(rawLineup)) {
      return NextResponse.json(
        { error: 'lineup must be an array' },
        { status: 400 }
      )
    }

    // Validate every slot before touching Redis.
    for (const raw of rawLineup) {
      if (!isValidLineupSlot(raw)) {
        return NextResponse.json(
          { error: 'One or more lineup slots are invalid' },
          { status: 400 }
        )
      }
    }

    const lineup: LineupSlot[] = rawLineup

    const existing = await getSession(date)

    await saveSession({
      id: date,
      date,
      lineup,
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving session:', error)
    return NextResponse.json(
      { error: 'Failed to save session' },
      { status: 500 }
    )
  }
}