// app/api/staff/claims/[id]/route.ts
//
//   DELETE — release a pending claim

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentStaff } from '@/lib/staff/auth'
import { releaseStaffClaim } from '@/lib/staff/claim-actions'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const current = await getCurrentStaff()
    if (!current) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await releaseStaffClaim(current.staff, id)
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      )
    }

    return NextResponse.json({ success: true, claim: result.claim })
  } catch (error) {
    console.error('Error releasing claim:', error)
    return NextResponse.json(
      { error: 'Failed to release claim' },
      { status: 500 }
    )
  }
}