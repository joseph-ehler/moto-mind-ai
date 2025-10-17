# 🚀 Vercel Deployment Guide

## ✅ Pre-Deployment Checklist

### 1. **Required Environment Variables**

These MUST be set in Vercel before deployment:

```bash
# Supabase (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ... (your anon key)
SUPABASE_SERVICE_ROLE_KEY=eyJ... (your service role key)

# Database (REQUIRED)
DATABASE_URL=postgresql://postgres:password@db.project.supabase.co:5432/postgres

# OpenAI (REQUIRED for Vision + Chat)
OPENAI_API_KEY=sk-proj-...
OPENAI_ORG_ID=org-...
OPENAI_MODEL=gpt-4o

# App Configuration (REQUIRED)
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NODE_ENV=production
```

### 2. **Setting Environment Variables in Vercel**

**Option A: Via Vercel Dashboard**
1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add each variable with scope: `Production`, `Preview`, `Development`
4. Click "Save"

**Option B: Via Vercel CLI**
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Set environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add DATABASE_URL production
vercel env add OPENAI_API_KEY production
vercel env add OPENAI_ORG_ID production

# Pull env vars to local
vercel env pull .env.production
```

**Option C: Bulk Import**
1. Create `env-import.txt`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   ```
2. Import via dashboard: Settings → Environment Variables → Import

---

## 🔧 Common Issues & Solutions

### Issue 1: "supabaseKey is required"

**Cause:** Missing `NEXT_PUBLIC_SUPABASE_ANON_KEY` environment variable.

**Solution:**
```bash
# Verify in Supabase Dashboard:
# 1. Go to https://supabase.com/dashboard
# 2. Select your project
# 3. Settings → API
# 4. Copy "anon" key and "service_role" key
# 5. Add to Vercel environment variables
```

**Critical:** Both keys must be set:
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - For client-side access
- `SUPABASE_SERVICE_ROLE_KEY` - For server-side operations

### Issue 2: Conflicting Routes

**Cause:** Duplicate files in `pages/api/` and `app/api/`.

**Solution:** Use App Router only (already fixed):
```bash
# pages/api/ is now ignored via .gitignore
# All API routes MUST be in app/api/
```

### Issue 3: Build Fails with TypeScript Errors

**Solution:**
```bash
# Check locally first
npm run type-check

# If errors exist, fix before deploying
npm run build
```

### Issue 4: Database Connection Fails

**Cause:** Invalid `DATABASE_URL` or missing connection pooling.

**Solution:**
```bash
# Use connection pooling for Vercel (serverless):
DATABASE_URL=postgresql://postgres:password@db.project.supabase.co:6543/postgres?pgbouncer=true

# Note: Port 6543 for pooling, not 5432
```

### Issue 5: Authentication Errors

**Cause:** JWT secrets missing or `NEXT_PUBLIC_APP_URL` incorrect.

**Solution:**
```bash
# Set correct production URL
NEXT_PUBLIC_APP_URL=https://your-actual-domain.vercel.app

# OR use custom domain
NEXT_PUBLIC_APP_URL=https://app.motomind.com
```

---

## 📋 Deployment Steps

### First-Time Deployment

1. **Connect Repository**
   ```bash
   # Via Vercel Dashboard:
   # 1. New Project
   # 2. Import Git Repository
   # 3. Select your repo
   ```

2. **Configure Build Settings**
   ```
   Framework Preset: Next.js
   Build Command: npm run build
   Output Directory: .next (default)
   Install Command: npm install
   Node Version: 18.x (or 20.x)
   ```

3. **Add Environment Variables**
   - Follow "Setting Environment Variables" above
   - **CRITICAL:** Add ALL required variables before deploying

4. **Deploy**
   ```bash
   # Via CLI:
   vercel --prod

   # Or click "Deploy" in dashboard
   ```

### Subsequent Deployments

Deployments are **automatic** on `git push` to:
- `main` branch → Production
- Other branches → Preview

**Manual Deploy:**
```bash
# Deploy current branch
vercel

# Deploy to production
vercel --prod

# Deploy specific branch
git checkout feature-branch
vercel
```

---

## 🔐 Security Best Practices

### 1. **Environment Variables**

✅ **DO:**
- Use different keys for dev/staging/prod
- Rotate service role key periodically
- Store secrets in Vercel env vars (encrypted)

❌ **DON'T:**
- Commit `.env.local` to git (already in `.gitignore`)
- Share service role key publicly
- Use same keys across environments

### 2. **API Security**

All API routes are protected with:
- JWT verification (Supabase)
- Tenant isolation (database-verified)
- RLS policies (defense-in-depth)

**Verify Security:**
```bash
# Test authentication (should fail without token)
curl https://your-app.vercel.app/api/vehicles
# Expected: 401 Unauthorized

# Test with valid token (should work)
curl -H "Authorization: Bearer $TOKEN" https://your-app.vercel.app/api/vehicles
# Expected: 200 OK
```

### 3. **Database Security**

RLS is **automatically enforced** on all queries:
```typescript
// No manual filtering needed!
const supabase = createTenantClient(token, tenant.tenantId)
const { data } = await supabase.from('vehicles').select('*')
// ✅ RLS automatically filters by tenant_id
```

---

## 🎯 Performance Optimization

### 1. **Edge Functions** (Optional)

For auth-heavy routes, consider Edge Runtime:
```typescript
// app/api/vehicles/route.ts
export const runtime = 'edge' // Deploy to Edge

export const GET = withAuth(async (request, { user, tenant, token }) => {
  // 10x faster response time!
})
```

### 2. **Caching** (Recommended)

Add response caching:
```typescript
export const revalidate = 60 // Cache for 60 seconds

export const GET = withAuth(async (request, { user, tenant, token }) => {
  // Cached response for 60s
})
```

### 3. **Database Pooling** (Required)

Always use connection pooling for serverless:
```bash
# Use pooled connection (port 6543)
DATABASE_URL=postgresql://...@db.project.supabase.co:6543/postgres?pgbouncer=true
```

---

## 📊 Monitoring

### 1. **Vercel Analytics**

Enable in dashboard:
```
Settings → Analytics → Enable
```

### 2. **Logs**

View real-time logs:
```bash
vercel logs your-app.vercel.app --follow
```

### 3. **Error Tracking**

All errors logged with context:
```typescript
console.error('[DOMAIN] Error:', {
  tenantId: tenant.tenantId,
  userId: user.id,
  error: error.message,
})
```

View in Vercel Dashboard → Logs

---

## 🚨 Troubleshooting

### Build Fails

```bash
# Check build locally
npm run build

# Check TypeScript
npm run type-check

# View detailed logs
vercel logs --build
```

### Runtime Errors

```bash
# View function logs
vercel logs

# View specific function
vercel logs --scope api/vehicles

# Follow in real-time
vercel logs --follow
```

### Database Connection Issues

```bash
# Test connection
curl https://your-app.vercel.app/api/health

# Check Supabase status
https://status.supabase.com
```

---

## ✅ Deployment Verification

After deployment, verify:

1. **Health Check**
   ```bash
   curl https://your-app.vercel.app/api/health
   # Expected: 200 OK
   ```

2. **Authentication**
   ```bash
   # Should require auth
   curl https://your-app.vercel.app/api/vehicles
   # Expected: 401 Unauthorized
   ```

3. **Database**
   ```bash
   # With valid token
   curl -H "Authorization: Bearer $TOKEN" https://your-app.vercel.app/api/vehicles
   # Expected: 200 OK with data
   ```

4. **RLS**
   ```bash
   # User should only see their own data
   # Verify tenant_id matches user's tenant
   ```

---

## 📝 Environment Variables Checklist

Copy this and fill in your values:

```bash
# ✅ REQUIRED (App won't work without these)
[ ] NEXT_PUBLIC_SUPABASE_URL
[ ] NEXT_PUBLIC_SUPABASE_ANON_KEY
[ ] SUPABASE_SERVICE_ROLE_KEY
[ ] DATABASE_URL
[ ] OPENAI_API_KEY
[ ] OPENAI_ORG_ID
[ ] NEXT_PUBLIC_APP_URL

# ✅ RECOMMENDED (For full functionality)
[ ] OPENAI_MODEL=gpt-4o
[ ] NODE_ENV=production

# 🔧 OPTIONAL (Phase 2+)
[ ] ANTHROPIC_API_KEY
[ ] GOOGLE_AI_API_KEY
[ ] REDIS_URL
[ ] NEXT_PUBLIC_POSTHOG_KEY
[ ] SENDGRID_API_KEY
```

---

## 🎯 Quick Commands

```bash
# Deploy to production
vercel --prod

# View logs
vercel logs --follow

# Set env var
vercel env add VAR_NAME production

# Pull env vars locally
vercel env pull

# Check deployment status
vercel inspect https://your-app.vercel.app

# Rollback to previous deployment
vercel rollback
```

---

## 📚 Additional Resources

- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Supabase + Vercel Guide](https://supabase.com/docs/guides/hosting/vercel)
- [Edge Runtime](https://vercel.com/docs/functions/edge-functions)

---

## 🏆 Production-Ready Checklist

Before going live:

- [ ] All environment variables set in Vercel
- [ ] Database RLS policies tested
- [ ] Authentication working
- [ ] Error logging verified
- [ ] Performance metrics baseline established
- [ ] Backup strategy documented
- [ ] Rollback plan tested
- [ ] Custom domain configured (optional)
- [ ] SSL certificate verified (automatic)
- [ ] API rate limiting tested

**Status:** Ready to deploy! 🚀
