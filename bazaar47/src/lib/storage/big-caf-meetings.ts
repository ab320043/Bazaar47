// lib/storage/big-caf-meetings.ts
import { Redis } from '@upstash/redis'
import type {
  BigCafMeetingResponse,
  BigCafMeetingSubmitPayload,
  BigCafMeetingUpdatePayload,
} from '@/types/big-caf-meetings'

const redis = Redis.fromEnv()
const RESPONSES_KEY = 'big_caf_meeting_responses'

// ============================================
// READ / WRITE
// ============================================

export async function getResponses(): Promise<BigCafMeetingResponse[]> {
  try {
    const raw = await redis.get(RESPONSES_KEY)
    return (raw as BigCafMeetingResponse[]) || []
  } catch (error) {
    console.error('Redis get error (big_caf_meeting_responses):', error)
    return []
  }
}

async function saveResponses(
  responses: BigCafMeetingResponse[]
): Promise<void> {
  try {
    await redis.set(RESPONSES_KEY, responses)
  } catch (error) {
    console.error('Redis set error (big_caf_meeting_responses):', error)
    throw new Error('Failed to save meeting responses')
  }
}

// ============================================
// UPSERT BY EMAIL
// ============================================

/**
 * Create or update a response, keyed on lowercased email.
 *
 * - If no response exists for this email: creates a new one.
 * - If one exists: updates fullName, phone, and selectedDays, and bumps
 *   updatedAt. Preserves the original id, timestamp, createdAt, and any
 *   admin-set confirmed / confirmedNote values (an upsert by the public
 *   form must never clobber admin decisions).
 */
export async function upsertResponseByEmail(
  payload: BigCafMeetingSubmitPayload
): Promise<BigCafMeetingResponse> {
  const responses = await getResponses()
  const now = new Date().toISOString()
  const normalizedEmail = payload.email.trim().toLowerCase()

  const index = responses.findIndex(
    (r) => r.email.trim().toLowerCase() === normalizedEmail
  )

  // Always sort selectedDays ascending so admin views are stable.
  const selectedDays = [...payload.selectedDays].sort()

  if (index === -1) {
    const created: BigCafMeetingResponse = {
      id: crypto.randomUUID(),
      timestamp: now,
      fullName: payload.fullName.trim(),
      email: normalizedEmail,
      phone: payload.phone.trim(),
      selectedDays,
      confirmed: false,
      createdAt: now,
      updatedAt: now,
    }
    responses.push(created)
    await saveResponses(responses)
    return created
  }

  const existing = responses[index]
  const updated: BigCafMeetingResponse = {
    ...existing,
    fullName: payload.fullName.trim(),
    email: normalizedEmail,
    phone: payload.phone.trim(),
    selectedDays,
    updatedAt: now,
    // Preserve: id, timestamp, createdAt, confirmed, confirmedNote
  }
  responses[index] = updated
  await saveResponses(responses)
  return updated
}

// ============================================
// ADMIN: UPDATE
// ============================================

export async function updateResponse(
  id: string,
  updates: BigCafMeetingUpdatePayload
): Promise<BigCafMeetingResponse | undefined> {
  const responses = await getResponses()
  const index = responses.findIndex((r) => r.id === id)
  if (index === -1) return undefined

  const existing = responses[index]
  const updated: BigCafMeetingResponse = {
    ...existing,
    confirmed:
      updates.confirmed !== undefined ? updates.confirmed : existing.confirmed,
    confirmedNote:
      updates.confirmedNote !== undefined
        ? updates.confirmedNote
        : existing.confirmedNote,
    updatedAt: new Date().toISOString(),
  }
  responses[index] = updated
  await saveResponses(responses)
  return updated
}

// ============================================
// ADMIN: DELETE
// ============================================

export async function deleteResponse(id: string): Promise<boolean> {
  const responses = await getResponses()
  const filtered = responses.filter((r) => r.id !== id)
  if (filtered.length === responses.length) return false
  await saveResponses(filtered)
  return true
}