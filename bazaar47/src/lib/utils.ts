import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
// import { tourData } from '@/data/tour-data'
// import type { Submission } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}