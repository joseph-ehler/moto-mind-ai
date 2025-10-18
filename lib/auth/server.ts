/**
 * Server-side Auth Helpers
 * For use in API routes and server components
 */

import { cookies } from 'next/headers'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export interface AuthUser {
  id: string
  email?: string
}

/**
 * Create Supabase client for server-side use
 */
async function createServerSupabaseClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Cookie setting can fail in middleware
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // Cookie removal can fail in middleware
          }
        },
      },
    }
  )
}

/**
 * Require authenticated user in API route
 * Throws error if not authenticated
 */
export async function requireUserServer(): Promise<{ user: AuthUser }> {
  const supabase = await createServerSupabaseClient()

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error('Unauthorized')
  }

  return {
    user: {
      id: user.id,
      email: user.email,
    },
  }
}
