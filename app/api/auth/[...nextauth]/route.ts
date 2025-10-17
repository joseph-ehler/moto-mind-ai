import NextAuth, { type NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { trackLogin } from '@/lib/auth/services/login-preferences'
import { trackSession } from '@/lib/auth/services/session-tracker'
import { checkRateLimit, recordAttempt } from '@/lib/auth/services/rate-limiter'
import { verifyPassword } from '@/lib/auth/services/password-service'
import { getSupabaseClient } from '@/lib/supabase/client'

const supabase = getSupabaseClient()

// Note: User agent and IP will be captured by middleware on first request
// This ensures sessions are tracked automatically

// Log env vars (without exposing secrets)
console.log('[NextAuth] Config check:', {
  hasClientId: !!process.env.GOOGLE_CLIENT_ID,
  hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
  hasSecret: !!process.env.NEXTAUTH_SECRET,
  nextAuthUrl: process.env.NEXTAUTH_URL,
})

const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      id: 'credentials',
      name: 'Email and Password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required')
        }

        // Check rate limit
        const rateLimit = await checkRateLimit(credentials.email, 'login')
        if (!rateLimit.allowed) {
          await recordAttempt(credentials.email, 'login')
          throw new Error(`Too many login attempts. Try again in ${rateLimit.retryAfterMinutes} minutes.`)
        }

        // Get user from database
        const { data: user, error } = await supabase
          .from('user_tenants')
          .select('id, email, password_hash, email_verified')
          .eq('email', credentials.email)
          .single()

        if (error || !user) {
          await recordAttempt(credentials.email, 'login')
          throw new Error('Invalid email or password')
        }

        // Verify password
        const isValid = await verifyPassword(credentials.password, user.password_hash)
        if (!isValid) {
          await recordAttempt(credentials.email, 'login')
          throw new Error('Invalid email or password')
        }

        // Check email verification (optional - comment out if not required)
        // if (!user.email_verified) {
        //   throw new Error('Please verify your email before signing in')
        // }

        return {
          id: user.id,
          email: user.email,
          name: user.email.split('@')[0]
        }
      }
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
      console.log('[NextAuth] SignIn callback:', { 
        user: user?.email, 
        provider: account?.provider 
      })
      
      // ✅ Track login method
      if (user?.email) {
        try {
          const method = account?.provider === 'google' ? 'google' : 'credentials'
          await trackLogin(user.email, method)
          console.log('[NextAuth] ✅ Login tracked:', user.email, method)
        } catch (error) {
          console.error('[NextAuth] ❌ Failed to track login:', error)
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
      // Add user ID to session
      if (session.user && token.sub) {
        (session.user as any).id = token.sub
      }
      return session
    },
    async jwt({ token, user, account }) {
      // Store user info in JWT
      if (user) {
        token.id = user.id
        token.email = user.email
      }
      return token
    },
  },
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
