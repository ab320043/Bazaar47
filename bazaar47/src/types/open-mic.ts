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
}

export interface OpenMicLineupUpdatePayload {
  lineup: LineupSlot[]
}