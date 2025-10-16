# Overlay System Migration Guide

## Overview

We've consolidated all modal, drawer, popover, and tooltip functionality into a **single unified Overlays system**. This guide will help you migrate from the old modal systems to the new Overlays.

---

## Why Consolidate?

**Problems with the old approach:**
- ❌ 3 different modal systems (confusing!)
- ❌ Duplicate functionality
- ❌ Inconsistent APIs
- ❌ Hard to maintain
- ❌ Multiple versions of Dialog, Drawer, etc.

**Benefits of the new Overlays system:**
- ✅ Single source of truth
- ✅ Consistent API
- ✅ Better TypeScript support
- ✅ Easier to maintain
- ✅ More features (Popover, Tooltip, etc.)

---

## Migration Map

### Old → New

| Old Component | New Component | Notes |
|--------------|---------------|-------|
| `BaseModal` | `Dialog` | Same API, better animations |
| `AlertModal` | `AlertDialog` | Now has variant support |
| `FormModal` | `FormDialog` | Built-in form handling |
| `ConfirmationModal` | `ConfirmationDialog` | Danger variant added |
| `Drawer` (legacy) | `Drawer` | Now with 4 positions |
| `ContentModal` | `Dialog` | Just use Dialog with content |

---

## Step-by-Step Migration

### 1. Update Imports

**Before:**
```tsx
import { BaseModal, AlertModal, FormModal } from '@/components/design-system'
```

**After:**
```tsx
import { Dialog, AlertDialog, FormDialog } from '@/components/design-system'
```

---

### 2. BaseModal → Dialog

**Before:**
```tsx
<BaseModal
  isOpen={show}
  onClose={() => setShow(false)}
  title="My Modal"
  size="lg"
>
  <div>Content</div>
</BaseModal>
```

**After:**
```tsx
<Dialog
  isOpen={show}
  onClose={() => setShow(false)}
  title="My Modal"
  size="lg"
>
  <div>Content</div>
</Dialog>
```

**Changes:** Just rename `BaseModal` → `Dialog`. Everything else is the same!

---

### 3. AlertModal → AlertDialog

**Before:**
```tsx
<AlertModal
  isOpen={show}
  onClose={() => setShow(false)}
  title="Success"
  description="Your changes have been saved"
/>
```

**After:**
```tsx
<AlertDialog
  isOpen={show}
  onClose={() => setShow(false)}
  title="Success"
  description="Your changes have been saved"
  variant="success"
/>
```

**Changes:** 
- Rename `AlertModal` → `AlertDialog`
- Add `variant` prop (info, success, warning, error)

---

### 4. FormModal → FormDialog

**Before:**
```tsx
<FormModal
  isOpen={show}
  onClose={() => setShow(false)}
  onSubmit={handleSubmit}
  title="Add Vehicle"
>
  <input name="make" />
  <input name="model" />
</FormModal>
```

**After:**
```tsx
<FormDialog
  isOpen={show}
  onClose={() => setShow(false)}
  onSubmit={handleSubmit}
  title="Add Vehicle"
  submitLabel="Add"
  isLoading={loading}
  error={error}
>
  <input name="make" />
  <input name="model" />
</FormDialog>
```

**Changes:**
- Rename `FormModal` → `FormDialog`
- Built-in submit button (no need for custom footer)
- Built-in error display
- Built-in loading state

---

### 5. ConfirmationModal → ConfirmationDialog

**Before:**
```tsx
<ConfirmationModal
  isOpen={show}
  onClose={() => setShow(false)}
  onConfirm={handleDelete}
  title="Delete Vehicle?"
  description="This action cannot be undone"
/>
```

**After:**
```tsx
<ConfirmationDialog
  isOpen={show}
  onClose={() => setShow(false)}
  onConfirm={handleDelete}
  title="Delete Vehicle?"
  description="This action cannot be undone"
  variant="danger"
  isLoading={deleting}
/>
```

**Changes:**
- Rename `ConfirmationModal` → `ConfirmationDialog`
- Add `variant` prop ("default" or "danger")
- Add `isLoading` for async actions

---

### 6. Drawer (Legacy) → Drawer (New)

**Before:**
```tsx
<Drawer
  isOpen={show}
  onClose={() => setShow(false)}
  title="Details"
>
  <div>Content</div>
</Drawer>
```

**After:**
```tsx
<Drawer
  isOpen={show}
  onClose={() => setShow(false)}
  position="right"
  title="Details"
  size="md"
>
  <div>Content</div>
</Drawer>
```

**Changes:**
- Same component name!
- Add `position` prop (left, right, top, bottom)
- Add `size` prop (sm, md, lg)
- Better animations

---

## New Features

### 1. Popover (NEW!)

```tsx
<Popover
  isOpen={showMenu}
  onClose={() => setShowMenu(false)}
  trigger={<button>Actions</button>}
  position="bottom"
  align="start"
>
  <div>Menu content</div>
</Popover>
```

**Use for:** Context menus, dropdowns, action menus

---

### 2. Tooltip (NEW!)

```tsx
<Tooltip content="Click to edit" position="top">
  <button>Edit</button>
</Tooltip>
```

**Use for:** Helper hints, icon explanations, keyboard shortcuts

---

### 3. Fullscreen Dialog

```tsx
<Dialog
  isOpen={show}
  onClose={() => setShow(false)}
  title="Full Details"
  variant="fullscreen"
>
  <div>Takes up entire viewport</div>
</Dialog>
```

**Use for:** Rich content, detailed views, image galleries

---

## Common Patterns

### Pattern 1: Form with Validation

```tsx
const [error, setError] = React.useState('')
const [loading, setLoading] = React.useState(false)

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setLoading(true)
  setError('')
  
  try {
    await api.createVehicle(data)
    onClose()
  } catch (err) {
    setError(err.message)
  } finally {
    setLoading(false)
  }
}

<FormDialog
  isOpen={show}
  onClose={onClose}
  onSubmit={handleSubmit}
  title="Add Vehicle"
  isLoading={loading}
  error={error}
>
  {/* Form fields */}
</FormDialog>
```

---

### Pattern 2: Destructive Confirmation

```tsx
const [deleting, setDeleting] = React.useState(false)

const handleDelete = async () => {
  setDeleting(true)
  await api.deleteVehicle(id)
  setDeleting(false)
  onClose()
}

<ConfirmationDialog
  isOpen={show}
  onClose={onClose}
  onConfirm={handleDelete}
  title="Delete Vehicle?"
  description="This action cannot be undone. All maintenance history will be lost."
  variant="danger"
  confirmLabel="Delete"
  isLoading={deleting}
/>
```

---

### Pattern 3: Quick Details Panel

```tsx
<Drawer
  isOpen={show}
  onClose={onClose}
  position="right"
  title={vehicle.name}
  description={vehicle.vin}
  footer={
    <Flex justify="end" gap="sm">
      <button onClick={onClose}>Close</button>
      <button onClick={onEdit}>Edit</button>
    </Flex>
  }
>
  <VehicleDetails vehicle={vehicle} />
</Drawer>
```

---

## Deprecation Timeline

### Phase 1: Now (Soft Deprecation)
- ✅ New Overlays system available
- ✅ Old systems marked `@deprecated`
- ✅ Both systems work side-by-side
- ⚠️ Console warnings for old systems

### Phase 2: Next Release (Hard Deprecation)
- ⚠️ Old systems throw warnings
- 📚 Migration guide prominent
- 🔧 Codemod tool available

### Phase 3: v2.0 (Removal)
- ❌ Old systems removed
- ✅ Only Overlays system remains

---

## Quick Reference

### All Available Overlays

```tsx
import {
  // Core overlays
  Dialog,              // General modal
  Drawer,              // Side panel
  Popover,             // Context menu
  Tooltip,             // Hover hint
  
  // Specialized helpers
  FormDialog,          // Form modal
  AlertDialog,         // System alert
  ConfirmationDialog   // Confirm action
} from '@/components/design-system'
```

---

## Need Help?

- 📖 See `/pages/overlays-showcase.tsx` for live examples
- 🔧 Check component source in `/components/design-system/Overlays.tsx`
- 💬 Ask in #design-system Slack channel

---

## Summary

**3 Steps to Migrate:**

1. ✅ Update imports (`BaseModal` → `Dialog`)
2. ✅ Update component names
3. ✅ Add new props (variants, loading states)

**That's it!** The API is 95% compatible. Most migrations are just a rename.

Happy migrating! 🚀
