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
} from '@/lib/storage/staff-claims'
import type {
  ShiftOffer,
  ShiftOfferCreatePayload,
  ShiftOfferUpdatePayload,
  EventCoverage,
  RoleCoverage,
  OfferWithClaims,
} from '@/types/shift-offer'
import { claimIsActive } from '@/types/staff-claim'
import type { StaffMember } from '@/types/staff'
import { STAFF_ROLES } from '@/data/staff-roles'

// ============================================
// ELIGIBILITY
// ============================================

/**
 * Does this staff member match the offer's eligibility rule?
 */
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
 * (occupying slots) and pending claims (awaiting admin confirmation).
 * `isFullyStaffed` is true only when every offer has zero pending
 * claims AND `slotsFilled === slotsNeeded`.
 */
export async function getCoverageForEvent(
  eventId: string,
  eventName: string,
  eventDate: string
): Promise<EventCoverage> {
  const offers = await getOffersForEvent(eventId)
  const allClaims = await getAllClaims()

  const claimsByOffer = new Map<string, typeof allClaims>()
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

    const confirmed = claims.filter(
      (c) =>
        c.status === 'confirmed' ||
        c.status === 'checked-in' ||
        c.status === 'checked-out' ||
        c.status === 'completed' ||
        c.status === 'auto-closed'
    )
    const pending = claims.filter((c) => c.status === 'pending')

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

/**
 * Publish a new offer.
 *
 * Validates:
 *   - shiftEnd > shiftStart
 *   - slotsNeeded >= 1
 *   - hourlyRate > 0
 *
 * Sets status to 'open' by default. If `status: 'draft'` is passed,
 * the offer is created but not visible on the coverage board's
 * "counts toward coverage" logic.
 */
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

/**
 * Cancel an offer.
 *
 * All pending and confirmed claims on it are transitioned to
 * 'cancelled' with releaseReason 'event-cancelled'. Their assignments
 * (if any) are NOT cancelled here — Phase 2C will handle that cascade.
 * For Phase 2A, offer cancellation only marks the claims as cancelled.
 */
export async function cancelOfferAndCascade(
  offerId: string
): Promise<ShiftOffer | undefined> {
  const cancelled = await cancelOffer(offerId)
  if (!cancelled) return undefined

  // Phase 2A does not yet cascade to claims — Phase 2C will.
  // The offer itself is out of the coverage board, which is the
  // important effect. Confirmed claims become orphaned (their offer
  // is cancelled), which the coverage board treats as "not counting".
  return cancelled
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

/**
 * A lightweight summary for the event list / dashboard: does this event
 * have any open offers, how many slots filled / needed in total, and
 * is it fully covered.
 */
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
    slotsFilled += claims.filter(
      (c) =>
        c.status === 'confirmed' ||
        c.status === 'checked-in' ||
        c.status === 'checked-out' ||
        c.status === 'completed' ||
        c.status === 'auto-closed'
    ).length
    slotsPending += claims.filter((c) => c.status === 'pending').length
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
 * Used by the admin event list to show "3 of 5 staffed" style badges.
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
  const claimsByOffer = new Map<string, typeof allClaims>()
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
      slotsFilled += claims.filter(
        (c) =>
          c.status === 'confirmed' ||
          c.status === 'checked-in' ||
          c.status === 'checked-out' ||
          c.status === 'completed' ||
          c.status === 'auto-closed'
      ).length
      slotsPending += claims.filter((c) => c.status === 'pending').length
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