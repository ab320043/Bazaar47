// index.tsx
import { EventsSection } from '@/app/components/calendar-events/Eventssection'
import { CalendarSection } from '@/app/components/calendar-events/Calendarsection'

export { EventsListing } from '@/app/components/calendar-events/EventsListing'
export { WorkshopsListing } from '@/app/components/calendar-events/WorkshopsListing'
export { CalendarSection } from '@/app/components/calendar-events/Calendarsection'
export { EventsSection } from '@/app/components/calendar-events/Eventssection'

export function CalendarEventsSection() {
  return (
    <>
      <EventsSection />
      <CalendarSection />
    </>
  )
}