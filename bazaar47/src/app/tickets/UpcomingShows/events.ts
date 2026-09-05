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
  isFree?: boolean
  isSlidingScale?: boolean
  minPrice?: number
  maxPrice?: number
  type?: 'workshop' | 'event'
}

export const UPCOMING_EVENTS: EventConfig[] = [
  // Paper Butterflies - FREE
  {
    id: 'paper-butterflies',
    name: '2,000* Butterflies: Community Art Project',
    date: 'September 12th, 2026',
    time: '6:15 PM - 7:15 PM',
    location: 'MAD Arts, Table 1',
    city: 'Broward',
    state: 'FL',
    price: 0,
    doorPrice: 0,
    description: 'Join the project and help fold 1,675 butterflies representing families separated by ICE.',
    isFree: true,
    type: 'workshop',
  },
  // Tatreez - $5
  {
    id: 'tatreez',
    name: 'Intro to Palestinian Tatreez and Design',
    date: 'September 12th, 2026',
    time: '7:00 PM - 8:00 PM',
    location: 'MAD Arts, Table 2',
    city: 'Broward',
    state: 'FL',
    price: 5,
    doorPrice: 5,
    description: 'Learn about the origins, uses, and history of Palestinian Tatreez.',
    type: 'workshop',
  },
  // Painting - $35
  {
    id: 'painting',
    name: 'Pattern, Sequence & Rhythm: Mindful Painting',
    date: 'September 12th, 2026',
    time: '7:30 PM - 8:30 PM',
    location: 'MAD Arts, Table 1',
    city: 'Broward',
    state: 'FL',
    price: 35,
    doorPrice: 35,
    description: 'Create your own motif and explore transforming simple shapes into unique patterns.',
    type: 'workshop',
  },
  // Figure Drawing - Sliding Scale
  {
    id: 'figure-drawing',
    name: 'MILFD (Man I Love Figure Drawing)',
    date: 'September 12th, 2026',
    time: 'Session 1: 7-8 PM · Session 2: 9-10 PM',
    location: 'MAD Arts, Workshop Room',
    city: 'Broward',
    state: 'FL',
    price: 10,
    doorPrice: 25,
    description: 'Figure drawing sessions with a clown model. All materials provided.',
    isSlidingScale: true,
    minPrice: 10,
    maxPrice: 25,
    type: 'workshop',
  },
]

export function getEventById(id: string): EventConfig | undefined {
  return UPCOMING_EVENTS.find(event => event.id === id)
}

export function getDefaultEvent(): EventConfig {
  return UPCOMING_EVENTS[0]
}

export function getWorkshopEvents(): EventConfig[] {
  return UPCOMING_EVENTS.filter(e => e.type === 'workshop')
}