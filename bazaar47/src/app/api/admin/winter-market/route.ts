// app/api/admin/winter-market/route.ts
import { NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin/auth'
import {
  getAllApplications,
  countOccupiedSpots,
} from '@/lib/storage/winter-market'
import { WINTER_MARKET_DATES, MAX_VENDORS_PER_DAY } from '@/data/winter-market'

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const applications = await getAllApplications()
    const now = Date.now()

    const availability = WINTER_MARKET_DATES.map((date) => {
      const taken = countOccupiedSpots(applications, date, now)
      return {
        date,
        spotsTaken: taken,
        spotsTotal: MAX_VENDORS_PER_DAY,
        spotsRemaining: Math.max(0, MAX_VENDORS_PER_DAY - taken),
      }
    })

    // Sort applications newest first
    const sorted = [...applications].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    return NextResponse.json({
      applications: sorted,
      availability,
      count: sorted.length,
    })
  } catch (error) {
    console.error('Admin winter market error:', error)
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}