/**
 * Password Reset Service
 * 
 * Handles password reset flow:
 * 1. Request reset → Generate token → Send email
 * 2. Verify token → Update password
 * 
 * @module lib/auth/services/password-reset
 */

import { createVerificationToken, verifyAndConsumeToken } from './token-service'
import { sendPasswordResetEmail } from './email-service'
import { hashPassword } from './password-service'
import { getSupabaseClient } from '@/lib/supabase/client'

const supabase = getSupabaseClient()

interface ResetResult {
  success: boolean
  error?: string
}

/**
 * Request a password reset
 * 
 * @param email - User's email address
 * @returns Success or error
 */
export async function requestPasswordReset(email: string): Promise<ResetResult> {
  try {
    // Check if user exists
    const { data: userData, error: userError } = await supabase
      .from('user_tenants')
      .select('user_id')
      .eq('user_id', email)
      .single()

    if (userError || !userData) {
      // Don't reveal if user exists (security)
      console.log(`[Reset] User not found: ${email}`)
      return { success: true } // Pretend it worked
    }

    // Check if user has credentials (password-based login)
    const { data: credData, error: credError } = await supabase
      .from('credentials')
      .select('id')
      .eq('user_id', email)
      .single()

    if (credError || !credData) {
      // User exists but uses OAuth only (no password)
      console.log(`[Reset] User has no password: ${email}`)
      return { success: true } // Pretend it worked (security)
    }

    // Generate reset token (expires in 60 minutes)
    const tokenResult = await createVerificationToken(email, 60)

    if (!tokenResult.success || !tokenResult.token) {
      console.error('[Reset] Token creation failed')
      return { success: false, error: 'Failed to generate reset token' }
    }

    // Send reset email
    const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password/${tokenResult.token}`
    const emailResult = await sendPasswordResetEmail({ to: email, resetUrl })

    if (!emailResult.success) {
      console.error('[Reset] Email send failed')
      return { success: false, error: 'Failed to send reset email' }
    }

    console.log(`[Reset] Email sent to ${email}`)
    return { success: true }

  } catch (error) {
    console.error('[Reset] Request error:', error)
    return { success: false, error: 'Password reset request failed' }
  }
}

/**
 * Reset password using token
 * 
 * @param token - Reset token from email
 * @param newPassword - New password
 * @returns Success or error
 */
export async function resetPassword(
  token: string,
  newPassword: string
): Promise<ResetResult> {
  try {
    // Verify and consume token
    const verifyResult = await verifyAndConsumeToken(token)

    if (!verifyResult.success || !verifyResult.identifier) {
      console.error('[Reset] Invalid token')
      return { success: false, error: verifyResult.error || 'Invalid reset token' }
    }

    const email = verifyResult.identifier

    // Hash new password
    const passwordHash = await hashPassword(newPassword)

    // Update password in credentials table
    const { error } = await supabase
      .from('credentials')
      .update({
        password_hash: passwordHash,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', email)

    if (error) {
      console.error('[Reset] Password update failed:', error)
      return { success: false, error: 'Failed to update password' }
    }

    console.log(`[Reset] Password updated for ${email}`)
    return { success: true }

  } catch (error) {
    console.error('[Reset] Reset error:', error)
    return { success: false, error: 'Password reset failed' }
  }
}

/**
 * Verify reset token is valid (without consuming it)
 * 
 * @param token - Reset token to check
 * @returns User email if valid, error otherwise
 */
export async function verifyResetToken(token: string): Promise<ResetResult & { email?: string }> {
  try {
    const { data, error } = await supabase
      .from('verification_tokens')
      .select('identifier, expires')
      .eq('token', token)
      .single()

    if (error || !data) {
      return { success: false, error: 'Invalid reset token' }
    }

    if (new Date(data.expires) < new Date()) {
      return { success: false, error: 'Reset token has expired' }
    }

    return { success: true, email: data.identifier }

  } catch (error) {
    console.error('[Reset] Verify token error:', error)
    return { success: false, error: 'Token verification failed' }
  }
}
