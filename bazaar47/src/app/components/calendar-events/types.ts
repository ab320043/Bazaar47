import type { StaticImageData } from 'next/image'

export interface Artist {
  name: string
  image: StaticImageData
  bio: string
  website: string
  time: string
  duration?: string
  /**
   * Full, literal Tailwind classnames (not built with template strings).
   * Tailwind's scanner only picks up class *tokens* it can see as plain
   * text in a source file — if we built these as `bg-${color}` at runtime
   * the CSS for them would never get generated. Keeping them literal here
   * means this file itself is what makes Tailwind generate the classes.
   */
  cardBg: string
  overlayGradient: string
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