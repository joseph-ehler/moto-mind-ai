/**
 * Session Alert Email Template
 * Notifies user of new login from unrecognized device
 */

import type { EmailTemplate, SessionAlertEmailData } from '../types'

export function generateSessionAlertEmail(data: SessionAlertEmailData): EmailTemplate {
  const { userName, deviceName, location, ipAddress, timestamp, sessionsUrl } = data

  const subject = '🔐 New sign-in to your MotoMind account'

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New sign-in detected</title>
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
                🔐 New Sign-In Detected
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 20px 40px;">
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333333;">
                Hi ${userName},
              </p>
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333333;">
                We detected a new sign-in to your MotoMind account. If this was you, you can disregard this email.
              </p>
            </td>
          </tr>

          <!-- Sign-in Details -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <div style="background-color: #f3f4f6; padding: 20px; border-radius: 4px;">
                <h2 style="margin: 0 0 16px; font-size: 16px; font-weight: 600; color: #333333;">
                  Sign-In Details:
                </h2>
                
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; font-size: 14px; color: #666666; width: 120px;">
                      <strong>Device:</strong>
                    </td>
                    <td style="padding: 8px 0; font-size: 14px; color: #333333;">
                      ${deviceName}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-size: 14px; color: #666666;">
                      <strong>Location:</strong>
                    </td>
                    <td style="padding: 8px 0; font-size: 14px; color: #333333;">
                      ${location}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-size: 14px; color: #666666;">
                      <strong>IP Address:</strong>
                    </td>
                    <td style="padding: 8px 0; font-size: 14px; color: #333333;">
                      ${ipAddress}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-size: 14px; color: #666666;">
                      <strong>Time:</strong>
                    </td>
                    <td style="padding: 8px 0; font-size: 14px; color: #333333;">
                      ${timestamp}
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- Was this you? -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <div style="background-color: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 16px; border-radius: 4px;">
                <p style="margin: 0 0 10px; font-size: 14px; font-weight: 600; color: #0c4a6e;">
                  Was this you?
                </p>
                <p style="margin: 0; font-size: 14px; color: #0c4a6e;">
                  If you recognize this activity, no action is needed.
                </p>
              </div>
            </td>
          </tr>

          <!-- Security Alert -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; border-radius: 4px;">
                <p style="margin: 0 0 10px; font-size: 14px; font-weight: 600; color: #991b1b;">
                  ⚠️ Don't recognize this activity?
                </p>
                <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #991b1b;">
                  If you didn't sign in from this device or location, your account may be compromised. Take action immediately to secure your account.
                </p>
              </div>
            </td>
          </tr>

          <!-- Button -->
          <tr>
            <td style="padding: 0 40px 30px;" align="center">
              <a href="${sessionsUrl}" style="display: inline-block; padding: 14px 32px; background-color: #ef4444; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600;">
                Review Active Sessions
              </a>
            </td>
          </tr>

          <!-- Security Tips -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <h2 style="margin: 0 0 16px; font-size: 16px; font-weight: 600; color: #333333;">
                Secure Your Account:
              </h2>
              <ul style="margin: 0; padding-left: 20px;">
                <li style="margin-bottom: 8px; font-size: 14px; color: #666666;">
                  Sign out of any unrecognized sessions
                </li>
                <li style="margin-bottom: 8px; font-size: 14px; color: #666666;">
                  Change your password immediately
                </li>
                <li style="margin-bottom: 8px; font-size: 14px; color: #666666;">
                  Enable two-factor authentication (2FA)
                </li>
                <li style="font-size: 14px; color: #666666;">
                  Review your account activity
                </li>
              </ul>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; border-top: 1px solid #e5e5e5; text-align: center;">
              <p style="margin: 0 0 10px; font-size: 12px; color: #999999;">
                This is an automated security alert from MotoMind AI
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
New Sign-In Detected

Hi ${userName},

We detected a new sign-in to your MotoMind account.

Sign-In Details:
- Device: ${deviceName}
- Location: ${location}
- IP Address: ${ipAddress}
- Time: ${timestamp}

Was this you?
If you recognize this activity, no action is needed.

Don't recognize this activity?
If you didn't sign in from this device or location, your account may be compromised.

Review Active Sessions:
${sessionsUrl}

Secure Your Account:
- Sign out of any unrecognized sessions
- Change your password immediately
- Enable two-factor authentication (2FA)
- Review your account activity

---
This is an automated security alert from MotoMind AI
For security reasons, this email cannot be replied to.
  `.trim()

  return { subject, html, text }
}
