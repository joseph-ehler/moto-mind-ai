/**
 * AuthGuard Component
 * 
 * 🛡️ PROTECT ROUTES EASILY
 * 
 * Wraps protected pages and handles auth logic automatically.
 * 
 * Usage:
 *   <AuthGuard>
 *     <ProtectedPage />
 *   </AuthGuard>
 */

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Loader2 } from 'lucide-react'

interface AuthGuardProps {
  children: React.ReactNode
  /** Where to redirect if not authenticated */
  redirectTo?: string
  /** Show loading UI while checking auth */
  loadingComponent?: React.ReactNode
}

/**
 * Protect a page/component - requires authentication
 * 
 * @example
 * ```tsx
 * export default function DashboardPage() {
 *   return (
 *     <AuthGuard>
 *       <Dashboard />
 *     </AuthGuard>
 *   )
 * }
 * ```
 */
export function AuthGuard({ 
  children, 
  redirectTo = '/',
  loadingComponent 
}: AuthGuardProps) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push(redirectTo)
    }
  }, [user, isLoading, router, redirectTo])

  // Show loading state
  if (isLoading) {
    return loadingComponent || (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Not authenticated - will redirect
  if (!user) {
    return null
  }

  // Authenticated - show content
  return <>{children}</>
}

/**
 * Inverse guard - only show to guests (non-authenticated users)
 * Useful for signin/signup pages
 * 
 * @example
 * ```tsx
 * export default function SignInPage() {
 *   return (
 *     <GuestGuard>
 *       <SignInForm />
 *     </GuestGuard>
 *   )
 * }
 * ```
 */
export function GuestGuard({ 
  children, 
  redirectTo = '/dashboard' 
}: Omit<AuthGuardProps, 'loadingComponent'>) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && user) {
      router.push(redirectTo)
    }
  }, [user, isLoading, router, redirectTo])

  // Still loading
  if (isLoading) {
    return null
  }

  // Authenticated - will redirect
  if (user) {
    return null
  }

  // Not authenticated - show content
  return <>{children}</>
}
