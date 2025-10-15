# 🎯 Feature Migration Patterns

**Version:** 1.0.0  
**Last Updated:** October 15, 2025  
**Validated Examples:** 3 (Vehicles, Timeline, Capture)  
**Success Rate:** 100%

---

## 📊 **Overview**

This document captures the proven patterns for migrating features from the legacy structure (`components/{feature}/`) to the feature-first architecture (`features/{feature}/`).

**Results from 3 migrations:**
- ✅ 176 tests created (100% passing)
- ✅ 122+ components migrated
- ✅ 0 breaking changes
- ✅ Build passing consistently
- ✅ Velocity increasing (2.15h → 1.2h → 0.75h)

---

## 🏗️ **Standard Directory Structure**

### **Required Directories:**
```
features/{feature}/
├── __tests__/
│   ├── domain/        # Business logic tests
│   ├── data/          # API/data layer tests (if applicable)
│   └── mocks/         # Shared fixtures
├── ui/                # All React components
└── (optional directories below)
```

### **Optional Directories:**
```
features/{feature}/
├── domain/            # Business logic, types, utilities
├── data/              # API calls, data fetching
└── hooks/             # Feature-specific React hooks
```

**Rule:** Only create directories you need. Not every feature needs `data/` or `domain/`.

---

## 📋 **The 4-Phase Migration Process**

### **Phase 1: Test Infrastructure (30-40 min)**

**Goal:** Create comprehensive tests BEFORE moving any code.

**Steps:**
1. Create test directories:
   ```bash
   mkdir -p features/{feature}/__tests__/domain
   mkdir -p features/{feature}/__tests__/mocks
   ```

2. Generate domain tests:
   - Type validation
   - Business logic
   - Utility functions
   - Flow logic

3. Create mock fixtures:
   - `{feature}-fixtures.ts`
   - Factory functions
   - Reusable test data

4. Validate:
   ```bash
   npm test features/{feature}
   ```

**Success Criteria:**
- ✅ Minimum 20+ tests
- ✅ All tests passing
- ✅ Good coverage of core functionality

**Time:** 30-40 minutes

---

### **Phase 2: Component Migration (20-30 min)**

**Goal:** Move all UI components to `features/{feature}/ui/`.

**Steps:**
1. Create UI structure:
   ```bash
   mkdir -p features/{feature}/ui
   ```

2. Move components (preserving git history):
   ```bash
   git mv components/{feature}/*.tsx features/{feature}/ui/
   ```

3. Organize into subdirectories:
   - `ui/modals/` - Modal dialogs
   - `ui/forms/` - Form components
   - `ui/cards/` - Card components
   - `ui/sections/` - Page sections
   - etc.

4. Update imports:
   ```bash
   # Bulk update
   sed -i '' 's|@/components/{feature}/|@/features/{feature}/ui/|g' **/*.{ts,tsx}
   
   # Verify
   grep -r "@/components/{feature}" app/ features/
   ```

5. Fix internal imports:
   - Change relative imports to absolute
   - Create type exports if needed
   - Import directly from files (not index.ts)

6. Validate:
   ```bash
   npm run build
   ```

**Success Criteria:**
- ✅ Build passing
- ✅ No "Module not found" errors
- ✅ All imports resolved

**Time:** 20-30 minutes

---

### **Phase 3: Domain Logic Migration (15-20 min)**

**Goal:** Move business logic to `features/{feature}/domain/`.

**Steps:**
1. Identify domain code:
   - Types in `lib/domain/`
   - Utilities in `lib/utils/`
   - Business logic in components

2. Create domain directory:
   ```bash
   mkdir -p features/{feature}/domain
   ```

3. Move domain files:
   ```bash
   git mv lib/domain/{feature}-*.ts features/{feature}/domain/
   git mv components/{feature}/types.ts features/{feature}/domain/
   ```

4. Add backward compatibility (if needed):
   ```typescript
   // lib/domain/types.ts
   export { type Vehicle } from '@/features/vehicles/domain/types'
   ```

5. Validate:
   ```bash
   npm test
   npm run build
   ```

**Success Criteria:**
- ✅ All tests passing
- ✅ Build successful
- ✅ No regressions

**Time:** 15-20 minutes

---

### **Phase 4: Validation & Deploy (5-10 min)**

**Goal:** Final checks and deployment.

**Steps:**
1. Run full validation:
   ```bash
   npm test features/{feature}
   npm run build
   npm run arch:validate
   ```

2. Commit with detailed message:
   ```bash
   git add -A
   git commit -m "feat: complete {feature} migration
   
   - {X} tests added (all passing)
   - {Y} components migrated
   - Clean architecture
   - Build passing
   
   Time: {Z} hours"
   ```

3. Deploy:
   ```bash
   git push origin main
   ```

**Success Criteria:**
- ✅ All tests passing
- ✅ Build successful
- ✅ Architecture violations reduced
- ✅ Clean commit history

**Time:** 5-10 minutes

---

## 🎯 **Complexity Assessment**

### **Feature Complexity Levels:**

| Level | Component Count | Structure | Est. Time |
|-------|----------------|-----------|-----------|
| **Low** | < 30 | Flat, simple | 0.5-1h |
| **Medium** | 30-45 | Moderate nesting | 1-1.5h |
| **High** | 45+ | Deep nesting, coupling | 1.5-2h |

### **Indicators of Complexity:**

**Low Complexity:**
- Flat component structure
- Few internal dependencies
- Simple types
- Minimal business logic

**Medium Complexity:**
- Some subdirectories
- Moderate internal imports
- Some business logic
- Feature-specific types

**High Complexity:**
- Deep directory nesting
- Heavy internal coupling
- Complex type dependencies
- Significant business logic
- Multiple internal modules

---

## 📊 **Validated Examples**

### **1. Vehicles (Medium Complexity)**

**Stats:**
- Components: 42
- Tests: 123
- Files: 116
- Time: 2.15 hours

**Structure:**
```
features/vehicles/
├── __tests__/
│   ├── domain/ (4 test files)
│   ├── data/ (6 test files)
│   └── mocks/
├── domain/
│   ├── types.ts
│   └── vehicle-context-builder.ts
├── data/ (repository functions)
├── ui/
│   ├── cards/
│   ├── dialogs/
│   ├── forms/
│   ├── onboarding/
│   └── sections/
└── hooks/
```

**Key Learnings:**
- Comprehensive tests caught bugs early
- Domain types needed careful extraction
- Backward compatibility prevented breaks
- First feature = learning phase

---

### **2. Timeline (High Complexity)**

**Stats:**
- Components: 45
- Tests: 22
- Files: 54
- Time: 1.20 hours (44% faster!)

**Structure:**
```
features/timeline/
├── __tests__/
│   ├── domain/ (2 test files)
│   └── mocks/
├── ui/
│   ├── blocks/ (9 files)
│   ├── card-components/ (13 files)
│   └── event-types/ (13 files)
└── hooks/ (3 hooks)
```

**Challenges:**
- Deep internal coupling
- Required creating types.ts for EventCardData
- Complex import graph

**Key Learnings:**
- Complex features need proper type exports
- Direct file imports > barrel exports
- Pattern replication works even on complex features

---

### **3. Capture (Low-Medium Complexity)**

**Stats:**
- Components: 35
- Tests: 31
- Files: 42
- Time: 0.75 hours (62% faster!)

**Structure:**
```
features/capture/
├── __tests__/
│   ├── domain/ (2 test files)
│   └── mocks/
├── domain/
│   ├── flow-config.ts
│   └── types.ts
├── ui/ (35 components)
│   ├── modals/
│   ├── steps/
│   └── sections/
└── hooks/ (2 hooks)
```

**Key Learnings:**
- Third feature was fastest
- Pattern becoming automatic
- Velocity accelerating with practice
- sed commands work well for bulk updates

---

## 🛠️ **Common Patterns**

### **Test Patterns:**

**Domain Tests:**
```typescript
// {feature}-validation.test.ts
describe('Feature Validation', () => {
  it('should validate input', () => {
    // Test validation logic
  })
})
```

**Mock Fixtures:**
```typescript
// {feature}-fixtures.ts
export const mockItem = {
  id: 'test-1',
  // ... mock data
}

export function createMock(overrides = {}) {
  return { ...mockItem, ...overrides }
}
```

---

### **Import Patterns:**

**Before Migration:**
```typescript
import { Component } from '@/components/feature/Component'
import { util } from './relative/path'
import { Type } from '../../../types'
```

**After Migration:**
```typescript
import { Component } from '@/features/feature/ui/Component'
import { util } from '@/features/feature/domain/util'
import { Type } from '@/features/feature/domain/types'
```

**Key Rules:**
- ✅ Always use absolute imports
- ✅ Import from specific files
- ❌ Avoid barrel exports (index.ts)
- ❌ Avoid relative imports

---

### **Validation Gates:**

**After Phase 1:**
```bash
npm test features/{feature}
# Must see: All tests passing
```

**After Phase 2:**
```bash
npm run build
# Must see: ✓ Compiled successfully
```

**After Phase 3:**
```bash
npm test
npm run build
npm run arch:validate
# Must see: All passing
```

---

## 🚨 **Troubleshooting**

### **Problem: Module not found**

**Symptoms:**
```
Module not found: Can't resolve './Component'
```

**Causes:**
- Relative imports not updated
- Missing exports
- Incorrect paths

**Solutions:**
1. Update to absolute imports
2. Create proper exports in domain/types.ts
3. Import directly from files

---

### **Problem: TypeScript errors**

**Symptoms:**
```
Property 'x' does not exist on type 'Y'
```

**Causes:**
- Types not exported
- Interface incomplete
- Circular dependencies

**Solutions:**
1. Export types from domain/
2. Expand interfaces with all properties
3. Break circular deps with proper layering

---

### **Problem: Tests fail after migration**

**Symptoms:**
```
Cannot find module '@/components/feature'
```

**Causes:**
- Test imports not updated
- Mock paths broken
- jest.config issues

**Solutions:**
1. Update test imports to new paths
2. Check jest.config includes features/
3. Verify mocks are accessible

---

## ⚡ **Velocity Data**

### **Learning Curve:**

| Feature | Time | vs Baseline | Notes |
|---------|------|-------------|-------|
| Vehicles | 2.15h | 100% | Learning pattern |
| Timeline | 1.20h | 56% | Pattern replication |
| Capture | 0.75h | 35% | Mastery |

**Trend:** Exponential improvement 📈

**Projection:** Features 4-5 should take 0.5-0.75h each

---

## 📝 **Quick Command Reference**

### **Setup:**
```bash
mkdir -p features/{feature}/__tests__/domain
mkdir -p features/{feature}/__tests__/mocks
mkdir -p features/{feature}/ui
mkdir -p features/{feature}/domain
```

### **Migration:**
```bash
git mv components/{feature}/*.tsx features/{feature}/ui/
git mv components/{feature}/types.ts features/{feature}/domain/
rm -rf components/{feature}/
```

### **Import Fixes:**
```bash
# Bulk update
sed -i '' 's|@/components/{feature}/|@/features/{feature}/ui/|g' **/*.{ts,tsx}

# Find remaining old imports
grep -r "@/components/{feature}" app/ features/
```

### **Validation:**
```bash
npm test features/{feature} -- --silent
npm run build
npm run arch:validate
```

---

## 🎯 **Success Metrics**

**A migration is successful if:**
- ✅ All tests passing
- ✅ Build successful
- ✅ No breaking changes
- ✅ Architecture improved
- ✅ Time <= estimated

**Quality maintained:**
- ✅ 100% test success rate across 3 features
- ✅ 0 regressions introduced
- ✅ 176 total tests (all passing)
- ✅ Build always passing

---

## 💎 **Key Takeaways**

1. **Tests First** - Always create tests before moving code
2. **Git History** - Use `git mv` to preserve history
3. **Absolute Imports** - Always use `@/features/...`
4. **Validate Early** - Run tests/build after each phase
5. **Learn Fast** - Velocity compounds with practice

**The pattern works. Use it.** ✨
