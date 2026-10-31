// app/api/admin/offers/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin/auth'
import {
  getOfferById,
  cancelOffer,
  deleteDraftOffer,
} from '@/lib/storage/shift-offers'
import { getClaimsForOffer } from '@/lib/storage/staff-claims'
import { updateOfferSafely } from '@/lib/staff/offer-actions'
import type { ShiftOfferUpdatePayload } from '@/types/shift-offer'
import { isOfferEligibility, isOfferStatus } from '@/types/shift-offer'

// ============================================
// GET
// ============================================

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const offer = await getOfferById(id)
  if (!offer) {
    return NextResponse.json({ error: 'Offer not found' }, { status: 404 })
  }
  return NextResponse.json({ offer })
}

// ============================================
// PATCH
// ============================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const updates: ShiftOfferUpdatePayload = {}

  if (typeof body.slotsNeeded === 'number') {
    updates.slotsNeeded = body.slotsNeeded
  }
  if (typeof body.shiftStart === 'string') {
    updates.shiftStart = body.shiftStart
  }
  if (typeof body.shiftEnd === 'string') {
    updates.shiftEnd = body.shiftEnd
  }
  if (typeof body.hourlyRate === 'number') {
    updates.hourlyRate = body.hourlyRate
  }
  if (typeof body.minNoticeHours === 'number') {
    updates.minNoticeHours = body.minNoticeHours
  }
  if (typeof body.graceHours === 'number') {
    updates.graceHours = body.graceHours
  }
  if (typeof body.noShowMinutes === 'number') {
    updates.noShowMinutes = body.noShowMinutes
  }
  if (typeof body.cancellationDeadline === 'string') {
    updates.cancellationDeadline = body.cancellationDeadline
  }
  if (body.whoCanClaim && isOfferEligibility(body.whoCanClaim)) {
    updates.whoCanClaim = body.whoCanClaim
  }
  if (body.status && isOfferStatus(body.status)) {
    updates.status = body.status
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: 'No fields to update' },
      { status: 400 }
    )
  }

  try {
    const updated = await updateOfferSafely(id, updates)
    if (!updated) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true, offer: updated })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to update offer' },
      { status: 400 }
    )
  }
}

// ============================================
// DELETE — cancel or hard-delete
// ============================================
//
// Without ?hard=true: cancels the offer (status='cancelled'), which
// removes it from coverage but preserves the record + any claims.
//
// With ?hard=true: refuses if the offer has any claims (pending,
// confirmed, checked-in, completed — anything). If the offer has
// zero claims, deletes the record outright. This is the "I published
// this by mistake and want it gone" case.
//
// Rationale: deleting an offer with claims would leave those claims
// orphaned. Cancel is the safe action; hard delete is the clean-slate
// action for errors only.

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const offer = await getOfferById(id)
  if (!offer) {
    return NextResponse.json({ error: 'Offer not found' }, { status: 404 })
  }

  const hardDelete =
    request.nextUrl.searchParams.get('hard') === 'true'

  if (hardDelete) {
    // Refuse if any claims exist, regardless of status.
    const claims = await getClaimsForOffer(id)
    if (claims.length > 0) {
      return NextResponse.json(
        {
          error: `Cannot hard-delete: this offer has ${claims.length} claim${
            claims.length === 1 ? '' : 's'
          }. Cancel it instead to preserve the audit trail.`,
          claimCount: claims.length,
        },
        { status: 409 }
      )
    }

    // deleteDraftOffer only works on drafts, so force the status
    // through updateOffer first if needed. Simpler: use a dedicated
    // delete helper that ignores status. We'll add one inline here.
    const { deleteOfferForce } = await import('@/lib/storage/shift-offers')
    const deleted = await deleteOfferForce(id)
    if (!deleted) {
      return NextResponse.json(
        { error: 'Failed to delete offer' },
        { status: 500 }
      )
    }
    return NextResponse.json({ success: true, deleted: true })
  }

  // Soft delete — cancel.
  const cancelled = await cancelOffer(id)
  if (!cancelled) {
    return NextResponse.json(
      { error: 'Failed to cancel offer' },
      { status: 500 }
    )
  }
  return NextResponse.json({ success: true, offer: cancelled })
}