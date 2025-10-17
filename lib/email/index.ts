/**
 * Email Service
 * 
 * Main entry point for sending transactional emails
 * Provides high-level functions for common email types
 */

import { sendEmail } from './resend-service'
import {
  generatePasswordResetEmail,
  generateMagicLinkEmail,
  generateWelcomeEmail,
  generateEmailVerificationEmail,
  generateSessionAlertEmail
} from './templates'
import type {
  EmailSendResult,
  PasswordResetEmailData,
  MagicLinkEmailData,
  WelcomeEmailData,
  EmailVerificationData,
  SessionAlertEmailData
} from './types'

/**
 * Send password reset email
 * 
 * @param to - Recipient email address
 * @param data - Password reset data
 * @returns Send result
 */
export async function sendPasswordResetEmail(
  to: string,
  data: PasswordResetEmailData
): Promise<EmailSendResult> {
  const template = generatePasswordResetEmail(data)
  
  return sendEmail({
    to,
    subject: template.subject,
    html: template.html,
    text: template.text
  })
}

/**
 * Send magic link email
 * 
 * @param to - Recipient email address
 * @param data - Magic link data
 * @returns Send result
 */
export async function sendMagicLinkEmail(
  to: string,
  data: MagicLinkEmailData
): Promise<EmailSendResult> {
  const template = generateMagicLinkEmail(data)
  
  return sendEmail({
    to,
    subject: template.subject,
    html: template.html,
    text: template.text
  })
}

/**
 * Send welcome email
 * 
 * @param to - Recipient email address
 * @param data - Welcome email data
 * @returns Send result
 */
export async function sendWelcomeEmail(
  to: string,
  data: WelcomeEmailData
): Promise<EmailSendResult> {
  const template = generateWelcomeEmail(data)
  
  return sendEmail({
    to,
    subject: template.subject,
    html: template.html,
    text: template.text
  })
}

/**
 * Send email verification email
 * 
 * @param to - Recipient email address
 * @param data - Email verification data
 * @returns Send result
 */
export async function sendEmailVerificationEmail(
  to: string,
  data: EmailVerificationData
): Promise<EmailSendResult> {
  const template = generateEmailVerificationEmail(data)
  
  return sendEmail({
    to,
    subject: template.subject,
    html: template.html,
    text: template.text
  })
}

/**
 * Send session alert email
 * 
 * @param to - Recipient email address
 * @param data - Session alert data
 * @returns Send result
 */
export async function sendSessionAlertEmail(
  to: string,
  data: SessionAlertEmailData
): Promise<EmailSendResult> {
  const template = generateSessionAlertEmail(data)
  
  return sendEmail({
    to,
    subject: template.subject,
    html: template.html,
    text: template.text
  })
}

// Re-export types and core functions
export type {
  EmailConfig,
  EmailTemplate,
  EmailSendResult,
  EmailType,
  PasswordResetEmailData,
  MagicLinkEmailData,
  WelcomeEmailData,
  EmailVerificationData,
  SessionAlertEmailData
} from './types'

export { sendEmail, sendBulkEmail, testEmailService } from './resend-service'

export {
  generatePasswordResetEmail,
  generateMagicLinkEmail,
  generateWelcomeEmail,
  generateEmailVerificationEmail,
  generateSessionAlertEmail
} from './templates'
