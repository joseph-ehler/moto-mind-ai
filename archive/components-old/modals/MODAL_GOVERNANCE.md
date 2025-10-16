# Modal Governance System 🛡️

## 🎯 **Core Principle**

**You must ALWAYS use the standardized modal system. Custom modals are prohibited unless content requirements cannot be met by existing types or their extensions.**

This ensures:
- ✅ Consistent UX across the entire app
- ✅ Automatic viewport handling
- ✅ Sticky header/footer behavior
- ✅ Accessibility compliance
- ✅ Design system adherence
- ✅ Easy maintenance

---

## 📊 **Modal Selection Decision Tree**

```
START: I need a modal
├─ Is it a destructive action confirmation? (Delete, Remove, etc.)
│  └─ YES → Use AlertModal (variant: 'danger')
│  
├─ Is it a simple notification or info message?
│  └─ YES → Use AlertModal (variant: 'info' or 'success')
│  
├─ Is it a quick single-field edit?
│  └─ YES → Use SimpleFormModal
│  
├─ Is it a multi-step wizard/workflow? (Onboarding, guided capture)
│  └─ YES → Use StepperModal (TYPE 4) ⭐
│  
├─ Does it have 2-5 logical sections with fields?
│  └─ YES → Use BlockFormModal ⭐ (90% of cases)
│  
├─ Does it need rich content (images, split layouts, complex UI)?
│  └─ YES → Use FullWidthModal
│  
├─ None of the above fit?
│  ├─ Can I adapt the content to fit BlockFormModal?
│  │  └─ YES → Use BlockFormModal (preferred)
│  │  
│  └─ NO → Request extension
│     └─ See "Extension Request Process" below
```

---

## 🧭 **Modal Type Selector Guide**

### **Quick Reference Table**

| Content Description | Modal Type | Size | Example Use Case |
|-------------------|------------|------|------------------|
| **Delete confirmation** | AlertModal | 384px | "Delete this vehicle?" |
| **Success message** | AlertModal | 384px | "Vehicle added successfully!" |
| **Single field edit** | SimpleFormModal | 448px | Add a note, quick rename |
| **Multi-step wizard** | StepperModal | 448px | Dashboard capture, Onboarding |
| **2-3 form sections** | BlockFormModal | 672px | Edit event, Edit vehicle |
| **4-5 form sections** | BlockFormModal | 672px | User settings, preferences |
| **Image upload + form** | FullWidthModal | 896px | Dashboard photo capture |
| **Document processing** | FullWidthModal | 896px | Receipt OCR review |
| **Split view (list + detail)** | FullWidthModal | 896px | Select from gallery |

---

## 📝 **Usage Examples**

### **1. AlertModal - Confirmations**

```tsx
import { AlertModal } from '@/components/modals'

<AlertModal
  isOpen={showDelete}
  onClose={() => setShowDelete(false)}
  onConfirm={handleDelete}
  title="Delete Vehicle?"
  description="This action cannot be undone. All associated events will be unlinked."
  variant="danger"
  confirmLabel="Delete"
  cancelLabel="Cancel"
  isLoading={isDeleting}
/>
```

**When to use:**
- ✅ Delete confirmations
- ✅ Destructive actions
- ✅ Simple yes/no decisions
- ✅ Success notifications

**When NOT to use:**
- ❌ Forms with input fields
- ❌ Multi-step wizards
- ❌ Rich content displays

---

### **2. SimpleFormModal - Quick Edits**

```tsx
import { SimpleFormModal } from '@/components/modals'

<SimpleFormModal
  isOpen={showAddNote}
  onClose={() => setShowAddNote(false)}
  onSubmit={handleAddNote}
  title="Add Note"
  description="Quick note for this event"
  icon={<Plus className="w-6 h-6 text-blue-600" />}
  isLoading={isSaving}
>
  <div>
    <Label>Note</Label>
    <Textarea 
      value={note}
      onChange={(e) => setNote(e.target.value)}
      placeholder="Enter your note..."
    />
  </div>
</SimpleFormModal>
```

**When to use:**
- ✅ Single field forms
- ✅ Quick text input
- ✅ Simple settings toggle
- ✅ Add tags/labels

**When NOT to use:**
- ❌ Multiple sections
- ❌ Complex field relationships
- ❌ Conditional field visibility

---

### **3. BlockFormModal - Most Common** ⭐

```tsx
import { BlockFormModal, ModalSection } from '@/components/modals'

const sections: ModalSection[] = [
  {
    id: 'basic',
    title: 'Basic Information',
    description: 'Essential details',
    content: <YourFields1 />,
  },
  {
    id: 'advanced',
    title: 'Advanced Settings',
    description: 'Optional configuration',
    content: <YourFields2 />,
    show: showAdvanced, // Conditional visibility
  },
]

<BlockFormModal
  isOpen={isOpen}
  onClose={onClose}
  onSubmit={handleSubmit}
  title="Edit Settings"
  description="Configure your preferences"
  icon={<Settings className="w-6 h-6 text-blue-600" />}
  sections={sections}
  isLoading={isLoading}
  error={error}
/>
```

**When to use:**
- ✅ 2-5 logical sections ⭐ Most common!
- ✅ Edit forms (vehicles, events, users)
- ✅ Settings/preferences
- ✅ Create with multiple steps
- ✅ Conditional sections

**When NOT to use:**
- ❌ Single field (use SimpleFormModal)
- ❌ Rich media content (use FullWidthModal)
- ❌ Simple confirmations (use AlertModal)

**This is your default choice for 90% of modals!**

---

### **4. FullWidthModal - Rich Content**

```tsx
import { FullWidthModal } from '@/components/modals'

<FullWidthModal
  isOpen={isOpen}
  onClose={onClose}
  onSubmit={handleSubmit}
  title="Process Receipt"
  description="Review and correct OCR results"
  icon={<FileText className="w-6 h-6 text-blue-600" />}
  secondaryAction={{
    label: 'Rotate Image',
    onClick: handleRotate,
  }}
  isLoading={isProcessing}
>
  <div className="grid grid-cols-2 gap-8">
    <div>
      <img src={imageUrl} alt="Receipt" />
    </div>
    <div>
      <YourFormFields />
    </div>
  </div>
</FullWidthModal>
```

**When to use:**
- ✅ Image upload + review
- ✅ Split layouts (preview + form)
- ✅ Document processing
- ✅ Rich media galleries
- ✅ 3-button actions needed

**When NOT to use:**
- ❌ Simple forms (use BlockFormModal)
- ❌ Text-only content
- ❌ Standard CRUD operations

---

## 🚫 **Prohibited Patterns**

### **❌ NEVER Do This:**

```tsx
// ❌ Custom modal using raw Dialog components
import { Dialog, DialogContent } from '@/components/ui/dialog'

function MyCustomModal() {
  return (
    <Dialog>
      <DialogContent>
        {/* Custom implementation */}
      </DialogContent>
    </Dialog>
  )
}
```

**Why it's bad:**
- No viewport height handling
- No sticky header/footer
- Inconsistent styling
- Missing accessibility
- Breaks design system

---

### **❌ NEVER Do This Either:**

```tsx
// ❌ Custom fixed positioning modal
function MyModal() {
  return (
    <div className="fixed inset-0 z-50 ...">
      <div className="bg-white rounded-lg ...">
        {/* Custom everything */}
      </div>
    </div>
  )
}
```

**Why it's bad:**
- Reinventing the wheel
- Will have bugs on mobile
- No keyboard handling
- No focus trap
- Maintenance nightmare

---

### **✅ Always Do This:**

```tsx
// ✅ Use standardized modal system
import { BlockFormModal } from '@/components/modals'

function MyFeatureModal() {
  return (
    <BlockFormModal
      sections={sections}
      {...props}
    />
  )
}
```

**Why it's good:**
- ✅ Works everywhere
- ✅ Maintained centrally
- ✅ Design system compliant
- ✅ Accessible
- ✅ Mobile-tested

---

## 🔧 **Extension Request Process**

If existing modal types don't fit your needs:

### **Step 1: Validate Need**

Ask yourself:
1. Can I restructure my content to fit BlockFormModal?
2. Is this a one-time use case or a pattern I'll reuse?
3. Have I checked EXAMPLES.md for creative solutions?
4. Can I use conditional sections to adapt existing modals?

**90% of the time, BlockFormModal can be adapted to fit!**

### **Step 2: Document Requirements**

Create a new file: `docs/modal-extension-request-{feature}.md`

```markdown
# Modal Extension Request: {Feature Name}

## Current Modal Types Evaluated
- BlockFormModal: Doesn't fit because...
- FullWidthModal: Doesn't fit because...
- SimpleFormModal: Doesn't fit because...

## Unique Requirements
1. [Specific requirement that cannot be met]
2. [Another unique requirement]
3. [Visual/interaction requirement]

## Content Example
[Mockup or description of what you need to display]

## Frequency of Use
- Will be used in: [List of features]
- Estimated usage: X times across Y pages

## Proposed Solution
- Extend: [Which modal type]
- New type: [If completely new, justify why]
```

### **Step 3: Review Criteria**

Extensions are approved if:
- ✅ Requirements genuinely cannot be met by existing modals
- ✅ Will be reused in 3+ places
- ✅ Creates a generalizable pattern
- ✅ Maintains design system consistency

Extensions are rejected if:
- ❌ Can be solved by adapting content
- ❌ One-off use case
- ❌ Breaks design system
- ❌ Adds unnecessary complexity

### **Step 4: Implementation**

If approved:
1. Create new modal type in `/components/modals/`
2. Export from `index.ts`
3. Add to `types.ts`
4. Document in README.md
5. Add examples to EXAMPLES.md
6. Update this governance doc

**New modal types become standardized patterns for everyone!**

---

## 🎨 **Content Adaptation Strategies**

Before requesting an extension, try these:

### **Strategy 1: Conditional Sections**

```tsx
const sections: ModalSection[] = [
  {
    id: 'basic',
    title: 'Basic Info',
    content: <BasicFields />,
  },
  {
    id: 'advanced',
    title: 'Advanced',
    content: <AdvancedFields />,
    show: showAdvanced, // Only show when needed!
  },
]
```

### **Strategy 2: Nested Components**

```tsx
// Complex content can live in its own component
const sections: ModalSection[] = [
  {
    id: 'garage',
    title: 'Garage Location',
    content: <ComplexGarageSelector />, // Complex UI encapsulated
  },
]
```

### **Strategy 3: Tabbed Content**

```tsx
const [activeTab, setActiveTab] = useState('basic')

const sections: ModalSection[] = [
  {
    id: 'content',
    title: 'Settings',
    content: (
      <>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>...</TabsList>
        </Tabs>
        {activeTab === 'basic' && <BasicFields />}
        {activeTab === 'advanced' && <AdvancedFields />}
      </>
    ),
  },
]
```

### **Strategy 4: Accordion Sections**

```tsx
const sections: ModalSection[] = [
  {
    id: 'all-settings',
    title: 'All Settings',
    content: (
      <Accordion>
        <AccordionItem value="item-1">
          <AccordionTrigger>Section 1</AccordionTrigger>
          <AccordionContent>...</AccordionContent>
        </AccordionItem>
        {/* More items */}
      </Accordion>
    ),
  },
]
```

**You can fit almost anything into BlockFormModal with creativity!**

---

## 📊 **Modal Usage Audit**

### **How to Audit Your Modals**

Run this command to find all modals in the codebase:

```bash
# Find custom Dialog usage (should be none!)
grep -r "Dialog" --include="*.tsx" --exclude-dir="components/modals" --exclude-dir="components/ui"

# Find fixed positioning (potential custom modals)
grep -r "fixed inset-0" --include="*.tsx" --exclude-dir="components/modals"

# Find standardized modal usage (should be everywhere)
grep -r "BlockFormModal\|SimpleFormModal\|AlertModal\|FullWidthModal" --include="*.tsx"
```

### **Audit Checklist**

- [ ] All modals use standardized components
- [ ] No custom `<Dialog>` usage outside modal system
- [ ] No custom `fixed inset-0` modals
- [ ] All modals have proper icons
- [ ] All modals have loading states
- [ ] All modals handle errors
- [ ] No inline modal definitions (extract to components)

---

## 🎓 **Training New Developers**

### **Onboarding Checklist**

New devs must:
- [ ] Read MODAL_GOVERNANCE.md (this file)
- [ ] Review README.md for modal types
- [ ] Study EXAMPLES.md for patterns
- [ ] Review BLOCK_VS_CARD_DESIGN.md
- [ ] Understand decision tree
- [ ] Know when to use each modal type
- [ ] Know when NOT to create custom modals

### **Common Mistakes to Avoid**

1. **Creating custom modals** → Use standardized types
2. **Using wrong modal type** → Follow decision tree
3. **Nested cards in BlockFormModal** → Use flat blocks
4. **Missing loading states** → Always handle loading
5. **Missing error handling** → Always handle errors
6. **Inline modal code** → Extract to components
7. **Ignoring mobile** → System handles it automatically

---

## 📈 **Success Metrics**

Track these to ensure governance is working:

### **Compliance Metrics**
- **Modal Standardization Rate**: Should be 100%
  - Count: Modals using standardized system
  - Total: All modals in app
  - Target: 100%

- **BlockFormModal Usage**: Should be ~90%
  - Most forms fit BlockFormModal pattern
  - If <80%, review if modals are over-specialized

- **Custom Modal Count**: Should be 0
  - Any custom Dialog usage is non-compliant
  - Requires immediate refactoring

### **Quality Metrics**
- **Mobile Bug Rate**: Should be near 0
  - Standardized modals are mobile-tested
  - Custom modals often have mobile bugs

- **Accessibility Score**: Should be 100%
  - Standardized modals have built-in a11y
  - Custom modals often miss accessibility

---

## 🚀 **Migration Plan**

### **For Existing Custom Modals**

```bash
# Priority order for migration:
1. High-traffic features (dashboard, garage, events)
2. User-facing CRUD operations
3. Admin features
4. One-off tools
```

### **Migration Template**

1. **Identify modal type needed** (use decision tree)
2. **Extract sections** (for BlockFormModal)
3. **Move form state** to parent component
4. **Replace Dialog with BlockFormModal**
5. **Test mobile + desktop**
6. **Test keyboard navigation**
7. **Remove old code**

### **Example Migration**

**Before:**
```tsx
<Dialog>
  <DialogContent>
    <DialogHeader>...</DialogHeader>
    <form>...</form>
    <DialogFooter>...</DialogFooter>
  </DialogContent>
</Dialog>
```

**After:**
```tsx
<BlockFormModal
  sections={sections}
  {...props}
/>
```

**Lines of code:** Reduced by ~60-80%
**Mobile bugs:** Eliminated
**Maintenance:** Centralized

---

## 🔒 **Enforcement**

### **Code Review Checklist**

Reviewers must check:
- [ ] Does this PR use a standardized modal?
- [ ] If custom modal, is there an approved extension request?
- [ ] Does the modal match the decision tree recommendation?
- [ ] Are all required props provided (loading, error, etc.)?
- [ ] Is the modal extracted to a component (not inline)?

### **Automated Checks**

Add to ESLint config (future enhancement):

```js
// .eslintrc.js
rules: {
  'no-custom-modals': 'error', // Prevents Dialog usage outside modal system
  'modal-props-required': 'warn', // Ensures loading/error props
}
```

---

## 📚 **Quick Links**

- [Modal System README](./README.md) - Complete modal guide
- [Examples](./EXAMPLES.md) - Copy-paste examples
- [Responsive Design](./RESPONSIVE_DESIGN.md) - Viewport handling
- [Block vs Card Design](./BLOCK_VS_CARD_DESIGN.md) - Why blocks?
- [Sticky Header/Footer](./STICKY_HEADER_FOOTER.md) - How it works

---

## ✨ **Summary**

### **The Golden Rules**

1. **Always use standardized modals** - Never create custom
2. **BlockFormModal is your default** - Fits 90% of cases
3. **Follow the decision tree** - Choose the right type
4. **Adapt content, not modals** - Be creative with sections
5. **Request extensions properly** - Document and justify
6. **Maintain the system** - Extensions become standards

### **When in Doubt**

**Use BlockFormModal.** It's flexible enough for almost everything with creative content structuring.

**Remember:** The modal system exists to make your life easier and the user experience better. Don't fight it—embrace it!

---

**Status:** ✅ Modal Governance System active. All new modals must comply. Existing modals to be migrated incrementally.
