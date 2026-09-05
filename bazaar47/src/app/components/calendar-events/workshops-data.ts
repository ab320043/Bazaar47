// app/components/calendar-events/workshops-data.ts
export interface Workshop {
  id: string
  title: string
  time: string
  table: string
  description: string
  price: string
  priceNote?: string
  ticketType: 'free-rsvp' | 'paid-ticket' | 'external-link'
  ticketUrl?: string
  externalLink?: string
  color: string
  textColor: string
  icon: string
}

export const workshops: Workshop[] = [
  {
    id: 'paper-butterflies',
    title: '2,000* Butterflies: A Community Art Project Against ICE',
    time: '6:15 PM - 7:15 PM',
    table: 'Table 1 · Workshop Room',
    description: 'Join the project and help fold 1,675 butterflies representing families separated by ICE. A meditative practice inspired by Sadako And The Thousand Paper Cranes.',
    price: 'FREE',
    ticketType: 'free-rsvp',
    color: 'bg-henna',
    textColor: 'text-plaster',
    icon: '🦋'
  },
  {
    id: 'tatreez',
    title: 'Intro to Palestinian Tatreez and Design',
    time: '7:00 PM - 8:00 PM',
    table: 'Table 2 · Workshop Room',
    description: 'Learn about the origins, uses, and history of Palestinian Tatreez before learning basic cross-stitch techniques and designs.',
    price: '$5',
    priceNote: 'Free for info session & alternative crafting',
    ticketType: 'paid-ticket',
    color: 'bg-cypress',
    textColor: 'text-plaster',
    icon: '🧵'
  },
  {
    id: 'painting',
    title: 'Pattern, Sequence & Rhythm: Mindful Painting Workshop',
    time: '7:30 PM - 8:30 PM',
    table: 'Table 1 · Workshop Room',
    description: 'Create your own motif and explore transforming simple shapes into unique patterns. No experience necessary. All materials included.',
    price: '$35',
    ticketType: 'paid-ticket',
    color: 'bg-poppy',
    textColor: 'text-plaster',
    icon: '🎨'
  },
  {
    id: 'figure-drawing',
    title: 'MILFD (Man I Love Figure Drawing)',
    time: 'Session 1: 7-8 PM · Session 2: 9-10 PM',
    table: 'Workshop Room',
    description: 'Figure drawing sessions with a clown model. All materials provided. Sliding scale pricing.',
    price: '$10-15 / $20-25',
    priceNote: 'Sliding scale for 1 or both sessions',
    ticketType: 'paid-ticket',
    color: 'bg-rosewood',
    textColor: 'text-plaster',
    icon: '✏️'
  },
  {
    id: 'pottery',
    title: 'Clay Workshop: In a Calm, Candlelit Corner',
    time: '8:15 PM - 10:15 PM',
    table: 'Table 2 · Workshop Room',
    description: 'A slow evening spent with clay, surrounded by art and candlelight. All materials and guided instruction included. No experience necessary.',
    price: '$65',
    ticketType: 'external-link',
    externalLink: 'https://square.link/u/JKveDYRr',
    color: 'bg-grove',
    textColor: 'text-plaster',
    icon: '🏺'
  },
  {
    id: 'sewing',
    title: 'Introduction to Sewing | Learn to Sew a Keychain',
    time: '8:45 PM - 10:15 PM',
    table: 'Table 1 · Workshop Room',
    description: 'Beginner-friendly sewing workshop! Learn to use a sewing machine, sew your own keychain, and take home a sewing kit. All supplies provided.',
    price: '$50',
    ticketType: 'external-link',
    externalLink: 'https://www.sondersewing.com/workshops/p/intro-to-sewing-machines-l9fsy-pcczy-3srrn-7n65s-sadz4-rcefy',
    color: 'bg-pomegranate',
    textColor: 'text-plaster',
    icon: '🪡'
  }
]

// Get workshop by ID - used by admin
export function getWorkshopById(id: string): Workshop | undefined {
  return workshops.find(w => w.id === id)
}