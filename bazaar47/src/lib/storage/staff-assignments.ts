// lib/storage/staff-assignments.ts
import { Redis } from '@upstash/redis'
import type { StaffAssignment, AssignmentStatus, StaffRole } from '@/types/staff'
import { getPeriodForDate } from '@/lib/staff/payroll-period'


const redis = Redis.fromEnv()
const ASSIGNMENTS_KEY = 'staff_assignments'

// ============================================
// LEGACY MIGRATION
// ============================================

/**
 * Before Batch 3, assignments had `role: StaffRole` (singular). After
 * Batch 3, they have `roles: StaffRole[]` (plural) to support one staff
 * member covering multiple roles at the same event without double-pay.
 *
 * `migrateAssignment` detects the old shape and converts it. Idempotent
 * — running it on an already-migrated record is a no-op.
 */
type LegacyAssignment = Omit<StaffAssignment, 'roles'> & {
  roles?: StaffRole[]
  role?: StaffRole
}

function migrateAssignment(raw: LegacyAssignment): {
  assignment: StaffAssignment
  migrated: boolean
} {
  // Already migrated
  if (Array.isArray(raw.roles) && raw.roles.length > 0) {
    return { assignment: raw as StaffAssignment, migrated: false }
  }

  // Legacy shape: { role: 'house-manager' } → { roles: ['house-manager'] }
  if (typeof raw.role === 'string') {
    const { role, ...rest } = raw
    const migrated: StaffAssignment = {
      ...(rest as Omit<StaffAssignment, 'roles'>),
      roles: [role as StaffRole],
    }
    return { assignment: migrated, migrated: true }
  }

  // Unknown shape — shouldn't happen, but log and default to the
  // first tier role so the record at least renders.
  console.warn('Assignment with unknown shape, defaulting roles:', raw)
  const { role: _ignored, ...rest } = raw
  return {
    assignment: {
      ...(rest as Omit<StaffAssignment, 'roles'>),
      roles: ['event-coordinator'],
    },
    migrated: true,
  }
}

// ============================================
// READ ASSIGNMENTS
// ============================================

export async function getAssignments(): Promise<StaffAssignment[]> {
  try {
    const raw = await redis.get(ASSIGNMENTS_KEY)
    const list = (raw as LegacyAssignment[]) || []

    let anyMigrated = false
    const migrated: StaffAssignment[] = list.map((item) => {
      const { assignment, migrated: didMigrate } = migrateAssignment(item)
      if (didMigrate) anyMigrated = true
      return assignment
    })

    // Persist the migrated shape once so subsequent reads are fast
    // and the legacy `role` field is dropped from Redis.
    if (anyMigrated) {
      try {
        await redis.set(ASSIGNMENTS_KEY, migrated)
      } catch (error) {
        // Not fatal — we already returned the correct data to the
        // caller. Log and continue; migration will retry on next read.
        console.error('Failed to persist migrated assignments:', error)
      }
    }

    return migrated
  } catch (error) {
    console.error('Redis get error:', error)
    return []
  }
}

/**
 * Get all assignments for an event, excluding one specific staff
 * member. Used by the staff dashboard to show "also on this shift".
 */
export async function getOtherAssignmentsForEvent(
  eventId: string,
  excludeStaffId: string
): Promise<StaffAssignment[]> {
  const assignments = await getAssignmentsByEvent(eventId)
  return assignments.filter(
    (a) => a.staffId !== excludeStaffId && a.status !== 'cancelled'
  )
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

/**
 * Check whether a staff member is already assigned to an event.
 * Used by the POST handler to enforce "one assignment per (staff, event)".
 * Returns the existing assignment if found, undefined otherwise.
 */
export async function getAssignmentForStaffAndEvent(
  staffId: string,
  eventId: string
): Promise<StaffAssignment | undefined> {
  const assignments = await getAssignments()
  return assignments.find(a => a.staffId === staffId && a.eventId === eventId)
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

    // If a break was logged, deduct its duration.
    if (assignment.breakStart && assignment.breakEnd) {
      const breakStart = new Date(assignment.breakStart).getTime()
      const breakEnd = new Date(assignment.breakEnd).getTime()
      if (breakEnd > breakStart) {
        const breakHours = (breakEnd - breakStart) / (1000 * 60 * 60)
        hoursWorked = Math.max(0, hoursWorked - breakHours)
      }
    }
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
    hoursThisPeriod: number
    earnedThisPeriod: number
    hoursThisMonth: number
    earnedThisMonth: number
    hoursAllTime: number
    earnedAllTime: number
    upcomingCount: number
  }
}> {
  const assignments = await getAssignmentsByStaff(staffId)
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  // Import the period helper — needs to be added at the top of the file
  // import { getPeriodForDate } from '@/lib/staff/payroll-period'
  const period = getPeriodForDate(now)

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

  let hoursThisPeriod = 0
  let earnedThisPeriod = 0
  let hoursThisMonth = 0
  let earnedThisMonth = 0
  let hoursAllTime = 0
  let earnedAllTime = 0

  for (const a of assignments) {
    if (a.status !== 'completed' || a.hoursWorked === undefined) continue

    const hours = a.hoursWorked
    const earned = hours * a.hourlyRate

    hoursAllTime += hours
    earnedAllTime += earned

    const createdAt = new Date(a.createdAt)
    const createdAtIso = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}-${String(createdAt.getDate()).padStart(2, '0')}`

    if (createdAtIso >= period.startIso && createdAtIso <= period.endIso) {
      hoursThisPeriod += hours
      earnedThisPeriod += earned
    }

    if (createdAt >= startOfMonth) {
      hoursThisMonth += hours
      earnedThisMonth += earned
    }
  }

  const round2 = (n: number) => Math.round(n * 100) / 100

  return {
    upcoming,
    past,
    current,
    stats: {
      hoursThisPeriod: round2(hoursThisPeriod),
      earnedThisPeriod: round2(earnedThisPeriod),
      hoursThisMonth: round2(hoursThisMonth),
      earnedThisMonth: round2(earnedThisMonth),
      hoursAllTime: round2(hoursAllTime),
      earnedAllTime: round2(earnedAllTime),
      upcomingCount: upcoming.length,
    },
  }
}