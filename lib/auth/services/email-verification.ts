/**
 * Email Verification Service
 * 
 * Handles email verification for new user accounts
 * - Sends verification email with token
 * - Verifies email via token
 * - Marks user as verified
 */

import { createVerificationToken, verifyAndConsumeToken } from './token-service'
import { sendVerificationEmail } from './email-service'
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

interface VerificationResult {
  success: boolean
  error?: string
}

/**
 * Send verification email to user
 * 
 * @param email - User's email address
 * @returns Success or error
 */
export async function sendEmailVerification(email: string): Promise<VerificationResult> {
  try {
    // Generate verification token (expires in 24 hours)
    const tokenResult = await createVerificationToken(email, 24 * 60)

    if (!tokenResult.success || !tokenResult.token) {
      console.error('[Verification] Token creation failed')
      return { success: false, error: 'Failed to generate verification token' }
    }

    // Send verification email
    const verificationUrl = `${process.env.NEXTAUTH_URL}/auth/verify-email/${tokenResult.token}`
    const emailResult = await sendVerificationEmail({ 
      to: email, 
      url: verificationUrl 
    })

    if (!emailResult.success) {
      console.error('[Verification] Email send failed')
      return { success: false, error: 'Failed to send verification email' }
    }

    console.log(`[Verification] Email sent to ${email}`)
    return { success: true }

  } catch (error) {
    console.error('[Verification] Send error:', error)
    return { success: false, error: 'Email verification send failed' }
  }
}

/**
 * Verify email using token
 * 
 * @param token - Verification token from email
 * @returns Success or error with email
 */
export async function verifyEmail(token: string): Promise<VerificationResult & { email?: string }> {
  try {
    // Verify and consume token
    const verifyResult = await verifyAndConsumeToken(token)

    if (!verifyResult.success || !verifyResult.identifier) {
      console.error('[Verification] Invalid token')
      return { 
        success: false, 
        error: verifyResult.error || 'Invalid or expired verification link' 
      }
    }

    const email = verifyResult.identifier

    // Mark user as verified in database
    const { error: updateError } = await supabase
      .from('user_tenants')
      .update({ email_verified: true })
      .eq('user_id', email)

    if (updateError) {
      console.error('[Verification] Database update failed:', updateError)
      return { success: false, error: 'Failed to verify email' }
    }

    console.log(`[Verification] Email verified: ${email}`)
    return { success: true, email }

  } catch (error) {
    console.error('[Verification] Verify error:', error)
    return { success: false, error: 'Email verification failed' }
  }
}

/**
 * Check if user's email is verified
 * 
 * @param email - User's email address
 * @returns true if verified, false otherwise
 */
export async function isEmailVerified(email: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('user_tenants')
      .select('email_verified')
      .eq('user_id', email)
      .single()

    if (error || !data) return false

    return data.email_verified === true

  } catch (error) {
    console.error('[Verification] Check error:', error)
    return false
  }
}

/**
 * Resend verification email
 * 
 * @param email - User's email address
 * @returns Success or error
 */
export async function resendVerificationEmail(email: string): Promise<VerificationResult> {
  try {
    // Check if already verified
    const isVerified = await isEmailVerified(email)
    if (isVerified) {
      return { success: false, error: 'Email is already verified' }
    }

    // Send new verification email
    return await sendEmailVerification(email)

  } catch (error) {
    console.error('[Verification] Resend error:', error)
    return { success: false, error: 'Failed to resend verification email' }
  }
}
