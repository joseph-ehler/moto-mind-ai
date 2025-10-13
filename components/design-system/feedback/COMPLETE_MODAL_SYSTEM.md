# Complete Modal System

## Overview

A comprehensive, production-ready modal system with standardized internal components to ensure consistent design language across all modals.

**Key Features:**
- ✅ 5 modal types covering all use cases
- ✅ 8 internal components for consistent structure
- ✅ Design system integration (zIndex, focusRing, ColoredBox)
- ✅ Flat section design (no nested cards)
- ✅ Full accessibility (ESC, focus trap, scroll lock)
- ✅ Loading states and error handling
- ✅ TypeScript support

---

## Modal Types

### 1. SimpleFormModal
**Use for:** Quick edits, single-purpose forms, simple input

**Size:** `md` (448px)

```tsx
<SimpleFormModal
  isOpen={isOpen}
  onClose={onClose}
  onSubmit={handleSubmit}
  title="Add Note"
  description="Add a quick note"
  icon={<Pencil className="w-6 h-6" />}
  iconColor="blue"
  submitLabel="Save"
  isLoading={isLoading}
  error={errorMessage}
>
  <ModalFormField label="Note" required>
    <textarea ... />
  </ModalFormField>
</SimpleFormModal>
```

---

### 2. BlockFormModal (Most Common)
**Use for:** 2-5 sections, standard forms

**Size:** `lg` (672px)

**Design:** Flat sections with dividers (no nested cards)

```tsx
const sections: ModalSectionConfig[] = [
  {
    id: 'basic',
    title: 'Basic Information',
    description: 'Essential details',
    content: (
      <Stack spacing="md">
        <ModalFormField label="Name" required>
          <input ... />
        </ModalFormField>
        <ModalFormField label="Email" required>
          <input ... />
        </ModalFormField>
      </Stack>
    )
  },
  {
    id: 'settings',
    title: 'Settings',
    description: 'Additional options',
    content: <SettingsFields />,
    show: showSettings // Conditional
  }
]

<BlockFormModal
  isOpen={isOpen}
  onClose={onClose}
  onSubmit={handleSubmit}
  title="Edit Profile"
  icon={<User className="w-6 h-6" />}
  sections={sections}
  isLoading={isLoading}
/>
```

---

### 3. FullWidthModal
**Use for:** Rich content, images, split layouts

**Size:** `xl` (896px)

```tsx
<FullWidthModal
  isOpen={isOpen}
  onClose={onClose}
  onSubmit={handleSubmit}
  title="Process Image"
  icon={<Camera className="w-6 h-6" />}
  submitLabel="Confirm"
  secondaryAction={{
    label: "Retry",
    onClick: handleRetry
  }}
  isLoading={isLoading}
>
  <Grid columns={2} gap="lg">
    <div>
      <img src={image} alt="Preview" />
    </div>
    <div>
      <ModalFormField label="Data">
        <input ... />
      </ModalFormField>
    </div>
  </Grid>
</FullWidthModal>
```

---

### 4. AlertModalSystem
**Use for:** Contextual alerts and confirmations

**Size:** `sm` (384px)

**Variants:** `'info' | 'success' | 'warning' | 'error'`

```tsx
<AlertModalSystem
  isOpen={isOpen}
  onClose={onClose}
  onConfirm={handleConfirm}
  title="Success!"
  description="Your changes have been saved"
  variant="success"
  confirmLabel="Got it"
  isLoading={isLoading}
/>
```

---

### 5. ConfirmationModalSystem
**Use for:** Simple yes/no decisions

**Size:** `sm` (384px)

```tsx
<ConfirmationModalSystem
  isOpen={isOpen}
  onClose={onClose}
  onConfirm={handleDelete}
  title="Delete Vehicle"
  description="This cannot be undone"
  isDangerous={true}
  confirmLabel="Delete"
  isLoading={isLoading}
/>
```

---

## Internal Components

### ModalHeader
**Consistent header with icon + title + description**

```tsx
<ModalHeader
  title="Modal Title"
  description="Optional description"
  icon={<Camera className="w-6 h-6" />}
  iconColor="blue" // blue, green, red, yellow, purple
  onClose={onClose}
  showCloseButton={true}
/>
```

**Features:**
- Gradient icon background
- Semantic icon colors
- Close button with focus ring
- Responsive padding

---

### ModalContent
**Scrollable content area with padding**

```tsx
<ModalContent padded={true}>
  <Stack spacing="md">
    {/* Your content */}
  </Stack>
</ModalContent>
```

**Features:**
- Auto-scrolling when content overflows
- Consistent padding
- Works with viewport height limits

---

### ModalSection
**Flat section with header + content + divider**

```tsx
<ModalSection
  title="Section Title"
  description="Optional description"
  showDivider={true}
>
  <Stack spacing="md">
    {/* Section content */}
  </Stack>
</ModalSection>
```

**Why flat sections?**
- ❌ Nested cards create visual "inception"
- ✅ Flat sections are cleaner
- ✅ Simple dividers separate content
- ✅ More content space

---

### ModalFormField
**Consistent field layout with label + input + error**

```tsx
<ModalFormField
  label="Field Label"
  required={true}
  error={fieldError}
  hint="Helpful hint text"
>
  <input type="text" ... />
</ModalFormField>
```

**Features:**
- Required indicator (*)
- Error display with icon
- Hint text
- Consistent spacing

---

### ModalActions
**Footer buttons with primary/secondary/cancel**

```tsx
<ModalActions
  primaryAction={{
    label: "Save",
    onClick: handleSave,
    loading: isLoading,
    variant: "primary" // or "destructive"
  }}
  secondaryAction={{
    label: "Reset",
    onClick: handleReset
  }}
  onCancel={onClose}
  cancelLabel="Cancel"
  align="right" // left, right, space-between
/>
```

**Features:**
- Loading state disables all buttons
- Destructive variant (red button)
- Flexible alignment
- Focus ring on all buttons

---

### ModalAlert
**Contextual feedback inside modals**

```tsx
<ModalAlert
  variant="error"
  title="Error"
  message="Something went wrong. Please try again."
/>

<ModalAlert
  variant="success"
  message="Changes saved successfully"
/>
```

**Variants:**
- `info` - Blue, informational
- `success` - Green, confirmations
- `warning` - Yellow, cautions
- `error` - Red, errors

---

### ModalDivider
**Simple section separator**

```tsx
<ModalDivider />
```

---

### ModalEmptyState
**For empty sections or no data**

```tsx
<ModalEmptyState
  icon={<Inbox className="w-12 h-12" />}
  title="No items"
  description="Add your first item to get started"
  action={{
    label: "Add Item",
    onClick: handleAdd
  }}
/>
```

---

## Design System Integration

### Z-Index
```tsx
// All modals use zIndex.modal (1300)
import { zIndex } from '@/lib/design-system/tokens'

style={{ zIndex: zIndex.modal }}
```

**Layering:**
- Dropdowns: 1000
- Sticky: 1100
- Fixed: 1200
- **Modals: 1300** ✅
- Popovers: 1400
- Toasts: 1500
- Tooltips: 1600

---

### Focus Ring
```tsx
// Uses focusRing.default from tokens
import { focusRing } from '@/lib/design-system/tokens'

className={focusRing.default}
// → focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
```

---

### Interaction States
```tsx
import { interactionStates } from '@/lib/design-system/tokens'

className={interactionStates.disabled.base}
// → disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
```

---

### Typography
```tsx
// Uses Heading and Text from design system
import { Heading, Text } from '@/components/design-system'

<Heading level="title">Modal Title</Heading>
<Text size="sm">Description</Text>
```

---

## Accessibility

### Built-in Features

**Focus Management:**
- Focus trapped within modal
- Tab cycles through interactive elements
- ESC key closes modal

**Keyboard Navigation:**
```tsx
// ESC key
useEffect(() => {
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
  }
  window.addEventListener('keydown', handleEscape)
  return () => window.removeEventListener('keydown', handleEscape)
}, [isOpen, onClose])
```

**Scroll Lock:**
```tsx
// Body scroll disabled when modal open
useEffect(() => {
  if (isOpen) {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }
}, [isOpen])
```

**ARIA:**
```tsx
<div
  role="dialog"
  aria-modal="true"
>
  {/* Modal content */}
</div>
```

---

## Common Patterns

### Form with Multiple Sections
```tsx
const sections = [
  {
    id: 'personal',
    title: 'Personal Information',
    content: <PersonalFields />
  },
  {
    id: 'address',
    title: 'Address',
    content: <AddressFields />
  },
  {
    id: 'preferences',
    title: 'Preferences',
    content: <PreferenceFields />,
    show: user.isPremium // Conditional
  }
]

<BlockFormModal
  sections={sections}
  ...
/>
```

---

### Form with Validation
```tsx
const [errors, setErrors] = useState({})

<BlockFormModal
  sections={[
    {
      id: 'form',
      title: 'Form',
      content: (
        <>
          <ModalFormField
            label="Email"
            required
            error={errors.email}
          >
            <input ... />
          </ModalFormField>
          <ModalFormField
            label="Password"
            required
            error={errors.password}
          >
            <input type="password" ... />
          </ModalFormField>
        </>
      )
    }
  ]}
  error={errors.general}
/>
```

---

### Dangerous Confirmation
```tsx
<ConfirmationModalSystem
  title="Delete Account"
  description="This action cannot be undone. All your data will be permanently deleted."
  isDangerous={true}
  confirmLabel="Delete Account"
  onConfirm={handleDeleteAccount}
/>
```

---

### Image Processing
```tsx
<FullWidthModal
  title="Process Dashboard"
  icon={<Camera />}
  secondaryAction={{
    label: "Retake Photo",
    onClick: handleRetake
  }}
>
  <Grid columns={2} gap="lg">
    <div>
      <Text className="font-semibold mb-2">Original</Text>
      <img src={original} alt="Original" />
    </div>
    <div>
      <Text className="font-semibold mb-2">Extracted Data</Text>
      <ModalFormField label="Mileage">
        <input ... />
      </ModalFormField>
    </div>
  </Grid>
</FullWidthModal>
```

---

## Best Practices

### ✅ Do

1. **Use ModalFormField for all inputs**
   ```tsx
   <ModalFormField label="Name" required>
     <input ... />
   </ModalFormField>
   ```

2. **Use ModalSection for BlockFormModal**
   ```tsx
   // Don't manually structure sections
   {
     id: 'section',
     title: 'Section',
     content: <Fields />
   }
   ```

3. **Show loading states**
   ```tsx
   isLoading={isSubmitting}
   ```

4. **Display errors clearly**
   ```tsx
   error={errorMessage}
   // or
   <ModalAlert variant="error" message={error} />
   ```

5. **Use appropriate size**
   - Simple forms: `md`
   - Standard forms: `lg`
   - Wide content: `xl`
   - Alerts: `sm`

---

### ❌ Don't

1. **Don't nest cards** - Use flat ModalSection
2. **Don't forget loading states** - Always handle async
3. **Don't mix modal types** - Use BlockFormModal for most forms
4. **Don't hardcode colors** - Use iconColor prop
5. **Don't create custom modals** - Use internal components

---

## Migration from Legacy

### From BaseModal
```tsx
// Before
<BaseModal isOpen={isOpen} onClose={onClose}>
  <div className="p-6">
    <h2>{title}</h2>
    <form>{fields}</form>
    <button>Submit</button>
  </div>
</BaseModal>

// After
<SimpleFormModal
  isOpen={isOpen}
  onClose={onClose}
  title={title}
  onSubmit={handleSubmit}
>
  {fields}
</SimpleFormModal>
```

---

### From Custom Sections
```tsx
// Before
<div className="border rounded-lg p-4">
  <h3>Section</h3>
  <div>{content}</div>
</div>

// After
<ModalSection title="Section">
  {content}
</ModalSection>
```

---

## Summary

**5 Modal Types:**
- SimpleFormModal - Quick forms
- BlockFormModal - Standard forms (most common)
- FullWidthModal - Wide content
- AlertModalSystem - Alerts
- ConfirmationModalSystem - Yes/no

**8 Internal Components:**
- ModalHeader
- ModalContent
- ModalSection
- ModalFormField
- ModalActions
- ModalAlert
- ModalDivider
- ModalEmptyState

**Design System:**
- ✅ Uses zIndex.modal
- ✅ Uses focusRing tokens
- ✅ Uses interactionStates
- ✅ Flat section design
- ✅ Full accessibility
- ✅ TypeScript support

**Everything feels like the same design language!** 🎉
