# 🐛 VIN Data Normalization Issues - FOUND!

**Date:** October 19, 2025  
**VIN Tested:** 2C3CCADG7NH116370 (2022 Chrysler 300)

---

## 🚨 ISSUES FOUND

### 1. **Trim Field Contains "Not Applicable"** ❌
**Current Output:**
```
trim: "Touring L LX Not Applicable"
```

**Should Be:**
```
trim: "Touring L LX"
```

**Problem:** Line 159 in `decoder.ts` assigns raw `trim` without cleaning  
**Fix:** Clean trim before assigning to result

---

### 2. **Body Type Not Normalized** ❌
**Current Output:**
```
bodyType: "Sedan/Saloon"
```

**Should Be:**
```
bodyType: "Sedan"
```

**Problem:** Raw `bodyType` assigned on line 161, then normalized  
**Issue:** The normalization happens BUT raw value shown in UI

---

### 3. **Engine Has Double "L"** ❌
**Current Output:**
```
engine: "3.6LL 6-Cyl"
```

**Should Be:**
```
engine: "3.6L 6-Cyl"
```

**Problem:** NHTSA returns "3.6LL", we don't clean it  
**Fix:** Add engine normalization

---

### 4. **Doors Shows "Doors" Suffix** ❌
**Current Output:**
```
doors: "4 Doors"
```

**Should Be:**
```
doors: "4"
```

**Problem:** `normalizeDoors` is called but UI shows raw value  
**Issue:** Frontend not using normalized value

---

### 5. **Safety Features Show Raw Text** ❌
**Current Output:**
```
absType: "(not equipped)"
blindSpotWarning: null
forwardCollisionWarning: null
laneDepartureWarning: "(Optional)"
```

**Should Be:**
```
absType: undefined
blindSpotWarning: undefined
forwardCollisionWarning: undefined
laneDepartureWarning: "Optional"
```

**Problem:** `normalizeSafetyFeature` doesn't handle `(not equipped)`  
**Fix:** Update normalizer to handle parentheses

---

### 6. **Make Not Title Cased Consistently** ⚠️
**Current Output:**
```
make: "CHRYSLER"
```

**Should Be:**
```
make: "Chrysler"
```

**Problem:** Raw make is uppercase, needs title case  
**Fix:** Apply titleCase to make

---

## 🔧 ROOT CAUSES

### Root Cause 1: Raw Values Assigned to Result
**Location:** `lib/vin/decoder.ts` lines 157-166

```typescript
const result: VINDecodeResult = {
  vin,
  vehicle: { 
    year, 
    make,        // ❌ Raw uppercase
    model,       // ❌ Raw
    trim,        // ❌ Raw with "Not Applicable"
    displayName  // ✅ This is cleaned
  },
  specs: {
    bodyType: normalizeBodyType(bodyType),  // ❌ Normalized but...
    engine,      // ❌ Raw with "LL"
    // ...
  }
}
```

**Issue:** We normalize SOME fields but not others

---

### Root Cause 2: Normalizer Doesn't Handle All Cases
**Location:** `lib/vin/normalizer.ts`

```typescript
export function normalizeSafetyFeature(value?: string): string | undefined {
  if (!value) return undefined
  
  const normalized = value.trim()
  
  // Convert "Not Applicable" to undefined
  if (normalized.toLowerCase() === 'not applicable') {
    return undefined
  }
  // ❌ BUT doesn't handle "(not equipped)" or "(Optional)"
}
```

---

### Root Cause 3: No Engine Normalizer
**Missing:** Function to clean engine strings

Need to add:
```typescript
export function normalizeEngine(engine?: string): string | undefined {
  if (!engine) return undefined
  
  return engine
    .replace(/LL/g, 'L')  // Fix double L
    .replace(/\s+/g, ' ')  // Normalize spaces
    .trim()
}
```

---

## ✅ FIXES NEEDED

### Fix 1: Clean Trim Before Assignment
**File:** `lib/vin/decoder.ts` line 159

```typescript
// BEFORE:
vehicle: { year, make, model, trim, displayName },

// AFTER:
vehicle: { 
  year, 
  make: titleCase(make),
  model: model,
  trim: cleanTrim(trim),
  displayName 
},
```

Add helper:
```typescript
function cleanTrim(trim?: string): string | undefined {
  if (!trim) return undefined
  
  return trim
    .replace(/Not Applicable/gi, '')
    .replace(/\s+/g, ' ')
    .trim() || undefined
}
```

---

### Fix 2: Add Engine Normalizer
**File:** `lib/vin/normalizer.ts`

```typescript
/**
 * Normalize engine string
 */
export function normalizeEngine(engine?: string): string | undefined {
  if (!engine) return undefined
  
  return engine
    .replace(/LL/g, 'L')           // Fix double L (3.6LL → 3.6L)
    .replace(/\s{2,}/g, ' ')        // Multiple spaces → single
    .replace(/L\s+/g, 'L ')         // Normalize space after L
    .trim()
}
```

---

### Fix 3: Enhance Safety Feature Normalizer
**File:** `lib/vin/normalizer.ts`

```typescript
export function normalizeSafetyFeature(value?: string): string | undefined {
  if (!value) return undefined
  
  const trimmed = value.trim()
  
  // Remove if "Not Applicable", "(not equipped)", or empty
  if (
    trimmed === '' ||
    trimmed.toLowerCase() === 'not applicable' ||
    trimmed.toLowerCase() === '(not equipped)' ||
    trimmed.toLowerCase() === 'not equipped'
  ) {
    return undefined
  }
  
  // Remove parentheses from valid values
  const cleaned = trimmed.replace(/[()]/g, '').trim()
  
  // Normalize common values
  const safetyMap: Record<string, string> = {
    'STANDARD': 'Yes',
    'OPTIONAL': 'Optional',
    'NOT AVAILABLE': undefined,
    // ... rest
  }
  
  const upper = cleaned.toUpperCase()
  return safetyMap[upper] !== undefined ? safetyMap[upper] : titleCase(cleaned)
}
```

---

### Fix 4: Apply Normalizers in Decoder
**File:** `lib/vin/decoder.ts`

```typescript
// Import new normalizer
import {
  // ... existing imports
  normalizeEngine,  // ✅ ADD THIS
} from './normalizer'

// In result building (line 157):
const result: VINDecodeResult = {
  vin,
  vehicle: { 
    year, 
    make: titleCase(make),               // ✅ Title case
    model,
    trim: cleanTrim(trim),                // ✅ Clean
    displayName 
  },
  specs: {
    bodyType: normalizeBodyType(bodyType),
    engine: normalizeEngine(engine),       // ✅ Normalize
    transmission: normalizeTransmission(transmission),
    driveType: normalizeDriveType(driveType),
    fuelType: normalizeFuelType(fuelType)
  },
  // ... rest
}
```

---

## 🧪 EXPECTED OUTPUT AFTER FIXES

**Before:**
```json
{
  "vehicle": {
    "make": "CHRYSLER",
    "trim": "Touring L LX Not Applicable"
  },
  "specs": {
    "bodyType": "Sedan/Saloon",
    "engine": "3.6LL 6-Cyl"
  },
  "extendedSpecs": {
    "doors": "4 Doors",
    "absType": "(not equipped)",
    "laneDepartureWarning": "(Optional)"
  }
}
```

**After:**
```json
{
  "vehicle": {
    "make": "Chrysler",
    "trim": "Touring L LX"
  },
  "specs": {
    "bodyType": "Sedan",
    "engine": "3.6L 6-Cyl"
  },
  "extendedSpecs": {
    "doors": "4",
    "absType": undefined,
    "laneDepartureWarning": "Optional"
  }
}
```

---

## 📋 CHECKLIST

- [ ] Add `normalizeEngine` function to normalizer
- [ ] Add `cleanTrim` helper function to decoder
- [ ] Update `normalizeSafetyFeature` to handle parentheses
- [ ] Apply `titleCase` to make
- [ ] Apply `normalizeEngine` to engine
- [ ] Apply `cleanTrim` to trim
- [ ] Test with VIN: 2C3CCADG7NH116370
- [ ] Verify all fields clean

---

## 🎯 PRIORITY

**P0 - Fix Now:**
1. Trim cleaning (user-facing)
2. Engine normalization (looks unprofessional)
3. Safety features (confusing)

**P1 - Fix Soon:**
4. Make title case (consistency)
5. Body type (already normalized, just UI issue)

---

**Status:** Issues documented, fixes identified, ready to implement! 🔧
