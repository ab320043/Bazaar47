// app/api/admin/offers/[id]/confirm-claim/[claimId]/route.ts
//
// Admin confirms a PENDING claim from the coverage board.
//
// On confirmation:
//   1. Claim status → 'confirmed', confirmedBy → 'admin-confirm'
//   2. Recompute offer.slotsFilled
//   3. Auto-transition offer.status (open → filled) if slots now filled
//
// Phase 2A does NOT create an assignment on confirm. Assignments are
// only created via direct-assign. Phase 2B will add "confirm also
// creates an assignment" so the staff dashboard picks it up. For now,
// confirmed claims are visible on the coverage board but they don't
// yet appear on the staff's shift list.

import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin/auth'
import { getOfferById } from '@/lib/storage/shift-offers'
import {
  getClaimById,
  updateClaim,
  countConfirmedClaimsForOffer,
} from '@/lib/storage/staff-claims'
import { recomputeOfferSlotsFilled } from '@/lib/storage/shift-offers'

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

  if (claim.status !== 'pending') {
    return NextResponse.json(
      {
        error: `Cannot confirm: claim is already ${claim.status}`,
      },
      { status: 400 }
    )
  }

  // ---- Reject if the offer is full ----
  const confirmedCount = await countConfirmedClaimsForOffer(offerId)
  if (confirmedCount >= offer.slotsNeeded) {
    return NextResponse.json(
      {
        error: `Offer is already full (${confirmedCount}/${offer.slotsNeeded}). Reject this claim or increase slots.`,
      },
      { status: 409 }
    )
  }

  // ---- Update claim ----
  const updated = await updateClaim(claimId, {
    status: 'confirmed',
    confirmedBy: 'admin-confirm',
    confirmedAt: new Date().toISOString(),
  })

  if (!updated) {
    return NextResponse.json(
      { error: 'Failed to update claim' },
      { status: 500 }
    )
  }

  // ---- Recompute offer slots ----
  const newCount = await countConfirmedClaimsForOffer(offerId)
  await recomputeOfferSlotsFilled(offerId, newCount)

  return NextResponse.json({ success: true, claim: updated })
}