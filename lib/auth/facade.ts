/**
 * Auth Facade
 * 
 * 🔥 THE ONLY FILE THAT KNOWS ABOUT SUPABASE AUTH
 * 
 * All auth operations go through this facade.
 * Components NEVER import Supabase directly.
 * To switch auth providers: update this ONE file.
 */

import { createClient as createBrowserClient } from '@/lib/supabase/browser-client'
import type { User as SupabaseUser } from '@supabase/supabase-js'

// ============================================================================
// TYPES
// ============================================================================

export interface User {
  id: string
  email: string
  name?: string
  avatar?: string
  emailVerified?: boolean
}

export interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
}

export interface AuthChangeCallback {
  (user: User | null): void
}

// ============================================================================
// HELPERS
// ============================================================================

function mapSupabaseUser(supabaseUser: SupabaseUser): User {
  return {
    id: supabaseUser.id,
    email: supabaseUser.email!,
    name: supabaseUser.user_metadata?.name || supabaseUser.user_metadata?.full_name,
    avatar: supabaseUser.user_metadata?.avatar_url || supabaseUser.user_metadata?.picture,
    emailVerified: supabaseUser.email_confirmed_at != null
  }
}

// ============================================================================
// CLIENT-SIDE AUTH FACADE
// ============================================================================

export const auth = {
  /**
   * Get current user (client-side)
   */
  async getUser(): Promise<User | null> {
    const supabase = createBrowserClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.user) return null
    return mapSupabaseUser(session.user)
  },

  /**
   * Get current session
   */
  async getSession() {
    const supabase = createBrowserClient()
    const { data: { session } } = await supabase.auth.getSession()
    return session
  },

  /**
   * Sign in with OAuth provider
   */
  async signInWithOAuth(provider: 'google' | 'github' | 'apple', redirectTo?: string) {
    const supabase = createBrowserClient()
    
    // Check if we're on native platform
    const isNative = typeof (window as any).Capacitor !== 'undefined'
    
    if (isNative) {
      // On native, use Capacitor Browser plugin to open in Safari View Controller
      const { Browser } = await import('@capacitor/browser')
      
      // Get the OAuth URL from Supabase
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: 'motomind://auth/callback',
          skipBrowserRedirect: true, // Don't auto-redirect, we'll handle it
        }
      })
      
      if (error) throw error
      if (!data.url) throw new Error('No OAuth URL returned')
      
      // Open in Safari View Controller (in-app browser)
      await Browser.open({
        url: data.url,
        presentationStyle: 'popover', // iOS style
      })
      
      // Browser will close automatically when redirecting to motomind:// scheme
      return { data, error: null }
    }
    
    // For web, use normal redirect flow
    return supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: redirectTo || `${window.location.origin}/track`
      }
    })
  },

  /**
   * Sign in with Google (alias)
   */
  async signInWithGoogle(redirectTo?: string) {
    return auth.signInWithOAuth('google', redirectTo)
  },

  /**
   * Sign in with email and password
   */
  async signInWithPassword(email: string, password: string) {
    const supabase = createBrowserClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) throw error
    return data.user ? mapSupabaseUser(data.user) : null
  },

  /**
   * Sign up with email and password
   */
  async signUp(email: string, password: string, metadata?: { name?: string }) {
    const supabase = createBrowserClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    })

    if (error) throw error
    return data.user ? mapSupabaseUser(data.user) : null
  },

  /**
   * Sign out
   */
  async signOut() {
    const supabase = createBrowserClient()
    return supabase.auth.signOut()
  },

  /**
   * Send password reset email
   */
  async resetPassword(email: string) {
    const supabase = createBrowserClient()
    return supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    })
  },

  /**
   * Update password
   */
  async updatePassword(newPassword: string) {
    const supabase = createBrowserClient()
    return supabase.auth.updateUser({ password: newPassword })
  },

  /**
   * Listen for auth state changes
   * Returns unsubscribe function
   */
  onAuthChange(callback: AuthChangeCallback): () => void {
    const supabase = createBrowserClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      callback(session?.user ? mapSupabaseUser(session.user) : null)
    })

    return () => subscription.unsubscribe()
  }
}

// ============================================================================
// SERVER-SIDE AUTH FACADE
// ============================================================================

/**
 * Get current user on server (Next.js Server Components, API Routes)
 * 
 * Usage:
 *   const user = await authServer.getUser(cookies())
 */
export const authServer = {
  /**
   * Get user from server-side cookies
   */
  async getUser(cookieStore: any): Promise<User | null> {
    const { createServerClient } = await import('@supabase/ssr')
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set() {},
          remove() {}
        }
      }
    )

    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return null
    
    return mapSupabaseUser(session.user)
  },

  /**
   * Require authenticated user (throws if not)
   */
  async requireUser(cookieStore: any): Promise<User> {
    const user = await authServer.getUser(cookieStore)
    if (!user) {
      throw new Error('Unauthorized')
    }
    return user
  }
}
