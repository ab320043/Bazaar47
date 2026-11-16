// app/api/admin/events/coverage-summaries/route.ts
import { NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin/auth'
import { getAllEventsCoverageSummaries } from '@/lib/staff/offer-actions'

/**
 * Returns a map of eventId → coverage summary for every event that has
 * at least one active (non-draft, non-cancelled) offer.
 *
 * Used by the admin dashboard to render per-event badges like
 * "3 of 5 staffed" / "⚠️ Needs 2 more" without an N+1 fetch per card.
 *
 * Events with no offers are omitted — the dashboard treats a missing
 * key as "no staffing configured yet" and renders no badge.
 */
export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const map = await getAllEventsCoverageSummaries()
    // Map is not JSON-serializable directly — flatten to a plain object.
    const summaries: Record<
      string,
      {
        totalOffers: number
        totalSlotsNeeded: number
        totalSlotsFilled: number
        totalSlotsPending: number
        isFullyStaffed: boolean
      }
    > = {}
    for (const [eventId, s] of map) {
      summaries[eventId] = {
        totalOffers: s.totalOffers,
        totalSlotsNeeded: s.totalSlotsNeeded,
        totalSlotsFilled: s.totalSlotsFilled,
        totalSlotsPending: s.totalSlotsPending,
        isFullyStaffed: s.isFullyStaffed,
      }
    }
    return NextResponse.json({ summaries })
  } catch (err) {
    console.error('[coverage-summaries] failed:', err)
    return NextResponse.json(
      { error: 'Failed to load coverage summaries' },
      { status: 500 }
    )
  }
}