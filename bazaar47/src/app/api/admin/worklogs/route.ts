// app/api/admin/worklogs/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin/auth'
import {
  getAllWorkLogs,
  getWorkLogsNeedingReview,
} from '@/lib/storage/staff-worklogs'
import { getRecentRuns } from '@/lib/staff/reconcile'

export async function GET(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = request.nextUrl
  const filter = url.searchParams.get('filter')
  const includeRuns = url.searchParams.get('includeRuns') === 'true'

  try {
    const workLogs =
      filter === 'needs-review'
        ? await getWorkLogsNeedingReview()
        : await getAllWorkLogs()

    // Sort by checkInTime desc, then createdAt desc
    workLogs.sort((a, b) => {
      const aT = a.checkInTime ? new Date(a.checkInTime).getTime() : 0
      const bT = b.checkInTime ? new Date(b.checkInTime).getTime() : 0
      return bT - aT
    })

    const payload: Record<string, unknown> = { workLogs, count: workLogs.length }

    if (includeRuns) {
      payload.recentRuns = await getRecentRuns(5)
    }

    return NextResponse.json(payload)
  } catch (error) {
    console.error('Error fetching work logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch work logs' },
      { status: 500 }
    )
  }
}