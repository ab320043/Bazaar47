// lib/staff/payroll.ts
import type { StaffAssignment, StaffRole } from '@/types/staff'
import { isDateInPeriod, type PayrollPeriod } from '@/lib/staff/payroll-period'

// ============================================
// TYPES
// ============================================

export interface PayrollShiftEntry {
  assignmentId: string
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

function isCompleted(a: StaffAssignment): boolean {
  return a.status === 'completed' && typeof a.hoursWorked === 'number'
}

export function filterAssignmentsToPeriod(
  assignments: StaffAssignment[],
  period: PayrollPeriod
): StaffAssignment[] {
  return assignments.filter((a) => {
    if (!isCompleted(a)) return false
    const isoDate = a.shiftStart.slice(0, 10)
    return isDateInPeriod(isoDate, period)
  })
}

function toShiftEntry(a: StaffAssignment): PayrollShiftEntry {
  const hours = a.hoursWorked ?? 0
  return {
    assignmentId: a.id,
    staffId: a.staffId,
    staffName: a.staffName,
    eventId: a.eventId,
    eventName: a.eventName,
    eventDate: a.shiftStart,
    roles: a.roles,
    shiftStart: a.shiftStart,
    shiftEnd: a.shiftEnd,
    hoursWorked: hours,
    hourlyRate: a.hourlyRate,
    amount: round2(hours * a.hourlyRate),
  }
}

// ============================================
// AGGREGATIONS
// ============================================

export function computeStaffPayroll(
  assignments: StaffAssignment[],
  period: PayrollPeriod
): StaffPayrollRow[] {
  const filtered = filterAssignmentsToPeriod(assignments, period)

  const byStaff = new Map<string, StaffPayrollRow>()

  for (const a of filtered) {
    const entry = toShiftEntry(a)
    let row = byStaff.get(a.staffId)

    if (!row) {
      row = {
        staffId: a.staffId,
        staffName: a.staffName,
        shifts: [],
        shiftCount: 0,
        totalHours: 0,
        totalEarned: 0,
        averageRate: 0,
      }
      byStaff.set(a.staffId, row)
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
  assignments: StaffAssignment[],
  period: PayrollPeriod
): EventPayrollRow[] {
  const filtered = filterAssignmentsToPeriod(assignments, period)

  const byEvent = new Map<string, EventPayrollRow>()

  for (const a of filtered) {
    const entry = toShiftEntry(a)
    let row = byEvent.get(a.eventId)

    if (!row) {
      row = {
        eventId: a.eventId,
        eventName: a.eventName,
        eventDate: a.shiftStart,
        staffCount: 0,
        totalHours: 0,
        totalCost: 0,
        entries: [],
      }
      byEvent.set(a.eventId, row)
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
  assignments: StaffAssignment[],
  period: PayrollPeriod
): PayrollTotals {
  const filtered = filterAssignmentsToPeriod(assignments, period)

  const staffSet = new Set<string>()
  const eventSet = new Set<string>()
  let totalHours = 0
  let totalEarned = 0

  for (const a of filtered) {
    staffSet.add(a.staffId)
    eventSet.add(a.eventId)
    const hours = a.hoursWorked ?? 0
    totalHours += hours
    totalEarned += hours * a.hourlyRate
  }

  return {
    totalHours: round2(totalHours),
    totalEarned: round2(totalEarned),
    staffCount: staffSet.size,
    eventCount: eventSet.size,
  }
}