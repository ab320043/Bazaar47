import { NextRequest, NextResponse } from 'next/server'
import { getStaff, createStaff, filterStaff, getStaffStats } from '@/lib/storage/staff'
import type { StaffMember, StaffFilters, StaffRole, StaffPosition, StaffStatus } from '@/types/staff'

// ============================================
// GET - List all staff with optional filters
// ============================================

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    
    // Build filters from query params
    const filters: StaffFilters = {}
    
    const search = searchParams.get('search')
    if (search) filters.search = search
    
    const role = searchParams.get('role') as StaffRole | null
    if (role) filters.role = role
    
    const position = searchParams.get('position') as StaffPosition | null
    if (position) filters.position = position
    
    const status = searchParams.get('status') as StaffStatus | null
    if (status) filters.status = status
    
    // Check if we need stats
    const includeStats = searchParams.get('stats') === 'true'
    
    // Get filtered staff
    const staff = await filterStaff(filters)
    
    // Get stats if requested
    let stats = null
    if (includeStats) {
      stats = await getStaffStats()
    }
    
    return NextResponse.json({
      staff,
      count: staff.length,
      stats,
    })
  } catch (error) {
    console.error('Error fetching staff:', error)
    return NextResponse.json(
      { error: 'Failed to fetch staff' },
      { status: 500 }
    )
  }
}

// ============================================
// POST - Create new staff member
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    const requiredFields: (keyof StaffMember)[] = ['name', 'email', 'phone', 'primaryRole', 'position', 'hourlyRate', 'nonprofitRate']
    const missingFields = requiredFields.filter(field => !body[field])
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      )
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }
    
    // Validate rates are numbers
    if (typeof body.hourlyRate !== 'number' || body.hourlyRate < 0) {
      return NextResponse.json(
        { error: 'Hourly rate must be a positive number' },
        { status: 400 }
      )
    }
    
    if (typeof body.nonprofitRate !== 'number' || body.nonprofitRate < 0) {
      return NextResponse.json(
        { error: 'Nonprofit rate must be a positive number' },
        { status: 400 }
      )
    }
    
    // Create staff member
    const newStaff = await createStaff({
      name: body.name,
      email: body.email,
      phone: body.phone,
      primaryRole: body.primaryRole,
      position: body.position,
      hourlyRate: body.hourlyRate,
      nonprofitRate: body.nonprofitRate,
      status: body.status || 'active',
      isActive: body.isActive !== undefined ? body.isActive : true,
      notes: body.notes || '',
    })
    
    return NextResponse.json({
      success: true,
      staff: newStaff,
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating staff:', error)
    return NextResponse.json(
      { error: 'Failed to create staff member' },
      { status: 500 }
    )
  }
}