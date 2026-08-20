// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes that don't require authentication
const PUBLIC_ROUTES = ['/login', '/api/admin/login', '/api/admin/check-auth']

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  
  // ✅ Add pathname to headers for the RootLayout to detect admin routes
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', path)
  
  // ✅ Allow public routes
  if (PUBLIC_ROUTES.includes(path)) {
    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
    return response
  }
  
  // ✅ Check if it's an admin route
  const isAdminRoute = path.startsWith('/admin') || path.startsWith('/api/admin')
  
  // ✅ If not admin route, allow
  if (!isAdminRoute) {
    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
    return response
  }
  
  // ✅ Check for admin session cookie
  const sessionCookie = request.cookies.get('admin_session')
  const isAuthenticated = sessionCookie?.value === 'authenticated'
  
  if (!isAuthenticated) {
    const loginUrl = new URL('/login', request.url)
    const response = NextResponse.redirect(loginUrl)
    // Add headers to the redirect response too
    response.headers.set('x-pathname', path)
    return response
  }
  
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
  return response
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
    '/login',
  ],
}