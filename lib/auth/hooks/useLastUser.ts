/**
 * useLastUser Hook
 * 
 * Remembers the last user's email for instant welcome back
 * Works across sessions using localStorage
 */

'use client'

import { useEffect, useState } from 'react'
import type { LoginMethod } from '../services/login-preferences'

const LAST_EMAIL_KEY = 'motomind_last_email'

interface LastUser {
  email: string | null
  lastMethod: LoginMethod | null
}

/**
 * Get the last signed-in user
 * Returns email and last method from localStorage
 */
export function useLastUser(): LastUser {
  const [lastUser, setLastUser] = useState<LastUser>({
    email: null,
    lastMethod: null
  })

  useEffect(() => {
    // Get last email from localStorage
    const lastEmail = localStorage.getItem(LAST_EMAIL_KEY)
    
    if (lastEmail) {
      // Get their last login method
      const lastMethod = localStorage.getItem(`last_login_method_${lastEmail}`) as LoginMethod | null
      
      console.log('[useLastUser] Found last user:', { lastEmail, lastMethod })
      
      setLastUser({
        email: lastEmail,
        lastMethod
      })
    }
  }, [])

  return lastUser
}

/**
 * Save last user email
 * Call this after successful sign-in
 */
export function saveLastUserEmail(email: string): void {
  try {
    localStorage.setItem(LAST_EMAIL_KEY, email)
    console.log('[saveLastUserEmail] Saved:', email)
  } catch (error) {
    console.error('[saveLastUserEmail] Failed:', error)
  }
}

/**
 * Clear last user
 * Call this on explicit sign-out
 */
export function clearLastUser(): void {
  try {
    const lastEmail = localStorage.getItem(LAST_EMAIL_KEY)
    if (lastEmail) {
      localStorage.removeItem(LAST_EMAIL_KEY)
      localStorage.removeItem(`last_login_method_${lastEmail}`)
    }
    console.log('[clearLastUser] Cleared')
  } catch (error) {
    console.error('[clearLastUser] Failed:', error)
  }
}
