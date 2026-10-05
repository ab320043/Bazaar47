// lib/storage/staff.ts
import { Redis } from '@upstash/redis'
import type { StaffMember, StaffFilters } from '@/types/staff'

const redis = Redis.fromEnv()
const STAFF_KEY = 'staff'

// ============================================
// LEGACY MIGRATION
// ============================================

type LegacyStaffMember = Omit<StaffMember, 'staffType'> & {
  staffType?: string
}

function migrateStaffMember(raw: LegacyStaffMember): {
  staff: StaffMember
  migrated: boolean
} {
  if (raw.staffType === 'permanent' || raw.staffType === 'temp') {
    return { staff: raw as StaffMember, migrated: false }
  }

  // Missing or invalid staffType → default to 'permanent'.
  const migrated: StaffMember = {
    ...(raw as Omit<StaffMember, 'staffType'>),
    staffType: 'permanent',
  }
  return { staff: migrated, migrated: true }
}

// ============================================
// READ STAFF
// ============================================

export async function getStaff(): Promise<StaffMember[]> {
  try {
    const raw = await redis.get(STAFF_KEY)
    const list = (raw as LegacyStaffMember[]) || []

    let anyMigrated = false
    const migrated: StaffMember[] = list.map((item) => {
      const { staff, migrated: didMigrate } = migrateStaffMember(item)
      if (didMigrate) anyMigrated = true
      return staff
    })

    if (anyMigrated) {
      try {
        await redis.set(STAFF_KEY, migrated)
      } catch (error) {
        console.error('Failed to persist migrated staff:', error)
      }
    }

    return migrated
  } catch (error) {
    console.error('Redis get error:', error)
    return []
  }
}

// ============================================
// SAVE STAFF
// ============================================

export async function saveStaff(staff: StaffMember[]): Promise<void> {
  try {
    await redis.set(STAFF_KEY, staff)
  } catch (error) {
    console.error('Redis set error:', error)
    throw new Error('Failed to save staff')
  }
}

// ============================================
// CRUD
// ============================================

export async function getStaffById(id: string): Promise<StaffMember | undefined> {
  const staff = await getStaff()
  return staff.find(s => s.id === id)
}

export async function createStaff(
  staffData: Omit<StaffMember, 'id' | 'createdAt' | 'updatedAt'>
): Promise<StaffMember> {
  const existing = await getStaff()

  // Ensure staffType has a value even if the caller didn't provide one.
  const withType: Omit<StaffMember, 'id' | 'createdAt' | 'updatedAt'> = {
    ...staffData,
    staffType: staffData.staffType ?? 'permanent',
  }

  const newStaff: StaffMember = {
    ...withType,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  existing.push(newStaff)
  await saveStaff(existing)
  return newStaff
}

export async function updateStaff(
  id: string,
  updates: Partial<StaffMember>
): Promise<StaffMember | undefined> {
  const staff = await getStaff()
  const index = staff.findIndex(s => s.id === id)
  if (index === -1) return undefined
  
  staff[index] = {
    ...staff[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  }
  await saveStaff(staff)
  return staff[index]
}

export async function deleteStaff(id: string): Promise<boolean> {
  const staff = await getStaff()
  const filtered = staff.filter(s => s.id !== id)
  if (filtered.length === staff.length) return false
  await saveStaff(filtered)
  return true
}

export async function filterStaff(filters: StaffFilters): Promise<StaffMember[]> {
  const staff = await getStaff()
  
  return staff.filter(member => {
    if (filters.search) {
      const search = filters.search.toLowerCase()
      const matchName = member.name.toLowerCase().includes(search)
      const matchEmail = member.email.toLowerCase().includes(search)
      if (!matchName && !matchEmail) return false
    }
    
    if (filters.role && member.primaryRole !== filters.role) {
      return false
    }
    
    if (filters.position && member.position !== filters.position) {
      return false
    }
    
    if (filters.status) {
      const isActive = filters.status === 'active'
      if (member.isActive !== isActive) return false
    }

    if (filters.staffType && member.staffType !== filters.staffType) {
      return false
    }
    
    return true
  })
}

export async function getStaffStats(): Promise<{
  total: number
  active: number
  permanent: number
  temp: number
  byRole: Record<string, number>
  byPosition: Record<string, number>
}> {
  const staff = await getStaff()
  
  const byRole: Record<string, number> = {}
  const byPosition: Record<string, number> = {}
  
  staff.forEach(member => {
    byRole[member.primaryRole] = (byRole[member.primaryRole] || 0) + 1
    byPosition[member.position] = (byPosition[member.position] || 0) + 1
  })
  
  return {
    total: staff.length,
    active: staff.filter(s => s.isActive).length,
    permanent: staff.filter(s => s.staffType === 'permanent').length,
    temp: staff.filter(s => s.staffType === 'temp').length,
    byRole,
    byPosition,
  }
}