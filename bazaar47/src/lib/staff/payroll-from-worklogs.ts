// lib/staff/payroll-from-worklogs.ts
import type { WorkLog } from '@/types/staff-worklog'
import type { StaffRole } from '@/types/staff'
import { type PayrollPeriod } from '@/lib/staff/payroll-period'

// ============================================
// TYPES
// ============================================

export interface PayrollShiftEntry {
  workLogId: string
  assignmentId: string | undefined
  staffId: string
  staffName: string
  eventId: string
  eventName: string
  eventDate: string
  roles: StaffRole[]
  shiftStart: string
  shiftEnd: string
  hoursWorked: number
  hourlyRate: number
  amount: number
  resolution: 'manual' | 'auto-close' | 'admin-edit'
  needsReview: boolean
}

export interface StaffPayrollRow {
  staffId: string
  staffName: string
  shifts: PayrollShiftEntry[]
  shiftCount: number
  totalHours: number
  totalEarned: number
  averageRate: number
}

export interface EventPayrollRow {
  eventId: string
  eventName: string
  eventDate: string
  staffCount: number
  totalHours: number
  totalCost: number
  entries: PayrollShiftEntry[]
}

export interface PayrollTotals {
  totalHours: number
  totalEarned: number
  staffCount: number
  eventCount: number
}

// ============================================
// HELPERS
// ============================================

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

/**
 * Filter work logs to those whose pay period falls within the given
 * window. Uses the stored `payPeriodStartIso` field, not a recomputed
 * date, so historical logs are never re-classified.
 */
export function filterWorkLogsToPeriod(
  workLogs: WorkLog[],
  period: PayrollPeriod
): WorkLog[] {
  return workLogs.filter(
    (w) =>
      w.payPeriodStartIso >= period.startIso &&
      w.payPeriodStartIso <= period.endIso
  )
}

function toShiftEntry(w: WorkLog): PayrollShiftEntry {
  return {
    workLogId: w.id,
    assignmentId: w.assignmentId,
    staffId: w.staffId,
    staffName: w.staffName,
    eventId: w.eventId,
    eventName: w.eventName,
    eventDate: w.shiftStart,
    roles: [w.role],
    shiftStart: w.shiftStart,
    shiftEnd: w.shiftEnd,
    hoursWorked: w.hoursWorked,
    hourlyRate: w.hourlyRate,
    amount: w.amountOwed,
    resolution: w.resolution,
    needsReview: w.needsReview,
  }
}

// ============================================
// AGGREGATIONS
// ============================================

export function computeStaffPayroll(
  workLogs: WorkLog[],
  period: PayrollPeriod
): StaffPayrollRow[] {
  const filtered = filterWorkLogsToPeriod(workLogs, period)
  const byStaff = new Map<string, StaffPayrollRow>()

  for (const w of filtered) {
    const entry = toShiftEntry(w)
    let row = byStaff.get(w.staffId)
    if (!row) {
      row = {
        staffId: w.staffId,
        staffName: w.staffName,
        shifts: [],
        shiftCount: 0,
        totalHours: 0,
        totalEarned: 0,
        averageRate: 0,
      }
      byStaff.set(w.staffId, row)
    }
    row.shifts.push(entry)
    row.shiftCount += 1
    row.totalHours += entry.hoursWorked
    row.totalEarned += entry.amount
  }

  const rows = Array.from(byStaff.values()).map((row) => ({
    ...row,
    totalHours: round2(row.totalHours),
    totalEarned: round2(row.totalEarned),
    averageRate:
      row.totalHours > 0 ? round2(row.totalEarned / row.totalHours) : 0,
    shifts: row.shifts.sort(
      (a, b) =>
        new Date(a.shiftStart).getTime() - new Date(b.shiftStart).getTime()
    ),
  }))

  return rows.sort((a, b) => a.staffName.localeCompare(b.staffName))
}

export function computeEventPayroll(
  workLogs: WorkLog[],
  period: PayrollPeriod
): EventPayrollRow[] {
  const filtered = filterWorkLogsToPeriod(workLogs, period)
  const byEvent = new Map<string, EventPayrollRow>()

  for (const w of filtered) {
    const entry = toShiftEntry(w)
    let row = byEvent.get(w.eventId)
    if (!row) {
      row = {
        eventId: w.eventId,
        eventName: w.eventName,
        eventDate: w.shiftStart,
        staffCount: 0,
        totalHours: 0,
        totalCost: 0,
        entries: [],
      }
      byEvent.set(w.eventId, row)
    }
    row.entries.push(entry)
    row.totalHours += entry.hoursWorked
    row.totalCost += entry.amount
  }

  const rows = Array.from(byEvent.values()).map((row) => {
    const uniqueStaff = new Set(row.entries.map((e) => e.staffId))
    return {
      ...row,
      staffCount: uniqueStaff.size,
      totalHours: round2(row.totalHours),
      totalCost: round2(row.totalCost),
      entries: row.entries.sort(
        (a, b) =>
          new Date(a.shiftStart).getTime() - new Date(b.shiftStart).getTime()
      ),
    }
  })

  return rows.sort(
    (a, b) =>
      new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()
  )
}

export function computePayrollTotals(
  workLogs: WorkLog[],
  period: PayrollPeriod
): PayrollTotals {
  const filtered = filterWorkLogsToPeriod(workLogs, period)
  const staffSet = new Set<string>()
  const eventSet = new Set<string>()
  let totalHours = 0
  let totalEarned = 0

  for (const w of filtered) {
    staffSet.add(w.staffId)
    eventSet.add(w.eventId)
    totalHours += w.hoursWorked
    totalEarned += w.amountOwed
  }

  return {
    totalHours: round2(totalHours),
    totalEarned: round2(totalEarned),
    staffCount: staffSet.size,
    eventCount: eventSet.size,
  }
}