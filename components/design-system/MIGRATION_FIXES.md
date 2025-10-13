# Migration Fixes - Folder Renaming

## Issue: Case-Sensitivity Build Errors

After renaming folders from PascalCase to lowercase, Next.js and TypeScript caches held onto old references.

## Fixes Applied:

### 1. **Updated Internal Imports**

#### `calendar/Calendar.tsx`
```tsx
// ❌ Before:
import { Stack, Flex } from '../Layout'

// ✅ After:
import { Stack, Flex } from '../primitives/Layout'
```

#### `file-preview/index.tsx`
```tsx
// ❌ Before:
export { FilePreview } from '../FilePreview'

// ✅ After:
export { FilePreview } from '../utilities/FilePreview'
```

### 2. **Cleared Build Cache**
```bash
rm -rf .next
```

This removes Next.js's compiled cache which was referencing the old `Calendar/` path.

---

## If Build Errors Persist:

### **Step 1: Verify No Duplicate Folders**
```bash
cd components/design-system
ls -la | grep -i calendar
ls -la | grep -i file
```

Should only show lowercase folders.

### **Step 2: Clear All Caches**
```bash
# Clear Next.js cache
rm -rf .next

# Clear TypeScript cache
rm -rf node_modules/.cache

# Clear npm cache (if needed)
npm cache clean --force
```

### **Step 3: Restart Dev Server**
```bash
# Stop the dev server (Ctrl+C)
# Then restart:
npm run dev
```

### **Step 4: Check Git Case Sensitivity**

Git on macOS is case-insensitive by default. You may need to force the rename:

```bash
cd components/design-system

# For each PascalCase folder that still appears:
git mv -f Calendar calendar-temp
git mv -f calendar-temp calendar
git commit -m "fix: force case-sensitive folder rename"
```

---

## Root Cause:

**macOS filesystem is case-insensitive** by default (HFS+ and APFS). When you rename `Calendar/` to `calendar/`, the filesystem treats them as the same folder, but:
- Git may not detect the change
- TypeScript/Next.js cache may hold old references
- Build tools may get confused

---

## Prevention:

### **Always Clear Cache After Folder Renames:**
```bash
rm -rf .next && npm run dev
```

### **For Git, Use Force Rename:**
```bash
git mv -f OldName temp
git mv -f temp newname
```

---

## Current Status:

✅ Internal imports fixed  
✅ Next.js cache cleared  
✅ Folder structure standardized  

**If errors persist after restarting dev server, follow Step 4 above.**
