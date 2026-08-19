// events-config.ts
import type { StaticImageData } from 'next/image'
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