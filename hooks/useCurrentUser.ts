/**
 * useCurrentUser Hook
 * 
 * React hook for getting the current user in CLIENT components.
 * Mirrors the server-side getCurrentUserServer() API for consistency.
 * 
 * @module hooks/useCurrentUser
 */

'use client'

import { useSession } from 'next-auth/react'
import type { CurrentUser } from '@/lib/auth/current-user'

/**
 * Hook to get current user in client components
 * 
 * @returns Current user state
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { user, isLoading } = useCurrentUser()
 *   
 *   if (isLoading) return <Spinner />
 *   if (!user) return <SignInPrompt />
 *   
 *   // user.id is available
 *   return <div>Hello {user.name}!</div>
 * }
 * ```
 */
export function useCurrentUser() {
  const { data: session, status } = useSession()
  
  const user: CurrentUser | null = session?.user?.email
    ? {
        id: (session.user as any).id,
        email: session.user.email,
        name: session.user.name ?? undefined,
        image: session.user.image ?? undefined
      }
    : null
  
  return {
    user,
    isLoading: status === 'loading',
    isAuthenticated: !!user
  }
}

/**
 * Hook to require authenticated user (throws if not authenticated)
 * Use this for pages/components that MUST have a user
 * 
 * @returns Current user (guaranteed to exist)
 * 
 * @example
 * ```tsx
 * function ProtectedComponent() {
 *   const { user, isLoading } = useRequireUser()
 *   
 *   if (isLoading) return <Spinner />
 *   
 *   // user is guaranteed to exist here (or redirected)
 *   return <div>Welcome {user.name}!</div>
 * }
 * ```
 */
export function useRequireUser() {
  const { user, isLoading } = useCurrentUser()
  
  return {
    user: user!,
    isLoading
  }
}

/**
 * Hook to get just the user ID (lighter weight)
 * 
 * @returns User ID or null
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const userId = useCurrentUserId()
 *   
 *   if (!userId) return null
 *   
 *   // Use userId in your logic
 *   return <UserDashboard userId={userId} />
 * }
 * ```
 */
export function useCurrentUserId(): string | null {
  const { user } = useCurrentUser()
  return user?.id ?? null
}
