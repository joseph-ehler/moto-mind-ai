# Dashboard Capture Modal - Governance Analysis

## 📊 Current Implementation

**Component:** `DashboardCaptureModal.tsx`
**Type:** Custom `AccordionStepperModal` (614 lines)

### Content Requirements:
1. **Multi-step wizard** (6 steps: instructions → safety → engine state → capture → processing → success)
2. **Camera interface** (embedded UnifiedCameraCapture)
3. **File upload option**
4. **Image processing** with loading states
5. **Data preview** (odometer, fuel, warnings)
6. **Step validation** (can't proceed without engine state)

---

## 🤔 Modal Selector Analysis

```tsx
import { modalHelpers } from '@/components/modals/modal-selector'

// Option 1: Rich content with images
const rec1 = modalHelpers.forImageUpload()
// → Recommends: FullWidthModal

// Option 2: Multi-step form
const rec2 = selectModal('multi-section-form', { sectionCount: 6 })
// → Recommends: BlockFormModal (but 6 steps is unusual)
```

### Decision Tree Path:
```
Need a modal?
├─ Rich content/images? → YES (camera, image preview)
├─ Multi-step workflow? → YES (6 steps)
└─ Recommendation: **FullWidthModal** OR **StepperModal (TYPE 4 - Future)**
```

---

## ✅ Recommendation: TWO OPTIONS

### **OPTION 1: Keep AccordionStepperModal (Recommended)**

**Why:**
- ✅ **Reusable pattern** - Multi-step wizards are a distinct UX pattern
- ✅ **Already implemented** - AccordionStepperModal is well-structured
- ✅ **Fits governance** - This qualifies as an **approved extension** to the modal system
- ✅ **Used elsewhere** - Could be reused for other onboarding/wizard flows

**Action:**
1. **Standardize** AccordionStepperModal as **TYPE 4: StepperModal**
2. Move to `/components/modals/StepperModal.tsx`
3. Update to use BaseModal foundation
4. Add to modal system exports
5. Document in README.md

**Migration:** Minimal - just move file and update imports

---

### **OPTION 2: Refactor to FullWidthModal (Alternative)**

**Why:**
- ✅ Uses existing modal type
- ✅ Stepper becomes internal component
- ❌ More refactoring work
- ❌ Stepper logic not reusable

**Action:**
```tsx
<FullWidthModal
  isOpen={isOpen}
  onClose={onClose}
  title="Quick Dashboard Reading"
  description="Take a photo or choose from files"
  icon={<Camera />}
>
  <DashboardCaptureSteps
    onCapture={onCapture}
    vehicleId={vehicleId}
  />
</FullWidthModal>
```

**Migration:** Moderate - extract stepper into separate component

---

## 🎯 GOVERNANCE DECISION

### **Recommend: OPTION 1 - Standardize as TYPE 4**

This is exactly the scenario our governance anticipated:
- ✅ **Cannot fit** in existing modal types (multi-step requires accordion UI)
- ✅ **Reusable** in 3+ places (onboarding, diagnostics, multi-step forms)
- ✅ **Creates generalizable pattern** (any multi-step wizard can use it)

### Extension Request Approval Criteria:
- [x] Cannot be solved by existing modals
- [x] Will be reused (onboarding flows, guided capture, multi-step forms)
- [x] Creates generalizable pattern
- [x] Maintains design system consistency

**Approved!** AccordionStepperModal becomes **StepperModal (TYPE 4)**

---

## 📝 Implementation Plan

### Phase 1: Standardize StepperModal

1. **Rename and move:**
   ```bash
   mv components/ui/StepperModal.tsx → components/modals/StepperModal.tsx
   ```

2. **Update to use BaseModal:**
   ```tsx
   export function StepperModal({ steps, currentStepId, ... }) {
     return (
       <BaseModal size="lg" {...props}>
         <ModalHeader {...headerProps} />
         <ModalContent>
           <AccordionStepper steps={steps} currentStep={currentStepId} />
         </ModalContent>
         {currentStepCanProceed && (
           <ModalFooter>
             <StepperFooter onNext={...} onPrev={...} />
           </ModalFooter>
         )}
       </BaseModal>
     )
   }
   ```

3. **Export from modal system:**
   ```tsx
   // components/modals/index.ts
   export { StepperModal } from './StepperModal'
   export type { StepperModalProps, Step } from './types'
   ```

4. **Update DashboardCaptureModal:**
   ```tsx
   // Before
   import { AccordionStepperModal } from '@/components/ui/StepperModal'
   
   // After
   import { StepperModal } from '@/components/modals'
   ```

### Phase 2: Document as TYPE 4

Add to README.md:
```markdown
### 4. StepperModal (TYPE 4)
**Use Cases:** Multi-step wizards, guided workflows, onboarding

**Size:** `max-w-2xl` (672px)

**Features:**
- Accordion-style step navigation
- Step validation and completion tracking
- Progress visualization
- Auto-advance on completion

**Example:**
<StepperModal
  steps={[
    { id: 'step1', title: 'Instructions', content: <...> },
    { id: 'step2', title: 'Capture', content: <...> },
  ]}
  currentStepId={currentStep}
  onStepComplete={handleComplete}
/>
```

### Phase 3: Update Governance

Add to MODAL_GOVERNANCE.md decision tree:
```
Need a modal?
├─ Destructive action? → AlertModal
├─ Simple message? → AlertModal
├─ Single field? → SimpleFormModal
├─ 2-5 sections? → BlockFormModal
├─ Multi-step wizard? → StepperModal ⭐ NEW!
├─ Rich content/images? → FullWidthModal
└─ Not sure? → BlockFormModal
```

---

## 🎨 Benefits of Standardization

### Before (Custom):
- ❌ Lives in `/components/ui/` (not modal system)
- ❌ Custom viewport handling
- ❌ Not in governance docs
- ❌ Not discoverable

### After (Standardized TYPE 4):
- ✅ Part of modal system
- ✅ Auto viewport handling from BaseModal
- ✅ Documented in governance
- ✅ Discoverable via modal-selector
- ✅ Reusable for other wizards

---

## 🚀 Future Use Cases

Once standardized, StepperModal can be used for:
- **Vehicle onboarding** (VIN → Specs → Setup → Complete)
- **Event creation wizard** (Type → Details → Photos → Confirm)
- **Settings wizard** (Profile → Preferences → Notifications → Done)
- **Diagnostic flows** (Symptoms → Tests → Results → Actions)

---

## 🎯 Recommendation Summary

**Keep AccordionStepperModal, but standardize it as TYPE 4: StepperModal**

**Why:**
1. Reusable multi-step pattern
2. Fits governance extension criteria
3. Minimal migration effort
4. Becomes part of design system

**Action:**
1. Move to modal system
2. Use BaseModal foundation
3. Document as TYPE 4
4. Update decision tree
5. Add to modal-selector

**Result:** DashboardCaptureModal remains functionally identical but now part of the standardized system!

---

**Status:** ✅ Approved as TYPE 4 extension. Ready to implement.
