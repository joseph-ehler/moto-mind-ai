/**
 * Unified Current User Helper
 * 
 * Single source of truth for getting the authenticated user.
 * Works everywhere: client components, server components, API routes.
 * 
 * This solves the NextAuth vs Supabase Auth confusion by providing
 * ONE consistent way to get the current user across your entire app.
 * 
 * @module lib/auth/current-user
 */

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'

/**
 * Standardized user object
 * Consistent shape regardless of auth provider
 */
export interface CurrentUser {
  id: string
  email: string
  name?: string
  image?: string
}

/**
 * Get current user in SERVER context (API routes, Server Components, Server Actions)
 * 
 * @returns Current user or null if not authenticated
 * 
 * @example
 * ```typescript
 * // In API route:
 * import { getCurrentUserServer } from '@/lib/auth/current-user'
 * 
 * export async function POST(request: Request) {
 *   const user = await getCurrentUserServer()
 *   
 *   if (!user) {
 *     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 *   }
 *   
 *   // Use user.id in your queries
 *   const { data } = await supabase
 *     .from('parking_spots')
 *     .select('*')
 *     .eq('user_id', user.id)
 * }
 * ```
 */
export async function getCurrentUserServer(): Promise<CurrentUser | null> {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return null
    }
    
    // Extract user from NextAuth session
    const userId = (session.user as any).id
    
    if (!userId) {
      console.error('[getCurrentUserServer] Session exists but no user ID found')
      return null
    }
    
    return {
      id: userId,
      email: session.user.email,
      name: session.user.name ?? undefined,
      image: session.user.image ?? undefined
    }
  } catch (error) {
    console.error('[getCurrentUserServer] Failed to get user:', error)
    return null
  }
}

/**
 * Require authenticated user in SERVER context
 * Throws error if not authenticated - use in routes that MUST have auth
 * 
 * @throws Error if user is not authenticated
 * @returns Current user (guaranteed to exist)
 * 
 * @example
 * ```typescript
 * export async function POST(request: Request) {
 *   // Throws if not authenticated (no need for if check)
 *   const user = await requireUserServer()
 *   
 *   // user.id is guaranteed to exist here
 *   await parkingMemory.saveSpot(user.id, options)
 * }
 * ```
 */
export async function requireUserServer(): Promise<CurrentUser> {
  const user = await getCurrentUserServer()
  
  if (!user) {
    throw new Error('Authentication required')
  }
  
  return user
}

/**
 * Get current user ID only (lighter weight)
 * 
 * @returns User ID or null
 * 
 * @example
 * ```typescript
 * const userId = await getCurrentUserIdServer()
 * if (!userId) {
 *   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 * }
 * ```
 */
export async function getCurrentUserIdServer(): Promise<string | null> {
  const user = await getCurrentUserServer()
  return user?.id ?? null
}

/**
 * Require user ID (throws if not authenticated)
 * 
 * @throws Error if user is not authenticated
 * @returns User ID (guaranteed to exist)
 */
export async function requireUserIdServer(): Promise<string> {
  const user = await requireUserServer()
  return user.id
}
