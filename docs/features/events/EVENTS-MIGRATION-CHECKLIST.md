# 🎯 EVENTS FEATURE MIGRATION - EXECUTION CHECKLIST

**Complexity:** LOW  
**Estimated Time:** 0.5-1 hour  
**Similar To:** capture  
**Components:** 21  
**Total Files:** 21

---

## ⚠️  **PRE-MIGRATION ANALYSIS**


### **Recommendations:**
- ✅ Straightforward migration - follow standard 4-phase process
- ✅ Should be fastest migration yet (based on capture pattern)

---

## ✅ **PHASE 1: TEST INFRASTRUCTURE (30 MIN)**

**Goal:** Create comprehensive tests before moving any code.

### **Step 1.1: Create Test Directories (5 min)**
```bash
cd features/events
mkdir -p __tests__/domain __tests__/mocks

```

### **Step 1.2: Generate Domain Tests (15 min)**

Create test files based on complexity:

**Required:**
- [ ] `__tests__/domain/events-validation.test.ts` - Input validation
- [ ] `__tests__/domain/events-types.test.ts` - Type checking



**Example test pattern (from capture):**
```typescript
describe('Events Validation', () => {
  it('should validate required fields', () => {
    // Test validation logic
  })
})
```

### **Step 1.3: Create Mock Fixtures (5 min)**
```bash
# Create fixtures file
touch __tests__/mocks/events-fixtures.ts
```

**Mock pattern:**
```typescript
export const mockEvents = {
  id: 'test-1',
  // ... mock data
}

export function createMock(overrides = {}) {
  return { ...mockEvents, ...overrides }
}
```

### **Step 1.4: Run Tests (5 min)**
```bash
npm test features/events -- --silent
```

**Success Criteria:**
- ✅ Minimum 20+ tests
- ✅ All tests passing
- ✅ Good coverage

### **Step 1.5: Commit**
```bash
git add features/events/__tests__
git commit -m "test: add events feature tests (Phase 1)

- Domain tests created
- Mock fixtures ready
- X tests passing

Next: Component migration"
```

---

## ✅ **PHASE 2: COMPONENT MIGRATION (20 MIN)**

**Goal:** Move all UI components to `features/events/ui/`.

### **Step 2.1: Create UI Structure (2 min)**
```bash
cd features/events
mkdir -p ui

```

### **Step 2.2: Move Components (10 min)**
```bash
# Move all components (preserving git history)
git mv components/events/*.tsx features/events/ui/


```

### **Step 2.3: Move Domain Files (3 min)**
```bash
# Move types and configuration
git mv components/events/types.ts features/events/domain/ 2>/dev/null || true

# Move hooks if they exist
mkdir -p features/events/hooks 2>/dev/null || true
```

### **Step 2.4: Clean Up (1 min)**
```bash
# Remove old directory
rm -rf components/events/
```

### **Step 2.5: Update Imports (14 min)**
```bash
# Bulk update imports
find app/ features/ lib/ -name "*.ts" -o -name "*.tsx" | \
  xargs sed -i '' "s|@/components/events/|@/features/events/ui/|g"

# Check for remaining old imports
grep -r "@/components/events" app/ features/ lib/ --include="*.ts" --include="*.tsx"
```



### **Step 2.7: Build & Validate (2 min)**
```bash
npm run build
```

**Success Criteria:**
- ✅ Build passing
- ✅ No "Module not found" errors
- ✅ All imports resolved

### **Step 2.8: Commit**
```bash
git add -A
git commit -m "feat: migrate events components (Phase 2)

- 21 components migrated
- Organized into features/events/ui/
- All imports updated
- Build passing

Next: Domain logic migration"
```

---

## ✅ **PHASE 3: DOMAIN LOGIC MIGRATION (15 MIN)**

**Goal:** Move business logic to `features/events/domain/`.

### **Step 3.1: Identify Domain Code (5 min)**
```bash
# Search for events-related code in lib/
grep -r "events" lib/ --include="*.ts" | grep -v node_modules
```

### **Step 3.2: Move Domain Files (5 min)**

If found, move to domain/:
```bash
# Example moves (adjust based on what you find)
git mv lib/domain/events-*.ts features/events/domain/ 2>/dev/null || true
git mv lib/utils/events-*.ts features/events/domain/ 2>/dev/null || true
```

### **Step 3.3: Add Backward Compatibility (3 min)**

If you moved shared types, add re-exports:
```typescript
// lib/domain/types.ts (if types were moved)
export { type FeatureType } from '@/features/events/domain/types'
```

### **Step 3.4: Update Domain Imports (2 min)**
```bash
# Update imports to new domain location
find app/ features/ -name "*.ts" -o -name "*.tsx" | \
  xargs sed -i '' "s|@/lib/domain/events|@/features/events/domain|g"
```

### **Step 3.5: Validate (5 min)**
```bash
npm test
npm run build
```

**Success Criteria:**
- ✅ All tests passing
- ✅ Build successful  
- ✅ No regressions

### **Step 3.6: Commit**
```bash
git add -A
git commit -m "feat: migrate events domain logic (Phase 3)

- Domain logic isolated
- Backward compatibility maintained
- All tests passing

Next: Final validation"
```

---

## ✅ **PHASE 4: VALIDATION & DEPLOY (10 MIN)**

### **Step 4.1: Run Full Test Suite (3 min)**
```bash
npm test features/events
npm test  # Full suite
```

### **Step 4.2: Build Verification (2 min)**
```bash
npm run build
```

### **Step 4.3: Architecture Validation (2 min)**
```bash
npm run arch:validate
```

### **Step 4.4: Final Commit & Push (3 min)**
```bash
git add -A
git commit -m "feat: complete events feature migration

EVENTS feature successfully migrated following proven pattern.

PHASE 1: TESTS ✅
- X tests created (all passing)
- Domain validation comprehensive
- Mock fixtures reusable

PHASE 2: COMPONENTS ✅
- 21 components migrated
- Organized into features/events/ui/
- All imports updated
- Build passing

PHASE 3: DOMAIN ✅
- Domain logic isolated
- Types organized
- Backward compatibility maintained

RESULTS:
✅ X tests passing
✅ Build successful
✅ Architecture improved
✅ 0 breaking changes

Time: 0.5-1 hour
Complexity: LOW
Pattern: Validated

Progress: X/12 features complete"

git push origin main
```

---

## 📊 **SUCCESS CRITERIA**

### **Migration is successful if:**
- ✅ All tests passing (100%)
- ✅ Build successful
- ✅ No breaking changes
- ✅ Time <= 0.5-1 hour
- ✅ Architecture violations reduced

### **Quality metrics:**
- ✅ Test coverage maintained
- ✅ Import paths clean
- ✅ Component organization logical
- ✅ Domain logic isolated

---

## 🚨 **TROUBLESHOOTING**

### **Problem: Module not found**
**Solution:** Check for relative imports, convert to absolute

### **Problem: Type errors**
**Solution:** Export types from domain/, expand interfaces

### **Problem: Tests fail**
**Solution:** Update test imports, verify mocks accessible

### **Problem: Build slow**
**Solution:** Check for circular dependencies

---

## ⏱️ **TIME TRACKING**

| Phase | Planned | Actual | Notes |
|-------|---------|--------|-------|
| Tests | 30 min | ___ | |
| Components | 20 min | ___ |  |
| Domain | 15 min | ___ | |
| Validation | 10 min | ___ | |
| **Total** | **0.5-1 hour** | **___** | |

---

## 🎯 **READY TO START?**

1. Review warnings and recommendations above
2. Adjust time estimates if needed
3. Start Phase 1: Test Infrastructure
4. Follow checklist step-by-step
5. Commit after each phase
6. Celebrate success! 🎉

**Based on capture migration pattern.**  
**Complexity: LOW**  
**Let's ship it! 🚀**
