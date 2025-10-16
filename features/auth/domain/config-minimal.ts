/**
 * MINIMAL Authentication Configuration
 * NO DATABASE INTEGRATION - JWT Only
 * 
 * This is a temporary config to get signin working.
 * Database integration will be added back incrementally.
 */

import './types'
import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'

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
  ],
  
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signin',
    error: '/auth/error',
  },
  
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  
  callbacks: {
    async signIn({ user }) {
      // Simple check - just verify email exists
      return !!user.email
    },
    
    async jwt({ token, user, account }) {
      // Initial sign in
      if (account && user) {
        token.email = user.email
        token.name = user.name
        token.picture = user.image
        // For now, just use email as tenant ID
        token.tenantId = user.email?.split('@')[0] || 'default'
        token.role = 'owner'
      }
      return token
    },
    
    async session({ session, token }) {
      if (session.user) {
        session.user.email = token.email as string
        session.user.name = token.name as string
        session.user.image = token.picture as string
        // @ts-ignore
        session.user.tenantId = token.tenantId as string
        // @ts-ignore
        session.user.role = token.role as string
      }
      return session
    }
  },
  
  debug: true,
}
