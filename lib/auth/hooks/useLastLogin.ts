/**
 * useLastLogin Hook
 * 
 * Client-side hook for accessing user's last login method
 * Enables smart sign-in UX with method hints
 */

'use client'

import { useEffect, useState } from 'react'
import type { LoginMethod } from '../services/login-preferences'

interface UseLastLoginReturn {
  lastMethod: LoginMethod | null
  loading: boolean
  error: Error | null
}

/**
 * Fetch user's last login method from localStorage
 * Falls back to API call if needed
 */
export function useLastLogin(email?: string | null): UseLastLoginReturn {
  const [lastMethod, setLastMethod] = useState<LoginMethod | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!email) {
      setLoading(false)
      return
    }

    async function fetchLastMethod() {
      try {
        // Try localStorage first (fast)
        const cached = localStorage.getItem(`last_login_method_${email}`)
        if (cached) {
          setLastMethod(cached as LoginMethod)
          setLoading(false)
          return
        }

        // Fall back to API (email is guaranteed to be defined here)
        const response = await fetch(`/api/auth/preferences?email=${encodeURIComponent(email!)}`)
        if (!response.ok) {
          throw new Error('Failed to fetch login preferences')
        }

        const data = await response.json()
        const method = data.lastMethod as LoginMethod | null
        
        setLastMethod(method)
        
        // Cache for next time
        if (method && email) {
          localStorage.setItem(`last_login_method_${email}`, method)
        }
      } catch (err) {
        console.error('[useLastLogin] Error:', err)
        setError(err instanceof Error ? err : new Error('Unknown error'))
      } finally {
        setLoading(false)
      }
    }

    fetchLastMethod()
  }, [email])

  return { lastMethod, loading, error }
}

/**
 * Save last login method to localStorage for instant access
 * Call this after successful sign-in
 */
export function saveLastLoginMethod(email: string, method: LoginMethod): void {
  try {
    localStorage.setItem(`last_login_method_${email}`, method)
  } catch (error) {
    console.error('[saveLastLoginMethod] Failed:', error)
  }
}

/**
 * Clear cached login method
 * Call this on sign-out
 */
export function clearLastLoginMethod(email: string): void {
  try {
    localStorage.removeItem(`last_login_method_${email}`)
  } catch (error) {
    console.error('[clearLastLoginMethod] Failed:', error)
  }
}
