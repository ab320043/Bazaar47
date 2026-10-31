// lib/staff/direct-assign.ts
//
// Phase 2A: Admin "direct assign" produces an offer + confirmed claim +
// assignment triple so the coverage board and the claim stream reflect
// reality even when the admin bypasses the normal offer flow.
//
// Phase 2A fix: direct-assign REUSES an existing open offer that matches
// the same (event, role, shift window) instead of creating a new one
// every time. This prevents "one offer per staff member" cluttering the
// coverage board when an admin direct-assigns multiple people to the
// same role.
//
// Matching rules for reuse:
//   - same eventId
//   - same role
//   - same shiftStart and shiftEnd
//   - status is 'open' or 'filled'
//   - whoCanClaim is 'all' or 'permanent' (not a prior 'staff:<id>' offer)
//   - the existing offer's hourlyRate matches the incoming rate
//
// If no match is found, a fresh offer is created with slotsNeeded=1.
// If a match is found, its slotsNeeded is bumped to accommodate the
// new claim if it's full, so "slotsNeeded" always reflects the actual
// number of people assigned plus any remaining open capacity.

import {
  getOffersForEvent,
  createOffer,
  cancelOffer,
  updateOffer,
  getOfferById,
} from '@/lib/storage/shift-offers'
import { createClaim, updateClaim } from '@/lib/storage/staff-claims'
import { createAssignment } from '@/lib/storage/staff-assignments'
import { refreshOfferSlots } from '@/lib/staff/offer-actions'
import type { ShiftOffer } from '@/types/shift-offer'
import type { ShiftClaim } from '@/types/staff-claim'
import type {
  StaffAssignment,
  StaffRole,
  StaffPosition,
  EventType,
  AssignmentStatus,
} from '@/types/staff'

// ============================================
// INPUT / RESULT
// ============================================

export interface DirectAssignInput {
  eventId: string
  eventName: string
  eventDate: string
  staffId: string
  staffName: string
  roles: StaffRole[]
  position: StaffPosition
  hourlyRate: number
  shiftStart: string
  shiftEnd: string
  eventType: EventType
  status?: AssignmentStatus
  notes?: string
  responsibilities?: {
    before: string[]
    during: string[]
    after: string[]
  }
}

export interface DirectAssignResult {
  assignment: StaffAssignment
  offer: ShiftOffer
  claim: ShiftClaim
  /** True if we reused an existing offer, false if we created one. */
  reusedExistingOffer: boolean
}

// ============================================
// HELPERS
// ============================================

function pickPrimaryRole(roles: StaffRole[]): StaffRole {
  return roles[0] || 'event-coordinator'
}

/**
 * Look for an existing open offer on the same event, role, and shift
 * window that direct-assign can reuse. Returns undefined if none match.
 */
async function findReusableOffer(
  eventId: string,
  role: StaffRole,
  shiftStart: string,
  shiftEnd: string,
  hourlyRate: number
): Promise<ShiftOffer | undefined> {
  const offers = await getOffersForEvent(eventId)

  return offers.find((o) => {
    if (o.role !== role) return false
    if (o.shiftStart !== shiftStart) return false
    if (o.shiftEnd !== shiftEnd) return false
    if (o.status !== 'open' && o.status !== 'filled') return false
    // Don't reuse prior direct-assign offers — those have
    // whoCanClaim 'staff:<id>' and are tied to a specific person.
    if (o.whoCanClaim !== 'all' && o.whoCanClaim !== 'permanent') {
      return false
    }
    // Rate must match, otherwise the claim's lockedRate would diverge
    // from the offer's rate and confuse the admin.
    if (o.hourlyRate !== hourlyRate) return false
    return true
  })
}

// ============================================
// MAIN
// ============================================

export async function directAssign(
  input: DirectAssignInput,
  createdBy: string
): Promise<DirectAssignResult> {
  const primaryRole = pickPrimaryRole(input.roles)

  // ---- Step 1: find or create the offer ----
  let offer: ShiftOffer
  let reusedExistingOffer = false
  try {
    const existing = await findReusableOffer(
      input.eventId,
      primaryRole,
      input.shiftStart,
      input.shiftEnd,
      input.hourlyRate
    )

    if (existing) {
      offer = existing
      reusedExistingOffer = true
      // Bump slotsNeeded if we're about to fill the last slot with
      // this direct-assign. This makes "slotsNeeded" reflect reality:
      // direct-assigning 2 people onto a "1 slot" offer becomes a
      // "2 slots" offer with both filled.
      if (existing.slotsFilled >= existing.slotsNeeded) {
        const bumped = await updateOffer(existing.id, {
          slotsNeeded: existing.slotsNeeded + 1,
        })
        if (bumped) offer = bumped
      }
    } else {
      offer = await createOffer(
        {
          eventId: input.eventId,
          eventName: input.eventName,
          eventDate: input.eventDate,
          role: primaryRole,
          slotsNeeded: 1,
          shiftStart: input.shiftStart,
          shiftEnd: input.shiftEnd,
          hourlyRate: input.hourlyRate,
          whoCanClaim: 'all',
          status: 'open',
        },
        createdBy
      )
    }
  } catch (err) {
    console.error('[directAssign] failed to resolve offer:', err)
    throw new Error('Failed to resolve offer for direct assignment')
  }

  // ---- Step 2: create confirmed claim ----
  let claim: ShiftClaim
  try {
    claim = await createClaim({
      offerId: offer.id,
      staffId: input.staffId,
      staffName: input.staffName,
      lockedRole: primaryRole,
      lockedRate: input.hourlyRate,
      status: 'confirmed',
      confirmedBy: 'admin-direct',
      assignmentId: null,
    })
  } catch (err) {
    console.error('[directAssign] failed to create claim:', err)
    // Only roll back the offer if WE created it. If we reused one,
    // leave it alone — the failure isn't the offer's fault.
    if (!reusedExistingOffer) {
      await cancelOffer(offer.id).catch(() => {})
    }
    throw new Error('Failed to create claim for direct assignment')
  }

  // ---- Step 3: create assignment ----
  let assignment: StaffAssignment
  try {
    assignment = await createAssignment({
      eventId: input.eventId,
      eventName: input.eventName,
      eventType: input.eventType,
      staffId: input.staffId,
      staffName: input.staffName,
      roles: input.roles,
      position: input.position,
      hourlyRate: input.hourlyRate,
      shiftStart: input.shiftStart,
      shiftEnd: input.shiftEnd,
      status: input.status || 'assigned',
      responsibilities: input.responsibilities || {
        before: [],
        during: [],
        after: [],
      },
      notes: input.notes || '',
    })
  } catch (err) {
    console.error('[directAssign] failed to create assignment:', err)
    await updateClaim(claim.id, {
      status: 'released',
      releaseReason: 'admin',
      releasedAt: new Date().toISOString(),
    }).catch(() => {})
    if (!reusedExistingOffer) {
      await cancelOffer(offer.id).catch(() => {})
    }
    throw new Error('Failed to create assignment')
  }

  // ---- Step 4: link claim → assignment ----
  await updateClaim(claim.id, { assignmentId: assignment.id }).catch((err) => {
    console.error(
      '[directAssign] failed to link claim to assignment (non-fatal):',
      err
    )
  })

  // ---- Step 5: refresh offer slot count ----
  await refreshOfferSlots(offer.id).catch((err) => {
    console.error('[directAssign] failed to refresh offer slots (non-fatal):', err)
  })

  // Re-fetch so we return the updated status.
  const refreshedOffer = (await getOfferById(offer.id)) || offer

  return {
    assignment,
    offer: refreshedOffer,
    claim,
    reusedExistingOffer,
  }
}