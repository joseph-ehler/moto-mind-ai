# 🏗️ ARCHITECTURAL CLEANUP PLAN

**Date:** October 16, 2025  
**Goal:** Organize repository so everything has a proper home  
**Status:** Analysis Complete, Ready to Execute

---

## 📊 CURRENT STATE ANALYSIS

### **Issue #1: Root Directory Clutter** 🔴 CRITICAL
```
Found: 41 loose test/migration files in project root
Should be: Organized in scripts/ or tests/
Impact: Makes project look disorganized, hard to find files
```

**Files Found:**
- test-*.js (20+ test files)
- run-migration*.js (migration scripts)
- create-*.js (setup scripts)
- check-*.js (validation scripts)
- fix-*.js (fix scripts)

**Recommendation:** Move all to appropriate locations

---

### **Issue #2: Flat lib/ Structure** 🟡 MEDIUM
```
Found: 20+ individual files at lib/ root level
Should be: Organized into feature subdirectories
Impact: Hard to navigate, unclear ownership
```

**Files at lib/ root:**
```
lib/
├── analytics.ts (5.9KB)
├── bulk-processing.ts (5.8KB)
├── capture-metadata.ts (6.7KB)
├── data-conflict-detection.ts (10.8KB)
├── exif-extraction.ts (10.2KB)
├── favorite-stations.ts (6.2KB)
├── field-grouping.ts (4.0KB)
├── geocoding-enhanced.ts (13.0KB)
├── geocoding.ts (8.7KB)
├── gps-capture.ts (8.8KB)
├── heic-converter.ts (2.5KB)
├── image-processing.ts (4.8KB)
├── live-quality-feedback.ts (5.7KB)
├── location-intelligence.ts (9.5KB)
├── location-search.ts (5.6KB)
├── location-validation.ts (2.0KB)
├── quality-analysis.ts (8.9KB)
├── quality-score.ts (4.4KB)
├── storage-paths.ts (5.9KB)
├── test-storage-permissions.ts (6.2KB)
├── utils.ts (84 bytes) ← BASICALLY EMPTY!
├── vision-api.ts (1.6KB)
├── weather-capture.ts (6.1KB)
└── webp-support.ts (2.3KB)
```

**Recommendation:** Organize by feature/domain

---

### **Issue #3: Remaining components/** 🟡 MEDIUM
```
Found: components/ directory still exists
Modern: features/ directory is the new home
Impact: Confusion about where to put new code
```

**Current structure:**
```
components/
├── design-system/ (233 items) ← KEEP (shared UI)
├── ui/ (62 items) ← Review (might be duplicates of design-system)
├── timeline/ (43 items) ← Move to features/timeline/
├── modals/ (19 items) ← Move to features/
├── maps/ (6 items) ← Move to features/
├── garage/ (6 items) ← Move to features/garage/
├── capture/ (6 items) ← Move to features/capture/
├── vision/ (4 items) ← Move to features/vision/
└── [others...]
```

**Recommendation:** Migrate feature-specific components to features/

---

### **Issue #4: Empty/Tiny Files** 🟢 LOW
```
Found: Several nearly-empty files
Example: lib/utils.ts (84 bytes)
Impact: Clutter, confusion
```

**Recommendation:** Remove or consolidate

---

## 🎯 PROPOSED STRUCTURE

### **Target Architecture:**

```
motomind-ai/
├── app/                    # Next.js App Router (routes only)
├── features/               # Feature-based modules (PRIMARY)
│   ├── auth/
│   ├── capture/
│   ├── vision/
│   ├── timeline/
│   └── [others]/
├── components/
│   └── design-system/      # ONLY shared UI components
├── lib/                    # Shared utilities (organized)
│   ├── ai/
│   ├── auth/
│   ├── clients/
│   ├── domain/
│   ├── infrastructure/
│   ├── services/
│   ├── storage/
│   ├── types/
│   ├── utils/
│   └── validation/
├── scripts/                # Development scripts
│   ├── migrations/         # DB migrations
│   ├── tests/              # Test scripts
│   └── tools/              # Dev tools
├── tests/                  # Test files
│   ├── unit/
│   ├── integration/
│   └── e2e/
└── archive/                # Deprecated code (safe storage)
```

---

## ✅ EXECUTION PLAN

### **Phase 1: Root Directory Cleanup (30 min)** 🔴 HIGH PRIORITY

**Action:** Move 41 root files to proper locations

```bash
# Test files → tests/
mv test-*.js tests/integration/

# Migration files → scripts/migrations/
mv run-migration*.js scripts/migrations/
mv create-*.js scripts/migrations/

# Fix/check scripts → scripts/tools/
mv fix-*.js scripts/tools/
mv check-*.js scripts/tools/

# Already-scripted files → archive/
# (files that are redundant with scripts/ directory)
```

**Expected Result:**
- Root directory: Clean, only config files
- scripts/: Organized by type
- tests/: All test files in one place

---

### **Phase 2: Organize lib/ (45 min)** 🟡 MEDIUM PRIORITY

**Action:** Move flat files into feature subdirectories

**Proposed Moves:**

**Location/Geocoding:**
```bash
lib/location/               # NEW
├── geocoding.ts           # from lib/
├── geocoding-enhanced.ts  # from lib/
├── location-intelligence.ts
├── location-search.ts
├── location-validation.ts
└── gps-capture.ts
```

**Capture/Quality:**
```bash
lib/capture/               # NEW (or move to features/capture/domain/)
├── capture-metadata.ts
├── quality-analysis.ts
├── quality-score.ts       # already exists, just organize
└── live-quality-feedback.ts
```

**Image Processing:**
```bash
lib/images/                # NEW
├── image-processing.ts
├── heic-converter.ts
├── webp-support.ts
└── exif-extraction.ts
```

**Storage:**
```bash
lib/storage/               # EXISTS, add to it
├── storage-paths.ts       # from lib/
└── test-storage-permissions.ts  # or move to tests/
```

**Analytics/Data:**
```bash
lib/analytics/             # NEW
├── analytics.ts           # from lib/
├── data-conflict-detection.ts
└── field-grouping.ts
```

**Features:**
```bash
lib/features/              # NEW
├── favorite-stations.ts
├── bulk-processing.ts
└── weather-capture.ts
```

**Clean up:**
```bash
# Remove empty/tiny files
rm lib/utils.ts  # Only 84 bytes, basically empty
```

---

### **Phase 3: Migrate components/ → features/ (60 min)** 🟡 MEDIUM PRIORITY

**Action:** Move feature-specific components to features/

**Migrations:**

```bash
# Timeline components
components/timeline/ → features/timeline/ui/

# Capture components
components/capture/ → features/capture/ui/

# Vision components
components/vision/ → features/vision/ui/

# Maps
components/maps/ → features/maps/ui/ (or features/location/ui/)

# Garage
components/garage/ → features/garage/ui/

# Modals - distribute by feature
components/modals/[VehicleModal].tsx → features/vehicles/ui/
components/modals/[CaptureModal].tsx → features/capture/ui/
# etc.
```

**Keep in components/:**
```bash
components/
├── design-system/  # Shared UI components (KEEP)
└── [investigate ui/ directory]
```

**Review:**
- Check if components/ui/ duplicates design-system/
- Consolidate or remove duplicates

---

### **Phase 4: Clean Up Naming (15 min)** 🟢 LOW PRIORITY

**Action:** Ensure consistent naming conventions

**Rules:**
- Files: kebab-case (`file-name.ts`)
- Components: PascalCase (`ComponentName.tsx`)
- Directories: kebab-case (`feature-name/`)
- No redundant names (`vehicle-vehicle.ts` → `vehicle.ts`)

**Scan for violations:**
```bash
# Find files with inconsistent naming
find . -name "*_*" -type f  # snake_case (should be kebab-case)
find . -name "*[A-Z]*" -type f | grep -v "\.tsx$"  # PascalCase non-components
```

---

## 📈 EXPECTED IMPACT

### **Before:**
```
Root files: 41 loose test/migration files
lib/ files: 23 files at root level
components/: Mixed feature and shared components
Navigation: Confusing, unclear ownership
```

### **After:**
```
Root files: 0 loose files (clean!)
lib/ files: Organized by domain/feature
components/: Only design-system (shared)
features/: All feature code organized
Navigation: Crystal clear ownership
```

### **Benefits:**
1. ✅ **Easier navigation** - Everything has a clear home
2. ✅ **Faster development** - Know exactly where to add code
3. ✅ **Better collaboration** - Clear ownership boundaries
4. ✅ **Simpler onboarding** - New devs understand structure instantly
5. ✅ **Reduced cognitive load** - Less decision fatigue

---

## 🚀 EXECUTION STRATEGY

### **Recommended Order:**

**Today (1-2 hours):**
1. ✅ Phase 1: Root directory cleanup (30 min) - HIGH IMPACT, LOW RISK
2. ✅ Phase 2: Organize lib/ (45 min) - MEDIUM IMPACT, LOW RISK

**Tomorrow (1-2 hours):**
3. Phase 3: Migrate components/ (60 min) - HIGH IMPACT, MEDIUM RISK
4. Phase 4: Clean up naming (15 min) - LOW IMPACT, LOW RISK

### **Alternative: Do It All Now (2-3 hours)**
If you have momentum, we can do all phases in one session!

---

## 🧪 VALIDATION CHECKLIST

After each phase:
- [ ] Run `npm run build` - Ensure build passes
- [ ] Run `./scripts/cascade-tools.sh validate` - No violations
- [ ] Run `./scripts/cascade-tools.sh quality` - Track improvements
- [ ] Check imports - No broken imports
- [ ] Commit changes - Document what moved where

---

## 📋 SESSION TRACKING

### **Session #004: Architectural Cleanup**

**Target:**
- Clean root directory
- Organize lib/
- Migrate components/
- Fix naming

**Metrics to Track:**
- Files moved
- Directories cleaned
- Naming violations fixed
- Quality score improvement

---

## 💡 AUTOMATION OPPORTUNITIES

**Future Enhancement:**
Create `scripts/organize-architecture.sh` that:
1. Scans for files in wrong locations
2. Suggests proper homes based on imports/usage
3. Auto-moves with confirmation
4. Updates imports automatically

**Time savings:** Could reduce 2-3 hours of manual work to 10 minutes!

---

**Ready to execute!** 🚀

**Recommended:** Start with Phase 1 (root cleanup) - Quick win, immediate impact!
