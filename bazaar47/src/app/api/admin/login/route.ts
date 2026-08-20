import { NextRequest, NextResponse } from 'next/server'
import { setAdminSession } from '@/lib/admin/auth'

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

    // Validate credentials - case sensitive
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      setAdminSession()
      return NextResponse.json({ 
        success: true,
        message: 'Login successful'
      })
    }

    // Failed login - generic message for security
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