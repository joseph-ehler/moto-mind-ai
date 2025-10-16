# 🔄 Feature Migration Guide - Manual Process

**Purpose:** Migrate one feature from scattered locations to feature-first architecture  
**Time:** ~1 hour per feature  
**Risk:** Low (test after each step)  
**Status:** Week 1 - Manual Process  

---

## 🎯 THE PATTERN

### **Before (Scattered):**
```
lib/
  domain/vehicles/types.ts
  services/vehicles/api.ts
  utils/vehicleHelpers.ts
components/
  vehicle/VehicleCard.tsx
  vehicle/VehicleList.tsx
app/
  (authenticated)/vehicles/page.tsx
tests/
  vehicles/api.test.ts
```

### **After (Organized):**
```
features/
  vehicles/
    domain/
      types.ts
      entities.ts
      businessLogic.ts
    data/
      api.ts
      queries.ts
    ui/
      VehicleCard.tsx
      VehicleList.tsx
    hooks/
      useVehicles.ts
    __tests__/
      domain.test.ts
      data.test.ts
      ui.test.tsx
```

---

## 📋 STEP-BY-STEP PROCESS

### **Step 1: Create Feature Structure (5 min)**

```bash
# Create the directories
mkdir -p features/vehicles/{domain,data,ui,hooks,__tests__}

# Verify
tree features/vehicles
```

**Result:**
```
features/vehicles/
├── domain/
├── data/
├── ui/
├── hooks/
└── __tests__/
```

---

### **Step 2: Move Domain Logic (10 min)**

**What to move:**
- Types
- Entities
- Business logic
- Validation rules

**From → To:**
```bash
lib/domain/vehicles/types.ts
→ features/vehicles/domain/types.ts

lib/domain/vehicles/entities.ts
→ features/vehicles/domain/entities.ts

lib/validation/vehicles.ts
→ features/vehicles/domain/validation.ts
```

**How:**
```bash
# Use git mv to preserve history
git mv lib/domain/vehicles/types.ts features/vehicles/domain/types.ts
git mv lib/domain/vehicles/entities.ts features/vehicles/domain/entities.ts
```

**Checklist:**
- [ ] All types moved
- [ ] All entities moved
- [ ] All validation moved
- [ ] No external dependencies on other features

---

### **Step 3: Move Data Layer (10 min)**

**What to move:**
- API clients
- Data fetching
- Queries
- Mutations

**From → To:**
```bash
lib/services/vehicles/api.ts
→ features/vehicles/data/api.ts

lib/services/vehicles/queries.ts
→ features/vehicles/data/queries.ts
```

**How:**
```bash
git mv lib/services/vehicles/api.ts features/vehicles/data/api.ts
git mv lib/services/vehicles/queries.ts features/vehicles/data/queries.ts
```

**Checklist:**
- [ ] All API code moved
- [ ] All query code moved
- [ ] Imports updated (see Step 6)

---

### **Step 4: Move UI Components (10 min)**

**What to move:**
- Feature-specific components
- NOT shared components (those stay in components/)

**From → To:**
```bash
components/vehicle/VehicleCard.tsx
→ features/vehicles/ui/VehicleCard.tsx

components/vehicle/VehicleList.tsx
→ features/vehicles/ui/VehicleList.tsx

components/vehicle/VehicleForm.tsx
→ features/vehicles/ui/VehicleForm.tsx
```

**How:**
```bash
# Move entire directory
git mv components/vehicle/* features/vehicles/ui/
```

**Important:**
- ✅ Move feature-specific components
- ❌ Don't move shared components (Card, Button, etc.)

**Checklist:**
- [ ] All feature-specific components moved
- [ ] Shared components left in components/
- [ ] UI logic moved

---

### **Step 5: Move Hooks (10 min)**

**What to move:**
- Feature-specific hooks only
- Generic hooks stay in lib/hooks/

**From → To:**
```bash
lib/hooks/useVehicles.ts
→ features/vehicles/hooks/useVehicles.ts

lib/hooks/useVehicleForm.ts
→ features/vehicles/hooks/useVehicleForm.ts
```

**How:**
```bash
# Find vehicle-specific hooks
grep -l "vehicle" lib/hooks/*.ts

# Move them
git mv lib/hooks/useVehicles.ts features/vehicles/hooks/
git mv lib/hooks/useVehicleForm.ts features/vehicles/hooks/
```

**Checklist:**
- [ ] Feature-specific hooks moved
- [ ] Generic hooks (useDebounce, etc.) left in lib/hooks/

---

### **Step 6: Update Imports (15 min)**

**This is the tedious part.** Use find/replace:

**Find:**
```typescript
import { VehicleType } from '@/lib/domain/vehicles/types'
import { fetchVehicles } from '@/lib/services/vehicles/api'
import { VehicleCard } from '@/components/vehicle/VehicleCard'
import { useVehicles } from '@/lib/hooks/useVehicles'
```

**Replace with:**
```typescript
import { VehicleType } from '@/features/vehicles/domain/types'
import { fetchVehicles } from '@/features/vehicles/data/api'
import { VehicleCard } from '@/features/vehicles/ui/VehicleCard'
import { useVehicles } from '@/features/vehicles/hooks/useVehicles'
```

**How (VS Code):**
1. Open global search (Cmd/Ctrl + Shift + F)
2. Find: `@/lib/domain/vehicles`
3. Replace: `@/features/vehicles/domain`
4. Review each change
5. Replace all

**Repeat for:**
- `@/lib/services/vehicles` → `@/features/vehicles/data`
- `@/components/vehicle` → `@/features/vehicles/ui`
- `@/lib/hooks/useVehicle` → `@/features/vehicles/hooks/useVehicle`

**Checklist:**
- [ ] All imports updated
- [ ] No broken imports
- [ ] TypeScript compiles

---

### **Step 7: Move Tests (5 min)**

**What to move:**
- All vehicle-related tests

**From → To:**
```bash
tests/vehicles/
→ features/vehicles/__tests__/
```

**How:**
```bash
# Move entire test directory
git mv tests/vehicles/* features/vehicles/__tests__/
```

**Update test imports:**
Same as Step 6, but in test files.

**Checklist:**
- [ ] All tests moved
- [ ] Test imports updated
- [ ] Tests still run

---

### **Step 8: Run Tests (5 min)**

**Critical: Test after EVERY major step**

```bash
# Type check
npx tsc --noEmit

# Run tests
npm test features/vehicles

# Or specific test
npm test features/vehicles/__tests__/api.test.ts
```

**If tests fail:**
1. Check import paths
2. Check file locations
3. Check tsconfig paths
4. Fix and re-run

**Checklist:**
- [ ] Type check passes
- [ ] All tests pass
- [ ] No console errors

---

### **Step 9: Update tsconfig.json (if needed) (5 min)**

**Add path alias for features:**

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"],
      "@/features/*": ["features/*"]
    }
  }
}
```

**This allows:**
```typescript
import { VehicleType } from '@/features/vehicles/domain/types'
// Instead of:
import { VehicleType } from '../../../features/vehicles/domain/types'
```

---

### **Step 10: Commit (5 min)**

**Commit after each major step:**

```bash
# After moving domain
git add features/vehicles/domain
git commit -m "feat(arch): migrate vehicles domain to feature-first structure"

# After moving data
git add features/vehicles/data
git commit -m "feat(arch): migrate vehicles data layer to feature-first structure"

# After moving UI
git add features/vehicles/ui
git commit -m "feat(arch): migrate vehicles UI to feature-first structure"

# After updating imports
git add .
git commit -m "refactor(arch): update imports for vehicles feature migration"
```

**Why commit after each step:**
- Easy to rollback if something breaks
- Clear history of what changed
- Can test incrementally

---

## ✅ VERIFICATION CHECKLIST

After completing all steps:

- [ ] Feature structure created
- [ ] All domain code moved
- [ ] All data code moved
- [ ] All UI code moved
- [ ] All hooks moved
- [ ] All tests moved
- [ ] All imports updated
- [ ] TypeScript compiles
- [ ] All tests pass
- [ ] No eslint errors
- [ ] Committed to git

---

## 🚀 STRANGLER FIG PATTERN

**Important: OLD CODE STILL WORKS**

After migration, you'll have:

```
features/
  vehicles/          # NEW! Feature-first
    domain/
    data/
    ui/
    hooks/
    __tests__/

lib/
  services/vehicles/ # OLD! Still exists (maybe empty)

components/
  vehicle/           # OLD! Still exists (maybe empty)
```

**This is OK!** 

Benefits:
- No big bang migration
- Always releasable
- Can test gradually
- Rollback is easy

**When to remove old:**
- After a few weeks of stability
- When you're 100% sure nothing uses it
- Use git grep to check

```bash
# Check if anything still imports from old location
git grep "@/lib/services/vehicles"

# If empty, safe to delete
rm -rf lib/services/vehicles
```

---

## 📊 TIME BREAKDOWN

| Step | Time | Cumulative |
|------|------|------------|
| 1. Create structure | 5 min | 5 min |
| 2. Move domain | 10 min | 15 min |
| 3. Move data | 10 min | 25 min |
| 4. Move UI | 10 min | 35 min |
| 5. Move hooks | 10 min | 45 min |
| 6. Update imports | 15 min | 60 min |
| 7. Move tests | 5 min | 65 min |
| 8. Run tests | 5 min | 70 min |
| 9. Update tsconfig | 5 min | 75 min |
| 10. Commit | 5 min | 80 min |
| **Buffer** | 10 min | **90 min** |

**Total: ~1.5 hours per feature**

---

## 💡 TIPS & TRICKS

### **Use git mv, not mv**
```bash
# ✅ Good: Preserves git history
git mv old-file.ts new-file.ts

# ❌ Bad: Loses git history
mv old-file.ts new-file.ts
```

### **Test frequently**
Don't wait until the end. Test after each major step.

### **Use VS Code multi-cursor**
For updating imports:
1. Find all occurrences (Cmd+Shift+F)
2. Use multi-cursor to edit all at once

### **Keep a checklist**
Print this guide and check off steps as you go.

### **Don't be perfect**
It's OK to:
- Leave some files in old location temporarily
- Come back later to clean up
- Iterate on the structure

### **Pair on first migration**
Do the first feature migration with someone else.
- Catch mistakes early
- Document edge cases
- Build shared understanding

---

## 🎯 NEXT FEATURES TO MIGRATE

After vehicles, good candidates:

1. **capture** - Similar size, important feature
2. **dashboard** - Central to app
3. **documents** - Simpler, good practice

**Don't migrate:**
- Shared infrastructure (auth, database, cache)
- Design system
- Generic utilities

These stay in lib/ and components/.

---

## 📚 REFERENCES

**Feature-First Architecture:**
- [Vertical Slice Architecture](https://www.jimmybogard.com/vertical-slice-architecture/)
- [Feature Folders](https://phauer.com/2020/package-by-feature/)

**Strangler Fig Pattern:**
- [Martin Fowler - Strangler Fig](https://martinfowler.com/bliki/StranglerFigApplication.html)

---

**Built: Week 1 - Minimal Viable Architecture**  
*"Start manual, automate pain points"*
