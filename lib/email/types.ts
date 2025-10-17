/**
 * Email Service Types
 * 
 * Type definitions for email sending, templates, and configurations
 */

export interface EmailConfig {
  from: string
  to: string | string[]
  subject: string
  html: string
  text?: string
  replyTo?: string
  cc?: string[]
  bcc?: string[]
}

export interface EmailTemplate {
  subject: string
  html: string
  text: string
}

export interface PasswordResetEmailData {
  userName: string
  resetUrl: string
  expiresIn: string
}

export interface MagicLinkEmailData {
  userName: string
  magicLink: string
  expiresIn: string
  ipAddress?: string
  location?: string
}

export interface WelcomeEmailData {
  userName: string
  email: string
  dashboardUrl: string
}

export interface EmailVerificationData {
  userName: string
  verificationUrl: string
  expiresIn: string
}

export interface SessionAlertEmailData {
  userName: string
  deviceName: string
  location: string
  ipAddress: string
  timestamp: string
  sessionsUrl: string
}

export interface EmailSendResult {
  success: boolean
  messageId?: string
  error?: string
}

export type EmailType = 
  | 'password-reset'
  | 'magic-link'
  | 'welcome'
  | 'email-verification'
  | 'session-alert'
