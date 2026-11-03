// lib/staff/claim-actions.ts
import {
  getOfferById,
  getAllOffers,
} from '@/lib/storage/shift-offers'
import {
  getClaimsForOffer,
  getActiveClaimsForStaff,
  countConfirmedClaimsForOffer,
  createClaim,
  updateClaim,
  getClaimById,
} from '@/lib/storage/staff-claims'
import { createAssignment } from '@/lib/storage/staff-assignments'
import { refreshOfferSlots, staffCanClaimOffer } from '@/lib/staff/offer-actions'
import type { ShiftOffer } from '@/types/shift-offer'
import type { ShiftClaim } from '@/types/staff-claim'
import type { StaffMember, StaffRole } from '@/types/staff'

// ============================================
// TYPES
// ============================================

export type ClaimCreateResult =
  | { ok: true; claim: ShiftClaim }
  | { ok: false; status: number; error: string }

export type ClaimReleaseResult =
  | { ok: true; claim: ShiftClaim }
  | { ok: false; status: number; error: string }

// ============================================
// ELIGIBILITY CHECKS
// ============================================

/**
 * Does this staff member already have an active claim that overlaps
 * the given shift window? Returns the conflicting claim if so.
 */
// async function findOverlappingClaim(
//   staffId: string,
//   shiftStart: string,
//   shiftEnd: string
// ): Promise<ShiftClaim | undefined> {
//   const active = await getActiveClaimsForStaff(staffId)
//   const startMs = new Date(shiftStart).getTime()
//   const endMs = new Date(shiftEnd).getTime()

//   return active.find((c) => {
//     // We need the offer's shift window to compare — but claims store
//     // locked role and rate, not times. Fetch the offer.
//     // Note: this is a per-claim async fetch. For small datasets this
//     // is fine. If claims grow past a few hundred, denormalize
//     // shiftStart/shiftEnd onto the claim record.
//     return false // placeholder; see below
//   })
// }

/**
 * Overlap detection that actually works. Because claims don't store
 * their shift window (only the offer does), we look up each active
 * claim's offer and compare time windows.
 */
async function findOverlap(
  staffId: string,
  shiftStart: string,
  shiftEnd: string
): Promise<ShiftClaim | undefined> {
  const active = await getActiveClaimsForStaff(staffId)
  const newStartMs = new Date(shiftStart).getTime()
  const newEndMs = new Date(shiftEnd).getTime()

  for (const claim of active) {
    const offer = await getOfferById(claim.offerId)
    if (!offer) continue
    const existingStartMs = new Date(offer.shiftStart).getTime()
    const existingEndMs = new Date(offer.shiftEnd).getTime()

    // Overlap: newStart < existingEnd && newEnd > existingStart
    const overlaps =
      newStartMs < existingEndMs && newEndMs > existingStartMs
    if (overlaps) return claim
  }

  return undefined
}

// ============================================
// CREATE CLAIM
// ============================================

/**
 * Create a pending claim on an offer.
 *
 * Checks, in order:
 *   1. Offer exists and is `open` or `filled` (drafts and closed/cancelled
 *      offers aren't claimable).
 *   2. Staff is eligible per the offer's whoCanClaim rule.
 *   3. We're past the minNoticeHours window (i.e. now <= shiftStart - notice).
 *   4. Staff has no active claim that overlaps this shift window.
 *   5. Offer still has remaining capacity (slotsFilled < slotsNeeded) OR
 *      the offer is at capacity but we still allow a pending claim
 *      (admin's coverage board will show it as "waitlist"-like and the
 *      admin can reject or increase slots).
 *
 * Note: (5) is intentionally permissive. Staff CAN submit a pending claim
 * on a full offer. That's the waitlist-ish behavior — admin decides what
 * to do with over-capacity pending claims (reject, increase slots). This
 * matches how Phase 2C will implement the waitlist; for Phase 2B, we just
 * don't block submission.
 */
export async function createStaffClaim(
  staff: StaffMember,
  offerId: string
): Promise<ClaimCreateResult> {
  const offer = await getOfferById(offerId)
  if (!offer) {
    return { ok: false, status: 404, error: 'Offer not found' }
  }

  if (offer.status !== 'open' && offer.status !== 'filled') {
    return {
      ok: false,
      status: 400,
      error: `This offer is ${offer.status} and cannot be claimed`,
    }
  }

  if (!staffCanClaimOffer(staff, offer)) {
    return {
      ok: false,
      status: 403,
      error: 'You are not eligible to claim this offer',
    }
  }

  // ---- Min notice window ----
  const now = Date.now()
  const startMs = new Date(offer.shiftStart).getTime()
  if (!Number.isFinite(startMs)) {
    return { ok: false, status: 500, error: 'Invalid shift start time' }
  }
  const noticeMs = (offer.minNoticeHours || 0) * 60 * 60 * 1000
  if (now > startMs - noticeMs) {
    const hours = offer.minNoticeHours || 0
    return {
      ok: false,
      status: 400,
      error: `This offer requires ${hours}h notice and the cutoff has passed`,
    }
  }

  // ---- Overlap check ----
  const overlapping = await findOverlap(staff.id, offer.shiftStart, offer.shiftEnd)
  if (overlapping) {
    const conflictOffer = await getOfferById(overlapping.offerId)
    return {
      ok: false,
      status: 409,
      error: `You already have an active claim for ${
        conflictOffer?.eventName || 'another event'
      } at this time`,
    }
  }

  // ---- Duplicate check (same staff on same offer) ----
  const existingClaims = await getClaimsForOffer(offerId)
  const duplicate = existingClaims.find(
    (c) => c.staffId === staff.id &&
      c.status !== 'released' &&
      c.status !== 'cancelled' &&
      c.status !== 'no-show'
  )
  if (duplicate) {
    return {
      ok: false,
      status: 409,
      error: 'You have already claimed this shift',
    }
  }

  // ---- Create the claim ----
  try {
    const claim = await createClaim({
      offerId,
      staffId: staff.id,
      staffName: staff.name,
      lockedRole: offer.role,
      lockedRate: offer.hourlyRate,
      status: 'pending',
      confirmedBy: null,
      assignmentId: null,
    })

    return { ok: true, claim }
  } catch (err) {
    console.error('[createStaffClaim] failed:', err)
    return { ok: false, status: 500, error: 'Failed to create claim' }
  }
}

// ============================================
// RELEASE PENDING CLAIM
// ============================================

/**
 * Release a claim that's still pending.
 *
 * Only works if:
 *   - The claim belongs to this staff member.
 *   - The claim is in `pending` status.
 *
 * Confirmed claims cannot be released via this route (that's Phase 2C,
 * with cancellation windows and late-cancel flags).
 *
 * Uses soft-delete: status → 'cancelled', releaseReason → 'staff'.
 * The record is preserved for admin audit; the coverage board filters
 * it out of the actionable pending list.
 */
export async function releaseStaffClaim(
  staff: StaffMember,
  claimId: string
): Promise<ClaimReleaseResult> {
  const claim = await getClaimById(claimId)
  if (!claim) {
    return { ok: false, status: 404, error: 'Claim not found' }
  }
  if (claim.staffId !== staff.id) {
    return { ok: false, status: 403, error: 'Forbidden' }
  }
  if (claim.status !== 'pending') {
    return {
      ok: false,
      status: 400,
      error: `Cannot release: claim is already ${claim.status}`,
    }
  }

  try {
    const updated = await updateClaim(claimId, {
      status: 'cancelled',
      releaseReason: 'staff',
      releasedAt: new Date().toISOString(),
    })
    if (!updated) {
      return { ok: false, status: 500, error: 'Failed to release claim' }
    }
    return { ok: true, claim: updated }
  } catch (err) {
    console.error('[releaseStaffClaim] failed:', err)
    return { ok: false, status: 500, error: 'Failed to release claim' }
  }
}

// ============================================
// CONFIRM CLAIM (ADMIN)
// ============================================

/**
 * Admin confirms a pending claim. Creates an assignment in the same
 * call so the shift appears in the staff member's My Shifts page.
 *
 * Under Phase 2B (Option A), `StaffAssignment` is still written and
 * read by the staff dashboard. Phase 3 will retire this in favor of
 * reading claims directly.
 *
 * Pre-conditions (checked by the caller route):
 *   - Claim exists and belongs to the offer.
 *   - Claim status is `pending`.
 *   - Offer has remaining capacity.
 *
 * This function handles the assignment creation, claim update, offer
 * refresh, and claim→assignment linkage. Failure at any step rolls
 * back the previous ones as far as possible.
 */
export interface ConfirmClaimParams {
  claimId: string
  offerId: string
}

export type ConfirmClaimResult =
  | { ok: true; claim: ShiftClaim; assignmentId: string }
  | { ok: false; status: number; error: string }

export async function confirmStaffClaim(
  params: ConfirmClaimParams
): Promise<ConfirmClaimResult> {
  const { claimId, offerId } = params

  const offer = await getOfferById(offerId)
  if (!offer) {
    return { ok: false, status: 404, error: 'Offer not found' }
  }

  const claim = await getClaimById(claimId)
  if (!claim) {
    return { ok: false, status: 404, error: 'Claim not found' }
  }
  if (claim.offerId !== offerId) {
    return { ok: false, status: 400, error: 'Claim does not belong to this offer' }
  }
  if (claim.status !== 'pending') {
    return {
      ok: false,
      status: 400,
      error: `Cannot confirm: claim is already ${claim.status}`,
    }
  }

  // Capacity check
  const confirmedCount = await countConfirmedClaimsForOffer(offerId)
  if (confirmedCount >= offer.slotsNeeded) {
    return {
      ok: false,
      status: 409,
      error: `Offer is full (${confirmedCount}/${offer.slotsNeeded}). Reject this claim or increase slots.`,
    }
  }

  // ---- Create the assignment ----
  // This is what makes the shift visible on the staff dashboard
  // (Option A).

  let assignmentId: string
  try {
    const assignment = await createAssignment({
      eventId: offer.eventId,
      eventName: offer.eventName,
      eventType: 'community', // offers don't carry eventType today; default
      staffId: claim.staffId,
      staffName: claim.staffName,
      roles: [claim.lockedRole],
      position: 'team-member',
      hourlyRate: claim.lockedRate,
      shiftStart: offer.shiftStart,
      shiftEnd: offer.shiftEnd,
      status: 'assigned',
      responsibilities: { before: [], during: [], after: [] },
      notes: '',
    })
    assignmentId = assignment.id
  } catch (err) {
    console.error('[confirmStaffClaim] failed to create assignment:', err)
    return { ok: false, status: 500, error: 'Failed to create assignment' }
  }

  // ---- Update claim → confirmed ----
  let updatedClaim: ShiftClaim | undefined
  try {
    updatedClaim = await updateClaim(claimId, {
      status: 'confirmed',
      confirmedBy: 'admin-confirm',
      confirmedAt: new Date().toISOString(),
      assignmentId,
    })
    if (!updatedClaim) {
      throw new Error('updateClaim returned undefined')
    }
  } catch (err) {
    console.error('[confirmStaffClaim] failed to update claim:', err)
    // The assignment exists but the claim didn't flip. Flag for admin
    // review but do not attempt to delete the assignment — deleting
    // would lose the audit trail. Instead, surface the error.
    return {
      ok: false,
      status: 500,
      error:
        'Claim confirm partially failed. Assignment was created but claim update failed. Contact engineering.',
    }
  }

    // ---- Refresh offer slot count ----
    await refreshOfferSlots(offerId).catch((err) => {
      console.error('[confirmStaffClaim] failed to refresh offer slots (non-fatal):', err)
    })

    // ---- Refresh offer slot count ----
  await refreshOfferSlots(offerId).catch((err) => {
    console.error('[confirmStaffClaim] failed to refresh offer slots (non-fatal):', err)
  })

  // ---- Fire-and-forget: staff notification ----
  void (async () => {
    try {
      const { getStaffById } = await import('@/lib/storage/staff')
      const { notifyClaimConfirmed } = await import('@/lib/email/notify')
      const staff = await getStaffById(updatedClaim.staffId)
      if (staff?.email) {
        notifyClaimConfirmed(updatedClaim, offer, staff.email)
      }
    } catch (err) {
      console.error('[confirmStaffClaim] notify failed:', err)
    }
  })()

  return { ok: true, claim: updatedClaim, assignmentId }
}

// ============================================
// LIST OFFERS FOR STAFF
// ============================================

/**
 * All open/filled offers a staff member is eligible to claim, grouped
 * by event. Used by the /staff/events page.
 *
 * Returns offers that are open or filled (not draft/closed/cancelled),
 * where the staff matches the eligibility rule.
 *
 * The caller is responsible for filtering out offers the staff has
 * already claimed (both pending and confirmed). That filtering is done
 * in the API route using `getClaimsForStaff`.
 */
export interface OfferForEvent {
  offer: ShiftOffer
  slotsRemaining: number
  /** True if staff already has an active claim on this offer. */
  alreadyClaimed: boolean
  /** The active claim, if any. */
  existingClaim: ShiftClaim | null
}

export interface EventOffersGroup {
  eventId: string
  eventName: string
  eventDate: string
  offers: OfferForEvent[]
}

export async function getClaimableOffersForStaff(
  staff: StaffMember
): Promise<EventOffersGroup[]> {
//   const allOffers = await getOffersForEventless()
     const allOffers = await getAllOffers()

  const staffClaims = await getActiveClaimsForStaff(staff.id)
  const claimByOfferId = new Map(staffClaims.map((c) => [c.offerId, c]))

  const eligible = allOffers.filter(
    (o) =>
      (o.status === 'open' || o.status === 'filled') &&
      staffCanClaimOffer(staff, o)
  )

  const byEvent = new Map<string, EventOffersGroup>()
  for (const offer of eligible) {
    const claims = await getClaimsForOffer(offer.id)
    const confirmedCount = claims.filter(
      (c) =>
        c.status === 'confirmed' ||
        c.status === 'checked-in' ||
        c.status === 'checked-out' ||
        c.status === 'completed' ||
        c.status === 'auto-closed'
    ).length
    const slotsRemaining = Math.max(0, offer.slotsNeeded - confirmedCount)
    const existingClaim = claimByOfferId.get(offer.id) || null

    const existing = byEvent.get(offer.eventId)
    if (existing) {
      existing.offers.push({
        offer,
        slotsRemaining,
        alreadyClaimed: existingClaim !== null,
        existingClaim,
      })
    } else {
      byEvent.set(offer.eventId, {
        eventId: offer.eventId,
        eventName: offer.eventName,
        eventDate: offer.eventDate,
        offers: [
          {
            offer,
            slotsRemaining,
            alreadyClaimed: existingClaim !== null,
            existingClaim,
          },
        ],
      })
    }
  }

  const groups = Array.from(byEvent.values())
  for (const g of groups) {
    g.offers.sort(
      (a, b) =>
        new Date(a.offer.shiftStart).getTime() -
        new Date(b.offer.shiftStart).getTime()
    )
  }
  groups.sort((a, b) => a.eventDate.localeCompare(b.eventDate))
  return groups
}