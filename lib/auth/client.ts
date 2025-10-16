/**
 * Client-Side Authentication Hooks
 * 
 * Use these hooks in client components:
 * - useAuth() - Get current user
 * - useRequireAuth() - Require authentication (redirects if not)
 */

'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import type { AuthUser } from './types'

/**
 * Get current authenticated user
 * Returns null if not authenticated
 */
export function useAuth(): {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
} {
  const { data: session, status } = useSession()
  
  return {
    user: session?.user?.tenantId
      ? {
          email: session.user.email!,
          tenantId: session.user.tenantId,
          role: session.user.role as any,
        }
      : null,
    isLoading: status === 'loading',
    isAuthenticated: !!session?.user?.tenantId,
  }
}

/**
 * Require authentication in a client component
 * Redirects to sign-in if not authenticated
 */
export function useRequireAuth(): {
  user: AuthUser
  isLoading: boolean
} {
  const { user, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/signin')
    }
  }, [isLoading, isAuthenticated, router])
  
  return {
    user: user!,
    isLoading,
  }
}

/**
 * Check if user has a specific role or higher
 */
export function useHasRole(
  requiredRole: 'owner' | 'admin' | 'member' | 'viewer'
): boolean {
  const { user } = useAuth()
  
  if (!user) return false
  
  const roleHierarchy = {
    owner: 4,
    admin: 3,
    member: 2,
    viewer: 1,
  }
  
  return (
    roleHierarchy[user.role as keyof typeof roleHierarchy] >=
    roleHierarchy[requiredRole]
  )
}
