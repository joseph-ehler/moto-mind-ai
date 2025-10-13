# Modal System Guide

## Overview

Comprehensive modal components built on the MotoMind Design System foundation with z-index management, focus trapping, keyboard navigation, and Card integration.

---

## Modal Types

### 1. BaseModal
**Use for:** Custom modal content when other variants don't fit

```tsx
<BaseModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  size="md"
  closeOnOverlayClick={true}
  closeOnEscape={true}
>
  <div className="p-6">
    Your custom content here
  </div>
</BaseModal>
```

**Props:**
- `isOpen` - Control modal visibility
- `onClose` - Close callback
- `size` - `'sm' | 'md' | 'lg' | 'xl' | 'full'`
- `closeOnOverlayClick` - Allow clicking outside to close (default: true)
- `closeOnEscape` - Allow ESC key to close (default: true)
- `showCloseButton` - Show X button (default: true)

**Features:**
- ✅ Z-index: 1300 (from `zIndex.modal`)
- ✅ Scroll lock on body
- ✅ ESC key handling
- ✅ Focus ring on modal
- ✅ Backdrop blur
- ✅ Smooth animations (fade + zoom)
- ✅ Portal to body (rendered outside React tree)

---

### 2. ContentModal
**Use for:** Structured content with header and optional footer

```tsx
<ContentModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Modal Title"
  description="Optional description"
  footer={
    <div className="flex justify-end gap-3">
      <button onClick={onClose}>Cancel</button>
      <button onClick={onConfirm}>Confirm</button>
    </div>
  }
>
  <Text>Your content here</Text>
</ContentModal>
```

**Props:**
- All BaseModal props, plus:
- `title` - Modal heading
- `description` - Optional subtitle
- `footer` - Optional footer component

**Layout:**
- Header: Title + description, bottom border
- Content: Scrollable area
- Footer: Optional actions, top border, gray background

---

### 3. AlertModal
**Use for:** Contextual alerts and confirmations

```tsx
<AlertModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  variant="error"
  title="Delete Failed"
  description="Unable to delete the item. Please try again."
  onConfirm={handleRetry}
  confirmLabel="Retry"
  cancelLabel="Cancel"
  isLoading={isLoading}
/>
```

**Variants:**
- `info` - Blue, informational
- `success` - Green, success confirmation
- `warning` - Yellow, warnings/cautions
- `error` - Red, errors/failures

**Props:**
- `variant` - Alert type
- `title` - Alert title
- `description` - Alert message
- `onConfirm` - Confirm callback
- `confirmLabel` - Confirm button text (default: "Confirm")
- `cancelLabel` - Cancel button text (default: "Cancel")
- `isLoading` - Show loading state

**Features:**
- ✅ Uses AlertCard component
- ✅ Semantic colors per variant
- ✅ Two-button layout
- ✅ Loading state support

---

### 4. FormModal
**Use for:** Form submissions

```tsx
<FormModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Create User"
  description="Enter user details"
  onSubmit={handleSubmit}
  submitLabel="Create"
  isLoading={isLoading}
  error={errorMessage}
>
  <Stack spacing="md">
    <Input label="Name" value={name} onChange={setName} />
    <Input label="Email" value={email} onChange={setEmail} />
  </Stack>
</FormModal>
```

**Props:**
- `title` - Form title
- `description` - Optional description
- `onSubmit` - Form submit handler (can be async)
- `submitLabel` - Submit button text (default: "Submit")
- `cancelLabel` - Cancel button text (default: "Cancel")
- `isLoading` - Show loading state
- `error` - Error message (displayed as ColoredCard)

**Features:**
- ✅ Wraps content in `<form>`
- ✅ Handles submit event
- ✅ Error display with ColoredCard
- ✅ Loading state on submit button
- ✅ Footer with cancel/submit buttons

---

### 5. ConfirmationModal
**Use for:** Simple yes/no confirmations

```tsx
<ConfirmationModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Confirm Delete"
  description="Are you sure? This cannot be undone."
  onConfirm={handleDelete}
  isDangerous={true}
  confirmLabel="Delete"
  isLoading={isLoading}
/>
```

**Props:**
- `title` - Confirmation title
- `description` - Confirmation message
- `onConfirm` - Confirm callback (can be async)
- `confirmLabel` - Confirm button text (default: "Confirm")
- `cancelLabel` - Cancel button text (default: "Cancel")
- `isDangerous` - Use red button (default: false)
- `isLoading` - Show loading state

**isDangerous:**
- `false` - Blue primary button
- `true` - Red destructive button

---

### 6. Drawer
**Use for:** Side panels and secondary navigation

```tsx
<Drawer
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Filters"
  description="Filter your results"
  position="right"
  width="md"
>
  <Stack spacing="md">
    <FilterSection />
    <FilterSection />
  </Stack>
</Drawer>
```

**Props:**
- `title` - Drawer title
- `description` - Optional subtitle
- `position` - `'left' | 'right'` (default: 'right')
- `width` - `'sm' | 'md' | 'lg'` (default: 'md')
- All other BaseModal props

**Features:**
- ✅ Slides in from left or right
- ✅ Full height
- ✅ Scrollable content
- ✅ Same z-index as modals

---

## When to Use Which Modal

| Use Case | Modal Type | Why |
|----------|-----------|-----|
| Custom content | BaseModal | Most flexible |
| Article/docs | ContentModal | Structured layout |
| Alert/notify | AlertModal | Contextual styling |
| Form submission | FormModal | Built-in form handling |
| Yes/No confirm | ConfirmationModal | Simple, focused |
| Filters/settings | Drawer | Side panel pattern |

---

## Best Practices

### ✅ Do

1. **Use semantic variants:**
   ```tsx
   // Error alert
   <AlertModal variant="error" ... />
   
   // Dangerous action
   <ConfirmationModal isDangerous ... />
   ```

2. **Handle loading states:**
   ```tsx
   <FormModal
     isLoading={isSubmitting}
     onSubmit={async (e) => {
       setIsSubmitting(true)
       await api.submit()
       setIsSubmitting(false)
     }}
   />
   ```

3. **Provide clear labels:**
   ```tsx
   <ConfirmationModal
     title="Delete Account"
     description="This action cannot be undone"
     confirmLabel="Delete Account"
     cancelLabel="Keep Account"
   />
   ```

4. **Use appropriate sizes:**
   ```tsx
   // Confirmations
   <ConfirmationModal size="sm" ... />
   
   // Forms
   <FormModal size="md" ... />
   
   // Content
   <ContentModal size="lg" ... />
   ```

### ❌ Don't

1. **Don't nest modals** - Handle state to show one at a time
2. **Don't use modals for large forms** - Consider full page instead
3. **Don't forget loading states** - Always handle async actions
4. **Don't use vague labels** - "OK" is worse than "Delete Account"
5. **Don't forget error handling** - Display errors in FormModal

---

## Accessibility Features

### Built-in

- ✅ **Focus trap** - Tab cycles within modal
- ✅ **ESC key** - Close modal with Escape
- ✅ **Focus ring** - Visible keyboard focus indicators
- ✅ **ARIA roles** - `role="dialog"` and `aria-modal="true"`
- ✅ **Scroll lock** - Body scroll disabled when open
- ✅ **Portal** - Rendered at body level, outside React tree

### Testing

```tsx
// Keyboard navigation
1. Press Tab - Should cycle through interactive elements
2. Press Shift+Tab - Should cycle backwards
3. Press Escape - Should close modal
4. Press Enter on button - Should trigger action

// Screen reader
1. Modal announces as dialog
2. Title read first
3. Description read second
4. Buttons have clear labels
```

---

## Common Patterns

### Delete Confirmation

```tsx
const [isDeleting, setIsDeleting] = useState(false)

<ConfirmationModal
  isOpen={showDelete}
  onClose={() => setShowDelete(false)}
  title="Delete Item"
  description="This action cannot be undone"
  isDangerous
  confirmLabel="Delete"
  isLoading={isDeleting}
  onConfirm={async () => {
    setIsDeleting(true)
    await api.delete(itemId)
    setIsDeleting(false)
    setShowDelete(false)
  }}
/>
```

### Form with Validation

```tsx
const [error, setError] = useState('')
const [isSubmitting, setIsSubmitting] = useState(false)

<FormModal
  isOpen={showForm}
  onClose={() => setShowForm(false)}
  title="Create User"
  onSubmit={async (e) => {
    setError('')
    setIsSubmitting(true)
    
    try {
      await api.createUser(formData)
      setShowForm(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }}
  isLoading={isSubmitting}
  error={error}
>
  <Input ... />
</FormModal>
```

### Success Alert

```tsx
<AlertModal
  isOpen={showSuccess}
  onClose={() => setShowSuccess(false)}
  variant="success"
  title="Success!"
  description="Your changes have been saved"
  onConfirm={() => setShowSuccess(false)}
  confirmLabel="Got it"
/>
```

### Settings Drawer

```tsx
<Drawer
  isOpen={showSettings}
  onClose={() => setShowSettings(false)}
  title="Settings"
  description="Customize your experience"
  position="right"
  width="md"
>
  <Stack spacing="lg">
    <BaseCard padding="md">
      <Heading level="subtitle">Appearance</Heading>
      <ThemeSelector />
    </BaseCard>
    
    <BaseCard padding="md">
      <Heading level="subtitle">Notifications</Heading>
      <NotificationSettings />
    </BaseCard>
  </Stack>
</Drawer>
```

---

## Integration with Cards

Modals are designed to work seamlessly with Card components:

```tsx
<ContentModal
  isOpen={isOpen}
  onClose={onClose}
  title="Dashboard"
>
  <Grid columns={2} gap="md">
    <MetricCard
      label="Revenue"
      value="$124K"
      trend={{ value: "+12%", direction: "up" }}
    />
    
    <FeatureCard
      icon={<Zap />}
      title="Quick Action"
      description="Do something fast"
    />
  </Grid>
</ContentModal>
```

---

## Z-Index Management

All modals use `zIndex.modal` (1300) from the design tokens:

```tsx
// Layering order (low to high)
zIndex.base      // 0    - Base layer
zIndex.dropdown  // 1000 - Dropdowns
zIndex.sticky    // 1100 - Sticky headers
zIndex.fixed     // 1200 - Fixed elements
zIndex.modal     // 1300 - Modals ✅
zIndex.popover   // 1400 - Popovers
zIndex.toast     // 1500 - Toast notifications
zIndex.tooltip   // 1600 - Tooltips
```

Modals will appear above dropdowns but below toasts/tooltips.

---

## Performance Tips

1. **Lazy load modal content:**
   ```tsx
   {isOpen && (
     <FormModal ... >
       <HeavyComponent />
     </FormModal>
   )}
   ```

2. **Use React.memo for complex modals:**
   ```tsx
   const ExpensiveModal = React.memo(ContentModal)
   ```

3. **Avoid re-renders:**
   ```tsx
   // Memoize callbacks
   const handleSubmit = useCallback(async () => {
     await api.submit()
   }, [])
   ```

---

## Migration from Legacy

If you have old modal code:

```tsx
// OLD (BaseModal.tsx)
<BaseModal isOpen={isOpen} onClose={onClose}>
  <ModalHeader>
    <h2>{title}</h2>
  </ModalHeader>
  <ModalContent>
    {content}
  </ModalContent>
  <ModalFooter>
    <Button onClick={onConfirm}>Confirm</Button>
  </ModalFooter>
</BaseModal>

// NEW (Modals.tsx)
<ContentModal
  isOpen={isOpen}
  onClose={onClose}
  title={title}
  footer={
    <button onClick={onConfirm}>Confirm</button>
  }
>
  {content}
</ContentModal>
```

---

## Summary

**6 modal types for all use cases:**
- **BaseModal** - Custom content
- **ContentModal** - Structured header/content/footer
- **AlertModal** - Contextual alerts
- **FormModal** - Form submissions
- **ConfirmationModal** - Yes/no decisions
- **Drawer** - Side panels

**All modals include:**
- ✅ Z-index management (1300)
- ✅ Scroll lock
- ✅ ESC key support
- ✅ Focus ring
- ✅ Backdrop blur
- ✅ Smooth animations
- ✅ Portal rendering
- ✅ TypeScript support

**Based on design system:**
- Uses Card components
- Uses focusRing tokens
- Uses interactionStates tokens
- Uses z-index scale
- Follows accessibility guidelines
