// lib/storage/staff-assignments.ts
import { Redis } from '@upstash/redis'
import type { StaffAssignment, AssignmentStatus } from '@/types/staff'

// ✅ Use the same Redis instance as submissions
const redis = Redis.fromEnv()
const ASSIGNMENTS_KEY = 'staff_assignments'

// ============================================
// READ ASSIGNMENTS
// ============================================

export async function getAssignments(): Promise<StaffAssignment[]> {
  try {
    const assignments = await redis.get(ASSIGNMENTS_KEY)
    return (assignments as StaffAssignment[]) || []
  } catch (error) {
    console.error('Redis get error:', error)
    return []
  }
}

// ============================================
// SAVE ASSIGNMENTS
// ============================================

export async function saveAssignments(assignments: StaffAssignment[]): Promise<void> {
  try {
    await redis.set(ASSIGNMENTS_KEY, assignments)
  } catch (error) {
    console.error('Redis set error:', error)
    throw new Error('Failed to save assignments')
  }
}

// ============================================
// CRUD OPERATIONS
// ============================================

export async function getAssignmentsByEvent(eventId: string): Promise<StaffAssignment[]> {
  const assignments = await getAssignments()
  return assignments.filter(a => a.eventId === eventId)
}

export async function getAssignmentsByStaff(staffId: string): Promise<StaffAssignment[]> {
  const assignments = await getAssignments()
  return assignments.filter(a => a.staffId === staffId)
}

export async function getAssignmentsByStatus(status: AssignmentStatus): Promise<StaffAssignment[]> {
  const assignments = await getAssignments()
  return assignments.filter(a => a.status === status)
}

export async function getUpcomingAssignments(staffId?: string): Promise<StaffAssignment[]> {
  const assignments = await getAssignments()
  const now = new Date()
  
  let filtered = assignments.filter(a => {
    const shiftStart = new Date(a.shiftStart)
    return shiftStart > now && a.status !== 'cancelled' && a.status !== 'completed'
  })
  
  if (staffId) {
    filtered = filtered.filter(a => a.staffId === staffId)
  }
  
  return filtered.sort((a, b) => new Date(a.shiftStart).getTime() - new Date(b.shiftStart).getTime())
}

export async function createAssignment(
  assignmentData: Omit<StaffAssignment, 'id' | 'createdAt' | 'updatedAt'>
): Promise<StaffAssignment> {
  const existing = await getAssignments()
  const newAssignment: StaffAssignment = {
    ...assignmentData,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  existing.push(newAssignment)
  await saveAssignments(existing)
  return newAssignment
}

export async function updateAssignment(
  id: string,
  updates: Partial<StaffAssignment>
): Promise<StaffAssignment | undefined> {
  const assignments = await getAssignments()
  const index = assignments.findIndex(a => a.id === id)
  if (index === -1) return undefined
  
  assignments[index] = {
    ...assignments[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  }
  await saveAssignments(assignments)
  return assignments[index]
}

export async function deleteAssignment(id: string): Promise<boolean> {
  const assignments = await getAssignments()
  const filtered = assignments.filter(a => a.id !== id)
  if (filtered.length === assignments.length) return false
  await saveAssignments(filtered)
  return true
}

export async function checkInStaff(id: string): Promise<StaffAssignment | undefined> {
  return updateAssignment(id, {
    checkInTime: new Date().toISOString(),
    status: 'checked-in',
  })
}

export async function checkOutStaff(id: string): Promise<StaffAssignment | undefined> {
  const assignment = await getAssignments().then(a => a.find(a => a.id === id))
  if (!assignment) return undefined
  
  const checkIn = assignment.checkInTime ? new Date(assignment.checkInTime) : null
  const checkOut = new Date()
  let hoursWorked = 0
  
  if (checkIn) {
    hoursWorked = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60)
  }
  
  return updateAssignment(id, {
    checkOutTime: checkOut.toISOString(),
    hoursWorked: Math.round(hoursWorked * 100) / 100,
    status: 'completed',
  })
}

export async function getStaffDashboardData(staffId: string): Promise<{
  upcoming: StaffAssignment[]
  past: StaffAssignment[]
  current: StaffAssignment | undefined
  stats: {
    totalHoursThisMonth: number
    totalEarnedThisMonth: number
    upcomingCount: number
  }
}> {
  const assignments = await getAssignmentsByStaff(staffId)
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  
  const upcoming = assignments.filter(a => {
    const shiftStart = new Date(a.shiftStart)
    return shiftStart > now && a.status !== 'cancelled' && a.status !== 'completed'
  }).sort((a, b) => new Date(a.shiftStart).getTime() - new Date(b.shiftStart).getTime())
  
  const current = assignments.find(a => {
    const shiftStart = new Date(a.shiftStart)
    const shiftEnd = new Date(a.shiftEnd)
    return shiftStart <= now && shiftEnd >= now && a.status !== 'completed' && a.status !== 'cancelled'
  })
  
  const past = assignments.filter(a => {
    const shiftEnd = new Date(a.shiftEnd)
    return shiftEnd < now || a.status === 'completed'
  }).sort((a, b) => new Date(b.shiftEnd).getTime() - new Date(a.shiftEnd).getTime())
  
  const thisMonth = assignments.filter(a => {
    const date = new Date(a.createdAt)
    return date >= startOfMonth && (a.status === 'completed')
  })
  
  let totalHoursThisMonth = 0
  let totalEarnedThisMonth = 0
  
  thisMonth.forEach(a => {
    const hours = a.hoursWorked || 0
    totalHoursThisMonth += hours
    totalEarnedThisMonth += hours * a.hourlyRate
  })
  
  return {
    upcoming,
    past,
    current,
    stats: {
      totalHoursThisMonth: Math.round(totalHoursThisMonth * 100) / 100,
      totalEarnedThisMonth: Math.round(totalEarnedThisMonth * 100) / 100,
      upcomingCount: upcoming.length,
    },
  }
}