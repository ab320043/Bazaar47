// lib/storage/staff-claims.ts
import { Redis } from '@upstash/redis'
import type { ShiftClaim } from '@/types/staff-claim'

const redis = Redis.fromEnv()
const CLAIMS_KEY = 'staff_claims'

type ClaimsMap = Record<string, ShiftClaim>

// ============================================
// Phase 0: infrastructure in place, no writes yet.
// Phase 2 will populate this module with claim lifecycle functions.
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

export async function getAllClaims(): Promise<ShiftClaim[]> {
  const map = await getMap()
  return Object.values(map)
}

export async function getClaimsForStaff(staffId: string): Promise<ShiftClaim[]> {
  const map = await getMap()
  return Object.values(map).filter((c) => c.staffId === staffId)
}

export async function getClaimsForOffer(offerId: string): Promise<ShiftClaim[]> {
  const map = await getMap()
  return Object.values(map).filter((c) => c.offerId === offerId)
}