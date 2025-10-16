/**
 * useAuth Hook
 * 
 * Get current authenticated user information.
 * Returns null if not authenticated.
 */

'use client'

import { useSession } from 'next-auth/react'
import type { AuthUser } from '../domain/types'

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
