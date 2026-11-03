// app/api/staff/claims/route.ts
//
//   POST  — create a pending claim
//   GET   — list this staff member's claims (all statuses)
//
// The claim create returns the new ShiftClaim on success.

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentStaff } from '@/lib/staff/auth'
import { createStaffClaim } from '@/lib/staff/claim-actions'
import { getClaimsForStaff } from '@/lib/storage/staff-claims'

// ============================================
// POST — create a claim
// ============================================

export async function POST(request: NextRequest) {
  try {
    const current = await getCurrentStaff()
    if (!current) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let body: Record<string, unknown>
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const offerId = body.offerId
    if (typeof offerId !== 'string' || offerId.trim() === '') {
      return NextResponse.json(
        { error: 'offerId is required' },
        { status: 400 }
      )
    }

    const result = await createStaffClaim(current.staff, offerId)
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      )
    }

    // Fire-and-forget: admin notification. Never blocks claim creation.
    if (process.env.ADMIN_NOTIFICATION_EMAIL) {
      const { getOfferById } = await import('@/lib/storage/shift-offers')
      const { notifyAdminNewClaim } = await import('@/lib/email/notify')
      void (async () => {
        try {
          const offer = await getOfferById(offerId)
          if (offer) notifyAdminNewClaim(result.claim, offer)
        } catch (err) {
          console.error('[notify] admin new claim failed:', err)
        }
      })()
    }

    return NextResponse.json(
      { success: true, claim: result.claim },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating claim:', error)
    return NextResponse.json(
      { error: 'Failed to create claim' },
      { status: 500 }
    )
  }
}

// ============================================
// GET — list this staff member's claims
// ============================================

export async function GET() {
  try {
    const current = await getCurrentStaff()
    if (!current) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const claims = await getClaimsForStaff(current.staff.id)
    claims.sort(
      (a, b) =>
        new Date(b.claimedAt).getTime() - new Date(a.claimedAt).getTime()
    )
    return NextResponse.json({ claims, count: claims.length })
  } catch (error) {
    console.error('Error fetching staff claims:', error)
    return NextResponse.json(
      { error: 'Failed to fetch claims' },
      { status: 500 }
    )
  }
}