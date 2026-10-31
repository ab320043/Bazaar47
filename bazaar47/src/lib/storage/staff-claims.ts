// lib/storage/staff-claims.ts
import { Redis } from '@upstash/redis'
import type {
  ShiftClaim,
  ClaimStatus,
  ConfirmedBy,
  ClaimReleaseReason,
} from '@/types/staff-claim'
import { claimOccupiesSlot } from '@/types/staff-claim'
import type { StaffRole } from '@/types/staff'

const redis = Redis.fromEnv()
const CLAIMS_KEY = 'staff_claims'

type ClaimsMap = Record<string, ShiftClaim>

// ============================================
// INTERNAL READ/WRITE
// ============================================

async function getMap(): Promise<ClaimsMap> {
  try {
    const raw = await redis.get(CLAIMS_KEY)
    return (raw as ClaimsMap) || {}
  } catch (error) {
    console.error('Redis get error (staff_claims):', error)
    return {}
  }
}

async function saveMap(map: ClaimsMap): Promise<void> {
  try {
    await redis.set(CLAIMS_KEY, map)
  } catch (error) {
    console.error('Redis set error (staff_claims):', error)
    throw new Error('Failed to save claims')
  }
}

// ============================================
// READ
// ============================================

export async function getAllClaims(): Promise<ShiftClaim[]> {
  const map = await getMap()
  return Object.values(map)
}

export async function getClaimById(id: string): Promise<ShiftClaim | undefined> {
  const map = await getMap()
  return map[id]
}

export async function getClaimsForStaff(staffId: string): Promise<ShiftClaim[]> {
  const map = await getMap()
  return Object.values(map).filter((c) => c.staffId === staffId)
}

export async function getClaimsForOffer(offerId: string): Promise<ShiftClaim[]> {
  const map = await getMap()
  return Object.values(map).filter((c) => c.offerId === offerId)
}

export async function getClaimsForOfferByStatus(
  offerId: string,
  status: ClaimStatus
): Promise<ShiftClaim[]> {
  const all = await getClaimsForOffer(offerId)
  return all.filter((c) => c.status === status)
}

/**
 * Count the claims on an offer that actually occupy a slot — confirmed
 * or later. Pending claims do NOT occupy slots.
 */
export async function countConfirmedClaimsForOffer(
  offerId: string
): Promise<number> {
  const all = await getClaimsForOffer(offerId)
  return all.filter((c) => claimOccupiesSlot(c.status)).length
}

/**
 * All active claims of a given staff member. Used to detect overlapping
 * claims when a new one is submitted.
 */
export async function getActiveClaimsForStaff(
  staffId: string
): Promise<ShiftClaim[]> {
  const all = await getClaimsForStaff(staffId)
  return all.filter(
    (c) =>
      c.status !== 'released' &&
      c.status !== 'cancelled' &&
      c.status !== 'no-show'
  )
}

// ============================================
// CREATE
// ============================================

export interface CreateClaimInput {
  offerId: string
  staffId: string
  staffName: string
  lockedRole: StaffRole
  lockedRate: number
  status: ClaimStatus
  confirmedBy?: ConfirmedBy
  assignmentId?: string | null
}

export async function createClaim(input: CreateClaimInput): Promise<ShiftClaim> {
  const map = await getMap()
  const now = new Date().toISOString()

  const isConfirmed = input.status === 'confirmed' || claimOccupiesSlot(input.status)

  const claim: ShiftClaim = {
    id: crypto.randomUUID(),
    offerId: input.offerId,
    staffId: input.staffId,
    staffName: input.staffName,
    lockedRole: input.lockedRole,
    lockedRate: input.lockedRate,
    claimedAt: now,
    status: input.status,
    confirmedBy: isConfirmed ? input.confirmedBy ?? 'admin-confirm' : null,
    confirmedAt: isConfirmed ? now : null,
    releasedAt: null,
    releaseReason: null,
    wasLateCancellation: false,
    assignmentId: input.assignmentId ?? null,
    createdAt: now,
    updatedAt: now,
  }

  map[claim.id] = claim
  await saveMap(map)
  return claim
}

// ============================================
// UPDATE
// ============================================

export interface UpdateClaimInput {
  status?: ClaimStatus
  confirmedBy?: ConfirmedBy
  confirmedAt?: string | null
  releasedAt?: string | null
  releaseReason?: ClaimReleaseReason
  wasLateCancellation?: boolean
  assignmentId?: string | null
}

export async function updateClaim(
  id: string,
  updates: UpdateClaimInput
): Promise<ShiftClaim | undefined> {
  const map = await getMap()
  const existing = map[id]
  if (!existing) return undefined

  const next: ShiftClaim = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  }

  // Normalize: if status becomes 'confirmed' or later and confirmedAt
  // is missing, set it to now.
  if (
    claimOccupiesSlot(next.status) &&
    !next.confirmedAt
  ) {
    next.confirmedAt = new Date().toISOString()
  }

  map[id] = next
  await saveMap(map)
  return next
}

// ============================================
// DELETE (rare)
// ============================================

/**
 * Delete a claim outright. Only valid when the claim is still pending
 * and was never confirmed — i.e. it never occupied a slot. Used when
 * an admin "rejects" a pending claim from the coverage board.
 *
 * For a confirmed claim, use updateClaim with status 'released' instead
 * to preserve the audit trail.
 */
export async function deletePendingClaim(id: string): Promise<boolean> {
  const map = await getMap()
  const existing = map[id]
  if (!existing) return false
  if (existing.status !== 'pending') return false

  delete map[id]
  await saveMap(map)
  return true
}