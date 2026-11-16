// lib/staff/offer-actions.ts
import {
  getAllOffers,
  getOfferById,
  getOffersForEvent,
  createOffer,
  updateOffer,
  cancelOffer,
  recomputeOfferSlotsFilled,
} from '@/lib/storage/shift-offers'
import {
  getAllClaims,
  getClaimsForOffer,
  countConfirmedClaimsForOffer,
  updateClaim,
} from '@/lib/storage/staff-claims'
import { getAssignments, saveAssignments } from '@/lib/storage/staff-assignments'
import type {
  ShiftOffer,
  ShiftOfferCreatePayload,
  ShiftOfferUpdatePayload,
  EventCoverage,
  RoleCoverage,
  OfferWithClaims,
} from '@/types/shift-offer'
import type { ClaimReleaseReason, ShiftClaim } from '@/types/staff-claim'
import { claimIsActive, claimOccupiesSlot } from '@/types/staff-claim'
import type { StaffMember, StaffAssignment } from '@/types/staff'
import { STAFF_ROLES } from '@/data/staff-roles'

// ============================================
// ELIGIBILITY
// ============================================

export function staffCanClaimOffer(
  staff: StaffMember,
  offer: ShiftOffer
): boolean {
  const rule = offer.whoCanClaim
  if (rule === 'all') return true
  if (rule === 'permanent') return staff.staffType === 'permanent'
  if (rule.startsWith('role:')) {
    return staff.primaryRole === rule.slice(5)
  }
  if (rule.startsWith('staff:')) {
    const ids = rule.slice(6).split(',').filter(Boolean)
    return ids.includes(staff.id)
  }
  return false
}

// ============================================
// COVERAGE
// ============================================

/**
 * Build a per-role coverage view for one event.
 *
 * Groups offers by role. For each offer, counts confirmed claims
 * (occupying slots) and pending/waitlisted claims (awaiting admin or
 * staff action). `isFullyStaffed` is true only when every offer has
 * zero pending/waitlisted claims AND `slotsFilled === slotsNeeded`.
 */
export async function getCoverageForEvent(
  eventId: string,
  eventName: string,
  eventDate: string
): Promise<EventCoverage> {
  const offers = await getOffersForEvent(eventId)
  const allClaims = await getAllClaims()

  const claimsByOffer = new Map<string, ShiftClaim[]>()
  for (const c of allClaims) {
    if (!claimsByOffer.has(c.offerId)) claimsByOffer.set(c.offerId, [])
    claimsByOffer.get(c.offerId)!.push(c)
  }

  // Group by role.
  const byRole = new Map<string, RoleCoverage>()

  for (const offer of offers) {
    // Skip cancelled offers from the coverage board. Draft offers
    // (unpublished) also don't count as coverage.
    if (offer.status === 'cancelled') continue

    const role = offer.role
    if (!byRole.has(role)) {
      byRole.set(role, {
        role,
        offers: [],
        totalSlotsNeeded: 0,
        totalSlotsFilled: 0,
        totalSlotsPending: 0,
        isFullyStaffed: false,
      })
    }
    const group = byRole.get(role)!
    const claims = claimsByOffer.get(offer.id) || []

    const confirmed = claims.filter((c) => claimOccupiesSlot(c.status))
    const pending = claims.filter(
      (c) => c.status === 'pending' || c.status === 'waitlisted'
    )

    const withClaims: OfferWithClaims = {
      offer,
      claims: claims
        .filter((c) => claimIsActive(c.status))
        .sort(
          (a, b) =>
            new Date(a.claimedAt).getTime() - new Date(b.claimedAt).getTime()
        )
        .map((c) => ({
          claimId: c.id,
          staffId: c.staffId,
          staffName: c.staffName,
          status: c.status,
          claimedAt: c.claimedAt,
        })),
    }

    group.offers.push(withClaims)
    group.totalSlotsNeeded += offer.slotsNeeded
    group.totalSlotsFilled += confirmed.length
    group.totalSlotsPending += pending.length
  }

  // Compute isFullyStaffed on each role group.
  for (const group of byRole.values()) {
    group.offers.sort(
      (a, b) =>
        new Date(a.offer.shiftStart).getTime() -
        new Date(b.offer.shiftStart).getTime()
    )
    group.isFullyStaffed =
      group.totalSlotsFilled === group.totalSlotsNeeded &&
      group.totalSlotsPending === 0
  }

  // Sort roles by canonical order from STAFF_ROLES.
  const roles = Array.from(byRole.values()).sort((a, b) => {
    const idxA = STAFF_ROLES.findIndex((r) => r.id === a.role)
    const idxB = STAFF_ROLES.findIndex((r) => r.id === b.role)
    return idxA - idxB
  })

  const isFullyStaffed =
    roles.length > 0 && roles.every((r) => r.isFullyStaffed)

  return {
    eventId,
    eventName,
    eventDate,
    roles,
    isFullyStaffed,
  }
}

// ============================================
// PUBLISH / UPDATE / CANCEL
// ============================================

export async function publishOffer(
  payload: ShiftOfferCreatePayload,
  createdBy: string
): Promise<ShiftOffer> {
  const startMs = new Date(payload.shiftStart).getTime()
  const endMs = new Date(payload.shiftEnd).getTime()

  if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) {
    throw new Error('Invalid shift times')
  }
  if (endMs <= startMs) {
    throw new Error('Shift end must be after start')
  }
  if (payload.slotsNeeded < 1) {
    throw new Error('At least one slot is required')
  }
  if (payload.hourlyRate <= 0) {
    throw new Error('Hourly rate must be greater than zero')
  }

  return createOffer(payload, createdBy)
}

/**
 * Update an offer. Refuses to reduce `slotsNeeded` below the current
 * number of confirmed claims — that would leave the offer in a state
 * where it says "2 of 1 filled".
 */
export async function updateOfferSafely(
  id: string,
  updates: ShiftOfferUpdatePayload
): Promise<ShiftOffer | undefined> {
  const existing = await getOfferById(id)
  if (!existing) return undefined

  if (typeof updates.slotsNeeded === 'number') {
    const confirmedCount = await countConfirmedClaimsForOffer(id)
    if (updates.slotsNeeded < confirmedCount) {
      throw new Error(
        `Cannot reduce slots to ${updates.slotsNeeded}: ${confirmedCount} claim${confirmedCount === 1 ? ' is' : 's are'} already confirmed.`
      )
    }
  }

  return updateOffer(id, updates)
}

// ============================================
// CANCEL OFFER (WITH CASCADE)
// ============================================

export interface CancelOfferResult {
  offer: ShiftOffer
  cancelledClaims: ShiftClaim[]
  cancelledAssignments: string[]
}

/**
 * Cancel an offer and cascade the cancellation to every claim and
 * assignment attached to it.
 *
 * Mapping:
 *   - pending      → cancelled, releaseReason 'admin'
 *   - waitlisted   → cancelled, releaseReason 'admin'   (never had the slot)
 *   - confirmed    → cancelled, releaseReason 'event-cancelled'
 *   - checked-in   → cancelled, releaseReason 'event-cancelled'
 *   - checked-out  → cancelled, releaseReason 'event-cancelled'
 *   - completed    → cancelled, releaseReason 'event-cancelled'
 *   - auto-closed  → cancelled, releaseReason 'event-cancelled'
 *
 * Linked assignments are marked 'cancelled'. WorkLogs are NOT touched —
 * they remain the source of truth for pay, per the project invariants.
 */
export async function cancelOfferAndCascade(
  offerId: string,
  reason: ClaimReleaseReason = 'event-cancelled',
  now: Date = new Date()
): Promise<CancelOfferResult | undefined> {
  const offer = await getOfferById(offerId)
  if (!offer) return undefined
  if (offer.status === 'cancelled') {
    // Idempotent: return an empty result.
    return { offer, cancelledClaims: [], cancelledAssignments: [] }
  }

  const claims = await getClaimsForOffer(offerId)
  const cancelledClaims: ShiftClaim[] = []
  const cancelledAssignments: string[] = []

  // Build the assignment-cancel set first so we can do one write.
  const assignmentIdsToCancel = new Set<string>()
  for (const c of claims) {
    if (c.assignmentId && claimOccupiesSlot(c.status)) {
      assignmentIdsToCancel.add(c.assignmentId)
    }
  }

  if (assignmentIdsToCancel.size > 0) {
    try {
      const assignments = await getAssignments()
      const next: StaffAssignment[] = assignments.map((a) =>
        assignmentIdsToCancel.has(a.id)
          ? { ...a, status: 'cancelled', updatedAt: now.toISOString() }
          : a
      )
      await saveAssignments(next)
      cancelledAssignments.push(...assignmentIdsToCancel)
    } catch (err) {
      console.error('[cancelOfferAndCascade] assignment cancel failed:', err)
    }
  }

  // Cancel each claim.
  for (const c of claims) {
    if (c.status === 'cancelled' || c.status === 'released') continue

    const isPreSlot =
      c.status === 'pending' || c.status === 'waitlisted'
    const claimReason: ClaimReleaseReason = isPreSlot ? 'admin' : reason

    try {
      const updated = await updateClaim(c.id, {
        status: 'cancelled',
        releaseReason: claimReason,
        releasedAt: now.toISOString(),
        waitlistOfferedAt: undefined,
        waitlistExpiresAt: undefined,
      })
      if (updated) cancelledClaims.push(updated)
    } catch (err) {
      console.error('[cancelOfferAndCascade] claim cancel failed:', c.id, err)
    }
  }

  const cancelledOffer = await cancelOffer(offerId)
  if (!cancelledOffer) return undefined

  return {
    offer: cancelledOffer,
    cancelledClaims,
    cancelledAssignments,
  }
}

// ============================================
// SLOTS RECOMPUTE HELPER
// ============================================

/**
 * Recompute an offer's `slotsFilled` from its claims and persist.
 * Call this after any claim state change.
 */
export async function refreshOfferSlots(offerId: string): Promise<void> {
  const count = await countConfirmedClaimsForOffer(offerId)
  await recomputeOfferSlotsFilled(offerId, count)
}

// ============================================
// EVENT SUMMARY
// ============================================

export interface EventCoverageSummary {
  eventId: string
  totalOffers: number
  totalSlotsNeeded: number
  totalSlotsFilled: number
  totalSlotsPending: number
  isFullyStaffed: boolean
}

export async function getEventCoverageSummary(
  eventId: string
): Promise<EventCoverageSummary> {
  const offers = await getOffersForEvent(eventId)
  const active = offers.filter(
    (o) => o.status !== 'cancelled' && o.status !== 'draft'
  )

  let slotsNeeded = 0
  let slotsFilled = 0
  let slotsPending = 0

  for (const offer of active) {
    const claims = await getClaimsForOffer(offer.id)
    slotsNeeded += offer.slotsNeeded
    slotsFilled += claims.filter((c) => claimOccupiesSlot(c.status)).length
    slotsPending += claims.filter(
      (c) => c.status === 'pending' || c.status === 'waitlisted'
    ).length
  }

  return {
    eventId,
    totalOffers: active.length,
    totalSlotsNeeded: slotsNeeded,
    totalSlotsFilled: slotsFilled,
    totalSlotsPending: slotsPending,
    isFullyStaffed:
      active.length > 0 &&
      slotsFilled === slotsNeeded &&
      slotsPending === 0,
  }
}

/**
 * Coverage summary for every event that has at least one active offer.
 */
export async function getAllEventsCoverageSummaries(): Promise<
  Map<string, EventCoverageSummary>
> {
  const allOffers = await getAllOffers()
  const byEvent = new Map<string, ShiftOffer[]>()
  for (const o of allOffers) {
    if (o.status === 'cancelled' || o.status === 'draft') continue
    if (!byEvent.has(o.eventId)) byEvent.set(o.eventId, [])
    byEvent.get(o.eventId)!.push(o)
  }

  const allClaims = await getAllClaims()
  const claimsByOffer = new Map<string, ShiftClaim[]>()
  for (const c of allClaims) {
    if (!claimsByOffer.has(c.offerId)) claimsByOffer.set(c.offerId, [])
    claimsByOffer.get(c.offerId)!.push(c)
  }

  const result = new Map<string, EventCoverageSummary>()

  for (const [eventId, offers] of byEvent) {
    let slotsNeeded = 0
    let slotsFilled = 0
    let slotsPending = 0

    for (const offer of offers) {
      const claims = claimsByOffer.get(offer.id) || []
      slotsNeeded += offer.slotsNeeded
      slotsFilled += claims.filter((c) => claimOccupiesSlot(c.status)).length
      slotsPending += claims.filter(
        (c) => c.status === 'pending' || c.status === 'waitlisted'
      ).length
    }

    result.set(eventId, {
      eventId,
      totalOffers: offers.length,
      totalSlotsNeeded: slotsNeeded,
      totalSlotsFilled: slotsFilled,
      totalSlotsPending: slotsPending,
      isFullyStaffed:
        offers.length > 0 &&
        slotsFilled === slotsNeeded &&
        slotsPending === 0,
    })
  }

  return result
}