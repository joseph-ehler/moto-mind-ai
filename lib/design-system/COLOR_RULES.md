# Color System Rules - MotoMind Design System

## 🚨 MANDATORY: Use ColoredBox Components

**NEVER manually use `bg-*` classes. ALWAYS use `<ColoredBox>` or its variants.**

```tsx
// ✅ CORRECT - Accessibility automatic
import { DestructiveBox, PrimaryBox } from '@/components/design-system'

<DestructiveBox className="p-4 rounded-lg">
  <Heading>Error</Heading>
  <Text>Message</Text>
</DestructiveBox>

// ❌ WRONG - Manual bg classes are FORBIDDEN
<div className="bg-destructive text-destructive-foreground p-4">
  <Heading>Error</Heading>
  <Text>Message</Text>
</div>
```

**Why:** ColoredBox automatically handles foreground colors. Manual classes always fail accessibility.

---

## Available Components

- `<ColoredBox variant="primary|secondary|destructive|muted|accent|card">` - Generic
- `<PrimaryBox>` - Blue primary color
- `<SecondaryBox>` - Secondary/muted
- `<DestructiveBox>` - Red error/destructive  
- `<MutedBox>` - Muted/disabled states
- `<AccentBox>` - Accent highlights

---

## The Old (Deprecated) Rule

**Every element inside a colored background MUST explicitly use the foreground token:**

```tsx
// ✅ CORRECT - ALL text uses foreground token
<div className="bg-destructive p-4">
  <h3 className="text-destructive-foreground font-bold">Error</h3>
  <p className="text-destructive-foreground">Message here</p>
</div>

// ❌ WRONG - heading inherits default dark text (poor contrast!)
<div className="bg-destructive text-destructive-foreground p-4">
  <h3 className="font-bold">Error</h3> {/* This will be dark text on red! */}
  <p>Message here</p>
</div>

// ❌ WRONG - missing foreground entirely
<button className="bg-primary">
  Button
</button>

// ❌ WRONG - hardcoded colors
<button className="bg-blue-600 text-white">
  Button
</button>
```

## Why This Matters for Accessibility

**The Problem**: CSS inheritance doesn't work the way you'd expect. Even if you add `text-destructive-foreground` to the parent `<div>`, child elements like `<Heading>` or `<Text>` components may have their own text color classes that override it.

**The Solution**: **Explicitly add the foreground class to EVERY text element** inside a colored background.

```tsx
// ❌ BAD - Heading will be dark blue on red background
<div className="bg-destructive text-destructive-foreground p-4">
  <Heading level="subtitle">Error</Heading>
  <Text>Message</Text>
</div>

// ✅ GOOD - Every element explicitly uses foreground
<div className="bg-destructive p-4">
  <Heading level="subtitle" className="text-destructive-foreground">Error</Heading>
  <Text className="text-destructive-foreground">Message</Text>
</div>
```

---

## Available Semantic Tokens

### Background + Foreground Pairs

| Token | Usage | Example |
|-------|-------|---------|
| `primary` | Main actions, important buttons | `bg-primary text-primary-foreground` |
| `secondary` | Secondary actions, alternative buttons | `bg-secondary text-secondary-foreground` |
| `destructive` | Delete, errors, warnings | `bg-destructive text-destructive-foreground` |
| `muted` | Subtle backgrounds, disabled states | `bg-muted text-muted-foreground` |
| `accent` | Highlights, hover states | `bg-accent text-accent-foreground` |
| `card` | Card surfaces, elevated content | `bg-card text-card-foreground` |
| `popover` | Popovers, dropdowns | `bg-popover text-popover-foreground` |
| `background` | Page background | `bg-background text-foreground` |

### Utility Tokens

| Token | Usage | Example |
|-------|-------|---------|
| `border` | Default borders | `border border-border` |
| `input` | Input field borders | `border border-input` |
| `ring` | Focus rings | `ring-2 ring-ring` |

---

## Why This Works

1. **Automatic Contrast**: The foreground color is always guaranteed to have proper contrast with its background
2. **Dark Mode**: Same tokens work in light and dark mode - just different CSS variable values
3. **Consistency**: Using the same tokens everywhere ensures visual harmony
4. **Maintainability**: Change the theme once, updates everywhere

---

## Common Patterns

### Buttons
```tsx
// ✅ CORRECT - Simple buttons
<button className="bg-primary rounded-lg px-4 py-2">
  <span className="text-primary-foreground">Save</span>
</button>

// ✅ CORRECT - With design system components
<button className="bg-destructive rounded-lg px-4 py-2">
  <Text className="text-destructive-foreground font-semibold">Delete</Text>
</button>
```

### Alerts
```tsx
// ✅ CORRECT - Every text element has foreground class
<div className="bg-primary p-4 rounded-lg">
  <Heading level="subtitle" className="text-primary-foreground">Success</Heading>
  <Text className="text-primary-foreground">Your changes have been saved.</Text>
</div>

// ✅ CORRECT - Error alert
<div className="bg-destructive p-4 rounded-lg">
  <Heading level="subtitle" className="text-destructive-foreground">Error</Heading>
  <Text className="text-destructive-foreground">Something went wrong.</Text>
</div>

// ❌ WRONG - Heading will be dark text!
<div className="bg-destructive text-destructive-foreground p-4 rounded-lg">
  <Heading level="subtitle">Error</Heading> {/* Missing foreground! */}
  <Text>Something went wrong.</Text>
</div>
```

### Cards
```tsx
<div className="bg-card text-card-foreground border rounded-lg p-6">
  <h3 className="font-semibold text-lg mb-2">Card Title</h3>
  <p className="text-muted-foreground">Card content</p>
</div>
```

---

## Do's and Don'ts

### ✅ DO

- **Explicitly add foreground class to EVERY text element** inside colored backgrounds
- Add `text-*-foreground` to Heading, Text, span, p, h1-h6 - everything
- Use semantic token names (primary, destructive)
- Test contrast with browser DevTools
- Use the same tokens consistently

### ❌ DON'T

- **Rely on CSS inheritance** - it will fail with components
- Forget foreground class on headings or emphasized text
- Use Tailwind color classes (`bg-blue-500`, `text-red-600`)
- Hardcode hex color values
- Create custom color tokens without design approval
- Override CSS variables in component styles

### 🚨 CRITICAL MISTAKE TO AVOID

```tsx
// ❌ THIS WILL FAIL ACCESSIBILITY
<div className="bg-destructive text-destructive-foreground p-4">
  <Heading>Error</Heading>  {/* Dark blue text on red! */}
  <Text>Message</Text>
</div>

// ✅ THIS PASSES
<div className="bg-destructive p-4">
  <Heading className="text-destructive-foreground">Error</Heading>
  <Text className="text-destructive-foreground">Message</Text>
</div>
```

**Why it fails**: The `Heading` and `Text` components have their own default text color classes that override the parent's `text-destructive-foreground`. You MUST explicitly add the foreground class to each child element.

---

## Quick Reference

**The pattern is always:**
```
bg-{token} text-{token}-foreground
```

**Examples:**
- `bg-primary text-primary-foreground`
- `bg-destructive text-destructive-foreground`
- `bg-muted text-muted-foreground`
- `bg-card text-card-foreground`

**That's it. Keep it simple.**

---

## Testing Your Colors

1. **Visual Check**: Can you read the text easily?
2. **Dark Mode**: Toggle dark mode - does it still work?
3. **Color Blindness**: Use browser DevTools to simulate
4. **Automated**: Use WebAIM Contrast Checker if needed

---

## Where Colors Are Defined

Colors are CSS variables defined in:
- `app/globals.css` or `styles/globals.css`
- Root `:root` for light mode
- `.dark` class for dark mode

Example:
```css
:root {
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
}
```

**Don't edit these directly in component files.**

---

## Summary

1. Use semantic tokens: `primary`, `destructive`, `muted`, etc.
2. Always pair background with foreground
3. Never use hardcoded colors
4. Trust the system - it handles contrast for you

**Keep it simple. Follow the one rule.**
