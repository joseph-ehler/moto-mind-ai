/**
 * Session Tracker Component
 * 
 * Automatically saves login preferences when user signs in
 * Works for all auth methods including OAuth redirects
 */

'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/browser-client'
import { saveLastLoginMethod } from '@/lib/auth/hooks/useLastLogin'
import { saveLastUserEmail } from '@/lib/auth/hooks/useLastUser'

export function SessionTracker() {
  const supabase = createClient()
  const hasTracked = useRef(false)

  useEffect(() => {
    const trackSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      // Only track once per session
      if (session?.user?.email && !hasTracked.current) {
      console.log('[SessionTracker] New session detected:', session.user.email)
      
      // Save user email
      saveLastUserEmail(session.user.email)
      
      // Try to determine login method
      // For OAuth (Google), we can't determine from client side perfectly
      // But we save it on server side in NextAuth config
      // This is a fallback to ensure localStorage is updated
      const lastMethod = localStorage.getItem(`last_login_method_${session.user.email}`)
      
      if (!lastMethod) {
        // Default to google if we don't know (most OAuth users)
        // The server-side tracking will have the correct method
        console.log('[SessionTracker] No method in localStorage, using google as default')
        saveLastLoginMethod(session.user.email, 'google')
      }
      
        hasTracked.current = true
        console.log('[SessionTracker] Saved session info to localStorage')
      }
    }
    
    trackSession()
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        hasTracked.current = false
      }
    })
    
    return () => subscription.unsubscribe()
  }, [supabase])

  // This component renders nothing
  return null
}
