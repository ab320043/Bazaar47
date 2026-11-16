// app/api/admin/offers/[id]/extend-waitlist/[claimId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin/auth'
import { getClaimById, updateClaim } from '@/lib/storage/staff-claims'
import { getOfferById } from '@/lib/storage/shift-offers'

const WAITLIST_WINDOW_MS = 12 * 60 * 60 * 1000

/**
 * Extend a waitlisted claim's reconfirm window by another 12h from now.
 *
 * Pre-conditions:
 *   - claim exists, belongs to the offer, and is status 'waitlisted'
 *   - offer exists
 *
 * The new waitlistExpiresAt is now + 12h (not old expiry + 12h) —
 * an extension is a fresh window, not a stacking one. This avoids a
 * pathological "extend 100 times" → 50-day window.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; claimId: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: offerId, claimId } = await params

  const offer = await getOfferById(offerId)
  if (!offer) {
    return NextResponse.json({ error: 'Offer not found' }, { status: 404 })
  }

  const claim = await getClaimById(claimId)
  if (!claim) {
    return NextResponse.json({ error: 'Claim not found' }, { status: 404 })
  }
  if (claim.offerId !== offerId) {
    return NextResponse.json(
      { error: 'Claim does not belong to this offer' },
      { status: 400 }
    )
  }
  if (claim.status !== 'waitlisted') {
    return NextResponse.json(
      { error: `Cannot extend: claim is ${claim.status}, not waitlisted` },
      { status: 400 }
    )
  }

  const now = new Date()
  const expiresAt = new Date(now.getTime() + WAITLIST_WINDOW_MS).toISOString()

  try {
    const updated = await updateClaim(claimId, {
      waitlistOfferedAt: now.toISOString(),
      waitlistExpiresAt: expiresAt,
    })
    if (!updated) {
      return NextResponse.json(
        { error: 'Failed to extend waitlist' },
        { status: 500 }
      )
    }
    return NextResponse.json({ ok: true, claim: updated })
  } catch (err) {
    console.error('[extend-waitlist] failed:', err)
    return NextResponse.json(
      { error: 'Failed to extend waitlist' },
      { status: 500 }
    )
  }
}