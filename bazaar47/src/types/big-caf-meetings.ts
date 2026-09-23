// types/big-caf-meetings.ts

// ============================================
// BIG CAF MEETING AVAILABILITY
// ============================================

export interface BigCafMeetingResponse {
  id: string
  timestamp: string
  fullName: string
  email: string
  phone: string

  /**
   * ISO date strings ('YYYY-MM-DD') the person marked as available.
   * All entries are guaranteed to be valid meeting days inside the
   * current window (Wed/Thu/Fri, between window start and 2027-03-26).
   * Sorted ascending.
   */
  selectedDays: string[]

  /**
   * Per-person admin flag. Admin marks a response as "confirmed" once
   * a meeting has been scheduled with that person out-of-band.
   */
  confirmed: boolean

  /**
   * Free-text note the admin can attach to a confirmed person, e.g.
   * "Confirmed for Wed Feb 17, 2pm".
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
  selectedDays: string[]
}

export interface BigCafMeetingUpdatePayload {
  confirmed?: boolean
  confirmedNote?: string
}