// app/api/admin/diagnostic/payroll-parity/route.ts
//
// PHASE 1 DIAGNOSTIC — DELETE AFTER PHASE 1.5 SHIPS
//
// Compares payroll aggregation from StaffAssignment (legacy) and
// WorkLog (new). Used by admin to confirm the two paths agree before
// Phase 1.5 drops the dual-write and Phase 2 deletes StaffAssignment.
//
// Access is admin-only. Route is cheap (no external calls).

import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin/auth'
import { getAssignments } from '@/lib/storage/staff-assignments'
import { getAllWorkLogs } from '@/lib/storage/staff-worklogs'
import {
  getPeriodForDate,
  isDateInPeriod,
} from '@/lib/staff/payroll-period'
import type { StaffAssignment } from '@/types/staff'
import type { WorkLog } from '@/types/staff-worklog'

interface StaffTotal {
  staffId: string
  staffName: string
  hours: number
  earned: number
}

interface ParityRow {
  staffId: string
  staffName: string
  assignmentHours: number
  assignmentEarned: number
  workLogHours: number
  workLogEarned: number
  hoursDelta: number
  earnedDelta: number
  matches: boolean
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

// ---- From assignments ----

function fromAssignments(
  assignments: StaffAssignment[],
  periodStart: string,
  periodEnd: string
): StaffTotal[] {
  const period = { startIso: periodStart, endIso: periodEnd, label: '' }
  const map = new Map<string, StaffTotal>()

  for (const a of assignments) {
    if (a.status !== 'completed') continue
    if (typeof a.hoursWorked !== 'number') continue
    const isoDate = a.shiftStart.slice(0, 10)
    if (!isDateInPeriod(isoDate, period)) continue

    const hours = a.hoursWorked
    const earned = hours * a.hourlyRate
    const existing = map.get(a.staffId)
    if (existing) {
      existing.hours += hours
      existing.earned += earned
    } else {
      map.set(a.staffId, {
        staffId: a.staffId,
        staffName: a.staffName,
        hours,
        earned,
      })
    }
  }

  return Array.from(map.values())
    .map((t) => ({
      ...t,
      hours: round2(t.hours),
      earned: round2(t.earned),
    }))
    .sort((a, b) => a.staffName.localeCompare(b.staffName))
}

// ---- From work logs ----

function fromWorkLogs(
  workLogs: WorkLog[],
  periodStart: string,
  periodEnd: string
): StaffTotal[] {
  const map = new Map<string, StaffTotal>()

  for (const w of workLogs) {
    // Same period rule as StaffAssignment: pay period determined by
    // shiftStart. The work log stores this directly, so we just compare.
    if (w.payPeriodStartIso < periodStart) continue
    if (w.payPeriodStartIso > periodEnd) continue

    const existing = map.get(w.staffId)
    if (existing) {
      existing.hours += w.hoursWorked
      existing.earned += w.amountOwed
    } else {
      map.set(w.staffId, {
        staffId: w.staffId,
        staffName: w.staffName,
        hours: w.hoursWorked,
        earned: w.amountOwed,
      })
    }
  }

  return Array.from(map.values())
    .map((t) => ({
      ...t,
      hours: round2(t.hours),
      earned: round2(t.earned),
    }))
    .sort((a, b) => a.staffName.localeCompare(b.staffName))
}

// ---- Merge into parity rows ----

function buildParityRows(
  assignmentTotals: StaffTotal[],
  workLogTotals: StaffTotal[]
): ParityRow[] {
  const ids = new Set<string>([
    ...assignmentTotals.map((t) => t.staffId),
    ...workLogTotals.map((t) => t.staffId),
  ])

  const assignmentById = new Map(assignmentTotals.map((t) => [t.staffId, t]))
  const workLogById = new Map(workLogTotals.map((t) => [t.staffId, t]))

  return Array.from(ids)
    .map((id) => {
      const a = assignmentById.get(id)
      const w = workLogById.get(id)
      const assignmentHours = a?.hours ?? 0
      const assignmentEarned = a?.earned ?? 0
      const workLogHours = w?.hours ?? 0
      const workLogEarned = w?.earned ?? 0
      const hoursDelta = round2(workLogHours - assignmentHours)
      const earnedDelta = round2(workLogEarned - assignmentEarned)

      return {
        staffId: id,
        staffName: a?.staffName ?? w?.staffName ?? 'Unknown',
        assignmentHours,
        assignmentEarned,
        workLogHours,
        workLogEarned,
        hoursDelta,
        earnedDelta,
        matches: hoursDelta === 0 && earnedDelta === 0,
      }
    })
    .sort((x, y) => x.staffName.localeCompare(y.staffName))
}

// ============================================
// ROUTE
// ============================================

export async function GET(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const url = request.nextUrl
    const periodStartParam = url.searchParams.get('periodStart')
    const periodEndParam = url.searchParams.get('periodEnd')

    let periodStart: string
    let periodEnd: string
    if (periodStartParam && periodEndParam) {
      periodStart = periodStartParam
      periodEnd = periodEndParam
    } else {
      const period = getPeriodForDate(new Date())
      periodStart = period.startIso
      periodEnd = period.endIso
    }

    const [assignments, workLogs] = await Promise.all([
      getAssignments(),
      getAllWorkLogs(),
    ])

    const assignmentTotals = fromAssignments(assignments, periodStart, periodEnd)
    const workLogTotals = fromWorkLogs(workLogs, periodStart, periodEnd)
    const rows = buildParityRows(assignmentTotals, workLogTotals)

    const matching = rows.filter((r) => r.matches).length
    const mismatched = rows.filter((r) => !r.matches)
    const totalAssignmentHours = round2(
      assignmentTotals.reduce((s, t) => s + t.hours, 0)
    )
    const totalWorkLogHours = round2(
      workLogTotals.reduce((s, t) => s + t.hours, 0)
    )
    const totalAssignmentEarned = round2(
      assignmentTotals.reduce((s, t) => s + t.earned, 0)
    )
    const totalWorkLogEarned = round2(
      workLogTotals.reduce((s, t) => s + t.earned, 0)
    )

    return NextResponse.json({
      period: { startIso: periodStart, endIso: periodEnd },
      rows,
      summary: {
        staffWithData: rows.length,
        matching,
        mismatched: mismatched.length,
        assignmentHours: totalAssignmentHours,
        workLogHours: totalWorkLogHours,
        assignmentEarned: totalAssignmentEarned,
        workLogEarned: totalWorkLogEarned,
        hoursDelta: round2(totalWorkLogHours - totalAssignmentHours),
        earnedDelta: round2(totalWorkLogEarned - totalAssignmentEarned),
      },
      mismatched,
    })
  } catch (error) {
    console.error('Parity diagnostic error:', error)
    return NextResponse.json(
      { error: 'Failed to compute parity diagnostic' },
      { status: 500 }
    )
  }
}