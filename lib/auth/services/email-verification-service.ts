/**
 * Email Verification Service
 * 
 * Secure email verification implementation with:
 * - 24-hour token expiration
 * - One-time use tokens
 * - Rate limiting for resends
 */

import { getSupabaseClient } from '@/lib/supabase/client'
import { randomBytes } from 'crypto'
import { checkRateLimit, recordAttempt, clearRateLimits } from './rate-limiter'

const supabase = getSupabaseClient()

const VERIFICATION_TOKEN_EXPIRATION_HOURS = 24
const VERIFICATION_TOKEN_LENGTH = 32

export interface SendVerificationResult {
  success: boolean
  token?: string
  expiresAt?: Date
  error?: string
}

export interface VerifyEmailResult {
  success: boolean
  email?: string
  userId?: string
  error?: string
  errorCode?: 'EXPIRED' | 'INVALID' | 'USED' | 'ALREADY_VERIFIED'
}

/**
 * Generate a secure verification token
 */
function generateVerificationToken(): string {
  return randomBytes(VERIFICATION_TOKEN_LENGTH).toString('hex')
}

/**
 * Send email verification
 */
export async function sendEmailVerification(
  email: string,
  userId: string,
  ipAddress?: string
): Promise<SendVerificationResult> {
  try {
    // Check if already verified
    const { data: user } = await supabase
      .from('user_tenants')
      .select('email_verified')
      .eq('id', userId)
      .single()

    if (user?.email_verified) {
      return {
        success: false,
        error: 'Email is already verified'
      }
    }

    // Check rate limit (1 per 5 minutes)
    const rateLimit = await checkRateLimit(email, 'email_verification')
    
    if (!rateLimit.allowed) {
      await recordAttempt(email, 'email_verification')
      return {
        success: false,
        error: `Too many verification emails sent. Please try again in ${rateLimit.retryAfterMinutes} minutes.`
      }
    }

    // Generate token
    const token = generateVerificationToken()
    const expiresAt = new Date(Date.now() + VERIFICATION_TOKEN_EXPIRATION_HOURS * 60 * 60000)

    // Store token
    const { error } = await supabase
      .from('email_verification_tokens')
      .insert({
        token,
        user_id: userId,
        email,
        expires_at: expiresAt.toISOString(),
        ip_address: ipAddress,
        used: false,
        created_at: new Date().toISOString()
      })

    if (error) {
      console.error('[EMAIL_VERIFICATION] Failed to create token:', error)
      return {
        success: false,
        error: 'Failed to send verification email'
      }
    }

    // Record rate limit attempt
    await recordAttempt(email, 'email_verification')

    console.log(`[EMAIL_VERIFICATION] Token created for ${email}, expires at ${expiresAt.toISOString()}`)

    return {
      success: true,
      token,
      expiresAt
    }

  } catch (error) {
    console.error('[EMAIL_VERIFICATION] Unexpected error:', error)
    return {
      success: false,
      error: 'Failed to send verification email'
    }
  }
}

/**
 * Verify email with token
 */
export async function verifyEmail(token: string): Promise<VerifyEmailResult> {
  try {
    // Fetch token from database
    const { data: verificationToken, error } = await supabase
      .from('email_verification_tokens')
      .select('*')
      .eq('token', token)
      .single()

    if (error || !verificationToken) {
      return {
        success: false,
        error: 'Invalid or expired verification link',
        errorCode: 'INVALID'
      }
    }

    // Check if already used
    if (verificationToken.used) {
      return {
        success: false,
        error: 'This verification link has already been used',
        errorCode: 'USED'
      }
    }

    // Check expiration
    const expiresAt = new Date(verificationToken.expires_at)
    if (new Date() > expiresAt) {
      return {
        success: false,
        error: 'This verification link has expired. Please request a new one.',
        errorCode: 'EXPIRED'
      }
    }

    // Check if already verified
    const { data: user } = await supabase
      .from('user_tenants')
      .select('email_verified')
      .eq('id', verificationToken.user_id)
      .single()

    if (user?.email_verified) {
      return {
        success: false,
        error: 'Email is already verified',
        errorCode: 'ALREADY_VERIFIED'
      }
    }

    // Mark email as verified
    const { error: updateError } = await supabase
      .from('user_tenants')
      .update({
        email_verified: true,
        email_verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', verificationToken.user_id)

    if (updateError) {
      console.error('[EMAIL_VERIFICATION] Failed to update user:', updateError)
      return {
        success: false,
        error: 'Failed to verify email'
      }
    }

    // Mark token as used
    await supabase
      .from('email_verification_tokens')
      .update({
        used: true,
        used_at: new Date().toISOString()
      })
      .eq('token', token)

    // Clear rate limits for successful verification
    await clearRateLimits(verificationToken.email, 'email_verification')

    console.log(`[EMAIL_VERIFICATION] Email verified for ${verificationToken.email}`)

    return {
      success: true,
      email: verificationToken.email,
      userId: verificationToken.user_id
    }

  } catch (error) {
    console.error('[EMAIL_VERIFICATION] Verify error:', error)
    return {
      success: false,
      error: 'Failed to verify email',
      errorCode: 'INVALID'
    }
  }
}

/**
 * Check if email is verified
 */
export async function isEmailVerified(userId: string): Promise<boolean> {
  try {
    const { data: user } = await supabase
      .from('user_tenants')
      .select('email_verified')
      .eq('id', userId)
      .single()

    return user?.email_verified || false

  } catch (error) {
    return false
  }
}

/**
 * Get verification status
 */
export async function getVerificationStatus(userId: string): Promise<{
  verified: boolean
  verifiedAt?: string
  pendingTokens: number
}> {
  try {
    // Get user verification status
    const { data: user } = await supabase
      .from('user_tenants')
      .select('email_verified, email_verified_at')
      .eq('id', userId)
      .single()

    // Count pending (unused, unexpired) tokens
    const { count } = await supabase
      .from('email_verification_tokens')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())

    return {
      verified: user?.email_verified || false,
      verifiedAt: user?.email_verified_at,
      pendingTokens: count || 0
    }

  } catch (error) {
    return {
      verified: false,
      pendingTokens: 0
    }
  }
}

/**
 * Clean up expired verification tokens
 */
export async function cleanupExpiredVerificationTokens(): Promise<{ deleted: number }> {
  try {
    const { error, count } = await supabase
      .from('email_verification_tokens')
      .delete()
      .lt('expires_at', new Date().toISOString())

    if (error) {
      console.error('[EMAIL_VERIFICATION] Cleanup failed:', error)
      return { deleted: 0 }
    }

    console.log(`[EMAIL_VERIFICATION] Cleaned up ${count || 0} expired tokens`)
    
    return { deleted: count || 0 }

  } catch (error) {
    console.error('[EMAIL_VERIFICATION] Cleanup error:', error)
    return { deleted: 0 }
  }
}
