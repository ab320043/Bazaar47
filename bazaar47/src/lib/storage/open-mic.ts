// lib/storage/open-mic.ts
import { Redis } from '@upstash/redis'
import type { OpenMicSubmission } from '@/types/open-mic'

const redis = Redis.fromEnv()
const OPEN_MIC_KEY = 'open_mic_submissions'

/**
 * Storage shape:
 *   {
 *     "2026-10-21": [submission, submission, ...],
 *     "2026-10-28": [...],
 *   }
 *
 * Keyed by session ISO date. Submissions are never removed even when
 * a session is in the past.
 */
type SubmissionsBySession = Record<string, OpenMicSubmission[]>

// ============================================
// READ / WRITE
// ============================================

async function getMap(): Promise<SubmissionsBySession> {
  try {
    const raw = await redis.get(OPEN_MIC_KEY)
    return (raw as SubmissionsBySession) || {}
  } catch (error) {
    console.error('Redis get error (open_mic_submissions):', error)
    return {}
  }
}

async function saveMap(map: SubmissionsBySession): Promise<void> {
  try {
    await redis.set(OPEN_MIC_KEY, map)
  } catch (error) {
    console.error('Redis set error (open_mic_submissions):', error)
    throw new Error('Failed to save Open Mic submissions')
  }
}

// ============================================
// PUBLIC API
// ============================================

export async function getSubmissionsForSession(
  sessionIso: string
): Promise<OpenMicSubmission[]> {
  const map = await getMap()
  return map[sessionIso] || []
}

export async function getAllSessionsWithSubmissions(): Promise<
  Record<string, OpenMicSubmission[]>
> {
  return await getMap()
}

export async function getSubmissionById(
  id: string
): Promise<{ sessionIso: string; submission: OpenMicSubmission } | null> {
  const map = await getMap()
  for (const [sessionIso, submissions] of Object.entries(map)) {
    const found = submissions.find((s) => s.id === id)
    if (found) {
      return { sessionIso, submission: found }
    }
  }
  return null
}

export async function createSubmission(
  sessionIso: string,
  input: Omit<
    OpenMicSubmission,
    'id' | 'sessionDate' | 'createdAt' | 'updatedAt'
  >
): Promise<OpenMicSubmission> {
  const map = await getMap()
  const existing = map[sessionIso] || []

  const normalizedEmail = input.email.trim().toLowerCase()
  const duplicate = existing.find(
    (s) => s.email.trim().toLowerCase() === normalizedEmail
  )
  if (duplicate) {
    const err = new Error(
      'This email is already signed up for this session'
    )
    err.name = 'DuplicateSubmission'
    throw err
  }

  const now = new Date().toISOString()
  const submission: OpenMicSubmission = {
    ...input,
    id: crypto.randomUUID(),
    sessionDate: sessionIso,
    createdAt: now,
    updatedAt: now,
  }

  map[sessionIso] = [...existing, submission]
  await saveMap(map)
  return submission
}

/**
 * Update an existing submission. Only admin-editable fields.
 * Passing an empty string for musicLink clears it.
 */
export async function updateSubmission(
  id: string,
  updates: Partial<
    Pick<
      OpenMicSubmission,
      'fullName' | 'artistName' | 'genre' | 'musicLink' | 'instagram' | 'email'
    >
  >
): Promise<OpenMicSubmission | null> {
  const map = await getMap()
  for (const sessionIso of Object.keys(map)) {
    const submissions = map[sessionIso]
    const idx = submissions.findIndex((s) => s.id === id)
    if (idx !== -1) {
      const existing = submissions[idx]
      const updated: OpenMicSubmission = {
        ...existing,
        ...updates,
        updatedAt: new Date().toISOString(),
      }
      submissions[idx] = updated
      map[sessionIso] = submissions
      await saveMap(map)
      return updated
    }
  }
  return null
}

export async function deleteSubmission(id: string): Promise<boolean> {
  const map = await getMap()
  for (const sessionIso of Object.keys(map)) {
    const submissions = map[sessionIso]
    const filtered = submissions.filter((s) => s.id !== id)
    if (filtered.length !== submissions.length) {
      map[sessionIso] = filtered
      await saveMap(map)
      return true
    }
  }
  return false
}