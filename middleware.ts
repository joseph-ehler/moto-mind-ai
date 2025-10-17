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
      
      // Track session (don't await to avoid slowing down requests)
      trackSession(
        token.email as string,
        userAgent,
        ip
      ).catch(error => {
        console.error('[Middleware] Session tracking failed:', error)
      })
    } catch (error) {
      // Fail silently - don't break the request
      console.error('[Middleware] Error:', error)
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
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
