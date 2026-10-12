// lib/calendar/merge.ts

import type { CalendarEvent, CalendarEventCategory } from '@/types/calendar'
import { allEvents } from '@/data/events'
import { workshops } from '@/app/components/calendar-events/workshops-data'
import { externalCalendarEvents } from '@/data/calendar-events'
import {
  FIRST_SESSION_ISO,
  fromIsoLocal,
  toIsoLocal,
} from '@/lib/open-mic/sessions'

// ============================================
// NATIVE EVENTS (from data/events.ts)
// ============================================

function nativeEventsToCalendarEvents(): CalendarEvent[] {
  const out: CalendarEvent[] = []

  for (const event of allEvents) {
    // Skip past events
    if (event.status === 'completed' || event.status === 'past') continue

    // Determine category
    let category: CalendarEventCategory = 'community'
    if (event.type === 'tour') category = 'tour'
    else if (event.type === 'workshop') category = 'workshop'
    else if (event.type === 'block-party') category = 'community'
    else if (event.type === 'custom') category = 'community'

    // Determine link
    let internalUrl: string | undefined
    if (event.type === 'tour') {
      internalUrl = `/tours/${event.slug}`
    } else if (event.id === 'grand-reopening') {
      internalUrl = '/reopening'
    } else {
      // Fallback — link to homepage tour section
      internalUrl = '/#tickets'
    }

    out.push({
      id: `native-${event.id}`,
      source: 'native',
      category,
      title: event.name,
      date: event.date,
      timeStart: event.time,
      venue: event.location,
      description: event.description,
      internalUrl,
    })
  }

  return out
}

// ============================================
// WORKSHOPS (from workshops-data.ts)
// ============================================

/**
 * Workshops are all dated for the South Florida tour (Sept 12, 2026).
 * Since that date has passed, this returns an empty array today —
 * but if the data file gets updated with future workshops, they'll
 * appear on the calendar automatically.
 */
function workshopEventsToCalendarEvents(): CalendarEvent[] {
  const WORKSHOP_DATE = '2026-09-12' // all workshops share this date in current data

  // Skip if the workshop date is in the past
  const today = new Date()
  const todayMidnight = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  )
  const workshopDay = fromIsoLocal(WORKSHOP_DATE)
  if (!workshopDay || workshopDay.getTime() < todayMidnight.getTime()) {
    return []
  }

  return workshops.map((w) => ({
    id: `workshop-${w.id}`,
    source: 'workshop' as const,
    category: 'workshop' as const,
    title: w.title,
    date: WORKSHOP_DATE,
    timeStart: w.time,
    venue: w.table,
    description: w.description,
    internalUrl: `/tickets/UpcomingShows?event=${w.id}`,
  }))
}

// ============================================
// OPEN MIC — every Wednesday from Oct 21, 2026
// ============================================

/**
 * Generates one calendar entry per Wednesday from the first session
 * up through `monthsAhead` months in the future. Past sessions are
 * skipped (calendar shows upcoming only).
 */
function openMicEventsToCalendarEvents(monthsAhead = 15): CalendarEvent[] {
  const first = fromIsoLocal(FIRST_SESSION_ISO)
  if (!first) return []

  const today = new Date()
  const todayMidnight = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  )

  const endDate = new Date(todayMidnight)
  endDate.setMonth(endDate.getMonth() + monthsAhead)

  const out: CalendarEvent[] = []
  const cursor = new Date(first)

  while (cursor.getTime() <= endDate.getTime()) {
    // Skip past sessions
    if (cursor.getTime() >= todayMidnight.getTime()) {
      out.push({
        id: `open-mic-${toIsoLocal(cursor)}`,
        source: 'open-mic',
        category: 'open-mic',
        title: 'Open Mic',
        date: toIsoLocal(cursor),
        timeStart: '8:00 PM',
        timeEnd: '10:00 PM',
        venue: 'Bazaar47',
        description: 'Weekly open mic — music, poetry, spoken word, art.',
        internalUrl: '/open-mic',
        isRecurring: true,
      })
    }
    cursor.setDate(cursor.getDate() + 7)
  }

  return out
}

// ============================================
// EXTERNAL EVENTS (from data/calendar-events.ts)
// ============================================

function externalEventsToCalendarEvents(): CalendarEvent[] {
  const today = new Date()
  const todayMidnight = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  )

  return externalCalendarEvents
    .filter((e) => {
      const d = fromIsoLocal(e.date)
      if (!d) return false
      return d.getTime() >= todayMidnight.getTime()
    })
    .map((e) => ({
      id: `external-${e.id}`,
      source: 'external' as const,
      category: 'external' as const,
      title: e.title,
      date: e.date,
      timeStart: e.timeStart,
      timeEnd: e.timeEnd,
      venue: e.venue || 'Bazaar47',
      description: e.description,
      externalUrl: e.externalUrl,
    }))
}

// ============================================
// PUBLIC API
// ============================================

/**
 * Every calendar event, merged from every source, sorted by date
 * ascending. Includes only future + today events.
 */
export function getAllCalendarEvents(): CalendarEvent[] {
  const merged = [
    ...nativeEventsToCalendarEvents(),
    ...workshopEventsToCalendarEvents(),
    ...openMicEventsToCalendarEvents(),
    ...externalEventsToCalendarEvents(),
  ]

  // Stable sort by date, then by timeStart as a tiebreaker
  merged.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date)
    return a.timeStart.localeCompare(b.timeStart)
  })

  return merged
}

/**
 * Group events by ISO date. Returns a Map keyed by date for O(1)
 * lookups in the calendar grid.
 */
export function groupEventsByDate(
  events: CalendarEvent[]
): Map<string, CalendarEvent[]> {
  const map = new Map<string, CalendarEvent[]>()
  for (const e of events) {
    if (!map.has(e.date)) map.set(e.date, [])
    map.get(e.date)!.push(e)
  }
  return map
}

/**
 * Filter events by a category. 'all' returns everything.
 */
export function filterEventsByCategory(
  events: CalendarEvent[],
  category: 'all' | CalendarEventCategory
): CalendarEvent[] {
  if (category === 'all') return events
  return events.filter((e) => e.category === category)
}