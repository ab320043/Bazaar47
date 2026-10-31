// lib/storage/staff-worklogs.ts
import { Redis } from '@upstash/redis'
import type {
  WorkLog,
  WorkLogAuditEntry,
  AutoCloseReason,
} from '@/types/staff-worklog'
import type { StaffRole } from '@/types/staff'


const redis = Redis.fromEnv()
const WORK_LOGS_KEY = 'staff_work_logs'

type WorkLogsMap = Record<string, WorkLog>

// ============================================
// READ
// ============================================

async function getMap(): Promise<WorkLogsMap> {
  try {
    const raw = await redis.get(WORK_LOGS_KEY)
    return (raw as WorkLogsMap) || {}
  } catch (error) {
    console.error('Redis get error (staff_work_logs):', error)
    return {}
  }
}

async function saveMap(map: WorkLogsMap): Promise<void> {
  try {
    await redis.set(WORK_LOGS_KEY, map)
  } catch (error) {
    console.error('Redis set error (staff_work_logs):', error)
    throw new Error('Failed to save work logs')
  }
}

export async function getAllWorkLogs(): Promise<WorkLog[]> {
  const map = await getMap()
  return Object.values(map)
}

export async function getWorkLogById(id: string): Promise<WorkLog | undefined> {
  const map = await getMap()
  return map[id]
}

export async function getWorkLogByAssignmentId(
  assignmentId: string
): Promise<WorkLog | undefined> {
  const map = await getMap()
  return Object.values(map).find((w) => w.assignmentId === assignmentId)
}

export async function getWorkLogsForStaff(staffId: string): Promise<WorkLog[]> {
  const map = await getMap()
  return Object.values(map).filter((w) => w.staffId === staffId)
}

export async function getWorkLogsNeedingReview(): Promise<WorkLog[]> {
  const map = await getMap()
  return Object.values(map).filter((w) => w.needsReview)
}

export async function getWorkLogsByPeriod(
  startIso: string,
  endIso: string
): Promise<WorkLog[]> {
  const map = await getMap()
  return Object.values(map).filter(
    (w) => w.payPeriodStartIso >= startIso && w.payPeriodStartIso <= endIso
  )
}

// ============================================
// CREATE
// ============================================

export async function createWorkLog(
  input: Omit<WorkLog, 'id' | 'createdAt' | 'updatedAt' | 'auditTrail'>
): Promise<WorkLog> {
  const map = await getMap()
  const now = new Date().toISOString()
  const workLog: WorkLog = {
    ...input,
    id: crypto.randomUUID(),
    auditTrail: [],
    createdAt: now,
    updatedAt: now,
  }
  map[workLog.id] = workLog
  await saveMap(map)
  return workLog
}

// ============================================
// UPDATE
// ============================================

interface UpdateWorkLogInput {
  hoursWorked?: number
  checkOutTime?: string
  breakStart?: string | null
  breakEnd?: string | null
  /** Required for admin-edit and any resolution-changing edit. */
  editedBy?: string
  editReason?: string
  /** Whether to mark the work log reviewed. */
  needsReview?: boolean
  /** When set, replaces the resolution. */
  resolution?: 'manual' | 'auto-close' | 'admin-edit'
  autoCloseReason?: AutoCloseReason | null
}

export async function updateWorkLog(
  id: string,
  updates: UpdateWorkLogInput
): Promise<WorkLog | undefined> {
  const map = await getMap()
  const existing = map[id]
  if (!existing) return undefined

  const before: Record<string, unknown> = {
    hoursWorked: existing.hoursWorked,
    checkOutTime: existing.checkOutTime,
    breakStart: existing.breakStart,
    breakEnd: existing.breakEnd,
    resolution: existing.resolution,
    needsReview: existing.needsReview,
  }

  // Compute breakHours if either break field changed.
  let breakHours = existing.breakHours
  if (updates.breakStart !== undefined || updates.breakEnd !== undefined) {
    const bs = updates.breakStart !== undefined ? updates.breakStart : existing.breakStart
    const be = updates.breakEnd !== undefined ? updates.breakEnd : existing.breakEnd
    if (bs && be) {
      const s = new Date(bs).getTime()
      const e = new Date(be).getTime()
      breakHours = e > s ? Math.max(0, (e - s) / (1000 * 60 * 60)) : 0
    } else {
      breakHours = 0
    }
  }

  // Recompute hours if checkOutTime changed OR explicit hoursWorked provided.
  let hoursWorked = existing.hoursWorked
  if (updates.hoursWorked !== undefined) {
    hoursWorked = Math.max(0, updates.hoursWorked)
  } else if (updates.checkOutTime !== undefined || updates.breakStart !== undefined || updates.breakEnd !== undefined) {
    const checkInIso = existing.checkInTime
    const checkOutIso = updates.checkOutTime !== undefined ? updates.checkOutTime : existing.checkOutTime
    if (checkInIso && checkOutIso) {
      const s = new Date(checkInIso).getTime()
      const e = new Date(checkOutIso).getTime()
      if (e > s) {
        const gross = (e - s) / (1000 * 60 * 60)
        hoursWorked = Math.max(0, Math.round((gross - breakHours) * 100) / 100)
      }
    }
  }

  const amountOwed = Math.round(hoursWorked * existing.hourlyRate * 100) / 100

  const after: Record<string, unknown> = {
    hoursWorked,
    checkOutTime: updates.checkOutTime !== undefined ? updates.checkOutTime : existing.checkOutTime,
    breakStart: updates.breakStart !== undefined ? updates.breakStart : existing.breakStart,
    breakEnd: updates.breakEnd !== undefined ? updates.breakEnd : existing.breakEnd,
    resolution: updates.resolution ?? existing.resolution,
    needsReview: updates.needsReview !== undefined ? updates.needsReview : existing.needsReview,
  }

  const auditEntry: WorkLogAuditEntry | null =
    updates.editReason && updates.editedBy
      ? {
          at: new Date().toISOString(),
          by: updates.editedBy,
          before,
          after,
          reason: updates.editReason,
        }
      : null

  const updated: WorkLog = {
    ...existing,
    hoursWorked,
    amountOwed,
    checkOutTime: after.checkOutTime as string | null,
    breakStart: after.breakStart as string | null,
    breakEnd: after.breakEnd as string | null,
    breakHours: Math.round(breakHours * 100) / 100,
    resolution: (after.resolution as WorkLog['resolution']),
    autoCloseReason:
      updates.autoCloseReason !== undefined
        ? updates.autoCloseReason
        : existing.autoCloseReason,
    needsReview: updates.needsReview !== undefined ? updates.needsReview : existing.needsReview,
    editedBy: updates.editedBy ?? existing.editedBy,
    editedAt: updates.editReason ? new Date().toISOString() : existing.editedAt,
    editReason: updates.editReason ?? existing.editReason,
    auditTrail: auditEntry ? [...existing.auditTrail, auditEntry] : existing.auditTrail,
    updatedAt: new Date().toISOString(),
  }

  map[id] = updated
  await saveMap(map)
  return updated
}

// ============================================
// DELETE (rare — only for cleanup)
// ============================================

export async function deleteWorkLog(id: string): Promise<boolean> {
  const map = await getMap()
  if (!(id in map)) return false
  delete map[id]
  await saveMap(map)
  return true
}

// ============================================
// PHASE 1 — CHECK-IN / CHECK-OUT HELPERS
// ============================================

/**
 * Record a check-in for a staff assignment.
 *
 * If a work log already exists for this assignment (auto-created by the
 * cron during a prior pass, or by a previous check-in), update it in
 * place. Otherwise create a fresh one with the assignment's snapshot
 * fields.
 *
 * Never overwrites checkInTime if it's already set — the caller (the
 * check-in route) is responsible for rejecting double check-ins.
 */
export async function checkInForWorkLog(params: {
  assignmentId: string
  staffId: string
  staffName: string
  eventId: string
  eventName: string
  role: StaffRole
  hourlyRate: number
  shiftStart: string
  shiftEnd: string
  payPeriodStartIso: string
  payPeriodEndIso: string
  checkInTime: string
}): Promise<WorkLog> {
  const existing = await getWorkLogByAssignmentId(params.assignmentId)

  if (existing) {
    if (existing.checkInTime) {
      // Already checked in — no-op, return as-is. The route enforces
      // this; the helper is defensive.
      return existing
    }
    const updated = await updateWorkLog(existing.id, {
      // We're not changing hours yet, only recording the check-in.
      // updateWorkLog only recomputes hours when checkOutTime changes.
      // For check-in, use a direct edit that doesn't touch hours.
      breakStart: existing.breakStart,
      breakEnd: existing.breakEnd,
    })
    // updateWorkLog doesn't expose checkInTime in its update input
    // (by design — check-in is a one-time event). So we write it
    // through a dedicated call below.
    return await setWorkLogCheckIn(existing.id, params.checkInTime) || updated || existing
  }

  const created = await createWorkLog({
    assignmentId: params.assignmentId,
    staffId: params.staffId,
    staffName: params.staffName,
    eventId: params.eventId,
    eventName: params.eventName,
    role: params.role,
    hourlyRate: params.hourlyRate,
    shiftStart: params.shiftStart,
    shiftEnd: params.shiftEnd,
    timeZone: 'America/New_York',
    checkInTime: params.checkInTime,
    checkOutTime: null,
    breakStart: null,
    breakEnd: null,
    breakHours: 0,
    hoursWorked: 0,
    amountOwed: 0,
    payPeriodStartIso: params.payPeriodStartIso,
    payPeriodEndIso: params.payPeriodEndIso,
    resolution: 'manual',
    autoCloseReason: null,
    needsReview: false,
    editedBy: null,
    editedAt: null,
    editReason: null,
  })

  return created
}

/**
 * Internal helper: set checkInTime on an existing work log without
 * touching hours/amount.
 *
 * Why this exists: updateWorkLog's input shape doesn't allow mutating
 * checkInTime because the check-in is a one-time event that shouldn't
 * be editable through the admin correction flow. This narrow helper
 * gives the check-in route a way to populate it on a work log the
 * cron created before the assignment was checked in.
 */
async function setWorkLogCheckIn(
  id: string,
  checkInTime: string
): Promise<WorkLog | undefined> {
  const map = await getMap()
  const existing = map[id]
  if (!existing) return undefined
  if (existing.checkInTime) return existing

  const updated: WorkLog = {
    ...existing,
    checkInTime,
    updatedAt: new Date().toISOString(),
  }
  map[id] = updated
  await saveMap(map)
  return updated
}

/**
 * Record a check-out for a staff assignment.
 *
 * Computes hoursWorked and amountOwed from checkInTime → checkOutTime,
 * subtracting logged break time. Creates a work log if one doesn't
 * exist yet (which shouldn't happen in Phase 1, but defends against
 * the assignment having been checked in via a path that didn't dual-
 * write — e.g. an admin directly editing StaffAssignment in Redis).
 */
export async function checkOutForWorkLog(params: {
  assignmentId: string
  staffId: string
  staffName: string
  eventId: string
  eventName: string
  role: StaffRole
  hourlyRate: number
  shiftStart: string
  shiftEnd: string
  payPeriodStartIso: string
  payPeriodEndIso: string
  checkInTime: string
  checkOutTime: string
  breakStart: string | null
  breakEnd: string | null
}): Promise<WorkLog> {
  const existing = await getWorkLogByAssignmentId(params.assignmentId)

  if (existing) {
    const updated = await updateWorkLog(existing.id, {
      checkOutTime: params.checkOutTime,
      breakStart: params.breakStart,
      breakEnd: params.breakEnd,
    })
    if (updated) return updated
    return existing
  }

  // No work log — create one directly. Use the same math as updateWorkLog
  // so the two paths can't diverge.
  const breakHours = (() => {
    if (!params.breakStart || !params.breakEnd) return 0
    const s = new Date(params.breakStart).getTime()
    const e = new Date(params.breakEnd).getTime()
    if (Number.isNaN(s) || Number.isNaN(e) || e <= s) return 0
    return (e - s) / (1000 * 60 * 60)
  })()

  const checkInMs = new Date(params.checkInTime).getTime()
  const checkOutMs = new Date(params.checkOutTime).getTime()
  const gross =
    Number.isFinite(checkInMs) && Number.isFinite(checkOutMs) && checkOutMs > checkInMs
      ? (checkOutMs - checkInMs) / (1000 * 60 * 60)
      : 0
  const hoursWorked = Math.max(0, Math.round((gross - breakHours) * 100) / 100)
  const amountOwed = Math.round(hoursWorked * params.hourlyRate * 100) / 100

  const created = await createWorkLog({
    assignmentId: params.assignmentId,
    staffId: params.staffId,
    staffName: params.staffName,
    eventId: params.eventId,
    eventName: params.eventName,
    role: params.role,
    hourlyRate: params.hourlyRate,
    shiftStart: params.shiftStart,
    shiftEnd: params.shiftEnd,
    timeZone: 'America/New_York',
    checkInTime: params.checkInTime,
    checkOutTime: params.checkOutTime,
    breakStart: params.breakStart,
    breakEnd: params.breakEnd,
    breakHours: Math.round(breakHours * 100) / 100,
    hoursWorked,
    amountOwed,
    payPeriodStartIso: params.payPeriodStartIso,
    payPeriodEndIso: params.payPeriodEndIso,
    resolution: 'manual',
    autoCloseReason: null,
    needsReview: false,
    editedBy: null,
    editedAt: null,
    editReason: null,
  })

  return created
}

// ============================================
// PHASE 1.5 — DASHBOARD / PAYROLL HELPERS
// ============================================

/**
 * All work logs for a staff member whose pay period overlaps the given
 * range. Used by the staff payroll page to navigate periods.
 */
export async function getWorkLogsByStaffAndPeriod(
  staffId: string,
  periodStartIso: string,
  periodEndIso: string
): Promise<WorkLog[]> {
  const all = await getWorkLogsForStaff(staffId)
  return all.filter(
    (w) =>
      w.payPeriodStartIso >= periodStartIso &&
      w.payPeriodStartIso <= periodEndIso
  )
}

/**
 * Work logs for a staff member, sorted newest first. Used by the staff
 * dashboard "past shifts" section.
 */
export async function getWorkLogsForStaffSorted(
  staffId: string
): Promise<WorkLog[]> {
  const logs = await getWorkLogsForStaff(staffId)
  return [...logs].sort((a, b) => {
    const aT = a.checkInTime ? new Date(a.checkInTime).getTime() : 0
    const bT = b.checkInTime ? new Date(b.checkInTime).getTime() : 0
    return bT - aT
  })
}