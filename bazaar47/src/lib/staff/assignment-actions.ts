// lib/staff/assignment-actions.ts
import {
  getAssignments,
} from '@/lib/storage/staff-assignments'
import {
  getWorkLogByAssignmentId,
  checkInForWorkLog,
  checkOutForWorkLog,
} from '@/lib/storage/staff-worklogs'
import { getPeriodForDate } from '@/lib/staff/payroll-period'
import type { StaffAssignment, StaffRole } from '@/types/staff'
import type { WorkLog } from '@/types/staff-worklog'

// ============================================
// RESULT TYPES
// ============================================

export type AssignmentActionResult =
  | { ok: true; workLog: WorkLog; assignment: StaffAssignment }
  | { ok: false; status: number; error: string }

// ============================================
// HELPERS
// ============================================

async function loadAssignment(
  assignmentId: string
): Promise<StaffAssignment | undefined> {
  const assignments = await getAssignments()
  return assignments.find((a) => a.id === assignmentId)
}

function pickRole(assignment: StaffAssignment): StaffRole {
  return assignment.roles[0] || 'event-coordinator'
}

// ============================================
// CHECK IN
// ============================================
//
// Phase 1.5: writes only to WorkLog. The assignment is a plan record
// and is not mutated.
//
// Guards that used to live on the assignment are now derived from the
// work log:
//   - "already checked in" → work log exists with a checkInTime
//   - "cancelled assignment" → still checked on the assignment record
//     (cancellations remain a plan-level concept, not a work-log one)

export async function checkInAssignment(
  assignmentId: string,
  expectedStaffId?: string
): Promise<AssignmentActionResult> {
  const assignment = await loadAssignment(assignmentId)
  if (!assignment) {
    return { ok: false, status: 404, error: 'Assignment not found' }
  }

  if (expectedStaffId && assignment.staffId !== expectedStaffId) {
    return { ok: false, status: 403, error: 'Forbidden' }
  }

  if (assignment.status === 'cancelled') {
    return {
      ok: false,
      status: 400,
      error: 'Cannot check in cancelled assignment',
    }
  }

  const existing = await getWorkLogByAssignmentId(assignment.id)
  if (existing?.checkInTime) {
    return { ok: false, status: 400, error: 'Staff already checked in' }
  }

  const checkInIso = new Date().toISOString()
  const period = getPeriodForDate(new Date(assignment.shiftStart))

  try {
    const workLog = await checkInForWorkLog({
      assignmentId: assignment.id,
      staffId: assignment.staffId,
      staffName: assignment.staffName,
      eventId: assignment.eventId,
      eventName: assignment.eventName,
      role: pickRole(assignment),
      hourlyRate: assignment.hourlyRate,
      shiftStart: assignment.shiftStart,
      shiftEnd: assignment.shiftEnd,
      payPeriodStartIso: period.startIso,
      payPeriodEndIso: period.endIso,
      checkInTime: checkInIso,
    })

    return { ok: true, workLog, assignment }
  } catch (err) {
    console.error('[checkInAssignment] failed:', err)
    return { ok: false, status: 500, error: 'Failed to check in staff' }
  }
}

// ============================================
// CHECK OUT
// ============================================

export async function checkOutAssignment(
  assignmentId: string,
  expectedStaffId?: string
): Promise<AssignmentActionResult> {
  const assignment = await loadAssignment(assignmentId)
  if (!assignment) {
    return { ok: false, status: 404, error: 'Assignment not found' }
  }

  if (expectedStaffId && assignment.staffId !== expectedStaffId) {
    return { ok: false, status: 403, error: 'Forbidden' }
  }

  if (assignment.status === 'cancelled') {
    return {
      ok: false,
      status: 400,
      error: 'Cannot check out cancelled assignment',
    }
  }

  const existing = await getWorkLogByAssignmentId(assignment.id)
  if (!existing) {
    return {
      ok: false,
      status: 400,
      error: 'Staff must be checked in first',
    }
  }
  if (!existing.checkInTime) {
    return {
      ok: false,
      status: 400,
      error: 'Staff must be checked in first',
    }
  }
  if (existing.checkOutTime) {
    return { ok: false, status: 400, error: 'Staff already checked out' }
  }

  const checkOutIso = new Date().toISOString()
  const period = getPeriodForDate(new Date(assignment.shiftStart))

  try {
    const workLog = await checkOutForWorkLog({
      assignmentId: assignment.id,
      staffId: assignment.staffId,
      staffName: assignment.staffName,
      eventId: assignment.eventId,
      eventName: assignment.eventName,
      role: pickRole(assignment),
      hourlyRate: assignment.hourlyRate,
      shiftStart: assignment.shiftStart,
      shiftEnd: assignment.shiftEnd,
      payPeriodStartIso: period.startIso,
      payPeriodEndIso: period.endIso,
      checkInTime: existing.checkInTime,
      checkOutTime: checkOutIso,
      breakStart: existing.breakStart,
      breakEnd: existing.breakEnd,
    })

    return { ok: true, workLog, assignment }
  } catch (err) {
    console.error('[checkOutAssignment] failed:', err)
    return { ok: false, status: 500, error: 'Failed to check out staff' }
  }
}