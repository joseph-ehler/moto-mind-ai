# Naming Conventions Audit 🔍

## 📋 **Current Issues**

Analyzing the utilities folder for naming convention inconsistencies...

---

## 🎯 **Standard Conventions (from MotoMind Rules)**

According to your global engineering principles:

### **Files/Folders:** `kebab-case`
- ✅ `file-upload/`
- ✅ `camera-utils.ts`
- ✅ `auto-capture-detection.ts`

### **Variables/Functions:** `camelCase`
- ✅ `const fileName = ...`
- ✅ `function getCameraStream() { }`
- ✅ `useCameraStream.ts` (hooks are functions)

### **Types/Components:** `PascalCase`
- ✅ `FileUpload` (component)
- ✅ `type CameraState`
- ✅ `interface FileUploadProps`

---

## ❌ **Issues Found**

### **1. Folder Naming - CRITICAL**

| Current | Should Be | Issue |
|---------|-----------|-------|
| `FileUpload/` | `file-upload/` | ❌ PascalCase folder (should be kebab-case) |
| `vision/` | `vision/` | ✅ Correct |

**Impact:** This is the biggest issue. `FileUpload/` folder should be `file-upload/` per conventions.

---

### **2. Utility File Naming**

| Current | Should Be | Issue |
|---------|-----------|-------|
| `vision/utils/errorMessages.ts` | `error-messages.ts` | ❌ camelCase (should be kebab-case) |
| `vision/utils/imagePreprocessing.ts` | `image-preprocessing.ts` | ❌ camelCase (should be kebab-case) |
| `FileUpload/utils/camera-utils.ts` | `camera-utils.ts` | ✅ Correct |
| `FileUpload/utils/file-utils.ts` | `file-utils.ts` | ✅ Correct |
| `FileUpload/detection/auto-capture-detection.ts` | `auto-capture-detection.ts` | ✅ Correct |
| `FileUpload/detection/auto-capture-ocr.ts` | `auto-capture-ocr.ts` | ✅ Correct |

---

### **3. Component Files - All Correct** ✅

| File | Convention | Status |
|------|------------|--------|
| `ActionBars.tsx` | PascalCase | ✅ Correct |
| `FilePreview.tsx` | PascalCase | ✅ Correct |
| `Search.tsx` | PascalCase | ✅ Correct |
| `SimpleCameraUpload.tsx` | PascalCase | ✅ Correct |
| `FileUpload/FileUpload.tsx` | PascalCase | ✅ Correct |
| All vision/ components | PascalCase | ✅ Correct |

---

### **4. Hook Files - All Correct** ✅

| File | Convention | Status |
|------|------------|--------|
| `useAutoCapture.ts` | camelCase | ✅ Correct |
| `useCameraStream.ts` | camelCase | ✅ Correct |
| `useCompressionWorker.ts` | camelCase | ✅ Correct |
| `useKeyboardShortcuts.ts` | camelCase | ✅ Correct |
| All vision/hooks/ | camelCase | ✅ Correct |

---

### **5. Worker Files - Correct** ✅

| File | Convention | Status |
|------|------------|--------|
| `compression.worker.ts` | kebab-case | ✅ Correct |

---

### **6. Type Files - Correct** ✅

| File | Convention | Status |
|------|------------|--------|
| `types.ts` | lowercase | ✅ Correct |

---

## 🔧 **Required Changes**

### **Priority 1: Folder Rename** 🔥

```bash
# Rename FileUpload/ to file-upload/
mv FileUpload/ file-upload/
```

**Impact:** HIGH - This will break ALL imports

**Files affected:**
- `design-system/index.tsx` - export path
- Any file importing from `./FileUpload/`
- README.md references

---

### **Priority 2: Utility File Renames** 🟡

```bash
# Rename vision utility files
mv vision/utils/errorMessages.ts vision/utils/error-messages.ts
mv vision/utils/imagePreprocessing.ts vision/utils/image-preprocessing.ts
```

**Impact:** MEDIUM - Will break imports in vision/ folder

**Files affected:**
- `vision/index.ts` - export path
- Any vision component using these utilities
- Vision scanners/hooks

---

## 📊 **Summary**

| Category | Total Files | Issues | % Correct |
|----------|-------------|--------|-----------|
| **Folders** | 2 | 1 | 50% |
| **Component Files** | 20+ | 0 | 100% ✅ |
| **Hook Files** | 11 | 0 | 100% ✅ |
| **Utility Files** | 8 | 2 | 75% |
| **Worker Files** | 1 | 0 | 100% ✅ |
| **Type Files** | 2 | 0 | 100% ✅ |
| **OVERALL** | 44+ | 3 | 93% |

---

## 🎯 **Recommendation**

### **Option A: Full Standardization (Recommended)** ✅

**Fix all 3 issues:**
1. Rename `FileUpload/` → `file-upload/`
2. Rename `errorMessages.ts` → `error-messages.ts`
3. Rename `imagePreprocessing.ts` → `image-preprocessing.ts`

**Pros:**
- 100% consistent with conventions
- Follows established MotoMind patterns
- No future confusion

**Cons:**
- Requires updating ~15-20 import statements
- 30-45 minutes of work

**Risk:** 🟢 Low - Straightforward find-and-replace

---

### **Option B: Folder Only (Quick Fix)** ⚡

**Fix only the folder:**
1. Rename `FileUpload/` → `file-upload/`

**Pros:**
- Fixes the most visible issue
- 15-20 minutes of work

**Cons:**
- Still have 2 inconsistent utility files

---

### **Option C: Document Exception (Not Recommended)** ❌

**Keep as-is, document exceptions**

**Pros:**
- No work required

**Cons:**
- Inconsistent codebase
- Confuses new developers
- Violates established conventions

---

## 🚀 **Migration Plan (Option A)**

### **Step 1: Rename Folder**
```bash
mv FileUpload/ file-upload/
```

### **Step 2: Update Imports - Main Export**
```tsx
// design-system/index.tsx
// OLD
export { FileUpload } from './utilities/FileUpload/index'
// NEW
export { FileUpload } from './utilities/file-upload/index'
```

### **Step 3: Rename Utility Files**
```bash
mv vision/utils/errorMessages.ts vision/utils/error-messages.ts
mv vision/utils/imagePreprocessing.ts vision/utils/image-preprocessing.ts
```

### **Step 4: Update Vision Imports**
```tsx
// vision/index.ts
// OLD
export { getErrorGuidance, formatErrorMessage } from './utils/errorMessages'
// NEW
export { getErrorGuidance, formatErrorMessage } from './utils/error-messages'
```

### **Step 5: Search and Replace**
```bash
# Find all imports
rg "from './utils/errorMessages'" vision/
rg "from './utils/imagePreprocessing'" vision/
```

### **Step 6: Update Documentation**
- README.md references
- Update folder structure diagrams

---

## 📝 **Validation Checklist**

After changes:
- [ ] All TypeScript files compile
- [ ] No import errors
- [ ] Design system exports work
- [ ] README updated
- [ ] Documentation updated
- [ ] Run `npm run typecheck`
- [ ] Run `npm run lint`

---

## 🎨 **Final Convention Reference**

### **Quick Reference Table**

| Type | Convention | Example |
|------|------------|---------|
| **Folders** | `kebab-case` | `file-upload/`, `vision/` |
| **Components** | `PascalCase.tsx` | `FileUpload.tsx` |
| **Hooks** | `camelCase.ts` | `useCameraStream.ts` |
| **Utilities** | `kebab-case.ts` | `camera-utils.ts` |
| **Workers** | `kebab-case.worker.ts` | `compression.worker.ts` |
| **Types** | `types.ts` (lowercase) | `types.ts` |
| **Barrel exports** | `index.ts` (lowercase) | `index.ts` |

### **Component Inside Files**

```tsx
// File: file-upload/FileUpload.tsx
export function FileUpload() { }  // PascalCase component
export type FileUploadProps = { } // PascalCase type
```

```tsx
// File: hooks/useCameraStream.ts
export function useCameraStream() { } // camelCase function
export type UseCameraStreamOptions = { } // PascalCase type
```

```tsx
// File: utils/camera-utils.ts
export function getCameraButtonLabel() { } // camelCase function
export const CAMERA_CONSTANTS = { } // UPPER_SNAKE_CASE constant
```

---

## 💡 **Why These Conventions?**

### **kebab-case for files/folders:**
- ✅ URL-friendly
- ✅ Works on all filesystems (case-insensitive)
- ✅ Git-friendly (no case conflicts)
- ✅ Easy to type (no shift key)

### **PascalCase for components:**
- ✅ Matches React convention
- ✅ Matches TypeScript types
- ✅ Visual distinction from utilities

### **camelCase for hooks/functions:**
- ✅ Matches JavaScript convention
- ✅ Hooks start with `use` (React convention)
- ✅ Consistent with function names

---

## 🏁 **Recommendation**

**Go with Option A: Full Standardization**

**Why:**
- Only 3 issues to fix
- 30-45 minutes of work
- Achieves 100% consistency
- Future-proof
- Follows established patterns

**Next Step:**
Run the migration and update all imports. I can help execute this!

---

**Would you like me to proceed with the full standardization?**
