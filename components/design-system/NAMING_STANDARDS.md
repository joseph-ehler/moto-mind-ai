# Design System Naming Standards

## 📁 Folder Naming Conventions

### **Rule 1: All Folders Use Lowercase**
✅ **DO:** `primitives/`, `patterns/`, `forms/`, `feedback/`, `calendar/`  
❌ **DON'T:** `Primitives/`, `Calendar/`, `FilePreview/`

### **Rule 2: Use Kebab-Case for Multi-Word Folders**
✅ **DO:** `file-preview/`, `section-headers/`  
❌ **DON'T:** `filePreview/`, `file_preview/`, `FilePreview/`

### **Current Folder Structure:**
```
design-system/
├── primitives/       ✅ lowercase, single word
├── patterns/         ✅ lowercase, single word
├── forms/            ✅ lowercase, single word
├── feedback/         ✅ lowercase, single word
├── utilities/        ✅ lowercase, single word
├── tokens/           ✅ lowercase, single word
├── calendar/         ✅ lowercase, single word
└── file-preview/     ✅ lowercase, kebab-case
```

---

## 📏 File Naming Conventions

### **Rule 1: PascalCase for All TypeScript Files**
✅ **DO:** `OverlayTypes.ts`, `OverlayUtils.ts`, `FormFields.tsx`  
❌ **DON'T:** `overlay-types.ts`, `overlay-utils.ts`, `form-fields.tsx`

### **Rule 2: Plural for Multiple Related Components**
Use plural names when a file exports multiple related components.

✅ **Examples:**
- `Heroes.tsx` → Exports: `MarketingHero`, `PageHero`, `DashboardHero`, etc.
- `Modals.tsx` → Exports: `Modal`, `Dialog`, `Sheet`
- `Cards.tsx` → Exports: `Card`, `BaseCard`, `StatsCard`
- `Overlays.tsx` → Exports: `Popover`, `Tooltip`, `Dropdown`

### **Rule 3: Singular for Single Component**
Use singular names when a file exports primarily one component.

✅ **Examples:**
- `Button.tsx` → Exports: `Button`, `ButtonGroup`
- `Search.tsx` → Exports: `Search`
- `Rating.tsx` → Exports: `Rating`

### **Rule 4: Descriptive Names for Component Collections**
Use descriptive names for logical groupings.

✅ **Examples:**
- `FormFields.tsx` → Multiple form field components
- `ActionBars.tsx` → Multiple action bar variants
- `LoadingStates.tsx` → Multiple loading state components
- `SectionHeaders.tsx` → Multiple section header patterns

### **Rule 5: No Prefix/Suffix for Standard Components**
Avoid generic prefixes like "Elite", "Advanced", "Enhanced".

✅ **DO:** `Typography.tsx`, `Surfaces.tsx`  
❌ **DON'T:** `EliteTypography.tsx`, `AdvancedSurfaces.tsx`

**Exception:** Use descriptive prefixes when they add semantic meaning:
- ✅ `AdvancedLayout.tsx` (distinct from basic `Layout.tsx`)
- ✅ `AdvancedTypography.tsx` (extended typography features)

---

## 📁 Current File Names (Standardized)

### **Primitives/**
- ✅ `Button.tsx` - Single component
- ✅ `ColoredBox.tsx` - Single component
- ✅ `Layout.tsx` - Layout primitives collection
- ✅ `Surfaces.tsx` - Surface components
- ✅ `Typography.tsx` - Typography components
- ✅ `AdvancedSurfaces.tsx` - Extended surface features
- ✅ `AdvancedTypography.tsx` - Extended typography features

### **Patterns/**
- ✅ `AdvancedLayout.tsx` - Complex layout patterns
- ✅ `Card.tsx` - Base card (consider merging)
- ✅ `Cards.tsx` - Card variants collection
- ✅ `DataDisplay.tsx` - Data display components
- ✅ `EmptyStates.tsx` - Empty state patterns
- ✅ `Heroes.tsx` - Hero component collection
- ✅ `List.tsx` - List component variants
- ✅ `Navigation.tsx` - Navigation components
- ✅ `SectionHeaders.tsx` - Section header patterns
- ✅ `StatsCards.tsx` - Statistics card variants

### **Forms/**
- ✅ `CheckboxRadio.tsx` - Checkbox & Radio components
- ✅ `ColorPicker.tsx` - Single component
- ✅ `Combobox.tsx` - Single component
- ✅ `DatePicker.tsx` - Date picker variants
- ✅ `FormFields.tsx` - Form field collection
- ✅ `FormSection.tsx` - Single component
- ✅ `NumberInput.tsx` - Single component
- ✅ `OTPInput.tsx` - Single component
- ✅ `PasswordInput.tsx` - Single component
- ✅ `PhoneInput.tsx` - Single component
- ✅ `Rating.tsx` - Single component
- ✅ `SwitchSlider.tsx` - Switch & Slider components
- ✅ `TimePicker.tsx` - Single component

### **Feedback/**
- ✅ `LoadingSkeleton.tsx` - Skeleton loader component
- ✅ `LoadingStates.tsx` - Loading state collection
- ✅ `ModalInternals.tsx` - Modal internal utilities
- ✅ `Modals.tsx` - Modal component collection
- ✅ `ModalSystem.tsx` - Modal system manager
- ✅ `Notifications.tsx` - Notification components
- ✅ `OverlayTypes.ts` - ✨ Standardized (was `overlay-types.ts`)
- ✅ `OverlayUtils.ts` - ✨ Standardized (was `overlay-utils.ts`)
- ✅ `Overlays.tsx` - Overlay component collection
- ✅ `ToastNotifications.tsx` - Toast notification system

### **Utilities/**
- ✅ `ActionBars.tsx` - Action bar collection
- ✅ `FilePreview.tsx` - Single component (complex)
- ✅ `FileUpload.tsx` - Single component
- ✅ `Search.tsx` - Search component collection

---

## 🔄 Changes Made

### **Phase 1: Fixed Kebab-Case**
❌ Before: `overlay-types.ts`, `overlay-utils.ts`  
✅ After: `OverlayTypes.ts`, `OverlayUtils.ts`

**Rationale:** TypeScript/React convention uses PascalCase for all module files.

### **Phase 2: Removed "Elite" Prefix**
❌ Before: `EliteTypography.tsx`, `EliteSurfaces.tsx`  
✅ After: `AdvancedTypography.tsx`, `AdvancedSurfaces.tsx`

**Rationale:** "Elite" doesn't convey meaning. "Advanced" indicates extended features beyond the base.

---

## 💡 Future Considerations

### **Card.tsx vs Cards.tsx**
Currently both exist. **Recommendation:**
- Keep `Cards.tsx` as the main file with all card variants
- Consider deprecating `Card.tsx` or merging its exports

### **Notification Naming**
- `Notifications.tsx` - Notification components
- `ToastNotifications.tsx` - Toast-specific system

**Recommendation:** Could consolidate into single `Notifications.tsx` file.

---

## ✅ Quick Reference

| Type | Naming Pattern | Example |
|------|---------------|---------|
| **Folders** | lowercase or kebab-case | `primitives/`, `file-preview/` |
| Single component | Singular PascalCase | `Button.tsx`, `Search.tsx` |
| Multiple components | Plural PascalCase | `Heroes.tsx`, `Modals.tsx` |
| Component collection | Descriptive PascalCase | `FormFields.tsx`, `ActionBars.tsx` |
| Utility/Type files | PascalCase | `OverlayTypes.ts`, `OverlayUtils.ts` |
| Extended features | Advanced prefix | `AdvancedLayout.tsx` |

---

## 🚫 Anti-Patterns to Avoid

### **Folders:**
❌ PascalCase folders: `Calendar/`, `FilePreview/`  
❌ camelCase folders: `filePreview/`, `formFields/`  
❌ snake_case folders: `file_preview/`, `form_fields/`  

### **Files:**
❌ kebab-case files: `form-fields.tsx`, `overlay-types.ts`  
❌ snake_case files: `form_fields.tsx`  
❌ Generic prefixes: `EliteButton.tsx`, `SuperCard.tsx`  
❌ Redundant suffixes: `ButtonComponent.tsx`  
❌ Inconsistent plurality: Mix of singular/plural in same category  

---

## 📝 Change Log

### **Phase 1: Folder Standardization**
- ❌ `Calendar/` → ✅ `calendar/`
- ❌ `FilePreview/` → ✅ `file-preview/`

### **Phase 2: File Standardization**
- ❌ `overlay-types.ts` → ✅ `OverlayTypes.ts`
- ❌ `overlay-utils.ts` → ✅ `OverlayUtils.ts`
- ❌ `EliteTypography.tsx` → ✅ `AdvancedTypography.tsx`
- ❌ `EliteSurfaces.tsx` → ✅ `AdvancedSurfaces.tsx`

---

**Last Updated:** October 2025  
**Status:** ✅ Fully Standardized (Folders + Files)
