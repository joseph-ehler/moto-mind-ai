# Enhanced Checkbox & RadioGroup Components

## 🎯 **Built on shadcn/ui Foundation**

Our Checkbox and RadioGroup components are built on battle-tested **shadcn/ui** components, enhanced with MotoMind patterns for better UX and validation.

---

## ✨ **Features:**

### **Checkbox Features:**
- ✅ **Label & Description** - Clear labeling with optional descriptions
- ✅ **Validation States** - Error, success, warning
- ✅ **Helper Text** - Additional context below checkbox
- ✅ **Indeterminate State** - For "select all" scenarios
- ✅ **Required Indicator** - Visual asterisk for required fields
- ✅ **Disabled State** - Accessible disabled styling

### **RadioGroup Features:**
- ✅ **Label & Description** - Clear group labeling
- ✅ **Validation States** - Error, success, warning
- ✅ **Helper Text** - Additional context below group
- ✅ **Option Descriptions** - Per-option help text
- ✅ **Horizontal & Vertical** - Layout options
- ✅ **Required Indicator** - Visual asterisk
- ✅ **Individual Disabled** - Disable specific options

---

## 📝 **Usage Examples:**

### **Basic Checkbox:**
```tsx
import { Checkbox } from '@/components/design-system'

<Checkbox
  label="I agree to terms"
  checked={agreed}
  onCheckedChange={setAgreed}
/>
```

### **Checkbox with Description:**
```tsx
<Checkbox
  label="Subscribe to newsletter"
  description="Get weekly updates about new features"
  checked={subscribed}
  onCheckedChange={setSubscribed}
  helperText="You can unsubscribe anytime"
/>
```

### **Checkbox with Validation:**
```tsx
<Checkbox
  label="I agree to terms"
  description="Read our terms and conditions"
  checked={agreed}
  onCheckedChange={setAgreed}
  required
  error={!agreed ? 'You must agree to terms' : undefined}
/>
```

### **Indeterminate Checkbox (Select All):**
```tsx
<Checkbox
  label="Select all"
  checked={allSelected}
  indeterminate={someSelected}
  onCheckedChange={handleSelectAll}
/>
```

### **Basic RadioGroup:**
```tsx
import { RadioGroup } from '@/components/design-system'

<RadioGroup
  label="Notification preference"
  options={[
    { value: 'all', label: 'All notifications' },
    { value: 'important', label: 'Important only' },
    { value: 'none', label: 'None' }
  ]}
  value={preference}
  onValueChange={setPreference}
/>
```

### **RadioGroup with Descriptions:**
```tsx
<RadioGroup
  label="Privacy level"
  description="Choose who can see your profile"
  options={[
    { 
      value: 'public', 
      label: 'Public', 
      description: 'Anyone can view your profile' 
    },
    { 
      value: 'friends', 
      label: 'Friends only',
      description: 'Only your connections can view'
    },
    { 
      value: 'private', 
      label: 'Private',
      description: 'Only you can view your profile'
    }
  ]}
  value={privacy}
  onValueChange={setPrivacy}
/>
```

### **Horizontal RadioGroup:**
```tsx
<RadioGroup
  label="Gender"
  orientation="horizontal"
  options={[
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' }
  ]}
  value={gender}
  onValueChange={setGender}
/>
```

### **RadioGroup with Validation:**
```tsx
<RadioGroup
  label="Shipping method"
  options={shippingOptions}
  value={shipping}
  onValueChange={setShipping}
  required
  error={!shipping ? 'Please select a shipping method' : undefined}
/>
```

### **RadioGroup with Disabled Options:**
```tsx
<RadioGroup
  label="Subscription plan"
  options={[
    { value: 'free', label: 'Free' },
    { value: 'pro', label: 'Pro', description: '$9.99/month' },
    { value: 'enterprise', label: 'Enterprise', description: 'Contact sales', disabled: true }
  ]}
  value={plan}
  onValueChange={setPlan}
/>
```

---

## 🎨 **Visual Examples:**

### **Checkbox States:**

```
✓ Checked
☐ Unchecked
▣ Indeterminate (some selected)
☐ Disabled
```

### **RadioGroup Layouts:**

**Vertical (default):**
```
Privacy level
○ Public
  Anyone can view
○ Friends only
  Only connections
● Private (selected)
  Only you
```

**Horizontal:**
```
Gender
○ Male  ○ Female  ● Other (selected)
```

---

## 📊 **Props API:**

### **Checkbox Props:**
```typescript
interface CheckboxProps {
  // Labels & Messages
  label?: string
  description?: string
  helperText?: string
  
  // States
  checked?: boolean
  indeterminate?: boolean
  disabled?: boolean
  required?: boolean
  
  // Validation
  error?: string
  success?: string
  warning?: string
  
  // Events
  onCheckedChange?: (checked: boolean) => void
  
  // Styling
  className?: string
  id?: string
}
```

### **RadioGroup Props:**
```typescript
interface RadioGroupProps {
  // Labels & Messages
  label?: string
  description?: string
  helperText?: string
  
  // Data
  options: RadioOption[]
  value?: string
  
  // States
  disabled?: boolean
  required?: boolean
  orientation?: 'vertical' | 'horizontal'
  
  // Validation
  error?: string
  success?: string
  warning?: string
  
  // Events
  onValueChange?: (value: string) => void
  
  // Styling
  className?: string
}

interface RadioOption {
  value: string
  label: string
  description?: string
  disabled?: boolean
}
```

---

## ✅ **When to Use:**

### **Use Checkbox When:**
- ✅ Single yes/no choice
- ✅ Multiple independent selections
- ✅ "Select all" functionality
- ✅ Toggle states (on/off)

### **Use RadioGroup When:**
- ✅ Single choice from multiple options
- ✅ Mutually exclusive options
- ✅ All options should be visible
- ✅ 2-7 options (use Select for more)

---

## 🏗️ **Architecture:**

```
Checkbox (Our wrapper)
├── shadcn/ui Checkbox
├── Label (accessibility)
├── MotoMind enhancements
│   ├── Description text
│   ├── Helper text
│   ├── Validation states
│   └── Required indicator

RadioGroup (Our wrapper)
├── shadcn/ui RadioGroup
│   └── RadioGroupItem (per option)
├── Label (accessibility)
├── MotoMind enhancements
│   ├── Per-option descriptions
│   ├── Helper text
│   ├── Validation states
│   ├── Layout options (H/V)
│   └── Required indicator
```

---

## 🎯 **Real-World Examples:**

### **Terms & Conditions:**
```tsx
<Checkbox
  label="I agree to the Terms and Conditions"
  description="By checking this box, you agree to our terms"
  required
  error={!agreed && submitted ? 'Required' : undefined}
  checked={agreed}
  onCheckedChange={setAgreed}
/>
```

### **Newsletter Preferences:**
```tsx
<Stack spacing="md">
  <Checkbox
    label="Product updates"
    description="New features and improvements"
    checked={preferences.product}
    onCheckedChange={(v) => setPreferences({...preferences, product: v})}
  />
  <Checkbox
    label="Marketing emails"
    description="Promotions and special offers"
    checked={preferences.marketing}
    onCheckedChange={(v) => setPreferences({...preferences, marketing: v})}
  />
  <Checkbox
    label="Security alerts"
    description="Important account security updates"
    checked={preferences.security}
    onCheckedChange={(v) => setPreferences({...preferences, security: v})}
  />
</Stack>
```

### **Vehicle Condition:**
```tsx
<RadioGroup
  label="Vehicle Condition"
  description="Select the condition that best describes your vehicle"
  required
  options={[
    { 
      value: 'excellent', 
      label: 'Excellent', 
      description: 'Like new, no visible wear' 
    },
    { 
      value: 'good', 
      label: 'Good', 
      description: 'Minor wear, well maintained' 
    },
    { 
      value: 'fair', 
      label: 'Fair', 
      description: 'Some visible wear, functional' 
    },
    { 
      value: 'poor', 
      label: 'Poor', 
      description: 'Significant wear, needs work' 
    }
  ]}
  value={condition}
  onValueChange={setCondition}
/>
```

### **Notification Settings:**
```tsx
<RadioGroup
  label="Email notifications"
  orientation="horizontal"
  options={[
    { value: 'all', label: 'All' },
    { value: 'important', label: 'Important only' },
    { value: 'none', label: 'None' }
  ]}
  value={emailPref}
  onValueChange={setEmailPref}
/>
```

---

## 🚀 **Benefits:**

### **Built on shadcn/ui:**
- ✅ Battle-tested accessibility
- ✅ Keyboard navigation
- ✅ Screen reader support
- ✅ Mobile-friendly
- ✅ TypeScript support

### **MotoMind Enhancements:**
- ✅ Validation states
- ✅ Helper text
- ✅ Descriptions
- ✅ Indeterminate state
- ✅ Layout options
- ✅ Consistent design system

---

## 📝 **Accessibility:**

### **Checkbox:**
- ✅ Proper `label` association
- ✅ `aria-invalid` for errors
- ✅ `aria-describedby` for messages
- ✅ Keyboard support (Space to toggle)
- ✅ Focus indicators

### **RadioGroup:**
- ✅ Proper `radiogroup` role
- ✅ Arrow key navigation
- ✅ `aria-invalid` for errors
- ✅ `aria-describedby` for messages
- ✅ Focus indicators

---

## 🎯 **Next Steps:**

1. **Add to forms-showcase** - Demo all features
2. **Real-world examples** - Vehicle forms, settings
3. **Form validation** - Integrate with form libraries
4. **Mobile testing** - Touch interactions

---

**Result:** Battle-tested Checkbox & RadioGroup with MotoMind UX patterns! 🚀
