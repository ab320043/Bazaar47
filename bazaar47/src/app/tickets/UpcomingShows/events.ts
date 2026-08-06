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
    id: 'august-17-2026',
    name: 'AntonNow, Ruslansilvr, Lennon Cripe',
    date: 'August 17th, 2026',
    time: '7:00 PM',
    location: '60 SW 2nd St',
    city: 'Gainesville',
    state: 'FL',
    price: 15,
    doorPrice: 20,
    description: 'Join us for an unforgettable evening of culture and community'
  },
  // Add more events here in the future:
  // {
  //   id: 'orlando-2026',
  //   name: 'Bazaar Summer Festival',
  //   date: 'August 15, 2026',
  //   time: '6:00 PM',
  //   location: '123 Main St',
  //   city: 'Orlando',
  //   state: 'FL',
  //   price: 20,
  //   doorPrice: 25,
  //   description: 'Summer celebration of Palestinian culture'
  // },
]

export function getEventById(id: string): EventConfig | undefined {
  return UPCOMING_EVENTS.find(event => event.id === id)
}

export function getDefaultEvent(): EventConfig {
  return UPCOMING_EVENTS[0]
}