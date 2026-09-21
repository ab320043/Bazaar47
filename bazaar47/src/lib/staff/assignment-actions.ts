// lib/staff/assignment-actions.ts
import {
  getAssignments,
  checkInStaff,
  checkOutStaff,
} from '@/lib/storage/staff-assignments'
import type { StaffAssignment } from '@/types/staff'

// ============================================
// RESULT TYPE
// ============================================

export type AssignmentActionResult =
  | { ok: true; assignment: StaffAssignment }
  | { ok: false; status: number; error: string }

// ============================================
// SHARED HELPERS
// ============================================

async function loadAssignment(
  assignmentId: string
): Promise<StaffAssignment | undefined> {
  const assignments = await getAssignments()
  return assignments.find((a) => a.id === assignmentId)
}

// ============================================
// CHECK IN
// ============================================

/**
 * Check a staff member into an assignment.
 *
 * @param assignmentId  The assignment to check in to.
 * @param expectedStaffId
 *   When provided, the assignment MUST belong to this staff member.
 *   If it does not, the call fails with 403. This is the ownership gate
 *   that prevents staff A from clocking in as staff B by guessing IDs.
 *   Admin callers pass `undefined` to allow acting on any assignment.
 */
export async function checkInAssignment(
  assignmentId: string,
  expectedStaffId?: string
): Promise<AssignmentActionResult> {
  const assignment = await loadAssignment(assignmentId)

  if (!assignment) {
    return { ok: false, status: 404, error: 'Assignment not found' }
  }

  // ---- OWNERSHIP GATE (defense in depth) ----
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

  if (assignment.checkInTime) {
    return { ok: false, status: 400, error: 'Staff already checked in' }
  }

  const updated = await checkInStaff(assignmentId)
  if (!updated) {
    return { ok: false, status: 500, error: 'Failed to check in staff' }
  }

  return { ok: true, assignment: updated }
}

// ============================================
// CHECK OUT
// ============================================

/**
 * Check a staff member out of an assignment.
 * Same ownership semantics as `checkInAssignment`.
 */
export async function checkOutAssignment(
  assignmentId: string,
  expectedStaffId?: string
): Promise<AssignmentActionResult> {
  const assignment = await loadAssignment(assignmentId)

  if (!assignment) {
    return { ok: false, status: 404, error: 'Assignment not found' }
  }

  // ---- OWNERSHIP GATE (defense in depth) ----
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

  if (assignment.checkOutTime) {
    return { ok: false, status: 400, error: 'Staff already checked out' }
  }

  if (!assignment.checkInTime) {
    return {
      ok: false,
      status: 400,
      error: 'Staff must be checked in first',
    }
  }

  const updated = await checkOutStaff(assignmentId)
  if (!updated) {
    return { ok: false, status: 500, error: 'Failed to check out staff' }
  }

  return { ok: true, assignment: updated }
}