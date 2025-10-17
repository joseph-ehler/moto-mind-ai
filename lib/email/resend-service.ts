/**
 * Resend Email Service
 * 
 * Wrapper around Resend SDK for sending transactional emails
 * Follows functional core, imperative shell pattern
 */

import { Resend } from 'resend'
import type { EmailConfig, EmailSendResult } from './types'

// Default "from" address (configured in Resend dashboard)
const DEFAULT_FROM = process.env.RESEND_FROM_EMAIL || 'MotoMind AI <noreply@send.motomind.ai>'

// Lazy initialize Resend client (only when API key is available)
let resend: Resend | null = null

function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    return null
  }
  
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY)
  }
  
  return resend
}

/**
 * Send an email via Resend
 * 
 * @param config - Email configuration
 * @returns Result with success status and message ID
 */
export async function sendEmail(config: Omit<EmailConfig, 'from'> & { from?: string }): Promise<EmailSendResult> {
  try {
    // Validate required fields
    if (!config.to) {
      return {
        success: false,
        error: 'Recipient email is required'
      }
    }

    if (!config.subject || !config.html) {
      return {
        success: false,
        error: 'Subject and HTML content are required'
      }
    }

    // Get Resend client (returns null if API key not configured)
    const client = getResendClient()
    
    if (!client) {
      console.error('[Email] RESEND_API_KEY not configured')
      
      // In development, log email instead of failing
      if (process.env.NODE_ENV === 'development') {
        console.log('[Email] Would send:', {
          from: config.from || DEFAULT_FROM,
          to: config.to,
          subject: config.subject
        })
        
        return {
          success: true,
          messageId: `dev-${Date.now()}`
        }
      }
      
      return {
        success: false,
        error: 'Email service not configured'
      }
    }

    // Send email via Resend
    const response = await client.emails.send({
      from: config.from || DEFAULT_FROM,
      to: Array.isArray(config.to) ? config.to : [config.to],
      subject: config.subject,
      html: config.html,
      text: config.text,
      replyTo: config.replyTo,
      cc: config.cc,
      bcc: config.bcc,
    })

    if (response.error) {
      console.error('[Email] Send failed:', response.error)
      return {
        success: false,
        error: response.error.message || 'Failed to send email'
      }
    }

    console.log('[Email] ✅ Sent successfully:', response.data?.id)
    
    return {
      success: true,
      messageId: response.data?.id
    }
  } catch (error) {
    console.error('[Email] Unexpected error:', error)
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Send email to multiple recipients
 * 
 * @param to - Array of recipient emails
 * @param config - Email configuration
 * @returns Array of results for each recipient
 */
export async function sendBulkEmail(
  to: string[],
  config: Omit<EmailConfig, 'to' | 'from'> & { from?: string }
): Promise<EmailSendResult[]> {
  const results = await Promise.allSettled(
    to.map(recipient => 
      sendEmail({ ...config, to: recipient })
    )
  )

  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value
    }
    
    return {
      success: false,
      error: `Failed to send to ${to[index]}: ${result.reason}`
    }
  })
}

/**
 * Test email configuration
 * Sends a test email to verify Resend is working
 * 
 * @param testEmail - Email address to send test to
 * @returns Success status
 */
export async function testEmailService(testEmail: string): Promise<EmailSendResult> {
  return sendEmail({
    to: testEmail,
    subject: '✅ MotoMind Email Service Test',
    html: `
      <h1>Email Service Working!</h1>
      <p>This is a test email from MotoMind AI.</p>
      <p>If you're seeing this, your email configuration is correct.</p>
      <hr />
      <p style="color: #666; font-size: 12px;">
        Sent via Resend at ${new Date().toISOString()}
      </p>
    `,
    text: 'Email Service Working! This is a test email from MotoMind AI.'
  })
}
