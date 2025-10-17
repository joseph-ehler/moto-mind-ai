# Z-Index Scale & Focus States

## Z-Index Scale

Standardized z-index values prevent stacking conflicts and ensure proper layering.

### Scale

```ts
import { zIndex } from '@/lib/design-system/tokens'

zIndex.base      // 0    - Base layer
zIndex.dropdown  // 1000 - Dropdowns, select menus
zIndex.sticky    // 1100 - Sticky headers, footers
zIndex.fixed     // 1200 - Fixed position elements
zIndex.modal     // 1300 - Modal overlays
zIndex.popover   // 1400 - Popovers
zIndex.toast     // 1500 - Toast notifications
zIndex.tooltip   // 1600 - Tooltips (highest)
```

### Usage

```tsx
// Dropdown
<div className="absolute z-[1000]">
  <DropdownMenu />
</div>

// Modal
<div className="fixed inset-0 z-[1300]">
  <Modal />
</div>

// Toast
<div className="fixed top-4 right-4 z-[1500]">
  <Toast />
</div>
```

### Rules

1. **Never use arbitrary z-index values** - Always use the scale
2. **Layer hierarchy** - Lower values for base elements, higher for overlays
3. **Tooltip always highest** - They should appear above everything
4. **Modal blocks interaction** - Should be above most elements
5. **Document custom layers** - If you need a new layer, document it

---

## Focus States

Accessible focus indicators for keyboard navigation.

### Focus Ring Variants

```ts
import { focusRing } from '@/lib/design-system/tokens'

// Default focus ring (use for most interactive elements)
focusRing.default
// → 'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'

// Destructive actions (delete, remove)
focusRing.destructive
// → 'focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2'

// Success actions
focusRing.success
// → 'focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2'

// No focus ring (use with caution - must have alternative indicator)
focusRing.none
// → 'focus:outline-none'

// Inset focus ring (for dark backgrounds)
focusRing.inset
// → 'focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white'

// Dark mode focus ring
focusRing.dark
// → 'focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-900'
```

### Usage

```tsx
import { cn } from '@/lib/utils'
import { focusRing } from '@/lib/design-system/tokens'

// Button with focus ring
<button className={cn(
  "px-4 py-2 bg-primary text-white rounded-lg",
  focusRing.default
)}>
  Save
</button>

// Delete button
<button className={cn(
  "px-4 py-2 bg-red-600 text-white rounded-lg",
  focusRing.destructive
)}>
  Delete
</button>

// Link with focus ring
<a href="#" className={cn(
  "text-blue-600 hover:underline",
  focusRing.default
)}>
  Learn more
</a>
```

### Accessibility Rules

1. **Never remove focus indicators** without providing an alternative
2. **Always use `focusRing.default`** for most interactive elements
3. **Test with keyboard** - Tab through your UI to verify focus visibility
4. **Color contrast** - Focus rings must meet WCAG color contrast requirements
5. **Focus visible** - Use `:focus-visible` to show only for keyboard users

---

## Interaction States

Standardized hover, active, and disabled states.

### Hover States

```ts
import { interactionStates } from '@/lib/design-system/tokens'

// Scale up on hover (cards, buttons)
interactionStates.hover.scale
// → 'hover:scale-105 transition-transform duration-200'

// Opacity change on hover
interactionStates.hover.opacity  
// → 'hover:opacity-80 transition-opacity duration-200'

// Shadow increase on hover
interactionStates.hover.shadow
// → 'hover:shadow-lg transition-shadow duration-200'
```

### Active States

```ts
// Scale down when pressed
interactionStates.active.scale
// → 'active:scale-95'

// Opacity change when pressed
interactionStates.active.opacity
// → 'active:opacity-60'
```

### Disabled States

```ts
// Opacity and cursor for disabled elements
interactionStates.disabled.opacity
// → 'disabled:opacity-50 disabled:cursor-not-allowed'

// Complete disabled state (with pointer-events-none)
interactionStates.disabled.base
// → 'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none'
```

### Combined Example

```tsx
<button className={cn(
  "px-4 py-2 bg-primary text-white rounded-lg",
  focusRing.default,
  interactionStates.hover.scale,
  interactionStates.active.scale,
  interactionStates.disabled.base
)}>
  Save Changes
</button>
```

---

## Complete Button Example

```tsx
import { cn } from '@/lib/utils'
import { focusRing, interactionStates } from '@/lib/design-system/tokens'

interface ButtonProps {
  variant?: 'default' | 'destructive' | 'success'
  disabled?: boolean
  children: React.ReactNode
}

export function Button({ variant = 'default', disabled, children }: ButtonProps) {
  const variants = {
    default: 'bg-primary text-primary-foreground',
    destructive: 'bg-red-600 text-white',
    success: 'bg-green-600 text-white'
  }

  const focusVariants = {
    default: focusRing.default,
    destructive: focusRing.destructive,
    success: focusRing.success
  }

  return (
    <button
      disabled={disabled}
      className={cn(
        "px-4 py-2 rounded-lg font-semibold",
        variants[variant],
        focusVariants[variant],
        interactionStates.hover.scale,
        interactionStates.active.scale,
        interactionStates.disabled.base
      )}
    >
      {children}
    </button>
  )
}
```

---

## Testing Checklist

### Keyboard Navigation
- [ ] Tab through all interactive elements
- [ ] Focus ring visible on all focusable elements
- [ ] Focus order is logical (top to bottom, left to right)
- [ ] Shift+Tab works in reverse
- [ ] Enter/Space activates buttons
- [ ] Arrow keys work in select/radio groups

### Visual Testing
- [ ] Focus ring has sufficient contrast (3:1 minimum)
- [ ] Focus ring doesn't overlap content
- [ ] Hover states work smoothly
- [ ] Active states provide feedback
- [ ] Disabled states are clearly indicated

### Screen Reader Testing
- [ ] All interactive elements have labels
- [ ] Focus changes are announced
- [ ] Error states are announced
- [ ] Success states are announced

---

## Common Patterns

### Card with Hover Effect

```tsx
<Card className={cn(
  "p-6",
  interactionStates.hover.shadow,
  interactionStates.hover.scale,
  focusRing.default
)}>
  <Heading>Card Title</Heading>
  <Text>Card content</Text>
</Card>
```

### Link with Focus Ring

```tsx
<a 
  href="/somewhere"
  className={cn(
    "text-blue-600 hover:underline",
    focusRing.default
  )}
>
  Click here
</a>
```

### Modal Overlay

```tsx
<div className="fixed inset-0 z-[1300] bg-black/50">
  <div className="fixed inset-0 flex items-center justify-center p-4">
    <div className={cn(
      "bg-white rounded-lg p-6 max-w-md w-full",
      focusRing.default
    )}>
      <Modal />
    </div>
  </div>
</div>
```

---

## Summary

**Z-Index Scale:**
- 8 standardized levels (0 to 1600)
- Prevents stacking conflicts
- Clear hierarchy: base → dropdowns → modals → tooltips

**Focus States:**
- 6 focus ring variants
- Always accessible
- Semantic colors (default, destructive, success)

**Interaction States:**
- Hover, active, disabled patterns
- Smooth transitions
- Consistent across components

**Use these tokens for all interactive elements to ensure consistency and accessibility.**
