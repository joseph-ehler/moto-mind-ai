import NextAuth, { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
// import { supabaseAdmin } from '@/lib/clients/supabase-admin' // Temporarily disabled

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // TEMPORARY: Simplified auth - just allow sign-in for now
      // TODO: Create user/tenant in database after fixing Supabase setup
      console.log('✅ User signed in:', user.email)
      return true
    },
    async jwt({ token, user, account }) {
      // TEMPORARY: Use email as tenant_id for now
      if (account && user && user.email) {
        token.tenant_id = user.email
        token.user_id = user.email
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
