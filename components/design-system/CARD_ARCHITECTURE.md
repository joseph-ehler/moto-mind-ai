# Card Component Architecture

## 📐 Design Decision: Single Card Pattern

### Problem Statement
We previously had **3 different Card implementations** causing confusion and incorrect exports:

1. **shadcn Card** (`components/ui/card.tsx`) - Base Radix UI wrapper
2. **Primitive Card** (`primitives/Surfaces.tsx`) - Redundant wrapper around Surface
3. **Enhanced Card** (`patterns/Card.tsx`) - Design system Card with padding/elevation props

This violated the **Single Source of Truth** principle and caused layout bugs.

---

## ✅ Solution: Clear Layered Architecture

### Architecture Flow
```
shadcn/ui Card (base primitive)
    ↓
patterns/Card (design system features)
    ↓
Public API (@/components/design-system)
```

### Component Responsibilities

#### **1. shadcn/ui Card** (`@/components/ui/card`)
**Role:** Foundation layer (Radix UI wrapper)
- Provides: `Card`, `CardHeader`, `CardContent`, `CardFooter`, `CardTitle`, `CardDescription`
- Minimal styling, accessibility built-in
- **Direct export** for Header/Content/Footer (they have proper padding built-in)

#### **2. Enhanced Card** (`patterns/Card.tsx`)
**Role:** Design system layer
- Wraps shadcn Card with design system features
- Props: `padding`, `elevation`, `interactive`
- Uses design system tokens (`ds.spacing.padding`, `ds.effects.shadow`)
- Default: `padding="md"` (responsive 16px → 24px)

#### **3. Removed: Primitive Card** (was in `primitives/Surfaces.tsx`)
**Reason for removal:**
- Just a thin wrapper around `Surface` with `elevation={1}`
- Added no value over shadcn Card
- Created confusion and naming conflicts
- **Violates DRY principle**

---

## 📦 Public Exports

```tsx
// From design system index
export { Card } from './patterns/Card'  // Enhanced with padding/elevation
export { 
  CardHeader,    // From shadcn (has p-6 built-in)
  CardContent,   // From shadcn (has p-6 pt-0 built-in)
  CardFooter,    // From shadcn (has p-6 pt-0 built-in)
  CardTitle,     // From shadcn
  CardDescription // From shadcn
} from '@/components/ui/card'
```

---

## 🎯 Usage Patterns

### Simple Card (Most Common)
```tsx
import { Card } from '@/components/design-system'

<Card>
  {/* Content - automatically has padding="md" (16px→24px responsive) */}
</Card>
```

### Card with Sections
```tsx
import { Card, CardHeader, CardContent, CardFooter } from '@/components/design-system'

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    Main content
  </CardContent>
  <CardFooter>
    Actions
  </CardFooter>
</Card>
```

### Card with Custom Padding
```tsx
<Card padding="lg">  {/* 24px→32px responsive */}
  Large padding content
</Card>

<Card padding="sm">  {/* 12px */}
  Compact content
</Card>
```

### Interactive Card
```tsx
<Card 
  interactive 
  onClick={() => navigate('/detail')}
  elevation="floating"
>
  Clickable card with hover effects
</Card>
```

---

## 🔧 Design System Tokens Used

```tsx
padding = {
  sm: 'p-3',          // 12px
  md: 'p-4 sm:p-6',   // 16px → 24px (default)
  lg: 'p-6 sm:p-8'    // 24px → 32px
}

elevation = {
  flat: 'border border-gray-200',
  raised: 'shadow border border-gray-200',
  floating: 'shadow-lg border border-gray-200'
}
```

---

## 📋 Migration Notes

If you see old imports from `primitives/Surfaces`:

```tsx
// ❌ Old (broken)
import { Card } from './primitives/Surfaces'

// ✅ New (correct)
import { Card } from '@/components/design-system'
```

**Note:** The old primitive Card had no padding prop, causing layout issues.

---

## 🎓 Architectural Principles Applied

1. ✅ **Single Source of Truth** - One enhanced Card, not three
2. ✅ **Layered Architecture** - Base → Enhanced → Public API
3. ✅ **Composition over Duplication** - Removed redundant wrapper
4. ✅ **Separation of Concerns** - shadcn handles primitives, patterns handle design system
5. ✅ **Explicit is better than implicit** - Clear responsibility for each layer

---

## 📝 Change Log

### 2025-10-05: Card Architecture Cleanup
- **Removed** redundant Card from `primitives/Surfaces.tsx`
- **Updated** exports to use shadcn CardHeader/Content/Footer directly
- **Kept** enhanced Card from `patterns/Card.tsx` as the single Card export
- **Added** documentation explaining the architecture decision

---

## 🔗 Related Files

- `components/ui/card.tsx` - Base shadcn implementation
- `components/design-system/patterns/Card.tsx` - Enhanced implementation
- `components/design-system/primitives/Surfaces.tsx` - Surface primitive (Card removed)
- `components/design-system/index.tsx` - Public exports
