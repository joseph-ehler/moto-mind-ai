/**
 * Welcome Email Template
 */

import type { EmailTemplate, WelcomeEmailData } from '../types'

export function generateWelcomeEmail(data: WelcomeEmailData): EmailTemplate {
  const { userName, email, dashboardUrl } = data

  const subject = '🎉 Welcome to MotoMind AI!'

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to MotoMind</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <h1 style="margin: 0 0 10px; font-size: 32px; font-weight: 600; color: #000000;">
                🎉 Welcome to MotoMind!
              </h1>
              <p style="margin: 0; font-size: 16px; color: #666666;">
                Your vehicle management just got smarter
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 20px 40px;">
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333333;">
                Hi ${userName || 'there'},
              </p>
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333333;">
                Welcome to <strong>MotoMind AI</strong> – your intelligent vehicle management platform!
              </p>
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333333;">
                We're excited to have you on board. Your account (<strong>${email}</strong>) is now active and ready to use.
              </p>
            </td>
          </tr>

          <!-- Button -->
          <tr>
            <td style="padding: 0 40px 30px;" align="center">
              <a href="${dashboardUrl}" style="display: inline-block; padding: 14px 32px; background-color: #000000; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600;">
                Go to Dashboard
              </a>
            </td>
          </tr>

          <!-- Features -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <h2 style="margin: 0 0 20px; font-size: 20px; font-weight: 600; color: #000000;">
                What you can do with MotoMind:
              </h2>
              
              <div style="margin-bottom: 16px;">
                <h3 style="margin: 0 0 8px; font-size: 16px; font-weight: 600; color: #333333;">
                  🚗 Track Your Vehicles
                </h3>
                <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #666666;">
                  Add and manage your vehicles with detailed maintenance records and history.
                </p>
              </div>

              <div style="margin-bottom: 16px;">
                <h3 style="margin: 0 0 8px; font-size: 16px; font-weight: 600; color: #333333;">
                  📍 GPS Tracking
                </h3>
                <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #666666;">
                  Real-time location tracking with automatic trip recording.
                </p>
              </div>

              <div style="margin-bottom: 16px;">
                <h3 style="margin: 0 0 8px; font-size: 16px; font-weight: 600; color: #333333;">
                  🔔 Smart Alerts
                </h3>
                <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #666666;">
                  Get notified about maintenance schedules, insurance renewals, and more.
                </p>
              </div>

              <div>
                <h3 style="margin: 0 0 8px; font-size: 16px; font-weight: 600; color: #333333;">
                  🛡️ Secure & Private
                </h3>
                <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #666666;">
                  Your data is encrypted and protected with enterprise-grade security.
                </p>
              </div>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <div style="background-color: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 16px; border-radius: 4px;">
                <p style="margin: 0 0 10px; font-size: 14px; font-weight: 600; color: #0c4a6e;">
                  Ready to get started?
                </p>
                <p style="margin: 0; font-size: 14px; color: #0c4a6e;">
                  Head to your dashboard and add your first vehicle!
                </p>
              </div>
            </td>
          </tr>

          <!-- Support -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #666666;">
                Need help? Check out our <a href="${dashboardUrl}/docs" style="color: #0066cc; text-decoration: none;">documentation</a> or reach out to our support team anytime.
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
                © 2025 MotoMind AI. All rights reserved.
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
Welcome to MotoMind AI!

Hi ${userName || 'there'},

Welcome to MotoMind AI – your intelligent vehicle management platform!

We're excited to have you on board. Your account (${email}) is now active and ready to use.

What you can do with MotoMind:

🚗 Track Your Vehicles
Add and manage your vehicles with detailed maintenance records and history.

📍 GPS Tracking
Real-time location tracking with automatic trip recording.

🔔 Smart Alerts
Get notified about maintenance schedules, insurance renewals, and more.

🛡️ Secure & Private
Your data is encrypted and protected with enterprise-grade security.

Get Started:
${dashboardUrl}

Need help? Check out our documentation or reach out to our support team anytime.

---
This email was sent by MotoMind AI
© 2025 MotoMind AI. All rights reserved.
  `.trim()

  return { subject, html, text }
}
