// src/app/api/staff/claims/[id]/reconfirm/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentStaff } from '@/lib/staff/auth'
import { reconfirmWaitlistedClaim } from '@/lib/staff/claim-actions'

export async function POST(
  _request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params

  const staff = await getCurrentStaff({ refresh: false })
  if (!staff) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await reconfirmWaitlistedClaim(
    id,
    staff as unknown as Parameters<typeof reconfirmWaitlistedClaim>[1]
  )
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  return NextResponse.json({
    ok: true,
    claim: result.claim,
    assignmentId: result.assignmentId,
  })
}