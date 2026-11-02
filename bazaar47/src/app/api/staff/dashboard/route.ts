// app/api/staff/dashboard/route.ts
import { NextResponse } from 'next/server'
import { getCurrentStaff } from '@/lib/staff/auth'
import {
  getAssignmentsByStaff,
  getOtherAssignmentsForEvent,
} from '@/lib/storage/staff-assignments'
import {
  getWorkLogsForStaff,
  getWorkLogsByStaffAndPeriod,
} from '@/lib/storage/staff-worklogs'
import {
  getClaimsForStaff,
  getActiveClaimsForStaff,
} from '@/lib/storage/staff-claims'
import { getOfferById } from '@/lib/storage/shift-offers'
import { getPeriodForDate } from '@/lib/staff/payroll-period'
import type {
  StaffAssignment,
  StaffRole,
} from '@/types/staff'
import type { WorkLog } from '@/types/staff-worklog'
import type { ShiftClaim } from '@/types/staff-claim'

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

export interface PastShift {
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

/**
 * Pending claim enriched with the offer's event details. Rendered on
 * the /staff/events page as "you have a pending claim on X" and on
 * /staff/shifts as "waiting for admin" (greyed).
 */
export interface PendingClaimView {
  claimId: string
  offerId: string
  eventId: string
  eventName: string
  eventDate: string
  role: StaffRole
  shiftStart: string
  shiftEnd: string
  lockedRate: number
  claimedAt: string
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
    const staffSession = await getCurrentStaff()
    if (!staffSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const staffId = staffSession.staff.id

    const [assignments, workLogs, pendingClaimsRaw] = await Promise.all([
      getAssignmentsByStaff(staffId),
      getWorkLogsForStaff(staffId),
      getActiveClaimsForStaff(staffId),
    ])

    const workLogByAssignment = new Map<string, WorkLog>()
    for (const w of workLogs) {
      if (w.assignmentId) workLogByAssignment.set(w.assignmentId, w)
    }

    const now = new Date()

    // ---- Upcoming (assignments) ----
    const upcoming = assignments
      .filter((a) => {
        if (a.status === 'cancelled') return false
        const start = new Date(a.shiftStart)
        return start > now
      })
      .sort(
        (a, b) =>
          new Date(a.shiftStart).getTime() - new Date(b.shiftStart).getTime()
      )
      .map((a) => enrichAssignmentWithWorkLog(a, workLogByAssignment.get(a.id)))

    // ---- Current (assignments) ----
    const currentWorkLog = workLogs.find(
      (w) => w.checkInTime && !w.checkOutTime
    )
    const currentAssignment = currentWorkLog?.assignmentId
      ? assignments.find((a) => a.id === currentWorkLog.assignmentId)
      : undefined
    const current = currentAssignment
      ? enrichAssignmentWithWorkLog(currentAssignment, currentWorkLog)
      : undefined

    // ---- Past (work logs) ----
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

    // ---- Pending claims ----
    // getActiveClaimsForStaff returns claims in pending/confirmed/etc.
    // We only want pending here, enriched with the offer's event data.
    const pending: PendingClaimView[] = []
    for (const claim of pendingClaimsRaw) {
      if (claim.status !== 'pending') continue
      const offer = await getOfferById(claim.offerId)
      if (!offer) continue
      pending.push({
        claimId: claim.id,
        offerId: offer.id,
        eventId: offer.eventId,
        eventName: offer.eventName,
        eventDate: offer.eventDate,
        role: claim.lockedRole,
        shiftStart: offer.shiftStart,
        shiftEnd: offer.shiftEnd,
        lockedRate: claim.lockedRate,
        claimedAt: claim.claimedAt,
      })
    }
    pending.sort(
      (a, b) =>
        new Date(a.shiftStart).getTime() - new Date(b.shiftStart).getTime()
    )

    // ---- Coworkers ----
    const upcomingWithCoworkers: ShiftWithCoworkers[] = await Promise.all(
      upcoming.map((a) => enrichWithCoworkers(a, staffId))
    )
    const currentWithCoworkers = current
      ? await enrichWithCoworkers(current, staffId)
      : undefined

    const stats = computeStats(assignments, workLogs, upcoming.length)

    return NextResponse.json({
      staff: staffSession.staff,
      mustChangePassword: staffSession.mustChangePassword,
      upcoming,
      upcomingWithCoworkers,
      past,
      current,
      currentWithCoworkers,
      pendingClaims: pending,
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