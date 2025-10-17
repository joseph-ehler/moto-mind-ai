# Accessibility Enforcement - Color System

## MANDATORY: Use ColoredBox Components

**NEVER manually use `bg-*` classes. ALWAYS use `ColoredBox` or its variants.**

### Why This Matters

Manual `bg-*` classes break accessibility because:
1. Developers forget to add `text-*-foreground`
2. Child components override parent text colors
3. Impossible to catch at build time
4. Results in WCAG violations

### The Solution: ColoredBox

We've built accessibility **INTO** the component. It's impossible to get wrong.

---

## Usage

### ✅ CORRECT - Use ColoredBox

```tsx
import { ColoredBox, DestructiveBox, PrimaryBox } from '@/components/design-system'

// Automatic accessibility - no manual foreground needed!
<DestructiveBox className="p-4 rounded-lg">
  <Heading level="subtitle">Error</Heading>
  <Text>This text is automatically white</Text>
</DestructiveBox>

// OR use the generic ColoredBox
<ColoredBox variant="primary" className="p-4 rounded-lg">
  <Heading level="subtitle">Information</Heading>
  <Text>All children get correct foreground automatically</Text>
</ColoredBox>
```

### ❌ WRONG - Manual bg-* classes

```tsx
// DON'T DO THIS - Will fail accessibility
<div className="bg-destructive p-4">
  <Heading level="subtitle">Error</Heading>
  <Text>Text will be dark blue on red!</Text>
</div>

// EVEN THIS IS WRONG - Heading won't inherit
<div className="bg-destructive text-destructive-foreground p-4">
  <Heading level="subtitle">Error</Heading> {/* Still dark! */}
  <Text>Message</Text>
</div>
```

---

## Available Components

### ColoredBox (Generic)

```tsx
<ColoredBox 
  variant="primary" | "secondary" | "destructive" | "muted" | "accent" | "card"
  className="p-4 rounded-lg"
>
  {children}
</ColoredBox>
```

### Specialized Variants

- `<PrimaryBox>` - Blue primary color
- `<SecondaryBox>` - Secondary/muted color
- `<DestructiveBox>` - Red error/destructive color
- `<MutedBox>` - Muted/disabled states
- `<AccentBox>` - Accent highlights

---

## How It Works

ColoredBox applies BOTH background AND foreground automatically:

```tsx
// Internally, ColoredBox does this:
<div className="bg-destructive text-destructive-foreground">
  {children}
</div>
```

And our `Heading` and `Text` components now respect parent foreground colors automatically.

---

## Migration Guide

### Before (Manual, Error-Prone)

```tsx
<div className="bg-primary text-primary-foreground p-4 rounded-lg">
  <Heading level="subtitle" className="text-primary-foreground">Title</Heading>
  <Text className="text-primary-foreground">Content</Text>
</div>
```

### After (Automatic, Safe)

```tsx
<PrimaryBox className="p-4 rounded-lg">
  <Heading level="subtitle">Title</Heading>
  <Text>Content</Text>
</PrimaryBox>
```

**No manual foreground classes needed. Accessibility is guaranteed.**

---

## Enforcement Rules

### 1. **NEVER use bg-primary, bg-destructive, etc. directly**

Use `<ColoredBox>` or variants instead.

### 2. **If you MUST use manual bg-*, add lint ignore with justification**

```tsx
// eslint-disable-next-line accessibility/no-manual-bg-colors
// Justification: Third-party component integration
<div className="bg-primary text-primary-foreground">
```

### 3. **All new code MUST use ColoredBox**

Code reviews will reject manual `bg-*` usage.

---

## Common Patterns

### Buttons

```tsx
// Error button
<button>
  <DestructiveBox className="px-4 py-2 rounded-lg">
    <Text className="font-semibold">Delete</Text>
  </DestructiveBox>
</button>
```

### Alerts

```tsx
// Error alert
<DestructiveBox className="p-4 rounded-lg">
  <Heading level="subtitle">Error</Heading>
  <Text>Unable to save changes.</Text>
</DestructiveBox>

// Info alert  
<PrimaryBox className="p-4 rounded-lg">
  <Heading level="subtitle">Information</Heading>
  <Text>Your profile was updated.</Text>
</PrimaryBox>
```

### Cards

```tsx
// Accent card
<AccentBox className="p-6 rounded-lg border">
  <Heading level="subtitle">Featured</Heading>
  <Text>Special content goes here</Text>
</AccentBox>
```

---

## Testing

### Visual Regression Tests

All ColoredBox variants are tested for contrast in:
- Light mode
- Dark mode
- High contrast mode
- Color blindness simulations

### Automated Checks

```bash
# Run accessibility checks
npm run test:a11y

# Check contrast ratios
npm run test:contrast
```

---

## Benefits

1. **Impossible to mess up** - Accessibility is automatic
2. **Consistent** - All colored backgrounds work the same way
3. **Maintainable** - Change theme in one place
4. **Testable** - Automated accessibility checks
5. **WCAG Compliant** - Guaranteed contrast ratios

---

## Summary

**Old way (manual, error-prone):**
```tsx
<div className="bg-destructive text-destructive-foreground p-4">
  <Heading className="text-destructive-foreground">Error</Heading>
  <Text className="text-destructive-foreground">Message</Text>
</div>
```

**New way (automatic, safe):**
```tsx
<DestructiveBox className="p-4">
  <Heading>Error</Heading>
  <Text>Message</Text>
</DestructiveBox>
```

**Use ColoredBox. Always. No exceptions.**
