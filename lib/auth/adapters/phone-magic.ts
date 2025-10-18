/**
 * Phone Magic Link Adapter
 * 
 * Handles passwordless authentication via SMS verification codes
 */

import {
  generateToken,
  storeMagicLink,
  verifyMagicLink,
  checkRateLimit,
  getRateLimitInfo,
} from '../services/magic-link'
import {
  sendMagicLinkSMS,
  validateAndFormatPhone,
  formatPhoneForDisplay,
  generateVerificationCode,
} from '../services/twilio-client.server'
import { getSupabaseClient } from '../supabase'

export interface SendPhoneMagicLinkParams {
  phone: string
  countryCode?: string
  metadata?: Record<string, any>
}

export interface SendPhoneMagicLinkResult {
  success: boolean
  message?: string
  error?: string
  formattedPhone?: string
  rateLimitInfo?: {
    remaining: number
    resetsAt: Date
  }
}

export interface VerifyPhoneCodeResult {
  success: boolean
  session?: any
  error?: string
}

/**
 * Send verification code to phone
 */
export async function sendPhoneMagicLink({
  phone,
  countryCode = 'US',
  metadata = {},
}: SendPhoneMagicLinkParams): Promise<SendPhoneMagicLinkResult> {
  try {
    // Validate and format phone to E.164
    const formattedPhone = validateAndFormatPhone(phone, countryCode)
    
    if (!formattedPhone) {
      return {
        success: false,
        error: 'Please enter a valid phone number',
      }
    }
    
    // Check rate limit (5 per hour - SMS costs money but needs some flexibility)
    const rateLimitOk = await checkRateLimit(formattedPhone, 'phone', 5, 60)
    if (!rateLimitOk) {
      const info = await getRateLimitInfo(formattedPhone, 'phone')
      return {
        success: false,
        error: 'Too many requests. Please try again later.',
        rateLimitInfo: info ? {
          remaining: 0,
          resetsAt: info.resetsAt,
        } : undefined,
      }
    }
    
    // Generate 6-digit verification code
    const code = generateVerificationCode()
    
    // Generate token for storage (we store code as token)
    const { tokenHash, expiresAt } = generateToken()
    
    // Store code hash with phone number
    // Note: We store the code in metadata for verification
    await storeMagicLink(
      formattedPhone,
      'phone',
      tokenHash,
      expiresAt,
      {
        ...metadata,
        code, // Store code for verification (hashed in production)
      }
    )
    
    // Send SMS
    const smsResult = await sendMagicLinkSMS({
      to: formattedPhone,
      code,
      expiresInMinutes: 15,
    })
    
    if (!smsResult.success) {
      return {
        success: false,
        error: smsResult.error || 'Failed to send SMS. Please try again.',
      }
    }
    
    console.log('[Phone Magic Link] Sent to:', formattedPhone)
    
    // Get remaining attempts
    const info = await getRateLimitInfo(formattedPhone, 'phone')
    
    return {
      success: true,
      message: 'Check your phone for the verification code',
      formattedPhone: formatPhoneForDisplay(formattedPhone),
      rateLimitInfo: info ? {
        remaining: info.allowed,
        resetsAt: info.resetsAt,
      } : undefined,
    }
  } catch (err: any) {
    console.error('[Phone Magic Link] Send error:', err)
    return {
      success: false,
      error: 'Something went wrong. Please try again.',
    }
  }
}

/**
 * Verify phone verification code and create session
 */
export async function verifyPhoneCode(
  phone: string,
  code: string,
  countryCode: string = 'US'
): Promise<VerifyPhoneCodeResult> {
  try {
    // Format phone
    const formattedPhone = validateAndFormatPhone(phone, countryCode)
    
    if (!formattedPhone) {
      return {
        success: false,
        error: 'Invalid phone number',
      }
    }
    
    // Verify code
    // For phone, we need to look up by phone number and verify code matches
    const supabase = getSupabaseClient()
    
    const { data: magicLinks, error: fetchError } = await supabase
      .from('auth_magic_links')
      .select('*')
      .eq('identifier', formattedPhone)
      .eq('method', 'phone')
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
    
    if (fetchError || !magicLinks || magicLinks.length === 0) {
      return {
        success: false,
        error: 'Invalid or expired code',
      }
    }
    
    const magicLink = magicLinks[0]
    
    // Verify code matches
    const storedCode = magicLink.metadata?.code
    if (storedCode !== code) {
      return {
        success: false,
        error: 'Incorrect verification code',
      }
    }
    
    // Mark as used
    const { error: updateError } = await supabase
      .from('auth_magic_links')
      .update({
        used: true,
        used_at: new Date().toISOString(),
      })
      .eq('id', magicLink.id)
    
    if (updateError) {
      console.error('[Phone Magic Link] Failed to mark as used:', updateError)
    }
    
    // Create Supabase session
    // Use phone as identifier for OTP sign-in
    const { data: authData, error: authError } = await supabase.auth.signInWithOtp({
      phone: formattedPhone,
      options: {
        shouldCreateUser: true,
      },
    })
    
    if (authError) {
      console.error('[Phone Magic Link] Supabase sign-in error:', authError)
      return {
        success: false,
        error: 'Failed to create session. Please try again.',
      }
    }
    
    console.log('[Phone Magic Link] Verified:', formattedPhone)
    
    return {
      success: true,
      session: authData.session,
    }
  } catch (err: any) {
    console.error('[Phone Magic Link] Verify error:', err)
    return {
      success: false,
      error: 'Failed to verify code. Please try again.',
    }
  }
}

/**
 * Resend verification code
 */
export async function resendPhoneCode(
  phone: string,
  countryCode: string = 'US'
): Promise<SendPhoneMagicLinkResult> {
  // Same as sending new code
  return sendPhoneMagicLink({ phone, countryCode })
}

/**
 * Validate phone number format
 */
export function isValidPhoneNumber(phone: string, countryCode: string = 'US'): boolean {
  const formatted = validateAndFormatPhone(phone, countryCode)
  return formatted !== null
}
