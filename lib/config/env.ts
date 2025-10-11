import { z } from 'zod'

// Environment validation schema
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),
  SUPABASE_URL: z.string().url('SUPABASE_URL must be a valid URL'),
  SUPABASE_ANON_KEY: z.string().min(1, 'SUPABASE_ANON_KEY is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),
  
  // AI/LLM
  OPENAI_API_KEY: z.string().min(1, 'OPENAI_API_KEY is required'),
  
  // External APIs
  NHTSA_API_KEY: z.string().optional(),
  SAMSARA_API_TOKEN: z.string().optional(),
  
  // App Config
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters'),
  NEXTAUTH_URL: z.string().url().optional(),
  
  // Feature Flags
  ENABLE_ENRICHMENT: z.string().transform(val => val === 'true').default('false'),
  ENABLE_TELEMETRY: z.string().transform(val => val === 'true').default('false'),
  
  // Rate Limiting
  REDIS_URL: z.string().url().optional(),
  
  // Monitoring
  SENTRY_DSN: z.string().url().optional(),
})

type Env = z.infer<typeof envSchema>

// Check if running in browser
const isBrowser = typeof window !== 'undefined'

// Validate environment variables at startup
function validateEnv(): Env {
  // Skip validation in browser (env vars are server-side only)
  if (isBrowser) {
    // Return empty object cast as Env for browser context
    // The actual env validation happens server-side
    return {} as Env
  }
  
  try {
    const env = envSchema.parse(process.env)
    console.log('✅ Environment validation passed')
    return env
  } catch (error) {
    console.error('❌ Environment validation failed:')
    if (error instanceof z.ZodError) {
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`)
      })
    }
    
    // Only exit if running in Node.js (not browser)
    if (typeof process !== 'undefined' && process.exit) {
      process.exit(1)
    } else {
      throw new Error('Environment validation failed')
    }
  }
}

// Export validated environment
export const env = validateEnv()

// Type-safe environment access
export type { Env }

// Helper functions
export const isDevelopment = env.NODE_ENV === 'development'
export const isProduction = env.NODE_ENV === 'production'
export const isTest = env.NODE_ENV === 'test'

// Feature flags
export const features = {
  enrichment: env.ENABLE_ENRICHMENT,
  telemetry: env.ENABLE_TELEMETRY,
} as const
