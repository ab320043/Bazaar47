// lib/staff/reconcile.ts
import {
  getAssignments,
  saveAssignments,
} from '@/lib/storage/staff-assignments'
import {
  createWorkLog,
  getWorkLogByAssignmentId,
  updateWorkLog,
} from '@/lib/storage/staff-worklogs'
import { getPeriodForDate } from '@/lib/staff/payroll-period'
import { Redis } from '@upstash/redis'
import type { StaffAssignment, StaffRole } from '@/types/staff'

const redis = Redis.fromEnv()
const RUNS_KEY = 'staff_reconcile_runs'
const MAX_RUNS_KEPT = 500

// ============================================
// DEFAULTS
// ============================================

const DEFAULT_GRACE_HOURS = 1
const DEFAULT_NO_SHOW_MINUTES = 30

// ============================================
// TYPES
// ============================================

export interface ReconcileRunRecord {
  ranAt: string
  dryRun: boolean
  noShowCount: number
  autoClosedCount: number
  backfilledCount: number
  errors: string[]
}

// ============================================
// HELPERS
// ============================================

function pickRole(assignment: StaffAssignment): StaffRole {
  // Phase 2 will always have exactly one role via claim.
  // Phase 0 assignments may have multiple — pick the first.
  return assignment.roles[0] || 'event-coordinator'
}

function deriveBreakHours(assignment: StaffAssignment): number {
  if (!assignment.breakStart || !assignment.breakEnd) return 0
  const s = new Date(assignment.breakStart).getTime()
  const e = new Date(assignment.breakEnd).getTime()
  if (Number.isNaN(s) || Number.isNaN(e) || e <= s) return 0
  return (e - s) / (1000 * 60 * 60)
}

function computeHoursWorked(
  checkInIso: string,
  checkOutIso: string,
  breakHours: number
): number {
  const s = new Date(checkInIso).getTime()
  const e = new Date(checkOutIso).getTime()
  if (Number.isNaN(s) || Number.isNaN(e) || e <= s) return 0
  const gross = (e - s) / (1000 * 60 * 60)
  return Math.max(0, Math.round((gross - breakHours) * 100) / 100)
}

// ============================================
// STEP 1 — NO-SHOW SWEEP
// ============================================
//
// Assignments where:
//   - status === 'checked-in'
//   - no checkInTime
//   - now > shiftStart + noShowMinutes
//
// Action: mark assignment.noShow = true. No work log created.

async function sweepNoShows(
  assignments: StaffAssignment[],
  now: number,
  dryRun: boolean
): Promise<{ mutated: StaffAssignment[]; count: number }> {
  const touched: StaffAssignment[] = []
  let count = 0

  for (const a of assignments) {
    if (a.status !== 'checked-in') continue
    if (a.checkInTime) continue
    if (a.noShow) continue // already marked

    const shiftStartMs = new Date(a.shiftStart).getTime()
    if (Number.isNaN(shiftStartMs)) continue

    const tolerance = DEFAULT_NO_SHOW_MINUTES * 60 * 1000
    if (now <= shiftStartMs + tolerance) continue

    const next: StaffAssignment = { ...a, noShow: true }
    touched.push(next)
    count++

    if (!dryRun) {
      console.log('[reconcile] no-show:', {
        assignmentId: a.id,
        staffId: a.staffId,
        eventId: a.eventId,
      })
    }
  }

  return { mutated: touched, count }
}

// ============================================
// STEP 2 — AUTO-CLOSE SWEEP
// ============================================
//
// Assignments where:
//   - status === 'checked-in'
//   - checkInTime exists
//   - no checkOutTime
//   - now > shiftEnd + graceHours
//
// Action: create/update work log with checkOutTime = shiftEnd.

async function sweepAutoClose(
  assignments: StaffAssignment[],
  now: number,
  dryRun: boolean
): Promise<{ mutated: StaffAssignment[]; count: number }> {
  const touched: StaffAssignment[] = []
  let count = 0

  for (const a of assignments) {
    if (a.status !== 'checked-in') continue
    if (!a.checkInTime) continue
    if (a.checkOutTime) continue

    const shiftEndMs = new Date(a.shiftEnd).getTime()
    if (Number.isNaN(shiftEndMs)) continue

    const graceMs = DEFAULT_GRACE_HOURS * 60 * 60 * 1000
    if (now <= shiftEndMs + graceMs) continue

    // Auto-close at shiftEnd, not now.
    const checkOutIso = a.shiftEnd
    const breakHours = deriveBreakHours(a)
    const hoursWorked = computeHoursWorked(a.checkInTime, checkOutIso, breakHours)
    const amountOwed = Math.round(hoursWorked * a.hourlyRate * 100) / 100

    const period = getPeriodForDate(new Date(a.shiftStart))
    const role = pickRole(a)

    if (!dryRun) {
      const existing = await getWorkLogByAssignmentId(a.id)

      if (existing) {
        await updateWorkLog(existing.id, {
          checkOutTime: checkOutIso,
          needsReview: true,
          resolution: 'auto-close',
          autoCloseReason: 'forgot-checkout',
        })
      } else {
        await createWorkLog({
          assignmentId: a.id,
          staffId: a.staffId,
          staffName: a.staffName,
          eventId: a.eventId,
          eventName: a.eventName,
          role,
          hourlyRate: a.hourlyRate,
          shiftStart: a.shiftStart,
          shiftEnd: a.shiftEnd,
          timeZone: 'America/New_York',
          checkInTime: a.checkInTime,
          checkOutTime: checkOutIso,
          breakStart: a.breakStart || null,
          breakEnd: a.breakEnd || null,
          breakHours: Math.round(breakHours * 100) / 100,
          hoursWorked,
          amountOwed,
          payPeriodStartIso: period.startIso,
          payPeriodEndIso: period.endIso,
          resolution: 'auto-close',
          autoCloseReason: 'forgot-checkout',
          needsReview: true,
          editedBy: null,
          editedAt: null,
          editReason: null,
        })
      }
    }

    const next: StaffAssignment = {
      ...a,
      status: 'completed',
      checkOutTime: checkOutIso,
      hoursWorked,
      needsReview: true,
    }
    touched.push(next)
    count++

    if (!dryRun) {
      console.log('[reconcile] auto-close:', {
        assignmentId: a.id,
        staffId: a.staffId,
        eventId: a.eventId,
        hoursWorked,
      })
    }
  }

  return { mutated: touched, count }
}

// ============================================
// STEP 3 — BACKFILL SWEEP
// ============================================
//
// Assignments where:
//   - status === 'completed'
//   - checkOutTime exists
//   - no existing work log
//
// Action: create work log with resolution = 'manual'.

async function sweepBackfill(
  assignments: StaffAssignment[],
  dryRun: boolean
): Promise<number> {
  let count = 0

  for (const a of assignments) {
    if (a.status !== 'completed') continue
    if (!a.checkOutTime) continue

    if (!dryRun) {
      const existing = await getWorkLogByAssignmentId(a.id)
      if (existing) continue
    }

    if (!a.checkInTime) {
      // Completed but no check-in — skip backfill. Odd data; flag in errors.
      if (!dryRun) {
        console.warn('[reconcile] completed assignment with no checkInTime:', a.id)
      }
      continue
    }

    const breakHours = deriveBreakHours(a)
    const hoursWorked =
      typeof a.hoursWorked === 'number'
        ? a.hoursWorked
        : computeHoursWorked(a.checkInTime, a.checkOutTime, breakHours)
    const amountOwed = Math.round(hoursWorked * a.hourlyRate * 100) / 100

    const period = getPeriodForDate(new Date(a.shiftStart))
    const role = pickRole(a)

    if (!dryRun) {
      await createWorkLog({
        assignmentId: a.id,
        staffId: a.staffId,
        staffName: a.staffName,
        eventId: a.eventId,
        eventName: a.eventName,
        role,
        hourlyRate: a.hourlyRate,
        shiftStart: a.shiftStart,
        shiftEnd: a.shiftEnd,
        timeZone: 'America/New_York',
        checkInTime: a.checkInTime,
        checkOutTime: a.checkOutTime,
        breakStart: a.breakStart || null,
        breakEnd: a.breakEnd || null,
        breakHours: Math.round(breakHours * 100) / 100,
        hoursWorked,
        amountOwed,
        payPeriodStartIso: period.startIso,
        payPeriodEndIso: period.endIso,
        resolution: 'manual',
        autoCloseReason: null,
        needsReview: false,
        editedBy: null,
        editedAt: null,
        editReason: null,
      })
    }

    count++
  }

  return count
}

// ============================================
// ORCHESTRATOR
// ============================================

export async function runReconcile(opts: {
  dryRun?: boolean
} = {}): Promise<ReconcileRunRecord> {
  const dryRun = opts.dryRun === true
  const now = Date.now()
  const errors: string[] = []

  const record: ReconcileRunRecord = {
    ranAt: new Date().toISOString(),
    dryRun,
    noShowCount: 0,
    autoClosedCount: 0,
    backfilledCount: 0,
    errors,
  }

  let assignments: StaffAssignment[] = []
  try {
    assignments = await getAssignments()
  } catch (err) {
    errors.push(`getAssignments failed: ${String(err)}`)
    await recordRun(record)
    return record
  }

  // ---- Step 1: no-show sweep ----
  let noShowMutated: StaffAssignment[] = []
  try {
    const result = await sweepNoShows(assignments, now, dryRun)
    noShowMutated = result.mutated
    record.noShowCount = result.count
  } catch (err) {
    errors.push(`no-show sweep failed: ${String(err)}`)
  }

  // ---- Step 2: auto-close sweep ----
  //
  // IMPORTANT: run this against the list AFTER applying no-show mutations,
  // so a no-show is not double-processed by auto-close. In dry-run, the
  // touched list is only used for counting, so we still merge it for
  // correctness of the dry-run report.
  let autoCloseMutated: StaffAssignment[] = []
  try {
    const workingList = applyMutations(assignments, noShowMutated)
    const result = await sweepAutoClose(workingList, now, dryRun)
    autoCloseMutated = result.mutated
    record.autoClosedCount = result.count
  } catch (err) {
    errors.push(`auto-close sweep failed: ${String(err)}`)
  }

  // ---- Step 3: backfill sweep ----
  try {
    const workingList = applyMutations(
      assignments,
      [...noShowMutated, ...autoCloseMutated]
    )
    const count = await sweepBackfill(workingList, dryRun)
    record.backfilledCount = count
  } catch (err) {
    errors.push(`backfill sweep failed: ${String(err)}`)
  }

  // ---- Persist assignment mutations ----
  if (!dryRun) {
    try {
      const finalList = applyMutations(assignments, [
        ...noShowMutated,
        ...autoCloseMutated,
      ])
      // Only save if something actually changed.
      if (noShowMutated.length > 0 || autoCloseMutated.length > 0) {
        await saveAssignments(finalList)
      }
    } catch (err) {
      errors.push(`saveAssignments failed: ${String(err)}`)
    }
  }

  await recordRun(record)
  return record
}

function applyMutations(
  base: StaffAssignment[],
  mutated: StaffAssignment[]
): StaffAssignment[] {
  const byId = new Map(mutated.map((a) => [a.id, a]))
  return base.map((a) => byId.get(a.id) ?? a)
}

// ============================================
// RUN HISTORY
// ============================================

async function recordRun(record: ReconcileRunRecord): Promise<void> {
  try {
    const raw = await redis.get(RUNS_KEY)
    const runs = (raw as ReconcileRunRecord[]) || []
    const next = [...runs, record].slice(-MAX_RUNS_KEPT)
    await redis.set(RUNS_KEY, next)
  } catch (err) {
    console.error('[reconcile] failed to record run:', err)
  }
}

export async function getRecentRuns(limit = 10): Promise<ReconcileRunRecord[]> {
  try {
    const raw = await redis.get(RUNS_KEY)
    const runs = (raw as ReconcileRunRecord[]) || []
    return runs.slice(-limit).reverse()
  } catch (err) {
    console.error('[reconcile] failed to read runs:', err)
    return []
  }
}