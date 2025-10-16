# Modal Design System

A comprehensive, standardized modal system for MotoMind AI with consistent UX patterns across the entire application.

## 🎯 Design Principles

- **Consistent spacing and proportions** across all modal types
- **Card-based information architecture** for complex forms
- **Responsive and accessible** by default
- **Intelligent viewport height handling** - Works on all devices
- **Auto-scrolling content** - Never clips on small screens
- **Loading states and error handling** built-in
- **Keyboard navigation** (ESC to close)
- **Backdrop blur** for visual depth
- **Smooth animations** for professional feel

## 🛡️ **IMPORTANT: Modal Governance**

**You must ALWAYS use standardized modals. Custom modals are prohibited.**

- **Quick Start:** Use the [Decision Tree](#-modal-selection-decision-tree) below
- **Most Common:** `BlockFormModal` fits 90% of use cases
- **Need Help?** Import `modalHelpers` from `modal-selector.ts`
- **Full Governance:** See [MODAL_GOVERNANCE.md](./MODAL_GOVERNANCE.md)

```tsx
// ✅ DO THIS
import { BlockFormModal } from '@/components/modals'
<BlockFormModal sections={sections} />

// ❌ NEVER DO THIS  
import { Dialog } from '@/components/ui/dialog'
<Dialog><DialogContent>...</DialogContent></Dialog>
```

---

## 📊 Modal Selection Decision Tree

```
Need a modal?
├─ Destructive action? → AlertModal (variant="danger")
├─ Simple message? → AlertModal (variant="info")
├─ Single field? → SimpleFormModal
├─ 2-5 sections? → BlockFormModal ⭐ (Most common!)
├─ Multi-step wizard? → StepperModal (TYPE 4)
├─ Rich content/images? → FullWidthModal
└─ Not sure? → BlockFormModal (default choice)
```

**💡 Tip:** Import `modal-selector.ts` for programmatic recommendations!

---

## 📦 Available Modal Types

### 1. SimpleFormModal (TYPE 1)
**Use Cases:** Quick edits, single-purpose forms, simple confirmations with input

**Size:** `max-w-md` (448px)

**Example:**
```tsx
import { SimpleFormModal } from '@/components/modals'

<SimpleFormModal
  isOpen={isOpen}
  onClose={onClose}
  onSubmit={handleSubmit}
  title="Add Note"
  description="Add a quick note to this vehicle"
  icon={<Pencil className="w-6 h-6 text-blue-600" />}
  submitLabel="Save Note"
  isLoading={isLoading}
  error={error}
>
  <div>
    <Label>Note</Label>
    <Textarea placeholder="Enter your note..." />
  </div>
</SimpleFormModal>
```

---

### 2. BlockFormModal (TYPE 2) ⭐ Most Common
**Use Cases:** Medium complexity forms with 2-4 sections, multiple field types

**Size:** `max-w-2xl` (672px)

**Design:** Clean flat sections with dividers (no nested cards - avoids "inception" effect)

**Example:**
```tsx
import { BlockFormModal } from '@/components/modals'

const sections = [
  {
    id: 'basic-info',
    title: 'Basic Information',
    description: 'Essential vehicle details',
    content: (
      <>
        <div>
          <Label>VIN</Label>
          <Input value={vin} onChange={...} />
        </div>
        <div>
          <Label>Year</Label>
          <Input type="number" value={year} onChange={...} />
        </div>
      </>
    ),
  },
  {
    id: 'location',
    title: 'Garage Location',
    description: 'Where is this vehicle stored?',
    content: <GarageSelector />,
    show: showGarageSection, // Conditional visibility
  },
]

<BlockFormModal
  isOpen={isOpen}
  onClose={onClose}
  onSubmit={handleSubmit}
  title="Edit Vehicle"
  description="Update vehicle information"
  icon={<Car className="w-6 h-6 text-blue-600" />}
  sections={sections}
  isLoading={isLoading}
/>

{/* Note: CardFormModal is aliased to BlockFormModal for backward compatibility */}
```

---

### 3. StepperModal (TYPE 4) ⭐ For Wizards
**Use Cases:** Multi-step wizards, onboarding flows, guided capture workflows

**Size:** `max-w-2xl` (672px)

**Features:**
- Accordion-style step navigation
- Progress tracking with visual indicators
- Step validation (can't proceed until requirements met)
- Auto-advance on completion
- Accessible step navigation

**Example:**
```tsx
import { StepperModal, Step } from '@/components/modals'

const [currentStep, setCurrentStep] = useState('step-1')
const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set())

const steps: Step[] = [
  {
    id: 'instructions',
    title: 'Preparation',
    content: (
      <div>
        <p>Follow these steps...</p>
        <ol>
          <li>Park safely</li>
          <li>Turn on ignition</li>
        </ol>
      </div>
    ),
    canProceed: true,
  },
  {
    id: 'capture',
    title: 'Take Photo',
    content: <CameraInterface />,
    canProceed: capturedPhoto !== null, // Can't proceed without photo
    ctaLabel: 'Review Photo',
  },
  {
    id: 'review',
    title: 'Review Results',
    content: <DataPreview data={capturedData} />,
    canProceed: true,
    ctaLabel: 'Save to Timeline',
  },
]

<StepperModal
  isOpen={isOpen}
  onClose={onClose}
  title="Dashboard Capture"
  description="Guided photo capture workflow"
  icon={<Camera className="w-6 h-6 text-blue-600" />}
  steps={steps}
  currentStepId={currentStep}
  onStepChange={setCurrentStep}
  onStepComplete={(stepId) => {
    setCompletedSteps(prev => new Set([...prev, stepId]))
    // Auto-advance logic here
  }}
  onCameraCapture={handleCamera} // Optional camera controls
  onFileUpload={handleUpload}    // Optional file upload
/>

{/* Note: AccordionStepperModal is aliased to StepperModal for backward compatibility */}
```

---

### 4. FullWidthModal (TYPE 3)
**Use Cases:** Rich content, image upload, document processing, split layouts

**Size:** `max-w-4xl` (896px)

**Example:**
```tsx
import { FullWidthModal } from '@/components/modals'

<FullWidthModal
  isOpen={isOpen}
  onClose={onClose}
  onSubmit={handleSubmit}
  title="Process Dashboard Image"
  description="Review and confirm extracted data"
  icon={<Camera className="w-6 h-6 text-blue-600" />}
  submitLabel="Confirm & Save"
  secondaryAction={{
    label: 'Retry Scan',
    onClick: handleRetry,
  }}
  isLoading={isProcessing}
>
  <div className="grid grid-cols-2 gap-6">
    <div>
      <img src={imageUrl} alt="Dashboard" className="rounded-xl" />
    </div>
    <div>
      <h3>Extracted Data</h3>
      {/* Form fields */}
    </div>
  </div>
</FullWidthModal>
```

---

### 4. AlertModal (TYPE 6)
**Use Cases:** Destructive actions, important confirmations, warnings

**Size:** `max-w-sm` (384px)

**Variants:** `'info' | 'warning' | 'danger' | 'success'`

**Example:**
```tsx
import { AlertModal } from '@/components/modals'

<AlertModal
  isOpen={showDeleteConfirm}
  onClose={() => setShowDeleteConfirm(false)}
  onConfirm={handleDelete}
  title="Delete Vehicle?"
  description="This will permanently delete this vehicle and all its history. This action cannot be undone."
  variant="danger"
  confirmLabel="Delete"
  cancelLabel="Cancel"
  isLoading={isDeleting}
/>
```

---

## 🎨 Design Tokens

### Spacing
```tsx
import { MODAL_SPACING } from '@/components/modals'

// Header padding
MODAL_SPACING.headerPadding.simple    // 'px-6 py-4'
MODAL_SPACING.headerPadding.standard  // 'px-8 py-6'

// Content padding
MODAL_SPACING.contentPadding.simple      // 'p-6'
MODAL_SPACING.contentPadding.standard    // 'p-8'
MODAL_SPACING.contentPadding.withFooter  // 'p-8 pb-24'

// Footer padding
MODAL_SPACING.footerPadding  // 'p-6'

// Section spacing
MODAL_SPACING.sectionSpacing.compact   // 'space-y-4'
MODAL_SPACING.sectionSpacing.standard  // 'space-y-6'
MODAL_SPACING.sectionSpacing.relaxed   // 'space-y-8'
```

### Sizes
```tsx
import { modalSizeClasses } from '@/components/modals'

modalSizeClasses.sm    // 'max-w-sm'   (384px)
modalSizeClasses.md    // 'max-w-md'   (448px)
modalSizeClasses.lg    // 'max-w-2xl'  (672px)
modalSizeClasses.xl    // 'max-w-4xl'  (896px)
modalSizeClasses.full  // 'max-w-5xl'  (1024px)
```

---

## 🎯 Card Section Pattern

For `CardFormModal`, sections follow this structure:

```tsx
{
  id: 'unique-id',
  title: 'Section Title',
  description: 'Optional description',
  content: <YourFormFields />,
  show: true, // Optional: conditional visibility
}
```

**Visual Structure:**
```
┌─────────────────────────────────┐
│ Section Title                   │ ← px-8 py-6 border-b
│ Optional description            │
├─────────────────────────────────┤
│                                 │
│ Your form fields here           │ ← p-8 space-y-6
│                                 │
└─────────────────────────────────┘
```

---

## 📱 Viewport Height Handling

**Automatic across all devices:**
- **Mobile (`< 640px`)**: `max-h-[90vh]` - Maximum screen utilization
- **Desktop (`≥ 640px`)**: `max-h-[85vh]` - Comfortable spacing
- **Three-part layout**: Fixed header + scrollable content + fixed footer
- **Keyboard-aware**: Automatically adjusts when mobile keyboard appears
- **Content overflow**: Smooth scrolling when content exceeds viewport

**Structure:**
```tsx
┌─────────────────────────┐
│ Header (fixed)          │ ← Always visible
├─────────────────────────┤
│ Content (scrollable)    │ ← Grows/scrolls as needed
│ ...                     │
├─────────────────────────┤
│ Footer (fixed)          │ ← Always visible
└─────────────────────────┘
```

**See [RESPONSIVE_DESIGN.md](./RESPONSIVE_DESIGN.md) for detailed viewport handling documentation.**

---

## ♿ Accessibility Features

- ✅ **Keyboard navigation**: ESC key closes modal
- ✅ **Focus management**: Traps focus within modal
- ✅ **ARIA labels**: Proper labeling for screen readers
- ✅ **Backdrop click**: Configurable via `closeOnOverlayClick`
- ✅ **Loading states**: Disables interactions when processing
- ✅ **Error handling**: Consistent error display patterns
- ✅ **Scroll lock**: Body scroll disabled when modal open

---

## 🔧 Advanced Usage

### Custom BaseModal
For unique layouts not covered by the standard types:

```tsx
import { BaseModal, ModalHeader, ModalContent, ModalFooter } from '@/components/modals'

<BaseModal isOpen={isOpen} onClose={onClose} size="lg">
  <ModalHeader
    title="Custom Modal"
    description="Build your own layout"
    icon={<Sparkles />}
    onClose={onClose}
  />
  <ModalContent>
    {/* Your custom content */}
  </ModalContent>
  <ModalFooter>
    {/* Your custom footer */}
  </ModalFooter>
</BaseModal>
```

### Conditional Sections
```tsx
const sections = [
  {
    id: 'always-visible',
    title: 'Always Visible',
    content: <div>...</div>,
  },
  {
    id: 'conditional',
    title: 'Conditional Section',
    content: <div>...</div>,
    show: someCondition, // Only render if true
  },
]
```

---

## 📐 Migration Guide

### From Old Dialog to SimpleFormModal
```tsx
// Before
<Dialog open={isOpen} onOpenChange={onClose}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Add Note</DialogTitle>
    </DialogHeader>
    <form onSubmit={handleSubmit}>
      <Input />
      <DialogFooter>
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit">Save</Button>
      </DialogFooter>
    </form>
  </DialogContent>
</Dialog>

// After
<SimpleFormModal
  isOpen={isOpen}
  onClose={onClose}
  onSubmit={handleSubmit}
  title="Add Note"
  icon={<Pencil className="w-6 h-6 text-blue-600" />}
>
  <Input />
</SimpleFormModal>
```

### From Custom Modal to CardFormModal
```tsx
// Before: Custom modal with multiple sections
<div className="fixed inset-0...">
  <div className="bg-white rounded-3xl...">
    {/* Header */}
    {/* Section 1 */}
    {/* Section 2 */}
    {/* Footer */}
  </div>
</div>

// After: Structured CardFormModal
<CardFormModal
  isOpen={isOpen}
  onClose={onClose}
  onSubmit={handleSubmit}
  title="Edit Details"
  sections={[
    { id: 'section1', title: 'Section 1', content: <Fields1 /> },
    { id: 'section2', title: 'Section 2', content: <Fields2 /> },
  ]}
/>
```

---

## 🎨 Color & Icon Guidelines

### Icon Backgrounds
All modal headers use gradient backgrounds:
```tsx
className="w-12 h-12 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl flex items-center justify-center border border-blue-100"
```

### Alert Variants
- **Info**: Blue (`bg-blue-100`, `text-blue-600`)
- **Warning**: Amber (`bg-amber-100`, `text-amber-600`)
- **Danger**: Red (`bg-red-100`, `text-red-600`)
- **Success**: Emerald (`bg-emerald-100`, `text-emerald-600`)

---

## 📚 Examples in Codebase

- **SimpleFormModal**: Quick add note, Change status
- **CardFormModal**: `EditVehicleModal.tsx`, `EditEventModal.tsx`
- **FullWidthModal**: Dashboard capture, Receipt processing
- **AlertModal**: Delete confirmations, Destructive actions

---

## 🚀 Best Practices

1. **Always provide icons** for visual clarity
2. **Use descriptive titles and descriptions**
3. **Handle loading states** to prevent duplicate submissions
4. **Show errors clearly** with the built-in error prop
5. **Group related fields** into logical sections (CardFormModal)
6. **Use appropriate modal size** for content complexity
7. **Disable overlay close** during loading/processing
8. **Test keyboard navigation** (ESC key)

---

## 🔮 Future Enhancements

- [ ] StepperModal (TYPE 4) for multi-step workflows
- [ ] SidePanel (TYPE 5) for slide-out details
- [ ] HeroModal (TYPE 7) for feature announcements
- [ ] BottomSheet (TYPE 8) for mobile-first interactions
- [ ] Animation variants (slide, fade, zoom)
- [ ] Portal support for nested modals
- [ ] Focus trap utilities
- [ ] Modal history/stack management

---

**Status**: ✅ Production-ready core modal system with 4 primary types covering 90% of use cases.
