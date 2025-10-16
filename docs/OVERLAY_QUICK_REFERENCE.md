# Elite Overlay System - Quick Reference

## 🚀 Quick Start

### Import Everything
```tsx
import {
  // Components
  Modal, Drawer, Popover, Tooltip,
  FormModal, ConfirmationModal, AlertModal,
  
  // Loading Skeletons
  SkeletonOverlay, OverlaySkeletonForm, OverlaySkeletonTable,
  
  // Hooks
  useResponsiveSize, useOverlayBreakpoint,
  useScreenReaderAnnouncement, useKeyboardShortcut,
  formatShortcut, useResizeObserver,
  
  // Types
  type ModalProps, type DrawerProps,
  type EnhancedDrawerProps, type ResponsiveBreakpoints
} from '@/components/design-system'
```

---

## 📦 Components

### Modal
```tsx
<Modal
  isOpen={show}
  onClose={onClose}
  title="Add Vehicle"
  description="Enter vehicle details"
  size="lg"                    // sm | md | lg | xl | full
  variant="default"             // default | centered | fullscreen
  responsive={true}             // Auto-adapts to mobile
  closeOnOverlayClick={true}
  closeOnEscape={true}
  showCloseButton={true}
  footer={<ActionButtons />}
>
  {isLoading ? <SkeletonOverlay variant="form" /> : <Form />}
</Modal>
```

### Drawer
```tsx
<Drawer
  isOpen={show}
  onClose={onClose}
  position="right"              // left | right | top | bottom
  size="lg"                     // sm | md | lg | xl | full
  variant="form"                // default | form | detail | media | data
  responsive={true}
  stickyHeader={true}
  stickyFooter={true}
  title="Vehicle Details"
  footer={<Actions />}
>
  {content}
</Drawer>
```

### FormModal
```tsx
<FormModal
  isOpen={show}
  onClose={onClose}
  onSubmit={(e) => handleSubmit(e)}
  title="Add Vehicle"
  submitLabel="Save"
  isLoading={loading}
  error={error}
>
  <FormFields />
</FormModal>
```

### ConfirmationModal
```tsx
<ConfirmationModal
  isOpen={show}
  onClose={onClose}
  onConfirm={handleConfirm}
  title="Delete Vehicle?"
  description="This action cannot be undone."
  confirmLabel="Yes, Delete"
  variant="danger"              // default | danger
  isLoading={loading}
/>
```

### AlertModal
```tsx
<AlertModal
  isOpen={show}
  onClose={onClose}
  title="Success!"
  description="Vehicle added successfully."
  variant="success"             // info | success | warning | error
  actionLabel="Got it"
/>
```

---

## 🎣 Hooks

### useResponsiveSize
```tsx
const actualSize = useResponsiveSize('lg', {
  mobile: 'full',    // < 640px
  tablet: 'md',      // 640-1024px
  desktop: 'lg'      // > 1024px
})
```

### useOverlayBreakpoint
```tsx
const breakpoint = useOverlayBreakpoint()
// => 'mobile' | 'tablet' | 'desktop'

if (breakpoint === 'mobile') {
  // Mobile-specific logic
}
```

### useScreenReaderAnnouncement
```tsx
const announce = useScreenReaderAnnouncement()

// Announce to screen readers
announce('Search results updated')
announce('5 new messages')
```

### useKeyboardShortcut
```tsx
// Cmd+K (Mac) or Ctrl+K (Windows)
useKeyboardShortcut(
  { key: 'k', modifiers: ['cmd'] },
  () => setShowSearch(true)
)

// Shift+?
useKeyboardShortcut(
  { key: '?', modifiers: ['shift'] },
  () => setShowHelp(true)
)

// Esc (already built-in to all overlays)
```

### formatShortcut
```tsx
const shortcut = formatShortcut({ key: 'k', modifiers: ['cmd'] })
// => "⌘K" on Mac
// => "Ctrl+K" on Windows

<button title={`Open search (${shortcut})`}>
  Search
</button>
```

### useResizeObserver
```tsx
const contentRef = useRef<HTMLDivElement>(null)
const { width, height } = useResizeObserver(contentRef)

<div ref={contentRef}>
  Content size: {width}x{height}
</div>
```

---

## 💀 Loading Skeletons

### SkeletonOverlay (Full)
```tsx
<Modal>
  {isLoading ? (
    <SkeletonOverlay variant="form" />
    // Variants: form | card | list | table
  ) : (
    <Content />
  )}
</Modal>
```

### Individual Skeletons
```tsx
import {
  OverlaySkeleton,
  OverlaySkeletonText,
  OverlaySkeletonHeading,
  OverlaySkeletonButton,
  OverlaySkeletonForm,
  OverlaySkeletonCard,
  OverlaySkeletonList,
  OverlaySkeletonTable
} from '@/components/design-system'

// Use individually
<OverlaySkeletonHeading level="2" />
<OverlaySkeletonText width="80%" />
<OverlaySkeletonButton />

// Or use presets
<OverlaySkeletonForm fields={5} />
<OverlaySkeletonList items={10} />
<OverlaySkeletonTable rows={8} columns={5} />
```

---

## 📘 TypeScript

### Basic Types
```tsx
import type {
  ModalProps,
  DrawerProps,
  OverlaySize,
  DrawerPosition
} from '@/components/design-system'

const size: OverlaySize = 'lg'
const position: DrawerPosition = 'right'
```

### Enhanced Types (Type-Safe Variants)
```tsx
import type {
  EnhancedDrawerProps,
  FormDrawerProps,
  DataDrawerProps
} from '@/components/design-system'

// Type-safe by variant!
const formDrawer: FormDrawerProps = {
  variant: 'form',
  onSubmit: handleSubmit,  // Required for form variant
  errors: { email: 'Invalid' }
}

const dataDrawer: DataDrawerProps<Vehicle> = {
  variant: 'data',
  columns: [...],  // Required for data variant
  data: vehicles
}
```

### Type Guards
```tsx
import { isFormDrawer, isDataDrawer } from '@/components/design-system'

function renderDrawer(props: EnhancedDrawerProps) {
  if (isFormDrawer(props)) {
    // TypeScript knows props has onSubmit, errors, etc.
    return <FormContent onSubmit={props.onSubmit} />
  }
  
  if (isDataDrawer(props)) {
    // TypeScript knows props has columns, data, etc.
    return <DataTable columns={props.columns} data={props.data} />
  }
}
```

---

## 🎨 Styling

### Size Reference
```tsx
// Modal & Drawer sizes
'sm'   => 384px
'md'   => 448px  (default)
'lg'   => 512px
'xl'   => 672px
'full' => 896px
```

### Responsive Defaults
```tsx
// When responsive={true}:
Mobile (< 640px):    'full'
Tablet (640-1024px): Intelligently scales
Desktop (> 1024px):  Your specified size
```

### Drawer Variants
```tsx
'default' => px-6 py-4 (standard padding)
'form'    => px-6 py-4 (form-optimized)
'detail'  => px-8 py-6 (extra padding for reading)
'media'   => p-0       (no padding, full-bleed)
'data'    => px-4 py-3 (compact for tables)
```

---

## ⌨️ Keyboard Navigation

### Built-in
- **Esc** - Close overlay (if closeOnEscape={true})
- **Tab** - Navigate forward (focus trap)
- **Shift+Tab** - Navigate backward (focus trap)

### Custom Shortcuts
```tsx
// Common patterns
Cmd/Ctrl+K => Open search
Cmd/Ctrl+N => New item
Cmd/Ctrl+, => Open settings
Shift+?    => Show shortcuts
/          => Focus search
```

---

## ♿ Accessibility

### Automatic
✅ Focus trapping  
✅ Focus restoration  
✅ ARIA attributes  
✅ Screen reader announcements  
✅ Keyboard navigation  
✅ Reduced motion support  

### Manual Enhancements
```tsx
// Mark fixed elements for scroll compensation
<header data-fixed-element>...</header>

// Provide meaningful titles
<Modal title="Add Vehicle"> // Screen readers announce this

// Use descriptive labels
<button aria-label="Close dialog">×</button>
```

---

## 📱 Mobile Considerations

### Touch Gestures
```tsx
// Drawer supports swipe-to-dismiss
// Direction matches drawer position:
position="right" => Swipe right to dismiss
position="left"  => Swipe left to dismiss
position="top"   => Swipe up to dismiss
position="bottom"=> Swipe down to dismiss
```

### Responsive Best Practices
```tsx
// Let the system handle it
<Modal responsive={true}> // ✅ Good

// Or customize per breakpoint
<Drawer
  responsive={true}
  responsiveBreakpoints={{
    mobile: 'full',  // Full-screen on mobile
    tablet: 'lg',    // Large on tablet
    desktop: 'xl'    // Extra large on desktop
  }}
/>
```

---

## 🔧 Common Patterns

### Search Modal
```tsx
function SearchModal() {
  const [show, setShow] = useState(false)
  
  useKeyboardShortcut(
    { key: 'k', modifiers: ['cmd'] },
    () => setShow(true)
  )
  
  return (
    <Modal
      isOpen={show}
      onClose={() => setShow(false)}
      title="Search"
      size="lg"
      responsive={true}
    >
      <SearchInput />
    </Modal>
  )
}
```

### Form with Loading
```tsx
function EditDrawer() {
  const { data, isLoading } = useQuery('vehicle')
  
  return (
    <Drawer
      variant="form"
      size="lg"
      responsive={true}
      stickyFooter={true}
      footer={<SaveButton />}
    >
      {isLoading ? (
        <SkeletonOverlay variant="form" />
      ) : (
        <VehicleForm data={data} />
      )}
    </Drawer>
  )
}
```

### Confirmation with Danger
```tsx
async function handleDelete() {
  const confirmed = await showConfirmation({
    title: 'Delete Vehicle?',
    description: 'This cannot be undone.',
    variant: 'danger'
  })
  
  if (confirmed) {
    await deleteVehicle()
  }
}
```

---

## 🎯 Performance Tips

1. **Use React.memo on heavy content**
```tsx
const HeavyContent = React.memo(function HeavyContent() {
  // Expensive component
})
```

2. **Lazy load overlay content**
```tsx
const HeavyForm = React.lazy(() => import('./HeavyForm'))

<Modal>
  <Suspense fallback={<SkeletonOverlay variant="form" />}>
    <HeavyForm />
  </Suspense>
</Modal>
```

3. **Use appropriate size/variant**
```tsx
// Small confirmation = sm size
<ConfirmationModal size="sm" />

// Data table = xl size + data variant
<Drawer size="xl" variant="data" />
```

---

## 🐛 Troubleshooting

### Modal not closing
- Check `closeOnOverlayClick` and `closeOnEscape` props
- Verify `onClose` handler is provided
- Check if inside `isLoading` state

### Layout shift when opening
- System handles scrollbar compensation automatically
- Mark fixed headers with `data-fixed-element` attribute

### Content not scrolling
- System locks body scroll automatically
- Content inside modal/drawer scrolls freely
- Use `stickyHeader={true}` if header should stay visible

### TypeScript errors
- Import correct types from `/overlay-types` for enhanced variants
- Use type guards for discriminated unions
- Check if using compatible props per variant

---

## 📚 Documentation

- **Full Guide**: `/docs/OVERLAY_ELITE_COMPLETE.md`
- **Migration**: `/docs/OVERLAY_MIGRATION.md`
- **Terminology**: `/docs/OVERLAY_TERMINOLOGY.md`
- **Showcase**: `http://localhost:3005/overlays-showcase-complete`

---

## ✅ Checklist

Before deploying overlays:

- [ ] Provides meaningful `title` prop
- [ ] Includes `description` for context (optional but recommended)
- [ ] Has proper `footer` with action buttons
- [ ] Uses loading skeleton while content loads
- [ ] Handles mobile with `responsive={true}`
- [ ] Implements keyboard shortcuts for common actions
- [ ] Tests with screen reader
- [ ] Tests on mobile devices
- [ ] Verifies TypeScript types are correct

---

**You're all set! Ship it! 🚀**
