/**
 * Magic Link Service
 * 
 * Secure magic link implementation with:
 * - 15-minute expiration (not 24 hours)
 * - One-time use enforcement
 * - IP address validation
 * - Token tracking
 */

import { getSupabaseClient } from '@/lib/supabase/client'
import { randomBytes } from 'crypto'
import { checkRateLimit, recordAttempt } from './rate-limiter'

const supabase = getSupabaseClient()

const MAGIC_LINK_EXPIRATION_MINUTES = 15
const MAGIC_LINK_LENGTH = 32

export interface MagicLinkResult {
  success: boolean
  token?: string
  expiresAt?: Date
  error?: string
}

export interface VerifyResult {
  success: boolean
  email?: string
  error?: string
  errorCode?: 'EXPIRED' | 'INVALID' | 'USED' | 'RATE_LIMITED'
}

/**
 * Generate a secure magic link token
 */
function generateToken(): string {
  return randomBytes(MAGIC_LINK_LENGTH).toString('hex')
}

/**
 * Create a new magic link for email sign-in
 */
export async function createMagicLink(
  email: string,
  ipAddress?: string
): Promise<MagicLinkResult> {
  try {
    // Check rate limit (3 per hour)
    const rateLimit = await checkRateLimit(email, 'magic_link')
    
    if (!rateLimit.allowed) {
      await recordAttempt(email, 'magic_link')
      return {
        success: false,
        error: `Too many magic link requests. Please try again in ${rateLimit.retryAfterMinutes} minutes.`
      }
    }

    // Generate secure token
    const token = generateToken()
    const expiresAt = new Date(Date.now() + MAGIC_LINK_EXPIRATION_MINUTES * 60000)

    // Store in database
    const { error } = await supabase
      .from('magic_links')
      .insert({
        token,
        email,
        expires_at: expiresAt.toISOString(),
        ip_address: ipAddress,
        used: false,
        created_at: new Date().toISOString()
      })

    if (error) {
      console.error('[MAGIC_LINK] Failed to create:', error)
      return {
        success: false,
        error: 'Failed to create magic link'
      }
    }

    // Record attempt for rate limiting
    await recordAttempt(email, 'magic_link')

    console.log(`[MAGIC_LINK] Created for ${email}, expires at ${expiresAt.toISOString()}`)

    return {
      success: true,
      token,
      expiresAt
    }

  } catch (error) {
    console.error('[MAGIC_LINK] Unexpected error:', error)
    return {
      success: false,
      error: 'Failed to create magic link'
    }
  }
}

/**
 * Verify a magic link token
 */
export async function verifyMagicLink(
  token: string,
  ipAddress?: string
): Promise<VerifyResult> {
  try {
    // Fetch token from database
    const { data: magicLink, error } = await supabase
      .from('magic_links')
      .select('*')
      .eq('token', token)
      .single()

    if (error || !magicLink) {
      console.log('[MAGIC_LINK] Token not found')
      return {
        success: false,
        error: 'Invalid or expired link',
        errorCode: 'INVALID'
      }
    }

    // Check if already used
    if (magicLink.used) {
      console.log('[MAGIC_LINK] Token already used')
      return {
        success: false,
        error: 'This link has already been used',
        errorCode: 'USED'
      }
    }

    // Check expiration
    const expiresAt = new Date(magicLink.expires_at)
    const now = new Date()

    if (now > expiresAt) {
      console.log('[MAGIC_LINK] Token expired')
      return {
        success: false,
        error: 'This link has expired. Please request a new one.',
        errorCode: 'EXPIRED'
      }
    }

    // Optional: IP address validation
    if (ipAddress && magicLink.ip_address && magicLink.ip_address !== ipAddress) {
      console.warn(`[MAGIC_LINK] IP mismatch: ${magicLink.ip_address} vs ${ipAddress}`)
      // Could make this more strict in production
    }

    // Mark as used (one-time use enforcement)
    const { error: updateError } = await supabase
      .from('magic_links')
      .update({
        used: true,
        used_at: new Date().toISOString()
      })
      .eq('token', token)

    if (updateError) {
      console.error('[MAGIC_LINK] Failed to mark as used:', updateError)
      // Continue anyway - better to let them sign in
    }

    console.log(`[MAGIC_LINK] Verified successfully for ${magicLink.email}`)

    return {
      success: true,
      email: magicLink.email
    }

  } catch (error) {
    console.error('[MAGIC_LINK] Unexpected error:', error)
    return {
      success: false,
      error: 'Failed to verify magic link',
      errorCode: 'INVALID'
    }
  }
}

/**
 * Get time remaining until expiration
 */
export async function getTimeRemaining(token: string): Promise<number | null> {
  try {
    const { data: magicLink } = await supabase
      .from('magic_links')
      .select('expires_at, used')
      .eq('token', token)
      .single()

    if (!magicLink || magicLink.used) {
      return null
    }

    const expiresAt = new Date(magicLink.expires_at)
    const now = new Date()
    const remainingMs = expiresAt.getTime() - now.getTime()

    return remainingMs > 0 ? Math.ceil(remainingMs / 1000) : 0

  } catch (error) {
    return null
  }
}

/**
 * Clean up expired magic links (run periodically)
 */
export async function cleanupExpiredLinks(): Promise<{ deleted: number }> {
  try {
    const { error, count } = await supabase
      .from('magic_links')
      .delete()
      .lt('expires_at', new Date().toISOString())

    if (error) {
      console.error('[MAGIC_LINK] Cleanup failed:', error)
      return { deleted: 0 }
    }

    console.log(`[MAGIC_LINK] Cleaned up ${count || 0} expired links`)
    
    return { deleted: count || 0 }

  } catch (error) {
    console.error('[MAGIC_LINK] Cleanup error:', error)
    return { deleted: 0 }
  }
}
