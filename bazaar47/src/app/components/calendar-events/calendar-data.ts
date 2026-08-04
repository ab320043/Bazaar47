import type { TourEvent } from '@/app/components/calendar-events/types'
import { showDetails } from '@/app/components/calendar-events/show-config'

/**
 * Bazaar A La Carte Tour dates. Edit this list whenever dates get added,
 * moved, or confirmed — nothing else in the calendar needs to change.
 */
export const tourEvents: TourEvent[] = [
  {
    date: 8,
    month: 8,
    year: 2026,
    title: 'Orlando | BAZAAR 47 Florida Tour',
    location: 'Casselberry Arts Center, FL',
    time: '6:00 PM - 10:00 PM',
    tour: 'Bazaar A La Carte Tour',
  },
  {
    date: 12,
    month: 9,
    year: 2026,
    title: 'South Florida | BAZAAR 47 Florida Tour',
    location: 'MAD Arts',
    time: '6:00 PM - 11:00 PM',
    tour: 'Bazaar A La Carte Tour',
  },
  {
    date: 7,
    month: 10,
    year: 2026,
    title: 'Jacksonville | BAZAAR 47 Florida Tour',
    location: 'Third Art Walk',
    time: '5:00 PM - 9:00 PM',
    tour: 'Bazaar A La Carte Tour',
  },
  {
    date: 24,
    month: 10,
    year: 2026,
    title: 'Gainesville, The FEST | BAZAAR 47 Florida Tour',
    location: 'Downtown Gainesville, FL',
    time: '2:00 PM - 7:00 PM',
    tour: 'Bazaar A La Carte Tour',
  },
  {
    date: 21,
    month: 11,
    year: 2026,
    title: 'TAMPA | BAZAAR 47 Florida Tour',
    location: 'CAMP, FL',
    time: '5:00 PM - 10:00 PM',
    tour: 'Bazaar A La Carte Tour',
  },
  {
    date: 5,
    month: 12,
    year: 2026,
    title: 'Gainesville | BAZAAR 47 Florida Tour',
    location: 'Bazaar47, FL',
    time: '5:00 PM - 10:00 PM',
    tour: 'Bazaar A La Carte Tour',
  },
  {
    // Pulled from show-config.ts so this can never fall out of sync
    // with the Events section above it on the page.
    date: showDetails.date,
    month: showDetails.month,
    year: showDetails.year,
    title: 'RUN OF SHOW',
    location: showDetails.venue,
    time: showDetails.doors,
    tour: 'Bazaar A La Carte Tour',
    isFeatured: true,
  },
]