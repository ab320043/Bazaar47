// lib/storage/staff-worklogs.ts
import { Redis } from '@upstash/redis'
import type {
  WorkLog,
  WorkLogAuditEntry,
  AutoCloseReason,
} from '@/types/staff-worklog'

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