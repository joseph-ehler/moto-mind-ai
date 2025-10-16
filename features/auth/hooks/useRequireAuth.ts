/**
 * useRequireAuth Hook
 * 
 * Require authentication in a client component.
 * Automatically redirects to sign-in page if not authenticated.
 */

'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useAuth } from './useAuth'
import type { AuthUser } from '../domain/types'

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
