# 🕐 TIMELINE FEATURE MIGRATION - EXECUTION CHECKLIST

**Goal:** Migrate timeline feature following vehicles pattern  
**Timeline:** 1.5 hours (Tue morning)  
**Pattern:** Replicate vehicles success (2.15h → 1.5h = getting faster!)

---

## ✅ **PHASE 1: ADD TESTS (40 MIN)**

Following vehicles pattern: Generate comprehensive test suite

### **Step 1.1: Domain Tests (20 min)**
Location: `features/timeline/__tests__/domain/`

**Auto-generate following vehicle pattern:**
- [ ] timeline-grouping.test.ts (date grouping logic)
- [ ] timeline-filtering.test.ts (filter logic)
- [ ] timeline-types.test.ts (type validation)

Target: ~30 tests

### **Step 1.2: Mock Data (10 min)**
- [ ] Create `features/timeline/__tests__/mocks/timeline-fixtures.ts`
- [ ] Follow vehicle-fixtures.ts pattern exactly

### **Step 1.3: Run & Validate (10 min)**
- [ ] `npm test features/timeline`
- [ ] Verify all passing
- [ ] Check coverage

**Expected Result:** ~30 tests passing ✅

---

## ✅ **PHASE 2: MIGRATE COMPONENTS (30 MIN)**

Current location: `components/timeline/`
Target: `features/timeline/ui/`

### **Components to Move:**
```bash
# Main Timeline Components
components/timeline/Timeline.tsx → features/timeline/ui/
components/timeline/TimelineItem.tsx → features/timeline/ui/
components/timeline/TimelineItemCompact.tsx → features/timeline/ui/
components/timeline/TimelineHeader.tsx → features/timeline/ui/
components/timeline/TimelineLoadingSkeleton.tsx → features/timeline/ui/
components/timeline/TimelineInsights.tsx → features/timeline/ui/
components/timeline/MaintenancePredictor.tsx → features/timeline/ui/
components/timeline/Sparkline.tsx → features/timeline/ui/

# Blocks (keep in subdirectory)
components/timeline/blocks/* → features/timeline/ui/blocks/

# Hooks (keep in subdirectory)  
components/timeline/hooks/* → features/timeline/hooks/
```

### **Git Commands:**
```bash
cd features/timeline
mkdir -p ui/blocks
mkdir -p hooks

# Move main components
git mv ../../components/timeline/Timeline.tsx ui/
git mv ../../components/timeline/TimelineItem.tsx ui/
git mv ../../components/timeline/TimelineItemCompact.tsx ui/
git mv ../../components/timeline/TimelineHeader.tsx ui/
git mv ../../components/timeline/TimelineLoadingSkeleton.tsx ui/
git mv ../../components/timeline/TimelineInsights.tsx ui/
git mv ../../components/timeline/MaintenancePredictor.tsx ui/
git mv ../../components/timeline/Sparkline.tsx ui/

# Move blocks
git mv ../../components/timeline/blocks/* ui/blocks/

# Move hooks
git mv ../../components/timeline/hooks/* ../hooks/

# Clean up
rm -rf ../../components/timeline/
```

### **Update Imports:**
Find and replace:
- `@/components/timeline/` → `@/features/timeline/ui/`
- `@/components/timeline/hooks/` → `@/features/timeline/hooks/`

**Expected Result:** All timeline UI in features/ ✅

---

## ✅ **PHASE 3: MIGRATE DOMAIN LOGIC (15 MIN)**

### **Step 3.1: Identify Domain Code**
Check `lib/` for timeline-specific code:
```bash
grep -r "timeline" lib/ --include="*.ts" 
```

Likely candidates:
- Timeline types in `lib/types/`
- Timeline utilities
- Timeline business logic

### **Step 3.2: Move to Domain**
```bash
# Create domain structure if needed
mkdir -p features/timeline/domain/

# Move identified files (example)
# git mv lib/types/timeline.ts features/timeline/domain/types.ts
```

### **Step 3.3: Update Imports**
- Update references to moved types
- Create re-export in lib/ for backward compat (like vehicles)

**Expected Result:** Timeline domain isolated ✅

---

## ✅ **VALIDATION (5 MIN)**

### **Run All Checks:**
```bash
# Tests
npm test features/timeline

# Type check
npm run type-check

# Build
npm run build

# Architecture
npm run arch:validate
```

**Expected Violations:**
- Before: 85
- After: ~80 (-5 violations)

---

## 🚀 **DEPLOY**

```bash
git add .
git commit -m "feat: complete timeline feature migration (following vehicles pattern)

Timeline feature migrated to feature-first architecture following 
established vehicles pattern.

Results:
- ~30 tests added (100% passing)
- 15+ components migrated to features/timeline/ui/
- Domain logic isolated
- 5 fewer architecture violations

Time: 1.5 hours (faster than vehicles due to established pattern)
Pattern: Proven scalable ✅

Next: Capture feature migration (1.5h)"

git push origin main
```

---

## ⏱️ **TIME TRACKING**

| Phase | Planned | Actual | Notes |
|-------|---------|--------|-------|
| Tests | 40 min | ___ | |
| Components | 30 min | ___ | |
| Domain | 15 min | ___ | |
| Validation | 5 min | ___ | |
| **Total** | **1.5h** | **___** | |

**Target: Faster than vehicles (2.15h)**

---

## 🎯 **SUCCESS METRICS**

After completion:
- ✅ ~30 tests passing
- ✅ 15+ components organized
- ✅ Domain logic isolated
- ✅ Build passing
- ✅ 85 → 80 violations (-5)
- ✅ Time < 1.5 hours (getting faster!)

**Ready? Let's replicate the pattern!** 🚀
