// Barrel file — lets you either drop <CalendarEventsSection /> in as one
// piece, or import EventsSection / CalendarSection separately if you ever
// want to place them in different spots on the page.

export { EventsSection } from '@/app/components/calendar-events/Eventssection'
export { CalendarSection } from '@/app/components/calendar-events/Calendarsection'

import { EventsSection } from '@/app/components/calendar-events/Eventssection'
import { CalendarSection } from '@/app/components/calendar-events/Calendarsection'

/**
 * Drop this in on the homepage where the old <ExhibitionSection /> was.
 * Since this whole section is expected to change/rotate later, all the
 * actual content lives in events-data.ts, calendar-data.ts, and
 * show-config.ts — not in this file or the two section components.
 */
export function CalendarEventsSection() {
  return (
    <>
      <EventsSection />
      <CalendarSection />
    </>
  )
}