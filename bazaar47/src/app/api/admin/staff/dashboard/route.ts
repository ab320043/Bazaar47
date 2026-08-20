import { NextRequest, NextResponse } from 'next/server'
import { getStaffDashboardData } from '@/lib/storage/staff-assignments'
import { getStaffById } from '@/lib/storage/staff'

// ============================================
// GET - Get staff dashboard data
// ============================================

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const staffId = searchParams.get('staffId')
    
    if (!staffId) {
      return NextResponse.json(
        { error: 'Staff ID is required' },
        { status: 400 }
      )
    }
    
    // Verify staff exists
    const staff = await getStaffById(staffId)
    if (!staff) {
      return NextResponse.json(
        { error: 'Staff member not found' },
        { status: 404 }
      )
    }
    
    const dashboardData = await getStaffDashboardData(staffId)
    
    return NextResponse.json({
      staff,
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