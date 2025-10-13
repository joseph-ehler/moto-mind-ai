# Button System Standards

## 🎯 **Core Principles**
1. **NEVER override button styles with className. ALWAYS use built-in variants.**
2. **Mobile-first: All buttons meet 44px minimum touch target (iOS/Android standard)**
3. **Responsive: Use ButtonGroup for automatic mobile stacking**

---

## ✅ **Available Variants**

### **Primary Actions** (Blue)
```tsx
<Button variant="primary">Schedule Service</Button>
// Result: bg-blue-600 hover:bg-blue-700 text-white
```
**Use for:** Main CTAs, primary actions, form submissions

---

### **Secondary Actions** (Gray)
```tsx
<Button variant="secondary">I Did This</Button>
// Result: shadcn secondary variant (gray background)
```
**Use for:** Alternative actions, secondary CTAs

---

### **Success Actions** (Green)
```tsx
<Button variant="success">Mark Complete</Button>
// Result: bg-green-600 hover:bg-green-700 text-white
```
**Use for:** Confirmations, completions, positive outcomes

---

### **Warning Actions** (Yellow)
```tsx
<Button variant="warning">Review Required</Button>
// Result: bg-yellow-600 hover:bg-yellow-700 text-white
```
**Use for:** Caution states, attention needed

---

### **Danger Actions** (Red)
```tsx
<Button variant="danger">Delete Vehicle</Button>
// Result: bg-red-600 hover:bg-red-700 text-white
```
**Use for:** Destructive actions, deletions, critical warnings

---

### **Ghost Actions** (Transparent)
```tsx
<Button variant="ghost">Cancel</Button>
// Result: transparent with hover state
```
**Use for:** Subtle actions, cancellations, tertiary actions

---

### **Outline Actions** (Bordered)
```tsx
<Button variant="outline">Learn More</Button>
// Result: bordered button with hover state
```
**Use for:** Secondary CTAs, alternative paths

---

## 📏 **Sizes** (Mobile-First)

All sizes meet minimum touch target requirements:

```tsx
<Button size="sm">Small Button</Button>      {/* 40px min-height */}
<Button size="default">Default Button</Button> {/* 44px min-height - iOS/Android standard */}
<Button size="lg">Large Button</Button>      {/* 52px min-height */}
```

**Touch Target Standards:**
- iOS: 44×44 points minimum
- Android: 48×48 dp minimum  
- We use: **44px minimum** (meets both standards)

---

## 📱 **Mobile-First Button Groups**

Use `ButtonGroup` to automatically stack buttons on mobile and display inline on desktop:

```tsx
import { ButtonGroup } from '@/components/design-system'

<ButtonGroup>
  <Button variant="primary">Schedule Service</Button>
  <Button variant="secondary">I Did This</Button>
  <Button variant="outline">Remind Me Later</Button>
</ButtonGroup>
```

**Result:**
- **Mobile (< 640px)**: Full-width stacked buttons with 12px gap
- **Desktop (≥ 640px)**: Inline buttons with 16px gap

**Options:**
```tsx
// Disable full-width on mobile (keep inline)
<ButtonGroup fullWidthOnMobile={false}>
  <Button>Inline</Button>
  <Button>Always</Button>
</ButtonGroup>

// Force vertical layout
<ButtonGroup orientation="vertical">
  <Button>Stack</Button>
  <Button>Vertical</Button>
</ButtonGroup>
```

---

## 🎨 **Modifiers**

### **Full Width**
```tsx
<Button fullWidth variant="primary">
  Schedule Service
</Button>
```

### **With Icon**
```tsx
<Button 
  icon={<Sparkles className="w-4 h-4" />}
  variant="primary"
>
  AI Recommendation
</Button>
```

### **Loading State**
```tsx
<Button loading variant="primary">
  Saving...
</Button>
```

### **Disabled State**
```tsx
<Button disabled variant="primary">
  Not Available
</Button>
```

---

## 🚫 **FORBIDDEN PATTERNS**

### ❌ **DO NOT DO THIS:**
```tsx
// Custom background override
<Button className="bg-gradient-to-r from-blue-600 to-indigo-600">
  Bad Button
</Button>

// Custom text color
<Button className="text-white">
  Bad Button
</Button>

// Any style override
<Button className="shadow-xl hover:-translate-y-2">
  Bad Button
</Button>
```

### ✅ **DO THIS INSTEAD:**
```tsx
// Use built-in variants
<Button variant="primary">Good Button</Button>
<Button variant="success">Good Button</Button>
<Button variant="danger">Good Button</Button>
```

---

## 📋 **Real-World Examples**

### **Alert Card Buttons** (Mobile-First)
```tsx
<DestructiveBox>
  <Stack spacing="md">
    <Text>Oil Change Due</Text>
    
    {/* ✅ Use ButtonGroup for responsive layout */}
    <ButtonGroup>
      {/* Primary action - blue */}
      <Button variant="primary" onClick={scheduleService}>
        Schedule Service
      </Button>
      
      {/* Secondary action - gray */}
      <Button variant="secondary">
        I Did This
      </Button>
      
      {/* Tertiary action - outline */}
      <Button variant="outline">
        Remind Me Later
      </Button>
    </ButtonGroup>
  </Stack>
</DestructiveBox>
```
**Mobile:** Full-width stacked | **Desktop:** Inline

### **Warning Card Buttons**
```tsx
<MutedBox>
  <Stack spacing="md">
    <Text>Tire Rotation Recommended</Text>
    
    <ButtonGroup>
      {/* Warning action - yellow */}
      <Button variant="warning" onClick={scheduleService}>
        Schedule Service
      </Button>
      
      <Button variant="secondary">
        I Did This
      </Button>
      
      <Button variant="outline">
        Snooze
      </Button>
    </ButtonGroup>
  </Stack>
</MutedBox>
```

### **AI Recommendation Card**
```tsx
<AccentBox>
  <Stack spacing="md">
    <Text>Bundle and Save</Text>
    
    {/* Full-width primary CTA with icon */}
    <Button 
      variant="primary" 
      fullWidth
      icon={<Sparkles className="w-4 h-4" />}
      onClick={bundleServices}
    >
      Schedule Both Services
    </Button>
    
    {/* Full-width secondary */}
    <Button variant="secondary" fullWidth>
      Maybe Later
    </Button>
  </Stack>
</AccentBox>
```

---

## 🎨 **Color Mapping**

| Variant | Background | Use Case |
|---------|-----------|----------|
| `primary` | Blue | Main actions, default CTAs |
| `secondary` | Gray | Alternative actions |
| `success` | Green | Confirmations, completions |
| `warning` | Yellow | Cautions, attention needed |
| `danger` | Red | Destructive actions |
| `ghost` | Transparent | Subtle actions |
| `outline` | Bordered | Secondary paths |

---

## 📝 **Implementation Checklist**

When adding buttons:
- [ ] Use only built-in variants
- [ ] No className overrides for colors
- [ ] No className overrides for hover states
- [ ] Use `fullWidth` prop for full-width buttons
- [ ] Use `icon` prop for icons (not manual elements)
- [ ] Use `size` prop for sizing (not classes)
- [ ] Use `loading` prop for loading states
- [ ] Use `disabled` prop for disabled states

---

## 🔧 **Extending the System**

If you need a new button style that doesn't exist:

1. **DON'T** add className overrides
2. **DO** add a new variant to `/components/design-system/primitives/Button.tsx`
3. **DO** update `/lib/design-system/index.ts` componentVariants
4. **DO** document it here

Example:
```tsx
// In Button.tsx
variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'ghost' | 'outline' | 'info'

// In index.ts componentVariants.button.semantic
info: 'bg-blue-500 hover:bg-blue-600 text-white'
```

---

## 🎯 **Summary**

**ONE RULE TO RULE THEM ALL:**
> Use `variant` prop, never `className` for styling buttons.

This ensures:
✅ Consistency across the app
✅ Easy theming and updates
✅ Accessible and tested patterns
✅ Mobile-friendly touch targets
✅ Predictable behavior

---

**Last Updated:** 2025-10-08
**Maintained By:** Design System Team
