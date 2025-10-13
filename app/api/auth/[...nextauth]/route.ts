import NextAuth, { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { supabaseAdmin } from '@/lib/clients/supabase-admin'

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
        // 1. Get or create user in auth.users (Supabase Auth)
        const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers()
        
        let userId: string
        let existingUser = users?.find(u => u.email === user.email)
        
        if (!existingUser) {
          // Create user in Supabase Auth
          const { data, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: user.email,
            email_confirm: true,
            user_metadata: {
              name: user.name,
              avatar: user.image,
              provider: 'google'
            }
          })
          
          if (createError || !data.user) {
            console.error('❌ Failed to create user:', createError)
            return false
          }
          
          userId = data.user.id
          console.log('✅ Created new user:', user.email, userId)
        } else {
          userId = existingUser.id
          console.log('✅ Found existing user:', user.email, userId)
        }

        // 2. Get or create tenant
        const { data: existingTenant } = await supabaseAdmin
          .from('tenants')
          .select('id')
          .eq('id', userId)
          .single()

        if (!existingTenant) {
          // Create tenant with same ID as user
          const { error: tenantError } = await supabaseAdmin
            .from('tenants')
            .insert({
              id: userId,
              created_at: new Date().toISOString()
            })

          if (tenantError) {
            console.error('❌ Failed to create tenant:', tenantError)
            return false
          }

          console.log('✅ Created tenant for user:', userId)
        }

        return true
      } catch (error) {
        console.error('❌ Sign-in error:', error)
        return false
      }
    },
    async jwt({ token, user, account }) {
      // On first sign-in, attach user ID as tenant_id
      if (account && user && user.email) {
        try {
          // Get user from Supabase Auth
          const { data: { users } } = await supabaseAdmin.auth.admin.listUsers()
          const authUser = users?.find(u => u.email === user.email)
          
          if (authUser) {
            token.tenant_id = authUser.id
            token.user_id = authUser.id
            console.log('✅ Attached tenant_id to token:', authUser.id)
          }
        } catch (error) {
          console.error('❌ Error getting user for JWT:', error)
        }
      }
      return token
    },
    async session({ session, token }) {
      // Attach tenant_id and user_id to session
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
