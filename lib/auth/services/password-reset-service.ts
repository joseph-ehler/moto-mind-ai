/**
 * Password Reset Service
 * 
 * Secure password reset implementation with:
 * - 1-hour token expiration
 * - One-time use tokens
 * - Session invalidation
 * - Rate limiting
 */

import { getSupabaseClient } from '@/lib/supabase/client'
import { randomBytes } from 'crypto'
import { hashPassword } from './password-service'
import { checkRateLimit, recordAttempt, clearRateLimits } from './rate-limiter'

const supabase = getSupabaseClient()

const RESET_TOKEN_EXPIRATION_HOURS = 1
const RESET_TOKEN_LENGTH = 32

export interface ResetRequestResult {
  success: boolean
  token?: string
  expiresAt?: Date
  error?: string
}

export interface ResetPasswordResult {
  success: boolean
  error?: string
  errorCode?: 'EXPIRED' | 'INVALID' | 'USED' | 'WEAK_PASSWORD'
}

/**
 * Generate a secure reset token
 */
function generateResetToken(): string {
  return randomBytes(RESET_TOKEN_LENGTH).toString('hex')
}

/**
 * Request a password reset
 */
export async function requestPasswordReset(
  email: string,
  ipAddress?: string
): Promise<ResetRequestResult> {
  try {
    // Check rate limit (3 per hour)
    const rateLimit = await checkRateLimit(email, 'password_reset')
    
    if (!rateLimit.allowed) {
      await recordAttempt(email, 'password_reset')
      return {
        success: false,
        error: `Too many reset requests. Please try again in ${rateLimit.retryAfterMinutes} minutes.`
      }
    }

    // Check if user exists
    const { data: user } = await supabase
      .from('user_tenants')
      .select('id, email')
      .eq('email', email)
      .single()

    if (!user) {
      // Don't reveal if email exists (security)
      // But still record rate limit attempt
      await recordAttempt(email, 'password_reset')
      return {
        success: true, // Lie for security
        token: 'fake-token',
        expiresAt: new Date()
      }
    }

    // Generate token
    const token = generateResetToken()
    const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRATION_HOURS * 60 * 60000)

    // Store token
    const { error } = await supabase
      .from('password_reset_tokens')
      .insert({
        token,
        user_id: user.id,
        email,
        expires_at: expiresAt.toISOString(),
        ip_address: ipAddress,
        used: false,
        created_at: new Date().toISOString()
      })

    if (error) {
      console.error('[PASSWORD_RESET] Failed to create token:', error)
      return {
        success: false,
        error: 'Failed to create reset token'
      }
    }

    // Record rate limit attempt
    await recordAttempt(email, 'password_reset')

    console.log(`[PASSWORD_RESET] Token created for ${email}, expires at ${expiresAt.toISOString()}`)

    return {
      success: true,
      token,
      expiresAt
    }

  } catch (error) {
    console.error('[PASSWORD_RESET] Unexpected error:', error)
    return {
      success: false,
      error: 'Failed to process reset request'
    }
  }
}

/**
 * Verify a reset token is valid
 */
export async function verifyResetToken(token: string): Promise<{
  valid: boolean
  email?: string
  userId?: string
  error?: string
  errorCode?: 'EXPIRED' | 'INVALID' | 'USED'
}> {
  try {
    const { data: resetToken, error } = await supabase
      .from('password_reset_tokens')
      .select('*')
      .eq('token', token)
      .single()

    if (error || !resetToken) {
      return {
        valid: false,
        error: 'Invalid or expired reset link',
        errorCode: 'INVALID'
      }
    }

    // Check if already used
    if (resetToken.used) {
      return {
        valid: false,
        error: 'This reset link has already been used',
        errorCode: 'USED'
      }
    }

    // Check expiration
    const expiresAt = new Date(resetToken.expires_at)
    if (new Date() > expiresAt) {
      return {
        valid: false,
        error: 'This reset link has expired. Please request a new one.',
        errorCode: 'EXPIRED'
      }
    }

    return {
      valid: true,
      email: resetToken.email,
      userId: resetToken.user_id
    }

  } catch (error) {
    console.error('[PASSWORD_RESET] Verify error:', error)
    return {
      valid: false,
      error: 'Failed to verify reset token',
      errorCode: 'INVALID'
    }
  }
}

/**
 * Reset password with token
 */
export async function resetPassword(
  token: string,
  newPassword: string,
  currentDeviceId?: string
): Promise<ResetPasswordResult> {
  try {
    // Verify token
    const verification = await verifyResetToken(token)
    
    if (!verification.valid) {
      return {
        success: false,
        error: verification.error,
        errorCode: verification.errorCode
      }
    }

    const { email, userId } = verification

    // Hash new password
    const hashedPassword = await hashPassword(newPassword)

    // Update password in database
    const { error: updateError } = await supabase
      .from('user_tenants')
      .update({
        password_hash: hashedPassword,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (updateError) {
      console.error('[PASSWORD_RESET] Failed to update password:', updateError)
      return {
        success: false,
        error: 'Failed to update password'
      }
    }

    // Mark token as used
    await supabase
      .from('password_reset_tokens')
      .update({
        used: true,
        used_at: new Date().toISOString()
      })
      .eq('token', token)

    // Invalidate all sessions EXCEPT current device
    if (currentDeviceId) {
      await supabase
        .from('sessions')
        .delete()
        .eq('user_id', userId)
        .neq('device_id', currentDeviceId)
    } else {
      // Invalidate ALL sessions
      await supabase
        .from('sessions')
        .delete()
        .eq('user_id', userId)
    }

    // Clear rate limits for successful reset
    await clearRateLimits(email!, 'password_reset')

    console.log(`[PASSWORD_RESET] Password reset successful for ${email}`)

    return {
      success: true
    }

  } catch (error) {
    console.error('[PASSWORD_RESET] Reset error:', error)
    return {
      success: false,
      error: 'Failed to reset password'
    }
  }
}

/**
 * Get time remaining for a reset token
 */
export async function getResetTokenTimeRemaining(token: string): Promise<number | null> {
  try {
    const { data: resetToken } = await supabase
      .from('password_reset_tokens')
      .select('expires_at, used')
      .eq('token', token)
      .single()

    if (!resetToken || resetToken.used) {
      return null
    }

    const expiresAt = new Date(resetToken.expires_at)
    const now = new Date()
    const remainingMs = expiresAt.getTime() - now.getTime()

    return remainingMs > 0 ? Math.ceil(remainingMs / 1000) : 0

  } catch (error) {
    return null
  }
}

/**
 * Clean up expired reset tokens
 */
export async function cleanupExpiredResetTokens(): Promise<{ deleted: number }> {
  try {
    const { error, count } = await supabase
      .from('password_reset_tokens')
      .delete()
      .lt('expires_at', new Date().toISOString())

    if (error) {
      console.error('[PASSWORD_RESET] Cleanup failed:', error)
      return { deleted: 0 }
    }

    console.log(`[PASSWORD_RESET] Cleaned up ${count || 0} expired tokens`)
    
    return { deleted: count || 0 }

  } catch (error) {
    console.error('[PASSWORD_RESET] Cleanup error:', error)
    return { deleted: 0 }
  }
}
