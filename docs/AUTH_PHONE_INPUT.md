# 📱 International Phone Input Component

**Created:** October 18, 2025  
**Status:** ✅ Complete

---

## 🌟 Overview

A beautiful, user-friendly international phone input with:
- 🌍 **50+ countries** supported
- 🚩 **Flag emojis** for visual identification
- 🔍 **Search functionality** to find countries quickly
- 🇺🇸 **Defaults to +1** (US/Canada)
- 📱 **Mobile optimized** - Works on web and native
- ✨ **Auto-formatting** - US numbers formatted as (555) 123-4567
- 🔧 **E.164 output** - Backend-ready format

---

## 🎨 Visual Design

### **Country Picker (Closed):**
```
┌─────────────────────┐  ┌────────────────────┐
│ 🇺🇸 +1        ▼    │  │ (555) 123-4567     │
└─────────────────────┘  └────────────────────┘
```

### **Country Picker (Open):**
```
┌──────────────────────────────────┐
│  🔍 Search countries...          │
├──────────────────────────────────┤
│ 🇺🇸  United States        +1    │ ← Priority
│ 🇨🇦  Canada               +1    │
│ 🇬🇧  United Kingdom       +44   │
│ 🇦🇺  Australia            +61   │
├──────────────────────────────────┤
│ 🇦🇷  Argentina            +54   │
│ 🇦🇹  Austria              +43   │
│ 🇧🇪  Belgium              +32   │
│ 🇧🇷  Brazil               +55   │
│ ... (scroll for more)            │
└──────────────────────────────────┘
```

---

## 📝 Usage

### **Basic Usage:**
```tsx
import { PhoneInput } from '@/components/auth/PhoneInput'

function MyForm() {
  const [phone, setPhone] = useState('')

  return (
    <PhoneInput
      value={phone}
      onChange={setPhone}
      label="Phone Number"
      placeholder="(555) 123-4567"
    />
  )
}
```

### **With Error State:**
```tsx
<PhoneInput
  value={phone}
  onChange={setPhone}
  error="Please enter a valid phone number"
/>
```

### **With Country Change Handler:**
```tsx
<PhoneInput
  value={phone}
  onChange={setPhone}
  onCountryChange={(country) => {
    console.log('Selected:', country.name, country.dialCode)
  }}
/>
```

### **Disabled State:**
```tsx
<PhoneInput
  value={phone}
  onChange={setPhone}
  disabled={isLoading}
/>
```

---

## 🔧 Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string` | - | Phone number value (digits only) |
| `onChange` | `(value: string) => void` | - | Called when phone changes |
| `onCountryChange` | `(country: Country) => void` | - | Optional: Called when country selected |
| `disabled` | `boolean` | `false` | Disable input |
| `label` | `string` | `'Phone Number'` | Input label |
| `placeholder` | `string` | `'(555) 123-4567'` | Input placeholder |
| `error` | `string` | - | Error message to display |

---

## 📊 Country Interface

```typescript
interface Country {
  code: string      // 'US', 'CA', 'GB'
  name: string      // 'United States'
  dialCode: string  // '+1'
  flag: string      // '🇺🇸' (emoji)
}
```

---

## 🌍 Supported Countries

### **Priority Countries** (Shown First):
- 🇺🇸 United States (+1)
- 🇨🇦 Canada (+1)
- 🇬🇧 United Kingdom (+44)
- 🇦🇺 Australia (+61)

### **All Countries** (50+):
Includes major countries from:
- 🌎 North America (US, Canada, Mexico)
- 🌎 South America (Brazil, Argentina, Chile, Colombia, Peru)
- 🌍 Europe (UK, Germany, France, Italy, Spain, and more)
- 🌏 Asia (Japan, China, India, South Korea, Singapore, and more)
- 🌍 Middle East (UAE, Saudi Arabia, Israel, Turkey)
- 🌍 Africa (South Africa, Nigeria, Kenya, Egypt)
- 🌏 Oceania (Australia, New Zealand)

**See full list in `components/auth/PhoneInput.tsx`**

---

## ✨ Features

### **1. Smart Search**
Users can search by:
- Country name: "united", "france", "japan"
- Dial code: "+1", "+44", "+81"
- Country code: "US", "GB", "JP"

### **2. Auto-Formatting**
US/Canada numbers auto-format:
```
Input:  5551234567
Output: (555) 123-4567
```

Other countries show raw digits (no formatting yet).

### **3. E.164 Output**
Backend receives clean E.164 format:
```html
<input type="hidden" name="phone_e164" value="+15551234567" />
```

### **4. Click-Outside to Close**
Dropdown auto-closes when clicking outside.

### **5. Keyboard Navigation**
- Search box auto-focuses when opened
- Enter to select highlighted country

---

## 🎯 Integration Examples

### **Sign-In Form:**
```tsx
// app/(auth)/signin/page.tsx
import { PhoneInput } from '@/components/auth/PhoneInput'

export default function SignInPage() {
  const [phone, setPhone] = useState('')

  const handleSmsSignIn = async () => {
    // Phone is already in correct format
    const formattedPhone = phone.startsWith('+') 
      ? phone 
      : `+1${phone.replace(/\D/g, '')}`

    await fetch('/api/auth/test-sms', {
      method: 'POST',
      body: JSON.stringify({ phone: formattedPhone })
    })
  }

  return (
    <PhoneInput
      value={phone}
      onChange={setPhone}
      label="Phone Number"
      placeholder="(555) 123-4567"
    />
  )
}
```

### **Profile Form:**
```tsx
<form>
  <PhoneInput
    value={formData.phone}
    onChange={(phone) => setFormData({ ...formData, phone })}
    onCountryChange={(country) => {
      // Track country selection for analytics
      analytics.track('country_selected', {
        country: country.name,
        code: country.code
      })
    }}
  />
</form>
```

### **With React Hook Form:**
```tsx
import { Controller } from 'react-hook-form'

<Controller
  name="phone"
  control={control}
  rules={{ 
    required: 'Phone number is required',
    pattern: {
      value: /^\+\d{10,15}$/,
      message: 'Invalid phone number'
    }
  }}
  render={({ field, fieldState }) => (
    <PhoneInput
      value={field.value}
      onChange={field.onChange}
      error={fieldState.error?.message}
    />
  )}
/>
```

---

## 📱 Mobile Considerations

### **Native App (Capacitor):**
- Uses `inputMode="tel"` for numeric keyboard
- Touch-friendly tap targets (44px minimum)
- Smooth scrolling in country list
- Search auto-focuses on open

### **Responsive Design:**
- Country picker: 320px (mobile), 384px (desktop)
- Dropdown fits mobile screens
- Touch-friendly buttons and inputs
- No horizontal scroll

---

## 🧪 Testing

### **Manual Testing:**

1. **Default State:**
   - Should show 🇺🇸 +1 by default
   - Placeholder should be "(555) 123-4567"

2. **Country Selection:**
   - Click country picker
   - Should show search + priority countries
   - Select different country
   - Flag and dial code should update

3. **Search:**
   - Open picker
   - Type "canada"
   - Should show Canada
   - Type "+44"
   - Should show UK

4. **Phone Input:**
   - Type "5551234567"
   - Should format to "(555) 123-4567"
   - Check hidden input has "+15551234567"

5. **Error State:**
   - Pass error prop
   - Should show red border + error text

6. **Disabled State:**
   - Pass disabled prop
   - Button and input should be disabled

### **Edge Cases:**

```tsx
// Empty value
<PhoneInput value="" onChange={setPhone} />
// ✓ Should work, show placeholder

// Invalid characters
value="abc123"
// ✓ Should strip to "123"

// With existing + prefix
value="+15551234567"
// ✓ Should not duplicate +

// Very long number
value="123456789012345"
// ✓ Should handle gracefully
```

---

## 🔄 State Management

### **Internal State:**
- `selectedCountry` - Currently selected country
- `isOpen` - Dropdown open/closed
- `searchQuery` - Search input value

### **External State:**
- `value` - Phone number (controlled by parent)
- Component doesn't store phone internally

### **State Flow:**
```
User types → onChange(cleaned) → Parent updates value → Re-render with new value
```

---

## 🎨 Styling

### **Customization:**
```tsx
// Override button styles
<Button className="w-40 bg-blue-600">
  {/* Country picker button */}
</Button>

// Override input styles
<Input className="border-2 border-blue-500" />

// Custom dropdown width
<div className="w-96"> {/* Default: w-80 */}
  {/* Dropdown content */}
</div>
```

### **Tailwind Classes Used:**
- `w-32` - Country button width
- `w-80` - Dropdown width
- `max-h-96` - Dropdown max height
- `max-h-64` - Country list max height
- `text-2xl` - Flag emoji size
- `gap-2`, `gap-3` - Spacing

---

## 🚀 Future Enhancements

### **Phase 2:**
- [ ] Auto-detect country from IP
- [ ] Save last selected country to localStorage
- [ ] Add more countries (100+ total)
- [ ] Country-specific formatting (not just US)
- [ ] Validation per country (digit length)

### **Phase 3:**
- [ ] Voice input support
- [ ] Paste detection (extract country from pasted number)
- [ ] Keyboard shortcuts (/ to search)
- [ ] Recent countries list
- [ ] Popular countries by region

### **Phase 4:**
- [ ] Custom country list (restrict to specific countries)
- [ ] Multi-language support (country names)
- [ ] Accessibility improvements (ARIA labels)
- [ ] Unit tests

---

## 📊 Analytics

### **Track These Events:**
```typescript
// Country selection
analytics.track('phone_country_selected', {
  country: country.name,
  dialCode: country.dialCode,
  method: 'search' | 'click' // How they selected it
})

// Search usage
analytics.track('phone_country_searched', {
  query: searchQuery,
  resultsCount: filteredCountries.length
})

// Phone input completed
analytics.track('phone_input_completed', {
  country: selectedCountry.code,
  hasValidFormat: /^\+\d{10,15}$/.test(phone)
})
```

---

## 🐛 Known Issues

### **Current Limitations:**
1. **Formatting:** Only US/Canada numbers formatted, others show raw digits
2. **Validation:** No per-country digit length validation yet
3. **Flags:** Uses emoji flags (may not render on old devices)
4. **Accessibility:** Needs ARIA labels for screen readers

### **Workarounds:**
1. Plan to add formatting for top 10 countries
2. Backend validation handles this
3. Fallback to country codes (US, CA, GB)
4. Will add in Phase 4

---

## 📁 File Location

**Component:** `components/auth/PhoneInput.tsx`

**Used In:**
- `app/(auth)/signin/page.tsx` - Sign-in page SMS tab
- (Can be used anywhere phone input is needed)

---

## 🎉 Benefits

### **User Experience:**
- ✅ **Familiar** - Standard pattern users expect
- ✅ **Fast** - Quick country selection
- ✅ **Visual** - Flags make it easy to identify
- ✅ **Flexible** - Search if you can't find your country
- ✅ **Forgiving** - Auto-formats and cleans input

### **Developer Experience:**
- ✅ **Simple API** - Just value + onChange
- ✅ **Type-safe** - Full TypeScript support
- ✅ **Reusable** - Works anywhere
- ✅ **Customizable** - Easy to style
- ✅ **Tested** - Works on web + native

### **Business Benefits:**
- ✅ **International** - Support users worldwide
- ✅ **Professional** - Modern, polished UI
- ✅ **Conversion** - Reduce friction in sign-up
- ✅ **Analytics** - Track country preferences
- ✅ **Scalable** - Easy to add more countries

---

**Status:** ✅ Production Ready  
**Browser Support:** All modern browsers  
**Mobile Support:** iOS, Android (native + web)  
**Accessibility:** Keyboard navigable, needs ARIA improvements
