// app/api/admin/staff/route.ts
import { NextRequest, NextResponse } from 'next/server'
import {
  getStaff,
  createStaff,
  deleteStaff,
  filterStaff,
  getStaffStats,
} from '@/lib/storage/staff'
import { setStaffPassword } from '@/lib/staff/auth'
import type { StaffMember, StaffFilters } from '@/types/staff'

// ============================================
// GET - List all staff with optional filters
// ============================================

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    const filters: StaffFilters = {}

    const search = searchParams.get('search')
    if (search) filters.search = search

    const role = searchParams.get('role') as StaffFilters['role']
    if (role) filters.role = role

    const position = searchParams.get('position') as StaffFilters['position']
    if (position) filters.position = position

    const status = searchParams.get('status') as StaffFilters['status']
    if (status) filters.status = status

    const includeStats = searchParams.get('stats') === 'true'

    const staff = await filterStaff(filters)

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
    console.error('❌ Error fetching staff:', error)
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
  let createdStaffId: string | null = null

  try {
    const body = await request.json()

    console.log('📝 Creating staff member:', {
      name: body.name,
      email: body.email,
      role: body.primaryRole,
      hasPassword: typeof body.tempPassword === 'string' && body.tempPassword.length > 0,
    })

    // Validate required fields
    const requiredFields = ['name', 'email', 'phone', 'primaryRole', 'position', 'hourlyRate', 'nonprofitRate']
    const missingFields = requiredFields.filter(
      (field) => body[field] === undefined || body[field] === null
    )

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate temp password
    if (typeof body.tempPassword !== 'string' || body.tempPassword.length < 8) {
      return NextResponse.json(
        { error: 'Temporary password is required and must be at least 8 characters' },
        { status: 400 }
      )
    }

    // Prevent duplicate emails (case-insensitive)
    const existing = await getStaff()
    const emailCollision = existing.find(
      (s) => s.email.trim().toLowerCase() === String(body.email).trim().toLowerCase()
    )
    if (emailCollision) {
      return NextResponse.json(
        { error: 'A staff member with this email already exists' },
        { status: 409 }
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
      isActive: body.isActive !== undefined ? body.isActive : true,
      notes: body.notes || '',
      status: 'active',
    })

    createdStaffId = newStaff.id

    // Hash + store the temp password. `mustChangePassword: true` so the
    // staff dashboard shows the "ask an admin to reset" notice.
    await setStaffPassword(newStaff.id, body.tempPassword, true)

    console.log('✅ Staff created successfully:', { id: newStaff.id, name: newStaff.name })

    return NextResponse.json(
      { success: true, staff: newStaff },
      { status: 201 }
    )
  } catch (error) {
    console.error('❌ Error creating staff:', error)

    // Best-effort rollback: if we created the staff record but failed to
    // set the credential, delete the orphan so we don't leave a staff
    // member who can never log in.
    if (createdStaffId) {
      try {
        await deleteStaff(createdStaffId)
        console.warn('↩️ Rolled back staff creation after credential failure:', createdStaffId)
      } catch (rollbackError) {
        console.error('❌ Failed to roll back staff creation:', rollbackError)
      }
    }

    const errorMessage =
      error instanceof Error ? error.message : 'Failed to create staff member'

    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}