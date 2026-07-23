import { NextRequest, NextResponse } from 'next/server'
import { setAdminSession } from '@/lib/admin/auth'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { username, password } = body

  const ADMIN_USERNAME = process.env.ADMIN_USERNAME
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    setAdminSession()
    return NextResponse.json({ success: true })
  }

  return NextResponse.json(
    { error: 'Invalid credentials' },
    { status: 401 }
  )
}