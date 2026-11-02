// app/api/staff/offers/route.ts
//
// Returns every offer the current staff member is eligible to claim,
// grouped by event. Used by /staff/events.

import { NextResponse } from 'next/server'
import { getCurrentStaff } from '@/lib/staff/auth'
import { getClaimableOffersForStaff } from '@/lib/staff/claim-actions'

export async function GET() {
  try {
    const current = await getCurrentStaff()
    if (!current) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const groups = await getClaimableOffersForStaff(current.staff)
    return NextResponse.json({ groups })
  } catch (error) {
    console.error('Error fetching offers for staff:', error)
    return NextResponse.json(
      { error: 'Failed to fetch offers' },
      { status: 500 }
    )
  }
}