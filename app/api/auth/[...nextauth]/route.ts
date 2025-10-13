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
      // For now, allow all Google sign-ins
      // Get or create tenant_id from database later
      console.log('✅ User signed in:', user.email)
      return true
    },
    async jwt({ token, user, account }) {
      // On first sign-in, get tenant_id from database
      if (account && user) {
        try {
          // Try to get first tenant from database for development
          const { data: tenants } = await supabaseAdmin
            .from('tenants')
            .select('id')
            .limit(1)
            .single()
          
          if (tenants) {
            token.tenant_id = tenants.id
            console.log('✅ Attached tenant_id to token:', tenants.id)
          } else {
            console.warn('⚠️ No tenants found in database')
          }
        } catch (error) {
          console.error('❌ Error getting tenant:', error)
        }
      }
      return token
    },
    async session({ session, token }) {
      // Attach tenant_id to session
      if (token.tenant_id) {
        session.user.tenant_id = token.tenant_id as string
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
