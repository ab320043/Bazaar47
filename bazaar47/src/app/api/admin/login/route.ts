import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = body

    // Get credentials from environment
    const ADMIN_USERNAME = process.env.ADMIN_USERNAME
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD

    // Check if credentials are configured
    if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
      console.error('Admin credentials not configured in environment variables')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Validate credentials
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      // ✅ Create response with cookie using NextResponse
      const response = NextResponse.json({ 
        success: true,
        message: 'Login successful',
        redirect: '/admin/dashboard'
      })
      
      // ✅ Set the cookie on the response
      response.cookies.set('admin_session', 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24, // 24 hours
      })
      
      return response
    }

    // Failed login
    return NextResponse.json(
      { error: 'Invalid username or password' },
      { status: 401 }
    )
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    )
  }
}