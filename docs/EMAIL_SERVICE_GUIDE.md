# 📧 Email Service Guide

Complete guide for MotoMind's transactional email system powered by Resend.

---

## 🎯 Quick Start

### 1. Add API Key to `.env.local`

```bash
RESEND_API_KEY=re_your_resend_api_key_here
RESEND_FROM_EMAIL=noreply@send.motomind.ai
```

### 2. Test the Service

**Option A: Use Test Endpoint** (Development only)
```bash
curl -X POST http://localhost:3005/api/email/test \
  -H "Content-Type: application/json" \
  -d '{"email": "your@email.com"}'
```

**Option B: Use in Code**
```typescript
import { testEmailService } from '@/lib/email'

const result = await testEmailService('your@email.com')
console.log(result) // { success: true, messageId: "..." }
```

---

## 📬 Available Email Templates

### 1. Password Reset

```typescript
import { sendPasswordResetEmail } from '@/lib/email'

await sendPasswordResetEmail('user@example.com', {
  userName: 'John Doe',
  resetUrl: 'https://motomind.ai/auth/reset-password?token=abc123',
  expiresIn: '1 hour'
})
```

**Features:**
- ✅ Prominent reset button
- ✅ Expiry warning (yellow alert box)
- ✅ Alternative copy-paste link
- ✅ Security notice for non-requesters
- ✅ Mobile-responsive

---

### 2. Magic Link (Passwordless Sign-In)

```typescript
import { sendMagicLinkEmail } from '@/lib/email'

await sendMagicLinkEmail('user@example.com', {
  userName: 'John Doe',
  magicLink: 'https://motomind.ai/auth/magic?token=xyz789',
  expiresIn: '15 minutes',
  ipAddress: '192.168.1.1',      // Optional
  location: 'San Francisco, CA'  // Optional
})
```

**Features:**
- ✅ One-click sign-in
- ✅ Shows request details (IP, location)
- ✅ Expiry warning
- ✅ Security-focused messaging

---

### 3. Welcome Email

```typescript
import { sendWelcomeEmail } from '@/lib/email'

await sendWelcomeEmail('user@example.com', {
  userName: 'John Doe',
  email: 'user@example.com',
  dashboardUrl: 'https://motomind.ai/dashboard'
})
```

**Features:**
- ✅ Warm welcome message
- ✅ Feature highlights (GPS tracking, alerts, security)
- ✅ Call-to-action to add first vehicle
- ✅ Support resources

---

### 4. Email Verification

```typescript
import { sendEmailVerificationEmail } from '@/lib/email'

await sendEmailVerificationEmail('user@example.com', {
  userName: 'John Doe',
  verificationUrl: 'https://motomind.ai/auth/verify?token=def456',
  expiresIn: '24 hours'
})
```

**Features:**
- ✅ Simple verification flow
- ✅ Clear expiry notice
- ✅ Security message for non-signups

---

### 5. Session Alert (Security)

```typescript
import { sendSessionAlertEmail } from '@/lib/email'

await sendSessionAlertEmail('user@example.com', {
  userName: 'John Doe',
  deviceName: 'iPhone 13 Pro • Safari 15.0',
  location: 'San Francisco, CA',
  ipAddress: '192.168.1.1',
  timestamp: 'Oct 17, 2025 at 2:30 PM PST',
  sessionsUrl: 'https://motomind.ai/settings/sessions'
})
```

**Features:**
- ✅ Security-focused design
- ✅ Complete sign-in details
- ✅ "Was this you?" confirmation
- ✅ Red alert for unrecognized activity
- ✅ Direct link to manage sessions
- ✅ Security tips

---

## 🛠️ Development Mode

When `NODE_ENV=development` or `RESEND_API_KEY` is not set:

```typescript
// Emails are logged to console instead of sent
[Email] Would send: {
  from: 'MotoMind AI <noreply@send.motomind.ai>',
  to: 'user@example.com',
  subject: 'Reset your MotoMind password'
}
```

**Benefits:**
- ✅ Test email logic without API calls
- ✅ No API rate limits
- ✅ Faster development
- ✅ See email data in terminal

---

## 🎨 Email Design

All emails follow MotoMind brand guidelines:

### Colors:
- Primary: `#000000` (Black)
- Background: `#ffffff` (White)
- Accent: `#f5f5f5` (Light Gray)
- Alerts: `#fef3c7` (Yellow) for warnings
- Success: `#f0f9ff` (Blue) for info
- Danger: `#fef2f2` (Red) for security

### Typography:
- Font: System font stack (Apple, Segoe UI, Roboto)
- Headings: 24px-32px, 600 weight
- Body: 16px, 400 weight
- Small: 14px for details

### Layout:
- Max width: 600px
- Responsive: Works on mobile
- Buttons: Black background, white text
- Icons: Emoji for visual interest

---

## 📊 Error Handling

All email functions return a result object:

```typescript
interface EmailSendResult {
  success: boolean
  messageId?: string  // Resend message ID
  error?: string      // Error message if failed
}
```

**Example:**
```typescript
const result = await sendPasswordResetEmail('user@example.com', data)

if (result.success) {
  console.log('Email sent:', result.messageId)
} else {
  console.error('Email failed:', result.error)
}
```

**Common Errors:**
- `Email service not configured` - Missing `RESEND_API_KEY`
- `Recipient email is required` - Empty `to` field
- `Invalid email address` - Malformed email
- `Failed to send email` - Resend API error

---

## 🔄 Bulk Emails

Send to multiple recipients:

```typescript
import { sendBulkEmail } from '@/lib/email'

const results = await sendBulkEmail(
  ['user1@example.com', 'user2@example.com', 'user3@example.com'],
  {
    subject: 'Your MotoMind password was reset',
    html: '<p>Your password has been changed.</p>',
    text: 'Your password has been changed.'
  }
)

// Returns array of results (one per recipient)
results.forEach((result, index) => {
  console.log(`Email ${index + 1}:`, result.success ? '✅' : '❌')
})
```

---

## 🧪 Testing Checklist

### Before Production:

- [ ] DNS records verified in Resend dashboard
- [ ] Test email sent successfully
- [ ] All templates render correctly
- [ ] Mobile display tested
- [ ] Links work and redirect properly
- [ ] Expiry times are accurate
- [ ] Error handling tested

### Test Commands:

```bash
# 1. Test service configuration
curl -X POST http://localhost:3005/api/email/test \
  -H "Content-Type: application/json" \
  -d '{"email": "your@email.com"}'

# 2. Check Resend dashboard
# Visit: https://resend.com/emails

# 3. Verify email received
# Check inbox for test email
```

---

## 🔐 Security Best Practices

### DO:
- ✅ Use short expiry times (15 min - 1 hour)
- ✅ Include request details (IP, location)
- ✅ Provide "wasn't you?" messaging
- ✅ Use HTTPS for all links
- ✅ Include unsubscribe for marketing emails

### DON'T:
- ❌ Include sensitive data in emails
- ❌ Use long-lived tokens (>24 hours)
- ❌ Reply-to addresses that don't work
- ❌ Inline images (use emoji instead)
- ❌ Complex HTML/CSS (email clients vary)

---

## 📈 Monitoring

### Resend Dashboard:

**View:**
- Email delivery status
- Open rates
- Click rates
- Bounce rates
- Spam reports

**Access:**
https://resend.com/emails

### Logs:

All emails log to console:
```
[Email] ✅ Sent successfully: 1a2b3c4d-5e6f-7g8h-9i0j-k1l2m3n4o5p6
[Email] Would send: { from: '...', to: '...', subject: '...' }
[Email] Send failed: Invalid email address
```

---

## 🚀 Integration Examples

### Password Reset Flow:

```typescript
// app/api/auth/forgot-password/route.ts
import { sendPasswordResetEmail } from '@/lib/email'
import { generateResetToken } from '@/lib/auth/tokens'

export async function POST(request: Request) {
  const { email } = await request.json()
  
  // Generate secure token
  const token = await generateResetToken(email)
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${token}`
  
  // Send email
  const result = await sendPasswordResetEmail(email, {
    userName: user.name,
    resetUrl,
    expiresIn: '1 hour'
  })
  
  if (!result.success) {
    console.error('Failed to send reset email:', result.error)
    // Still return success to prevent email enumeration
  }
  
  return Response.json({ success: true })
}
```

### New User Welcome:

```typescript
// After successful registration
import { sendWelcomeEmail } from '@/lib/email'

const result = await sendWelcomeEmail(newUser.email, {
  userName: newUser.name,
  email: newUser.email,
  dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
})
```

### Session Security Alert:

```typescript
// middleware.ts - After detecting new device
import { sendSessionAlertEmail } from '@/lib/email'

if (isNewDevice) {
  await sendSessionAlertEmail(user.email, {
    userName: user.name,
    deviceName: deviceInfo.name,
    location: geoLocation.city,
    ipAddress: request.ip,
    timestamp: new Date().toLocaleString(),
    sessionsUrl: `${process.env.NEXT_PUBLIC_APP_URL}/settings/sessions`
  })
}
```

---

## 📝 Customizing Templates

To modify email templates:

1. **Edit template file:**
   ```
   lib/email/templates/password-reset.ts
   ```

2. **Update HTML/text:**
   ```typescript
   const html = `
     <!-- Your custom HTML -->
   `
   
   const text = `
     Your custom plain text
   `
   ```

3. **Test changes:**
   ```bash
   npm run dev
   curl -X POST http://localhost:3005/api/email/test \
     -d '{"email": "test@example.com"}'
   ```

4. **Verify rendering:**
   - Check inbox
   - Test on mobile
   - Verify all links work

---

## 🆘 Troubleshooting

### Email Not Sending

**Check:**
1. `RESEND_API_KEY` is set in `.env.local`
2. DNS records verified in Resend
3. "From" email matches domain (send.motomind.ai)
4. No rate limits exceeded
5. API key has permissions

### Email in Spam

**Fix:**
1. Verify DKIM/SPF records
2. Add DMARC policy
3. Warm up domain (send gradually)
4. Avoid spam trigger words
5. Include unsubscribe link

### Template Not Rendering

**Check:**
1. HTML is valid
2. Inline CSS used (no external stylesheets)
3. No JavaScript (not supported)
4. Tables used for layout (not CSS Grid/Flexbox)
5. Test in Email on Acid or Litmus

---

## 📚 Resources

- **Resend Docs:** https://resend.com/docs
- **Email HTML Best Practices:** https://www.campaignmonitor.com/css/
- **Template Testing:** https://www.emailonacid.com/
- **Deliverability Guide:** https://www.validity.com/resource-center/email-deliverability/

---

**Email service ready!** 🎉 Wait for DNS propagation, then start sending!
