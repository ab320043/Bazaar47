import { NextRequest, NextResponse } from 'next/server'
import { 
  getAssignments, 
  createAssignment, 
  getAssignmentsByEvent,
  getAssignmentsByStatus 
} from '@/lib/storage/staff-assignments'
import { getStaffById } from '@/lib/storage/staff'
import { getEventById } from '@/data/events'
import { getRateForRole, getResponsibilitiesForRole } from '@/data/staff-roles'
import type { StaffAssignment, EventType, AssignmentStatus } from '@/types/staff'

// ============================================
// GET - List all assignments with filters
// ============================================

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const eventId = searchParams.get('eventId')
    const staffId = searchParams.get('staffId')
    const status = searchParams.get('status') as AssignmentStatus | null
    
    let assignments = await getAssignments()
    
    // Apply filters
    if (eventId) {
      assignments = assignments.filter(a => a.eventId === eventId)
    }
    
    if (staffId) {
      assignments = assignments.filter(a => a.staffId === staffId)
    }
    
    if (status) {
      assignments = assignments.filter(a => a.status === status)
    }
    
    // Sort by shift start
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
    
    // Validate required fields
    const requiredFields = ['eventId', 'staffId', 'role', 'shiftStart', 'shiftEnd']
    const missingFields = requiredFields.filter(field => !body[field])
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      )
    }
    
    // Verify staff exists
    const staff = await getStaffById(body.staffId)
    if (!staff) {
      return NextResponse.json(
        { error: 'Staff member not found' },
        { status: 404 }
      )
    }
    
    // Verify event exists
    const event = getEventById(body.eventId)
    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }
    
    // Determine event type
    const eventType = (body.eventType || event.type) as EventType
    
    // Calculate rate based on event type
    const hourlyRate = body.hourlyRate || getRateForRole(body.role, eventType)
    
    // Get responsibilities
    const responsibilities = body.responsibilities || getResponsibilitiesForRole(body.role)
    
    // Create assignment
    const assignmentData: Omit<StaffAssignment, 'id' | 'createdAt' | 'updatedAt'> = {
      eventId: body.eventId,
      eventName: event.name,
      eventType: eventType,
      staffId: body.staffId,
      staffName: staff.name,
      role: body.role,
      position: body.position || 'team-member',
      hourlyRate: hourlyRate,
      shiftStart: body.shiftStart,
      shiftEnd: body.shiftEnd,
      estimatedHours: body.estimatedHours || 0,
      status: body.status || 'assigned',
      responsibilities: responsibilities,
      notes: body.notes || '',
    }
    
    const assignment = await createAssignment(assignmentData)
    
    return NextResponse.json({
      success: true,
      assignment,
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating assignment:', error)
    return NextResponse.json(
      { error: 'Failed to create assignment' },
      { status: 500 }
    )
  }
}