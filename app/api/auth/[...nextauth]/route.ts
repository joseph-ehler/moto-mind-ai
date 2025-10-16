import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'

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
      return true
    },
    async redirect({ url, baseUrl }) {
      console.log('[NextAuth] Redirect:', { url, baseUrl })
      // Redirect to home after signin
      if (url.startsWith('/')) return `${baseUrl}${url}`
      if (url.startsWith(baseUrl)) return url
      return baseUrl
    },
  },
})

export { handler as GET, handler as POST }
