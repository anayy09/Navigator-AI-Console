import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const { pathname } = req.nextUrl

    // Public routes that don't need auth
    if (pathname === '/' || pathname.startsWith('/api/health') || pathname.startsWith('/auth')) {
      return NextResponse.next()
    }

    // Add user ID header for authenticated requests
    if (token?.userId) {
      const requestHeaders = new Headers(req.headers)
      requestHeaders.set('X-USER-ID', token.userId as string)
      
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      })
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        
        // Public routes
        if (pathname === '/' || pathname.startsWith('/api/health') || pathname.startsWith('/auth')) {
          return true
        }

        // Protected routes - allow both authenticated and anonymous users
        if (pathname.startsWith('/chat') || pathname.startsWith('/embed') || pathname.startsWith('/whisper')) {
          return true // We'll handle usage limits in the API routes
        }

        // API routes - allow all for now, handle auth in individual routes
        if (pathname.startsWith('/api/')) {
          return true
        }

        // Default to requiring auth for other routes
        return !!token
      },
    },
  }
)

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}