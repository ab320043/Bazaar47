// lib/open-mic/sessions-state.ts

// ============================================
// SESSION STATE
// ============================================

import { parseIsoLocal, toIsoLocal } from '@/lib/open-mic/dates'

/**
 * 'current'  → session date === today (local). Only possible on a Wednesday.
 * 'upcoming' → session date is after today.
 * 'past'     → session date is strictly before today. Read-only forever.
 *
 * Today is computed from local midnight — never UTC — so the day the
 * Oct 21 session flips to 'past' is Oct 22 at 00:00 local, not 8 PM
 * or 7 PM on Oct 21 (depending on DST).
 */
export type SessionState = 'current' | 'upcoming' | 'past'

export const SESSION_STATE_LABELS: Record<SessionState, string> = {
  current: 'Current',
  upcoming: 'Upcoming',
  past: 'Archived',
}

// ============================================
// CLASSIFIER
// ============================================

export function classifySession(
  sessionIso: string,
  now: Date = new Date()
): SessionState {
  const sessionDate = parseIsoLocal(sessionIso)
  if (!sessionDate) return 'upcoming' // malformed date → treat as upcoming

  const todayIso = toIsoLocal(now)
  const sessionIsoNorm = toIsoLocal(sessionDate)

  if (sessionIsoNorm < todayIso) return 'past'
  if (sessionIsoNorm === todayIso) return 'current'
  return 'upcoming'
}

/**
 * Convenience: is the session locked (read-only)?
 * Currently only 'past' sessions are locked.
 */
export function isSessionLocked(state: SessionState): boolean {
  return state === 'past'
}