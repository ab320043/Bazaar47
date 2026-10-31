// app/api/admin/worklogs/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin/auth'
import {
  getAllWorkLogs,
  getWorkLogsNeedingReview,
} from '@/lib/storage/staff-worklogs'
import { getRecentRuns } from '@/lib/staff/reconcile'

// ============================================
// RESPONSE SHAPE
// ============================================
//
// When source=activity, the response mirrors the shape returned by
// /api/admin/staff/hours so the Activity tab can switch its data
// source without a rendering change. `assignmentId` is populated from
// the work log's assignmentId field (still set for Phase 1 work logs).

interface ActivityRow {
  assignmentId: string
  eventId: string
  eventName: string
  staffId: string
  staffName: string
  roles: string[]
  status: string
  shiftStart: string
  shiftEnd: string
  checkInTime?: string
  checkOutTime?: string
  hoursWorked?: number
  hourlyRate: number
  amountOwed: number
  isCurrentlyClockedIn: boolean
  workLogId: string
  needsReview: boolean
  resolution: 'manual' | 'auto-close' | 'admin-edit'
}

const DEFAULT_GRACE_HOURS = 1

export async function GET(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = request.nextUrl
  const filter = url.searchParams.get('filter')
  const source = url.searchParams.get('source')
  const includeRuns = url.searchParams.get('includeRuns') === 'true'
  const fromDate = url.searchParams.get('from')
  const toDate = url.searchParams.get('to')

  try {
    // ---- Needs-review mode ----
    if (filter === 'needs-review') {
      const workLogs = await getWorkLogsNeedingReview()
      workLogs.sort((a, b) => {
        const aT = a.checkInTime ? new Date(a.checkInTime).getTime() : 0
        const bT = b.checkInTime ? new Date(b.checkInTime).getTime() : 0
        return bT - aT
      })
      const payload: Record<string, unknown> = {
        workLogs,
        count: workLogs.length,
      }
      if (includeRuns) {
        payload.recentRuns = await getRecentRuns(5)
      }
      return NextResponse.json(payload)
    }

    // ---- Activity mode ----
    if (source === 'activity') {
      const all = await getAllWorkLogs()

      // Date filter (same semantics as /api/admin/staff/hours)
      const fromMs = fromDate ? new Date(`${fromDate}T00:00:00`).getTime() : null
      const toMs = toDate ? new Date(`${toDate}T23:59:59`).getTime() : null

      const filtered = all.filter((w) => {
        const t = new Date(w.shiftStart).getTime()
        if (fromMs !== null && t < fromMs) return false
        if (toMs !== null && t > toMs) return false
        return true
      })

      const now = Date.now()
      const graceMs = DEFAULT_GRACE_HOURS * 60 * 60 * 1000

      const rows: ActivityRow[] = filtered.map((w) => {
        const isCheckedIn = !!w.checkInTime && !w.checkOutTime
        const shiftEndMs = new Date(w.shiftEnd).getTime()
        const isWithinGrace =
          Number.isFinite(shiftEndMs) && now <= shiftEndMs + graceMs

        // Status mirrors the assignment status for backward compat with
        // the Activity tab's rendering logic. Phase 2 will rewrite this
        // to read from claims directly.
        let status: string
        if (w.needsReview) status = 'completed'
        else if (isCheckedIn && isWithinGrace) status = 'checked-in'
        else if (w.checkOutTime) status = 'completed'
        else status = 'assigned'

        return {
          assignmentId: w.assignmentId || '',
          eventId: w.eventId,
          eventName: w.eventName,
          staffId: w.staffId,
          staffName: w.staffName,
          roles: [w.role],
          status,
          shiftStart: w.shiftStart,
          shiftEnd: w.shiftEnd,
          checkInTime: w.checkInTime || undefined,
          checkOutTime: w.checkOutTime || undefined,
          hoursWorked: w.hoursWorked,
          hourlyRate: w.hourlyRate,
          amountOwed: w.amountOwed,
          isCurrentlyClockedIn: isCheckedIn && isWithinGrace,
          workLogId: w.id,
          needsReview: w.needsReview,
          resolution: w.resolution,
        }
      })

      rows.sort(
        (a, b) =>
          new Date(b.shiftStart).getTime() - new Date(a.shiftStart).getTime()
      )

      const currentlyClockedIn = rows.filter((r) => r.isCurrentlyClockedIn)
      const totalHours = rows.reduce((sum, r) => sum + (r.hoursWorked ?? 0), 0)
      const totalOwed = rows.reduce((sum, r) => sum + r.amountOwed, 0)

      return NextResponse.json({
        rows,
        summary: {
          total: rows.length,
          currentlyClockedIn: currentlyClockedIn.length,
          totalHours: Math.round(totalHours * 100) / 100,
          totalOwed: Math.round(totalOwed * 100) / 100,
        },
        currentlyClockedIn,
      })
    }

    // ---- Default: raw work log list ----
    const workLogs = await getAllWorkLogs()
    workLogs.sort((a, b) => {
      const aT = a.checkInTime ? new Date(a.checkInTime).getTime() : 0
      const bT = b.checkInTime ? new Date(b.checkInTime).getTime() : 0
      return bT - aT
    })

    const payload: Record<string, unknown> = {
      workLogs,
      count: workLogs.length,
    }
    if (includeRuns) {
      payload.recentRuns = await getRecentRuns(5)
    }
    return NextResponse.json(payload)
  } catch (error) {
    console.error('Error fetching work logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch work logs' },
      { status: 500 }
    )
  }
}