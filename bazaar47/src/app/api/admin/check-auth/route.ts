import { NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin/auth'

export async function GET() {
  try {
    const authenticated = await isAdminAuthenticated()
    return NextResponse.json({ 
      authenticated,
      message: authenticated ? 'Authenticated' : 'Not authenticated'
    })
  } catch (error) {
    console.error('Auth check error:', error)
    return NextResponse.json(
      { authenticated: false, error: 'Failed to check authentication' },
      { status: 500 }
    )
  }
}