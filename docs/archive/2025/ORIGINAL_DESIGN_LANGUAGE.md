# Original MotoMind Design Language

## The Aesthetic

**Apple-inspired sophistication:**
- Spacious, breathable layouts
- Subtle, refined details
- Clean hierarchy through opacity
- Generous padding
- Soft, modern radius
- Premium feel

---

## Core Principles

### 1. Container Width
```tsx
max-w-3xl mx-auto  // 768px - Perfect for reading
```

**Why:** Optimal line length for content. Not too wide, not too narrow. Feels premium.

### 2. Border Radius
```tsx
rounded-3xl  // Very round, modern
```

**Why:** Soft, friendly, premium. Not corporate (rounded-lg). Not childish (full rounded). Just right.

### 3. Borders
```tsx
border-black/5  // Barely visible
```

**Why:** Subtle division. Not harsh. Sophisticated. Let content hierarchy do the work.

### 4. Spacing
```tsx
px-8 py-5  // Generous padding
px-6 py-8  // Page padding
```

**Why:** Breathing room. Premium feel. Not cramped. Content is respected.

### 5. Typography Hierarchy
```tsx
// Headers
text-xl font-semibold text-slate-900

// Section titles
text-lg font-semibold text-black

// Labels (muted)
text-sm font-medium text-black/60

// Values (emphasis)
text-base font-semibold text-black

// Body
text-sm text-gray-600
```

**Why:** Clear hierarchy through size + weight + opacity. Not color variety. Clean.

### 6. Backgrounds
```tsx
// Page background
bg-slate-50  // Subtle, not harsh white

// Card surface
bg-white  // Clean, elevated
```

**Why:** Subtle depth. Cards feel elevated. Not flat design.

### 7. Layout Pattern
```tsx
<div className="min-h-screen bg-slate-50">
  {/* Sticky header */}
  <header className="bg-white border-b border-black/5 sticky top-0 z-10">
    <div className="max-w-3xl mx-auto px-6 py-4">
      {/* Back button + title */}
    </div>
  </header>

  {/* Content */}
  <main className="max-w-3xl mx-auto px-6 py-8">
    {/* Cards with rounded-3xl */}
  </main>
</div>
```

**Why:** Consistent structure. Sticky navigation. Content-focused.

---

## Component Patterns

### Premium Card (Row-based)
```tsx
<div className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden">
  {/* Header */}
  <div className="px-8 py-4 border-b border-black/5">
    <h3 className="text-lg font-semibold text-black">Section Title</h3>
  </div>
  
  {/* Rows */}
  <div className="flex items-center justify-between px-8 py-5 border-b border-black/5">
    <span className="text-sm font-medium text-black/60">Label</span>
    <span className="text-base font-semibold text-black">Value</span>
  </div>
  
  <div className="flex items-center justify-between px-8 py-5">
    <span className="text-sm font-medium text-black/60">Label</span>
    <span className="text-base font-semibold text-black">Value</span>
  </div>
</div>
```

### Sticky Header
```tsx
<header className="bg-white border-b border-black/5 sticky top-0 z-10">
  <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-4">
    <button className="w-10 h-10 flex items-center justify-center hover:bg-slate-100 rounded-full transition-colors">
      <ArrowLeft className="w-5 h-5" />
    </button>
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Page Title</h1>
      <p className="text-sm text-slate-600">Subtitle</p>
    </div>
  </div>
</header>
```

### Button Styles
```tsx
// Primary action
className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"

// Secondary action
className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"

// Icon button (circular)
className="w-10 h-10 flex items-center justify-center hover:bg-slate-100 rounded-full transition-colors"

// Text link
className="text-sm text-blue-600 hover:text-blue-700 hover:underline transition-colors"
```

### Badges/Pills
```tsx
// Status badge
className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-full"

// Tag
className="px-2.5 py-0.5 bg-red-100 text-red-600 rounded-full text-xs font-semibold"
```

---

## Color Palette

### Primary Colors
- **Blue**: `bg-blue-600` / `text-blue-600` - Actions, links
- **Black**: `text-black` - Primary text
- **Slate**: `text-slate-900` / `text-slate-600` - Headers, secondary

### Semantic Colors
- **Success**: Green (`bg-green-50`, `text-green-600`)
- **Warning**: Yellow (`bg-yellow-50`, `text-yellow-600`)
- **Error**: Red (`bg-red-50`, `text-red-600`)
- **Info**: Blue (`bg-blue-50`, `text-blue-600`)

### Opacity Levels
- **60%**: Labels, muted text (`text-black/60`)
- **50%**: Subtle text (`text-black/50`)
- **5%**: Borders (`border-black/5`)

---

## Spacing Scale

```tsx
gap-1   // 4px  - Tight
gap-2   // 8px  - Close
gap-3   // 12px - Compact
gap-4   // 16px - Standard
gap-6   // 24px - Comfortable
gap-8   // 32px - Generous
gap-12  // 48px - Spacious

px-3 py-2   // Compact padding
px-4 py-2   // Standard button
px-6 py-4   // Header padding
px-8 py-5   // Premium row padding
```

---

## What Makes It Special

### 1. Generous Whitespace
**Not cramped.** Every element has room to breathe. Premium feel.

### 2. Subtle Hierarchy
**Opacity over color.** `text-black/60` for labels. Clean, not busy.

### 3. Soft Corners
**`rounded-3xl` everywhere.** Modern, friendly, not corporate.

### 4. Refined Details
**`border-black/5`** - Barely there. Sophisticated.

### 5. Consistent Width
**`max-w-3xl` everywhere.** Content-focused. Readable.

### 6. Apple-level Polish
**Transitions, hover states, shadows.** Everything feels smooth.

---

## Examples in Codebase

### Specifications Page
- `/pages/vehicles/[id]/specifications.tsx`
- Row-based layout
- Premium cards
- Sticky header

### Vehicle Details
- `/pages/vehicles/[id]/index.tsx`
- Navigation cards
- Hero image
- Stats overview

---

## DON'T

❌ **Don't use harsh borders** - Use `border-black/5`
❌ **Don't use tight spacing** - Be generous with padding
❌ **Don't use small radius** - Use `rounded-3xl`
❌ **Don't use color variety** - Use opacity for hierarchy
❌ **Don't go wider than 3xl** - Keep content readable
❌ **Don't use pure white backgrounds** - Use `bg-slate-50` for pages

---

## DO

✅ **Use generous spacing** - `px-8 py-5`
✅ **Use soft corners** - `rounded-3xl`
✅ **Use subtle borders** - `border-black/5`
✅ **Use opacity hierarchy** - `text-black/60`
✅ **Use max-w-3xl** - Perfect width
✅ **Use sticky headers** - Better navigation
✅ **Use transitions** - Smooth interactions
✅ **Use row-based layouts** - Clean data display

---

## This is the MotoMind aesthetic.

**Sophisticated. Spacious. Clean. Premium.**

Not utility-first basics. Not corporate Bootstrap. Not Material Design.

**Apple-inspired perfection.**
