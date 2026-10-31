// app/api/staff/payroll/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentStaff } from '@/lib/staff/auth'
import { getWorkLogsByStaffAndPeriod } from '@/lib/storage/staff-worklogs'
import {
  getPeriodForDate,
  type PayrollPeriod,
} from '@/lib/staff/payroll-period'

// ============================================
// TYPES (exported for client reuse)
// ============================================

export interface PayrollLedgerEntry {
  workLogId: string
  assignmentId: string | undefined
  eventId: string
  eventName: string
  roles: string[]
  position: string
  shiftStart: string
  shiftEnd: string
  hoursWorked: number
  hourlyRate: number
  amount: number
  resolution: 'manual' | 'auto-close' | 'admin-edit'
  needsReview: boolean
}

export interface PayrollResponse {
  period: PayrollPeriod
  entries: PayrollLedgerEntry[]
  totals: {
    hours: number
    earned: number
  }
  lifetime: {
    hours: number
    earned: number
  }
}

// ============================================
// HELPERS
// ============================================

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

// ============================================
// ROUTE
// ============================================

/**
 * Query params:
 *   ?periodStart=YYYY-MM-DD   (optional)
 *   ?periodEnd=YYYY-MM-DD     (optional)
 *
 * If neither is provided, defaults to the current pay period.
 * If both are provided, they define the window directly.
 */
export async function GET(request: NextRequest) {
  try {
    const current = await getCurrentStaff()
    if (!current) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const periodStart = searchParams.get('periodStart')
    const periodEnd = searchParams.get('periodEnd')

    let period: PayrollPeriod
    if (periodStart && periodEnd) {
      period = {
        startIso: periodStart,
        endIso: periodEnd,
        label: `${periodStart} – ${periodEnd}`,
      }
    } else {
      period = getPeriodForDate(new Date())
    }

    // Work logs in the requested period.
    const inPeriod = await getWorkLogsByStaffAndPeriod(
      current.staff.id,
      period.startIso,
      period.endIso
    )

    const entries: PayrollLedgerEntry[] = inPeriod
      .map((w) => ({
        workLogId: w.id,
        assignmentId: w.assignmentId,
        eventId: w.eventId,
        eventName: w.eventName,
        roles: [w.role],
        position: 'team-member',
        shiftStart: w.shiftStart,
        shiftEnd: w.shiftEnd,
        hoursWorked: w.hoursWorked,
        hourlyRate: w.hourlyRate,
        amount: w.amountOwed,
        resolution: w.resolution,
        needsReview: w.needsReview,
      }))
      .sort(
        (a, b) =>
          new Date(a.shiftStart).getTime() - new Date(b.shiftStart).getTime()
      )

    const totals = entries.reduce(
      (acc, e) => {
        acc.hours += e.hoursWorked
        acc.earned += e.amount
        return acc
      },
      { hours: 0, earned: 0 }
    )

    // Lifetime — pull ALL of this staff's work logs, not just this period.
    const all = await getWorkLogsByStaffAndPeriod(
      current.staff.id,
      '1970-01-01',
      '9999-12-31'
    )
    const lifetime = all.reduce(
      (acc, w) => {
        acc.hours += w.hoursWorked
        acc.earned += w.amountOwed
        return acc
      },
      { hours: 0, earned: 0 }
    )

    return NextResponse.json({
      period,
      entries,
      totals: {
        hours: round2(totals.hours),
        earned: round2(totals.earned),
      },
      lifetime: {
        hours: round2(lifetime.hours),
        earned: round2(lifetime.earned),
      },
    } satisfies PayrollResponse)
  } catch (error) {
    console.error('Error fetching staff payroll:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payroll' },
      { status: 500 }
    )
  }
}