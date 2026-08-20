import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // ✅ Read cookie from the request
    const sessionCookie = request.cookies.get('admin_session')
    const authenticated = sessionCookie?.value === 'authenticated'
    
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