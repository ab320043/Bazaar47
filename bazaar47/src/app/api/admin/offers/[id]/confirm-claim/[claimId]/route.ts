// app/api/admin/offers/[id]/confirm-claim/[claimId]/route.ts
//
// Admin confirms a PENDING claim. Creates an assignment in the same
// call so the shift appears in the staff member's My Shifts page.
// Phase 3 will remove the assignment creation and read claims
// directly instead.

import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin/auth'
import { confirmStaffClaim } from '@/lib/staff/claim-actions'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; claimId: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: offerId, claimId } = await params

  const result = await confirmStaffClaim({ offerId, claimId })
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status }
    )
  }

  return NextResponse.json({
    success: true,
    claim: result.claim,
    assignmentId: result.assignmentId,
  })
}