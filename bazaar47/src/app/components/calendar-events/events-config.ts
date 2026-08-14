// events-config.ts
import type { StaticImageData } from 'next/image'
import bazaar47Flyer from '@/assets/events/eventFlyer.png'
import blockPart from '@/assets/events/blockPart.png'

export interface Event {
  id: string
  title: string
  subtitle?: string
  date: string
  time: string
  location: string
  description: string
  flyerImage: StaticImageData
  slug: string
}

export const events: Event[] = [
  {
    id: 'bazaar47',
    title: 'Lennon Cripe · RuslanSilvr · AntoneNow',
    subtitle: 'Gulf-Pop, Experimental Hip-Hop & Genre-Defying Performances',
    date: 'Monday, August 17, 2026',
    time: '7:00 PM Doors · 8:00 PM Music',
    location: 'Bazaar 47 · Gainesville, FL',
    description: 'An intimate showcase featuring Florida\'s most exciting emerging artists.',
    flyerImage: bazaar47Flyer,
    slug: 'bazaar47'
  },
  {
    id: 'block-party',
    title: 'The Big Bazaar Block Party',
    subtitle: 'Grand Opening Celebration',
    date: 'Saturday, August 22, 2026',
    time: '9:00 PM - 1:00 AM',
    location: '60 SW 2nd Street, Gainesville, FL',
    description: 'We\'re closing the street! Join us for an epic celebration of art, music, and community.',
    flyerImage: blockPart,
    slug: 'block-party'
  }
]