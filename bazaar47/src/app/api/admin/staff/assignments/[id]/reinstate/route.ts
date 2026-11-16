// src/app/api/admin/assignments/[id]/reinstate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { reinstateNoShow } from '@/lib/staff/assignment-actions'

export async function POST(
  _request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params

  const result = await reinstateNoShow(id)
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  return NextResponse.json({ ok: true, assignment: result.assignment })
}