// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes that don't require authentication (exact matches)
const PUBLIC_ROUTES = [
  // Admin auth
  '/login',
  '/api/admin/login',
  '/api/admin/check-auth',
  // Staff auth
  '/staff/login',
  '/api/staff/login',
]

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  const method = request.method

  // ✅ Add pathname to headers for the RootLayout to detect admin/staff routes
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', path)

  // ✅ Allow public routes
  if (PUBLIC_ROUTES.includes(path)) {
    return NextResponse.next({
      request: { headers: requestHeaders },
    })
  }

  // ============================================
  // STAFF ROUTES
  // ============================================
  const isStaffRoute =
    path.startsWith('/staff') || path.startsWith('/api/staff')

  if (isStaffRoute) {
    const staffSession = request.cookies.get('staff_session')
    const hasStaffSession = !!staffSession?.value

    if (!hasStaffSession) {
      if (path.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }

      const staffLoginUrl = new URL('/staff/login', request.url)
      const response = NextResponse.redirect(staffLoginUrl)
      response.headers.set('x-pathname', path)
      return response
    }

    return NextResponse.next({
      request: { headers: requestHeaders },
    })
  }

  // ============================================
  // ADMIN ROUTES (includes /api/admin/* AND /api/big-caf-meetings*)
  // ============================================
  const isAdminRoute =
    path.startsWith('/admin') || path.startsWith('/api/admin')

  // ✅ Big Caf Meetings: POST to /api/big-caf-meetings is public (form
  // submissions). GET on the same path and everything on
  // /api/big-caf-meetings/[id] is admin-only and handled below.
  const isPublicBigCafSubmit =
    path === '/api/big-caf-meetings' && method === 'POST'

  if (isPublicBigCafSubmit) {
    return NextResponse.next({
      request: { headers: requestHeaders },
    })
  }

  // Treat /api/big-caf-meetings* as an admin-gated API surface.
  const isBigCafApi = path.startsWith('/api/big-caf-meetings')

  if (!isAdminRoute && !isBigCafApi) {
    return NextResponse.next({
      request: { headers: requestHeaders },
    })
  }

  // api/admin/submissions is where the *public* RSVP, vendor, and
  // dance-signup forms POST their entries. It only lives under
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
    '/staff/:path*',
    '/api/staff/:path*',
    '/api/big-caf-meetings/:path*',
    '/api/big-caf-meetings',
  ],
}