/**
 * Twilio Verify Client (SERVER ONLY)
 * 
 * Wrapper for Twilio Verify API to send verification codes
 * Uses Twilio Verify for better deliverability and fraud protection
 * This file must ONLY be imported in server-side code (API routes, server actions)
 */

import 'server-only' // Ensures this is never bundled for client

import twilio from 'twilio'
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js'

// Initialize Twilio client
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

const VERIFY_SERVICE_SID = process.env.TWILIO_VERIFY_SERVICE_SID

interface SendMagicLinkSMSParams {
  to: string              // Phone number in E.164 format (+1234567890)
  code: string            // 6-digit verification code
  expiresInMinutes?: number
}

interface SMSResult {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * Send verification code via Twilio Verify
 */
export async function sendMagicLinkSMS({
  to,
  code,
  expiresInMinutes = 15,
}: SendMagicLinkSMSParams): Promise<SMSResult> {
  try {
    // Validate phone number
    if (!isValidPhoneNumber(to)) {
      return {
        success: false,
        error: 'Invalid phone number format',
      }
    }
    
    // Format phone to E.164
    const parsedPhone = parsePhoneNumber(to)
    const formattedPhone = parsedPhone.format('E.164')
    
    // Check Verify Service configured
    if (!VERIFY_SERVICE_SID) {
      console.error('[Twilio Verify] TWILIO_VERIFY_SERVICE_SID not configured')
      return {
        success: false,
        error: 'SMS service not configured',
      }
    }
    
    // Send verification using Twilio Verify
    // Twilio generates and sends the code automatically
    const verification = await twilioClient.verify.v2
      .services(VERIFY_SERVICE_SID)
      .verifications.create({
        to: formattedPhone,
        channel: 'sms',
      })
    
    console.log('[Twilio Verify] Verification sent:', verification.sid)
    
    return {
      success: true,
      messageId: verification.sid,
    }
  } catch (err: any) {
    console.error('[Twilio Verify] Failed to send verification:', err)
    return {
      success: false,
      error: err.message || 'Failed to send SMS',
    }
  }
}

/**
 * Generate SMS message text
 */
function generateMagicLinkSMS(code: string, expiresInMinutes: number): string {
  return `Your MotoMind verification code is: ${code}

This code expires in ${expiresInMinutes} minutes.

Never share this code with anyone.`
}

/**
 * Validate and format phone number
 * Returns E.164 format or null if invalid
 */
export function validateAndFormatPhone(phone: string, defaultCountry: string = 'US'): string | null {
  try {
    if (!isValidPhoneNumber(phone, defaultCountry as any)) {
      return null
    }
    
    const parsed = parsePhoneNumber(phone, defaultCountry as any)
    return parsed.format('E.164')
  } catch (err) {
    console.error('[Phone Validation] Error:', err)
    return null
  }
}

/**
 * Format phone number for display (national format)
 * Example: +12025551234 → (202) 555-1234
 */
export function formatPhoneForDisplay(phone: string): string {
  try {
    const parsed = parsePhoneNumber(phone)
    return parsed.formatNational()
  } catch (err) {
    return phone // Return as-is if parsing fails
  }
}

/**
 * Generate 6-digit verification code
 */
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * Verify a code using Twilio Verify API
 * (Alternative to our database verification)
 */
export async function verifyTwilioCode(to: string, code: string): Promise<{ valid: boolean; error?: string }> {
  try {
    if (!VERIFY_SERVICE_SID) {
      return { valid: false, error: 'Verify service not configured' }
    }
    
    const formattedPhone = parsePhoneNumber(to).format('E.164')
    
    const verificationCheck = await twilioClient.verify.v2
      .services(VERIFY_SERVICE_SID)
      .verificationChecks.create({
        to: formattedPhone,
        code,
      })
    
    return {
      valid: verificationCheck.status === 'approved',
    }
  } catch (err: any) {
    console.error('[Twilio Verify] Verification check failed:', err)
    return {
      valid: false,
      error: err.message,
    }
  }
}
