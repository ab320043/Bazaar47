// events-config.ts
import type { StaticImageData } from 'next/image'
import blockPart from '@/assets/events/blockPart.png'
// import southFloridaFlyer from '@/assets/events/southFloridaFlyer.png' // Add your flyer

export interface Event {
  id: string
  title: string
  subtitle?: string
  date: string
  time: string
  location: string
  description: string
  // flyerImage: StaticImageData
  slug: string
}

export const events: Event[] = [
  {
    id: 'south-florida-tour',
    title: 'BAZAAR 47 South Florida Tour',
    subtitle: 'MAD Arts · Broward, FL',
    date: 'Saturday, September 12, 2026',
    time: '6:00 PM - 11:00 PM',
    location: 'MAD Arts, Broward, FL',
    description: 'Join us for an unforgettable night of art, music, and community. Experience interactive workshops, live performances, and more at MAD Arts.',
    // flyerImage: southFloridaFlyer,
    slug: 'south-florida-tour'
  }
]