# Geocoding System Setup Guide

## Overview

This guide will walk you through setting up the complete production-grade geocoding system with:
- ✅ Persistent Redis caching
- ✅ Multi-provider geocoding (Nominatim + Google Maps fallback)
- ✅ User correction tracking
- ✅ Metrics & monitoring

---

## Step 1: Install Dependencies

### Add ioredis for Redis support

```bash
npm install ioredis
npm install --save-dev @types/ioredis
```

---

## Step 2: Environment Variables

### Required

Add to your `.env.local`:

```bash
# Database (already configured)
DATABASE_URL=your_database_url
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI (already configured)
OPENAI_API_KEY=your_openai_key
```

### Optional (but recommended for production)

```bash
# Redis (optional - falls back to in-memory if not provided)
REDIS_URL=redis://localhost:6379
# OR for production (Upstash, Redis Cloud, etc.):
REDIS_URL=rediss://default:password@your-redis-host:6379

# Google Maps API (optional - only used when Nominatim fails)
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

---

## Step 3: Database Migration

Run the location corrections migration:

```bash
# Apply the migration
npm run db:migrate

# OR manually via Supabase dashboard
# Copy and run: migrations/032_location_corrections.sql
```

This creates:
- `location_corrections` table
- RLS policies for user data isolation
- Automatic distance calculation trigger
- Analytics view for correction patterns

---

## Step 4: Redis Setup (Optional but Recommended)

### Option A: Local Development (Docker)

```bash
# Run Redis in Docker
docker run -d \
  --name motomind-redis \
  -p 6379:6379 \
  redis:7-alpine

# Test connection
docker exec -it motomind-redis redis-cli ping
# Should return: PONG
```

### Option B: Cloud Redis (Production)

**Upstash (Recommended - Free tier available):**
1. Create account at https://upstash.com
2. Create new Redis database
3. Copy the `REDIS_URL` from dashboard
4. Add to `.env.local`

**Redis Cloud:**
1. Create account at https://redis.com/cloud
2. Create new database
3. Copy connection string
4. Add to `.env.local`

### Option C: No Redis (Development)

If you don't set `REDIS_URL`, the system will:
- Fall back to in-memory caching
- Still work perfectly fine
- Lose cache on server restart
- Log: `"ℹ️ REDIS_URL not configured - using in-memory cache"`

---

## Step 5: Google Maps API Key (Optional)

### When to use:
- Nominatim has high failure rate in your region
- You need higher geocoding reliability
- You're okay with small API costs (~$0.005 per geocode)

### Setup:
1. Go to https://console.cloud.google.com
2. Enable "Geocoding API"
3. Create API key
4. Add restrictions (HTTP referrers for your domain)
5. Add to `.env.local`: `GOOGLE_MAPS_API_KEY=your_key`

### Cost:
- First 200 requests/day: **FREE**
- After that: **$5 per 1000 requests**
- Only charged when Nominatim fails (fallback)

---

## Step 6: Verify Installation

### Test Redis Connection

```bash
# Start your app
npm run dev

# Check console for:
✅ Redis connected
# OR
ℹ️ REDIS_URL not configured - using in-memory cache
```

### Test Geocoding

1. Upload a fuel receipt with an address
2. Check console for:

```javascript
✅ Address extracted via OCR: 1 Goodsprings Rd, Jean, NV 89019
📍 Geocoding address: 1 Goodsprings Rd, Jean, NV 89019

// First upload:
✅ Address geocoded via nominatim (high confidence)

// Second upload (same address):
📍 Using cached geocoding result (Redis)
```

### Test Metrics API

```bash
curl http://localhost:3005/api/metrics/geocoding \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Expected response:
```json
{
  "cache": {
    "available": true,
    "type": "redis",
    "size": 15,
    "hit_rate": 67.2
  },
  "geocoding": {
    "total_requests": 50,
    "nominatim": {
      "success": 45,
      "error": 2,
      "success_rate": 95.7
    },
    "google": {
      "success": 2,
      "error": 0,
      "success_rate": 100.0
    },
    "failures": {
      "total": 1,
      "invalid_address": 3
    }
  },
  "corrections": {
    "total": 5,
    "recent_7_days": 2
  },
  "health": {
    "status": "healthy",
    "issues": []
  }
}
```

---

## Step 7: Monitor in Production

### Key Metrics to Watch

1. **Cache Hit Rate** (target: >50%)
   - Low = Need better caching or more unique addresses
   
2. **Nominatim Success Rate** (target: >90%)
   - Low = Consider enabling Google Maps fallback
   
3. **Correction Rate** (target: <20%)
   - High = Geocoding accuracy issues, review correction patterns

### Set Up Alerts

Add to your monitoring system (Sentry, DataDog, etc.):

```typescript
// Example: Alert on low cache hit rate
if (cacheHitRate < 50) {
  alert('Geocoding cache hit rate is low: ' + cacheHitRate + '%')
}

// Alert on high failure rate
if (nominatimSuccessRate < 90) {
  alert('Nominatim failure rate high: ' + (100 - nominatimSuccessRate) + '%')
}
```

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ User uploads receipt with address                          │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ Check Redis cache                                          │
│ Key: "geocode:1 goodsprings rd, jean, nv 89019"           │
└─────────────────────────────────────────────────────────────┘
        │                                    │
    CACHE HIT ✅                         CACHE MISS ❌
        │                                    │
        ↓                                    ↓
┌──────────────────┐              ┌──────────────────────────┐
│ Return cached    │              │ Try Nominatim (free!)   │
│ coordinates      │              │ nominatim.osm.org       │
│ (instant!)       │              └──────────────────────────┘
└──────────────────┘                        │
                                    SUCCESS ✅  │  FAIL ❌
                                            │        │
                                            ↓        ↓
                                ┌──────────────────────────┐
                                │ Cache result in Redis    │
                                │ TTL: 24 hours            │
                                └──────────────────────────┘
                                            │
                                            │  IF FAIL:
                                            ↓
                                ┌──────────────────────────┐
                                │ Fallback: Google Maps    │
                                │ (if API key configured)  │
                                └──────────────────────────┘
                                            │
                                    SUCCESS ✅  │  FAIL ❌
                                            │        │
                                            ↓        ↓
                                ┌──────────────────────────┐
                                │ Cache & return           │
                                └──────────────────────────┘
                                            │
                                            │  TOTAL FAIL:
                                            ↓
                                ┌──────────────────────────┐
                                │ Fall back to current GPS │
                                │ Show warning to user     │
                                └──────────────────────────┘
```

---

## File Structure

```
/lib
  /cache
    redis.ts                    ← Redis client with graceful degradation
  geocoding.ts                  ← Basic geocoding (old)
  geocoding-enhanced.ts         ← NEW! Multi-provider with metrics
  
/pages/api
  /location
    correct.ts                  ← NEW! User correction tracking
  /metrics
    geocoding.ts                ← NEW! Monitoring dashboard
    
/migrations
  032_location_corrections.sql  ← NEW! Correction tracking DB
  
/components/capture
  LocationSection.tsx           ← Enhanced with correction tracking
  
/app/(authenticated)/capture/fuel
  page.tsx                      ← Updated to use enhanced geocoding
  
/docs
  ADDRESS_GEOCODING_SYSTEM.md   ← Comprehensive system documentation
  GEOCODING_SYSTEM_SETUP.md     ← This file
```

---

## Cost Breakdown

### Free Tier (Nominatim only)

| Service | Cost | Limits |
|---------|------|--------|
| Nominatim | **FREE** | 1 req/sec |
| In-memory cache | **FREE** | Limited to server memory |
| **Total** | **$0/month** | ∞ requests |

### Recommended (Redis + Nominatim)

| Service | Cost | Limits |
|---------|------|--------|
| Upstash Redis | **FREE** | 10k commands/day |
| Nominatim | **FREE** | 1 req/sec |
| **Total** | **$0/month** | ~300 geocodes/day |

### Production (Redis + Nominatim + Google Fallback)

| Service | Cost | Limits |
|---------|------|--------|
| Redis Cloud | **$5/month** | 30MB |
| Nominatim | **FREE** | 1 req/sec |
| Google Maps | **$5/1000 req** | Only when Nominatim fails |
| **Estimated Total** | **$5-10/month** | 10k+ geocodes/day |

---

## Troubleshooting

### "Redis connection error"

**Solution:**
- Check `REDIS_URL` format: `redis://host:port` or `rediss://...` for TLS
- System will automatically fall back to in-memory cache
- No user-facing impact

### "Nominatim rate limit (429)"

**Solution:**
- Cache is working! Reduce unique addresses
- Enable Google Maps fallback
- Add delay between requests (already handled)

### "All geocoding providers failed"

**Solution:**
- Check network connectivity
- Verify address has street number + state
- System falls back to current GPS (graceful degradation)

### "Cache hit rate very low (<10%)"

**Possible causes:**
- Users uploading receipts from many different stations (expected)
- Cache expiring too quickly (default 24h TTL)
- Redis not connected (check logs)

---

## Next Steps

1. ✅ Install dependencies (`npm install ioredis`)
2. ✅ Set environment variables (`.env.local`)
3. ✅ Run migration (`npm run db:migrate`)
4. ✅ Start Redis (optional, Docker recommended)
5. ✅ Test with real receipts
6. ✅ Monitor metrics (`/api/metrics/geocoding`)
7. ✅ Set up production alerts

---

## Support

- 📖 Full system docs: `/docs/ADDRESS_GEOCODING_SYSTEM.md`
- 🐛 Issues: Track correction patterns in database
- 📊 Metrics: Check `/api/metrics/geocoding` endpoint
- 🔧 Configuration: All settings in `/lib/config/env.ts`

---

**Your geocoding system is production-ready!** 🎉
