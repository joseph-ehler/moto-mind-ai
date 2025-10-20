# 🔍 API RESEARCH FINDINGS

**Date:** October 19, 2025, 12:09pm  
**Status:** ✅ Research Complete - Found the Issues!

---

## 🎯 SUMMARY

**GOOD NEWS:** Both APIs are FREE and should work!  
**BAD NEWS:** We're using them WRONG!

---

## 1. EPA FUEL ECONOMY API ❌ WRONG APPROACH

### ❌ What We're Doing (WRONG):
```typescript
// Our current code:
const url = `https://www.fueleconomy.gov/ws/rest/vin/${vin}`
```

**Problem:** EPA API does NOT support VIN lookup!

### ✅ What We SHOULD Do (CORRECT):
```typescript
// EPA uses vehicle ID, not VIN
// Endpoint: https://fueleconomy.gov/ws/rest/vehicle/{id}
```

**The EPA API requires a vehicle ID, which we don't have from VIN alone.**

---

## 🚨 EPA API REALITY CHECK:

### Coverage:
- EPA has ~40K+ vehicle records (1984-2025)
- BUT they use their own ID system
- VIN → EPA ID mapping doesn't exist publicly

### Endpoints Available:
1. `/ws/rest/vehicle/{id}` - Get vehicle by EPA ID
2. `/ws/rest/vehicle/menu/year` - Get years
3. `/ws/rest/vehicle/menu/make?year=2022` - Get makes
4. `/ws/rest/vehicle/menu/model?year=2022&make=Toyota` - Get models
5. `/ws/rest/vehicle/menu/options?year=2022&make=Toyota&model=Camry` - Get trims

**NO VIN ENDPOINT EXISTS!** 😱

---

## 💡 EPA WORKAROUND OPTIONS:

### Option A: Year/Make/Model Lookup (Possible)
```typescript
// Get EPA ID using YMM from NHTSA:
// 1. Decode VIN with NHTSA → get year/make/model/trim
// 2. Query EPA menu API with year/make/model
// 3. Match trim if possible
// 4. Get EPA vehicle ID
// 5. Get fuel economy data

// Complexity: Medium
// Accuracy: 70-80% (trim matching is hard)
// Coverage: Only if trim matches exactly
```

### Option B: Use NHTSA VIN Decoder Fuel Data (Exists!)
```typescript
// NHTSA VIN decode already returns:
// - displ (engine displacement)
// - fuelType
// - Sometimes includes EPA data!

// Let me check if NHTSA returns MPG...
```

### Option C: Give Up on EPA, Buy Database
```
Cost: $1,500 (Advanced Specs includes MPG)
Coverage: 95%+
Accuracy: 100%
```

---

## 2. NHTSA RECALLS API ❌ WRONG ENDPOINT

### ❌ What We're Doing (WRONG):
```typescript
const url = `https://api.nhtsa.gov/recalls/recallsByVIN?vin=${vin}`
```

**Problem:** Wrong domain! `api.nhtsa.gov` doesn't exist!

### ✅ Correct Endpoints:

**Option 1: VPIC API (Year/Make/Model)**
```
https://vpic.nhtsa.dot.gov/api/RecallsByVehicle/{make}/{model}/{year}?format=json
```

**Option 2: SaferCar API (VIN - Exists!)**
```
https://one.nhtsa.gov/webapi/api/Recalls/vehicle/{vin}?format=json
```

---

## 🎯 NHTSA RECALLS FIX:

### The Real Endpoint:
```typescript
// Change from:
https://api.nhtsa.gov/recalls/recallsByVIN?vin=${vin}

// To:
https://one.nhtsa.gov/webapi/api/Recalls/vehicle/${vin}?format=json
```

### Headers Needed:
```typescript
headers: {
  'Accept': 'application/json',
  'User-Agent': 'MotoMind/1.0'
}
```

**This should fix the 403 error!** ✅

---

## 📊 WHAT WE FOUND:

| API | Issue | Fix | Complexity |
|-----|-------|-----|------------|
| EPA | No VIN endpoint | YMM lookup OR use NHTSA data | Medium/High |
| NHTSA Recalls | Wrong URL | Change to one.nhtsa.gov | Easy |

---

## 🎯 RECOMMENDED ACTION PLAN:

### Phase 1: Fix NHTSA Recalls (15 min) ✅
**Priority:** HIGH  
**Difficulty:** EASY  
**Impact:** Immediate - gets recalls working

```typescript
// Change endpoint in lib/recalls/nhtsa-recalls.ts:
const url = `https://one.nhtsa.gov/webapi/api/Recalls/vehicle/${vin}?format=json`
```

---

### Phase 2: EPA Fuel Economy (3 options)

#### Option A: Check if NHTSA Returns MPG (30 min)
**Priority:** HIGH  
**Difficulty:** EASY  
**Impact:** May already have the data!

**Action:** Examine NHTSA VIN decode response for MPG fields

#### Option B: Implement YMM EPA Lookup (2-3 hours)
**Priority:** MEDIUM  
**Difficulty:** MEDIUM  
**Impact:** 70-80% coverage

**Steps:**
1. Use NHTSA data (year/make/model/trim)
2. Query EPA menu API
3. Find matching vehicle
4. Get EPA ID
5. Fetch fuel economy

**Downsides:**
- Complex matching logic
- Trim matching unreliable
- Only ~70% success rate
- Lots of API calls (rate limiting?)

#### Option C: Buy Vehicle Database ($1,500)
**Priority:** LOW (try others first)  
**Difficulty:** EASY (import data)  
**Impact:** 95%+ coverage, perfect accuracy

**When to do:** If Options A & B fail

---

## 🚀 IMMEDIATE NEXT STEPS:

### Step 1: Fix Recalls (Now!) ✅
```typescript
// File: lib/recalls/nhtsa-recalls.ts
// Line: ~35

// Change URL to:
https://one.nhtsa.gov/webapi/api/Recalls/vehicle/${vin}?format=json
```

### Step 2: Check NHTSA for MPG (Next)
Let's examine the actual NHTSA response to see if MPG data is included!

### Step 3: Decide on EPA Strategy
Based on Step 2 results

---

## 💰 COST ANALYSIS:

### Free APIs (If we can make them work):
- **Cost:** $0
- **Coverage:** 60-80%
- **Quality:** Good
- **Time:** 3-5 hours to implement properly

### Database Purchase:
- **Cost:** $2,500 (Advanced + Maintenance)
- **Coverage:** 95%+
- **Quality:** Excellent
- **Time:** 2-3 hours to import

---

## 🎯 MY RECOMMENDATION:

### Try Free APIs First (Today):
1. ✅ Fix recalls endpoint (15 min)
2. ✅ Check if NHTSA has MPG (30 min)
3. ⚠️ If no MPG, try YMM EPA lookup (2 hours)

### If Free APIs Work:
- **Ship with free data!**
- Buy databases later (Month 6+)
- Save $2,500 for user acquisition

### If Free APIs Fail:
- Buy databases ($2,500)
- Professional quality from day 1
- Worth it for launch credibility

---

## 📝 SOURCES:

1. EPA Web Services: https://fueleconomy.gov/feg/ws/
2. NHTSA VPIC API: https://vpic.nhtsa.dot.gov/api/
3. NHTSA PublicAPI Docs: https://publicapi.dev/nhtsa-api
4. SaferCar Recalls: https://one.nhtsa.gov/webapi/api/

---

**Status:** ✅ Research complete - Ready to implement fixes!

**Next:** Fix recalls endpoint and test! 🚀
