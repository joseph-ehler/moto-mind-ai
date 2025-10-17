/**
 * Rate Limiter Service
 * 
 * Protects against brute force attacks with configurable limits
 * Tracks by email or IP address with automatic cleanup
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export type AttemptType = 'login' | 'reset' | 'verify' | 'magic_link'

interface RateLimit {
  maxAttempts: number
  windowMinutes: number
}

/**
 * Rate limit configuration per attempt type
 */
const RATE_LIMITS: Record<AttemptType, RateLimit> = {
  login: { maxAttempts: 5, windowMinutes: 15 },
  reset: { maxAttempts: 3, windowMinutes: 60 },
  verify: { maxAttempts: 1, windowMinutes: 5 },
  magic_link: { maxAttempts: 3, windowMinutes: 60 }
}

interface RateLimitResult {
  allowed: boolean
  retryAfterMinutes?: number
  attemptsRemaining?: number
}

interface RateLimitRecord {
  identifier: string
  attempt_type: string
  attempts: number
  window_start: string
  locked_until: string | null
  last_attempt_at: string
}

/**
 * Check if action is allowed based on rate limits
 */
export async function checkRateLimit(
  identifier: string,
  type: AttemptType
): Promise<RateLimitResult> {
  try {
    const limit = RATE_LIMITS[type]
    const now = new Date()

    // Get current record
    const { data: record, error } = await supabase
      .from('auth_rate_limits')
      .select('*')
      .eq('identifier', identifier)
      .eq('attempt_type', type)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('[RATE_LIMIT] Query error:', error)
      // Fail open (allow) on database errors
      return { allowed: true }
    }

    const existingRecord = record as RateLimitRecord | null

    // Check if locked
    if (existingRecord?.locked_until) {
      const lockedUntil = new Date(existingRecord.locked_until)
      if (lockedUntil > now) {
        const retryAfter = Math.ceil(
          (lockedUntil.getTime() - now.getTime()) / 60000
        )
        return { 
          allowed: false, 
          retryAfterMinutes: retryAfter 
        }
      }
    }

    // Check if window expired
    if (existingRecord) {
      const windowStart = new Date(existingRecord.window_start)
      const windowEnd = new Date(
        windowStart.getTime() + limit.windowMinutes * 60000
      )

      if (now > windowEnd) {
        // Window expired - reset
        await resetRateLimit(identifier, type)
        return { 
          allowed: true, 
          attemptsRemaining: limit.maxAttempts - 1 
        }
      }

      // Within window - check attempts
      const attemptsRemaining = limit.maxAttempts - existingRecord.attempts

      if (attemptsRemaining <= 0) {
        // Lock the account
        const lockedUntil = new Date(now.getTime() + limit.windowMinutes * 60000)
        
        await supabase
          .from('auth_rate_limits')
          .update({
            locked_until: lockedUntil.toISOString(),
            last_attempt_at: now.toISOString()
          })
          .eq('identifier', identifier)
          .eq('attempt_type', type)

        return { 
          allowed: false, 
          retryAfterMinutes: limit.windowMinutes 
        }
      }

      return { 
        allowed: true, 
        attemptsRemaining: attemptsRemaining - 1 
      }
    }

    // No record - first attempt
    return { 
      allowed: true, 
      attemptsRemaining: limit.maxAttempts - 1 
    }

  } catch (error) {
    console.error('[RATE_LIMIT] Unexpected error:', error)
    // Fail open (allow) on unexpected errors
    return { allowed: true }
  }
}

/**
 * Record a failed attempt
 */
export async function recordAttempt(
  identifier: string,
  type: AttemptType
): Promise<void> {
  try {
    const now = new Date()

    // Try to update existing record
    const { data: existing } = await supabase
      .from('auth_rate_limits')
      .select('*')
      .eq('identifier', identifier)
      .eq('attempt_type', type)
      .single()

    if (existing) {
      // Increment attempts
      await supabase
        .from('auth_rate_limits')
        .update({
          attempts: (existing as RateLimitRecord).attempts + 1,
          last_attempt_at: now.toISOString()
        })
        .eq('identifier', identifier)
        .eq('attempt_type', type)
    } else {
      // Create new record
      await supabase
        .from('auth_rate_limits')
        .insert({
          identifier,
          attempt_type: type,
          attempts: 1,
          window_start: now.toISOString(),
          last_attempt_at: now.toISOString()
        })
    }
  } catch (error) {
    console.error('[RATE_LIMIT] Failed to record attempt:', error)
  }
}

/**
 * Reset rate limit for an identifier
 */
export async function resetRateLimit(
  identifier: string,
  type: AttemptType
): Promise<void> {
  try {
    const now = new Date()

    await supabase
      .from('auth_rate_limits')
      .upsert({
        identifier,
        attempt_type: type,
        attempts: 1,
        window_start: now.toISOString(),
        locked_until: null,
        last_attempt_at: now.toISOString()
      }, {
        onConflict: 'identifier,attempt_type'
      })
  } catch (error) {
    console.error('[RATE_LIMIT] Failed to reset:', error)
  }
}

/**
 * Clear all rate limits for an identifier (e.g., after successful login)
 */
export async function clearRateLimits(identifier: string): Promise<void> {
  try {
    await supabase
      .from('auth_rate_limits')
      .delete()
      .eq('identifier', identifier)
  } catch (error) {
    console.error('[RATE_LIMIT] Failed to clear:', error)
  }
}

/**
 * Get time remaining for lockout
 */
export async function getRetryAfter(
  identifier: string,
  type: AttemptType
): Promise<number | null> {
  try {
    const { data: record } = await supabase
      .from('auth_rate_limits')
      .select('locked_until')
      .eq('identifier', identifier)
      .eq('attempt_type', type)
      .single()

    if (!record || !record.locked_until) {
      return null
    }

    const lockedUntil = new Date(record.locked_until)
    const now = new Date()

    if (lockedUntil <= now) {
      return null
    }

    return Math.ceil((lockedUntil.getTime() - now.getTime()) / 60000)
  } catch (error) {
    return null
  }
}

/**
 * Format retry time for user display
 */
export function formatRetryTime(minutes: number): string {
  if (minutes < 1) {
    return 'less than a minute'
  }
  
  if (minutes === 1) {
    return '1 minute'
  }
  
  if (minutes < 60) {
    return `${minutes} minutes`
  }
  
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  
  if (hours === 1) {
    return remainingMinutes > 0 
      ? `1 hour and ${remainingMinutes} minutes`
      : '1 hour'
  }
  
  return remainingMinutes > 0
    ? `${hours} hours and ${remainingMinutes} minutes`
    : `${hours} hours`
}

/**
 * Get client IP address from request
 */
export function getClientIp(request: Request): string {
  // Try various headers
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  // Fallback
  return 'unknown'
}
