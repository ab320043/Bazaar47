// app/tickets/UpcomingShows/events.ts
export interface EventConfig {
  id: string
  name: string
  date: string
  time: string
  location: string
  city: string
  state: string
  price: number
  doorPrice: number
  description: string
}

export const UPCOMING_EVENTS: EventConfig[] = [
  {
    id: 'bazaar47',
    name: 'Lennon Cripe · RuslanSilvr · AntoneNow',
    date: 'August 17th, 2026',
    time: '7:00 PM',
    location: '60 SW 2nd St',
    city: 'Gainesville',
    state: 'FL',
    price: 15,
    doorPrice: 20,
    description: 'Join us for an unforgettable evening of culture and community'
  },
  {
    id: 'block-party',
    name: 'The Big Bazaar Block Party',
    date: 'August 22nd, 2026',
    time: '9:00 PM',
    location: '60 SW 2nd St',
    city: 'Gainesville',
    state: 'FL',
    price: 0,
    doorPrice: 0,
    description: 'Grand opening celebration - Free entry! RSVP now.'
  },
]

export function getEventById(id: string): EventConfig | undefined {
  return UPCOMING_EVENTS.find(event => event.id === id)
}

export function getDefaultEvent(): EventConfig {
  return UPCOMING_EVENTS[0]
}