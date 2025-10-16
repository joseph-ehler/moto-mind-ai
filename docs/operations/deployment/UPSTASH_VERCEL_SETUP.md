# Upstash Redis Setup for Vercel (2 Minutes)

**Updated:** Vercel now uses **Upstash** from the Marketplace for Redis (KV) storage.

Your code is **already configured** to auto-detect and use Upstash!

---

## 🚀 Setup Option 1: Vercel Marketplace (EASIEST)

### Step 1: Go to Your Project
https://vercel.com/josephehler-projects/moto-mind-ai

### Step 2: Add Upstash Integration

1. Click **"Integrations"** in left sidebar
2. OR visit: https://vercel.com/integrations/upstash
3. Click **"Add Integration"**
4. Select **"Upstash Redis"**
5. Authorize with your Vercel account
6. Select project: **`moto-mind-ai`**
7. Click **"Add"**

### Step 3: Configure Database

1. Upstash dashboard opens automatically
2. **Create new database** or select existing
3. Name: `motomind-geocoding`
4. Region: **Same as Vercel** (probably `us-east-1`)
5. Click **"Create"**

### Step 4: Done!

Environment variables automatically added to Vercel:
```bash
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
```

Your next deployment will automatically use Upstash!

---

## 🚀 Setup Option 2: Direct Upstash (ALSO EASY)

### Step 1: Sign Up for Upstash

https://console.upstash.com

(GitHub login works)

### Step 2: Create Redis Database

1. Click **"Create Database"**
2. Name: `motomind-geocoding`
3. Type: **Global** (or Regional for lower cost)
4. Region: Same as Vercel deployment (`us-east-1`)
5. Click **"Create"**

### Step 3: Get Connection URL

1. Click on your database
2. Scroll to **"REST API"** section
3. Copy **"UPSTASH_REDIS_REST_URL"**
4. Copy **"UPSTASH_REDIS_REST_TOKEN"**

### Step 4: Add to Vercel

1. Go to your project: https://vercel.com/josephehler-projects/moto-mind-ai
2. **Settings** → **Environment Variables**
3. Add two variables:
   ```bash
   UPSTASH_REDIS_REST_URL=https://...
   UPSTASH_REDIS_REST_TOKEN=...
   ```
4. Check all environments:
   - ✅ Production
   - ✅ Preview
   - ✅ Development

### Step 5: Deploy

```bash
git add .
git commit -m "Add Upstash Redis for geocoding cache"
git push
```

---

## 📊 What You'll See

### Development (Local):
```bash
npm run dev
# Console:
ℹ️ No Redis configured - using in-memory cache
```

This is normal! Upstash only works in production.

### Production (After Setup):
```bash
# Check deployment logs in Vercel
# Should see:
✅ Upstash (Redis) connected
📍 Using cached geocoding result
```

---

## 💰 Pricing

### Free Tier:
- **10,000 commands/day**
- **256MB storage**
- **Global replication** (optional)
- Perfect for geocoding cache!

### Paid (if you exceed):
- **$0.20 per 100k commands**
- Still much cheaper than Google Maps only!

---

## 🧪 Test It Works

### Upload a receipt twice:

**First upload:**
```bash
✅ Address geocoded via nominatim
# Takes 500-1500ms
```

**Second upload (same address):**
```bash
📍 Using cached geocoding result (Redis)
# Takes <10ms! ⚡
```

### Check Upstash Dashboard:

1. Go to https://console.upstash.com
2. Click on your database
3. Click **"Data Browser"**
4. Search: `geocode:*`
5. You'll see cached addresses!

Example:
```
Key: geocode:1 goodsprings rd, jean, nv 89019
Value: {"latitude":35.78,"longitude":-115.33}
TTL: 86399 seconds (23:59:59)
```

---

## ✅ Benefits

| Scenario | Before | After (Upstash) |
|----------|--------|-----------------|
| **First geocode** | 500-1500ms | 500-1500ms (same) |
| **Repeat geocode** | 500-1500ms | **<10ms** ⚡ |
| **Monthly cost** | $50 (Google only) | **$0-1** (free tier + Nominatim) |
| **Speed improvement** | - | **60-150x faster!** |

---

## 🔧 How It Works

```
┌─────────────────────────────────────────────────┐
│ User uploads receipt (Jean, NV gas station)    │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ API extracts: "1 Goodsprings Rd, Jean, NV"     │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ Check Upstash cache                             │
│ Key: "geocode:1 goodsprings rd, jean, nv..."   │
└─────────────────────────────────────────────────┘
        │                              │
    CACHE HIT ✅                   CACHE MISS ❌
        │                              │
        ↓                              ↓
   Return <10ms!         ┌──────────────────────────┐
                         │ Geocode with Nominatim   │
                         │ (500-1500ms)             │
                         └──────────────────────────┘
                                     ↓
                         ┌──────────────────────────┐
                         │ Cache in Upstash         │
                         │ TTL: 24 hours            │
                         └──────────────────────────┘
                                     ↓
                              Return coordinates
```

---

## 🚨 Troubleshooting

### "Using in-memory cache" in production

**Cause:** Upstash environment variables not set

**Fix:**
1. Check Vercel → Settings → Environment Variables
2. Should see:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
3. If missing:
   - Option 1: Add Upstash integration from Marketplace
   - Option 2: Manually add from Upstash dashboard

### "Upstash initialization failed"

**Cause:** `@vercel/kv` package not installed

**Fix:**
```bash
npm install @vercel/kv
git add .
git commit -m "Add @vercel/kv package"
git push
```

### Cache not persisting between deployments

**This is normal!** Cache is stored in Upstash Redis, which persists across deployments. But the cache key might change if the address format changes slightly.

---

## 📈 Monitor Your Cache

### Via Upstash Dashboard:

1. https://console.upstash.com
2. Click your database
3. **Metrics** tab shows:
   - Requests per second
   - Hit rate
   - Storage used
   - Total commands

### Via Your App:

Visit: http://your-app.vercel.app/admin/geocoding-metrics

Shows:
- Cache hit rate
- Geocoding success rate
- User corrections
- Health status

---

## 🎯 Next Steps

1. ✅ Add Upstash integration (2 min)
2. ✅ Deploy to Vercel (`git push`)
3. ✅ Test with real receipts
4. ✅ Monitor cache hit rate
5. ✅ Watch it climb to 50-70%!

---

## 🎉 Summary

**What you get:**
- ✅ Persistent Redis cache (survives restarts)
- ✅ Global replication (optional)
- ✅ 60-150x faster repeat requests
- ✅ Near-zero cost (free tier)
- ✅ Auto-configured via Marketplace
- ✅ Production-ready!

**Setup time:** 2 minutes

**Ongoing cost:** $0/month (free tier covers most use cases)

**Performance gain:** Massive (10ms vs 1500ms for cached requests)

---

**Ready to deploy?** Just add the integration and push! 🚀
