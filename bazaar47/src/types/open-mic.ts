// types/open-mic.ts

// ============================================
// OPEN MIC — RAW SUBMISSION (THE POOL)
// ============================================

export interface OpenMicSubmission {
  id: string
  submittedAt: string
  fullName: string
  artistName: string
  genre: string
  musicLink?: string
  instagram?: string
  email: string
  addedByAdmin?: boolean

  /**
   * ISO dates ('YYYY-MM-DD') of every Open Mic Wednesday this artist
   * has signed up for. An artist in multiple weeks appears once in the
   * pool with multiple entries here. New submissions append; existing
   * submissions never overwrite the array.
   *
   * Legacy records (pre per-week signups) have `sessionDates: []` and
   * surface in the admin dashboard's "Unscheduled legacy" section so
   * the admin can assign a week manually.
   */
  sessionDates: string[]

  createdAt: string
  updatedAt: string
}

// ============================================
// OPEN MIC — SCHEDULED LINEUP
// ============================================

export interface LineupSlot {
  id: string // unique slot id
  submissionId: string // links to OpenMicSubmission
  artistName: string
  startTime: string // ISO string for the specific date
  durationMinutes: number
}

export interface OpenMicSession {
  id: string // ISO date of the session 'YYYY-MM-DD'
  date: string // 'YYYY-MM-DD'
  lineup: LineupSlot[]
  createdAt: string
  updatedAt: string
}

// ============================================
// API PAYLOADS
// ============================================

export interface OpenMicSubmitPayload {
  fullName: string
  artistName: string
  genre: string
  musicLink?: string
  instagram?: string
  email: string
  /**
   * Target session date. Derived server-side from the submission
   * window (the coming Wednesday), not user-chosen. Optional in the
   * type so callers who don't care can omit it, but the route always
   * fills it in.
   */
  sessionIso?: string
}

export interface OpenMicLineupUpdatePayload {
  lineup: LineupSlot[]
}