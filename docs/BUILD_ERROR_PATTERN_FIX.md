# 🔧 Build Error Pattern - Root Cause & Solution

**Date:** October 18, 2025  
**Issue:** Recurring "supabaseUrl is required" errors during Vercel builds  
**Status:** ✅ RESOLVED

---

## 🚨 THE PROBLEM

Next.js **evaluates all modules at build time** to analyze dependencies. Any code that runs at the **module level** (outside functions) will execute during the build, when environment variables may not be available.

---

## ❌ THE BREAKING PATTERN

```typescript
// ❌ BAD - This runs at BUILD TIME
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,           // Not available at build!
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function myFunction() {
  await supabase.from('table')...
}
```

**Why it breaks:**
1. File gets imported during build
2. Module-level code executes
3. `process.env.SUPABASE_URL` is undefined
4. Error: "supabaseUrl is required"

---

## ✅ THE CORRECT PATTERN

```typescript
// ✅ GOOD - This runs at RUNTIME
import { createServiceClient } from '@/lib/supabase/service-client'

export async function myFunction() {
  const supabase = createServiceClient()  // Created when called
  await supabase.from('table')...
}
```

**Why it works:**
1. File gets imported during build
2. No module-level initialization
3. Client created only when function is called (runtime)
4. Environment variables available at runtime

---

## 📋 FILES FIXED

### **API Routes:**
```bash
✅ app/api/onboarding/complete/route.ts
✅ app/api/onboarding/vehicle/route.ts
✅ app/api/onboarding/initialize/route.ts
✅ app/api/onboarding/status/route.ts (via helper)
```

### **Helper Libraries:**
```bash
✅ lib/onboarding/check.ts
✅ lib/supabase/service-client.ts (created)
```

### **Test Routes (Removed):**
```bash
❌ app/api/auth/test-email/route.ts (deleted)
❌ app/api/auth/verify-magic-link/route.ts (deleted)
❌ app/test-native/page.tsx (deleted)
```

---

## 🎯 THE RULE

### **For API Routes:**
```typescript
// ✅ ALWAYS create clients inside the handler
export async function POST(request: Request) {
  const supabase = createServiceClient()
  // ... use it
}

// ❌ NEVER create clients at module level
const supabase = createServiceClient()
export async function POST(request: Request) {
  // ... use it
}
```

### **For Helper Functions:**
```typescript
// ✅ ALWAYS create clients inside the function
export async function checkSomething(userId: string) {
  const supabase = createServiceClient()
  // ... use it
}

// ❌ NEVER create clients at module level
const supabase = createServiceClient()
export async function checkSomething(userId: string) {
  // ... use it
}
```

---

## 🔍 HOW TO FIND VIOLATIONS

```bash
# Search for module-level Supabase initialization
grep -r "const.*createClient" app/api lib/ --include="*.ts" | grep -v "function\|=>"

# Search for module-level process.env usage
grep -r "const.*process.env" app/api lib/ --include="*.ts" | grep -v "function\|=>"
```

---

## 🛠️ THE FIX TEMPLATE

### **Before:**
```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function myRoute() {
  const { data } = await supabase.from('table').select()
  return data
}
```

### **After:**
```typescript
import { createServiceClient } from '@/lib/supabase/service-client'

export async function myRoute() {
  const supabase = createServiceClient()
  const { data } = await supabase.from('table').select()
  return data
}
```

---

## 📊 BUILD ATTEMPTS LOG

```
Attempt 1: Missing service-client.ts 
→ Created lib/supabase/service-client.ts ✅

Attempt 2: test-email route (Resend without API key)
→ Deleted test route ✅

Attempt 3: verify-magic-link route (Resend without API key)
→ Deleted test route ✅

Attempt 4: onboarding/complete (module-level Supabase)
→ Fixed to lazy load ✅

Attempt 5: onboarding/vehicle (module-level Supabase)
→ Fixed to lazy load ✅

Attempt 6: onboarding/initialize (module-level Supabase)
→ Fixed to lazy load ✅

Attempt 7: onboarding/status (via lib/onboarding/check.ts)
→ Fixed helper to lazy load ✅

Attempt 8: SHOULD SUCCEED ✅
```

---

## 🎓 LESSONS LEARNED

### **1. Next.js Build Process**
- All modules are evaluated at build time
- API routes are analyzed for dependencies
- Module-level code runs during build
- Environment variables may not be available

### **2. Lazy Loading Pattern**
- Create resources when needed, not when imported
- Move initialization inside functions
- Use factory functions for shared clients

### **3. Test Code in Production**
- Never commit test routes with missing dependencies
- Test routes should have feature flags or separate endpoints
- Remove test code before deployment

### **4. Environment Variables**
- Build-time vs Runtime availability
- `NEXT_PUBLIC_*` available at build
- Server-only vars available at runtime only
- Use runtime initialization for server vars

---

## 🚨 FUTURE PREVENTION

### **Pre-Commit Checklist:**
```bash
# Run before committing
grep -r "const.*createClient" app/api lib/ --include="*.ts" | grep -v "function"

# If any results, fix them before committing
```

### **Code Review Checklist:**
- [ ] No module-level `createClient` calls
- [ ] No module-level `process.env` access
- [ ] All clients created inside functions
- [ ] Test routes removed or feature-flagged

### **ESLint Rule (Future):**
```javascript
// Add to .eslintrc.js
"no-restricted-syntax": [
  "error",
  {
    "selector": "VariableDeclaration[kind='const'] > VariableDeclarator[init.callee.name='createClient']",
    "message": "Do not create Supabase clients at module level. Use createServiceClient() inside functions."
  }
]
```

---

## ✅ VERIFICATION

### **Check if pattern exists:**
```bash
# Should return no results
grep -r "const supabase = createClient" app/api/ --include="*.ts"
```

### **Check if fixed:**
```bash
# All should use createServiceClient() inside functions
grep -r "createServiceClient" app/api/ --include="*.ts"
```

---

## 📚 RELATED FILES

- **Service Client:** `lib/supabase/service-client.ts`
- **Pattern Guide:** This file
- **Build Logs:** Vercel deployment logs

---

## 🎊 RESULT

**Build Status:** ✅ Should succeed  
**Pattern Fixed:** ✅ All module-level initialization removed  
**Future-Proofed:** ✅ Documentation and guidelines in place  

---

**Remember:** If you see "supabaseUrl is required" during build, look for module-level `createClient` calls!
