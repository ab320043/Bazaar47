import AntoneNow from '@/assets/events/AntoneNow.png'
import LennonCripe from '@/assets/events/LennonCripe.jpeg'
import RuslanSilvr from '@/assets/events/RuslanSilvr.png'
import eventFlyerImg from '@/assets/events/eventFlyer.png'
import type { Artist } from '@/app/components/calendar-events/types'

export const eventFlyer = eventFlyerImg

/**
 * Display order = left → right in the collage.
 * Run of show: Opener → Lennon Cripe / RuslanSilvr → RuslanSilvr / Lennon Cripe → AntoneNow (headliner)
 */
export const artists: Artist[] = [
  {
    name: 'LENNON CRIPE',
    image: LennonCripe,
    bio: `Florida-based artist known for his "Gulf-Pop!" genre — a blend of reggae, grunge, punk, hip-hop and pop, shaped by his upbringing between Bradenton, Florida and Viña del Mar, Chile. His music reflects a personal journey through struggle, before he built his own path in production.`,
    website: 'lennoncripe.com',
    time: '9:00 PM',
    cardBg: 'bg-cypress',
    overlayGradient: 'from-cypress via-cypress/80 to-cypress/10',
    ticketUrl: '/tickets/UpcomingShows',
  },
  {
    name: 'RUSLANSILVR',
    image: RuslanSilvr,
    bio: `At just 18, RuslanSilvr is redefining the modern "bedroom studio." Based in North Port, Florida, he writes, produces, and records his entire discography alone — a sound that's intimately raw and sonically expansive, pulling from the atmospheric grit of Lil Peep to the experimental alt-rock of Jean Dawson.`,
    website: 'RuslanSilvr.com',
    time: '9:45 PM',
    cardBg: 'bg-pomegranate',
    overlayGradient: 'from-pomegranate via-pomegranate/80 to-pomegranate/10',
    ticketUrl: '/tickets/UpcomingShows',
  },
  {
    name: 'ANTONENOW',
    image: AntoneNow,
    bio: `Independent rapper, producer, and 8T6OHATE co-founder from Southwest Florida. Known for an unpredictable fusion of hip-hop with rock, hyper-pop, and jazz — five consecutive Shade 45 Demo Battle wins and over 6 million Spotify streams. Closing out the night.`,
    website: 'AntoneNow.com',
    time: '10:35 PM',
    cardBg: 'bg-henna',
    overlayGradient: 'from-henna via-henna/80 to-henna/10',
    ticketUrl: '/tickets/UpcomingShows',
  },
]