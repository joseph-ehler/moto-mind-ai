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
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    
    // Client-side (NEXT_PUBLIC_* are automatically inlined, but explicitly including for Vercel)
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
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
