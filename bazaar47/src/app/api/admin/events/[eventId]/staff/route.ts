// app/api/admin/events/[eventId]/staff/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getEventById } from '@/data/events'
import { getAssignmentsByEvent } from '@/lib/storage/staff-assignments'
import { DEFAULT_STAFF_ASSIGNMENT } from '@/data/staff-roles'
import type { EventType, StaffRole } from '@/types/staff'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params
    
    const event = getEventById(eventId)
    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }
    
    const assignments = await getAssignmentsByEvent(eventId)
    
    // Required roles for this event type
    const eventType = event.type as EventType
    const requiredRoles = DEFAULT_STAFF_ASSIGNMENT[eventType] || []
    
    // Flatten every role across every assignment. A person with two
    // roles covers both.
    const assignedRoles = new Set<StaffRole>()
    assignments.forEach((a) => {
      a.roles.forEach((r) => assignedRoles.add(r as StaffRole))
    })
    
    const missingRoles = requiredRoles.filter(
      (role) => !assignedRoles.has(role as StaffRole)
    )
    
    // "Total staff" is unique people, not assignments. One assignment
    // per (staff, event), so this is just assignments.length.
    const totalStaff = assignments.length
    
    const totalHours = assignments.reduce((sum, a) => {
      return sum + (a.hoursWorked || 0)
    }, 0)
    
    const totalCost = assignments.reduce((sum, a) => {
      const hours = a.hoursWorked || 0
      return sum + (hours * a.hourlyRate)
    }, 0)
    
    return NextResponse.json({
      event,
      assignments,
      stats: {
        totalStaff,
        totalHours: Math.round(totalHours * 100) / 100,
        totalCost: Math.round(totalCost * 100) / 100,
        missingRoles,
        isFullyStaffed: missingRoles.length === 0,
      },
    })
  } catch (error) {
    console.error('Error fetching event staff:', error)
    return NextResponse.json(
      { error: 'Failed to fetch event staff' },
      { status: 500 }
    )
  }
}