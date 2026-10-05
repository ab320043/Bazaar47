// lib/storage/staff-notes.ts
import { Redis } from '@upstash/redis'
import type { StaffNote } from '@/types/staff'

const redis = Redis.fromEnv()
const NOTES_KEY = 'staff_notes'

type NotesMap = Record<string, StaffNote[]>

// ============================================
// READ / WRITE
// ============================================

async function getMap(): Promise<NotesMap> {
  try {
    const raw = await redis.get(NOTES_KEY)
    return (raw as NotesMap) || {}
  } catch (error) {
    console.error('Redis get error (staff_notes):', error)
    return {}
  }
}

async function saveMap(map: NotesMap): Promise<void> {
  try {
    await redis.set(NOTES_KEY, map)
  } catch (error) {
    console.error('Redis set error (staff_notes):', error)
    throw new Error('Failed to save notes')
  }
}

// ============================================
// CRUD
// ============================================

export async function getNotesForStaff(staffId: string): Promise<StaffNote[]> {
  const map = await getMap()
  const notes = map[staffId] || []
  // Sort newest-first for the grid view
  return [...notes].sort(
    (a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )
}

export async function getNoteById(
  staffId: string,
  noteId: string
): Promise<StaffNote | undefined> {
  const map = await getMap()
  const notes = map[staffId] || []
  return notes.find((n) => n.id === noteId)
}

export async function createNote(
  staffId: string,
  input: { title: string; body: string }
): Promise<StaffNote> {
  const map = await getMap()
  const now = new Date().toISOString()
  const note: StaffNote = {
    id: crypto.randomUUID(),
    staffId,
    title: input.title.trim(),
    body: input.body,
    createdAt: now,
    updatedAt: now,
  }
  if (!map[staffId]) map[staffId] = []
  map[staffId].push(note)
  await saveMap(map)
  return note
}

export async function updateNote(
  staffId: string,
  noteId: string,
  updates: { title?: string; body?: string }
): Promise<StaffNote | undefined> {
  const map = await getMap()
  const notes = map[staffId] || []
  const index = notes.findIndex((n) => n.id === noteId)
  if (index === -1) return undefined

  const existing = notes[index]
  const updated: StaffNote = {
    ...existing,
    title:
      updates.title !== undefined ? updates.title.trim() : existing.title,
    body: updates.body !== undefined ? updates.body : existing.body,
    updatedAt: new Date().toISOString(),
  }
  notes[index] = updated
  map[staffId] = notes
  await saveMap(map)
  return updated
}

export async function deleteNote(
  staffId: string,
  noteId: string
): Promise<boolean> {
  const map = await getMap()
  const notes = map[staffId] || []
  const filtered = notes.filter((n) => n.id !== noteId)
  if (filtered.length === notes.length) return false
  map[staffId] = filtered
  await saveMap(map)
  return true
}