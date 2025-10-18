'use client'

/**
 * Loading & Router Page
 * 
 * ONLY job: Detect platform and route to correct auth page
 * NO auth logic here - just routing!
 */

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LoadingPage() {
  const router = useRouter()

  useEffect(() => {
    const route = async () => {
      try {
        // Dynamic import to avoid SSR issues
        const { Capacitor } = await import('@capacitor/core')
        
        if (Capacitor.isNativePlatform()) {
          console.log('[Router] 📱 Native platform detected → /native/auth')
          router.replace('/native/auth')
        } else {
          console.log('[Router] 🌐 Web platform detected → /auth/web')
          router.replace('/auth/web')
        }
      } catch (error) {
        // Fallback to web if Capacitor import fails
        console.log('[Router] ⚠️  Capacitor not available → /auth/web')
        router.replace('/auth/web')
      }
    }

    route()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
        <h2 className="text-2xl font-bold text-foreground mb-2">MotoMind</h2>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
}
