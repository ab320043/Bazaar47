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
import {
  getAllClaims,
  updateClaim,
} from '@/lib/storage/staff-claims'
import { getPeriodForDate } from '@/lib/staff/payroll-period'
import { cascadeWaitlist } from '@/lib/staff/claim-actions'
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
  /** Phase 3B: number of waitlisted claims whose 12h window expired. */
  waitlistExpiredCount: number
  errors: string[]
}

// ============================================
// HELPERS
// ============================================

function pickRole(assignment: StaffAssignment): StaffRole {
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
      void (async () => {
        try {
          const { getStaffById } = await import('@/lib/storage/staff')
          const { notifyAutoClosed } = await import('@/lib/email/notify')
          const staff = await getStaffById(a.staffId)
          if (staff?.email) {
            notifyAutoClosed(
              a.staffName,
              staff.email,
              a.eventName,
              hoursWorked,
              a.shiftEnd
            )
          }
        } catch (err) {
          console.error('[reconcile] auto-close notify failed:', err)
        }
      })()
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
// STEP 4 — WAITLIST EXPIRY SWEEP (Phase 3B)
// ============================================
//
// Runs AFTER the three assignment sweeps (ordering is load-bearing
// per the project invariants). A waitlisted claim whose 12h window
// has passed is released (status → 'released', releaseReason →
// 'admin'), and the offer's next pending claim is promoted via
// cascadeWaitlist.
//
// Releasing (rather than requeueing) is the locked decision: the
// staffer was offered the slot and did not reconfirm in time, so the
// slot goes public.

async function sweepWaitlistExpiry(
  now: number,
  dryRun: boolean
): Promise<number> {
  let count = 0

  const claims = await getAllClaims()
  const expired = claims.filter(
    (c) =>
      c.status === 'waitlisted' &&
      !!c.waitlistExpiresAt &&
      new Date(c.waitlistExpiresAt).getTime() <= now
  )

  for (const c of expired) {
    if (!dryRun) {
      try {
        await updateClaim(c.id, {
          status: 'released',
          releaseReason: 'admin',
          releasedAt: new Date(now).toISOString(),
          waitlistOfferedAt: undefined,
          waitlistExpiresAt: undefined,
        })
      } catch (err) {
        console.error('[reconcile] waitlist release failed:', c.id, err)
        continue
      }

      // Advance the queue.
      try {
        const promoted = await cascadeWaitlist(c.offerId, new Date(now))
        if (promoted) {
          void (async () => {
            try {
              const { getStaffById } = await import('@/lib/storage/staff')
              const { notifyWaitlistOffered } = await import('@/lib/email/notify')
              const staffRecord = await getStaffById(promoted.staffId)
              const { getOfferById } = await import('@/lib/storage/shift-offers')
              const offer = await getOfferById(promoted.offerId)
              if (staffRecord?.email && offer) {
                notifyWaitlistOffered(promoted, offer, staffRecord.email)
              }
            } catch (err) {
              console.error('[reconcile] waitlist promote notify failed:', err)
            }
          })()
        }
      } catch (err) {
        console.error('[reconcile] cascade after expiry failed:', c.id, err)
      }
    }

    count++

    if (!dryRun) {
      console.log('[reconcile] waitlist expired:', {
        claimId: c.id,
        staffId: c.staffId,
        offerId: c.offerId,
      })
    }
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
    waitlistExpiredCount: 0,
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

  // ---- Step 4: waitlist expiry sweep (Phase 3B) ----
  // Runs last. Must NOT depend on assignment mutations.
  try {
    const count = await sweepWaitlistExpiry(now, dryRun)
    record.waitlistExpiredCount = count
  } catch (err) {
    errors.push(`waitlist expiry sweep failed: ${String(err)}`)
  }

  // ---- Persist assignment mutations ----
  if (!dryRun) {
    try {
      const finalList = applyMutations(assignments, [
        ...noShowMutated,
        ...autoCloseMutated,
      ])
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