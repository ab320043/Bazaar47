// data/events.ts
import type { StaticImageData } from 'next/image'
import casselberry from '@/assets/casselberry.jpg'
import MAD from '@/assets/MAD.jpg'
import Camp from '@/assets/Camp.jpg'
import GNV from '@/assets/newAssets/GNV.jpg'
import jacks2 from '@/assets/newAssets/jacks2.jpeg'
import FEST from '@/assets/newAssets/FEST.jpeg'
import blockPart from '@/assets/events/blockPart.png'

export interface EventDefinition {
  id: string
  slug: string
  name: string
  type: 'tour' | 'block-party' | 'concert' | 'custom'
  status: 'upcoming' | 'active' | 'past' | 'completed'
  date: string
  dateDisplay: string
  time: string
  location: string
  address: string
  city?: string
  capacity?: number
  hasVendors: boolean
  hasRSVP: boolean
  hasDanceSignup: boolean
  isFree: boolean
  price?: number
  description: string
  image?: StaticImageData
  ticketUrl?: string
  rsvpUrl?: string
  parentEventId?: string
  venueDetails?: string
  highlights?: string[]
}

// ============================================
// FLORIDA TOUR CITIES
// ============================================

const tourCities: EventDefinition[] = [
  // 1. ORLANDO - COMPLETED
  {
    id: 'orlando-tour',
    slug: 'orlando',
    name: 'Orlando',
    type: 'tour',
    status: 'completed',
    date: '2026-08-08',
    dateDisplay: 'Saturday, August 8',
    time: '6-10pm',
    location: 'Casselberry Arts Center',
    address: '127 Quail Pond Cir, Casselberry, FL 32707',
    city: 'Orlando',
    capacity: 100,
    hasVendors: true,
    hasRSVP: true,
    hasDanceSignup: false,
    isFree: true,
    description: 'Kick off the Florida Tour at Casselberry Arts Center. A night of culture, community, and creative connection.',
    image: casselberry,
    ticketUrl: '#',
    parentEventId: 'florida-tour',
    venueDetails: 'Casselberry Arts Center is a premier cultural venue featuring a beautiful gallery space and outdoor amphitheater.',
    highlights: ['Live Music', 'Art Exhibitions', 'Local Vendors', 'Food Trucks'],
  },

  // 2. SOUTH FLORIDA - ACTIVE
  {
    id: 'south-florida-tour',
    slug: 'south-florida',
    name: 'South Florida',
    type: 'tour',
    status: 'active',
    date: '2026-09-12',
    dateDisplay: 'Saturday, September 12',
    time: '6-11pm',
    location: 'MAD Arts',
    address: 'Broward County',
    city: 'South Florida',
    capacity: 200,
    hasVendors: true,
    hasRSVP: true,
    hasDanceSignup: false,
    isFree: false,
    price: 5,
    description: "Experience the fusion of Palestinian heritage and South Florida's vibrant energy. A night to remember.",
    image: MAD,
    ticketUrl: '#',
    parentEventId: 'florida-tour',
    venueDetails: 'MAD Arts is a cutting-edge cultural space in Broward County that showcases contemporary art and performance.',
    highlights: ['Live Performances', 'Art Installations', 'Local Artists', 'Night Market'],
  },

  // 3. JACKSONVILLE - ACTIVE
  {
    id: 'jacksonville-tour',
    slug: 'jacksonville',
    name: 'Jacksonville',
    type: 'tour',
    status: 'active',
    date: '2026-10-07',
    dateDisplay: 'Wednesday, October 7',
    time: '5-9pm',
    location: 'Third Wednesday Art Walk',
    address: 'Downtown Jacksonville',
    city: 'Jacksonville',
    capacity: 120,
    hasVendors: true,
    hasRSVP: true,
    hasDanceSignup: false,
    isFree: true,
    description: 'Intimate gathering during the Art Walk with storytelling, traditional music, and community connection.',
    image: jacks2,
    ticketUrl: '#',
    parentEventId: 'florida-tour',
    venueDetails: 'The Third Wednesday Art Walk is a monthly event in Downtown Jacksonville that transforms the city streets into a vibrant arts and culture festival.',
    highlights: ['Art Walk', 'Street Performers', 'Local Vendors', 'Cultural Exhibitions'],
  },

  // 4. GAINESVILLE | THE FEST - ACTIVE
  {
    id: 'gainesville-fest-tour',
    slug: 'gainesville-fest',
    name: 'Gainesville | The FEST',
    type: 'tour',
    status: 'active',
    date: '2026-10-24',
    dateDisplay: 'Saturday, October 24',
    time: '2-8pm',
    location: 'Downtown, Gainesville',
    address: 'During The FEST',
    city: 'Gainesville | The FEST',
    capacity: 150,
    hasVendors: true,
    hasRSVP: true,
    hasDanceSignup: false,
    isFree: true,
    description: 'Join us during the FEST for an afternoon of culture, music, and community in the heart of Gainesville.',
    image: FEST,
    ticketUrl: 'https://thefestfl.com',
    parentEventId: 'florida-tour',
    venueDetails: 'The FEST is one of Gainesville\'s most anticipated annual events, bringing together artists, musicians, and creatives from across the region.',
    highlights: ['The FEST Festival', 'Local Artists', 'Music', 'Community Gathering'],
  },

  // 5. GULF COAST - ACTIVE
  {
    id: 'gulf-coast-tour',
    slug: 'gulf-coast',
    name: 'Gulf Coast',
    type: 'tour',
    status: 'active',
    date: '2026-11-21',
    dateDisplay: 'Saturday, November 21',
    time: '5-10pm',
    location: 'CAMP Tampa',
    address: '3012 W Palmira Ave, Tampa, FL 33629',
    city: 'Gulf Coast',
    capacity: 180,
    hasVendors: true,
    hasRSVP: true,
    hasDanceSignup: false,
    isFree: true,
    description: 'A celebration of culture with food, music, and the warmth of community. Bring your family and friends.',
    image: Camp,
    ticketUrl: '#',
    parentEventId: 'florida-tour',
    venueDetails: 'Gulf Coast is a unique community space that hosts events, workshops, and cultural gatherings.',
    highlights: ['Family Friendly', 'Live Music', 'Local Food', 'Community Workshops'],
  },

  // 6. GAINESVILLE FINALE - ACTIVE
  {
    id: 'gainesville-finale-tour',
    slug: 'gainesville-finale',
    name: 'Gainesville',
    type: 'tour',
    status: 'active',
    date: '2026-12-05',
    dateDisplay: 'Saturday, December 5',
    time: '5-10pm',
    location: 'Bazaar47',
    address: '60 SW 2nd Street, Downtown Gainesville, FL 32601',
    city: 'Gainesville',
    capacity: 100,
    hasVendors: true,
    hasRSVP: true,
    hasDanceSignup: false,
    isFree: true,
    description: 'Closing night where it all began. A heartfelt gathering under the stars to celebrate community and connection.',
    image: GNV,
    ticketUrl: '#',
    parentEventId: 'florida-tour',
    venueDetails: 'Bazaar47 is the home base and community space where it all started. This closing night celebration brings the Florida Tour full circle.',
    highlights: ['Closing Celebration', 'Community Connection', 'Live Music', 'Special Guests'],
  },
]

// ============================================
// STANDALONE EVENTS
// ============================================

const standaloneEvents: EventDefinition[] = [
  // 7. BLOCK PARTY - ACTIVE
  {
    id: 'block-party',
    slug: 'block-party',
    name: 'The Big Bazaar Block Party',
    type: 'block-party',
    status: 'active',
    date: '2026-08-22',
    dateDisplay: 'Saturday, August 22, 2026',
    time: '9:00 PM - 1:00 AM',
    location: '60 SW 2nd Street, Gainesville, FL',
    address: '60 SW 2nd Street, Gainesville, FL',
    city: 'Gainesville',
    capacity: 500,
    hasVendors: false,
    hasRSVP: true,
    hasDanceSignup: true,
    isFree: true,
    description: 'We\'re closing the street! Join us for an epic celebration of art, music, and community.',
    image: blockPart,
    ticketUrl: '#',
    venueDetails: 'The Big Bazaar Block Party is a street-closing celebration featuring live music, dance battles, and community vibes.',
    highlights: ['Live Music', 'Dance Battle', 'Food Trucks', 'Local Artists'],
  },
]

// ============================================
// EXPORTS & HELPERS
// ============================================

// All events flat list
export const allEvents: EventDefinition[] = [...tourCities, ...standaloneEvents]

// Group events by parent
export const eventsByParent: Record<string, EventDefinition[]> = {
  'florida-tour': tourCities,
  'standalone': standaloneEvents,
}

// ✅ EXPORT: Get all tour cities
export function getTourCities(): EventDefinition[] {
  return tourCities
}

// ✅ EXPORT: Get active tour cities (excludes completed)
export function getActiveTourCities(): EventDefinition[] {
  return tourCities.filter(e => e.status === 'active' || e.status === 'upcoming')
}

// ✅ EXPORT: Get event by ID
export function getEventById(id: string): EventDefinition | undefined {
  return allEvents.find(e => e.id === id)
}

// ✅ EXPORT: Get event by slug
export function getEventBySlug(slug: string): EventDefinition | undefined {
  return allEvents.find(e => e.slug === slug)
}

// ✅ EXPORT: Get events by type
export function getEventsByType(type: EventDefinition['type']): EventDefinition[] {
  return allEvents.filter(e => e.type === type)
}

// ✅ EXPORT: Get events by status
export function getEventsByStatus(status: EventDefinition['status']): EventDefinition[] {
  return allEvents.filter(e => e.status === status)
}

// ✅ EXPORT: Get active events
export function getActiveEvents(): EventDefinition[] {
  return allEvents.filter(e => e.status === 'active')
}

// ✅ EXPORT: Get upcoming events
export function getUpcomingEvents(): EventDefinition[] {
  return allEvents.filter(e => e.status === 'upcoming')
}

// ✅ EXPORT: Get past events (includes completed)
export function getPastEvents(): EventDefinition[] {
  return allEvents.filter(e => e.status === 'past' || e.status === 'completed')
}

// ✅ EXPORT: Get events by parent
export function getEventsByParent(parentId: string): EventDefinition[] {
  return allEvents.filter(e => e.parentEventId === parentId)
}

// ✅ EXPORT: Get city names for validation
export const VALID_TOUR_CITY_NAMES = tourCities.map(c => c.city || '').filter(Boolean)

// ✅ EXPORT: Get all event IDs
export const ALL_EVENT_IDS = allEvents.map(e => e.id)

// ✅ EXPORT: Get all event slugs
export const ALL_EVENT_SLUGS = allEvents.map(e => e.slug)