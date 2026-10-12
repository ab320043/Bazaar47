// data/calendar-events.ts
import type { ExternalCalendarEventConfig } from '@/types/calendar'

// ============================================
// 3RD-PARTY EVENTS AT BAZAAR47
// ============================================

/**
 * External events happening at Bazaar47 (or elsewhere) that you want
 * to appear on the /events calendar.
 *
 * Edit this array by hand. Each entry needs at minimum:
 *   id, title, date, timeStart, externalUrl
 *
 * These are shown in the calendar with a distinct "AT BAZAAR47"
 * treatment and link out to the external URL in a new tab.
 *
 * Sort order doesn't matter — the calendar sorts everything by date.
 */
export const externalCalendarEvents: ExternalCalendarEventConfig[] = [
  // ==========================================
  // EXAMPLE — replace or delete when you add real ones
  // ==========================================
  // {
  //   id: 'example-live-show',
  //   title: 'Example Live Show',
  //   date: '2026-11-15',
  //   timeStart: '8:00 PM',
  //   timeEnd: '11:00 PM',
  //   venue: 'Bazaar47',
  //   description: 'An example external event to show the shape.',
  //   externalUrl: 'https://example.com/tickets',
  //   category: 'concert',
  // },
/// ==========================================
  // ADD YOUR OWN EVENTS BELOW THIS LINE
  // ==========================================
    {
        id: 'yankelEvent',        // any unique string, no spaces
        title: 'Ritmo Caribe',
        date: '2026-10-17',          // ISO 'YYYY-MM-DD'
        timeStart: '9:00 PM',
        timeEnd: '2:00 AM',         // optional
        venue: 'Bazaar47',           // optional, defaults to 'Bazaar47'
        description: 'Hispanic Heritage Night! We can\'t wait to dance and celebrate with you all!',  // optional
        externalUrl: 'https://www.instagram.com/p/DeSMdR9BNZE/?exln=MTRwa3IxeTlueG1ycQ==',   // REQUIRED — where the link goes
        category: 'concert',          // optional, free-form tag
    },
    {
        id: 'writteninthestars',        // any unique string, no spaces
        title: 'Gator Awaaz Showcase: Written in the Stars',
        date: '2026-10-18',          // ISO 'YYYY-MM-DD'
        timeStart: '6:00 PM',
        timeEnd: '9:00 PM',         // optional
        venue: 'Bazaar47',           // optional, defaults to 'Bazaar47'
        description: 'Some night are written in the stars!',  // optional
        externalUrl: 'https://www.instagram.com/p/DeSot7NGMqm/?psln=NXVrcXQwdXFqdnYy',   // REQUIRED — where the link goes
        category: 'concert',          // optional, free-form tag
    },
]