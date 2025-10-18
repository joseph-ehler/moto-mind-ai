/**
 * Twilio SMS Client
 * 
 * Wrapper for Twilio API to send magic link SMS messages
 */

import twilio from 'twilio'
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js'

// Initialize Twilio client
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

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
 * Send magic link SMS with verification code
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
    
    // Get Twilio phone number
    const fromPhone = process.env.TWILIO_PHONE_NUMBER
    if (!fromPhone) {
      console.error('[Twilio] TWILIO_PHONE_NUMBER not configured')
      return {
        success: false,
        error: 'SMS service not configured',
      }
    }
    
    // Generate SMS message
    const message = generateMagicLinkSMS(code, expiresInMinutes)
    
    // Send SMS
    const result = await twilioClient.messages.create({
      body: message,
      from: fromPhone,
      to: formattedPhone,
    })
    
    console.log('[Twilio] SMS sent successfully:', result.sid)
    
    return {
      success: true,
      messageId: result.sid,
    }
  } catch (err: any) {
    console.error('[Twilio] Failed to send SMS:', err)
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
 * Send SMS with custom message (for other use cases)
 */
export async function sendSMS(to: string, message: string): Promise<SMSResult> {
  try {
    // Validate phone
    if (!isValidPhoneNumber(to)) {
      return {
        success: false,
        error: 'Invalid phone number',
      }
    }
    
    const formattedPhone = parsePhoneNumber(to).format('E.164')
    const fromPhone = process.env.TWILIO_PHONE_NUMBER
    
    if (!fromPhone) {
      return {
        success: false,
        error: 'SMS service not configured',
      }
    }
    
    const result = await twilioClient.messages.create({
      body: message,
      from: fromPhone,
      to: formattedPhone,
    })
    
    return {
      success: true,
      messageId: result.sid,
    }
  } catch (err: any) {
    console.error('[Twilio] Send SMS exception:', err)
    return {
      success: false,
      error: err.message,
    }
  }
}

/**
 * Check Twilio account balance (for monitoring)
 * TODO: Fix Twilio SDK types in future
 */
export async function getTwilioBalance(): Promise<{ balance: string } | null> {
  try {
    // Note: Twilio balance API has complex types, simplified for MVP
    console.log('[Twilio] Balance check not fully implemented')
    return null
  } catch (err) {
    console.error('[Twilio] Failed to fetch balance:', err)
    return null
  }
}
