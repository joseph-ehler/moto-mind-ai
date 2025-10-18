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
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // Create Supabase client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()
  
  const { pathname } = request.nextUrl
  const isAuthenticated = !!session

  // Define public routes that don't require authentication
  const publicRoutes = [
    '/auth/signin',
    '/auth/signup',
    '/auth/verify-request',
    '/auth/verify-email',
    '/auth/error',
    '/auth/callback',
    '/',
  ]

  // Define protected routes that require authentication
  const protectedRoutes = [
    '/dashboard',
    '/settings',
    '/vehicles',
    '/support',
    '/account',
  ]

  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

  // CRITICAL: Protect routes from unauthenticated access
  if (!isAuthenticated && isProtectedRoute) {
    console.log('[Middleware] 🚫 Unauthorized access attempt to:', pathname)
    const signInUrl = new URL('/auth/signin', request.url)
    signInUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(signInUrl)
  }

  // Redirect authenticated users away from auth pages
  if (isAuthenticated && pathname.startsWith('/auth/signin')) {
    console.log('[Middleware] ↪️  Authenticated user redirected from signin to dashboard')
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Get or create persistent device ID (for ALL requests)
  let deviceId = request.cookies.get('device_id')?.value
  
  if (!deviceId) {
    deviceId = crypto.randomUUID()
    response.cookies.set('device_id', deviceId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: '/'
    })
    console.log('[Middleware] 🆕 Generated new device_id:', deviceId)
  }

  // Track session for authenticated users
  if (isAuthenticated && session?.user?.email) {
    try {
      const { trackSession } = await import('@/lib/auth/services/session-tracker')
      
      const userAgent = request.headers.get('user-agent') || ''
      const ip = request.headers.get('x-forwarded-for') || 
                 request.headers.get('x-real-ip') || 
                 'unknown'
      
      trackSession(
        session.user.email,
        userAgent,
        ip,
        deviceId
      ).catch(error => {
        console.error('[Middleware] Session tracking failed:', error)
      })
    } catch (error) {
      console.error('[Middleware] Session tracking error:', error)
    }
  }

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
