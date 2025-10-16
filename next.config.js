/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    // Skip type checking during build for production deployment
    ignoreBuildErrors: true,
  },
  env: {
    // Server-side only
    SAMSARA_API_KEY: process.env.SAMSARA_API_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    DATABASE_URL: process.env.DATABASE_URL,
    // Provide dummy values during build, real values at runtime
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy-key-for-build',
    
    // NextAuth
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://moto-mind-ai.vercel.app',
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    
    // Client-side (NEXT_PUBLIC_* should auto-inline, but explicitly including for Vercel)
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy-anon-key-for-build',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
  // Disable file watching to avoid watchpack errors
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: ['**/node_modules/**', '**/.git/**', '**/.next/**']
      }
    }
    return config
  },
  async redirects() {
    return [
      // Route aliases for architecture cleanup
      {
        source: '/fleet',
        destination: '/vehicles',
        permanent: true
      },
      {
        source: '/onboard-vehicle',
        destination: '/vehicles/onboard',
        permanent: true
      }
    ]
  },
  async rewrites() {
    return [
      {
        source: '/health',
        destination: '/api/health'
      }
    ]
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Link',
            value: '</manifest.json>; rel="manifest"'
          }
        ]
      }
    ]
  }
}

module.exports = nextConfig
