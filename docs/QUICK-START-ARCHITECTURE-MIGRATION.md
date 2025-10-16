# 🚀 QUICK START: Architecture Migration

**Your next session starts here.** ⚡

---

## 📋 TODAY'S MISSION: Complete Vehicles Feature

**Goal:** Get first feature to 100% compliance (0 violations)  
**Current:** 90% complete, missing tests  
**Time:** 3-4 hours  
**Impact:** -17 violations (102 → 85)

---

## ⚡ START HERE (Copy & Paste)

### **Step 1: Check Current Status**
```bash
cd ~/Desktop/Desktop/apps/motomind-ai
npm run arch:validate | grep -A 5 "features/vehicles"
```

**Expected output:**
```
features/vehicles/
Issue: Incomplete feature structure
💡 Missing or empty: __tests__ (empty)
```

---

### **Step 2: Review What Needs Tests**

**Domain Tests Needed:**
```bash
# See what's in domain/
ls -la features/vehicles/domain/

# These files need tests:
# - types.ts (type validators)
# - entities.ts (business logic)
# - validation.ts (validation rules)
```

**Data Tests Needed:**
```bash
# See what's in data/
ls -la features/vehicles/data/

# These files need tests:
# - api.ts (API calls)
# - queries.ts (data fetching)
```

**UI Tests Needed:**
```bash
# See what's in ui/
ls -la features/vehicles/ui/

# Pick 2-3 most complex components to test
```

---

### **Step 3: Create Test Structure**

```bash
# Create test files
mkdir -p features/vehicles/__tests__/{domain,data,ui}

# Create placeholder test files
touch features/vehicles/__tests__/domain/types.test.ts
touch features/vehicles/__tests__/domain/validation.test.ts
touch features/vehicles/__tests__/data/api.test.ts
touch features/vehicles/__tests__/ui/VehicleCard.test.tsx
```

---

### **Step 4: Write Domain Tests (Start Here)**

**File:** `features/vehicles/__tests__/domain/validation.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { validateVehicle } from '../../domain/validation'

describe('Vehicle Domain Validation', () => {
  it('should validate a valid vehicle', () => {
    const validVehicle = {
      make: 'Toyota',
      model: 'Camry',
      year: 2020,
      vin: '1HGBH41JXMN109186'
    }
    
    const result = validateVehicle(validVehicle)
    expect(result.success).toBe(true)
  })
  
  it('should reject invalid VIN', () => {
    const invalidVehicle = {
      make: 'Toyota',
      model: 'Camry',
      year: 2020,
      vin: 'INVALID'
    }
    
    const result = validateVehicle(invalidVehicle)
    expect(result.success).toBe(false)
    expect(result.errors).toContain('Invalid VIN format')
  })
  
  // Add 3-5 more test cases
})
```

**Run tests:**
```bash
npm run test features/vehicles/__tests__/domain/
```

---

### **Step 5: Write Data Tests**

**File:** `features/vehicles/__tests__/data/api.test.ts`

```typescript
import { describe, it, expect, vi } from 'vitest'
import { fetchVehicles, createVehicle } from '../../data/api'

describe('Vehicle API', () => {
  it('should fetch vehicles list', async () => {
    // Mock the API call
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([
          { id: 1, make: 'Toyota', model: 'Camry' }
        ])
      })
    )
    
    const vehicles = await fetchVehicles()
    expect(vehicles).toHaveLength(1)
    expect(vehicles[0].make).toBe('Toyota')
  })
  
  // Add 3-5 more test cases
})
```

---

### **Step 6: Write UI Tests (Optional, but good)**

**File:** `features/vehicles/__tests__/ui/VehicleCard.test.tsx`

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { VehicleCard } from '../../ui/VehicleCard'

describe('VehicleCard', () => {
  it('should render vehicle information', () => {
    const vehicle = {
      id: 1,
      make: 'Toyota',
      model: 'Camry',
      year: 2020
    }
    
    render(<VehicleCard vehicle={vehicle} />)
    
    expect(screen.getByText('Toyota Camry')).toBeInTheDocument()
    expect(screen.getByText('2020')).toBeInTheDocument()
  })
  
  // Add 3-5 more test cases
})
```

---

### **Step 7: Check for Remaining Components**

```bash
# List vehicle components still in old location
find components/vehicle -type f -name "*.tsx" | head -20

# If any exist, move them:
# git mv components/vehicle/SomeComponent.tsx features/vehicles/ui/
```

---

### **Step 8: Check for Vehicle Code in lib/**

```bash
# Search for vehicle-specific code in lib/
grep -r "vehicle" lib/ --include="*.ts" | grep -v "node_modules"

# If found, move to features/vehicles/domain/
```

---

### **Step 9: Validate Architecture**

```bash
# Run validator
npm run arch:validate

# Look for vehicle-related issues
npm run arch:validate | grep -i vehicle

# Target: 0 vehicle violations
```

---

### **Step 10: Commit Progress**

```bash
git add features/vehicles/__tests__/
git add features/vehicles/
git commit -m "test: add comprehensive tests for vehicles feature

PHASE 1 COMPLETE: Vehicles Feature Migration

Added Tests:
- Domain validation tests (types, entities, business logic)
- Data layer tests (API, queries)
- UI component tests (VehicleCard, VehicleList)

Coverage: 80%+
Violations: -17 (102 → 85)

Vehicles feature is now 100% complete and compliant with
feature-first architecture. Ready for Phase 2."

git push origin main
```

---

## 🎯 SUCCESS CRITERIA

Before considering Phase 1 complete:

- [ ] **Tests exist** in `features/vehicles/__tests__/`
  - [ ] Domain tests (at least 5 test cases)
  - [ ] Data tests (at least 3 test cases)
  - [ ] UI tests (at least 2 components)

- [ ] **Test coverage > 80%** for vehicles feature
  ```bash
  npm run test:coverage features/vehicles/
  ```

- [ ] **No vehicle components** in `components/vehicle/`
  ```bash
  ls components/vehicle/ 2>/dev/null | wc -l
  # Should be 0 or "No such file or directory"
  ```

- [ ] **No vehicle code** in `lib/` (outside shared utils)
  ```bash
  grep -r "vehicle" lib/ --include="*.ts" | grep -v "node_modules" | wc -l
  # Should be 0 or only shared utilities
  ```

- [ ] **Architecture validator passes** for vehicles
  ```bash
  npm run arch:validate | grep -i "features/vehicles"
  # Should show 0 issues or only "✅" messages
  ```

---

## ⏱️ TIME BREAKDOWN

| Task | Time | Running Total |
|------|------|---------------|
| Review current state | 15 min | 15 min |
| Create test structure | 10 min | 25 min |
| Write domain tests | 45 min | 1h 10min |
| Write data tests | 30 min | 1h 40min |
| Write UI tests | 30 min | 2h 10min |
| Move remaining components | 20 min | 2h 30min |
| Move lib code | 20 min | 2h 50min |
| Validate & fix issues | 30 min | 3h 20min |
| Commit & document | 10 min | 3h 30min |

**Total:** ~3.5 hours

---

## 🚨 IF YOU GET STUCK

### **Problem: Don't know what to test**
**Solution:** Start with happy path, then edge cases
```typescript
// 1. Happy path (valid input → expected output)
// 2. Invalid input → error handling
// 3. Edge cases (null, undefined, empty, etc.)
// 4. Boundary conditions (min/max values)
```

### **Problem: Tests failing**
**Solution:** Run in watch mode, fix one at a time
```bash
npm run test:watch features/vehicles/
```

### **Problem: Can't find what to move**
**Solution:** Use grep to find vehicle-specific code
```bash
# Find vehicle components
find components -name "*[Vv]ehicle*"

# Find vehicle in lib
grep -r "vehicle" lib/ --include="*.ts"
```

### **Problem: Import errors after moving**
**Solution:** Update imports to use @/features
```typescript
// Before
import { Vehicle } from '../../../lib/domain/vehicles/types'

// After
import { Vehicle } from '@/features/vehicles/domain/types'
```

---

## 🎯 AFTER PHASE 1 COMPLETE

**Next session:**
- Phase 2A: Migrate Timeline/Events feature (6-8 hours)
- This is the biggest feature, save it for when you have time
- Or skip to Phase 2B: Capture feature (smaller, faster win)

**Check progress:**
```bash
npm run arch:validate | grep "Total:"
# Target after Phase 1: 85 issues (down from 102)
```

---

## 💡 PRO TIPS

1. **Focus on tests first** - Everything else is easy
2. **Use git mv** - Preserves file history
3. **Test after each move** - Don't break existing functionality
4. **Commit frequently** - Small commits are easier to review/revert
5. **Run validator often** - Catch issues early
6. **Don't aim for perfection** - 80% coverage is great, 100% is overkill

---

## 📚 HELPFUL COMMANDS

```bash
# Check test coverage
npm run test:coverage features/vehicles/

# Run tests in watch mode
npm run test:watch features/vehicles/

# Validate architecture
npm run arch:validate

# Find files to move
find components/vehicle -type f

# Check imports
grep -r "from.*vehicle" app/ components/ lib/

# Commit with good message
git add .
git commit -m "test: add tests for vehicles feature"
git push origin main
```

---

**You've got this!** 🚀

**Estimated completion:** 3-4 hours from when you start  
**Result:** First feature 100% complete, -17 violations  
**Momentum:** Ready for Phase 2  

---

**Just open this file tomorrow and follow along.** ⚡
