// app/api/staff/profile/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentStaff } from '@/lib/staff/auth'
import { updateStaff } from '@/lib/storage/staff'
import type { StaffMember } from '@/types/staff'

// ============================================
// FIELDS STAFF CAN EDIT
// ============================================

/**
 * Fields a staff member can edit on their own profile.
 * Everything else — email, rates, roles, position, isActive,
 * status, notes — is admin-only and silently ignored by PATCH.
 */
const EDITABLE_FIELDS = [
  'name',
  'phone',
  'preferredName',
  'pronouns',
  'bio',
  'instagram',
  'emergencyContactName',
  'emergencyContactPhone',
] as const

type EditableField = (typeof EDITABLE_FIELDS)[number]

const MAX_LENGTHS: Record<EditableField, number> = {
  name: 120,
  phone: 32,
  preferredName: 60,
  pronouns: 40,
  bio: 500,
  instagram: 60,
  emergencyContactName: 120,
  emergencyContactPhone: 32,
}

// ============================================
// HELPERS
// ============================================

function isValidEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
}

// ============================================
// GET — read own profile
// ============================================

export async function GET() {
  try {
    const current = await getCurrentStaff()
    if (!current) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ staff: current.staff })
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}

// ============================================
// PATCH — update editable fields only
// ============================================

export async function PATCH(request: NextRequest) {
  try {
    const current = await getCurrentStaff()
    if (!current) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const updates: Partial<StaffMember> = {}
    const errors: string[] = []

    for (const field of EDITABLE_FIELDS) {
      if (!(field in body)) continue

      const rawValue = body[field]
      if (rawValue === null || rawValue === undefined) {
        // Explicit clear
        ;(updates as Record<string, unknown>)[field] = ''
        continue
      }

      if (typeof rawValue !== 'string') {
        errors.push(`${field} must be a string`)
        continue
      }

      const trimmed = rawValue.trim()
      if (trimmed.length > MAX_LENGTHS[field]) {
        errors.push(
          `${field} must be ${MAX_LENGTHS[field]} characters or fewer`
        )
        continue
      }

      // Field-specific validation
      if (field === 'name' && trimmed.length === 0) {
        errors.push('Name cannot be empty')
        continue
      }

      if (field === 'phone' && trimmed.length === 0) {
        errors.push('Phone cannot be empty')
        continue
      }

      ;(updates as Record<string, unknown>)[field] = trimmed
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { error: errors.join('; ') },
        { status: 400 }
      )
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No editable fields provided' },
        { status: 400 }
      )
    }

    const updated = await updateStaff(current.staff.id, updates)
    if (!updated) {
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, staff: updated })
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}