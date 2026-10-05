// lib/storage/staff-checklists.ts
import { Redis } from '@upstash/redis'
import type { StaffChecklist, ChecklistItem, ChecklistItemKind } from '@/types/staff'

const redis = Redis.fromEnv()
const CHECKLISTS_KEY = 'staff_checklists'

type ChecklistsMap = Record<string, StaffChecklist>

// ============================================
// READ / WRITE
// ============================================

async function getMap(): Promise<ChecklistsMap> {
  try {
    const raw = await redis.get(CHECKLISTS_KEY)
    return (raw as ChecklistsMap) || {}
  } catch (error) {
    console.error('Redis get error (staff_checklists):', error)
    return {}
  }
}

async function saveMap(map: ChecklistsMap): Promise<void> {
  try {
    await redis.set(CHECKLISTS_KEY, map)
  } catch (error) {
    console.error('Redis set error (staff_checklists):', error)
    throw new Error('Failed to save checklist')
  }
}

// ============================================
// PUBLIC API
// ============================================

/**
 * Get the staff member's checklist. Creates an empty one lazily on
 * first access so callers don't need a separate "create" step.
 */
export async function getChecklistForStaff(
  staffId: string
): Promise<StaffChecklist> {
  const map = await getMap()
  const existing = map[staffId]
  if (existing) return existing

  // Lazy create
  const created: StaffChecklist = {
    staffId,
    items: [],
    updatedAt: new Date().toISOString(),
  }
  map[staffId] = created
  await saveMap(map)
  return created
}

export async function createItem(
  staffId: string,
  input: { kind: ChecklistItemKind; title: string; detail?: string }
): Promise<ChecklistItem> {
  const map = await getMap()
  const now = new Date().toISOString()
  const item: ChecklistItem = {
    id: crypto.randomUUID(),
    kind: input.kind,
    title: input.title.trim(),
    detail: input.detail?.trim() || undefined,
    done: false,
    createdAt: now,
    updatedAt: now,
  }

  const checklist: StaffChecklist =
    map[staffId] || {
      staffId,
      items: [],
      updatedAt: now,
    }
  checklist.items.push(item)
  checklist.updatedAt = now
  map[staffId] = checklist
  await saveMap(map)
  return item
}

export async function updateItem(
  staffId: string,
  itemId: string,
  updates: { title?: string; detail?: string; done?: boolean }
): Promise<ChecklistItem | undefined> {
  const map = await getMap()
  const checklist = map[staffId]
  if (!checklist) return undefined

  const index = checklist.items.findIndex((i) => i.id === itemId)
  if (index === -1) return undefined

  const existing = checklist.items[index]
  const updated: ChecklistItem = {
    ...existing,
    title:
      updates.title !== undefined ? updates.title.trim() : existing.title,
    detail:
      updates.detail !== undefined ? updates.detail.trim() : existing.detail,
    done: updates.done !== undefined ? updates.done : existing.done,
    updatedAt: new Date().toISOString(),
  }
  checklist.items[index] = updated
  checklist.updatedAt = updated.updatedAt
  await saveMap(map)
  return updated
}

export async function deleteItem(
  staffId: string,
  itemId: string
): Promise<boolean> {
  const map = await getMap()
  const checklist = map[staffId]
  if (!checklist) return false

  const filtered = checklist.items.filter((i) => i.id !== itemId)
  if (filtered.length === checklist.items.length) return false
  checklist.items = filtered
  checklist.updatedAt = new Date().toISOString()
  await saveMap(map)
  return true
}