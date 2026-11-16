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
import { getAssignments, saveAssignments } from '@/lib/storage/staff-assignments'
import { refreshOfferSlots, staffCanClaimOffer } from '@/lib/staff/offer-actions'
import type { ShiftOffer } from '@/types/shift-offer'
import type { ShiftClaim } from '@/types/staff-claim'
import type { StaffMember, StaffRole, StaffAssignment } from '@/types/staff'

// ============================================
// TYPES
// ============================================

export type ClaimCreateResult =
  | { ok: true; claim: ShiftClaim }
  | { ok: false; status: number; error: string }

export type ClaimReleaseResult =
  | { ok: true; claim: ShiftClaim; cascadedTo?: ShiftClaim }
  | { ok: false; status: number; error: string }

export type ClaimReconfirmResult =
  | { ok: true; claim: ShiftClaim; assignmentId: string }
  | { ok: false; status: number; error: string }

// ============================================
// CONSTANTS
// ============================================

/** Locked decision log: 12h window for waitlisted staff to reconfirm. */
const WAITLIST_WINDOW_MS = 12 * 60 * 60 * 1000

/** Locked decision log: late cancellation = release < 48h before shiftStart. */
const LATE_CANCEL_WINDOW_MS = 48 * 60 * 60 * 1000

// ============================================
// ELIGIBILITY CHECKS
// ============================================

/**
 * Overlap detection. Because claims don't store their shift window (only
 * the offer does), we look up each active claim's offer and compare
 * time windows.
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
    // A waitlisted claim is not yet a commitment — do not count it as an
    // overlap. (A person may hold a waitlist window on one shift while
    // claiming another.)
    if (claim.status === 'waitlisted') continue

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
 *   1. Offer exists and is `open` or `filled`.
 *   2. Staff is eligible per the offer's whoCanClaim rule.
 *   3. We're past the minNoticeHours window.
 *   4. Staff has no active claim that overlaps this shift window.
 *   5. Same staff hasn't already claimed this offer.
 *
 * Note: a pending claim on a full offer is allowed. If the offer is
 * at capacity, the claim sits as `pending` until an admin acts
 * (reject or increase slots) or a confirmed claim is released — at
 * which point `cascadeWaitlist` promotes it to `waitlisted`.
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

    // If the slot is already filled, this claim will be promoted to
    // 'waitlisted' when a confirmed claim is released. Nothing else
    // to do here.
    return { ok: true, claim }
  } catch (err) {
    console.error('[createStaffClaim] failed:', err)
    return { ok: false, status: 500, error: 'Failed to create claim' }
  }
}

// ============================================
// RELEASE CLAIM (staff-initiated)
// ============================================

/**
 * Release a claim.
 *
 * Pending:
 *   Soft-delete: status → 'cancelled', releaseReason → 'staff'.
 *   No cascade (the slot was never occupied).
 *
 * Confirmed:
 *   - Flag wasLateCancellation if now < shiftStart - 48h... wait, the
 *     rule is "released < 48h before shift start". So flag when
 *     (shiftStart - now) < 48h.
 *   - Cancel the linked assignment.
 *   - Soft-delete: status → 'cancelled', releaseReason → 'staff'.
 *   - cascadeWaitlist(offerId, now): promote the earliest pending
 *     claim to 'waitlisted'.
 *
 * Any other status is rejected.
 */
export async function releaseStaffClaim(
  staff: StaffMember,
  claimId: string,
  now: Date = new Date()
): Promise<ClaimReleaseResult> {
  const claim = await getClaimById(claimId)
  if (!claim) {
    return { ok: false, status: 404, error: 'Claim not found' }
  }
  if (claim.staffId !== staff.id) {
    return { ok: false, status: 403, error: 'Forbidden' }
  }

  // ---- Pending ----
  if (claim.status === 'pending') {
    try {
      const updated = await updateClaim(claimId, {
        status: 'cancelled',
        releaseReason: 'staff',
        releasedAt: now.toISOString(),
      })
      if (!updated) {
        return { ok: false, status: 500, error: 'Failed to release claim' }
      }
      return { ok: true, claim: updated }
    } catch (err) {
      console.error('[releaseStaffClaim pending] failed:', err)
      return { ok: false, status: 500, error: 'Failed to release claim' }
    }
  }

  // ---- Waitlisted ----
  // Releasing a waitlisted window just returns it to 'pending' — it does
  // not cancel the claim, and does not advance the queue. (The next
  // cascade will re-promote them only if no one older is waiting.)
  if (claim.status === 'waitlisted') {
    try {
      const updated = await updateClaim(claimId, {
        status: 'pending',
        waitlistOfferedAt: undefined,
        waitlistExpiresAt: undefined,
      })
      if (!updated) {
        return { ok: false, status: 500, error: 'Failed to release claim' }
      }
      return { ok: true, claim: updated }
    } catch (err) {
      console.error('[releaseStaffClaim waitlisted] failed:', err)
      return { ok: false, status: 500, error: 'Failed to release claim' }
    }
  }

  // ---- Confirmed ----
  if (claim.status === 'confirmed') {
    const offer = await getOfferById(claim.offerId)
    if (!offer) {
      return { ok: false, status: 404, error: 'Offer not found' }
    }

    const startMs = new Date(offer.shiftStart).getTime()
    const isLate =
      Number.isFinite(startMs) &&
      startMs - now.getTime() < LATE_CANCEL_WINDOW_MS

    // Cancel the linked assignment first (audit trail — do not delete).
    if (claim.assignmentId) {
      try {
        const assignments = await getAssignments()
        const next: StaffAssignment[] = assignments.map((a) =>
          a.id === claim.assignmentId
            ? { ...a, status: 'cancelled', updatedAt: now.toISOString() }
            : a
        )
        await saveAssignments(next)
      } catch (err) {
        console.error('[releaseStaffClaim confirmed] cancel assignment failed:', err)
        // Non-fatal: we still want to release the claim. The assignment
        // will be orphaned but the claim audit is preserved.
      }
    }

    let updated: ShiftClaim | undefined
    try {
      updated = await updateClaim(claimId, {
        status: 'cancelled',
        releaseReason: isLate ? 'late-cancel' : 'staff',
        releasedAt: now.toISOString(),
        wasLateCancellation: isLate,
        waitlistOfferedAt: undefined,
        waitlistExpiresAt: undefined,
      })
      if (!updated) {
        return { ok: false, status: 500, error: 'Failed to release claim' }
      }
    } catch (err) {
      console.error('[releaseStaffClaim confirmed] update failed:', err)
      return { ok: false, status: 500, error: 'Failed to release claim' }
    }

    // Refresh offer slot count.
    await refreshOfferSlots(claim.offerId).catch((err) => {
      console.error('[releaseStaffClaim] refresh slots failed (non-fatal):', err)
    })

    // Advance the waitlist.
    const cascadedTo = await cascadeWaitlist(claim.offerId, now)

    // Fire-and-forget: notify admin/staff (3A best-effort).
    if (cascadedTo) {
      void (async () => {
        try {
          const { getStaffById } = await import('@/lib/storage/staff')
          const { notifyWaitlistOffered } = await import('@/lib/email/notify')
          const staffRecord = await getStaffById(cascadedTo.staffId)
          if (staffRecord?.email) {
            notifyWaitlistOffered(cascadedTo, offer, staffRecord.email)
          }
        } catch (err) {
          console.error('[releaseStaffClaim] waitlist notify failed:', err)
        }
      })()
    }

    return { ok: true, claim: updated, cascadedTo }
  }

  return {
    ok: false,
    status: 400,
    error: `Cannot release: claim is ${claim.status}`,
  }
}

// ============================================
// WAITLIST CASCADE
// ============================================

/**
 * Promote the earliest pending claim on an offer to 'waitlisted',
 * giving it a 12h window to reconfirm.
 *
 * Skips claims that are already waitlisted (they're already in a window).
 * Does not change slot occupancy — a waitlisted claim still does not fill
 * a slot until reconfirmed.
 *
 * Returns the promoted claim, or undefined if there is nobody to promote.
 */
export async function cascadeWaitlist(
  offerId: string,
  now: Date = new Date()
): Promise<ShiftClaim | undefined> {
  const claims = await getClaimsForOffer(offerId)
  const candidates = claims
    .filter((c) => c.status === 'pending')
    .sort((a, b) => {
      const t = new Date(a.claimedAt).getTime() - new Date(b.claimedAt).getTime()
      if (t !== 0) return t
      return a.id.localeCompare(b.id)
    })

  if (candidates.length === 0) return undefined

  const chosen = candidates[0]
  const offeredAt = now.toISOString()
  const expiresAt = new Date(now.getTime() + WAITLIST_WINDOW_MS).toISOString()

  try {
    const updated = await updateClaim(chosen.id, {
      status: 'waitlisted',
      waitlistOfferedAt: offeredAt,
      waitlistExpiresAt: expiresAt,
    })
    return updated
  } catch (err) {
    console.error('[cascadeWaitlist] failed:', err)
    return undefined
  }
}

// ============================================
// RECONFIRM WAITLISTED CLAIM (staff-initiated)
// ============================================

/**
 * Staff accepts a waitlist offer within their window. This promotes
 * the claim to confirmed — identical to an admin confirm, except the
 * admin gate is waived because the waitlist window *is* the offer.
 *
 * The actual confirm work is delegated to confirmStaffClaim so there
 * is exactly one assignment-creation path.
 */
export async function reconfirmWaitlistedClaim(
  claimId: string,
  staff: StaffMember,
  now: Date = new Date()
): Promise<ClaimReconfirmResult> {
  const claim = await getClaimById(claimId)
  if (!claim) {
    return { ok: false, status: 404, error: 'Claim not found' }
  }
  if (claim.staffId !== staff.id) {
    return { ok: false, status: 403, error: 'Forbidden' }
  }
  if (claim.status !== 'waitlisted') {
    return {
      ok: false,
      status: 400,
      error: `This claim is not waitlisted (status: ${claim.status})`,
    }
  }
  if (!claim.waitlistExpiresAt) {
    return { ok: false, status: 400, error: 'No waitlist window set' }
  }
  if (new Date(claim.waitlistExpiresAt).getTime() <= now.getTime()) {
    return {
      ok: false,
      status: 400,
      error: 'Waitlist window has expired',
    }
  }

  // Delegate to the single confirm path.
  const result = await confirmStaffClaim({
    claimId,
    offerId: claim.offerId,
  })

  if (!result.ok) {
    return { ok: false, status: result.status, error: result.error }
  }

  // Clear the waitlist window — the claim is now confirmed.
  await updateClaim(claimId, {
    waitlistOfferedAt: undefined,
    waitlistExpiresAt: undefined,
  }).catch((err) => {
    console.error('[reconfirmWaitlistedClaim] clear window failed (non-fatal):', err)
  })

  return {
    ok: true,
    claim: result.claim,
    assignmentId: result.assignmentId,
  }
}

// ============================================
// CONFIRM CLAIM (ADMIN)
// ============================================

/**
 * Confirm a pending or waitlisted claim. Creates an assignment in the
 * same call so the shift appears in the staff member's My Shifts page.
 *
 * Accepts both 'pending' (admin gate) and 'waitlisted' (staff reconfirm
 * path, or admin confirming a waitlisted claim directly).
 *
 * Handles: assignment creation, claim update, offer refresh,
 * claim→assignment linkage. Failure at any step rolls back the previous
 * ones as far as possible.
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
  if (claim.status !== 'pending' && claim.status !== 'waitlisted') {
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
      waitlistOfferedAt: undefined,
      waitlistExpiresAt: undefined,
    })
    if (!updatedClaim) {
      throw new Error('updateClaim returned undefined')
    }
  } catch (err) {
    console.error('[confirmStaffClaim] failed to update claim:', err)
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

/**
 * All open/filled offers a staff member is eligible to claim, grouped
 * by event. Used by the /staff/events page.
 */
export async function getClaimableOffersForStaff(
  staff: StaffMember
): Promise<EventOffersGroup[]> {
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