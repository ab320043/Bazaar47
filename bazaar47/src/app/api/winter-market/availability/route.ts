// app/api/winter-market/availability/route.ts
import { NextResponse } from 'next/server'
import {
  getAllApplications,
  countOccupiedSpots,
} from '@/lib/storage/winter-market'
import {
  WINTER_MARKET_DATES,
  getCapacityForDate,
} from '@/data/winter-market'
import type { WinterMarketAvailability } from '@/types/winter-market'

export async function GET() {
  try {
    const applications = await getAllApplications()
    const now = Date.now()

    const availability: WinterMarketAvailability[] = WINTER_MARKET_DATES.map(
      (date) => {
        const spotsTaken = countOccupiedSpots(applications, date, now)
        const spotsTotal = getCapacityForDate(date)
        const spotsRemaining = Math.max(0, spotsTotal - spotsTaken)
        
        return {
          date,
          spotsTaken,
          spotsTotal,
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