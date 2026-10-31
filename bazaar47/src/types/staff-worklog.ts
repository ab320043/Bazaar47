// types/staff-worklog.ts
import type { StaffRole } from '@/types/staff'

// ============================================
// AUDIT ENTRY
// ============================================

export interface WorkLogAuditEntry {
  at: string
  by: string
  before: Record<string, unknown>
  after: Record<string, unknown>
  reason: string
}

// ============================================
// WORK LOG
// ============================================

export type WorkLogResolution = 'manual' | 'auto-close' | 'admin-edit'

export type AutoCloseReason = 'forgot-checkout' | 'forgot-checkin'

export interface WorkLog {
  id: string
  /** Set in Phase 2 when work logs come from claims. */
  claimId?: string
  /** Set in Phase 0 — links back to the legacy StaffAssignment. */
  assignmentId?: string

  staffId: string
  staffName: string
  eventId: string
  eventName: string

  role: StaffRole
  hourlyRate: number

  shiftStart: string
  shiftEnd: string
  timeZone: 'America/New_York'

  checkInTime: string | null
  checkOutTime: string | null
  breakStart: string | null
  breakEnd: string | null
  breakHours: number

  hoursWorked: number
  amountOwed: number

  payPeriodStartIso: string
  payPeriodEndIso: string

  resolution: WorkLogResolution
  autoCloseReason: AutoCloseReason | null
  needsReview: boolean

  editedBy: string | null
  editedAt: string | null
  editReason: string | null
  auditTrail: WorkLogAuditEntry[]

  createdAt: string
  updatedAt: string
}

// ============================================
// TYPE GUARDS
// ============================================

export function isWorkLogResolution(v: unknown): v is WorkLogResolution {
  return v === 'manual' || v === 'auto-close' || v === 'admin-edit'
}

export function isAutoCloseReason(v: unknown): v is AutoCloseReason {
  return v === 'forgot-checkout' || v === 'forgot-checkin'
}

export function isWorkLog(v: unknown): v is WorkLog {
  if (typeof v !== 'object' || v === null) return false
  const w = v as Record<string, unknown>
  return (
    typeof w.id === 'string' &&
    typeof w.staffId === 'string' &&
    typeof w.eventId === 'string' &&
    typeof w.shiftStart === 'string' &&
    typeof w.shiftEnd === 'string' &&
    typeof w.hoursWorked === 'number' &&
    typeof w.amountOwed === 'number' &&
    typeof w.needsReview === 'boolean'
  )
}