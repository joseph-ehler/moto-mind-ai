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
    // Get initial user
    auth.getUser()
      .then(setUser)
      .catch(console.error)
      .finally(() => setIsLoading(false))

    // Listen for auth changes
    const unsubscribe = auth.onAuthChange((newUser) => {
      setUser(newUser)
      setIsLoading(false)
    })

    return unsubscribe
  }, [])

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    signOut: auth.signOut,
    signInWithGoogle: auth.signInWithGoogle
  }
}
