'use client'

/**
 * Native Route Detector
 * 
 * Detects if we're on native platform and redirects to appropriate page
 * - Native: /native/login
 * - Web: Stay on current page
 */

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export function NativeRouteDetector() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Check if we're on native platform
    const Capacitor = (window as any).Capacitor
    const isNative = Capacitor && Capacitor.isNativePlatform && Capacitor.isNativePlatform()
    
    if (!isNative) {
      return // We're on web, stay on current page
    }

    // We're on native
    console.log('[Route Detector] Native platform detected')

    // If we're on the web login page (/), redirect to native login
    if (pathname === '/') {
      console.log('[Route Detector] Redirecting to /native/login')
      router.replace('/native/login')
    }
    
    // If we're on any /native/* page, stay there (already on native flow)
    if (pathname.startsWith('/native/')) {
      console.log('[Route Detector] Already on native route:', pathname)
      return
    }

    // For other pages (like /track), check if user is authenticated
    // If not authenticated, redirect to native login
    // This will be handled by AuthGuard separately
  }, [pathname, router])

  // This component renders nothing
  return null
}
