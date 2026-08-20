// lib/storage/staff-assignments.ts
import { Redis } from '@upstash/redis'
import fs from 'fs'
import path from 'path'
import type { StaffAssignment, AssignmentStatus, EventType } from '@/types/staff'

// Initialize Redis (only if environment variables exist)
let redis: Redis | null = null
try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = Redis.fromEnv()
  }
} catch (error) {
  console.log('Redis not configured - using file storage')
  redis = null
}

const ASSIGNMENTS_KEY = 'staff_assignments'
const ASSIGNMENTS_FILE = path.join(process.cwd(), 'data', 'staff-assignments.json')

// Ensure data directory exists
const dataDir = path.dirname(ASSIGNMENTS_FILE)
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

// ============================================
// GET ALL ASSIGNMENTS
// ============================================

export async function getAssignments(): Promise<StaffAssignment[]> {
  if (process.env.VERCEL && redis) {
    try {
      const assignments = await redis.get(ASSIGNMENTS_KEY)
      return (assignments as StaffAssignment[]) || []
    } catch (error) {
      console.error('Redis get error:', error)
      return []
    }
  }

  try {
    if (!fs.existsSync(ASSIGNMENTS_FILE)) {
      fs.writeFileSync(ASSIGNMENTS_FILE, JSON.stringify([], null, 2))
      return []
    }
    const content = fs.readFileSync(ASSIGNMENTS_FILE, 'utf-8')
    return JSON.parse(content)
  } catch (error) {
    console.error('File read error:', error)
    return []
  }
}

// ============================================
// GET ASSIGNMENTS BY EVENT
// ============================================

export async function getAssignmentsByEvent(eventId: string): Promise<StaffAssignment[]> {
  const assignments = await getAssignments()
  return assignments.filter(a => a.eventId === eventId)
}

// ============================================
// GET ASSIGNMENTS BY STAFF
// ============================================

export async function getAssignmentsByStaff(staffId: string): Promise<StaffAssignment[]> {
  const assignments = await getAssignments()
  return assignments.filter(a => a.staffId === staffId)
}

// ============================================
// GET ASSIGNMENTS BY STATUS
// ============================================

export async function getAssignmentsByStatus(status: AssignmentStatus): Promise<StaffAssignment[]> {
  const assignments = await getAssignments()
  return assignments.filter(a => a.status === status)
}

// ============================================
// GET UPCOMING ASSIGNMENTS
// ============================================

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

// ============================================
// CREATE ASSIGNMENT
// ============================================

export async function createAssignment(
  assignment: Omit<StaffAssignment, 'id' | 'createdAt' | 'updatedAt'>
): Promise<StaffAssignment> {
  const existing = await getAssignments()
  const newAssignment: StaffAssignment = {
    ...assignment,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  existing.push(newAssignment)
  await saveAssignments(existing)
  return newAssignment
}

// ============================================
// UPDATE ASSIGNMENT
// ============================================

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

// ============================================
// DELETE ASSIGNMENT
// ============================================

export async function deleteAssignment(id: string): Promise<boolean> {
  const assignments = await getAssignments()
  const filtered = assignments.filter(a => a.id !== id)
  if (filtered.length === assignments.length) return false
  await saveAssignments(filtered)
  return true
}

// ============================================
// CHECK IN STAFF
// ============================================

export async function checkInStaff(id: string): Promise<StaffAssignment | undefined> {
  return updateAssignment(id, {
    checkInTime: new Date().toISOString(),
    status: 'checked-in',
  })
}

// ============================================
// CHECK OUT STAFF
// ============================================

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

// ============================================
// SAVE ASSIGNMENTS (Internal)
// ============================================

async function saveAssignments(assignments: StaffAssignment[]): Promise<void> {
  if (process.env.VERCEL && redis) {
    try {
      await redis.set(ASSIGNMENTS_KEY, assignments)
    } catch (error) {
      console.error('Redis set error:', error)
      throw new Error('Failed to save assignments')
    }
  } else {
    try {
      fs.writeFileSync(ASSIGNMENTS_FILE, JSON.stringify(assignments, null, 2))
    } catch (error) {
      console.error('File write error:', error)
      throw new Error('Failed to save assignments')
    }
  }
}

// ============================================
// GET STAFF DASHBOARD DATA
// ============================================

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
  
  // Calculate stats for this month
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