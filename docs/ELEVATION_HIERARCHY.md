# 🏔️ Elevation & Shadow Hierarchy

**Philosophy:** Clear visual hierarchy through elevation shadows. Each layer has appropriate depth.

---

## 📊 Elevation Levels

### **Level 1: Base (No Shadow)**
```
Cards at rest: No shadow
Background surfaces: Flat
```

**CSS:** No shadow class

---

### **Level 2: Raised (shadow-md)**
```
Cards on hover: shadow-md
Interactive surfaces: Subtle lift
```

**CSS:** `shadow-md`
**Value:** 
```
0 4px 6px -1px rgba(0, 0, 0, 0.1),
0 2px 4px -2px rgba(0, 0, 0, 0.1)
```

**Use:**
- Card hover states
- Buttons
- Interactive elements

---

### **Level 3: Elevated (shadow-lg)**
```
Sticky headers: shadow-lg
Fixed navigation: Higher elevation
```

**CSS:** `shadow-lg`
**Value:**
```
0 10px 15px -3px rgba(0, 0, 0, 0.1),
0 4px 6px -4px rgba(0, 0, 0, 0.1)
```

**Use:**
- Sticky/fixed headers
- Floating toolbars
- Important persistent UI

---

### **Level 4: Floating (shadow-xl)**
```
Modals: shadow-xl
Dialogs: High elevation
```

**CSS:** `shadow-xl`
**Value:**
```
0 20px 25px -5px rgba(0, 0, 0, 0.1),
0 8px 10px -6px rgba(0, 0, 0, 0.1)
```

**Use:**
- Modal dialogs
- Large overlays
- Important temporary UI

---

### **Level 5: Topmost (shadow-2xl)** ✨
```
Popovers: shadow-2xl
Tooltips: Maximum elevation
Dropdowns: Above everything
```

**CSS:** `shadow-2xl`
**Value:**
```
0 25px 50px -12px rgba(0, 0, 0, 0.25)
```

**Use:**
- Popovers
- Tooltips
- Dropdown menus
- Context menus
- HoverCards

---

## 🎯 Why shadow-2xl for Popovers?

### **The Problem:**
```
Card hover: shadow-md (Level 2)
Popover: shadow-md (SAME LEVEL!)
Result: Conflicting elevation ❌
```

**Visual confusion:**
- Popover doesn't look above card
- Same shadow = same elevation
- No clear hierarchy

---

### **The Solution:**
```
Card hover: shadow-md (Level 2)
Popover: shadow-2xl (Level 5!)
Result: Clear elevation hierarchy ✅
```

**Visual clarity:**
- Popover clearly floating above
- Deep shadow = high elevation
- Obvious hierarchy

---

## 🎨 Visual Comparison

### **Before (shadow-md on both):**
```
Card (hover):  [shadow-md]
               ┌─────────┐
               │  Card   │
               └─────────┘
Popover:       [shadow-md]  ← Same elevation!
               ┌─────────┐
               │ Popover │
               └─────────┘

No clear hierarchy
```

### **After (proper elevation):**
```
Card (hover):  [shadow-md]
               ┌─────────┐
               │  Card   │
               └─────────┘
Popover:       [shadow-2xl]  ← Much higher!
               ┌─────────┐
               │ Popover │━━━━ Deep shadow
               └─────────┘━━━━

Clear visual hierarchy!
```

---

## 📐 Technical Values

### **Tailwind Shadow Scale:**

```css
shadow-sm:   0 1px 2px rgba(0, 0, 0, 0.05)
shadow:      0 1px 3px rgba(0, 0, 0, 0.1)
shadow-md:   0 4px 6px -1px rgba(0, 0, 0, 0.1)
shadow-lg:   0 10px 15px -3px rgba(0, 0, 0, 0.1)
shadow-xl:   0 20px 25px -5px rgba(0, 0, 0, 0.1)
shadow-2xl:  0 25px 50px -12px rgba(0, 0, 0, 0.25)  ← Deepest!
```

---

## 🏗️ Implementation

### **Card Hover:**
```tsx
<Card className="hover:shadow-md">
```

**Elevation:** Level 2 (subtle lift)

---

### **Popover:**
```tsx
<PopoverContent className="shadow-2xl">
```

**Elevation:** Level 5 (maximum depth)

---

### **HoverCard:**
```tsx
<HoverCardContent className="shadow-2xl">
```

**Elevation:** Level 5 (maximum depth)

---

## 💡 Elevation Principles

### **1. Higher Layer = Deeper Shadow:**
```
More important/temporary = deeper shadow
Popovers are temporary and important
Therefore: shadow-2xl
```

### **2. Consistent Hierarchy:**
```
All popovers: shadow-2xl
All cards: shadow-md on hover
All modals: shadow-xl
Consistent = predictable
```

### **3. Shadow Size = Floating Height:**
```
Larger shadow = appears higher
shadow-2xl = very high floating
shadow-md = slightly raised
```

### **4. Visual Communication:**
```
Deep shadow tells user:
"I'm floating above the page"
"I'm temporary"
"I'm important right now"
```

---

## 🎯 Complete Hierarchy

```
Level 5: shadow-2xl
├─ Popovers ✨
├─ Tooltips
├─ Dropdowns
└─ Context menus

Level 4: shadow-xl
├─ Modals
└─ Dialogs

Level 3: shadow-lg
├─ Sticky headers
└─ Fixed navigation

Level 2: shadow-md
├─ Card hover
├─ Button hover
└─ Interactive elements

Level 1: No shadow
├─ Cards at rest
└─ Base surfaces
```

---

## 🧪 User Experience

**Before (conflicting shadows):**
"The popover and card have similar shadows... it's not clear which is on top."

**After (clear hierarchy):**
"Oh! The popover has a much deeper shadow - it's clearly floating way above the card. The visual depth makes it obvious this is a temporary overlay that I'm focusing on."

---

## 📊 Summary

### **Updated:**
- **Popover:** shadow-md → shadow-2xl ✨
- **HoverCard:** shadow-md → shadow-2xl ✨

### **Maintained:**
- **Cards:** shadow-md on hover
- **Sticky header:** shadow-lg
- **Modals:** shadow-xl

### **Result:**
- ✅ Clear elevation hierarchy
- ✅ Popovers visually above cards
- ✅ No shadow conflicts
- ✅ Professional depth perception
- ✅ Consistent system

---

**shadow-2xl for popovers! Clear elevation hierarchy! Professional depth!** 🏔️✨
