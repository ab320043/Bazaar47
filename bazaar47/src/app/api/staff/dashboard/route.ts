// app/api/staff/dashboard/route.ts
import { NextResponse } from 'next/server'
import { getCurrentStaff } from '@/lib/staff/auth'
import { getStaffDashboardData } from '@/lib/storage/staff-assignments'

export async function GET() {
  try {
    const current = await getCurrentStaff()
    if (!current) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Session-scoped: always use the logged-in staff member's id.
    // Any `?staffId=` param on the request is intentionally ignored.
    const dashboardData = await getStaffDashboardData(current.staff.id)

    return NextResponse.json({
      staff: current.staff,
      mustChangePassword: current.mustChangePassword,
      ...dashboardData,
    })
  } catch (error) {
    console.error('Error fetching staff dashboard:', error)
    return NextResponse.json(
      { error: 'Failed to fetch staff dashboard' },
      { status: 500 }
    )
  }
}