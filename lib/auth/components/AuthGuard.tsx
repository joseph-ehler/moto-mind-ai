/**
 * AuthGuard Component
 * 
 * Protects routes - redirects unauthenticated users to /login
 */

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      console.log('[AuthGuard] No user, redirecting to /login')
      router.push('/login')
    }
  }, [user, isLoading, router])

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render anything if no user (will redirect)
  if (!user) {
    return null
  }

  // User is authenticated, render children
  return <>{children}</>
}
