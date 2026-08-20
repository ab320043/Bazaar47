import { NextResponse } from 'next/server'

export async function POST() {
  // ✅ Clear the cookie
  const response = NextResponse.json({ success: true })
  
  response.cookies.set('admin_session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0, // Expire immediately
  })
  
  return response
}