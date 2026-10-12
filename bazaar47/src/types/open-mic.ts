// types/open-mic.ts

// ============================================
// OPEN MIC — RECURRING WEEKLY EVENT
// ============================================

/**
 * A single Open Mic submission. Attached to a specific session date
 * (always a Wednesday) at submission time.
 */
export interface OpenMicSubmission {
  id: string
  /** ISO date 'YYYY-MM-DD' — the Wednesday this submission is for. */
  sessionDate: string
  /** ISO timestamp of when the submission was created. */
  submittedAt: string
  fullName: string
  artistName: string
  genre: string
  /** Optional URL to the artist's music (Spotify, SoundCloud, etc). */
  musicLink?: string
  instagram?: string
  email: string
  /** Short human-readable confirmation code shown to the artist. */
  confirmationNumber: string
  /** Set if an admin added this submission on behalf of the artist. */
  addedByAdmin?: boolean
  createdAt: string
  updatedAt: string
}

/**
 * A derived view of one session: its date plus the submissions attached
 * to it. Sessions themselves are not stored — only submissions are.
 */
export interface OpenMicSession {
  /** ISO date 'YYYY-MM-DD' — a Wednesday. */
  sessionDate: string
  submissions: OpenMicSubmission[]
  /** True if this session's submission window is currently open. */
  isOpen: boolean
  /** True if this is the Wednesday currently happening (session day). */
  isToday: boolean
  /** True if this session already happened (sessionDate < today). */
  isPast: boolean
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

export interface OpenMicAdminCreatePayload {
  sessionDate: string
  fullName: string
  artistName: string
  genre: string
  musicLink?: string
  instagram?: string
  email: string
  /** If true, send a confirmation email to the artist. */
  sendConfirmation: boolean
}