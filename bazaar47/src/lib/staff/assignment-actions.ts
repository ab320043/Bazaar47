// lib/staff/assignment-actions.ts
import {
  getAssignments,
  saveAssignments,
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

export type ReinstateResult =
  | { ok: true; assignment: StaffAssignment }
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

  if (assignment.noShow) {
    return {
      ok: false,
      status: 400,
      error: 'Cannot check in: assignment is marked no-show. Ask an admin to reinstate it.',
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

// ============================================
// REINSTATE NO-SHOW (admin)
// ============================================
//
// Clears the noShow flag and returns the assignment to a state where
// the staff member can check in. Does NOT create a work log — the
// normal check-in path will do that.
//
// Pre-conditions:
//   - assignment exists
//   - assignment.noShow === true
//   - no work log exists for the assignment (a work log means they
//     were actually checked in at some point)

export async function reinstateNoShow(
  assignmentId: string,
  now: Date = new Date()
): Promise<ReinstateResult> {
  const assignment = await loadAssignment(assignmentId)
  if (!assignment) {
    return { ok: false, status: 404, error: 'Assignment not found' }
  }

  if (!assignment.noShow) {
    return {
      ok: false,
      status: 400,
      error: 'Assignment is not marked no-show',
    }
  }

  const existingWorkLog = await getWorkLogByAssignmentId(assignmentId)
  if (existingWorkLog?.checkInTime) {
    return {
      ok: false,
      status: 409,
      error:
        'Cannot reinstate: a work log already exists for this assignment. The no-show is incorrect — fix the work log instead.',
    }
  }

  try {
    const assignments = await getAssignments()
    const next: StaffAssignment[] = assignments.map((a) =>
      a.id === assignmentId
        ? {
            ...a,
            noShow: false,
            status: 'assigned',
            updatedAt: now.toISOString(),
          }
        : a
    )
    await saveAssignments(next)
    const updated = next.find((a) => a.id === assignmentId)
    if (!updated) {
      return { ok: false, status: 500, error: 'Failed to reinstate assignment' }
    }
    return { ok: true, assignment: updated }
  } catch (err) {
    console.error('[reinstateNoShow] failed:', err)
    return { ok: false, status: 500, error: 'Failed to reinstate assignment' }
  }
}