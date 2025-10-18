'use client'

/**
 * Web OAuth Callback Page
 * 
 * Handles Supabase OAuth redirect - NO native code
 */

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { handleWebOAuthCallback } from '@/lib/auth/web-oauth'

export default function WebAuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const processCallback = async () => {
      try {
        const session = await handleWebOAuthCallback()
        
        if (session) {
          console.log('[Web Callback] ✅ Success, redirecting to /track')
          router.push('/track')
        }
      } catch (error: any) {
        console.error('[Web Callback] Error:', error)
        router.push('/auth/web?error=' + encodeURIComponent(error.message))
      }
    }

    processCallback()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  )
}
