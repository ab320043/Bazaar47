// app/api/admin/staff/assignments/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { 
  getAssignments, 
  createAssignment,
  getAssignmentForStaffAndEvent,
} from '@/lib/storage/staff-assignments'
import { getStaffById } from '@/lib/storage/staff'
import { getEventById } from '@/data/events'
import { getRateForRole, getResponsibilitiesForRole, STAFF_ROLES } from '@/data/staff-roles'
import type { StaffAssignment, EventType, AssignmentStatus, StaffRole } from '@/types/staff'

// ============================================
// HELPERS
// ============================================

function isStaffRole(v: unknown): v is StaffRole {
  return typeof v === 'string' && STAFF_ROLES.some((r) => r.id === v)
}

/**
 * Accept either the new `roles: StaffRole[]` shape or the legacy
 * `role: StaffRole` shape (for old clients / scripts).
 */
function extractRoles(body: Record<string, unknown>): StaffRole[] | null {
  if (Array.isArray(body.roles)) {
    const filtered = body.roles.filter(isStaffRole)
    if (filtered.length !== body.roles.length) return null
    if (filtered.length === 0) return null
    return Array.from(new Set(filtered)) // de-dupe
  }
  if (isStaffRole(body.role)) {
    return [body.role]
  }
  return null
}

// ============================================
// GET - List all assignments with filters
// ============================================

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const eventId = searchParams.get('eventId')
    const staffId = searchParams.get('staffId')
    const status = searchParams.get('status') as AssignmentStatus | null
    const role = searchParams.get('role') as StaffRole | null
    
    let assignments = await getAssignments()
    
    if (eventId) assignments = assignments.filter(a => a.eventId === eventId)
    if (staffId) assignments = assignments.filter(a => a.staffId === staffId)
    if (status) assignments = assignments.filter(a => a.status === status)
    if (role) assignments = assignments.filter(a => a.roles.includes(role))
    
    assignments.sort((a, b) => {
      return new Date(a.shiftStart).getTime() - new Date(b.shiftStart).getTime()
    })
    
    return NextResponse.json({
      assignments,
      count: assignments.length,
    })
  } catch (error) {
    console.error('Error fetching assignments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch assignments' },
      { status: 500 }
    )
  }
}

// ============================================
// POST - Create new assignment
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // ---- Required fields ----
    const requiredFields = ['eventId', 'staffId', 'shiftStart', 'shiftEnd']
    const missingFields = requiredFields.filter(field => !body[field])
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      )
    }
    
    // ---- Roles validation ----
    const roles = extractRoles(body)
    if (!roles) {
      return NextResponse.json(
        { error: 'At least one valid role is required' },
        { status: 400 }
      )
    }
    
    // ---- Verify staff exists ----
    const staff = await getStaffById(body.staffId)
    if (!staff) {
      return NextResponse.json(
        { error: 'Staff member not found' },
        { status: 404 }
      )
    }
    
    // ---- Verify event exists ----
    const event = getEventById(body.eventId)
    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }
    
    // ---- Enforce one assignment per (staff, event) ----
    const existingAssignment = await getAssignmentForStaffAndEvent(
      body.staffId,
      body.eventId
    )
    if (existingAssignment) {
      return NextResponse.json(
        {
          error: `${staff.name} is already assigned to this event. Edit their existing assignment to add or change roles.`,
          existingAssignmentId: existingAssignment.id,
        },
        { status: 409 }
      )
    }
    
    // ---- Determine rate ----
    const eventType = (body.eventType || event.type) as EventType
    // Default rate = rate of the first role for this event type.
    // Q13: multiple roles do NOT stack — one rate applies.
    const hourlyRate =
      typeof body.hourlyRate === 'number'
        ? body.hourlyRate
        : getRateForRole(roles[0], eventType)
    
    // ---- Responsibilities (merged across all roles) ----
    const responsibilities = body.responsibilities || (() => {
      const merged = { before: [] as string[], during: [] as string[], after: [] as string[] }
      for (const role of roles) {
        const r = getResponsibilitiesForRole(role)
        merged.before.push(...r.before)
        merged.during.push(...r.during)
        merged.after.push(...r.after)
      }
      return merged
    })()
    
    // ---- Build assignment ----
    const assignmentData: Omit<StaffAssignment, 'id' | 'createdAt' | 'updatedAt'> = {
      eventId: body.eventId,
      eventName: event.name,
      eventType,
      staffId: body.staffId,
      staffName: staff.name,
      roles,
      position: body.position || 'team-member',
      hourlyRate,
      shiftStart: body.shiftStart,
      shiftEnd: body.shiftEnd,
      estimatedHours: body.estimatedHours || 0,
      status: body.status || 'assigned',
      responsibilities,
      notes: body.notes || '',
    }
    
    const assignment = await createAssignment(assignmentData)
    
    return NextResponse.json(
      { success: true, assignment },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating assignment:', error)
    return NextResponse.json(
      { error: 'Failed to create assignment' },
      { status: 500 }
    )
  }
}