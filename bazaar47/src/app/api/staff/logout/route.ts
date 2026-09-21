// app/api/staff/logout/route.ts
import { NextResponse } from 'next/server'
import { destroyStaffSession } from '@/lib/staff/auth'

export async function POST() {
  try {
    await destroyStaffSession()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Staff logout error:', error)
    return NextResponse.json({ success: true })
  }
}