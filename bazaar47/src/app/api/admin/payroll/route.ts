// app/api/admin/payroll/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getAllWorkLogs } from '@/lib/storage/staff-worklogs'
import { getStaff } from '@/lib/storage/staff'
import {
  getPeriodForDate,
  type PayrollPeriod,
} from '@/lib/staff/payroll-period'
import {
  computeStaffPayroll,
  computeEventPayroll,
  computePayrollTotals,
} from '@/lib/staff/payroll-from-worklogs'
import { isAdminAuthenticated } from '@/lib/admin/auth'

/**
 * GET /api/admin/payroll
 *
 * Query params:
 *   ?periodStart=YYYY-MM-DD   (optional)
 *   ?periodEnd=YYYY-MM-DD     (optional)
 *   ?view=staff|event|both    (default: both)
 *
 * If periodStart/End are absent, defaults to the current period.
 */
export async function GET(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const searchParams = request.nextUrl.searchParams
    const periodStart = searchParams.get('periodStart')
    const periodEnd = searchParams.get('periodEnd')
    const view = searchParams.get('view') || 'both'

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

    const workLogs = await getAllWorkLogs()
    const staff = await getStaff()
    const staffById = new Map(staff.map((s) => [s.id, s]))

    const totals = computePayrollTotals(workLogs, period)

    const payload: {
      period: PayrollPeriod
      totals: typeof totals
      byStaff?: ReturnType<typeof computeStaffPayroll>
      byEvent?: ReturnType<typeof computeEventPayroll>
    } = { period, totals }

    if (view === 'staff' || view === 'both') {
      const rows = computeStaffPayroll(workLogs, period)
      payload.byStaff = rows.map((row) => {
        const s = staffById.get(row.staffId)
        return {
          ...row,
          staffName: s?.preferredName?.trim() || row.staffName,
        }
      })
    }

    if (view === 'event' || view === 'both') {
      payload.byEvent = computeEventPayroll(workLogs, period)
    }

    return NextResponse.json(payload)
  } catch (error) {
    console.error('Error computing payroll:', error)
    return NextResponse.json(
      { error: 'Failed to compute payroll' },
      { status: 500 }
    )
  }
}