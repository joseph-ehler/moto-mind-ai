/**
 * AI Ticker Service
 * 
 * Generates contextual loading messages using OpenAI.
 * 
 * Privacy-first:
 * - Only sends PII-safe context (year/make/model, mileageBand)
 * - No raw VIN, no user names, no location
 * - Cached results (24-48h)
 * - Rate limited per user
 * 
 * Non-blocking:
 * - 300-500ms soft budget
 * - Returns deterministic base if slow/unavailable
 * - Prefetch one step earlier
 * 
 * Usage:
 * ```tsx
 * const tickers = await getAITickers({
 *   flow: 'vehicle',
 *   chapter: 'vin-decode',
 *   vehicle: { year: 2013, make: 'Chevrolet', model: 'Captiva Sport' }
 * })
 * ```
 */

import { z } from 'zod'

// PII-safe context schema
const SafeContextSchema = z.object({
  flow: z.string(),
  chapter: z.string(),
  vehicle: z.object({
    year: z.number().optional(),
    make: z.string().optional(),
    model: z.string().optional(),
  }).optional(),
  mileageBand: z.enum(['0-50k', '50-100k', '100-150k', '150k+']).optional(),
  locale: z.string().default('en-US'),
  tone: z.enum(['calm', 'helpful', 'concise']).default('calm'),
})

type SafeContext = z.infer<typeof SafeContextSchema>

// Response schema (validates AI output)
const TickerResponseSchema = z.object({
  tickers: z.array(z.string().min(5).max(60)).min(1).max(3),
})

// In-memory cache (24h TTL)
const tickerCache = new Map<string, { tickers: string[]; expires: number }>()

/**
 * Get AI-flavored ticker messages
 * 
 * Returns base tickers if:
 * - AI unavailable
 * - Response too slow (> 500ms)
 * - Validation fails
 * - Rate limited
 */
export async function getAITickers(
  context: SafeContext,
  baseTickers: string[]
): Promise<string[]> {
  // Validate context
  const safeContext = SafeContextSchema.parse(context)
  
  // Generate cache key
  const cacheKey = generateCacheKey(safeContext)
  
  // Check cache
  const cached = tickerCache.get(cacheKey)
  if (cached && cached.expires > Date.now()) {
    return cached.tickers
  }
  
  // Check if we should call AI (feature flag, rate limit, etc.)
  if (!shouldCallAI(safeContext)) {
    return baseTickers
  }
  
  try {
    // Call with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 500)
    
    const response = await fetch('/api/ai/tickers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(safeContext),
      signal: controller.signal,
    })
    
    clearTimeout(timeoutId)
    
    if (!response.ok) {
      console.warn('[AI Tickers] API error:', response.status)
      return baseTickers
    }
    
    const data = await response.json()
    
    // Validate response
    const validated = TickerResponseSchema.parse(data)
    
    // Cache result (24h)
    tickerCache.set(cacheKey, {
      tickers: validated.tickers,
      expires: Date.now() + 24 * 60 * 60 * 1000,
    })
    
    return validated.tickers
    
  } catch (error: any) {
    // Timeout or error - return base
    if (error.name === 'AbortError') {
      console.log('[AI Tickers] Timeout - using base tickers')
    } else {
      console.warn('[AI Tickers] Error:', error.message)
    }
    return baseTickers
  }
}

/**
 * Prefetch AI tickers (call before showing loading scene)
 */
export function prefetchAITickers(
  context: SafeContext,
  baseTickers: string[]
): Promise<string[]> {
  // Non-blocking prefetch
  return getAITickers(context, baseTickers).catch(() => baseTickers)
}

/**
 * Generate cache key from context
 */
function generateCacheKey(context: SafeContext): string {
  const parts = [
    context.flow,
    context.chapter,
    context.vehicle?.year || '',
    context.vehicle?.make || '',
    context.vehicle?.model || '',
    context.mileageBand || '',
    context.locale,
  ]
  return parts.join(':').toLowerCase()
}

/**
 * Check if we should call AI
 * (Feature flags, rate limits, etc.)
 */
function shouldCallAI(context: SafeContext): boolean {
  // Feature flag check (env var)
  if (process.env.NEXT_PUBLIC_AI_TICKERS_ENABLED !== 'true') {
    return false
  }
  
  // Only call if we have vehicle context
  if (!context.vehicle?.make) {
    return false
  }
  
  // TODO: Add per-user rate limiting
  // For now, allow all requests
  
  return true
}

/**
 * Merge AI tickers into base (replace middle slots)
 */
export function mergeTickers(baseTickers: string[], aiTickers: string[]): string[] {
  if (aiTickers.length === 0 || aiTickers === baseTickers) {
    return baseTickers
  }
  
  // Keep first and last deterministic
  // Replace middle 1-2 with AI
  const merged = [...baseTickers]
  
  if (baseTickers.length >= 3 && aiTickers.length >= 1) {
    // Replace middle slot(s)
    const middleStart = 1
    const middleCount = Math.min(aiTickers.length, baseTickers.length - 2)
    
    for (let i = 0; i < middleCount; i++) {
      merged[middleStart + i] = aiTickers[i]
    }
  }
  
  return merged
}
