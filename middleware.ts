/**
 * Middleware
 * 
 * Handles:
 * - Session tracking for authenticated users
 * - Device and location tracking
 * - Last active timestamp updates
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  })

  // Only track for authenticated users
  if (token && token.email) {
    try {
      // Import dynamically to avoid edge runtime issues
      const { trackSession } = await import('@/lib/auth/services/session-tracker')
      
      const userAgent = request.headers.get('user-agent') || ''
      const ip = request.headers.get('x-forwarded-for') || 
                 request.headers.get('x-real-ip') || 
                 'unknown'
      
      // Get or create persistent device ID
      let deviceId = request.cookies.get('device_id')?.value
      
      if (!deviceId) {
        // Generate new device ID (will be set in cookie below)
        deviceId = crypto.randomUUID()
      }
      
      // Track session (don't await to avoid slowing down requests)
      trackSession(
        token.email as string,
        userAgent,
        ip,
        deviceId
      ).catch(error => {
        console.error('[Middleware] Session tracking failed:', error)
      })
      
      // Set device ID cookie if it's new (persist for 1 year)
      const response = NextResponse.next()
      if (!request.cookies.get('device_id')) {
        response.cookies.set('device_id', deviceId, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 365, // 1 year
          path: '/'
        })
      }
      
      return response
    } catch (error) {
      // Fail silently - don't break the request
      console.error('[Middleware] Error:', error)
      return NextResponse.next()
    }
  }

  return NextResponse.next()
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - /api/auth/* (NextAuth routes - CRITICAL to exclude!)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/auth|.*\\.(?:svg|png|jpg|webp)$).*)',
  ],
}
