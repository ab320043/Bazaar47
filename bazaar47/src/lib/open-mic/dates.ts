// lib/open-mic/dates.ts

// ============================================
// LOCAL-DATE HELPERS FOR OPEN MIC
// ============================================

/**
 * Why this file exists:
 *
 * `new Date('2026-10-21')` parses as UTC midnight. On the US east
 * coast that renders as Tuesday, October 20th at 8 PM — a full day
 * behind. The admin dashboard was showing "Tuesday, October 20th"
 * for a Wednesday session because of this.
 *
 * Everything in Open Mic that deals with a date *string* goes
 * through `parseIsoLocal` below, which builds the Date at local
 * midnight and never touches UTC.
 */

// ============================================
// INTERNAL
// ============================================

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

// ============================================
// PARSE / FORMAT
// ============================================

/**
 * Parse 'YYYY-MM-DD' into a Date at LOCAL midnight.
 * Returns null on malformed input or impossible dates (2026-02-30).
 *
 * NEVER use `new Date(iso)` for a date-only string in this feature —
 * that path produces the "day behind" bug.
 */
export function parseIsoLocal(iso: string): Date | null {
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

/** Format a Date as a local 'YYYY-MM-DD' string. */
export function toIsoLocal(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

// ============================================
// WEDNESDAY CHECKS
// ============================================

/** getDay() returns 0=Sun ... 3=Wed ... 6=Sat. */
export function isWednesdayIso(iso: string): boolean {
  const d = parseIsoLocal(iso)
  if (!d) return false
  return d.getDay() === 3
}

// ============================================
// WEDNESDAY PICKER HELPERS
// ============================================

/**
 * The next `count` Wednesdays starting from `fromIso` (inclusive if
 * fromIso is itself a Wednesday). Returns ISO date strings, ascending.
 *
 * Used by the admin's "create session" picker so the admin can only
 * land on Wednesdays.
 */
export function getNextWednesdays(fromIso: string, count: number): string[] {
  const from = parseIsoLocal(fromIso)
  if (!from) return []

  const out: string[] = []
  const cursor = new Date(from)

  // Advance to the first Wednesday on-or-after `from`
  const dow = cursor.getDay()
  const offset = (3 - dow + 7) % 7
  cursor.setDate(cursor.getDate() + offset)

  for (let i = 0; i < count; i++) {
    out.push(toIsoLocal(cursor))
    cursor.setDate(cursor.getDate() + 7)
  }

  return out
}

/**
 * Shift an ISO date by N weeks (positive or negative). Used by the
 * prev/next week arrows in the Wednesday picker.
 */
export function shiftWeeks(iso: string, weeks: number): string {
  const d = parseIsoLocal(iso)
  if (!d) return iso
  d.setDate(d.getDate() + weeks * 7)
  return toIsoLocal(d)
}

/**
 * Today, as a local-midnight ISO string. Convenience — callers
 * should not need to recompute this themselves.
 */
export function todayIsoLocal(): string {
  return toIsoLocal(new Date())
}

// ============================================
// DISPLAY
// ============================================

const WEEKDAYS_LONG = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]

const MONTHS_LONG = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

/**
 * "Wednesday, October 21, 2026" — local-date-safe.
 * This is what fixes the "day behind" display on the builder header.
 */
export function formatSessionLong(iso: string): string {
  const d = parseIsoLocal(iso)
  if (!d) return iso
  return `${WEEKDAYS_LONG[d.getDay()]}, ${MONTHS_LONG[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}

/**
 * "Wed, Oct 21" — compact, used on chips in the picker.
 */
export function formatSessionShort(iso: string): string {
  const d = parseIsoLocal(iso)
  if (!d) return iso
  const monthShort = MONTHS_LONG[d.getMonth()].slice(0, 3)
  return `${WEEKDAYS_LONG[d.getDay()].slice(0, 3)}, ${monthShort} ${d.getDate()}`
}

/**
 * "October 21, 2026" — for compact secondary labels.
 */
export function formatSessionDateOnly(iso: string): string {
  const d = parseIsoLocal(iso)
  if (!d) return iso
  return `${MONTHS_LONG[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}