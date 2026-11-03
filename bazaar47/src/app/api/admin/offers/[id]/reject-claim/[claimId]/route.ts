// app/api/admin/offers/[id]/reject-claim/[claimId]/route.ts
//
// Admin rejects a PENDING claim. Unlike confirm, this is a permanent
// action on the claim — pending claims are deleted, not marked rejected,
// because the staff member can simply claim again if they want to.
// (A future version might add a "rejected" status; for Phase 2A, deletion
// is simpler and just as honest.)

import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin/auth'
import { getClaimById, deletePendingClaim } from '@/lib/storage/staff-claims'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; claimId: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: offerId, claimId } = await params

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
  if (claim.status !== 'pending') {
    return NextResponse.json(
      { error: `Cannot reject: claim is ${claim.status}` },
      { status: 400 }
    )
  }

  const deleted = await deletePendingClaim(claimId)
  if (!deleted) {
    return NextResponse.json(
      { error: 'Failed to reject claim' },
      { status: 500 }
    )
  }

  // Fire-and-forget: notify staff their claim was rejected.
  void (async () => {
    try {
      const { getStaffById } = await import('@/lib/storage/staff')
      const { getOfferById } = await import('@/lib/storage/shift-offers')
      const { notifyClaimRejected } = await import('@/lib/email/notify')
      const [staff, offer] = await Promise.all([
        getStaffById(claim.staffId),
        getOfferById(offerId),
      ])
      if (staff?.email && offer) {
        notifyClaimRejected(claim, offer, staff.email)
      }
    } catch (err) {
      console.error('[reject-claim] notify failed:', err)
    }
  })()

  return NextResponse.json({ success: true })
}