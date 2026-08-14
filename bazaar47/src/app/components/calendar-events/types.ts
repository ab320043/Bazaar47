// types.ts
import type { StaticImageData } from 'next/image'

export interface Artist {
  name: string
  image: StaticImageData
  bio: string
  website: string
  time: string
  duration?: string
  cardBg: string
  overlayGradient: string
  ticketUrl: string
}

export interface TourEvent {
  date: number
  /** 1–12, matches the calendar grid's month convention (not 0-indexed) */
  month: number
  year: number
  title: string
  location: string
  time: string
  tour: string
  /** Highlights this date on the calendar as the flagship show */
  isFeatured?: boolean
}

// NEW: Simplified Event interface
export interface Event {
  id: string
  title: string
  subtitle?: string
  date: string
  time: string
  location: string
  description: string
  flyerImage: StaticImageData
  ticketUrl?: string
  rsvpUrl?: string
  isFree?: boolean
  slug: string // for routing
  highlights?: string[]
  status?: 'upcoming' | 'past' | 'sold-out'
}