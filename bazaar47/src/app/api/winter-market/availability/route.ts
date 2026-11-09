// app/api/winter-market/availability/route.ts
import { NextResponse } from 'next/server'
import {
  getAllApplications,
  countOccupiedSpots,
} from '@/lib/storage/winter-market'
import {
  WINTER_MARKET_DATES,
  MAX_VENDORS_PER_DAY,
} from '@/data/winter-market'
import type { WinterMarketAvailability } from '@/types/winter-market'

export async function GET() {
  try {
    const applications = await getAllApplications()
    const now = Date.now()

    const availability: WinterMarketAvailability[] = WINTER_MARKET_DATES.map(
      (date) => {
        const spotsTaken = countOccupiedSpots(applications, date, now)
        const spotsRemaining = Math.max(0, MAX_VENDORS_PER_DAY - spotsTaken)
        return {
          date,
          spotsTaken,
          spotsTotal: MAX_VENDORS_PER_DAY,
          spotsRemaining,
          isFull: spotsRemaining === 0,
        }
      }
    )

    return NextResponse.json({ availability })
  } catch (error) {
    console.error('Availability error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch availability' },
      { status: 500 }
    )
  }
}