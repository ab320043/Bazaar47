// types/staff-claim.ts
import type { StaffRole } from '@/types/staff'

// ============================================
// SHIFT CLAIM
// ============================================

export type ClaimStatus =
  | 'pending'
  | 'confirmed'
  | 'checked-in'
  | 'checked-out'
  | 'completed'
  | 'released'
  | 'cancelled'
  | 'no-show'
  | 'auto-closed'

export type ClaimReleaseReason =
  | 'staff'
  | 'admin'
  | 'no-show'
  | 'event-cancelled'
  | 'late-cancel'
  | null

export interface ShiftClaim {
  id: string
  offerId: string
  staffId: string
  staffName: string

  /** Rate locked at claim time — never mutated by later offer edits. */
  lockedRole: StaffRole
  lockedRate: number

  claimedAt: string
  status: ClaimStatus

  confirmedBy: string | null
  confirmedAt: string | null

  releasedAt: string | null
  releaseReason: ClaimReleaseReason
  /** Flag only — no automatic pay impact. */
  wasLateCancellation: boolean

  createdAt: string
  updatedAt: string
}

// ============================================
// TYPE GUARDS
// ============================================

export function isClaimStatus(v: unknown): v is ClaimStatus {
  return (
    v === 'pending' ||
    v === 'confirmed' ||
    v === 'checked-in' ||
    v === 'checked-out' ||
    v === 'completed' ||
    v === 'released' ||
    v === 'cancelled' ||
    v === 'no-show' ||
    v === 'auto-closed'
  )
}