'use client'

/**
 * OAuth Callback Page
 * 
 * Web only - processes OAuth redirect from Google
 */

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { handleCallback } from '@/lib/auth'

export default function CallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const processCallback = async () => {
      try {
        console.log('[Callback] Processing OAuth redirect...')
        await handleCallback()
        
        console.log('[Callback] Success! Redirecting to /track')
        router.push('/track')
      } catch (error: any) {
        console.error('[Callback] Error:', error)
        router.push('/login?error=' + encodeURIComponent(error.message))
      }
    }

    processCallback()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  )
}
