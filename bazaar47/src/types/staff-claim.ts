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

/**
 * Admin identifier for who confirmed the claim.
 *
 *   'admin-direct'  → created via the direct-assign path; bypasses
 *                     the PENDING state and lands as CONFIRMED
 *   'admin-confirm' → admin confirmed a PENDING claim from the
 *                     coverage board
 *   <adminId>       → future: per-admin identity if we add admin accounts
 */
export type ConfirmedBy = 'admin-direct' | 'admin-confirm' | string | null

export interface ShiftClaim {
  id: string
  offerId: string
  staffId: string
  staffName: string

  /** Role and rate locked at claim time — never mutated by later offer edits. */
  lockedRole: StaffRole
  lockedRate: number

  claimedAt: string
  status: ClaimStatus

  confirmedBy: ConfirmedBy
  confirmedAt: string | null

  releasedAt: string | null
  releaseReason: ClaimReleaseReason
  wasLateCancellation: boolean

  /** Filled in when the claim is confirmed and an assignment is created. */
  assignmentId: string | null

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

/**
 * A claim "occupies" a slot on its offer if it's confirmed or later.
 * Pending claims do NOT occupy a slot — admin confirmation is the gate.
 */
export function claimOccupiesSlot(status: ClaimStatus): boolean {
  return (
    status === 'confirmed' ||
    status === 'checked-in' ||
    status === 'checked-out' ||
    status === 'completed' ||
    status === 'auto-closed'
  )
}

/**
 * A claim is "active" if it hasn't been released, cancelled, or
 * marked no-show. Used to filter the coverage board.
 */
export function claimIsActive(status: ClaimStatus): boolean {
  return (
    status === 'pending' ||
    status === 'confirmed' ||
    status === 'checked-in' ||
    status === 'checked-out' ||
    status === 'completed'
  )
}