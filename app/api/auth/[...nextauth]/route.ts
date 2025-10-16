import NextAuth, { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'

// Minimal safe auth options that will always work
const minimalAuthOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
  ],
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
  },
  debug: true,
  callbacks: {
    async signIn() {
      console.log('[NextAuth] Sign in callback (minimal mode)')
      return true
    },
  },
}

// Try to load full auth options with database integration
let authOptions: NextAuthOptions
try {
  const { authOptions: fullOptions } = require('@/features/auth')
  authOptions = fullOptions
  console.log('[NextAuth Route] ✅ Using full auth options with database')
} catch (error) {
  console.error('[NextAuth Route] ⚠️ Failed to load full auth options, using minimal (no database):', error)
  authOptions = minimalAuthOptions
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
