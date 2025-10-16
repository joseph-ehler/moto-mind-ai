# Overlay System - Official Terminology Guide

## 📚 Overview

This document defines the **official terminology** for MotoMind's Overlay System to eliminate confusion and ensure consistent usage across the platform.

---

## 🎯 The One Truth

**OVERLAYS** is the umbrella term for all floating UI elements that appear over the main content.

---

## 📦 Component Hierarchy

```
OVERLAYS (The System)
├── Modal (center popup, blocks screen)
├── Drawer (side panel, also called "Slideover")
├── Popover (contextual menu/content)
└── Tooltip (hover hint)
```

---

## ✅ Official Component Names

### 1. **Modal**
**What it is:** A centered popup that blocks interaction with the background.

**When to use:**
- Important actions requiring user attention
- Forms that need focus
- Critical information display
- Confirmations and alerts

**Variants:**
- `<Modal>` - Base modal
- `<FormModal>` - Modal with form helpers
- `<ConfirmationModal>` - Yes/No confirmations
- `<AlertModal>` - Info/Success/Warning/Error alerts

**Import:**
```tsx
import { Modal, FormModal, ConfirmationModal, AlertModal } from '@/components/design-system'
```

**Example:**
```tsx
<Modal 
  isOpen={show} 
  onClose={onClose}
  title="Add Vehicle"
>
  Content here
</Modal>
```

---

### 2. **Drawer** (aka Slideover)
**What it is:** A panel that slides in from the edge of the screen.

**When to use:**
- Details panels
- Navigation menus
- Filter panels
- Settings
- Forms that don't need full attention
- Data tables
- Media galleries

**Sizes:** `sm`, `md`, `lg`, `xl`, `full`

**Variants:** `default`, `form`, `detail`, `media`, `data`

**Positions:** `left`, `right`, `top`, `bottom`

**Import:**
```tsx
import { Drawer } from '@/components/design-system'
```

**Example:**
```tsx
<Drawer
  isOpen={show}
  onClose={onClose}
  position="right"
  size="md"
  variant="form"
  title="Vehicle Details"
>
  Content here
</Drawer>
```

---

### 3. **Popover**
**What it is:** A small contextual popup triggered by user interaction.

**When to use:**
- Dropdown menus
- Action menus
- Additional info
- Picker components

**Import:**
```tsx
import { Popover } from '@/components/design-system'
```

**Example:**
```tsx
<Popover
  isOpen={show}
  onClose={onClose}
  trigger={<button>Options</button>}
  position="bottom"
>
  Menu content
</Popover>
```

---

### 4. **Tooltip**
**What it is:** A hint that appears on hover/focus.

**When to use:**
- Icon explanations
- Disabled element explanations
- Helpful hints
- Keyboard shortcuts

**Import:**
```tsx
import { Tooltip } from '@/components/design-system'
```

**Example:**
```tsx
<Tooltip content="Click to edit">
  <button>✏️</button>
</Tooltip>
```

---

## ❌ Deprecated / Legacy Terms

### DO NOT USE:

| ❌ Old Term | ✅ Use Instead |
|-------------|----------------|
| `Dialog` | `Modal` |
| `FormDialog` | `FormModal` |
| `ConfirmationDialog` | `ConfirmationModal` |
| `AlertDialog` | `AlertModal` |
| `BaseModal` | `Modal` (from Overlays) |
| `ContentModal` | `Modal` |
| `LegacyDrawer` | `Drawer` (from Overlays) |

---

## 🔍 Why "Modal" instead of "Dialog"?

### Industry Standard
- **Everyone knows "modal"** - It's the universal term
- **Bootstrap** uses "Modal"
- **Material UI** uses "Modal"
- **Chakra UI** uses "Modal"
- **Ant Design** uses "Modal"

### Accessibility
- We still use `role="dialog"` in the HTML (W3C/ARIA spec)
- The component name and ARIA role don't have to match
- Users think "modal", developers say "modal", we should call it "modal"

### Clarity
- "Dialog" is ambiguous (dialog box, dialog window, dialog component?)
- "Modal" is specific and universally understood

---

## 📖 Glossary

### Overlay
The **umbrella term** for all floating UI (modals, drawers, popovers, tooltips).

### Modal
A **centered popup** that blocks the screen. User must interact with it before returning to main content.

### Drawer / Slideover
A **side panel** that slides in from an edge. Same thing, two names. We call it `Drawer` in code.

### Popover
A **contextual popup** anchored to a trigger element. For menus, options, pickers.

### Tooltip
A **hover hint** that provides additional information. Non-interactive.

### Backdrop / Overlay
The **semi-transparent background** that appears behind modals and drawers to dim the main content.

### Focus Trap
Keyboard navigation is **trapped within** the overlay. Tab cycles through focusable elements inside.

### Portal Rendering
Overlay is rendered in a **separate DOM tree** at document root, ensuring it appears above all other content.

---

## 🎯 When to Use What?

### Use Modal when:
- ✅ Action requires immediate attention
- ✅ User must complete or cancel before continuing
- ✅ Critical information must be acknowledged
- ✅ Form is the primary focus

### Use Drawer when:
- ✅ Content is supplementary (details, filters)
- ✅ User might need to see main content
- ✅ Long forms or data tables
- ✅ Navigation or settings
- ✅ Content is wide (tables, galleries)

### Use Popover when:
- ✅ Quick menu or picker
- ✅ Contextual actions
- ✅ Small amount of content
- ✅ Triggered by specific element

### Use Tooltip when:
- ✅ Icon needs explanation
- ✅ Hover hint
- ✅ Keyboard shortcut display
- ✅ Non-critical info

---

## 🚀 Migration Guide

### From Old Modals → New Overlays

```tsx
// ❌ OLD (Deprecated)
import { BaseModal, FormModal } from '@/components/design-system'

<BaseModal isOpen={show} onClose={onClose}>
  Content
</BaseModal>

// ✅ NEW (Overlays)
import { Modal } from '@/components/design-system'

<Modal isOpen={show} onClose={onClose} title="Title">
  Content
</Modal>
```

### From Dialog → Modal

```tsx
// ❌ OLD
import { Dialog, FormDialog } from '@/components/design-system'

<Dialog isOpen={show} onClose={onClose}>
  Content
</Dialog>

// ✅ NEW
import { Modal, FormModal } from '@/components/design-system'

<Modal isOpen={show} onClose={onClose}>
  Content
</Modal>
```

---

## 📋 Checklist

When creating new overlay-based UI, ask:

1. ✅ **Which type?** Modal, Drawer, Popover, or Tooltip?
2. ✅ **What size?** (for Modal/Drawer)
3. ✅ **What variant?** (for Drawer: form, detail, media, data)
4. ✅ **Position?** (for Drawer: left, right, top, bottom)
5. ✅ **Sticky header/footer?** (for Drawer)
6. ✅ **Accessibility?** Title, description, proper labels
7. ✅ **Actions?** Footer with buttons, close handlers

---

## 🎨 Naming Conventions

### State Variables
```tsx
// ✅ GOOD - Clear what's shown
const [showAddVehicleModal, setShowAddVehicleModal] = useState(false)
const [showDetailsDrawer, setShowDetailsDrawer] = useState(false)
const [showMenuPopover, setShowMenuPopover] = useState(false)

// ❌ BAD - Ambiguous
const [open, setOpen] = useState(false)
const [show, setShow] = useState(false)
```

### Component Props
```tsx
// ✅ GOOD
onClose={() => setShowAddVehicleModal(false)}

// ❌ BAD
onClick={handleClose}  // Not specific enough
```

---

## 🔧 Technical Terms

### Props Terminology

```tsx
isOpen: boolean          // Visibility state
onClose: () => void      // Close handler
title?: string           // Header title
description?: string     // Subtitle/context
size?: OverlaySize       // sm, md, lg, xl, full
variant?: string         // default, form, detail, media, data
position?: DrawerPosition // left, right, top, bottom
closeOnOverlayClick?: boolean
closeOnEscape?: boolean
showCloseButton?: boolean
stickyHeader?: boolean
stickyFooter?: boolean
footer?: ReactNode       // Footer content (usually actions)
```

---

## 📊 System Comparison

| Feature | Modal | Drawer | Popover | Tooltip |
|---------|-------|--------|---------|---------|
| **Blocks screen** | ✅ Yes | ⚠️ Partial | ❌ No | ❌ No |
| **Backdrop** | ✅ Yes | ✅ Yes | ❌ No | ❌ No |
| **Focus trap** | ✅ Yes | ✅ Yes | ⚠️ Optional | ❌ No |
| **Position** | Center | Edge | Anchored | Anchored |
| **Max size** | `full` | `full` | Auto | Auto |
| **Sticky header** | ✅ Yes | ✅ Yes | ❌ N/A | ❌ N/A |
| **Touch gestures** | ❌ No | ✅ Swipe | ❌ No | ❌ No |
| **Variants** | 3 types | 5 types | 1 | 1 |

---

## ✅ Best Practices

### DO:
- ✅ Use `Modal` for blocking interactions
- ✅ Use `Drawer` for supplementary content
- ✅ Always provide `title` for accessibility
- ✅ Use specific state variable names
- ✅ Add `description` for context
- ✅ Use `footer` for actions
- ✅ Choose appropriate size/variant

### DON'T:
- ❌ Use deprecated `Dialog` components
- ❌ Mix old and new systems
- ❌ Nest modals inside modals (use Drawer instead)
- ❌ Forget close handlers
- ❌ Skip accessibility props
- ❌ Use vague state names like `open`

---

## 🎉 Summary

**The Truth:**
- **OVERLAYS** = The system
- **Modal** = Centered popup
- **Drawer** = Side panel (aka Slideover)
- **Popover** = Contextual menu
- **Tooltip** = Hover hint

**Deprecated:**
- ❌ Dialog (use Modal)
- ❌ Old modal systems

**Source of Truth:**
- `/components/design-system/Overlays.tsx` - Implementation
- `/docs/OVERLAY_TERMINOLOGY.md` - This guide
- `/pages/overlays-showcase.tsx` - Examples

---

**Last Updated:** 2025-10-04

**Status:** ✅ Official - Use this guide for all overlay-related development
