/**
 * Magic Link Service
 * 
 * Handles secure token generation, storage, and verification for magic links
 * Used by both email and phone authentication adapters
 */

import { createClient } from '@supabase/supabase-js'
import { createHash, randomBytes } from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface MagicLinkToken {
  token: string          // Plain token (send to user)
  tokenHash: string      // Hashed token (store in DB)
  expiresAt: Date
}

interface VerifyResult {
  success: boolean
  identifier?: string
  method?: 'email' | 'phone'
  error?: string
}

/**
 * Generate a secure magic link token
 */
export function generateToken(): MagicLinkToken {
  // Generate 32 random bytes → 64 character hex string
  const token = randomBytes(32).toString('hex')
  
  // Hash for database storage (SHA-256)
  const tokenHash = createHash('sha256').update(token).digest('hex')
  
  // Default expiry: 15 minutes
  const expiryMinutes = parseInt(process.env.MAGIC_LINK_EXPIRY_MINUTES || '15', 10)
  const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000)
  
  return { token, tokenHash, expiresAt }
}

/**
 * Store magic link token in database
 */
export async function storeMagicLink(
  identifier: string,
  method: 'email' | 'phone',
  tokenHash: string,
  expiresAt: Date,
  metadata: Record<string, any> = {}
): Promise<void> {
  const { error } = await supabase
    .from('auth_magic_links')
    .insert({
      token_hash: tokenHash,
      identifier,
      method,
      expires_at: expiresAt.toISOString(),
      metadata,
    })
  
  if (error) {
    console.error('[Magic Link] Failed to store token:', error)
    throw new Error('Failed to create magic link')
  }
}

/**
 * Verify magic link token
 * Returns identifier if valid, null if invalid/expired/used
 */
export async function verifyMagicLink(token: string): Promise<VerifyResult> {
  // Hash the incoming token
  const tokenHash = createHash('sha256').update(token).digest('hex')
  
  // Find matching token
  const { data, error } = await supabase
    .from('auth_magic_links')
    .select('*')
    .eq('token_hash', tokenHash)
    .single()
  
  if (error || !data) {
    return {
      success: false,
      error: 'Invalid or expired magic link',
    }
  }
  
  // Check if already used
  if (data.used) {
    return {
      success: false,
      error: 'This magic link has already been used',
    }
  }
  
  // Check expiration
  if (new Date(data.expires_at) < new Date()) {
    return {
      success: false,
      error: 'This magic link has expired',
    }
  }
  
  // Mark as used
  const { error: updateError } = await supabase
    .from('auth_magic_links')
    .update({
      used: true,
      used_at: new Date().toISOString(),
    })
    .eq('token_hash', tokenHash)
  
  if (updateError) {
    console.error('[Magic Link] Failed to mark as used:', updateError)
    // Continue anyway - user can still authenticate
  }
  
  return {
    success: true,
    identifier: data.identifier,
    method: data.method as 'email' | 'phone',
  }
}

/**
 * Check rate limit for magic link sends
 * Returns true if allowed, false if rate limited
 */
export async function checkRateLimit(
  identifier: string,
  method: 'email' | 'phone',
  maxAttempts?: number,
  windowMinutes?: number
): Promise<boolean> {
  // Use provided values or fall back to defaults
  const attempts = maxAttempts ?? parseInt(process.env.MAGIC_LINK_RATE_LIMIT || '3', 10)
  const window = windowMinutes ?? parseInt(process.env.MAGIC_LINK_RATE_WINDOW || '60', 10)
  
  try {
    const { data, error } = await supabase.rpc('check_magic_link_rate_limit', {
      p_identifier: identifier,
      p_method: method,
      p_max_attempts: attempts,
      p_window_minutes: window,
    })
    
    if (error) {
      console.error('[Magic Link] Rate limit check failed:', error)
      // Fail open (allow) on error to not block legitimate users
      return true
    }
    
    return data as boolean
  } catch (err) {
    console.error('[Magic Link] Rate limit exception:', err)
    return true // Fail open
  }
}

/**
 * Generate magic link URL
 */
export function generateMagicLinkUrl(token: string, callbackPath: string = '/auth/verify'): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3005'
  return `${baseUrl}${callbackPath}?token=${token}`
}

/**
 * Clean up expired tokens (run via cron or manually)
 */
export async function cleanupExpiredLinks(): Promise<number> {
  try {
    const { data, error } = await supabase.rpc('cleanup_expired_magic_links')
    
    if (error) {
      console.error('[Magic Link] Cleanup failed:', error)
      return 0
    }
    
    return data as number
  } catch (err) {
    console.error('[Magic Link] Cleanup exception:', err)
    return 0
  }
}

/**
 * Get remaining rate limit attempts
 */
export async function getRateLimitInfo(
  identifier: string,
  method: 'email' | 'phone'
): Promise<{ allowed: number; resetsAt: Date } | null> {
  try {
    const { data, error } = await supabase
      .from('auth_magic_link_rate_limits')
      .select('*')
      .eq('identifier', identifier)
      .eq('method', method)
      .single()
    
    if (error || !data) {
      // No rate limit record = fresh start
      return {
        allowed: parseInt(process.env.MAGIC_LINK_RATE_LIMIT || '3', 10),
        resetsAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
      }
    }
    
    const maxAttempts = parseInt(process.env.MAGIC_LINK_RATE_LIMIT || '3', 10)
    const windowMinutes = parseInt(process.env.MAGIC_LINK_RATE_WINDOW || '60', 10)
    const windowStart = new Date(data.window_start)
    const resetsAt = new Date(windowStart.getTime() + windowMinutes * 60 * 1000)
    
    return {
      allowed: Math.max(0, maxAttempts - data.attempt_count),
      resetsAt,
    }
  } catch (err) {
    console.error('[Magic Link] Rate limit info failed:', err)
    return null
  }
}
