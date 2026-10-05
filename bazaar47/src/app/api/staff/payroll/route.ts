// app/api/staff/payroll/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentStaff } from '@/lib/staff/auth'
import { getAssignmentsByStaff } from '@/lib/storage/staff-assignments'
import {
  getPeriodForDate,
  isDateInPeriod,
  type PayrollPeriod,
} from '@/lib/staff/payroll-period'
import type { StaffAssignment } from '@/types/staff'

// ============================================
// TYPES (exported for client reuse)
// ============================================

export interface PayrollLedgerEntry {
  assignmentId: string
  eventId: string
  eventName: string
  roles: string[]         // labels, already resolved
  position: string
  shiftStart: string
  shiftEnd: string
  hoursWorked: number
  hourlyRate: number
  amount: number
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

function isCompleted(a: StaffAssignment): boolean {
  return a.status === 'completed' && typeof a.hoursWorked === 'number'
}

function toLedgerEntry(a: StaffAssignment): PayrollLedgerEntry {
  const hours = a.hoursWorked ?? 0
  return {
    assignmentId: a.id,
    eventId: a.eventId,
    eventName: a.eventName,
    roles: a.roles,
    position: a.position,
    shiftStart: a.shiftStart,
    shiftEnd: a.shiftEnd,
    hoursWorked: hours,
    hourlyRate: a.hourlyRate,
    amount: Math.round(hours * a.hourlyRate * 100) / 100,
  }
}

// ============================================
// GET
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

    // Determine target period
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

    const assignments = await getAssignmentsByStaff(current.staff.id)
    const completed = assignments.filter(isCompleted)

    // Entries within the target period
    const inPeriod = completed.filter((a) => {
      const shiftStartIso = a.shiftStart.slice(0, 10)
      return isDateInPeriod(shiftStartIso, period)
    })

    const entries = inPeriod
      .map(toLedgerEntry)
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

    // Lifetime = all completed, regardless of period
    const lifetime = completed.reduce(
      (acc, a) => {
        const h = a.hoursWorked ?? 0
        acc.hours += h
        acc.earned += h * a.hourlyRate
        return acc
      },
      { hours: 0, earned: 0 }
    )

    const round2 = (n: number) => Math.round(n * 100) / 100

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