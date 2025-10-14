import NextAuth, { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { createClient } from '@supabase/supabase-js'

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user.email) {
        console.error('❌ No email provided')
        return false
      }

      try {
        const supabase = createClient(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        // Check if user already has a tenant
        const { data: existingMapping } = await supabase
          .from('user_tenants')
          .select('tenant_id, tenants(id, name)')
          .eq('user_id', user.email)
          .single()

        if (existingMapping) {
          console.log('✅ Existing user signed in:', user.email, '→ tenant:', existingMapping.tenant_id)
          return true
        }

        // New user - create tenant and mapping
        console.log('🆕 New user, creating tenant for:', user.email)
        
        const { data: newTenant, error: tenantError } = await supabase
          .from('tenants')
          .insert({
            name: user.name || user.email?.split('@')[0] || 'Personal'
          })
          .select()
          .single()

        if (tenantError) {
          console.error('❌ Failed to create tenant:', tenantError)
          return false
        }

        const { error: mappingError } = await supabase
          .from('user_tenants')
          .insert({
            user_id: user.email,
            tenant_id: newTenant.id,
            role: 'owner'
          })

        if (mappingError) {
          console.error('❌ Failed to create user-tenant mapping:', mappingError)
          return false
        }

        console.log('✅ Created tenant:', newTenant.id, 'for user:', user.email)
        return true
      } catch (error) {
        console.error('❌ Auth error:', error)
        return false
      }
    },
    async jwt({ token, user, account }) {
      // Fetch tenant_id from database on every JWT creation
      if (account && user && user.email) {
        try {
          const supabase = createClient(
            process.env.SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
          )

          const { data: mapping } = await supabase
            .from('user_tenants')
            .select('tenant_id')
            .eq('user_id', user.email)
            .single()

          if (mapping) {
            token.tenant_id = mapping.tenant_id
            token.user_id = user.email
            console.log('✅ JWT created with tenant_id:', mapping.tenant_id)
          } else {
            console.warn('⚠️ No tenant mapping found for:', user.email)
          }
        } catch (error) {
          console.error('❌ Error fetching tenant_id:', error)
        }
      }
      return token
    },
    async session({ session, token }) {
      // Attach tenant_id (UUID) and user_id to session
      if (token.tenant_id) {
        ;(session.user as any).tenant_id = token.tenant_id as string
        ;(session.user as any).id = token.user_id as string
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
  },
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
