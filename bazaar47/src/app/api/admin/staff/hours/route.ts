// app/api/admin/staff/hours/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getAssignments } from '@/lib/storage/staff-assignments'
import { isAdminAuthenticated } from '@/lib/admin/auth'

// ============================================
// TYPES
// ============================================

export interface StaffHoursRow {
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
}

// Must mirror the reconcile defaults.
const DEFAULT_GRACE_HOURS = 1

// ============================================
// GET — all assignments with hours/rates
// ============================================

export async function GET(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const searchParams = request.nextUrl.searchParams
    const fromDate = searchParams.get('from')
    const toDate = searchParams.get('to')
    const eventId = searchParams.get('eventId')
    const staffId = searchParams.get('staffId')

    const all = await getAssignments()
    const now = Date.now()

    let filtered = all

    if (fromDate) {
      const fromMs = new Date(`${fromDate}T00:00:00`).getTime()
      filtered = filtered.filter(
        (a) => new Date(a.shiftStart).getTime() >= fromMs
      )
    }
    if (toDate) {
      const toMs = new Date(`${toDate}T23:59:59`).getTime()
      filtered = filtered.filter(
        (a) => new Date(a.shiftStart).getTime() <= toMs
      )
    }
    if (eventId) {
      filtered = filtered.filter((a) => a.eventId === eventId)
    }
    if (staffId) {
      filtered = filtered.filter((a) => a.staffId === staffId)
    }

    const rows: StaffHoursRow[] = filtered.map((a) => {
      const hours = a.hoursWorked ?? 0
      const amountOwed = hours * a.hourlyRate

      // A shift is "currently clocked in" only if:
      //   - checked in, not checked out, AND
      //   - we're still within the shiftEnd + grace window.
      // Otherwise it's a ghost from a previous day that the cron hasn't
      // caught yet, and showing it as "On Shift" is a lie.
      const isCheckedIn = !!a.checkInTime && !a.checkOutTime
      const shiftEndMs = new Date(a.shiftEnd).getTime()
      const graceMs = DEFAULT_GRACE_HOURS * 60 * 60 * 1000
      const isWithinGrace =
        Number.isFinite(shiftEndMs) && now <= shiftEndMs + graceMs
      const isCurrentlyClockedIn = isCheckedIn && isWithinGrace

      return {
        assignmentId: a.id,
        eventId: a.eventId,
        eventName: a.eventName,
        staffId: a.staffId,
        staffName: a.staffName,
        roles: a.roles,
        status: a.status,
        shiftStart: a.shiftStart,
        shiftEnd: a.shiftEnd,
        checkInTime: a.checkInTime,
        checkOutTime: a.checkOutTime,
        hoursWorked: a.hoursWorked,
        hourlyRate: a.hourlyRate,
        amountOwed: Math.round(amountOwed * 100) / 100,
        isCurrentlyClockedIn,
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
  } catch (error) {
    console.error('Error fetching staff hours:', error)
    return NextResponse.json(
      { error: 'Failed to fetch staff hours' },
      { status: 500 }
    )
  }
}