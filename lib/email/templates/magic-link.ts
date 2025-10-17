/**
 * Magic Link Email Template
 */

import type { EmailTemplate, MagicLinkEmailData } from '../types'

export function generateMagicLinkEmail(data: MagicLinkEmailData): EmailTemplate {
  const { userName, magicLink, expiresIn, ipAddress, location } = data

  const subject = 'Your MotoMind sign-in link'

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sign in to MotoMind</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #000000;">
                🔑 Sign in to MotoMind
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 20px 40px;">
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333333;">
                Hi ${userName || 'there'},
              </p>
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333333;">
                Click the button below to sign in to your MotoMind account. This link is unique to you and will sign you in securely without a password.
              </p>
            </td>
          </tr>

          <!-- Button -->
          <tr>
            <td style="padding: 0 40px 30px;" align="center">
              <a href="${magicLink}" style="display: inline-block; padding: 14px 32px; background-color: #000000; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600;">
                Sign In to MotoMind
              </a>
            </td>
          </tr>

          <!-- Expiry Notice -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 4px;">
                <p style="margin: 0; font-size: 14px; color: #92400e;">
                  ⚠️ This link will expire in <strong>${expiresIn}</strong>.
                </p>
              </div>
            </td>
          </tr>

          <!-- Request Details -->
          ${ipAddress || location ? `
          <tr>
            <td style="padding: 0 40px 30px;">
              <div style="background-color: #f3f4f6; padding: 16px; border-radius: 4px;">
                <p style="margin: 0 0 10px; font-size: 14px; font-weight: 600; color: #333333;">
                  Request Details:
                </p>
                ${ipAddress ? `
                <p style="margin: 0 0 5px; font-size: 14px; color: #666666;">
                  IP Address: <strong>${ipAddress}</strong>
                </p>
                ` : ''}
                ${location ? `
                <p style="margin: 0; font-size: 14px; color: #666666;">
                  Location: <strong>${location}</strong>
                </p>
                ` : ''}
              </div>
            </td>
          </tr>
          ` : ''}

          <!-- Alternative Link -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <p style="margin: 0 0 10px; font-size: 14px; color: #666666;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="margin: 0; font-size: 14px; color: #0066cc; word-break: break-all;">
                <a href="${magicLink}" style="color: #0066cc; text-decoration: none;">
                  ${magicLink}
                </a>
              </p>
            </td>
          </tr>

          <!-- Security Notice -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #666666;">
                <strong>Didn't request this?</strong><br>
                If you didn't request this sign-in link, you can safely ignore this email. Someone may have entered your email address by mistake.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; border-top: 1px solid #e5e5e5; text-align: center;">
              <p style="margin: 0 0 10px; font-size: 12px; color: #999999;">
                This email was sent by MotoMind AI
              </p>
              <p style="margin: 0; font-size: 12px; color: #999999;">
                For security reasons, this email cannot be replied to.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `

  const text = `
Sign in to MotoMind

Hi ${userName || 'there'},

Click the link below to sign in to your MotoMind account:
${magicLink}

This link will expire in ${expiresIn}.

${ipAddress || location ? `
Request Details:
${ipAddress ? `IP Address: ${ipAddress}` : ''}
${location ? `Location: ${location}` : ''}
` : ''}

Didn't request this?
If you didn't request this sign-in link, you can safely ignore this email.

---
This email was sent by MotoMind AI
For security reasons, this email cannot be replied to.
  `.trim()

  return { subject, html, text }
}
