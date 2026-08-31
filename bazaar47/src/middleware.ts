// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes that don't require authentication
const PUBLIC_ROUTES = ['/login', '/api/admin/login', '/api/admin/check-auth']

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  const method = request.method

  // ✅ Add pathname to headers for the RootLayout to detect admin routes
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', path)

  // ✅ Allow public routes
  if (PUBLIC_ROUTES.includes(path)) {
    return NextResponse.next({
      request: { headers: requestHeaders },
    })
  }

  // ✅ Check if it's an admin route
  const isAdminRoute = path.startsWith('/admin') || path.startsWith('/api/admin')

  // ✅ If not admin route, allow
  if (!isAdminRoute) {
    return NextResponse.next({
      request: { headers: requestHeaders },
    })
  }

  // ✅ FIX: /api/admin/submissions is where the *public* RSVP, vendor,
  // and dance-signup forms POST their entries. It only lives under
  // /api/admin because it reuses the same storage helpers as the admin
  // dashboard — creating a submission is not itself an admin-only
  // action. Requiring `admin_session` for POST here meant anyone who
  // wasn't already logged into /admin (i.e. every real customer, and
  // reliably anyone in a fresh/incognito session) got silently
  // redirected to /login instead of having their submission saved.
  //
  // GET (listing/reading submissions), PUT, and DELETE on this same
  // path are still admin-only and continue to require auth below —
  // only anonymous *writes* (new submissions) are allowed through.
  const isPublicSubmissionWrite =
    path === '/api/admin/submissions' && method === 'POST'

  if (isPublicSubmissionWrite) {
    return NextResponse.next({
      request: { headers: requestHeaders },
    })
  }

  // ✅ Check for admin session cookie
  const sessionCookie = request.cookies.get('admin_session')
  const isAuthenticated = sessionCookie?.value === 'authenticated'

  if (!isAuthenticated) {
    // ✅ FIX: API routes now get a real 401 JSON response instead of an
    // HTML redirect to /login. A redirect is easy for client-side
    // fetch() code to misread as success (fetch follows it, the final
    // response can come back 200/OK-ish), which is exactly how a
    // failed save can end up looking like a successful one to the
    // frontend. Actual browser page routes (e.g. /admin/dashboard)
    // still redirect normally, since those need to show the login UI.
    if (path.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const loginUrl = new URL('/login', request.url)
    const response = NextResponse.redirect(loginUrl)
    response.headers.set('x-pathname', path)
    return response
  }

  return NextResponse.next({
    request: { headers: requestHeaders },
  })
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
    '/login',
  ],
}