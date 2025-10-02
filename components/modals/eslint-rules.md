# ESLint Rules for Modal Governance

## 🎯 Custom ESLint Rules (To Be Implemented)

These rules enforce the modal governance system automatically during development.

---

## **Rule 1: no-custom-dialog**

**Prevents direct usage of Dialog components outside the modal system.**

```js
// .eslintrc.js
{
  "rules": {
    "motomind/no-custom-dialog": "error"
  }
}
```

### **What it catches:**

```tsx
// ❌ ERROR: Direct Dialog usage outside modal system
import { Dialog, DialogContent } from '@/components/ui/dialog'

function MyComponent() {
  return (
    <Dialog>
      <DialogContent>...</DialogContent>
    </Dialog>
  )
}
```

### **Correct usage:**

```tsx
// ✅ PASS: Using standardized modal
import { BlockFormModal } from '@/components/modals'

function MyComponent() {
  return <BlockFormModal sections={sections} />
}
```

### **Exceptions:**

- Files in `/components/modals/` are allowed
- Files in `/components/ui/` are allowed (implementation)

---

## **Rule 2: modal-props-required**

**Ensures all modal instances have required props for consistency.**

```js
{
  "rules": {
    "motomind/modal-props-required": "warn"
  }
}
```

### **What it catches:**

```tsx
// ⚠️ WARNING: Missing isLoading prop
<BlockFormModal
  isOpen={true}
  onClose={onClose}
  onSubmit={onSubmit}
  sections={sections}
  // Missing: isLoading prop
/>

// ⚠️ WARNING: Missing error prop  
<SimpleFormModal
  isOpen={true}
  onClose={onClose}
  onSubmit={onSubmit}
  // Missing: error prop
>
  ...
</SimpleFormModal>
```

### **Correct usage:**

```tsx
// ✅ PASS: All required props present
<BlockFormModal
  isOpen={isOpen}
  onClose={onClose}
  onSubmit={onSubmit}
  sections={sections}
  isLoading={isLoading}  // ✓ Present
  error={error}           // ✓ Present
/>
```

### **Required props by modal type:**

- **All modals:**
  - `isOpen: boolean`
  - `onClose: () => void`

- **Form modals (BlockForm, SimpleForm, FullWidth):**
  - `isLoading: boolean` - For submit state
  - `error: string | undefined` - For error display
  - `onSubmit: (e: FormEvent) => void`

- **AlertModal:**
  - `variant: 'info' | 'success' | 'warning' | 'danger'`
  - `onConfirm: () => void` (if confirmable)

---

## **Rule 3: modal-icon-required**

**Encourages consistent icon usage across modals.**

```js
{
  "rules": {
    "motomind/modal-icon-required": "warn"
  }
}
```

### **What it catches:**

```tsx
// ⚠️ WARNING: Modal should have an icon for visual consistency
<BlockFormModal
  title="Edit Vehicle"
  // Missing: icon prop
  sections={sections}
/>
```

### **Correct usage:**

```tsx
// ✅ PASS: Icon provided
import { Pencil } from 'lucide-react'

<BlockFormModal
  title="Edit Vehicle"
  icon={<Pencil className="w-6 h-6 text-blue-600" />}
  sections={sections}
/>
```

---

## **Rule 4: no-fixed-position-modals**

**Prevents custom fixed-position modals.**

```js
{
  "rules": {
    "motomind/no-fixed-position-modals": "error"
  }
}
```

### **What it catches:**

```tsx
// ❌ ERROR: Custom fixed-position modal detected
function MyModal() {
  return (
    <div className="fixed inset-0 z-50 bg-black/50">
      <div className="bg-white">...</div>
    </div>
  )
}
```

### **Pattern detected:**

- `className` contains `fixed` and `inset-0`
- Outside `/components/modals/` directory

### **Correct usage:**

```tsx
// ✅ PASS: Using standardized modal
import { BlockFormModal } from '@/components/modals'

function MyModal() {
  return <BlockFormModal sections={sections} />
}
```

---

## **Rule 5: modal-section-structure**

**Validates BlockFormModal section structure.**

```js
{
  "rules": {
    "motomind/modal-section-structure": "error"
  }
}
```

### **What it catches:**

```tsx
// ❌ ERROR: Invalid section structure
const sections = [
  {
    // Missing: id field
    title: 'Section 1',
    content: <Fields />
  },
  {
    id: 'section-2',
    // Missing: title field
    content: <Fields />
  }
]
```

### **Correct usage:**

```tsx
// ✅ PASS: Valid section structure
const sections: ModalSection[] = [
  {
    id: 'section-1',           // Required
    title: 'Section Title',    // Required
    description: 'Optional',   // Optional
    content: <Fields />,       // Required
    show: true                 // Optional
  }
]
```

### **Required fields:**
- `id: string` - Unique identifier
- `title: string` - Section heading
- `content: ReactNode` - Section content

### **Optional fields:**
- `description: string` - Subheading text
- `show: boolean` - Conditional visibility

---

## **Rule 6: modal-type-selector**

**Suggests better modal type based on content analysis.**

```js
{
  "rules": {
    "motomind/modal-type-selector": "warn"
  }
}
```

### **What it catches:**

```tsx
// ⚠️ WARNING: SimpleFormModal recommended for single-field edit
<BlockFormModal
  sections={[{
    id: 'only-section',
    title: 'Add Note',
    content: <Textarea />  // Only one field detected
  }]}
/>

// Suggestion: Use SimpleFormModal instead
```

### **Analysis patterns:**

- **Single field** → Suggests SimpleFormModal
- **Multiple sections** → Confirms BlockFormModal
- **Image upload detected** → Suggests FullWidthModal
- **Destructive action** → Suggests AlertModal

---

## **Rule 7: modal-imports-standardized**

**Ensures imports come from standardized modal system.**

```js
{
  "rules": {
    "motomind/modal-imports-standardized": "error"
  }
}
```

### **What it catches:**

```tsx
// ❌ ERROR: Importing from wrong location
import { Dialog } from '@/components/ui/dialog'
import { Modal } from 'react-modal'  // External library
import { CustomModal } from '@/components/CustomModal'
```

### **Correct usage:**

```tsx
// ✅ PASS: Importing from standardized system
import { BlockFormModal, SimpleFormModal, AlertModal } from '@/components/modals'
import type { ModalSection } from '@/components/modals'
```

### **Allowed imports:**

- `@/components/modals` - Standardized system
- `@/components/modals/types` - Type definitions

### **Disallowed imports:**

- `@/components/ui/dialog` - Outside modal system
- Any third-party modal libraries
- Custom modal components

---

## **Rule 8: modal-description-required**

**Encourages descriptive modal headers.**

```js
{
  "rules": {
    "motomind/modal-description-required": "warn"
  }
}
```

### **What it catches:**

```tsx
// ⚠️ WARNING: Modal should have description for context
<BlockFormModal
  title="Edit Vehicle"
  // Missing: description prop
  sections={sections}
/>
```

### **Correct usage:**

```tsx
// ✅ PASS: Description provided
<BlockFormModal
  title="Edit Vehicle"
  description="Update your vehicle information and settings"
  sections={sections}
/>
```

---

## 🛠️ **Implementation Guide**

### **Step 1: Create Custom ESLint Plugin**

```bash
# Create plugin structure
mkdir -p eslint-plugin-motomind/rules
cd eslint-plugin-motomind
npm init -y
```

### **Step 2: Implement Rules**

```js
// eslint-plugin-motomind/rules/no-custom-dialog.js
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow direct Dialog usage outside modal system',
      category: 'Modal Governance',
      recommended: true,
    },
    messages: {
      noCustomDialog: 'Use standardized modals from @/components/modals instead of Dialog',
    },
    schema: [],
  },
  create(context) {
    return {
      ImportDeclaration(node) {
        const filename = context.getFilename()
        
        // Allow in modal system directories
        if (filename.includes('/components/modals/') || 
            filename.includes('/components/ui/')) {
          return
        }
        
        // Check for Dialog imports
        if (node.source.value === '@/components/ui/dialog') {
          context.report({
            node,
            messageId: 'noCustomDialog',
          })
        }
      },
    }
  },
}
```

### **Step 3: Register Plugin**

```js
// eslint-plugin-motomind/index.js
module.exports = {
  rules: {
    'no-custom-dialog': require('./rules/no-custom-dialog'),
    'modal-props-required': require('./rules/modal-props-required'),
    'no-fixed-position-modals': require('./rules/no-fixed-position-modals'),
    'modal-section-structure': require('./rules/modal-section-structure'),
    'modal-type-selector': require('./rules/modal-type-selector'),
    'modal-imports-standardized': require('./rules/modal-imports-standardized'),
    'modal-icon-required': require('./rules/modal-icon-required'),
    'modal-description-required': require('./rules/modal-description-required'),
  },
}
```

### **Step 4: Configure in Project**

```js
// .eslintrc.js
module.exports = {
  plugins: ['motomind'],
  rules: {
    // Errors - Must fix
    'motomind/no-custom-dialog': 'error',
    'motomind/no-fixed-position-modals': 'error',
    'motomind/modal-section-structure': 'error',
    'motomind/modal-imports-standardized': 'error',
    
    // Warnings - Should fix
    'motomind/modal-props-required': 'warn',
    'motomind/modal-icon-required': 'warn',
    'motomind/modal-type-selector': 'warn',
    'motomind/modal-description-required': 'warn',
  },
}
```

---

## 📊 **Rule Severity Guide**

### **Errors (`error`)** - Must fix before merge

- `no-custom-dialog` - Breaks design system
- `no-fixed-position-modals` - Breaks mobile/accessibility
- `modal-section-structure` - Runtime errors
- `modal-imports-standardized` - Architecture violation

### **Warnings (`warn`)** - Should fix, can merge

- `modal-props-required` - Missing functionality
- `modal-icon-required` - Inconsistent UX
- `modal-type-selector` - Suboptimal choice
- `modal-description-required` - Missing context

---

## 🧪 **Testing Rules**

### **Test Cases**

```js
// tests/no-custom-dialog.test.js
const { RuleTester } = require('eslint')
const rule = require('../rules/no-custom-dialog')

const ruleTester = new RuleTester({
  parserOptions: { ecmaVersion: 2020, sourceType: 'module' },
})

ruleTester.run('no-custom-dialog', rule, {
  valid: [
    // Allowed in modal system
    {
      code: `import { Dialog } from '@/components/ui/dialog'`,
      filename: '/components/modals/BaseModal.tsx',
    },
    // Using standardized modal
    {
      code: `import { BlockFormModal } from '@/components/modals'`,
      filename: '/features/vehicles/EditModal.tsx',
    },
  ],
  invalid: [
    // Custom Dialog usage
    {
      code: `import { Dialog } from '@/components/ui/dialog'`,
      filename: '/features/vehicles/CustomModal.tsx',
      errors: [{ messageId: 'noCustomDialog' }],
    },
  ],
})
```

---

## 🎯 **Auto-Fix Capabilities**

Some rules can provide automatic fixes:

### **Rule: modal-imports-standardized**

```tsx
// Before (auto-fixable)
import { Dialog } from '@/components/ui/dialog'

// After auto-fix
import { BlockFormModal } from '@/components/modals'
```

### **Rule: modal-props-required**

```tsx
// Before (auto-fixable)
<BlockFormModal
  isOpen={isOpen}
  onClose={onClose}
  sections={sections}
/>

// After auto-fix (adds placeholders)
<BlockFormModal
  isOpen={isOpen}
  onClose={onClose}
  sections={sections}
  isLoading={false}  // Added
  error={undefined}  // Added
/>
```

---

## 📈 **Metrics & Reporting**

### **Rule Violation Dashboard**

Track violations over time:

```bash
# Generate report
npx eslint . --format json > eslint-report.json

# Analyze with custom script
node scripts/analyze-modal-compliance.js
```

### **Metrics to track:**

- **Violation count by rule**
- **Files with violations**
- **Trend over time** (decreasing = good!)
- **Most common violations**
- **Compliance percentage**

---

## ✅ **Pre-commit Hook**

Enforce rules before commit:

```bash
# .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run ESLint on staged files
npx lint-staged

# Modal-specific checks
npm run lint:modals
```

```json
// package.json
{
  "scripts": {
    "lint:modals": "eslint . --ext .tsx --rule 'motomind/*: error'"
  },
  "lint-staged": {
    "*.tsx": ["eslint --fix", "prettier --write"]
  }
}
```

---

## 🎓 **Developer Education**

### **When rule is violated:**

```
❌ Error: motomind/no-custom-dialog

You're importing Dialog directly. Use the standardized modal system instead.

✅ Recommended:
import { BlockFormModal } from '@/components/modals'

📚 Learn more:
- Modal Governance: /components/modals/MODAL_GOVERNANCE.md
- Examples: /components/modals/EXAMPLES.md
- Decision Tree: Use modal-selector.ts

Need help choosing? Run:
import { modalHelpers } from '@/components/modals/modal-selector'
const rec = modalHelpers.forEdit(3)
console.log(rec)
```

---

## 🚀 **Rollout Plan**

### **Phase 1: Warning Mode** (Week 1-2)

```js
// All rules as warnings
rules: {
  'motomind/*': 'warn'
}
```

- Developers see violations but can still commit
- Gather data on violation frequency
- Educate team

### **Phase 2: Error Mode** (Week 3+)

```js
// Critical rules as errors
rules: {
  'motomind/no-custom-dialog': 'error',
  'motomind/no-fixed-position-modals': 'error',
  'motomind/modal-imports-standardized': 'error',
  // Others remain warnings
}
```

- Block commits with critical violations
- Allow warnings with review

### **Phase 3: Full Enforcement** (Week 5+)

```js
// All rules as errors
rules: {
  'motomind/*': 'error'
}
```

- Full governance system active
- Zero tolerance for violations
- All modals standardized

---

**Status:** 📝 ESLint rules documented and ready for implementation. Can be added incrementally as plugin matures.
