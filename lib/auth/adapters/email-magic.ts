/**
 * Email Magic Link Adapter
 * 
 * Handles passwordless authentication via email magic links
 */

import { 
  generateToken,
  storeMagicLink,
  verifyMagicLink,
  checkRateLimit,
  generateMagicLinkUrl,
  getRateLimitInfo,
} from '../services/magic-link'
import { sendMagicLinkEmail } from '../services/resend-client'
import { isValidEmail } from '../utils/email-utils'
import { getSupabaseClient } from '../supabase'

export interface SendEmailMagicLinkParams {
  email: string
  callbackPath?: string
  metadata?: Record<string, any>
}

export interface SendEmailMagicLinkResult {
  success: boolean
  message?: string
  error?: string
  rateLimitInfo?: {
    remaining: number
    resetsAt: Date
  }
}

export interface VerifyEmailMagicLinkResult {
  success: boolean
  redirectUrl?: string
  error?: string
}

/**
 * Send magic link to email
 */
export async function sendEmailMagicLink({
  email,
  callbackPath = '/auth/verify',
  metadata = {},
}: SendEmailMagicLinkParams): Promise<SendEmailMagicLinkResult> {
  try {
    // Normalize email
    const normalizedEmail = email.toLowerCase().trim()
    
    // Validate email format
    if (!isValidEmail(normalizedEmail)) {
      return {
        success: false,
        error: 'Please enter a valid email address',
      }
    }
    
    // Check rate limit (10 per hour - email is cheap and users may typo)
    const allowed = await checkRateLimit(normalizedEmail, 'email', 10, 60)
    if (!allowed) {
      const info = await getRateLimitInfo(normalizedEmail, 'email')
      return {
        success: false,
        error: 'Too many requests. Please try again later.',
        rateLimitInfo: info ? {
          remaining: 0,
          resetsAt: info.resetsAt,
        } : undefined,
      }
    }
    
    // Generate token
    const { token, tokenHash, expiresAt } = generateToken()
    
    // Store in database
    await storeMagicLink(normalizedEmail, 'email', tokenHash, expiresAt, metadata)
    
    // Generate magic link URL
    const magicLink = generateMagicLinkUrl(token, callbackPath)
    
    // Send email
    const emailResult = await sendMagicLinkEmail({
      to: normalizedEmail,
      magicLink,
      expiresInMinutes: 15,
    })
    
    if (!emailResult.success) {
      return {
        success: false,
        error: emailResult.error || 'Failed to send email. Please try again.',
      }
    }
    
    console.log('[Email Magic Link] Sent to:', normalizedEmail)
    
    // Get remaining attempts
    const info = await getRateLimitInfo(normalizedEmail, 'email')
    
    return {
      success: true,
      message: 'Check your email for the sign-in link',
      rateLimitInfo: info ? {
        remaining: info.allowed,
        resetsAt: info.resetsAt,
      } : undefined,
    }
  } catch (err: any) {
    console.error('[Email Magic Link] Send error:', err)
    return {
      success: false,
      error: 'Something went wrong. Please try again.',
    }
  }
}

/**
 * Verify magic link token and create session
 */
export async function verifyEmailMagicLink(token: string): Promise<VerifyEmailMagicLinkResult> {
  try {
    // Verify token
    const verifyResult = await verifyMagicLink(token)
    
    if (!verifyResult.success || !verifyResult.identifier) {
      return {
        success: false,
        error: verifyResult.error || 'Invalid magic link',
      }
    }
    
    // Create Supabase client with service role for admin operations
    const { createClient } = await import('@supabase/supabase-js')
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
    
    // Create or get user via admin API
    const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: verifyResult.identifier,
      email_confirm: true,
    })
    
    if (createError) {
      // User might already exist, that's okay
      console.log('[Email Magic Link] User may already exist:', createError.message)
    }
    
    // Generate a magic link that will sign the user in
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: verifyResult.identifier,
    })
    
    if (linkError || !linkData) {
      console.error('[Email Magic Link] Failed to generate link:', linkError)
      return {
        success: false,
        error: 'Failed to create session. Please try again.',
      }
    }
    
    console.log('[Email Magic Link] Session link created for:', verifyResult.identifier)
    
    // Return the action link URL which will establish the session
    return {
      success: true,
      redirectUrl: linkData.properties.action_link,
    }
  } catch (err: any) {
    console.error('[Email Magic Link] Verify error:', err)
    return {
      success: false,
      error: 'Failed to verify magic link. Please try again.',
    }
  }
}

// Email utility functions moved to utils/email-utils.ts for client-safe imports
