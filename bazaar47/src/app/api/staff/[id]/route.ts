// app/api/staff/shifts/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentStaff } from '@/lib/staff/auth'
import { getAssignments } from '@/lib/storage/staff-assignments'
import { getWorkLogByAssignmentId } from '@/lib/storage/staff-worklogs'
import { getAllClaims } from '@/lib/storage/staff-claims'
import { getOfferById } from '@/lib/storage/shift-offers'
import { getEventById } from '@/data/events'

/**
 * Read-only detail payload for one staff assignment.
 *
 * Used by /staff/shifts/[id]. Returns the assignment, the event's
 * display metadata (address, venue details, highlights), the staff
 * member's own work log if one exists, and — when the claim→assignment
 * linkage is intact — the offer the assignment was created from.
 *
 * If the claim linkage is broken (known edge case, see handoff §9),
 * `offer` is null and the page falls back to assignment-derived fields.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const current = await getCurrentStaff({ refresh: false })
  if (!current) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const assignments = await getAssignments()
    const assignment = assignments.find((a) => a.id === id)

    if (!assignment) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      )
    }

    // Ownership gate: a staff member may only read their own assignments.
    if (assignment.staffId !== current.staff.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Event metadata is static, from @/data/events. May be undefined
    // if the assignment points to an event that has since been removed
    // from the data file — the page handles null.
    const event = getEventById(assignment.eventId)

    const [workLog, allClaims] = await Promise.all([
      getWorkLogByAssignmentId(assignment.id),
      getAllClaims(),
    ])

    // Find the claim that created this assignment, then the offer it
    // was claimed against. Both are optional — legacy direct-assigns
    // (pre-Phase-2A) have no claim.
    const claim = allClaims.find((c) => c.assignmentId === assignment.id)
    const offer = claim ? await getOfferById(claim.offerId) : null

    return NextResponse.json({
      assignment,
      event: event
        ? {
            id: event.id,
            name: event.name,
            date: event.date,
            dateDisplay: event.dateDisplay,
            time: event.time,
            location: event.location,
            address: event.address,
            venueDetails: event.venueDetails || null,
            highlights: event.highlights || [],
            type: event.type,
          }
        : null,
      workLog,
      offer,
      claim: claim
        ? {
            id: claim.id,
            status: claim.status,
            lockedRate: claim.lockedRate,
            lockedRole: claim.lockedRole,
            claimedAt: claim.claimedAt,
          }
        : null,
    })
  } catch (err) {
    console.error('[staff/shifts/[id]] failed:', err)
    return NextResponse.json(
      { error: 'Failed to load shift details' },
      { status: 500 }
    )
  }
}