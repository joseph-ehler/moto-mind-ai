# Mobile/Native-First Forms

**Status:** Complete  
**Philosophy:** Every form input optimized for touch, accessibility, and clarity

---

## 🎯 **The Pattern**

Every form section must answer:
1. **What do we need?** (Clear title/question)
2. **Why do we need it?** (Description)
3. **How do I provide it?** (Proper input types)

---

## 📱 **Mobile/Native-First Input Types**

### **Always Use Proper Types:**

```tsx
// ✅ GOOD: Proper types trigger correct keyboards
<FormInput type="email" ... />        // Email keyboard (@, .com)
<FormInput type="tel" ... />          // Phone keyboard (numbers, +)
<FormInput type="number" ... />       // Numeric keyboard
<FormInput type="url" ... />          // URL keyboard (.com, https://)

// ❌ BAD: Generic text for everything
<FormInput type="text" ... />         // Wrong keyboard for email/phone
```

### **Input Modes (Fine-Grained Control):**

```tsx
// Even more specific keyboard control
<FormInput 
  type="text" 
  inputMode="numeric"     // Numbers only (but still text type)
  enterKeyHint="next"     // "Next" button instead of "Enter"
/>
```

---

## 🎨 **Component Usage**

### **1. FormSection - Clear Headers**

```tsx
import { FormSection } from '@/components/ui/form-section'

<FormSection
  title="What's your email address?"
  description="We'll use this to send you updates and receipts"
  icon={<Mail className="w-6 h-6" />}
>
  <FormInput ... />
</FormSection>
```

**Benefits:**
- ✅ User knows exactly what we need
- ✅ User knows why we need it
- ✅ Semantic HTML (proper heading levels)
- ✅ Optional icon for visual context

---

### **2. FormInput - Mobile-Optimized**

```tsx
import { FormInput, AutoComplete } from '@/components/ui/form-input'

<FormInput
  type="email"
  label="Email Address"
  description="We'll never share your email"
  placeholder="you@example.com"
  value={email}
  onChange={setEmail}
  error={emailError}
  required
  autoComplete={AutoComplete.email}
  enterKeyHint="next"
/>
```

**Features:**
- ✅ 44px+ touch target
- ✅ Proper input type (triggers correct keyboard)
- ✅ Input mode (fine-grained keyboard control)
- ✅ Enter key hint ("Next", "Done", "Go", etc.)
- ✅ Autocomplete attributes
- ✅ Clear error states
- ✅ Accessible labels & descriptions

---

### **3. FormHelper - Contextual Help**

```tsx
import { FormHelper } from '@/components/ui/form-section'

// Info (general help)
<FormHelper type="info">
  Can't find your VIN? Check your dashboard or registration.
</FormHelper>

// Tip (positive reinforcement)
<FormHelper type="tip">
  VIN looks good! Ready to continue.
</FormHelper>

// Warning (important notice)
<FormHelper type="warning">
  This action cannot be undone.
</FormHelper>
```

---

## 📋 **Common Input Patterns**

### **Email:**

```tsx
<FormInput
  type="email"
  inputMode="email"
  autoComplete={AutoComplete.email}
  enterKeyHint="next"
  label="Email Address"
  placeholder="you@example.com"
  value={email}
  onChange={setEmail}
/>
```

**Mobile Result:**
- Keyboard: Email keyboard with @ and .com keys
- Autocomplete: Suggests saved emails
- Enter key: "Next" button

---

### **Phone:**

```tsx
<FormInput
  type="tel"
  inputMode="tel"
  autoComplete={AutoComplete.tel}
  enterKeyHint="done"
  label="Phone Number"
  placeholder="(555) 123-4567"
  value={phone}
  onChange={setPhone}
/>
```

**Mobile Result:**
- Keyboard: Phone keyboard (numbers, +, -, etc.)
- Autocomplete: Suggests saved phone numbers
- Enter key: "Done" button

---

### **Number (Miles, Price, etc.):**

```tsx
<FormInput
  type="number"
  inputMode="numeric"
  enterKeyHint="done"
  label="Current Mileage"
  placeholder="50000"
  value={mileage}
  onChange={setMileage}
/>
```

**Mobile Result:**
- Keyboard: Numeric keyboard (0-9 only)
- No autocomplete (not needed)
- Enter key: "Done" button

---

### **VIN (Special Case):**

```tsx
<input
  type="text"
  inputMode="text"
  autoComplete="off"
  autoCapitalize="characters"
  spellCheck={false}
  maxLength={17}
  className="font-mono uppercase"
  ...
/>
```

**Special Handling:**
- No autocorrect (VINs are codes)
- Auto-capitalize (VINs are uppercase)
- Font-mono (easier to read codes)
- Character counter overlay

---

## 🏗️ **Complete Form Example**

```tsx
<FormSection
  title="Tell us about yourself"
  description="We need a few details to set up your account"
  icon={<User className="w-6 h-6" />}
>
  {/* Name */}
  <FormFieldGroup columns={2}>
    <FormInput
      type="text"
      label="First Name"
      placeholder="John"
      value={firstName}
      onChange={setFirstName}
      autoComplete={AutoComplete.givenName}
      enterKeyHint="next"
      required
    />
    
    <FormInput
      type="text"
      label="Last Name"
      placeholder="Doe"
      value={lastName}
      onChange={setLastName}
      autoComplete={AutoComplete.familyName}
      enterKeyHint="next"
      required
    />
  </FormFieldGroup>
  
  {/* Email */}
  <FormInput
    type="email"
    label="Email Address"
    description="We'll send you a confirmation email"
    placeholder="john@example.com"
    value={email}
    onChange={setEmail}
    autoComplete={AutoComplete.email}
    enterKeyHint="next"
    required
  />
  
  {/* Phone */}
  <FormInput
    type="tel"
    label="Phone Number"
    description="For order updates and support"
    placeholder="(555) 123-4567"
    value={phone}
    onChange={setPhone}
    autoComplete={AutoComplete.tel}
    enterKeyHint="done"
  />
  
  {/* Helper */}
  <FormHelper type="info">
    Your information is encrypted and never shared with third parties.
  </FormHelper>
</FormSection>
```

---

## 🎯 **Touch Target Guidelines**

### **Minimum Sizes:**

```tsx
// iOS Guidelines: 44x44pt
// Android Guidelines: 48x48dp
// Our Standard: 44px minimum

min-h-[44px]        // Input height
py-3                // Vertical padding (12px * 2 = 24px + text)
px-4                // Horizontal padding (16px)
```

### **Spacing:**

```tsx
space-y-2           // Label to input (8px)
space-y-4           // Input to input (16px)
space-y-6           // Section to section (24px)
```

---

## ♿ **Accessibility Checklist**

### **Every Input Must Have:**

- ✅ `<label>` with `htmlFor` matching input `id`
- ✅ `aria-label` or visible label text
- ✅ `aria-describedby` for help text/error
- ✅ `aria-invalid` when error present
- ✅ `required` attribute when required
- ✅ `aria-required` for screen readers
- ✅ Error text with `role="alert"`

### **Example:**

```tsx
<label htmlFor="email">
  Email Address
  {required && <span className="text-red-500">*</span>}
</label>

<input
  id="email"
  type="email"
  required
  aria-required="true"
  aria-invalid={!!error}
  aria-describedby="email-help email-error"
/>

<p id="email-help">We'll never share your email</p>

{error && (
  <p id="email-error" role="alert">
    {error}
  </p>
)}
```

---

## 📊 **Input Type Reference**

| Type | Keyboard | Use For | Autocomplete |
|------|----------|---------|--------------|
| `email` | Email (@, .com) | Email addresses | `email` |
| `tel` | Phone (numbers) | Phone numbers | `tel` |
| `number` | Numeric | Numbers only | N/A |
| `url` | URL (.com, /) | Website URLs | `url` |
| `search` | Search (X button) | Search fields | N/A |
| `text` | Standard | General text | `name`, etc. |
| `password` | Standard | Passwords | `current-password` |

---

## 🔑 **Enter Key Hints**

| Hint | When to Use |
|------|-------------|
| `next` | More fields after this one |
| `done` | Last field in form |
| `go` | Submit form / navigate |
| `search` | Search field |
| `send` | Send message / email |

---

## 🎨 **Autocomplete Reference**

```tsx
// Name
autoComplete="name"
autoComplete="given-name"
autoComplete="family-name"

// Contact
autoComplete="email"
autoComplete="tel"

// Address
autoComplete="street-address"
autoComplete="address-line1"
autoComplete="address-level2"    // City
autoComplete="address-level1"    // State
autoComplete="postal-code"
autoComplete="country"

// Payment
autoComplete="cc-name"
autoComplete="cc-number"
autoComplete="cc-exp"
autoComplete="cc-csc"

// Auth
autoComplete="username"
autoComplete="current-password"
autoComplete="new-password"
autoComplete="one-time-code"
```

---

## ✅ **Migration Checklist**

When updating existing forms:

1. **Add Section Headers**
   - [ ] Clear title (question format)
   - [ ] Description (why we need it)
   - [ ] Optional icon

2. **Update Input Types**
   - [ ] Change `type="text"` to proper type
   - [ ] Add `inputMode` for fine control
   - [ ] Add `enterKeyHint`

3. **Add Autocomplete**
   - [ ] Use proper autocomplete attribute
   - [ ] Test autofill on mobile

4. **Verify Touch Targets**
   - [ ] Minimum 44px height
   - [ ] Proper padding (py-3)
   - [ ] Test on actual mobile device

5. **Add Help/Errors**
   - [ ] Use FormHelper for contextual help
   - [ ] Clear error messages
   - [ ] Accessible error handling

---

## 🚀 **Example Migration**

### **Before:**

```tsx
<div>
  <label>Email</label>
  <input 
    type="text"               // ❌ Wrong type
    value={email}
    onChange={setEmail}
  />
</div>
```

### **After:**

```tsx
<FormSection
  title="What's your email?"                  // ✅ Clear question
  description="For order updates"             // ✅ Why we need it
>
  <FormInput
    type="email"                              // ✅ Proper type
    inputMode="email"                         // ✅ Email keyboard
    enterKeyHint="next"                       // ✅ Next button
    autoComplete={AutoComplete.email}         // ✅ Autofill
    label="Email Address"
    value={email}
    onChange={setEmail}
    required
  />
</FormSection>
```

---

## 📚 **Resources**

- [iOS Human Interface Guidelines - Text Input](https://developer.apple.com/design/human-interface-guidelines/text-fields)
- [Material Design - Text Fields](https://m3.material.io/components/text-fields)
- [HTML Input Types - MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#input_types)
- [Autocomplete - HTML Spec](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#autofill)

---

**Every form is an opportunity to delight users. Make it easy!** 🎯
