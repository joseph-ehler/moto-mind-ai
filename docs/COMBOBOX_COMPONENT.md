# Advanced Combobox Component

## 🎯 **Built on shadcn/ui Foundation**

Our Combobox component is built on battle-tested **shadcn/ui Command** and **Popover** components, enhanced with MotoMind patterns for advanced use cases.

---

## ✨ **Features:**

### **Core Features:**
- ✅ **Single Select** - Choose one option
- ✅ **Multi-Select** - Choose multiple with chips/badges
- ✅ **Searchable** - Real-time filtering
- ✅ **Clearable** - Clear selection with X button
- ✅ **Loading State** - Show loading indicator

### **Advanced Features:**
- ✅ **Keyboard Navigation** - Built-in with Command component
- ✅ **Async Search** - Load options from API with debounce
- ✅ **Create Options** - Allow users to create new options
- ✅ **Validation States** - Error, success, warning
- ✅ **Icons & Descriptions** - Rich option display
- ✅ **Disabled Options** - Individual option control
- ✅ **Required Field** - Required indicator

### **shadcn/ui Foundation:**
- ✅ **Command Component** - Keyboard navigation, search
- ✅ **Popover Component** - Positioning, accessibility
- ✅ **Badge Component** - Multi-select chips
- ✅ **Button Component** - Trigger styling
- ✅ **Label Component** - Accessible labels

---

## 📝 **Usage Examples:**

### **Basic Single Select:**
```tsx
import { Combobox, ComboboxOption } from '@/components/design-system'

const makes: ComboboxOption[] = [
  { value: 'honda', label: 'Honda' },
  { value: 'toyota', label: 'Toyota' },
  { value: 'ford', label: 'Ford' },
]

<Combobox
  label="Vehicle Make"
  options={makes}
  value={selectedMake}
  onChange={setSelectedMake}
  placeholder="Select make..."
/>
```

### **Multi-Select with Search:**
```tsx
<Combobox
  label="Tags"
  options={tags}
  value={selectedTags}
  onChange={setSelectedTags}
  multiple
  searchPlaceholder="Search tags..."
  helperText="Select multiple tags"
/>
```

### **With Icons & Descriptions:**
```tsx
const options: ComboboxOption[] = [
  {
    value: 'card',
    label: 'Credit Card',
    description: 'Visa, Mastercard, Amex',
    icon: <CreditCardIcon />,
  },
  {
    value: 'paypal',
    label: 'PayPal',
    description: 'Fast & secure',
    icon: <PayPalIcon />,
  },
]

<Combobox
  label="Payment Method"
  options={options}
  value={selectedPayment}
  onChange={setSelectedPayment}
/>
```

### **Async Search:**
```tsx
const searchVehicles = async (query: string) => {
  const response = await fetch(`/api/vehicles/search?q=${query}`)
  const data = await response.json()
  return data.map(v => ({
    value: v.id,
    label: `${v.year} ${v.make} ${v.model}`,
    description: v.vin,
  }))
}

<Combobox
  label="Search Vehicles"
  options={[]}
  onSearch={searchVehicles}
  searchDebounce={300}
  placeholder="Type to search..."
  loadingMessage="Searching..."
/>
```

### **Creatable Options:**
```tsx
<Combobox
  label="Tags"
  options={existingTags}
  value={selectedTags}
  onChange={setSelectedTags}
  multiple
  creatable
  onCreateOption={(value) => {
    const newTag = { value, label: value }
    setExistingTags([...existingTags, newTag])
    setSelectedTags([...selectedTags, value])
  }}
  placeholder="Select or create tags..."
/>
```

### **With Validation:**
```tsx
<Combobox
  label="Vehicle Make"
  options={makes}
  value={selectedMake}
  onChange={setSelectedMake}
  error="Please select a vehicle make"
  required
/>
```

### **Clearable Selection:**
```tsx
<Combobox
  label="Country"
  options={countries}
  value={selectedCountry}
  onChange={setSelectedCountry}
  clearable
  helperText="Click X to clear"
/>
```

---

## 🎨 **Multi-Select Display:**

Multi-select shows selected options as **Badge chips**:

```
┌─────────────────────────────────────────┐
│ [Sports Car ×] [Electric ×] [Luxury ×] │ ← Chips with remove
└─────────────────────────────────────────┘
```

Click the X on any chip to remove that option.

---

## ⌨️ **Keyboard Navigation:**

Built-in keyboard support from shadcn/ui Command:

| Key | Action |
|-----|--------|
| **↓** | Navigate down |
| **↑** | Navigate up |
| **Enter** | Select highlighted option |
| **Escape** | Close dropdown |
| **Type** | Filter options |

---

## 🔄 **Async Search Flow:**

1. User types in search box
2. Debounced (300ms default)
3. `onSearch` handler called with query
4. Shows loading state
5. Options populated from API
6. User can select from results

```tsx
┌─────────────────────────┐
│ Search...               │ ← User types
└─────────────────────────┘
         ↓
    [300ms debounce]
         ↓
   onSearch('honda')
         ↓
    [Loading...]
         ↓
  [Honda Civic, Honda Accord, ...]
```

---

## 🎯 **Comparison: Basic Select vs Combobox:**

| Feature | Basic Select | Combobox |
|---------|-------------|----------|
| **Single select** | ✅ | ✅ |
| **Multi-select** | ❌ | ✅ |
| **Search** | ❌ | ✅ |
| **Async** | ❌ | ✅ |
| **Create** | ❌ | ✅ |
| **Keyboard nav** | Basic | Advanced |
| **Use case** | Simple dropdowns | Complex selection |

---

## 🏗️ **Architecture:**

```
Combobox (Our wrapper)
├── shadcn/ui Popover
│   └── PopoverTrigger (Button)
│   └── PopoverContent
│       └── shadcn/ui Command
│           ├── CommandInput (Search)
│           ├── CommandEmpty (No results)
│           └── CommandGroup
│               └── CommandItem (Options)
├── Badge (Multi-select chips)
├── Label (Accessibility)
└── MotoMind enhancements
    ├── Validation states
    ├── Helper text
    ├── Loading states
    ├── Async search
    └── Create options
```

---

## 📊 **Props API:**

```typescript
interface ComboboxProps<T> {
  // Labels & Messages
  label?: string
  description?: string
  helperText?: string
  placeholder?: string
  searchPlaceholder?: string
  noOptionsMessage?: string
  loadingMessage?: string
  
  // Data
  options: ComboboxOption<T>[]
  value?: T | T[]
  onChange?: (value: T | T[] | null) => void
  
  // Behavior
  multiple?: boolean
  clearable?: boolean
  creatable?: boolean
  onCreateOption?: (inputValue: string) => void
  
  // Async
  onSearch?: (query: string) => Promise<ComboboxOption<T>[]>
  searchDebounce?: number
  
  // States
  loading?: boolean
  disabled?: boolean
  required?: boolean
  error?: string
  success?: string
  warning?: string
}

interface ComboboxOption<T> {
  value: T
  label: string
  description?: string
  icon?: React.ReactNode
  disabled?: boolean
  data?: any
}
```

---

## ✅ **When to Use:**

### **Use Combobox When:**
- ✅ Need multi-select
- ✅ Need search/filter
- ✅ Loading from API
- ✅ Large option lists (100+)
- ✅ Users can create options
- ✅ Rich option display (icons, descriptions)

### **Use Basic Select When:**
- ✅ Simple dropdown (< 20 options)
- ✅ Single select only
- ✅ Static options
- ✅ No search needed

---

## 🚀 **Benefits:**

### **Built on shadcn/ui:**
- ✅ Battle-tested components
- ✅ Excellent accessibility
- ✅ Keyboard navigation
- ✅ Mobile-friendly
- ✅ TypeScript support

### **MotoMind Enhancements:**
- ✅ Validation states
- ✅ Multi-select with chips
- ✅ Async search
- ✅ Create options
- ✅ Loading states
- ✅ Helper text
- ✅ Consistent design system

---

## 📝 **Examples by Use Case:**

### **Vehicle Selection:**
```tsx
<Combobox
  label="Select Vehicle"
  options={vehicles}
  onSearch={searchVehicles}
  placeholder="Search by VIN, make, model..."
  description="Type to search your garage"
/>
```

### **Tag Management:**
```tsx
<Combobox
  label="Tags"
  options={tags}
  multiple
  creatable
  onCreateOption={handleCreateTag}
  placeholder="Add tags..."
/>
```

### **Country Selector:**
```tsx
<Combobox
  label="Country"
  options={countries}
  searchPlaceholder="Search countries..."
  clearable
/>
```

### **Payment Method:**
```tsx
<Combobox
  label="Payment Method"
  options={paymentMethods}
  required
  error={errors.payment}
/>
```

---

## 🎯 **Next Steps:**

1. **Create Showcase** - Demo all features
2. **Real-world Examples** - Vehicle forms, tag management
3. **Performance Testing** - Large datasets (1000+ options)
4. **Mobile Testing** - Touch interactions

---

**Result:** Elite combobox built on solid shadcn/ui foundation! 🚀
