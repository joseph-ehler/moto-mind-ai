/**
 * useAuth Hook
 * 
 * 🎯 THE HOOK EVERYONE USES
 * 
 * Simple, clean API for authentication in components.
 * 
 * Usage:
 *   const { user, signOut, isLoading } = useAuth()
 */

'use client'

import { useState, useEffect } from 'react'
import { auth, type User } from '@/lib/auth/facade'

export interface UseAuthReturn {
  /** Current authenticated user (null if not authenticated) */
  user: User | null
  
  /** Loading state */
  isLoading: boolean
  
  /** Is user authenticated? */
  isAuthenticated: boolean
  
  /** Sign out current user */
  signOut: typeof auth.signOut
  
  /** Sign in with Google */
  signInWithGoogle: typeof auth.signInWithGoogle
}

/**
 * Hook to access current authentication state
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { user, isLoading, signOut } = useAuth()
 *   
 *   if (isLoading) return <Loading />
 *   if (!user) return <SignIn />
 *   
 *   return <div>Hello {user.email}</div>
 * }
 * ```
 */
export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    auth.getUser().then((currentUser) => {
      setUser(currentUser)
      setIsLoading(false)
    })

    // Listen for auth changes
    const unsubscribe = auth.onAuthChange((user: User | null) => {
      setUser(user)
    })

    // Handle OAuth callback on native apps
    const handleOAuthCallback = async () => {
      try {
        const { App } = await import('@capacitor/app')
        
        App.addListener('appUrlOpen', async (event) => {
          console.log('[Auth] App URL opened:', event.url)
          
          // Check if this is an OAuth callback
          if (event.url.startsWith('motomind://auth/callback')) {
            try {
              // Close the browser
              const { Browser } = await import('@capacitor/browser')
              await Browser.close()
              
              // Parse hash fragment (tokens are in #access_token=...&refresh_token=...)
              const hashFragment = event.url.split('#')[1]
              if (!hashFragment) {
                console.error('[Auth] No hash fragment in callback URL')
                return
              }
              
              // Parse the hash fragment as URL params
              const params = new URLSearchParams(hashFragment)
              const accessToken = params.get('access_token')
              const refreshToken = params.get('refresh_token')
              
              if (accessToken && refreshToken) {
                console.log('[Auth] ✅ Got tokens from callback, setting session...')
                const { createClient } = await import('@/lib/supabase/browser-client')
                const supabase = createClient()
                
                // Set the session with the tokens
                const { data, error } = await supabase.auth.setSession({
                  access_token: accessToken,
                  refresh_token: refreshToken,
                })
                
                if (error) {
                  console.error('[Auth] ❌ Set session error:', error)
                } else {
                  console.log('[Auth] ✅ Session set! User:', data.user?.email)
                  setUser(data.user as any)
                  
                  // Navigate to track page
                  if (typeof window !== 'undefined') {
                    window.location.href = '/track'
                  }
                }
              }
            } catch (error) {
              console.error('[Auth] OAuth callback error:', error)
            }
          }
        })
      } catch (error) {
        // Not on native platform, ignore
      }
    }
    
    handleOAuthCallback()

    return () => {
      unsubscribe()
    }
  }, [])

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    signOut: auth.signOut,
    signInWithGoogle: auth.signInWithGoogle
  }
}
