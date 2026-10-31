// lib/storage/shift-offers.ts
import { Redis } from '@upstash/redis'
import type {
  ShiftOffer,
  ShiftOfferCreatePayload,
  ShiftOfferUpdatePayload,
  OfferEligibility,
} from '@/types/shift-offer'
import { isOfferEligibility } from '@/types/shift-offer'
import type { StaffRole } from '@/types/staff'

const redis = Redis.fromEnv()
const OFFERS_KEY = 'shift_offers'

type OffersMap = Record<string, ShiftOffer>

// ============================================
// DEFAULTS
// ============================================

const DEFAULT_WHO_CAN_CLAIM: OfferEligibility = 'all'
const DEFAULT_MIN_NOTICE_HOURS = 0
const DEFAULT_GRACE_HOURS = 1
const DEFAULT_NO_SHOW_MINUTES = 30
const DEFAULT_CANCELLATION_HOURS_BEFORE = 48

// ============================================
// INTERNAL READ/WRITE
// ============================================

async function getMap(): Promise<OffersMap> {
  try {
    const raw = await redis.get(OFFERS_KEY)
    return (raw as OffersMap) || {}
  } catch (error) {
    console.error('Redis get error (shift_offers):', error)
    return {}
  }
}

async function saveMap(map: OffersMap): Promise<void> {
  try {
    await redis.set(OFFERS_KEY, map)
  } catch (error) {
    console.error('Redis set error (shift_offers):', error)
    throw new Error('Failed to save shift offers')
  }
}

// ============================================
// HELPERS
// ============================================

function computeDefaultCancellationDeadline(shiftStart: string): string {
  const startMs = new Date(shiftStart).getTime()
  if (!Number.isFinite(startMs)) return shiftStart
  return new Date(
    startMs - DEFAULT_CANCELLATION_HOURS_BEFORE * 60 * 60 * 1000
  ).toISOString()
}

// ============================================
// READ
// ============================================

export async function getAllOffers(): Promise<ShiftOffer[]> {
  const map = await getMap()
  return Object.values(map)
}

export async function getOfferById(id: string): Promise<ShiftOffer | undefined> {
  const map = await getMap()
  return map[id]
}

export async function getOffersForEvent(eventId: string): Promise<ShiftOffer[]> {
  const map = await getMap()
  return Object.values(map).filter((o) => o.eventId === eventId)
}

export async function getOpenOffersForEvent(
  eventId: string
): Promise<ShiftOffer[]> {
  const all = await getOffersForEvent(eventId)
  return all.filter((o) => o.status === 'open' || o.status === 'filled')
}

/**
 * Offers eligible for a specific staff member to claim.
 *
 * Filter logic mirrors `staffCanClaimOffer` in offer-actions.ts —
 * but this is the storage-level query, cheaper and less contextual.
 * Business logic layer is the source of truth for eligibility.
 */
export async function getOffersForStaffRole(
  role: StaffRole
): Promise<ShiftOffer[]> {
  const all = await getAllOffers()
  return all.filter(
    (o) =>
      o.role === role &&
      (o.status === 'open' || o.status === 'filled')
  )
}

// ============================================
// CREATE
// ============================================

export async function createOffer(
  payload: ShiftOfferCreatePayload,
  createdBy: string
): Promise<ShiftOffer> {
  const map = await getMap()
  const now = new Date().toISOString()

  const whoCanClaim: OfferEligibility =
    payload.whoCanClaim && isOfferEligibility(payload.whoCanClaim)
      ? payload.whoCanClaim
      : DEFAULT_WHO_CAN_CLAIM

  const offer: ShiftOffer = {
    id: crypto.randomUUID(),
    eventId: payload.eventId,
    eventName: payload.eventName,
    eventDate: payload.eventDate,
    role: payload.role,
    slotsNeeded: Math.max(1, Math.floor(payload.slotsNeeded)),
    shiftStart: payload.shiftStart,
    shiftEnd: payload.shiftEnd,
    timeZone: 'America/New_York',
    hourlyRate: payload.hourlyRate,
    whoCanClaim,
    minNoticeHours:
      typeof payload.minNoticeHours === 'number'
        ? payload.minNoticeHours
        : DEFAULT_MIN_NOTICE_HOURS,
    cancellationDeadline:
      payload.cancellationDeadline ||
      computeDefaultCancellationDeadline(payload.shiftStart),
    graceHours:
      typeof payload.graceHours === 'number'
        ? payload.graceHours
        : DEFAULT_GRACE_HOURS,
    noShowMinutes:
      typeof payload.noShowMinutes === 'number'
        ? payload.noShowMinutes
        : DEFAULT_NO_SHOW_MINUTES,
    status: payload.status === 'draft' ? 'draft' : 'open',
    slotsFilled: 0,
    createdBy,
    createdAt: now,
    updatedAt: now,
  }

  map[offer.id] = offer
  await saveMap(map)
  return offer
}

// ============================================
// UPDATE
// ============================================

export async function updateOffer(
  id: string,
  updates: ShiftOfferUpdatePayload
): Promise<ShiftOffer | undefined> {
  const map = await getMap()
  const existing = map[id]
  if (!existing) return undefined

  const next: ShiftOffer = { ...existing }

  if (typeof updates.slotsNeeded === 'number') {
    next.slotsNeeded = Math.max(1, Math.floor(updates.slotsNeeded))
  }
  if (typeof updates.shiftStart === 'string') {
    next.shiftStart = updates.shiftStart
  }
  if (typeof updates.shiftEnd === 'string') {
    next.shiftEnd = updates.shiftEnd
  }
  if (typeof updates.hourlyRate === 'number') {
    next.hourlyRate = updates.hourlyRate
  }
  if (updates.whoCanClaim && isOfferEligibility(updates.whoCanClaim)) {
    next.whoCanClaim = updates.whoCanClaim
  }
  if (typeof updates.minNoticeHours === 'number') {
    next.minNoticeHours = updates.minNoticeHours
  }
  if (typeof updates.cancellationDeadline === 'string') {
    next.cancellationDeadline = updates.cancellationDeadline
  }
  if (typeof updates.graceHours === 'number') {
    next.graceHours = updates.graceHours
  }
  if (typeof updates.noShowMinutes === 'number') {
    next.noShowMinutes = updates.noShowMinutes
  }
  if (updates.status) {
    next.status = updates.status
  }

  next.updatedAt = new Date().toISOString()
  map[id] = next
  await saveMap(map)
  return next
}

// ============================================
// SLOT RECOMPUTE
// ============================================

/**
 * Recompute `slotsFilled` from the claims store, and derive offer status.
 *
 * Called by claim-actions.ts after every claim state change. Never call
 * from a UI. The offer's status auto-transitions:
 *
 *   open  → filled    when slotsFilled === slotsNeeded
 *   filled → open     when slotsFilled drops below slotsNeeded
 *
 * `draft`, `closed`, `cancelled` are NOT touched by this function — they
 * represent admin decisions that outrank slot math.
 */
export async function recomputeOfferSlotsFilled(
  id: string,
  confirmedSlotCount: number
): Promise<ShiftOffer | undefined> {
  const map = await getMap()
  const existing = map[id]
  if (!existing) return undefined

  const next: ShiftOffer = { ...existing, slotsFilled: confirmedSlotCount }

  // Auto-transition between open and filled.
  if (existing.status === 'open' && next.slotsFilled >= next.slotsNeeded) {
    next.status = 'filled'
  } else if (
    existing.status === 'filled' &&
    next.slotsFilled < next.slotsNeeded
  ) {
    next.status = 'open'
  }

  next.updatedAt = new Date().toISOString()
  map[id] = next
  await saveMap(map)
  return next
}

// ============================================
// CANCEL
// ============================================

export async function cancelOffer(id: string): Promise<ShiftOffer | undefined> {
  const map = await getMap()
  const existing = map[id]
  if (!existing) return undefined

  const next: ShiftOffer = {
    ...existing,
    status: 'cancelled',
    updatedAt: new Date().toISOString(),
  }
  map[id] = next
  await saveMap(map)
  return next
}

// ============================================
// HARD DELETE (rare)
// ============================================

/**
 * Delete an offer outright. Only valid when the offer has zero claims
 * AND is still in 'draft' status. For any other case, use cancelOffer
 * to preserve the audit trail.
 */
export async function deleteDraftOffer(id: string): Promise<boolean> {
  const map = await getMap()
  const existing = map[id]
  if (!existing) return false
  if (existing.status !== 'draft') return false

  delete map[id]
  await saveMap(map)
  return true
}


// ============================================
// FORCE DELETE (only called after route-level checks)
// ============================================

/**
 * Delete an offer record outright. No status check, no claim check —
 * this is a raw delete. The API route MUST verify that the offer has
 * zero claims before calling this.
 *
 * Kept separate from `deleteDraftOffer` (which only deletes drafts)
 * so that a force-delete is explicitly named as dangerous.
 */
export async function deleteOfferForce(id: string): Promise<boolean> {
  const map = await getMap()
  if (!(id in map)) return false
  delete map[id]
  await saveMap(map)
  return true
}