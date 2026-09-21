// app/api/staff/me/route.ts
import { NextResponse } from 'next/server'
import { getCurrentStaff } from '@/lib/staff/auth'

export async function GET() {
  try {
    const current = await getCurrentStaff()
    if (!current) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({
      staff: current.staff,
      mustChangePassword: current.mustChangePassword,
    })
  } catch (error) {
    console.error('Error fetching current staff:', error)
    return NextResponse.json(
      { error: 'Failed to fetch current staff' },
      { status: 500 }
    )
  }
}