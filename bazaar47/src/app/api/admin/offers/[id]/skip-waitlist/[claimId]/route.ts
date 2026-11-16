// app/api/admin/offers/[id]/skip-waitlist/[claimId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin/auth'
import {
  getClaimById,
  updateClaim,
} from '@/lib/storage/staff-claims'
import { getOfferById } from '@/lib/storage/shift-offers'
import { cascadeWaitlist } from '@/lib/staff/claim-actions'

/**
 * Skip a waitlisted staff member: send them to the back of the queue
 * (status → 'pending' with a bumped claimedAt), clear their window, and
 * promote the next person in line via cascadeWaitlist.
 *
 * Bumping claimedAt is how "skip" differs from "decline":
 *   - decline (staff-initiated) → status 'released', out of the queue
 *   - skip (admin-initiated)    → status 'pending', re-enters at the
 *                                 back (new claimedAt = now)
 *
 * If there is nobody behind them, the slot simply reopens and the offer
 * shows as open on the board.
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
      { error: `Cannot skip: claim is ${claim.status}, not waitlisted` },
      { status: 400 }
    )
  }

  const now = new Date()

  try {
    // 1. Return the skipped claim to the queue, bumped to the back.
    const updated = await updateClaim(claimId, {
      status: 'pending',
      claimedAt: now.toISOString(),
      waitlistOfferedAt: undefined,
      waitlistExpiresAt: undefined,
    })
    if (!updated) {
      return NextResponse.json(
        { error: 'Failed to skip waitlisted claim' },
        { status: 500 }
      )
    }

    // 2. Promote the next person in line (if any).
    const promoted = await cascadeWaitlist(offerId, now)

    // 3. Fire-and-forget waitlist notification for the newly promoted.
    if (promoted) {
      void (async () => {
        try {
          const { getStaffById } = await import('@/lib/storage/staff')
          const { notifyWaitlistOffered } = await import('@/lib/email/notify')
          const staff = await getStaffById(promoted.staffId)
          if (staff?.email) {
            notifyWaitlistOffered(promoted, offer, staff.email)
          }
        } catch (err) {
          console.error('[skip-waitlist] notify failed:', err)
        }
      })()
    }

    return NextResponse.json({
      ok: true,
      claim: updated,
      promotedClaimId: promoted?.id ?? null,
    })
  } catch (err) {
    console.error('[skip-waitlist] failed:', err)
    return NextResponse.json(
      { error: 'Failed to skip waitlisted claim' },
      { status: 500 }
    )
  }
}