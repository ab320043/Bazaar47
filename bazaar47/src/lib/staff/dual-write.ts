// lib/staff/dual-write.ts
//
// Phase 1 dual-write helper.
//
// Writes to BOTH StaffAssignment (legacy) and WorkLog (new source of
// truth for worked time). Phase 1.5 will delete this file and inline
// the work-log calls directly into the routes. Phase 2 will drop the
// StaffAssignment writes entirely.
//
// Keeping the dual-write isolated here means:
//   - Phase 1 routes stay simple (one call).
//   - Phase 2 has exactly one file to delete.
//   - If the work-log write ever fails, we log it and continue —
//     the StaffAssignment write is still authoritative for Phase 1.

import { updateAssignment } from '@/lib/storage/staff-assignments'
import {
  checkInForWorkLog,
  checkOutForWorkLog,
} from '@/lib/storage/staff-worklogs'
import type { StaffAssignment, StaffRole } from '@/types/staff'
import type { WorkLog } from '@/types/staff-worklog'

// ============================================
// HELPERS
// ============================================

function pickRole(assignment: StaffAssignment): StaffRole {
  return assignment.roles[0] || 'event-coordinator'
}

// ============================================
// CHECK IN
// ============================================

/**
 * Dual-write a check-in.
 *
 * Order of operations:
 *   1. Write StaffAssignment (legacy — the return value of the route
 *      is derived from this, so this MUST succeed).
 *   2. Write WorkLog (new — best-effort in Phase 1; a failure here is
 *      logged but doesn't fail the request).
 *
 * The cron's backfill sweep picks up any assignment that got a
 * check-in without a work log within 15 minutes, so the worst case
 * for a failed work-log write is a 15-minute lag.
 */
export async function dualWriteCheckIn(
  assignment: StaffAssignment,
  checkInTimeIso: string,
  payPeriod: { startIso: string; endIso: string }
): Promise<{ assignment: StaffAssignment; workLog: WorkLog | null }> {
  const updatedAssignment = await updateAssignment(assignment.id, {
    checkInTime: checkInTimeIso,
    status: 'checked-in',
  })

  if (!updatedAssignment) {
    throw new Error('Failed to update assignment on check-in')
  }

  let workLog: WorkLog | null = null
  try {
    workLog = await checkInForWorkLog({
      assignmentId: assignment.id,
      staffId: assignment.staffId,
      staffName: assignment.staffName,
      eventId: assignment.eventId,
      eventName: assignment.eventName,
      role: pickRole(assignment),
      hourlyRate: assignment.hourlyRate,
      shiftStart: assignment.shiftStart,
      shiftEnd: assignment.shiftEnd,
      payPeriodStartIso: payPeriod.startIso,
      payPeriodEndIso: payPeriod.endIso,
      checkInTime: checkInTimeIso,
    })
  } catch (err) {
    console.error(
      '[dual-write] work log check-in failed; cron will backfill:',
      { assignmentId: assignment.id, err }
    )
  }

  return { assignment: updatedAssignment, workLog }
}

// ============================================
// CHECK OUT
// ============================================

/**
 * Dual-write a check-out.
 *
 * Same ordering and failure semantics as `dualWriteCheckIn`.
 */
export async function dualWriteCheckOut(
  assignment: StaffAssignment,
  checkOutTimeIso: string,
  hoursWorked: number,
  payPeriod: { startIso: string; endIso: string }
): Promise<{ assignment: StaffAssignment; workLog: WorkLog | null }> {
  const updatedAssignment = await updateAssignment(assignment.id, {
    checkOutTime: checkOutTimeIso,
    hoursWorked,
    status: 'completed',
  })

  if (!updatedAssignment) {
    throw new Error('Failed to update assignment on check-out')
  }

  // Work log needs the check-in time, which the assignment carries.
  // If somehow it's missing, we can't compute hours — bail on the
  // work-log write and let the cron's backfill handle it. This should
  // never happen in normal flow.
  if (!assignment.checkInTime) {
    console.warn(
      '[dual-write] assignment has no checkInTime on check-out; skipping work log write:',
      { assignmentId: assignment.id }
    )
    return { assignment: updatedAssignment, workLog: null }
  }

  let workLog: WorkLog | null = null
  try {
    workLog = await checkOutForWorkLog({
      assignmentId: assignment.id,
      staffId: assignment.staffId,
      staffName: assignment.staffName,
      eventId: assignment.eventId,
      eventName: assignment.eventName,
      role: pickRole(assignment),
      hourlyRate: assignment.hourlyRate,
      shiftStart: assignment.shiftStart,
      shiftEnd: assignment.shiftEnd,
      payPeriodStartIso: payPeriod.startIso,
      payPeriodEndIso: payPeriod.endIso,
      checkInTime: assignment.checkInTime,
      checkOutTime: checkOutTimeIso,
      breakStart: assignment.breakStart || null,
      breakEnd: assignment.breakEnd || null,
    })
  } catch (err) {
    console.error(
      '[dual-write] work log check-out failed; cron will backfill:',
      { assignmentId: assignment.id, err }
    )
  }

  return { assignment: updatedAssignment, workLog }
}