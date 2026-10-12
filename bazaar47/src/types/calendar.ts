// types/calendar.ts

// ============================================
// UNIFIED CALENDAR EVENT
// ============================================

/**
 * The unified shape the calendar page uses, regardless of source.
 * Every event that appears on /events — native, workshop, Open Mic,
 * or 3rd-party — gets normalized into this type.
 */
export type CalendarEventSource =
  | 'native'      // from data/events.ts — Bazaar47 event
  | 'workshop'    // from workshops-data.ts
  | 'open-mic'    // recurring, every Wednesday
  | 'external'    // from data/calendar-events.ts — 3rd-party booking

/**
 * Category used for filtering.
 */
export type CalendarEventCategory =
  | 'tour'
  | 'workshop'
  | 'community'
  | 'open-mic'
  | 'external'

export interface CalendarEvent {
  /** Unique ID, prefixed by source to avoid collisions. */
  id: string
  source: CalendarEventSource
  category: CalendarEventCategory
  title: string
  /** ISO date 'YYYY-MM-DD' — the day this event happens on. */
  date: string
  /** Free-text start time, e.g. '8:00 PM'. */
  timeStart: string
  /** Free-text end time, e.g. '11:00 PM'. Optional. */
  timeEnd?: string
  venue: string
  description?: string
  /** Internal link (route within bazaar47.com). */
  internalUrl?: string
  /** External link (opens in new tab). Mutually exclusive with internalUrl. */
  externalUrl?: string
  /** Optional image URL (not used by the calendar grid; reserved for the list). */
  imageUrl?: string
  /** True for recurring events (Open Mic). Signals dashed border in grid. */
  isRecurring?: boolean
}

// ============================================
// 3RD-PARTY EVENTS CONFIG SHAPE
// ============================================

/**
 * The shape of entries in data/calendar-events.ts. You edit that file
 * by hand to add bookings that aren't part of Bazaar47's own program.
 */
export interface ExternalCalendarEventConfig {
  id: string
  title: string
  date: string           // ISO 'YYYY-MM-DD'
  timeStart: string      // '7:00 PM'
  timeEnd?: string
  venue?: string
  description?: string
  externalUrl: string    // required
  category?: string      // free-form tag like 'concert' | 'private'
}