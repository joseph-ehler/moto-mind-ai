import { z } from 'zod'

/**
 * Environment configuration
 * Centralized access to environment variables with validation
 * 
 * Organized by Phase:
 * - Phase 1: Foundation (Required Now)
 * - Phase 2: Intelligence Layer (Month 3)
 * - Phase 3: Analytics & Insights (Month 6)
 * - Phase 4: Enterprise Features (Month 9)
 * - Phase 5: Premium Differentiators (Month 13)
 * - Phase 6: Scale & Optimization (Month 16)
 */

// Environment validation schema
const envSchema = z.object({
  // ========================================
  // PHASE 1: FOUNDATION (REQUIRED NOW)
  // ========================================

  NEXT_PUBLIC_APP_NAME: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_API_URL: z.string().url().optional(),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  // Database
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),

  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),

  // OpenAI (Vision + Chat)
  OPENAI_API_KEY: z.string().min(1, 'OPENAI_API_KEY is required'),
  OPENAI_ORG_ID: z.string().optional(),
  OPENAI_MODEL: z.string().optional().default('gpt-4o'),

  // Redis/KV (optional caching)
  REDIS_URL: z.string().url().optional(),
  KV_URL: z.string().url().optional(),

  // ========================================
  // PHASE 2: INTELLIGENCE LAYER (MONTH 3)
  // ========================================

  ANTHROPIC_API_KEY: z.string().optional(),
  GOOGLE_AI_API_KEY: z.string().optional(),
  GEOCODING_URL: z.string().url().optional().default('https://nominatim.openstreetmap.org'),
  OVERPASS_URL: z.string().url().optional().default('https://overpass-api.de/api/interpreter'),
  WEATHER_URL: z.string().url().optional().default('https://archive-api.open-meteo.com/v1/archive'),

  // ========================================
  // PHASE 3: ANALYTICS (MONTH 6)
  // ========================================

  NEXT_PUBLIC_ANALYTICS_ENABLED: z.string().transform(val => val === 'true').optional(),
  NEXT_PUBLIC_ANALYTICS_PROVIDER: z.string().optional().default('posthog'),
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().url().optional().default('https://app.posthog.com'),

  // ========================================
  // PHASE 4: ENTERPRISE (MONTH 9)
  // ========================================

  NEXT_PUBLIC_FCM_VAPID_KEY: z.string().optional(),
  FCM_SERVER_KEY: z.string().optional(),
  SENDGRID_API_KEY: z.string().optional(),
  SENDGRID_FROM_EMAIL: z.string().email().optional().default('notifications@motomind.app'),
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().email().optional().default('notifications@motomind.app'),
  SLACK_WEBHOOK_URL: z.string().url().optional(),
  QUICKBOOKS_CLIENT_ID: z.string().optional(),
  QUICKBOOKS_CLIENT_SECRET: z.string().optional(),
  QUICKBOOKS_REDIRECT_URI: z.string().url().optional(),
  SAMSARA_API_KEY: z.string().optional(),

  // ========================================
  // PHASE 5: PREMIUM (MONTH 13)
  // ========================================

  GASBUDDY_API_KEY: z.string().optional(),

  // ========================================
  // PHASE 6: SCALE (MONTH 16)
  // ========================================

  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  SENTRY_TRACES_SAMPLE_RATE: z.string().optional().default('0.1'),
  ENABLE_METRICS: z.string().transform(val => val === 'true').optional(),
  METRICS_PORT: z.string().regex(/^\d+$/).optional().default('9090'),

  // ========================================
  // SYSTEM CONFIGURATION
  // ========================================

  RATE_LIMIT_MAX: z.string().regex(/^\d+$/).optional().default('100'),
  RATE_LIMIT_WINDOW_MS: z.string().regex(/^\d+$/).optional().default(String(15 * 60 * 1000)),

  // Feature Flags
  ENABLE_ENRICHMENT: z.string().transform(val => val === 'true').default('false'),
  ENABLE_TELEMETRY: z.string().transform(val => val === 'true').default('false'),
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

// Validate and get environment
const validatedEnv = validateEnv()

// Export structured configuration by phase
export const config = {
  // ========================================
  // PHASE 1: FOUNDATION
  // ========================================
  app: {
    name: process.env.NEXT_PUBLIC_APP_NAME || 'MotoMind',
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3005',
    apiUrl: process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3005',
    environment: (process.env.NODE_ENV as 'development' | 'test' | 'production') || 'development',
  },

  database: {
    url: process.env.DATABASE_URL!,
  },

  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },

  openai: {
    apiKey: process.env.OPENAI_API_KEY!,
    organizationId: process.env.OPENAI_ORG_ID,
    model: process.env.OPENAI_MODEL || 'gpt-4o',
  },

  redis: {
    url: process.env.REDIS_URL || process.env.KV_URL,
    enabled: !!(process.env.REDIS_URL || process.env.KV_URL),
  },
  
  // ========================================
  // PHASE 2: INTELLIGENCE LAYER
  // ========================================
  vision: {
    primary: 'gpt-4o',
    fallbacks: ['claude-3.5-sonnet', 'gemini-pro'],
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY,
      model: 'claude-3-5-sonnet-20241022',
      enabled: !!process.env.ANTHROPIC_API_KEY,
    },
    google: {
      apiKey: process.env.GOOGLE_AI_API_KEY,
      model: 'gemini-pro-vision',
      enabled: !!process.env.GOOGLE_AI_API_KEY,
    },
  },
  
  location: {
    geocoding: {
      provider: 'nominatim',
      baseUrl: process.env.GEOCODING_URL || 'https://nominatim.openstreetmap.org',
      userAgent: 'MotoMind/1.0',
    },
    poi: {
      provider: 'overpass',
      baseUrl: process.env.OVERPASS_URL || 'https://overpass-api.de/api/interpreter',
    },
  },
  
  weather: {
    provider: 'open-meteo',
    baseUrl: process.env.WEATHER_URL || 'https://archive-api.open-meteo.com/v1/archive',
  },
  
  // ========================================
  // PHASE 3: ANALYTICS
  // ========================================
  analytics: {
    enabled: process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === 'true',
    provider: process.env.NEXT_PUBLIC_ANALYTICS_PROVIDER || 'posthog',
    posthog: {
      apiKey: process.env.NEXT_PUBLIC_POSTHOG_KEY,
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
      enabled: !!process.env.NEXT_PUBLIC_POSTHOG_KEY,
    },
  },
  
  // ========================================
  // PHASE 4: ENTERPRISE
  // ========================================
  exports: {
    pdf: {
      provider: 'pdfkit',
      templatesDir: './lib/exports/templates',
    },
  },
  
  notifications: {
    push: {
      enabled: !!process.env.NEXT_PUBLIC_FCM_VAPID_KEY,
      vapidKey: process.env.NEXT_PUBLIC_FCM_VAPID_KEY,
      serverKey: process.env.FCM_SERVER_KEY,
    },
    email: {
      enabled: !!process.env.SENDGRID_API_KEY || !!process.env.RESEND_API_KEY,
      provider: process.env.EMAIL_PROVIDER || 'sendgrid',
      sendgrid: {
        apiKey: process.env.SENDGRID_API_KEY,
        fromEmail: process.env.SENDGRID_FROM_EMAIL || 'notifications@motomind.app',
      },
      resend: {
        apiKey: process.env.RESEND_API_KEY,
        fromEmail: process.env.RESEND_FROM_EMAIL || 'notifications@motomind.app',
      },
    },
    slack: {
      enabled: !!process.env.SLACK_WEBHOOK_URL,
      webhookUrl: process.env.SLACK_WEBHOOK_URL,
    },
  },
  
  integrations: {
    quickbooks: {
      enabled: !!process.env.QUICKBOOKS_CLIENT_ID,
      clientId: process.env.QUICKBOOKS_CLIENT_ID,
      clientSecret: process.env.QUICKBOOKS_CLIENT_SECRET,
      redirectUri: process.env.QUICKBOOKS_REDIRECT_URI,
    },
    samsara: {
      enabled: !!process.env.SAMSARA_API_KEY,
      apiKey: process.env.SAMSARA_API_KEY,
      baseUrl: 'https://api.samsara.com',
    },
  },
  
  // ========================================
  // PHASE 5: PREMIUM
  // ========================================
  premium: {
    voice: {
      enabled: !!process.env.OPENAI_API_KEY,
      whisperModel: 'whisper-1',
      ttsModel: 'tts-1',
      ttsVoice: 'alloy',
    },
    prices: {
      enabled: !!process.env.GASBUDDY_API_KEY,
      provider: 'gasbuddy',
      apiKey: process.env.GASBUDDY_API_KEY,
    },
  },
  
  // ========================================
  // PHASE 6: SCALE
  // ========================================
  monitoring: {
    sentry: {
      enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
    },
    prometheus: {
      enabled: process.env.ENABLE_METRICS === 'true',
      port: parseInt(process.env.METRICS_PORT || '9090'),
    },
  },
  
  // ========================================
  // SYSTEM
  // ========================================
  rateLimit: {
    enabled: process.env.NODE_ENV === 'production',
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX || '100'),
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || String(15 * 60 * 1000)),
  },
  
  cache: {
    ttl: {
      short: 5 * 60,        // 5 min (GPS, prices)
      medium: 60 * 60,      // 1 hour (geocoding, weather)
      long: 24 * 60 * 60,   // 24 hours (static data)
    },
  },
}

// Export for backward compatibility
export const env = config

// Type exports
export type { Env }

// Helper flags
export const isDevelopment = config.app.environment === 'development'
export const isProduction = config.app.environment === 'production'
export const isTest = config.app.environment === 'test'

// Feature flags
export const features = {
  enrichment: process.env.ENABLE_ENRICHMENT === 'true',
  telemetry: process.env.ENABLE_TELEMETRY === 'true',
} as const
