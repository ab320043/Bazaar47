// app/api/staff/dashboard/route.ts
import { NextResponse } from 'next/server'
import { getCurrentStaff } from '@/lib/staff/auth'
import {
  getStaffDashboardData,
  getOtherAssignmentsForEvent,
} from '@/lib/storage/staff-assignments'
import type { StaffAssignment, StaffRole } from '@/types/staff'

export interface CoworkerOnShift {
  staffId: string
  staffName: string
  roles: StaffRole[]
}

export interface ShiftWithCoworkers {
  assignment: StaffAssignment
  coworkers: CoworkerOnShift[]
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

export async function GET() {
  try {
    const current = await getCurrentStaff()
    if (!current) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dashboardData = await getStaffDashboardData(current.staff.id)

    // Enrich upcoming assignments with coworker info.
    const upcomingWithCoworkers: ShiftWithCoworkers[] = await Promise.all(
      dashboardData.upcoming.map((a) =>
        enrichWithCoworkers(a, current.staff.id)
      )
    )

    // Enrich the current shift too — the hero panel needs the same info.
    const currentWithCoworkers = dashboardData.current
      ? await enrichWithCoworkers(dashboardData.current, current.staff.id)
      : undefined

    return NextResponse.json({
      staff: current.staff,
      mustChangePassword: current.mustChangePassword,
      upcoming: dashboardData.upcoming,
      upcomingWithCoworkers,
      past: dashboardData.past,
      current: dashboardData.current,
      currentWithCoworkers,
      stats: dashboardData.stats,
    })
  } catch (error) {
    console.error('Error fetching staff dashboard:', error)
    return NextResponse.json(
      { error: 'Failed to fetch staff dashboard' },
      { status: 500 }
    )
  }
}