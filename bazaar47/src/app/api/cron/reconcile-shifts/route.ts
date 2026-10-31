// app/api/cron/reconcile-shifts/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { runReconcile } from '@/lib/staff/reconcile'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(request: NextRequest) {
  // ---- Auth ----
  const expected = process.env.CRON_SECRET
  if (!expected) {
    console.error('[cron/reconcile-shifts] CRON_SECRET not configured')
    return NextResponse.json(
      { error: 'Server misconfigured: CRON_SECRET missing' },
      { status: 500 }
    )
  }

  const auth = request.headers.get('authorization') || ''
  if (auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ---- Dry-run support ----
  const dryRun = request.nextUrl.searchParams.get('dryRun') === 'true'

  try {
    const record = await runReconcile({ dryRun })
    return NextResponse.json({ success: true, run: record })
  } catch (error) {
    console.error('[cron/reconcile-shifts] failed:', error)
    return NextResponse.json(
      {
        error: 'Reconcile failed',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}