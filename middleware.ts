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
  // ALWAYS create response first - we need to return it no matter what
  const response = NextResponse.next()
  
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  })

  // Get or create persistent device ID (for ALL requests, not just authenticated)
  let deviceId = request.cookies.get('device_id')?.value
  
  if (!deviceId) {
    // Generate new device ID
    deviceId = crypto.randomUUID()
    
    // CRITICAL: Set cookie on response
    response.cookies.set('device_id', deviceId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: '/'
    })
    
    console.log('[Middleware] 🆕 Generated new device_id:', deviceId)
  } else {
    console.log('[Middleware] ✅ Using existing device_id:', deviceId)
  }

  // Track session for authenticated users
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
        ip,
        deviceId
      ).catch(error => {
        console.error('[Middleware] Session tracking failed:', error)
      })
    } catch (error) {
      // Fail silently - don't break the request
      console.error('[Middleware] Session tracking error:', error)
    }
  }

  // ALWAYS return the same response object (with cookie if it was set)
  return response
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
