# 📸 CAPTURE FEATURE MIGRATION - EXECUTION CHECKLIST

**Goal:** Migrate capture feature following vehicles pattern  
**Timeline:** 1.5 hours (Tue afternoon)  
**Pattern:** 3rd feature - should be even faster!

---

## ✅ **PHASE 1: ADD TESTS (40 MIN)**

### **Step 1.1: Domain Tests (20 min)**
Location: `features/capture/__tests__/domain/`

**Auto-generate following vehicle pattern:**
- [ ] capture-validation.test.ts (input validation)
- [ ] capture-flow.test.ts (flow logic)
- [ ] capture-types.test.ts (type validation)

Target: ~30 tests

### **Step 1.2: Mock Data (10 min)**
- [ ] Create `features/capture/__tests__/mocks/capture-fixtures.ts`
- [ ] Mock file uploads, OCR responses, etc.

### **Step 1.3: Run & Validate (10 min)**
- [ ] `npm test features/capture`
- [ ] Verify all passing

**Expected Result:** ~30 tests passing ✅

---

## ✅ **PHASE 2: MIGRATE COMPONENTS (30 MIN)**

Current location: `components/capture/`
Target: `features/capture/ui/`

### **Components to Move:**
```bash
cd features/capture
mkdir -p ui/steps ui/modals

# Main capture components
git mv ../../components/capture/CaptureEntryModal.tsx ui/modals/
git mv ../../components/capture/VehicleConfirmation.tsx ui/
git mv ../../components/capture/PhotoCapture.tsx ui/
git mv ../../components/capture/DocumentScanner.tsx ui/

# Flow config
git mv ../../components/capture/flow-config.ts ../domain/

# Steps if any
git mv ../../components/capture/steps/* ui/steps/

# Clean up
rm -rf ../../components/capture/
```

### **Update Imports:**
- `@/components/capture/` → `@/features/capture/ui/`

**Expected Result:** All capture UI in features/ ✅

---

## ✅ **PHASE 3: MIGRATE DOMAIN LOGIC (15 MIN)**

### **Identify Domain Code:**
```bash
grep -r "capture" lib/ --include="*.ts"
```

Likely in:
- `lib/vision/` (OCR logic)
- `lib/types/` (Capture types)

### **Move to Domain:**
```bash
mkdir -p features/capture/domain/

# Move capture-specific vision logic
# (Keep shared vision in lib/)
```

**Expected Result:** Capture domain isolated ✅

---

## ✅ **VALIDATION (5 MIN)**

```bash
npm test features/capture
npm run build
npm run arch:validate
```

**Expected Violations:**
- Before: ~80
- After: ~75 (-5 violations)

---

## 🚀 **DEPLOY**

```bash
git add .
git commit -m "feat: complete capture feature migration (3rd feature)

Capture feature migrated following proven pattern.

Results:
- ~30 tests added (100% passing)
- All capture components in features/capture/ui/
- Domain logic isolated
- 5 fewer architecture violations

Time: ~1.5 hours (3rd feature - pattern is muscle memory now)

Progress: 3/12 features complete (25%)
Pace: 1.5h per feature (projected 18h total for all 12)

Next: Vision + Events (Wed morning)"

git push origin main
```

---

## ⏱️ **TIME TRACKING**

| Phase | Planned | Actual | Notes |
|-------|---------|--------|-------|
| Tests | 40 min | ___ | Getting faster each time |
| Components | 30 min | ___ | |
| Domain | 15 min | ___ | |
| Validation | 5 min | ___ | |
| **Total** | **1.5h** | **___** | Target: <1.5h |

---

## 🎯 **SUCCESS METRICS**

- ✅ ~30 tests passing
- ✅ Capture UI organized
- ✅ Domain isolated
- ✅ ~75 violations (down from 102)
- ✅ **3 features complete in <6 hours** 🔥

**Pattern proven at scale!** ✨
