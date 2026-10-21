import { NextRequest, NextResponse } from 'next/server'
import { saveSession, getSession } from '@/lib/storage/open-mic'
import { isAdminAuthenticated } from '@/lib/admin/auth'
import type { LineupSlot } from '@/types/open-mic'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { date } = await params
    const body = await request.json()
    const lineup: LineupSlot[] = body.lineup

    const existing = await getSession(date)
    
    await saveSession({
      id: date,
      date,
      lineup,
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving session:', error)
    return NextResponse.json({ error: 'Failed to save session' }, { status: 500 })
  }
}