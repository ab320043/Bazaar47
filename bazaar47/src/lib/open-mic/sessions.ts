// lib/open-mic/sessions.ts

// ============================================
// OPEN MIC — SESSION DATE MATH
// ============================================

/**
 * All session math is done in Gainesville local time
 * (America/New_York). We never touch UTC.
 *
 * Session cadence: every Wednesday, starting Oct 21, 2026.
 *
 * Submission window per session:
 *   Opens:  Thursday 00:00 (7 days before the session Wednesday)
 *   Closes: Tuesday 23:59 (day before the session Wednesday)
 *   Session day (Wed) is closed — the form shows "closed, next session
 *   opens Thursday."
 *
 * SPECIAL CASE — first session:
 *   The first session (Oct 21, 2026) opens for submissions IMMEDIATELY,
 *   not on the Thursday-before. This lets people sign up as soon as
 *   the feature ships. Once the first session's Tuesday close passes,
 *   the normal rolling window takes over for every subsequent session.
 */

/** First session — Wednesday, October 21, 2026. */
export const FIRST_SESSION_ISO = '2026-10-21'

const MS_PER_DAY = 24 * 60 * 60 * 1000

// ============================================
// LOW-LEVEL DATE HELPERS
// ============================================

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

/** Format a Date as local ISO date 'YYYY-MM-DD'. */
export function toIsoLocal(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

/** Parse 'YYYY-MM-DD' to a Date at local midnight. Null on invalid. */
export function fromIsoLocal(iso: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!match) return null
  const y = Number(match[1])
  const m = Number(match[2]) - 1
  const d = Number(match[3])
  const date = new Date(y, m, d)
  if (
    date.getFullYear() !== y ||
    date.getMonth() !== m ||
    date.getDate() !== d
  ) {
    return null
  }
  return date
}

/** Local midnight of a given reference (defaults to now). */
function midnightOf(referenceDate: Date = new Date()): Date {
  return new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate()
  )
}

// ============================================
// SESSION BOUNDS
// ============================================

/**
 * For a given session Wednesday, return the ISO date when its submission
 * window opens (Thursday, 7 days before) and closes (Tuesday, 1 day
 * before).
 */
export function getSessionWindow(sessionIso: string): {
  opensIso: string
  closesIso: string
} | null {
  const session = fromIsoLocal(sessionIso)
  if (!session) return null

  const opens = new Date(session)
  opens.setDate(session.getDate() - 7)

  const closes = new Date(session)
  closes.setDate(session.getDate() - 1)

  return {
    opensIso: toIsoLocal(opens),
    closesIso: toIsoLocal(closes),
  }
}

/**
 * Is the submission window for this session currently open?
 *
 * Standard rule:
 *   today >= window.opensIso  AND  today <= window.closesIso
 *
 * First-session exception:
 *   The first session (FIRST_SESSION_ISO) is open from ANY date before
 *   its Tuesday close — regardless of the opens-Thursday rule. This
 *   lets early sign-ups work the moment the feature ships.
 */
export function isSessionOpen(
  sessionIso: string,
  referenceDate: Date = new Date()
): boolean {
  const window = getSessionWindow(sessionIso)
  if (!window) return false

  const todayIso = toIsoLocal(referenceDate)

  // First session: open any time up through its Tuesday close.
  if (sessionIso === FIRST_SESSION_ISO) {
    return todayIso <= window.closesIso
  }

  // Standard window
  return todayIso >= window.opensIso && todayIso <= window.closesIso
}

// ============================================
// NEXT / CURRENT SESSION
// ============================================

/**
 * The Wednesday of the week containing `date` (Sun-aligned weeks).
 * If the given date IS a Wednesday, returns that day.
 */
function wednesdayOfWeekContaining(date: Date): Date {
  const dow = date.getDay()
  const offsetToWed = (3 - dow + 7) % 7
  const wed = new Date(date)
  wed.setDate(date.getDate() + offsetToWed)
  return wed
}

/**
 * The *current* session date:
 *  - If today is Wednesday, returns today (this session is happening).
 *  - If today is Thursday–Tuesday, returns the upcoming Wednesday.
 *  - Never returns a date before FIRST_SESSION_ISO.
 *  - Returns FIRST_SESSION_ISO if today is before it.
 */
export function getCurrentSessionIso(
  referenceDate: Date = new Date()
): string | null {
  const first = fromIsoLocal(FIRST_SESSION_ISO)
  if (!first) return null

  const today = midnightOf(referenceDate)

  // Before first session: "current" is the first session itself
  if (today.getTime() < first.getTime()) {
    return FIRST_SESSION_ISO
  }

  const wed = wednesdayOfWeekContaining(today)
  return toIsoLocal(wed)
}

/**
 * The next session accepting submissions.
 *
 * Behavior:
 *  - Before FIRST_SESSION_ISO: returns FIRST_SESSION_ISO (open early).
 *  - On Wed (session day): returns next Wednesday (current is closed).
 *  - Thu–Tue: returns the upcoming Wednesday.
 */
export function getNextSessionIso(
  referenceDate: Date = new Date()
): string | null {
  const first = fromIsoLocal(FIRST_SESSION_ISO)
  if (!first) return null

  const today = midnightOf(referenceDate)

  // Before first session: next is the first session
  if (today.getTime() < first.getTime()) {
    return FIRST_SESSION_ISO
  }

  const current = getCurrentSessionIso(referenceDate)
  if (!current) return null

  const currentDate = fromIsoLocal(current)
  if (!currentDate) return null

  const dow = referenceDate.getDay()

  // On session day, jump to next week
  if (dow === 3) {
    const next = new Date(currentDate)
    next.setDate(currentDate.getDate() + 7)
    return toIsoLocal(next)
  }

  return current
}

/**
 * The session *after* the next one — used for "sign-ups open Thursday"
 * messages on session day.
 */
export function getFollowingSessionIso(
  referenceDate: Date = new Date()
): string | null {
  const next = getNextSessionIso(referenceDate)
  if (!next) return null
  const nextDate = fromIsoLocal(next)
  if (!nextDate) return null
  const following = new Date(nextDate)
  following.setDate(nextDate.getDate() + 7)
  return toIsoLocal(following)
}

// ============================================
// HISTORY / RANGE
// ============================================

/**
 * Every Wednesday from FIRST_SESSION_ISO up to (and including) the
 * current session date. Sorted ascending. If today is before the first
 * session, returns just [FIRST_SESSION_ISO].
 */
export function getAllSessionDatesUpTo(
  referenceDate: Date = new Date()
): string[] {
  const first = fromIsoLocal(FIRST_SESSION_ISO)
  if (!first) return []

  const current = getCurrentSessionIso(referenceDate)
  if (!current) return []

  const currentDate = fromIsoLocal(current)
  if (!currentDate) return []

  const out: string[] = []
  const cursor = new Date(first)
  while (cursor.getTime() <= currentDate.getTime()) {
    out.push(toIsoLocal(cursor))
    cursor.setDate(cursor.getDate() + 7)
  }
  return out
}

// ============================================
// DISPLAY FORMATTING
// ============================================

const MONTHS_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]
const WEEKDAYS_LONG = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday',
  'Thursday', 'Friday', 'Saturday',
]

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

/**
 * "Wednesday, October 21, 2026"
 */
export function formatSessionLong(iso: string): string {
  const d = fromIsoLocal(iso)
  if (!d) return iso
  return `${WEEKDAYS_LONG[d.getDay()]}, ${MONTHS_LONG[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}

/**
 * "Wednesday, Oct 21" — no year for compact UI.
 */
export function formatSessionShort(iso: string): string {
  const d = fromIsoLocal(iso)
  if (!d) return iso
  return `${WEEKDAYS_LONG[d.getDay()]}, ${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}`
}

/**
 * "Wed, Oct 21"
 */
export function formatSessionTiny(iso: string): string {
  const d = fromIsoLocal(iso)
  if (!d) return iso
  return `${WEEKDAYS_LONG[d.getDay()].slice(0, 3)}, ${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}`
}

/**
 * "October 21st" — used for headings.
 */
export function formatSessionMonthDay(iso: string): string {
  const d = fromIsoLocal(iso)
  if (!d) return iso
  return `${MONTHS_LONG[d.getMonth()]} ${ordinal(d.getDate())}`
}