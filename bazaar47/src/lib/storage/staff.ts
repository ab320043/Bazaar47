// lib/storage/staff.ts
import { Redis } from '@upstash/redis'
import fs from 'fs'
import path from 'path'
import type { StaffMember, StaffFilters } from '@/types/staff'

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

const STAFF_KEY = 'staff'
const STAFF_FILE = path.join(process.cwd(), 'data', 'staff.json')

// Ensure data directory exists
const dataDir = path.dirname(STAFF_FILE)
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

// ============================================
// GET ALL STAFF
// ============================================

export async function getStaff(): Promise<StaffMember[]> {
  if (process.env.VERCEL && redis) {
    try {
      const staff = await redis.get(STAFF_KEY)
      return (staff as StaffMember[]) || []
    } catch (error) {
      console.error('Redis get error:', error)
      return []
    }
  }

  try {
    if (!fs.existsSync(STAFF_FILE)) {
      fs.writeFileSync(STAFF_FILE, JSON.stringify([], null, 2))
      return []
    }
    const content = fs.readFileSync(STAFF_FILE, 'utf-8')
    return JSON.parse(content)
  } catch (error) {
    console.error('File read error:', error)
    return []
  }
}

// ============================================
// FILTER STAFF
// ============================================

export async function filterStaff(filters: StaffFilters): Promise<StaffMember[]> {
  const staff = await getStaff()
  
  return staff.filter(member => {
    // Search filter
    if (filters.search) {
      const search = filters.search.toLowerCase()
      const matchName = member.name.toLowerCase().includes(search)
      const matchEmail = member.email.toLowerCase().includes(search)
      if (!matchName && !matchEmail) return false
    }
    
    // Role filter
    if (filters.role && member.primaryRole !== filters.role) {
      return false
    }
    
    // Position filter
    if (filters.position && member.position !== filters.position) {
      return false
    }
    
    // Status filter
    if (filters.status) {
      const isActive = filters.status === 'active'
      if (member.isActive !== isActive) return false
    }
    
    return true
  })
}

// ============================================
// GET STAFF BY ID
// ============================================

export async function getStaffById(id: string): Promise<StaffMember | undefined> {
  const staff = await getStaff()
  return staff.find(s => s.id === id)
}

// ============================================
// CREATE STAFF
// ============================================

export async function createStaff(
  staff: Omit<StaffMember, 'id' | 'createdAt' | 'updatedAt'>
): Promise<StaffMember> {
  const existing = await getStaff()
  const newStaff: StaffMember = {
    ...staff,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  existing.push(newStaff)
  await saveStaff(existing)
  return newStaff
}

// ============================================
// UPDATE STAFF
// ============================================

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

// ============================================
// DELETE STAFF
// ============================================

export async function deleteStaff(id: string): Promise<boolean> {
  const staff = await getStaff()
  const filtered = staff.filter(s => s.id !== id)
  if (filtered.length === staff.length) return false
  await saveStaff(filtered)
  return true
}

// ============================================
// SAVE STAFF (Internal)
// ============================================

async function saveStaff(staff: StaffMember[]): Promise<void> {
  if (process.env.VERCEL && redis) {
    try {
      await redis.set(STAFF_KEY, staff)
    } catch (error) {
      console.error('Redis set error:', error)
      throw new Error('Failed to save staff')
    }
  } else {
    try {
      fs.writeFileSync(STAFF_FILE, JSON.stringify(staff, null, 2))
    } catch (error) {
      console.error('File write error:', error)
      throw new Error('Failed to save staff')
    }
  }
}

// ============================================
// GET STAFF STATS
// ============================================

export async function getStaffStats(): Promise<{
  total: number
  active: number
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
    byRole,
    byPosition,
  }
}