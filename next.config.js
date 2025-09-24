/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    SAMSARA_API_KEY: process.env.SAMSARA_API_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    DATABASE_URL: process.env.DATABASE_URL,
  },
  async rewrites() {
    return [
      {
        source: '/health',
        destination: '/api/health'
      }
    ]
  }
}

module.exports = nextConfig
