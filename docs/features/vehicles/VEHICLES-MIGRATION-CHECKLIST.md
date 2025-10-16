# 🚗 VEHICLES FEATURE MIGRATION - EXECUTION CHECKLIST

**Goal:** Complete vehicles feature to 100% compliance  
**Timeline:** Monday-Wednesday (15 hours)  
**Target:** 102 → 85 violations (-17)

---

## ✅ **PHASE 1: ADD TESTS (6 HOURS)**

### **Step 1.1: Domain Tests (2 hours)**
Location: `features/vehicles/__tests__/domain/`

- [ ] **types.test.ts** - Test Vehicle type validation
  ```bash
  # Tests to add:
  - Valid vehicle creation
  - Invalid VIN format
  - Missing required fields
  - Year boundary cases (1900-2025)
  - Invalid color values
  ```

- [ ] **vehicle-context-builder.test.ts** - Test AI context generation
  ```bash
  # Tests to add:
  - Context builder generates correct format
  - Handles missing data gracefully
  - Includes relevant vehicle history
  - Sanitizes sensitive data
  ```

- [ ] **fleet-rules.test.ts** - Test fleet business logic
  ```bash
  # Tests to add:
  - Fleet assignment rules
  - Vehicle categorization
  - Fleet-level validations
  ```

### **Step 1.2: Data Layer Tests (2 hours)**
Location: `features/vehicles/__tests__/data/`

- [ ] **createVehicle.test.ts** - Test vehicle creation
  ```bash
  # Tests to add:
  - Successful vehicle creation
  - Duplicate VIN handling
  - Database error handling
  - Auth validation
  ```

- [ ] **getVehicle.test.ts** - Test vehicle retrieval
  ```bash
  # Tests to add:
  - Get vehicle by ID
  - Vehicle not found (404)
  - Unauthorized access (403)
  - Soft-deleted vehicles
  ```

- [ ] **list.test.ts** - Test vehicle listing
  ```bash
  # Tests to add:
  - Paginated listing
  - Filtering by garage
  - Search functionality
  - Sorting options
  ```

- [ ] **decode-vin.test.ts** - Test VIN decoder
  ```bash
  # Tests to add:
  - Valid VIN decoding
  - Invalid VIN format
  - NHTSA API failure handling
  - Rate limiting
  ```

### **Step 1.3: Mock Data Setup (1 hour)**
Location: `features/vehicles/__tests__/mocks/`

- [ ] **vehicle-mocks.ts** - Create test fixtures
  ```typescript
  export const mockValidVehicle = { ... }
  export const mockInvalidVehicle = { ... }
  export const mockVehicleList = [ ... ]
  export const mockVehicleWithHistory = { ... }
  ```

- [ ] **api-mocks.ts** - Mock API responses
  ```typescript
  export const mockNHTSAResponse = { ... }
  export const mockSupabaseResponse = { ... }
  ```

### **Step 1.4: Run Tests & Validate (1 hour)**

- [ ] Run all tests: `npm test features/vehicles`
- [ ] Check coverage: `npm run test:coverage -- features/vehicles`
- [ ] Target: 80% coverage minimum
- [ ] Fix failing tests

**Expected Result:** 80%+ test coverage for vehicles feature ✅

---

## ✅ **PHASE 2: MIGRATE COMPONENTS (6 HOURS)**

### **Step 2.1: Create UI Structure (30 min)**

- [ ] Create `features/vehicles/ui/` directory
- [ ] Create subdirectories:
  ```bash
  ui/
    cards/       # Card components
    dialogs/     # Modal/dialog components
    forms/       # Form components
    sections/    # Section components
    onboarding/  # Onboarding flows
  ```

### **Step 2.2: Move Core Vehicle Components (2 hours)**

From `components/vehicle/` → `features/vehicles/ui/`

- [ ] **VehicleHeader.tsx** → `ui/VehicleHeader.tsx`
- [ ] **VehicleEditForm.tsx** → `ui/forms/VehicleEditForm.tsx`
- [ ] **VehicleRow.tsx** → `ui/cards/VehicleRow.tsx`
- [ ] **VehiclePlaceholder.tsx** → `ui/VehiclePlaceholder.tsx`
- [ ] **VehicleDetailsSkeleton.tsx** → `ui/VehicleDetailsSkeleton.tsx`
- [ ] **VehicleContextMenu.tsx** → `ui/VehicleContextMenu.tsx`

**Commands:**
```bash
# Move files with git to preserve history
cd features/vehicles
mkdir -p ui/cards ui/dialogs ui/forms ui/sections ui/onboarding

git mv ../../components/vehicle/VehicleHeader.tsx ui/
git mv ../../components/vehicle/VehicleEditForm.tsx ui/forms/
git mv ../../components/vehicle/VehicleRow.tsx ui/cards/
# ... etc
```

### **Step 2.3: Move Dialog Components (1 hour)**

- [ ] **DeleteVehicleDialog.tsx** → `ui/dialogs/DeleteVehicleDialog.tsx`
- [ ] **EditVehicleModal.tsx** → `ui/dialogs/EditVehicleModal.tsx`
- [ ] **VehicleAIChatModal.tsx** → `ui/dialogs/VehicleAIChatModal.tsx`
  - [ ] Delete old versions (.v2, .v3, .clean, .final)
  - [ ] Keep only the production version

### **Step 2.4: Move Onboarding Components (1 hour)**

- [ ] **VehicleGarageSelector.tsx** → `ui/onboarding/GarageSelector.tsx`
- [ ] **VehiclePhotoUpload.tsx** → `ui/onboarding/PhotoUpload.tsx`

### **Step 2.5: Move Health Section (30 min)**

- [ ] **VehicleHealthCard.tsx** → `ui/sections/HealthCard.tsx`

### **Step 2.6: Update Imports (1 hour)**

- [ ] Search all files importing from `components/vehicle/`
- [ ] Update to `@/features/vehicles/ui/`
- [ ] Run TypeScript check: `npm run type-check`
- [ ] Fix any broken imports

**Command:**
```bash
# Find all files importing vehicle components
grep -r "from.*components/vehicle" --include="*.tsx" --include="*.ts"

# Update imports (do this manually or with find/replace)
# Old: import { VehicleHeader } from '@/components/vehicle/VehicleHeader'
# New: import { VehicleHeader } from '@/features/vehicles/ui/VehicleHeader'
```

**Expected Result:** All vehicle UI components in `features/vehicles/ui/` ✅

---

## ✅ **PHASE 3: MIGRATE DOMAIN LOGIC (3 HOURS)**

### **Step 3.1: Move Vehicle-Specific Domain Code (1.5 hours)**

From `lib/` → `features/vehicles/domain/`

- [ ] **lib/ai/vehicle-context-builder.ts** → `domain/vehicle-context-builder.ts`
- [ ] **lib/domain/types.ts** (Vehicle types only) → `domain/types.ts`
  - Extract Vehicle, VehicleStatus, VehicleCategory types
  - Leave shared types in lib/domain/types.ts

### **Step 3.2: Create Domain Index (30 min)**

- [ ] Create `features/vehicles/domain/index.ts`
  ```typescript
  // Barrel export for clean imports
  export * from './types'
  export * from './vehicle-context-builder'
  export * from './fleet-rules'
  ```

### **Step 3.3: Update Domain Imports (1 hour)**

- [ ] Find all imports from `lib/ai/vehicle-context-builder`
- [ ] Update to `@/features/vehicles/domain`
- [ ] Find all imports of Vehicle types from `lib/domain/types`
- [ ] Update to `@/features/vehicles/domain/types`
- [ ] Run TypeScript check

**Expected Result:** Vehicle domain logic isolated in feature ✅

---

## ✅ **VALIDATION & CLEANUP (30 MIN)**

### **Step 4.1: Run Architecture Validator**

```bash
npm run arch:validate
```

**Expected violations:**
- Before: 102 total
- After: ~85 total (-17 from vehicles cleanup)

### **Step 4.2: Run Tests**

```bash
npm test features/vehicles
```

**Expected:** All tests passing ✅

### **Step 4.3: Type Check**

```bash
npm run type-check
```

**Expected:** No TypeScript errors ✅

### **Step 4.4: Build Check**

```bash
npm run build
```

**Expected:** Clean build ✅

---

## 🚀 **DEPLOY**

### **Step 5: Commit & Deploy**

```bash
# Commit the migration
git add .
git commit -m "feat: complete vehicles feature migration

TRANSFORMATIVE: Phase 1 Complete

Migrated vehicles to feature-first architecture:
- Added 80% test coverage (domain + data + UI)
- Moved all vehicle components to features/vehicles/ui/
- Isolated vehicle domain logic
- 102 → 85 architecture violations (-17)

Structure:
features/vehicles/
  __tests__/      # Comprehensive test suite
  domain/         # Business logic & types
  data/           # API & data access
  ui/             # All vehicle components

Next: Build Architecture Intelligence (Thu-Fri)
"

# Deploy
npm run deploy "feat: vehicles feature migration complete"
```

---

## 📊 **SUCCESS METRICS**

After completion, you should have:

✅ **Test Coverage:** 80%+ for vehicles feature  
✅ **Architecture:** 102 → 85 violations (-17)  
✅ **Structure:** Complete feature-first organization  
✅ **No Errors:** TypeScript, build, runtime all passing  
✅ **Deployed:** Changes live in production  

---

## ⏱️ **TIME BREAKDOWN**

| Phase | Task | Time |
|-------|------|------|
| 1 | Domain tests | 2h |
| 1 | Data tests | 2h |
| 1 | Mock setup + validation | 2h |
| 2 | Create structure | 0.5h |
| 2 | Move components | 4h |
| 2 | Update imports | 1.5h |
| 3 | Move domain logic | 1.5h |
| 3 | Domain index | 0.5h |
| 3 | Update domain imports | 1h |
| 4 | Validation & cleanup | 0.5h |
| **Total** | | **15h** |

---

## 🎯 **READY TO START?**

**First task:** Add domain tests (2 hours)

Run this to get started:
```bash
mkdir -p features/vehicles/__tests__/domain
touch features/vehicles/__tests__/domain/types.test.ts
```

Then start writing tests! 🚀
