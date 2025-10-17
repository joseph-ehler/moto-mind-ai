import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { trackLogin } from '@/lib/auth/services/login-preferences'

// Log env vars (without exposing secrets)
console.log('[NextAuth] Config check:', {
  hasClientId: !!process.env.GOOGLE_CLIENT_ID,
  hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
  hasSecret: !!process.env.NEXTAUTH_SECRET,
  nextAuthUrl: process.env.NEXTAUTH_URL,
})

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  debug: true,
  // Explicitly set the base URL
  ...(process.env.NEXTAUTH_URL && { 
    url: process.env.NEXTAUTH_URL 
  }),
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log('[NextAuth] SignIn callback:', { user: user?.email, account: account?.provider })
      
      // ✅ Track login in our custom table
      if (user?.email) {
        try {
          await trackLogin(user.email, 'google')
          console.log('[NextAuth] ✅ Login tracked for:', user.email)
        } catch (error) {
          console.error('[NextAuth] ❌ Failed to track login:', error)
          // Don't fail the login if tracking fails
        }
      }
      
      return true
    },
    async redirect({ url, baseUrl }) {
      console.log('[NextAuth] Redirect:', { url, baseUrl })
      // Redirect to home after signin
      if (url.startsWith('/')) return `${baseUrl}${url}`
      if (url.startsWith(baseUrl)) return url
      return baseUrl
    },
    async session({ session, token }) {
      // Add user ID to session for tracking
      if (session.user && token.sub) {
        (session.user as any).id = token.sub
      }
      return session
    },
  },
})

export { handler as GET, handler as POST }
