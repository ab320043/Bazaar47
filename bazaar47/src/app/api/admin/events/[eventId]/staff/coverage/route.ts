// app/api/admin/events/[eventId]/staff/coverage/route.ts
//
// Returns the full Design X coverage board payload for one event.
// Combines offers, claims, and (for legacy rows) assignments.

import { NextRequest, NextResponse } from 'next/server'
import { getEventById } from '@/data/events'
import { isAdminAuthenticated } from '@/lib/admin/auth'
import { getCoverageForEvent } from '@/lib/staff/offer-actions'
import { getAssignmentsByEvent } from '@/lib/storage/staff-assignments'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { eventId } = await params

    const event = getEventById(eventId)
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    const [coverage, assignments] = await Promise.all([
      getCoverageForEvent(
        eventId,
        event.name,
        event.dateDisplay || event.date
      ),
      getAssignmentsByEvent(eventId),
    ])

    // Identify assignments that don't have a corresponding offer/claim
    // — these are "legacy" pre-Phase-2A direct assigns. The UI shows
    // them in a separate "Legacy assignments" section so the admin
    // can see who was assigned before offers existed.
    const offers = coverage.roles.flatMap((r) => r.offers.map((o) => o.offer))
    const claimAssignmentIds = new Set<string>()
    for (const r of coverage.roles) {
      for (const offerWithClaims of r.offers) {
        // Find the claim → assignment link
        for (const claim of offerWithClaims.claims) {
          if (claim.status === 'confirmed' || claim.status === 'checked-in'
              || claim.status === 'completed' || claim.status === 'auto-closed') {
            // We don't have the assignmentId directly on the summary,
            // so we infer by staff match + shift time match below.
          }
        }
      }
    }

    // Simpler heuristic: any assignment whose (staffId, shiftStart)
    // pair doesn't match any confirmed claim is "legacy".
    const confirmedClaimSignatures = new Set<string>()
    for (const r of coverage.roles) {
      for (const offerWithClaims of r.offers) {
        for (const claim of offerWithClaims.claims) {
          if (
            claim.status === 'confirmed' ||
            claim.status === 'checked-in' ||
            claim.status === 'checked-out' ||
            claim.status === 'completed' ||
            claim.status === 'auto-closed'
          ) {
            confirmedClaimSignatures.add(
              `${claim.staffId}|${offerWithClaims.offer.shiftStart}`
            )
          }
        }
      }
    }

    const legacyAssignments = assignments.filter(
      (a) =>
        a.status !== 'cancelled' &&
        !confirmedClaimSignatures.has(`${a.staffId}|${a.shiftStart}`)
    )

    return NextResponse.json({
      event: {
        id: event.id,
        name: event.name,
        date: event.date,
        dateDisplay: event.dateDisplay,
        location: event.location,
        type: event.type,
        status: event.status,
      },
      coverage,
      legacyAssignments,
    })
  } catch (error) {
    console.error('Coverage fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch coverage' },
      { status: 500 }
    )
  }
}