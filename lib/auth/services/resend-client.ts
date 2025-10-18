/**
 * Resend Email Client
 * 
 * Wrapper for Resend API to send magic link emails
 */

import { Resend } from 'resend'

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY)

interface SendMagicLinkEmailParams {
  to: string
  magicLink: string
  expiresInMinutes?: number
}

interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * Send magic link email
 */
export async function sendMagicLinkEmail({
  to,
  magicLink,
  expiresInMinutes = 15,
}: SendMagicLinkEmailParams): Promise<EmailResult> {
  try {
    // Validate email format
    if (!isValidEmail(to)) {
      return {
        success: false,
        error: 'Invalid email address',
      }
    }
    
    // Get from email (with fallback)
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'auth@resend.dev'
    
    // Send email
    const { data, error } = await resend.emails.send({
      from: `MotoMind <${fromEmail}>`,
      to,
      subject: 'Sign in to MotoMind 🏍️',
      html: generateMagicLinkEmailHTML(magicLink, expiresInMinutes),
      text: generateMagicLinkEmailText(magicLink, expiresInMinutes),
    })
    
    if (error) {
      console.error('[Resend] Failed to send email:', error)
      return {
        success: false,
        error: error.message || 'Failed to send email',
      }
    }
    
    console.log('[Resend] Email sent successfully:', data?.id)
    
    return {
      success: true,
      messageId: data?.id,
    }
  } catch (err: any) {
    console.error('[Resend] Exception:', err)
    return {
      success: false,
      error: err.message || 'Failed to send email',
    }
  }
}

/**
 * Generate HTML email content
 * TODO: Replace with React Email template (Phase 5)
 */
function generateMagicLinkEmailHTML(magicLink: string, expiresInMinutes: number): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sign in to MotoMind</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .container {
      background: #ffffff;
      border-radius: 12px;
      padding: 40px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    .logo {
      text-align: center;
      margin-bottom: 30px;
    }
    .logo-text {
      font-size: 32px;
      font-weight: bold;
      color: #3B82F6;
    }
    h1 {
      color: #1F2937;
      font-size: 24px;
      margin-bottom: 16px;
    }
    p {
      color: #6B7280;
      margin-bottom: 24px;
    }
    .button {
      display: inline-block;
      background: #3B82F6;
      color: #ffffff !important;
      text-decoration: none;
      padding: 16px 32px;
      border-radius: 8px;
      font-weight: 600;
      text-align: center;
      margin: 20px 0;
    }
    .button:hover {
      background: #2563EB;
    }
    .link {
      word-break: break-all;
      color: #3B82F6;
      font-size: 14px;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #E5E7EB;
      text-align: center;
      color: #9CA3AF;
      font-size: 14px;
    }
    .security-note {
      background: #FEF3C7;
      border-left: 4px solid #F59E0B;
      padding: 16px;
      margin: 24px 0;
      border-radius: 4px;
    }
    .security-note p {
      color: #92400E;
      margin: 0;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">
      <span class="logo-text">🏍️ MotoMind</span>
    </div>
    
    <h1>Sign in to your account</h1>
    
    <p>
      Click the button below to securely sign in to MotoMind. 
      This link will expire in <strong>${expiresInMinutes} minutes</strong>.
    </p>
    
    <div style="text-align: center;">
      <a href="${magicLink}" class="button">
        Sign In Now
      </a>
    </div>
    
    <p style="font-size: 14px; color: #6B7280;">
      Or copy and paste this link into your browser:
    </p>
    <p class="link">${magicLink}</p>
    
    <div class="security-note">
      <p>
        <strong>🔒 Security tip:</strong> Never share this link with anyone. 
        MotoMind will never ask you for this link.
      </p>
    </div>
    
    <div class="footer">
      <p>
        You received this email because someone requested a sign-in link for your MotoMind account.
        If you didn't request this, you can safely ignore this email.
      </p>
      <p>
        © ${new Date().getFullYear()} MotoMind. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim()
}

/**
 * Generate plain text email content (fallback)
 */
function generateMagicLinkEmailText(magicLink: string, expiresInMinutes: number): string {
  return `
Sign in to MotoMind

Click the link below to securely sign in to your MotoMind account.
This link will expire in ${expiresInMinutes} minutes.

${magicLink}

Security tip: Never share this link with anyone. MotoMind will never ask you for this link.

You received this email because someone requested a sign-in link for your MotoMind account.
If you didn't request this, you can safely ignore this email.

© ${new Date().getFullYear()} MotoMind. All rights reserved.
  `.trim()
}

/**
 * Basic email validation
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Send welcome email (optional, for first-time users)
 */
export async function sendWelcomeEmail(to: string): Promise<EmailResult> {
  try {
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'auth@resend.dev'
    
    const { data, error } = await resend.emails.send({
      from: `MotoMind <${fromEmail}>`,
      to,
      subject: 'Welcome to MotoMind! 🎉',
      html: `
        <h1>Welcome to MotoMind!</h1>
        <p>Thanks for joining us. We're excited to have you on board.</p>
        <p>Get started by adding your first vehicle and tracking your rides.</p>
        <p>Need help? Check out our <a href="${process.env.NEXT_PUBLIC_APP_URL}/help">help center</a>.</p>
      `,
      text: 'Welcome to MotoMind! Thanks for joining us.',
    })
    
    if (error) {
      console.error('[Resend] Failed to send welcome email:', error)
      return { success: false, error: error.message }
    }
    
    return { success: true, messageId: data?.id }
  } catch (err: any) {
    console.error('[Resend] Welcome email exception:', err)
    return { success: false, error: err.message }
  }
}
