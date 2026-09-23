// data/big-caf-meetings.ts

// ============================================
// BIG CAF FESTIVAL — MEETING AVAILABILITY CONFIG
// ============================================

/**
 * The festival is April 2027. Meetings happen Wed/Thu/Fri every week,
 * from "the next Wednesday from today" (rolling) through the last
 * Friday of March 2027.
 *
 * To change the window or the meeting days, edit this file. Nothing
 * else in the codebase hardcodes these values.
 */

// Last meeting day — Friday, March 26, 2027.
export const MEETING_WINDOW_END_ISO = '2027-03-26'

// ISO day-of-week numbers: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
export const MEETING_WEEKDAYS: readonly number[] = [3, 4, 5] as const

// ============================================
// PAGE COPY
// ============================================

export const PAGE_TITLE = 'Big Caf Festival — Meeting Availability'

export const PAGE_DESCRIPTION =
  'Pick the days you are available to meet with us. Meetings happen on Wednesdays, Thursdays, and Fridays.'

export const PAGE_INTRO =
  'We are preparing for The Big Caf Festival in April 2027. Choose any of the highlighted days below that work for you — you can pick as many as you like. We will follow up to lock in a time.'

// ============================================
// ROLLING WINDOW START
// ============================================

/**
 * Returns the first meeting-eligible day, as an ISO date string.
 *
 * "Rolling" means this is computed at request time: the next Wednesday
 * from today. If today IS a Wednesday, today counts (inclusive).
 */
export function getMeetingWindowStartIso(): string {
  const now = new Date()
  // Normalize to local midnight so date comparisons are consistent.
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const day = today.getDay() // 0-6
  // Wednesday is 3. If today is Wed, offset = 0. Otherwise advance to next Wed.
  const offset = (3 - day + 7) % 7

  const start = new Date(today)
  start.setDate(today.getDate() + offset)

  return toIsoLocal(start)
}

// ============================================
// INTERNAL DATE HELPERS (kept here so this file is self-contained)
// ============================================

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

function toIsoLocal(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}