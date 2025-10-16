# 🌐 **URL Configuration Pattern**

> **Elite-Tier URL Management**  
> Environment-aware, rebrand-proof, future-proof URL handling

---

## 🎯 **THE PROBLEM**

**❌ NEVER do this:**
```ts
// WRONG: Hardcoded URLs
const response = await fetch('http://localhost:3000/api/vehicles')

// WRONG: Manual environment checks
const baseUrl = process.env.NODE_ENV === 'production' 
  ? 'https://motomind.app' 
  : 'http://localhost:3000'
```

**Why this is bad:**
- 🚨 Breaks during rebranding
- 🚨 Breaks in staging/preview environments
- 🚨 Not future-proof
- 🚨 Not flexible for different ports/domains
- 🚨 Hard to test

---

## ✅ **THE ELITE SOLUTION**

### **1. Use the `apiUrl` Helper**

```ts
import { apiUrl } from '@/lib/utils/api-url'

// ✅ Client-side (relative URL)
const response = await fetch(apiUrl('/api/vehicles'))

// ✅ Server-side (absolute URL)
const response = await fetch(apiUrl('/api/vehicles', { absolute: true }))

// ✅ Testing (override)
const response = await fetch(
  apiUrl('/api/vehicles', { 
    baseUrl: process.env.NEXT_PUBLIC_APP_URL 
  })
)

// ✅ With query params
const url = apiUrl('/api/vehicles', { 
  params: { limit: 10, sort: 'name' } 
})
// Result: '/api/vehicles?limit=10&sort=name'
```

---

## 📋 **USAGE PATTERNS**

### **Client-Side Components**
```tsx
'use client'

import { apiUrl } from '@/lib/utils/api-url'

export function VehicleList() {
  const fetchVehicles = async () => {
    // Uses relative URL (most efficient in browser)
    const response = await fetch(apiUrl('/api/vehicles'))
    return response.json()
  }

  // ...
}
```

### **Server Components**
```tsx
import { apiUrl } from '@/lib/utils/api-url'

export async function VehicleList() {
  // Automatically uses absolute URL on server
  const response = await fetch(
    apiUrl('/api/vehicles', { absolute: true })
  )
  const data = await response.json()

  return <div>{/* ... */}</div>
}
```

### **API Routes**
```ts
import { apiUrl, absoluteApiUrl } from '@/lib/utils/api-url'

export async function POST(request: Request) {
  // Calling another API endpoint
  const response = await fetch(
    absoluteApiUrl('/api/enrich-event', {
      eventId: '123'
    })
  )

  return NextResponse.json({ success: true })
}
```

### **Integration Tests**
```ts
import { apiUrl } from '@/lib/utils/api-url'

describe('Vehicle API', () => {
  it('should list vehicles', async () => {
    // Uses environment variable for flexibility
    const response = await fetch(
      apiUrl('/api/vehicles', { 
        baseUrl: process.env.NEXT_PUBLIC_APP_URL 
      })
    )
    
    expect(response.status).toBe(200)
  })
})
```

### **E2E Tests (Playwright)**
```ts
// playwright.config.ts already uses environment variables:
// baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3005'

test('should display vehicles', async ({ page }) => {
  // Playwright automatically prefixes with baseURL
  await page.goto('/vehicles')
  
  // For API calls in tests:
  const response = await page.request.get('/api/vehicles')
  expect(response.ok()).toBeTruthy()
})
```

### **Webhooks & External Integrations**
```ts
import { absoluteApiUrl } from '@/lib/utils/api-url'

// Webhooks MUST use absolute URLs
const webhookUrl = absoluteApiUrl('/api/webhooks/stripe')
// Result: 'https://motomind.app/api/webhooks/stripe' (production)
// Result: 'http://localhost:3005/api/webhooks/stripe' (development)

await stripe.webhooks.register({
  url: webhookUrl,
  events: ['payment_intent.succeeded']
})
```

### **Emails & Notifications**
```tsx
import { absoluteApiUrl, getBaseUrl } from '@/lib/utils/api-url'

const resetPasswordLink = absoluteApiUrl('/reset-password', {
  token: userToken
})
// Result: 'https://motomind.app/reset-password?token=abc123'

await sendEmail({
  to: user.email,
  subject: 'Reset your password',
  html: `<a href="${resetPasswordLink}">Reset Password</a>`
})
```

---

## 🔧 **ENVIRONMENT CONFIGURATION**

### **`.env.local` (Development)**
```bash
NEXT_PUBLIC_APP_URL=http://localhost:3005
# NEXT_PUBLIC_API_URL=http://localhost:3005  # Optional override
```

### **`.env.production` (Production)**
```bash
NEXT_PUBLIC_APP_URL=https://motomind.app
# NEXT_PUBLIC_API_URL=https://api.motomind.app  # Optional: Separate API domain
```

### **`.env.staging` (Staging)**
```bash
NEXT_PUBLIC_APP_URL=https://staging.motomind.app
```

### **Vercel Preview Deployments**
```bash
# Vercel automatically sets:
VERCEL_URL=preview-abc123.vercel.app
NEXT_PUBLIC_APP_URL=https://preview-abc123.vercel.app
```

---

## 🎬 **HOW IT WORKS**

### **Environment Priority**
```ts
// lib/utils/api-url.ts

export function getApiBaseUrl(): string {
  // 1. Browser: Use relative URLs (most efficient)
  if (typeof window !== 'undefined') {
    return ''
  }

  // 2. Explicit API URL (for separate API domains)
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL
  }

  // 3. App URL (most common)
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL
  }

  // 4. Vercel automatic URL
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  // 5. Local development fallback
  return 'http://localhost:3005'
}
```

---

## 🚀 **MIGRATION SCENARIOS**

### **Scenario 1: Rebrand to "MotoPro"**
```bash
# Before:
NEXT_PUBLIC_APP_URL=https://motomind.app

# After (ONE LINE CHANGE):
NEXT_PUBLIC_APP_URL=https://motopro.app

# ✅ All API calls automatically update
# ✅ All webhooks automatically update
# ✅ All emails automatically update
# ✅ Zero code changes needed
```

### **Scenario 2: Separate API Domain**
```bash
# Current: API at same domain
NEXT_PUBLIC_APP_URL=https://motomind.app

# New: API at separate domain
NEXT_PUBLIC_APP_URL=https://motomind.app
NEXT_PUBLIC_API_URL=https://api.motomind.app

# ✅ All API calls route to api.motomind.app
# ✅ Zero code changes needed
```

### **Scenario 3: Multi-Region Deployment**
```bash
# US Region:
NEXT_PUBLIC_APP_URL=https://us.motomind.app
NEXT_PUBLIC_API_URL=https://api-us.motomind.app

# EU Region:
NEXT_PUBLIC_APP_URL=https://eu.motomind.app
NEXT_PUBLIC_API_URL=https://api-eu.motomind.app

# ✅ Same codebase, different environments
# ✅ Zero code changes needed
```

---

## 🧪 **TESTING BENEFITS**

### **Before (Hardcoded URLs)**
```ts
// ❌ Breaks if port changes
describe('API Tests', () => {
  it('should work', async () => {
    const response = await fetch('http://localhost:3000/api/vehicles')
    // Breaks if dev server runs on :3005
  })
})
```

### **After (Environment-Aware)**
```ts
// ✅ Works in any environment
describe('API Tests', () => {
  it('should work', async () => {
    const response = await fetch(
      apiUrl('/api/vehicles', { 
        baseUrl: process.env.NEXT_PUBLIC_APP_URL 
      })
    )
    // Works on :3000, :3005, staging, production
  })
})
```

---

## 📊 **API REFERENCE**

### **`apiUrl(path, options)`**
Build an API URL with environment handling.

**Parameters:**
- `path: string` - API path (e.g., '/api/vehicles')
- `options?: object`
  - `baseUrl?: string` - Override base URL (testing)
  - `absolute?: boolean` - Force absolute URL
  - `params?: object` - Query parameters

**Returns:** `string` - Formatted URL

### **`absoluteApiUrl(path, params)`**
Always returns absolute URL (protocol + domain + path).

**Parameters:**
- `path: string` - API path
- `params?: object` - Query parameters

**Returns:** `string` - Absolute URL

### **`getBaseUrl()`**
Get base URL for current environment.

**Returns:** `string` - Base URL without trailing slash

### **`getApiBaseUrl()`**
Get API base URL (considers NEXT_PUBLIC_API_URL override).

**Returns:** `string` - API base URL

---

## ✅ **CHECKLIST**

Before deploying, verify:

- [ ] No hardcoded `localhost` URLs in code
- [ ] No hardcoded `motomind.app` URLs in code
- [ ] Using `apiUrl()` for all API calls
- [ ] Using `absoluteApiUrl()` for webhooks/emails
- [ ] Tests use `process.env.NEXT_PUBLIC_APP_URL`
- [ ] Environment variables set correctly
- [ ] `.env.example` documents all URL variables
- [ ] Playwright config uses environment variables

---

## 🎯 **PRINCIPLES**

1. **No Hardcoded URLs** - Ever. Zero exceptions.
2. **Environment-Aware** - Adapts to dev/staging/production
3. **Relative in Browser** - Most efficient for client-side
4. **Absolute on Server** - Required for server-side API calls
5. **Testing-Friendly** - Override URLs in tests
6. **Future-Proof** - Handles rebrands, domain changes, multi-region

---

## 🚨 **NEVER DO THIS**

```ts
// ❌ Hardcoded localhost
const url = 'http://localhost:3000/api/vehicles'

// ❌ Hardcoded domain
const url = 'https://motomind.app/api/vehicles'

// ❌ Manual environment checks
const url = process.env.NODE_ENV === 'production'
  ? 'https://motomind.app/api/vehicles'
  : 'http://localhost:3000/api/vehicles'

// ❌ Template strings with env vars in code
const url = `${process.env.NEXT_PUBLIC_APP_URL}/api/vehicles`
// Use apiUrl() instead!
```

---

## ✅ **ALWAYS DO THIS**

```ts
// ✅ Use the helper
import { apiUrl, absoluteApiUrl } from '@/lib/utils/api-url'

// Client-side
const url = apiUrl('/api/vehicles')

// Server-side / webhooks
const url = absoluteApiUrl('/api/vehicles')

// With params
const url = apiUrl('/api/vehicles', { params: { limit: 10 } })

// Testing
const url = apiUrl('/api/vehicles', { 
  baseUrl: process.env.NEXT_PUBLIC_APP_URL 
})
```

---

**This pattern makes your codebase:**
- 🚀 **Rebrand-proof** - Change domain in one place
- 🌍 **Multi-region ready** - Different URLs per region
- 🧪 **Testing-friendly** - Environment-aware tests
- 🔮 **Future-proof** - No breaking changes
- 💎 **Elite-tier** - Professional, scalable, maintainable

**Zero compromises. Zero technical debt.**
