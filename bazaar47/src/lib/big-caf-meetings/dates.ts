// lib/big-caf-meetings/dates.ts
import {
  MEETING_WEEKDAYS,
  MEETING_WINDOW_END_ISO,
  getMeetingWindowStartIso,
} from '@/data/big-caf-meetings'

// ============================================
// INTERNAL HELPERS
// ============================================

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

/**
 * Format a Date as a local-timezone ISO date ('YYYY-MM-DD').
 * Deliberately NOT `toISOString()` — that would shift to UTC and break
 * date comparisons for anyone west of UTC.
 */
export function toIsoLocal(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

/**
 * Parse an ISO date string ('YYYY-MM-DD') into a Date at local midnight.
 * Returns null on malformed input.
 */
export function fromIsoLocal(iso: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2]) - 1
  const day = Number(match[3])
  const d = new Date(year, month, day)
  if (
    d.getFullYear() !== year ||
    d.getMonth() !== month ||
    d.getDate() !== day
  ) {
    return null // Invalid like 2027-02-30
  }
  return d
}

// ============================================
// WINDOW CHECKS
// ============================================

export function getWindowStart(): Date {
  const iso = getMeetingWindowStartIso()
  const d = fromIsoLocal(iso)
  // getMeetingWindowStartIso always returns a valid ISO, so d is never null.
  return d as Date
}

export function getWindowEnd(): Date {
  const d = fromIsoLocal(MEETING_WINDOW_END_ISO)
  return d as Date
}

/**
 * Is this a valid meeting day? Must be a Wed/Thu/Fri AND fall inside
 * the current rolling window (windowStart <= date <= windowEnd).
 */
export function isMeetingDay(date: Date): boolean {
  if (!MEETING_WEEKDAYS.includes(date.getDay())) return false
  const start = getWindowStart()
  const end = getWindowEnd()
  const t = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  ).getTime()
  return t >= start.getTime() && t <= end.getTime()
}

/** Convenience overload for ISO date strings. */
export function isMeetingDayIso(iso: string): boolean {
  const d = fromIsoLocal(iso)
  if (!d) return false
  return isMeetingDay(d)
}

// ============================================
// MONTH / GRID HELPERS
// ============================================

/** First and last day of the whole window, as ISO strings. */
export function getWindowRangeIso(): { startIso: string; endIso: string } {
  return {
    startIso: getMeetingWindowStartIso(),
    endIso: MEETING_WINDOW_END_ISO,
  }
}

/**
 * Every valid meeting day in a given month. Year is 4-digit; month is 1-12.
 * Returns ISO strings ascending. Empty array if the month falls entirely
 * outside the window.
 */
export function getMeetingDatesForMonth(
  year: number,
  month: number
): string[] {
  const out: string[] = []
  const daysInMonth = new Date(year, month, 0).getDate()
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month - 1, day)
    if (isMeetingDay(d)) out.push(toIsoLocal(d))
  }
  return out
}

export interface MonthGridCell {
  iso: string | null // null = padding cell (empty leading/trailing)
  dayOfMonth: number | null
  isMeetingDay: boolean
  isInWindow: boolean // within window overall (even if not a Wed/Thu/Fri)
  isToday: boolean
}

/**
 * Build a 7-column grid for a month (Sunday-first), padded with null-iso
 * cells at the start and end so it always renders a clean rectangle.
 * Does NOT normalize to a fixed 6 rows — returns exactly what the month
 * needs (5 or 6 rows typically).
 */
export function buildMonthGrid(
  year: number,
  month: number
): MonthGridCell[] {
  const first = new Date(year, month - 1, 1)
  const daysInMonth = new Date(year, month, 0).getDate()
  const leadingBlanks = first.getDay() // 0-6

  const cells: MonthGridCell[] = []

  for (let i = 0; i < leadingBlanks; i++) {
    cells.push({
      iso: null,
      dayOfMonth: null,
      isMeetingDay: false,
      isInWindow: false,
      isToday: false,
    })
  }

  const windowStart = getWindowStart().getTime()
  const windowEnd = getWindowEnd().getTime()
  const todayIso = toIsoLocal(new Date())

  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month - 1, day)
    const t = d.getTime()
    const iso = toIsoLocal(d)

    cells.push({
      iso,
      dayOfMonth: day,
      isMeetingDay: isMeetingDay(d),
      isInWindow: t >= windowStart && t <= windowEnd,
      isToday: iso === todayIso,
    })
  }

  // Pad trailing cells to complete the last week row.
  while (cells.length % 7 !== 0) {
    cells.push({
      iso: null,
      dayOfMonth: null,
      isMeetingDay: false,
      isInWindow: false,
      isToday: false,
    })
  }

  return cells
}

/**
 * List of { year, month } pairs to allow in the month navigator.
 * Runs from the window's start month through the end month (inclusive).
 */
export function getNavigableMonths(): { year: number; month: number }[] {
  const start = getWindowStart()
  const end = getWindowEnd()
  const out: { year: number; month: number }[] = []

  let cursor = new Date(start.getFullYear(), start.getMonth(), 1)
  const endMonth = new Date(end.getFullYear(), end.getMonth(), 1)

  while (cursor.getTime() <= endMonth.getTime()) {
    out.push({ year: cursor.getFullYear(), month: cursor.getMonth() + 1 })
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1)
  }

  return out
}

// ============================================
// DISPLAY HELPERS
// ============================================

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const WEEKDAY_LONG = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday',
  'Thursday', 'Friday', 'Saturday',
]

export function getMonthName(month: number): string {
  return MONTH_NAMES[month - 1] || ''
}

export function getWeekdayShort(iso: string): string {
  const d = fromIsoLocal(iso)
  if (!d) return ''
  return WEEKDAY_SHORT[d.getDay()]
}

export function getWeekdayLong(iso: string): string {
  const d = fromIsoLocal(iso)
  if (!d) return ''
  return WEEKDAY_LONG[d.getDay()]
}

/**
 * Format a date for display like "Wed, Feb 17". Falls back to the raw
 * ISO on parse failure.
 */
export function formatDayShort(iso: string): string {
  const d = fromIsoLocal(iso)
  if (!d) return iso
  const monthShort = MONTH_NAMES[d.getMonth()].slice(0, 3)
  return `${WEEKDAY_SHORT[d.getDay()]}, ${monthShort} ${d.getDate()}`
}

/**
 * Format a date for display like "Wednesday, February 17, 2027".
 */
export function formatDayLong(iso: string): string {
  const d = fromIsoLocal(iso)
  if (!d) return iso
  return `${WEEKDAY_LONG[d.getDay()]}, ${MONTH_NAMES[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}

export const WEEKDAY_HEADERS = WEEKDAY_SHORT