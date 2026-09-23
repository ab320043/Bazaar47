// types/big-caf-meetings.ts

// ============================================
// BIG CAF MEETING AVAILABILITY
// ============================================

/**
 * A single selected day plus the person's free-text availability window
 * on that day.
 *
 * - `date` is an ISO string 'YYYY-MM-DD', guaranteed to be a valid
 *   meeting day (Wed/Thu/Fri, inside the window).
 * - `timeWindow` is free-text like "4 PM", "5-7", "after 6". An empty
 *   string means "anytime within the meeting window (3 PM – 8 PM)".
 *   No validation on content — it's a note for the admin, not a
 *   structured time.
 */
export interface BigCafAvailabilityEntry {
  date: string
  timeWindow: string
}

export interface BigCafMeetingResponse {
  id: string
  timestamp: string
  fullName: string
  email: string
  phone: string

  /**
   * Per-day availability. Sorted by date ascending. Never empty for a
   * valid response — at least one day is required to submit.
   */
  availability: BigCafAvailabilityEntry[]

  /**
   * Per-person admin flag. Set to true once a meeting has been
   * scheduled with that person out-of-band.
   */
  confirmed: boolean

  /**
   * Free-text admin note, e.g. "Confirmed for Wed Feb 17, 2pm".
   */
  confirmedNote?: string

  createdAt: string
  updatedAt: string
}

// ============================================
// API PAYLOADS
// ============================================

export interface BigCafMeetingSubmitPayload {
  fullName: string
  email: string
  phone: string
  availability: BigCafAvailabilityEntry[]
}

export interface BigCafMeetingUpdatePayload {
  confirmed?: boolean
  confirmedNote?: string
}