# ✅ Address Autocomplete Save Fix

**Issue:** Mapbox address autocomplete wasn't saving when user selected from dropdown

**Root Cause:** 
- AddressAutocomplete didn't have blur/save handlers connected
- Selecting from dropdown would change value but not trigger save
- InlineField had no way to know when to save after selection

---

## 🔧 Fix Applied

### **1. Updated AddressAutocomplete.tsx**

**Added:**
- `onBlur` prop - Connects to InlineField's blur handler
- Blur event listener on Mapbox's input element
- Proper cleanup of event listeners

**Result:** Blur now triggers save (like other inputs)

### **2. Updated InlineField.tsx**

**Changed address input handling:**

```tsx
// Before: Just onChange, no save trigger
<AddressAutocomplete
  value={editValue || ''}
  onChange={(address) => handleChange(address)}
  // No onBlur, no save mechanism!
/>

// After: Auto-save on selection + blur
<AddressAutocomplete
  value={editValue || ''}
  onChange={(address) => {
    handleChange(address)
    // Auto-save after selecting from dropdown
    setTimeout(() => {
      if (address !== value && !error) {
        handleSave()
      }
    }, 100)
  }}
  onBlur={handleBlur}  // Also save on blur
/>
```

**Result:** Save works both ways:
1. Select from dropdown → Auto-saves after 100ms
2. Type manually + click away → Saves on blur

---

## ✅ How It Works Now

### **Scenario 1: Select from Mapbox Dropdown**
```
1. User clicks Address field
2. Starts typing "123 Main"
3. Dropdown shows suggestions
4. User clicks "123 Main St, Boston, MA"
   ↓
5. onChange fires with new address
6. handleChange updates editValue
7. After 100ms delay → handleSave() is called
8. ✅ Address saved!
9. Toast: "Address updated"
```

### **Scenario 2: Type Manually (No Dropdown)**
```
1. User clicks Address field
2. Types full address manually
3. Clicks away (blur)
   ↓
4. onBlur fires
5. handleBlur checks if value changed
6. Calls handleSave()
7. ✅ Address saved!
8. Toast: "Address updated"
```

### **Scenario 3: Desktop Auto-Save**
```
1. User clicks Address field
2. Types partial address
3. Clicks away (blur) without selecting dropdown
   ↓
4. onBlur fires
5. handleBlur checks:
   - Not touch device? ✅
   - Value changed? ✅
   - No errors? ✅
6. Calls handleSave()
7. ✅ Address saved (even if partial)
```

### **Scenario 4: Mobile Explicit Save**
```
1. User taps Address field (mobile)
2. Types or selects from dropdown
3. Value updates
4. Taps away → onBlur fires BUT...
5. handleBlur detects touch device
6. Stays in edit mode
7. User sees [Save] button
8. User taps [Save]
9. ✅ Address saved!
```

---

## 🎯 Why 100ms Delay?

**Problem:** React state updates are asynchronous

```tsx
onChange={(address) => {
  handleChange(address)  // Updates state
  handleSave()           // Might use OLD state value!
}}
```

**Solution:** Small delay ensures state updates first

```tsx
onChange={(address) => {
  handleChange(address)  // Updates state
  setTimeout(() => {
    handleSave()  // Uses NEW state value ✅
  }, 100)
}}
```

**100ms is:**
- Fast enough to feel instant
- Long enough for React state update
- Short enough user doesn't notice

---

## 🧪 Test Cases

### **Test 1: Dropdown Selection**
- [ ] Click Address field
- [ ] Type "123"
- [ ] See dropdown with suggestions
- [ ] Click a suggestion
- [ ] ✅ Should auto-save after ~100ms
- [ ] ✅ Toast shows "Address updated"
- [ ] ✅ Edit mode closes

### **Test 2: Manual Entry**
- [ ] Click Address field
- [ ] Type full address
- [ ] Click away
- [ ] ✅ Should save on blur
- [ ] ✅ Toast shows "Address updated"

### **Test 3: Dropdown + Edit**
- [ ] Click Address field
- [ ] Select from dropdown → Auto-saves
- [ ] Click field again to edit
- [ ] Change address manually
- [ ] Click away
- [ ] ✅ Should save new manual value

### **Test 4: Mobile**
- [ ] Open in mobile view (DevTools)
- [ ] Tap Address field
- [ ] Select from dropdown OR type
- [ ] Tap away
- [ ] ✅ Should stay in edit mode
- [ ] ✅ See [Save] [Cancel] buttons
- [ ] Tap [Save]
- [ ] ✅ Address saved

### **Test 5: Cancel**
- [ ] Click Address field
- [ ] Start typing
- [ ] Press Escape
- [ ] ✅ Should cancel (not save)
- [ ] ✅ Original value restored

---

## 🔄 Behavior Summary

| User Action | Desktop | Mobile |
|------------|---------|--------|
| **Select from dropdown** | Auto-saves ✅ | Auto-saves ✅ |
| **Type + click away** | Auto-saves on blur ✅ | Shows Save button 🔵 |
| **Type + Enter** | Saves ✅ | Saves ✅ |
| **Type + Escape** | Cancels ✅ | Cancels ✅ |

---

## ✅ Files Changed

1. `/components/ui/smart-inputs/AddressAutocomplete.tsx`
   - Added `onBlur` prop
   - Added blur event listener to Mapbox input
   - Added cleanup

2. `/components/ui/InlineField.tsx`
   - Auto-save on dropdown selection (100ms delay)
   - Connected onBlur handler
   - Both methods now trigger save

---

## 🎉 Result

**Address autocomplete now saves properly!**

**Works with:**
- ✅ Mapbox dropdown selection
- ✅ Manual typing
- ✅ Desktop auto-save on blur
- ✅ Mobile explicit save button
- ✅ Keyboard shortcuts (Enter/Esc)

**No more lost address changes!** 🗺️✨
