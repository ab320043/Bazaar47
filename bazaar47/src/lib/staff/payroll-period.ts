// lib/staff/payroll-period.ts

// ============================================
// BI-WEEKLY PAYROLL PERIODS
// ============================================

/**
 * Pay periods are two calendar weeks, Sunday → Saturday.
 * The anchor is the Sunday on or before the business's stated start
 * date (Nov 24, 2026 → Sun Nov 22, 2026). Every period is exactly
 * 14 days, computed forward and backward from this anchor.
 *
 * Example periods:
 *   Sun Nov 22 2026 → Sat Dec 5 2026
 *   Sun Dec 6 2026  → Sat Dec 19 2026
 *   Sun Dec 20 2026 → Sat Jan 2 2027
 */
export const PAYROLL_ANCHOR_ISO = '2026-11-22'

const MS_PER_DAY = 24 * 60 * 60 * 1000
const PERIOD_DAYS = 14
const PERIOD_MS = PERIOD_DAYS * MS_PER_DAY

// ============================================
// INTERNAL HELPERS
// ============================================

function toIsoLocal(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function parseIsoLocal(iso: string): Date | null {
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

function formatPeriodLabel(start: Date, end: Date): string {
  const sameMonth = start.getMonth() === end.getMonth()
  const sameYear = start.getFullYear() === end.getFullYear()

  const startMonth = start.toLocaleDateString('en-US', { month: 'short' })
  const endMonth = end.toLocaleDateString('en-US', { month: 'short' })

  if (sameMonth && sameYear) {
    return `${startMonth} ${start.getDate()} – ${end.getDate()}, ${end.getFullYear()}`
  }
  if (sameYear) {
    return `${startMonth} ${start.getDate()} – ${endMonth} ${end.getDate()}, ${end.getFullYear()}`
  }
  return `${startMonth} ${start.getDate()}, ${start.getFullYear()} – ${endMonth} ${end.getDate()}, ${end.getFullYear()}`
}

// ============================================
// PUBLIC API
// ============================================

export interface PayrollPeriod {
  startIso: string
  endIso: string
  label: string
}

/**
 * Returns the [start, end] ISO range of the pay period containing
 * `referenceDate`. Both bounds are inclusive.
 *
 * Periods are 14 days long, aligned to PAYROLL_ANCHOR_ISO.
 */
export function getPeriodForDate(referenceDate: Date = new Date()): PayrollPeriod {
  const anchor = parseIsoLocal(PAYROLL_ANCHOR_ISO)
  if (!anchor) {
    return {
      startIso: PAYROLL_ANCHOR_ISO,
      endIso: PAYROLL_ANCHOR_ISO,
      label: 'Invalid period',
    }
  }

  // Normalize to local midnight
  const ref = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate()
  )

  // Signed offset in days from anchor to reference
  const diffDays = Math.floor(
    (ref.getTime() - anchor.getTime()) / MS_PER_DAY
  )

  // Period index relative to anchor. Math.floor handles negatives
  // correctly so dates before the anchor land in the right period.
  const periodIndex = Math.floor(diffDays / PERIOD_DAYS)

  const start = new Date(anchor.getTime() + periodIndex * PERIOD_MS)
  const end = new Date(start.getTime() + (PERIOD_DAYS - 1) * MS_PER_DAY)

  return {
    startIso: toIsoLocal(start),
    endIso: toIsoLocal(end),
    label: formatPeriodLabel(start, end),
  }
}

/**
 * Returns the period immediately before or after the given one.
 * `direction = -1` gives the previous period, `1` gives the next.
 */
export function shiftPeriod(period: PayrollPeriod, direction: -1 | 1): PayrollPeriod {
  const start = parseIsoLocal(period.startIso)
  if (!start) return period
  const nextStart = new Date(start.getTime() + direction * PERIOD_MS)
  const nextEnd = new Date(nextStart.getTime() + (PERIOD_DAYS - 1) * MS_PER_DAY)
  return {
    startIso: toIsoLocal(nextStart),
    endIso: toIsoLocal(nextEnd),
    label: formatPeriodLabel(nextStart, nextEnd),
  }
}

/**
 * Is `iso` inside the period (inclusive on both ends)?
 */
export function isDateInPeriod(iso: string, period: PayrollPeriod): boolean {
  return iso >= period.startIso && iso <= period.endIso
}