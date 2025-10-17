# Button Visual Reference Guide
**ONE variant = ONE style. NO EXCEPTIONS.**

---

## 🎨 **EXACT Button Styles**

### **1. PRIMARY (variant="primary")**
```
┌──────────────────────────┐
│  Schedule Service        │  ← White text (text-white)
└──────────────────────────┘
    ↑ Blue background (bg-blue-600)
    ↑ Shadow (shadow-md)
    
Hover: bg-blue-700 + shadow-lg
```
**CSS:** `bg-blue-600 text-white shadow-md hover:bg-blue-700`  
**Use:** Main CTAs, primary actions  
**Contrast:** White on blue (WCAG AAA)

---

### **2. SECONDARY (variant="secondary")**
```
┌──────────────────────────┐
│  I Did This              │  ← Dark gray text (text-gray-900)
└──────────────────────────┘
    ↑ White background (bg-white)
    ↑ Gray border (border-gray-300)
    
Hover: bg-gray-50 + border-gray-400
```
**CSS:** `bg-white text-gray-900 border-2 border-gray-300`  
**Use:** Alternative actions, secondary CTAs  
**Contrast:** Dark gray on white (WCAG AAA)

---

### **3. SUCCESS (variant="success")**
```
┌──────────────────────────┐
│  Mark Complete           │  ← White text
└──────────────────────────┘
    ↑ Green background (bg-green-600)
    
Hover: bg-green-700
```
**CSS:** `bg-green-600 text-white shadow-md`  
**Use:** Confirmations, completions  
**Contrast:** White on green (WCAG AAA)

---

### **4. WARNING (variant="warning")**
```
┌──────────────────────────┐
│  Review Required         │  ← White text
└──────────────────────────┘
    ↑ Yellow/Orange background (bg-yellow-600)
    
Hover: bg-yellow-700
```
**CSS:** `bg-yellow-600 text-white shadow-md`  
**Use:** Cautions, attention needed  
**Contrast:** White on yellow (WCAG AA+)

---

### **5. DANGER (variant="danger" or "destructive")**
```
┌──────────────────────────┐
│  Delete Vehicle          │  ← White text
└──────────────────────────┘
    ↑ Red background (bg-red-600)
    
Hover: bg-red-700
```
**CSS:** `bg-red-600 text-white shadow-md`  
**Use:** Destructive actions, deletions  
**Contrast:** White on red (WCAG AAA)

---

### **6. OUTLINE (variant="outline")**
```
┌──────────────────────────┐
│  Learn More              │  ← Dark gray text (text-gray-900)
└──────────────────────────┘
    ↑ Transparent background
    ↑ Dark gray border (border-gray-400)
    
Hover: bg-gray-100 + border-gray-500
```
**CSS:** `border-2 border-gray-400 bg-transparent text-gray-900`  
**Use:** Tertiary actions, alternative paths  
**Contrast:** Dark gray text (WCAG AAA)

---

### **7. GHOST (variant="ghost")**
```
┌──────────────────────────┐
│  Cancel                  │  ← Medium gray text (text-gray-700)
└──────────────────────────┘
    ↑ No background, no border
    
Hover: bg-gray-100 + text-gray-900
```
**CSS:** `text-gray-700 hover:bg-gray-100`  
**Use:** Subtle actions, cancellations  
**Contrast:** Medium gray (WCAG AA)

---

### **8. LINK (variant="link")**
```
Schedule Service  ← Blue text with underline on hover
    ↑ No background, no border
    
Hover: underline + text-blue-700
```
**CSS:** `text-blue-600 hover:underline`  
**Use:** Navigation, text-only actions  
**Contrast:** Blue text (WCAG AA)

---

## 📏 **Size Reference**

### **Small (size="sm")**
- Height: **40px**
- Padding: **16px horizontal**
- Text: **14px** (text-sm)

### **Default (size="default")**
- Height: **44px** ← iOS/Android standard
- Padding: **24px horizontal**
- Text: **16px** (text-base)

### **Large (size="lg")**
- Height: **52px**
- Padding: **32px horizontal**
- Text: **18px** (text-lg)

---

## 🎯 **Button Hierarchy Rules**

### **On White/Light Backgrounds:**
1. **Primary CTA:** `variant="primary"` (Blue)
2. **Secondary:** `variant="secondary"` (White with border)
3. **Tertiary:** `variant="outline"` (Gray border)
4. **Cancel/Dismiss:** `variant="ghost"` (Text only)

### **On Dark Backgrounds (e.g., DestructiveBox):**
1. **Primary CTA:** `variant="primary"` (Blue - stands out)
2. **Secondary:** `variant="secondary"` (White - visible)
3. **Tertiary:** `variant="outline"` (Gray border - visible)

### **Alert-Specific:**
- **Red Alert Box:** Use `variant="primary"` (blue CTA) NOT red
- **Yellow Warning Box:** Use `variant="warning"` (yellow CTA) for urgency
- **Green Success Box:** Use `variant="success"` (green CTA) for confirmation

---

## ❌ **FORBIDDEN**

### **DO NOT:**
```tsx
// ❌ Custom background color
<Button className="bg-gradient-to-r from-blue-600...">

// ❌ Custom text color
<Button className="text-white">

// ❌ Custom hover state
<Button className="hover:bg-blue-700">

// ❌ Gray button on gray background
<MutedBox>  {/* Gray background */}
  <Button variant="secondary">  {/* Also gray - BAD */}
    Bad Contrast
  </Button>
</MutedBox>
```

### **DO:**
```tsx
// ✅ Use variant only
<Button variant="primary">Good Button</Button>

// ✅ Proper contrast
<MutedBox>  {/* Gray background */}
  <Button variant="primary">  {/* Blue - GOOD contrast */}
    Good Contrast
  </Button>
</MutedBox>
```

---

## 🎨 **Contrast Matrix**

| Background | Primary | Secondary | Outline | Ghost |
|-----------|---------|-----------|---------|-------|
| **White** | ✅ Blue | ✅ White+Border | ✅ Gray Border | ✅ Gray Text |
| **Light Gray** | ✅ Blue | ✅ White+Border | ✅ Dark Border | ✅ Dark Text |
| **Dark Gray** | ✅ Blue | ✅ White+Border | ⚠️ May be low | ❌ Poor |
| **Red** | ✅ Blue | ✅ White+Border | ⚠️ Check | ❌ Poor |
| **Blue** | ⚠️ Low | ✅ White+Border | ✅ White Border | ⚠️ Check |

**Legend:**
- ✅ Good contrast (WCAG AA+)
- ⚠️ Check carefully
- ❌ Poor contrast (avoid)

---

## 📱 **Mobile vs Desktop**

### **Mobile (< 640px)**
- Buttons ALWAYS full-width in ButtonGroup
- Stacked vertically
- 12px gap between buttons
- Easy to tap (44px touch target)

### **Desktop (≥ 640px)**
- Buttons inline
- 16px gap between buttons
- Auto-width based on content

```tsx
<ButtonGroup>
  <Button variant="primary">Schedule</Button>
  <Button variant="secondary">Cancel</Button>
</ButtonGroup>

// Mobile: Full-width stack
// Desktop: Inline with spacing
```

---

## 📋 **Quick Reference Table**

| Variant | Background | Text | Border | Shadow | Use Case |
|---------|-----------|------|--------|--------|----------|
| `primary` | Blue-600 | White | None | md | Main CTA |
| `secondary` | White | Gray-900 | Gray-300 | sm | Alternative |
| `success` | Green-600 | White | None | md | Confirm |
| `warning` | Yellow-600 | White | None | md | Caution |
| `danger` | Red-600 | White | None | md | Destruct |
| `outline` | Transparent | Gray-900 | Gray-400 | sm | Tertiary |
| `ghost` | Transparent | Gray-700 | None | none | Subtle |
| `link` | Transparent | Blue-600 | None | none | Navigate |

---

## 🎯 **Testing Checklist**

Before shipping buttons:
- [ ] All buttons use `variant` prop (no className colors)
- [ ] No gray buttons on gray backgrounds
- [ ] All buttons 44px minimum height
- [ ] Text is 16px minimum (14px for small)
- [ ] Proper contrast ratios (WCAG AA minimum)
- [ ] Multiple buttons wrapped in `<ButtonGroup>`
- [ ] Tested on mobile device (real device, not simulator)
- [ ] Focus states visible (blue ring)

---

## 🚨 **GOLDEN RULE**

> **One variant = One exact style. ZERO exceptions.**
> 
> If a button looks different than what's documented here,
> it's WRONG and must be fixed.

---

**Last Updated:** 2025-10-08  
**Maintained By:** Design System Team  
**Questions?** Refer to this document. Period.
