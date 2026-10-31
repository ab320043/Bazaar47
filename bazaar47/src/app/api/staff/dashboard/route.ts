// app/api/staff/dashboard/route.ts
import { NextResponse } from 'next/server'
import { getCurrentStaff } from '@/lib/staff/auth'
import {
  getAssignmentsByStaff,
  getOtherAssignmentsForEvent,
} from '@/lib/storage/staff-assignments'
import { getWorkLogsForStaff } from '@/lib/storage/staff-worklogs'
import { getPeriodForDate } from '@/lib/staff/payroll-period'
import type {
  StaffAssignment,
  StaffRole,
} from '@/types/staff'
import type { WorkLog } from '@/types/staff-worklog'

// ============================================
// TYPES
// ============================================

export interface CoworkerOnShift {
  staffId: string
  staffName: string
  roles: StaffRole[]
}

export interface ShiftWithCoworkers {
  assignment: StaffAssignment
  coworkers: CoworkerOnShift[]
}

interface PastShift {
  assignmentId: string
  eventId: string
  eventName: string
  shiftStart: string
  shiftEnd: string
  hoursWorked: number
  hourlyRate: number
  amountOwed: number
  resolution: 'manual' | 'auto-close' | 'admin-edit'
  needsReview: boolean
}

interface Stats {
  hoursThisPeriod: number
  earnedThisPeriod: number
  hoursThisMonth: number
  earnedThisMonth: number
  hoursAllTime: number
  earnedAllTime: number
  upcomingCount: number
}

// ============================================
// HELPERS
// ============================================

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

/**
 * Merge an assignment's plan fields with its work log's actual hours,
 * so callers see one consistent shape. If no work log exists yet,
 * the times/hours are null/0.
 */
function enrichAssignmentWithWorkLog(
  assignment: StaffAssignment,
  workLog: WorkLog | undefined
): StaffAssignment {
  return {
    ...assignment,
    checkInTime: workLog?.checkInTime || undefined,
    checkOutTime: workLog?.checkOutTime || undefined,
    hoursWorked: workLog?.hoursWorked,
  }
}

async function enrichWithCoworkers(
  assignment: StaffAssignment,
  selfStaffId: string
): Promise<ShiftWithCoworkers> {
  const others = await getOtherAssignmentsForEvent(
    assignment.eventId,
    selfStaffId
  )
  const coworkers: CoworkerOnShift[] = others.map((a) => ({
    staffId: a.staffId,
    staffName: a.staffName,
    roles: a.roles,
  }))
  return { assignment, coworkers }
}

function computeStats(
  assignments: StaffAssignment[],
  workLogs: WorkLog[],
  upcomingCount: number
): Stats {
  const now = new Date()
  const period = getPeriodForDate(now)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  let hoursThisPeriod = 0
  let earnedThisPeriod = 0
  let hoursThisMonth = 0
  let earnedThisMonth = 0
  let hoursAllTime = 0
  let earnedAllTime = 0

  for (const w of workLogs) {
    hoursAllTime += w.hoursWorked
    earnedAllTime += w.amountOwed

    if (
      w.payPeriodStartIso >= period.startIso &&
      w.payPeriodStartIso <= period.endIso
    ) {
      hoursThisPeriod += w.hoursWorked
      earnedThisPeriod += w.amountOwed
    }

    const shiftDate = new Date(w.shiftStart)
    if (shiftDate >= startOfMonth) {
      hoursThisMonth += w.hoursWorked
      earnedThisMonth += w.amountOwed
    }
  }

  return {
    hoursThisPeriod: round2(hoursThisPeriod),
    earnedThisPeriod: round2(earnedThisPeriod),
    hoursThisMonth: round2(hoursThisMonth),
    earnedThisMonth: round2(earnedThisMonth),
    hoursAllTime: round2(hoursAllTime),
    earnedAllTime: round2(earnedAllTime),
    upcomingCount,
  }
}

// ============================================
// ROUTE
// ============================================

export async function GET() {
  try {
    const currentStaffSession = await getCurrentStaff()
    if (!currentStaffSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [assignments, workLogs] = await Promise.all([
      getAssignmentsByStaff(currentStaffSession.staff.id),
      getWorkLogsForStaff(currentStaffSession.staff.id),
    ])

    // Index work logs by assignmentId for O(1) enrichment.
    const workLogByAssignment = new Map<string, WorkLog>()
    for (const w of workLogs) {
      if (w.assignmentId) workLogByAssignment.set(w.assignmentId, w)
    }

    const now = new Date()

    // Upcoming: plan records in the future, not cancelled, no work log
    // with a checkOutTime yet. If a work log exists with a checkInTime
    // but no checkOutTime, it's "current" not "upcoming".
    const upcoming = assignments
      .filter((a) => {
        if (a.status === 'cancelled') return false
        const start = new Date(a.shiftStart)
        if (start <= now) return false
        return true
      })
      .sort(
        (a, b) =>
          new Date(a.shiftStart).getTime() - new Date(b.shiftStart).getTime()
      )
      .map((a) => enrichAssignmentWithWorkLog(a, workLogByAssignment.get(a.id)))

    // Current: an open work log (checked in, not checked out) regardless
    // of the assignment's plan window. A shift can run long; the work
    // log is the truth.
    const currentWorkLog = workLogs.find(
      (w) => w.checkInTime && !w.checkOutTime
    )
    const currentAssignment = currentWorkLog?.assignmentId
      ? assignments.find((a) => a.id === currentWorkLog.assignmentId)
      : undefined
    const current = currentAssignment
      ? enrichAssignmentWithWorkLog(currentAssignment, currentWorkLog)
      : undefined

    // Past: work logs that are closed (checkOutTime set). Assignments
    // without a work log are not "past" — they were never worked.
    const past: PastShift[] = workLogs
      .filter((w) => !!w.checkOutTime)
      .sort((a, b) => {
        const aT = a.checkOutTime ? new Date(a.checkOutTime).getTime() : 0
        const bT = b.checkOutTime ? new Date(b.checkOutTime).getTime() : 0
        return bT - aT
      })
      .map((w) => ({
        assignmentId: w.assignmentId || '',
        eventId: w.eventId,
        eventName: w.eventName,
        shiftStart: w.shiftStart,
        shiftEnd: w.shiftEnd,
        hoursWorked: w.hoursWorked,
        hourlyRate: w.hourlyRate,
        amountOwed: w.amountOwed,
        resolution: w.resolution,
        needsReview: w.needsReview,
      }))

    // Coworkers for the current + upcoming shifts
    const upcomingWithCoworkers: ShiftWithCoworkers[] = await Promise.all(
      upcoming.map((a) => enrichWithCoworkers(a, currentStaffSession.staff.id))
    )
    const currentWithCoworkers = current
      ? await enrichWithCoworkers(current, currentStaffSession.staff.id)
      : undefined

    const stats = computeStats(assignments, workLogs, upcoming.length)

    return NextResponse.json({
      staff: currentStaffSession.staff,
      mustChangePassword: currentStaffSession.mustChangePassword,
      upcoming,
      upcomingWithCoworkers,
      past,
      current,
      currentWithCoworkers,
      stats,
    })
  } catch (error) {
    console.error('Error fetching staff dashboard:', error)
    return NextResponse.json(
      { error: 'Failed to fetch staff dashboard' },
      { status: 500 }
    )
  }
}