// app/api/staff/checklists/route.ts
import { NextResponse } from 'next/server'
import { getCurrentStaff } from '@/lib/staff/auth'
import { getChecklistForStaff } from '@/lib/storage/staff-checklists'

export async function GET() {
  try {
    const current = await getCurrentStaff()
    if (!current) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const checklist = await getChecklistForStaff(current.staff.id)
    return NextResponse.json({ checklist })
  } catch (error) {
    console.error('Error fetching checklist:', error)
    return NextResponse.json(
      { error: 'Failed to fetch checklist' },
      { status: 500 }
    )
  }
}