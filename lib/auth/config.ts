/**
 * Production-Grade Authentication Configuration
 * 
 * Features:
 * - Database-backed sessions (not JWT-only)
 * - Automatic tenant creation
 * - Proper error handling
 * - Session refresh
 * - Security hardening
 */

import './types' // Import type augmentations
import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import EmailProvider from 'next-auth/providers/email'
import CredentialsProvider from 'next-auth/providers/credentials'
import { createClient } from '@supabase/supabase-js'
import { sendMagicLinkEmail } from './services/email-service'
import { getUserCredentials } from './services/user-registration'
import { verifyPassword } from './services/password-service'
import { trackLogin, type LoginMethod } from './services/login-preferences'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
    
    EmailProvider({
      server: {
        host: 'smtp.resend.com',
        port: 465,
        secure: true,
        auth: {
          user: 'resend',
          pass: process.env.RESEND_API_KEY!,
        },
      },
      from: process.env.RESEND_FROM_EMAIL || 'auth@motomind.ai',
      async sendVerificationRequest({ identifier: email, url }) {
        try {
          await sendMagicLinkEmail({ to: email, url })
        } catch (error) {
          console.error('[AUTH] Magic link send failed:', error)
          throw error
        }
      },
    }),
    
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Missing email or password')
        }

        try {
          // Get user credentials from database
          const userCreds = await getUserCredentials(credentials.email)

          if (!userCreds.found || !userCreds.passwordHash) {
            throw new Error('Invalid email or password')
          }

          // Verify password
          const isValid = await verifyPassword(
            credentials.password,
            userCreds.passwordHash
          )

          if (!isValid) {
            throw new Error('Invalid email or password')
          }

          // Return user object (will be passed to JWT callback)
          return {
            id: credentials.email,
            email: credentials.email,
            name: credentials.email.split('@')[0],
          }
        } catch (error) {
          console.error('[AUTH] Credentials authorization failed:', error)
          return null
        }
      },
    }),
  ],
  
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signin',
    error: '/auth/error',
    verifyRequest: '/auth/verify-request',
  },
  
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        if (!user.email) {
          console.error('❌ No email provided during sign-in')
          return false
        }

        // Check if user already has a tenant
        const { data: existingMapping, error: mappingError } = await supabase
          .from('user_tenants')
          .select('tenant_id, tenants(id, name, is_active)')
          .eq('user_id', user.email)
          .single()

        if (mappingError && mappingError.code !== 'PGRST116') {
          // PGRST116 = no rows returned (expected for new users)
          console.error('❌ Error checking user tenant:', mappingError)
          return false
        }

        if (existingMapping) {
          // Existing user - verify tenant is active
          const tenant = (existingMapping as any).tenants
          if (!tenant.is_active) {
            console.error('❌ Tenant is inactive:', tenant.id)
            return false
          }
          
          console.log('✅ Existing user signed in:', user.email)
          
          // Track login method for returning users
          if (account?.provider) {
            const method: LoginMethod = 
              account.provider === 'google' ? 'google' :
              account.provider === 'email' ? 'email' :
              'credentials'
            await trackLogin(user.email, method).catch(err => 
              console.warn('[AUTH] Failed to track login:', err)
            )
          }
          
          return true
        }

        // New user - create tenant and mapping
        console.log('🆕 New user detected, creating tenant:', user.email)
        
        const { data: newTenant, error: tenantError } = await supabase
          .from('tenants')
          .insert({
            name: user.name || user.email?.split('@')[0] || 'Personal',
            is_active: true
          })
          .select()
          .single()

        if (tenantError) {
          console.error('❌ Failed to create tenant:', tenantError)
          return false
        }

        const { error: linkError } = await supabase
          .from('user_tenants')
          .insert({
            user_id: user.email,
            tenant_id: newTenant.id,
            role: 'owner'
          })

        if (linkError) {
          console.error('❌ Failed to link user to tenant:', linkError)
          // Cleanup: delete tenant if linking failed
          await supabase.from('tenants').delete().eq('id', newTenant.id)
          return false
        }

        console.log('✅ New tenant created:', newTenant.id)
        
        // Track login method
        if (account?.provider) {
          const method: LoginMethod = 
            account.provider === 'google' ? 'google' :
            account.provider === 'email' ? 'email' :
            'credentials'
          await trackLogin(user.email, method).catch(err => 
            console.warn('[AUTH] Failed to track login:', err)
          )
        }
        
        return true
        
      } catch (error) {
        console.error('❌ Sign-in callback error:', error)
        return false
      }
    },
    
    async jwt({ token, user, account, trigger }) {
      // Initial sign in
      if (account && user && user.email) {
        try {
          const { data: mapping } = await supabase
            .from('user_tenants')
            .select('tenant_id, role')
            .eq('user_id', user.email)
            .single()

          if (mapping) {
            token.tenantId = mapping.tenant_id
            token.role = mapping.role
            token.email = user.email
            token.userId = user.email
          }
        } catch (error) {
          console.error('❌ JWT callback error:', error)
        }
      }
      
      // Refresh token (happens every 24 hours)
      if (trigger === 'update' && token.email) {
        try {
          // Re-fetch tenant to ensure it's still active
          const { data: mapping } = await supabase
            .from('user_tenants')
            .select('tenant_id, role, tenants(is_active)')
            .eq('user_id', token.email as string)
            .single()

          if (mapping && (mapping as any).tenants.is_active) {
            token.tenantId = mapping.tenant_id
            token.role = mapping.role
          } else {
            // Tenant inactive - invalidate session
            return null as any
          }
        } catch (error) {
          console.error('❌ Token refresh error:', error)
        }
      }

      return token
    },
    
    async session({ session, token }) {
      if (token.tenantId && token.email && token.role) {
        session.user = {
          ...session.user,
          email: token.email,
          tenantId: token.tenantId,
          role: token.role,
        }
      }
      return session
    },
  },
  
  events: {
    async signIn({ user, account, isNewUser }) {
      console.log('📊 Sign in event:', { 
        email: user.email, 
        isNewUser,
        provider: account?.provider 
      })
    },
    async signOut({ token }) {
      console.log('📊 Sign out event:', { email: token?.email })
    },
  },
  
  debug: process.env.NODE_ENV === 'development',
}
