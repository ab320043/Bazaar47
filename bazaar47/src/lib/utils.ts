import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
// lib/utils.ts
import { getTourCities } from '@/data/events'
import type { SubmissionDataUnion } from '@/types'

// ✅ EXPORT: Single source of truth for valid tour cities
export const VALID_TOUR_CITIES = getTourCities().map((c) => c.city || c.name)

// ✅ EXPORT: Get the primary city for a submission
export function getCityName(data: SubmissionDataUnion): string {
  // For vendors with multiple cities
  const selectedCities = data.selectedCities as string[] | undefined
  if (selectedCities && Array.isArray(selectedCities) && selectedCities.length > 0) {
    const validCities = selectedCities.filter((c) => 
      VALID_TOUR_CITIES.includes(c)
    )
    if (validCities.length > 0) return validCities[0]
  }

  // For RSVPs - use eventCity
  if (data.eventCity && typeof data.eventCity === 'string' && VALID_TOUR_CITIES.includes(data.eventCity)) {
    return data.eventCity
  }

  return 'Unmatched'
}

// ✅ EXPORT: Get all valid cities for a vendor submission
export function getCitiesForVendor(data: SubmissionDataUnion): string[] {
  const selectedCities = data.selectedCities as string[] | undefined
  if (selectedCities && Array.isArray(selectedCities)) {
    return selectedCities.filter((c) => VALID_TOUR_CITIES.includes(c))
  }
  return []
}

// ✅ EXPORT: Calculate event status based on date
export function calculateEventStatus(eventDate: string): 'upcoming' | 'current' | 'past' | 'completed' {
  const now = new Date()
  const event = new Date(eventDate)
  
  if (event < now) {
    const daysDiff = (now.getTime() - event.getTime()) / (1000 * 60 * 60 * 24)
    if (daysDiff > 7) return 'completed'
    return 'past'
  }
  
  const daysUntil = (event.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  if (daysUntil <= 7) return 'current'
  
  return 'upcoming'
}

// ✅ EXPORT: Validate ticket count (1-10)
export function validateTicketCount(tickets: unknown): number | null {
  const num = parseInt(String(tickets), 10)
  if (!Number.isInteger(num) || num < 1 || num > 10) {
    return null
  }
  return num
}

// ✅ EXPORT: Check if a city is valid
export function isValidTourCity(city: string): boolean {
  return VALID_TOUR_CITIES.includes(city)
}


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}