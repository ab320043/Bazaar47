// types/shift-offer.ts
import type { StaffRole } from '@/types/staff'

// ============================================
// ELIGIBILITY
// ============================================

/**
 * Who can claim this offer.
 *
 *   'all'          → every active staff member
 *   'permanent'    → only staff with staffType === 'permanent'
 *   'role:<id>'    → only staff whose primaryRole === <id>
 *   'staff:<id>[,<id>...]' → explicit allowlist
 *
 * The prefix syntax keeps it a single string field, which is simpler
 * to store in Redis and to filter on than a discriminated union.
 */
export type OfferEligibility =
  | 'all'
  | 'permanent'
  | `role:${StaffRole}`
  | `staff:${string}`

export function isOfferEligibility(v: unknown): v is OfferEligibility {
  if (typeof v !== 'string') return false
  if (v === 'all' || v === 'permanent') return true
  if (v.startsWith('role:')) {
    const role = v.slice(5)
    return role.length > 0
  }
  if (v.startsWith('staff:')) {
    const ids = v.slice(6).split(',').filter(Boolean)
    return ids.length > 0
  }
  return false
}

// ============================================
// OFFER STATUS
// ============================================

export type OfferStatus =
  | 'draft'
  | 'open'
  | 'filled'
  | 'closed'
  | 'cancelled'

export function isOfferStatus(v: unknown): v is OfferStatus {
  return (
    v === 'draft' ||
    v === 'open' ||
    v === 'filled' ||
    v === 'closed' ||
    v === 'cancelled'
  )
}

// ============================================
// OFFER
// ============================================

export interface ShiftOffer {
  id: string

  // ---- Plan identity ----
  eventId: string
  eventName: string
  eventDate: string  // ISO date 'YYYY-MM-DD'
  role: StaffRole

  // ---- Shift window ----
  slotsNeeded: number
  shiftStart: string  // ISO with offset
  shiftEnd: string
  timeZone: 'America/New_York'

  // ---- Pay ----
  hourlyRate: number

  // ---- Claim rules ----
  whoCanClaim: OfferEligibility
  minNoticeHours: number         // claim blocked if now < shiftStart - N hours
  cancellationDeadline: string   // ISO; releasing after this sets wasLateCancellation
  graceHours: number             // auto-close grace after shiftEnd
  noShowMinutes: number          // no-show tolerance after shiftStart

  // ---- Lifecycle ----
  status: OfferStatus

  /**
   * Number of CONFIRMED claims on this offer.
   *
   * Denormalized for fast reads on the coverage board. Recomputed
   * by `recomputeOfferSlotsFilled()` on every claim state change.
   * Never trust this field directly in a write path — always compute
   * from claims, then write back.
   */
  slotsFilled: number

  // ---- Audit ----
  createdBy: string
  createdAt: string
  updatedAt: string
}

// ============================================
// PAYLOADS
// ============================================

export interface ShiftOfferCreatePayload {
  eventId: string
  eventName: string
  eventDate: string
  role: StaffRole
  slotsNeeded: number
  shiftStart: string
  shiftEnd: string
  hourlyRate: number
  whoCanClaim?: OfferEligibility        // default: 'all'
  minNoticeHours?: number                // default: 0
  cancellationDeadline?: string          // default: shiftStart - 48h
  graceHours?: number                    // default: 1
  noShowMinutes?: number                 // default: 30
  status?: 'draft' | 'open'              // default: 'open'
}

export interface ShiftOfferUpdatePayload {
  slotsNeeded?: number
  shiftStart?: string
  shiftEnd?: string
  hourlyRate?: number
  whoCanClaim?: OfferEligibility
  minNoticeHours?: number
  cancellationDeadline?: string
  graceHours?: number
  noShowMinutes?: number
  status?: OfferStatus
}

// ============================================
// COVERAGE
// ============================================

export interface OfferClaimSummary {
  claimId: string
  staffId: string
  staffName: string
  status: string
  claimedAt: string
}

export interface OfferWithClaims {
  offer: ShiftOffer
  claims: OfferClaimSummary[]
}

export interface RoleCoverage {
  role: StaffRole
  offers: OfferWithClaims[]
  totalSlotsNeeded: number
  totalSlotsFilled: number
  totalSlotsPending: number
  isFullyStaffed: boolean
}

export interface EventCoverage {
  eventId: string
  eventName: string
  eventDate: string
  roles: RoleCoverage[]
  isFullyStaffed: boolean
}

// ============================================
// TYPE GUARDS
// ============================================

export function isShiftOffer(v: unknown): v is ShiftOffer {
  if (typeof v !== 'object' || v === null) return false
  const o = v as Record<string, unknown>
  return (
    typeof o.id === 'string' &&
    typeof o.eventId === 'string' &&
    typeof o.role === 'string' &&
    typeof o.slotsNeeded === 'number' &&
    typeof o.shiftStart === 'string' &&
    typeof o.shiftEnd === 'string' &&
    typeof o.hourlyRate === 'number' &&
    isOfferStatus(o.status)
  )
}