# Sticky Header & Footer - How It Works

## 🎯 **TL;DR: Header and footer are ALWAYS visible, no matter how much you scroll!**

---

## 🏗️ **Architecture**

### **Flex Column Layout**
```tsx
<div className="flex flex-col max-h-[90vh]">
  {/* 1. HEADER - Pinned to top */}
  <ModalHeader className="flex-shrink-0" />
  
  {/* 2. CONTENT - Scrollable area */}
  <ModalContent className="flex-1 overflow-y-auto" />
  
  {/* 3. FOOTER - Pinned to bottom */}
  <ModalFooter className="flex-shrink-0" />
</div>
```

---

## 🔧 **How Each Part Works**

### **1. Container (BaseModal)**
```tsx
<div className="flex flex-col overflow-hidden max-h-[90vh]">
  {/* flex-col: Stack children vertically */}
  {/* overflow-hidden: Clips content at edges */}
  {/* max-h-[90vh]: Never taller than viewport */}
</div>
```

**Role:** Creates the flex container that manages layout

---

### **2. Header (ModalHeader)**
```tsx
<div className="px-8 py-6 border-b border-black/5 flex-shrink-0">
  {/* flex-shrink-0: NEVER shrinks, stays fixed size */}
  {/* border-b: Visual separator */}
</div>
```

**Role:** 
- Always visible at top
- Never scrolls away
- Fixed height (~80-90px)

**Classes:**
- `flex-shrink-0` ← **KEY**: Prevents shrinking, stays fixed
- `border-b` ← Visual separation from content

---

### **3. Content (ModalContent)**
```tsx
<div className="flex-1 overflow-y-auto p-8">
  {/* flex-1: Takes ALL remaining space */}
  {/* overflow-y-auto: Scrolls vertically when content exceeds height */}
  {/* p-8: Padding for content */}
</div>
```

**Role:**
- Grows to fill space between header and footer
- Scrolls when content is taller than available space
- Only part of modal that scrolls

**Classes:**
- `flex-1` ← **KEY**: Grows to fill remaining vertical space
- `overflow-y-auto` ← **KEY**: Enables vertical scrolling
- `overflow-x-hidden` ← Prevents horizontal scroll

---

### **4. Footer (ModalFooter)**
```tsx
<div className="flex-shrink-0 border-t bg-white p-6">
  {/* flex-shrink-0: NEVER shrinks, stays fixed size */}
  {/* border-t: Visual separator */}
</div>
```

**Role:**
- Always visible at bottom
- Never scrolls away
- Fixed height (~84px)

**Classes:**
- `flex-shrink-0` ← **KEY**: Prevents shrinking, stays fixed
- `border-t` ← Visual separation from content
- `rounded-b-3xl` ← Matches parent border radius

---

## 📊 **Visual Breakdown**

### **Short Content (No Scrolling)**
```
┌─────────────────────────┐ ← Container (max-h-90vh)
│ 🔵 Header (80px)        │ ← flex-shrink-0 (fixed)
├─────────────────────────┤
│                         │
│ Content (300px)         │ ← flex-1 (grows)
│ Fits comfortably        │   No scroll needed
│                         │
├─────────────────────────┤
│ [Cancel]  [Save] (84px) │ ← flex-shrink-0 (fixed)
└─────────────────────────┘
Total: 464px (fits easily)
```

### **Tall Content (Scrolling Needed)**
```
┌─────────────────────────┐ ← Container (max-h-90vh = 600px)
│ 🔵 Header (80px)        │ ← ALWAYS VISIBLE (flex-shrink-0)
├─────────────────────────┤
│ Content Section 1       │ ↑
│ Content Section 2       │ │
│ Content Section 3       │ │ Scrollable area
│ Content Section 4       │ │ (436px visible)
│ ⋮ (scrolling...)        │ │ Content total: 1000px
│ Content Section 8       │ ↓
├─────────────────────────┤
│ [Cancel]  [Save] (84px) │ ← ALWAYS VISIBLE (flex-shrink-0)
└─────────────────────────┘

User scrolls content ↕️
Header stays fixed ✅
Footer stays fixed ✅
```

---

## 🎨 **Flex Layout Explained**

### **CSS Flexbox Properties**

**`flex-shrink-0` (Header & Footer)**
```css
flex-shrink: 0;
/* 
  Prevents element from shrinking below its natural size
  Even when flex container runs out of space
  Result: Fixed size, always visible
*/
```

**`flex-1` (Content)**
```css
flex: 1;
/* Shorthand for:
  flex-grow: 1;    ← Grows to fill available space
  flex-shrink: 1;  ← Can shrink if needed (rarely happens)
  flex-basis: 0;   ← Starts with 0 height, grows from there
*/
```

**`overflow-y-auto` (Content)**
```css
overflow-y: auto;
/*
  Shows scrollbar when content exceeds container height
  Otherwise hidden
*/
```

---

## 🔍 **Step-by-Step Calculation**

**Example: iPhone 13 (844px viewport)**

1. **Container max-height**: `90vh` = 760px
2. **Header height**: ~80px (flex-shrink-0)
3. **Footer height**: ~84px (flex-shrink-0)
4. **Available for content**: 760 - 80 - 84 = **596px**

**If content is 1000px tall:**
- Content container shows: 596px
- Content scrolls: 1000px total
- Scroll distance: 404px (1000 - 596)
- Header: FIXED at top ✅
- Footer: FIXED at bottom ✅

---

## 🧪 **How to Test**

### **1. Visual Test**
```tsx
<CardFormModal
  sections={[
    { id: '1', title: 'Section 1', content: <TallContent /> },
    { id: '2', title: 'Section 2', content: <TallContent /> },
    { id: '3', title: 'Section 3', content: <TallContent /> },
    { id: '4', title: 'Section 4', content: <TallContent /> },
    { id: '5', title: 'Section 5', content: <TallContent /> },
  ]}
/>
```

**Expected behavior:**
- ✅ Header stays at top while scrolling
- ✅ Footer stays at bottom while scrolling
- ✅ Only middle content scrolls
- ✅ Smooth scrolling with momentum

### **2. Browser DevTools Test**
```bash
1. Open modal
2. Open DevTools (F12)
3. Inspect header element
4. Look for: flex-shrink-0 in classes
5. Scroll content
6. Watch header in Elements panel
7. ✅ Header should NOT move in DOM
```

### **3. Scroll to Bottom Test**
```bash
1. Open modal with tall content
2. Scroll to very bottom
3. ✅ Can see last content item
4. ✅ Footer is still visible
5. ✅ No content hidden under footer
```

---

## 🎯 **Common Issues & Solutions**

### ❌ **Issue: Footer covers content**
**Cause:** Content doesn't have bottom padding

**Solution:** Use `withFooter` variant
```tsx
<ModalContent variant="withFooter">
  {/* Has pb-24 for footer clearance */}
</ModalContent>
```

### ❌ **Issue: Header scrolls away**
**Cause:** Missing `flex-shrink-0` on header

**Solution:** Already built-in! ✅
```tsx
<ModalHeader className="flex-shrink-0" />
```

### ❌ **Issue: Content doesn't scroll**
**Cause:** Missing `overflow-y-auto` on content

**Solution:** Already built-in! ✅
```tsx
<ModalContent className="flex-1 overflow-y-auto" />
```

---

## 🚀 **Advanced: Custom Sticky Elements**

### **Adding Sticky Subheader in Content**
```tsx
<ModalContent>
  <div className="sticky top-0 bg-white z-10 pb-4">
    <h3>Subheader (also sticky!)</h3>
  </div>
  <div>
    {/* Regular scrolling content */}
  </div>
</ModalContent>
```

**Classes:**
- `sticky top-0` ← Sticks to top of scrollable area
- `bg-white` ← Covers content below
- `z-10` ← Stays on top of content

---

## 📊 **Browser Compatibility**

**Flexbox support:**
- ✅ All modern browsers (100% coverage)
- ✅ Chrome/Edge (all versions)
- ✅ Firefox (all versions)
- ✅ Safari/iOS (all versions)
- ✅ Android (all versions)

**Sticky positioning:**
- ✅ Chrome 56+
- ✅ Firefox 59+
- ✅ Safari 13+
- ✅ Edge 16+

---

## 🎨 **CSS Behind the Scenes**

```css
/* Container */
.modal-container {
  display: flex;
  flex-direction: column;
  max-height: 90vh;
  overflow: hidden;
}

/* Header - ALWAYS VISIBLE */
.modal-header {
  flex-shrink: 0;  /* Won't shrink */
  /* Natural height based on content */
}

/* Content - SCROLLABLE */
.modal-content {
  flex: 1;           /* Grows to fill space */
  overflow-y: auto;  /* Scrolls when needed */
}

/* Footer - ALWAYS VISIBLE */
.modal-footer {
  flex-shrink: 0;  /* Won't shrink */
  /* Natural height based on content */
}
```

---

## ✨ **Visual Indicators**

### **Scroll Shadows (Optional Enhancement)**
Add visual cues when content is scrollable:

```tsx
// Future enhancement
<ModalContent className="
  flex-1 overflow-y-auto
  [&::-webkit-scrollbar]:w-2
  [&::-webkit-scrollbar-thumb]:bg-gray-300
  [&::-webkit-scrollbar-thumb]:rounded-full
">
  {content}
</ModalContent>
```

**Result:** Styled scrollbar that indicates scrollability

---

## 🎯 **Summary**

**Your modal system uses a bulletproof flex layout:**

1. **Container**: `flex flex-col` + `max-h-[90vh]`
2. **Header**: `flex-shrink-0` → Always visible, never scrolls
3. **Content**: `flex-1 overflow-y-auto` → Grows to fill, scrolls when needed
4. **Footer**: `flex-shrink-0` → Always visible, never scrolls

**Result:** Header and footer are ALWAYS accessible, no matter how much you scroll! 🎉

---

## 📚 **Related Docs**
- [RESPONSIVE_DESIGN.md](./RESPONSIVE_DESIGN.md) - Viewport height handling
- [README.md](./README.md) - Complete modal guide
- [EXAMPLES.md](./EXAMPLES.md) - Usage examples

**Status:** ✅ Sticky header/footer works perfectly across all devices and content lengths.
