/**
 * Email Service - Resend Integration
 * 
 * Handles sending authentication emails (magic links, verification, etc.)
 * Uses Resend API for reliable delivery
 */

import { Resend } from 'resend'

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY)

/**
 * Email configuration
 */
const EMAIL_CONFIG = {
  from: process.env.RESEND_FROM_EMAIL || 'auth@motomind.ai',
  replyTo: 'support@motomind.ai',
}

/**
 * Send magic link email
 */
export async function sendMagicLinkEmail(params: {
  to: string
  url: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { to, url } = params

    await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to,
      subject: 'Sign in to MotoMind',
      html: generateMagicLinkHTML(url),
    })

    return { success: true }
  } catch (error) {
    console.error('[EMAIL] Magic link send failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Send verification email (for new accounts)
 */
export async function sendVerificationEmail(params: {
  to: string
  url: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { to, url } = params

    await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to,
      subject: 'Verify your MotoMind account',
      html: generateVerificationHTML(url),
    })

    return { success: true }
  } catch (error) {
    console.error('[EMAIL] Verification send failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(params: {
  to: string
  resetUrl: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { to, resetUrl } = params

    await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to,
      subject: 'Reset your MotoMind password',
      html: generatePasswordResetHTML(resetUrl),
    })

    return { success: true }
  } catch (error) {
    console.error('[EMAIL] Password reset send failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * HTML template for magic link email
 */
function generateMagicLinkHTML(url: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sign in to MotoMind</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                🏍️ MotoMind
              </h1>
              <p style="margin: 10px 0 0; color: #e0e7ff; font-size: 16px;">
                Your vehicle companion
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px; color: #1e293b; font-size: 24px; font-weight: 600;">
                Sign in to your account
              </h2>
              <p style="margin: 0 0 30px; color: #475569; font-size: 16px; line-height: 1.6;">
                Click the button below to sign in to MotoMind. This link will expire in <strong>10 minutes</strong>.
              </p>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${url}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);">
                      Sign In to MotoMind
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 30px 0 0; color: #64748b; font-size: 14px; line-height: 1.6;">
                If you didn't request this email, you can safely ignore it.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f1f5f9; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 10px; color: #64748b; font-size: 12px;">
                © 2025 MotoMind. All rights reserved.
              </p>
              <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                If you have questions, reply to this email or visit our help center.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}

/**
 * HTML template for verification email
 */
function generateVerificationHTML(url: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify your MotoMind account</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                🏍️ MotoMind
              </h1>
            </td>
          </tr>

          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px; color: #1e293b; font-size: 24px; font-weight: 600;">
                Welcome to MotoMind!
              </h2>
              <p style="margin: 0 0 30px; color: #475569; font-size: 16px; line-height: 1.6;">
                Click the button below to verify your email address and get started.
              </p>
              
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${url}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                      Verify Email Address
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="background-color: #f1f5f9; padding: 30px; text-align: center;">
              <p style="margin: 0; color: #64748b; font-size: 12px;">
                © 2025 MotoMind. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}

/**
 * HTML template for password reset email
 */
function generatePasswordResetHTML(url: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset your MotoMind password</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                🏍️ MotoMind
              </h1>
            </td>
          </tr>

          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px; color: #1e293b; font-size: 24px; font-weight: 600;">
                Reset your password
              </h2>
              <p style="margin: 0 0 30px; color: #475569; font-size: 16px; line-height: 1.6;">
                Click the button below to reset your password. This link will expire in <strong>1 hour</strong>.
              </p>
              
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${url}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 30px 0 0; color: #64748b; font-size: 14px; line-height: 1.6;">
                If you didn't request this password reset, please ignore this email or contact support if you have concerns.
              </p>
            </td>
          </tr>

          <tr>
            <td style="background-color: #f1f5f9; padding: 30px; text-align: center;">
              <p style="margin: 0; color: #64748b; font-size: 12px;">
                © 2025 MotoMind. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}
