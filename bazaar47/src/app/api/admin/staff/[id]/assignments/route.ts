import { NextRequest, NextResponse } from 'next/server'
import { getAssignmentsByStaff } from '@/lib/storage/staff-assignments'
import { getStaffById } from '@/lib/storage/staff'

// ============================================
// GET - Get all assignments for a staff member
// ============================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Check if staff exists
    const staff = await getStaffById(id)
    if (!staff) {
      return NextResponse.json(
        { error: 'Staff member not found' },
        { status: 404 }
      )
    }
    
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    
    let assignments = await getAssignmentsByStaff(id)
    
    // Filter by status if provided
    if (status) {
      assignments = assignments.filter(a => a.status === status)
    }
    
    // Sort by shift start (upcoming first)
    assignments.sort((a, b) => {
      return new Date(a.shiftStart).getTime() - new Date(b.shiftStart).getTime()
    })
    
    return NextResponse.json({
      staff,
      assignments,
      count: assignments.length,
    })
  } catch (error) {
    console.error('Error fetching staff assignments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch staff assignments' },
      { status: 500 }
    )
  }
}