# Chapter-Based Progress System

## Overview

A clean, adaptive progress indicator that uses bars instead of dots or percentages. Perfect for multi-section wizards where you want to show high-level progress without cluttering the UI.

## Design Philosophy

**"Usable without being distracting"**

- ✅ Shows chapter-level progress, not individual steps
- ✅ Adapts to 1-10+ chapters automatically
- ✅ Minimal visual weight
- ✅ Clean, unobtrusive
- ✅ Optional chapter names (default: hidden)

---

## Visual Examples

### 3 Chapters
```
┌─────────────────────────────────────────────────┐
│  ← Back  │     Step Title      │     ⋮          │
│           │  ▓▓▓▓  ▓▓░░  ░░░░   │                │
└─────────────────────────────────────────────────┘
            Done  Active Future
```

### 5 Chapters
```
┌─────────────────────────────────────────────────┐
│  ← Back  │     Step Title      │     ⋮          │
│           │ ▓▓ ▓▓ ▓░ ░░ ░░      │                │
└─────────────────────────────────────────────────┘
```

### With Chapter Name (Optional)
```
┌─────────────────────────────────────────────────┐
│  ← Back  │  Vehicle Information  │     ⋮        │
│           │  ▓▓▓▓  ▓▓░░  ░░░░     │              │
└─────────────────────────────────────────────────┘
```

---

## Usage

### Basic Example

```typescript
import { OnboardingShell } from '@/components/onboarding/OnboardingShell'
import { type Chapter } from '@/components/onboarding/ChapterProgress'

const chapters: Chapter[] = [
  {
    id: 'vehicle',
    name: 'Vehicle Information',
    stepCount: 3,        // VIN, confirm, details
    currentStep: 2       // Currently on step 2 of 3
  },
  {
    id: 'personal',
    name: 'Personal Info',
    stepCount: 2,
    currentStep: undefined // Not started yet
  },
  {
    id: 'preferences',
    name: 'Preferences',
    stepCount: 2,
    currentStep: undefined
  }
]

<OnboardingShell
  title="Confirm your vehicle"
  chapters={chapters}
  currentChapterId="vehicle"
  showChapterName={false}  // Default: don't show
  {...otherProps}
>
  {/* Step content */}
</OnboardingShell>
```

---

## Chapter Structure

```typescript
type Chapter = {
  id: string          // Unique identifier
  name: string        // Display name (used if showChapterName=true)
  stepCount: number   // Total steps in this chapter
  currentStep?: number // 1-indexed, undefined if not started
}
```

### Progress Calculation

- **Completed chapter:** `currentStep` is `undefined` and chapter comes before active chapter
- **Active chapter:** `currentStep` is a number (1 to stepCount)
- **Future chapter:** `currentStep` is `undefined` and chapter comes after active chapter

**Bar fill percentage:**
- Completed: 100%
- Active: `(currentStep / stepCount) * 100`
- Future: 0%

---

## Visual Behavior

### Bar Sizing (Adaptive)
- **1 chapter:** 128px wide (w-32)
- **2 chapters:** 96px wide (w-24)
- **3 chapters:** 80px wide (w-20)
- **4 chapters:** 64px wide (w-16)
- **5+ chapters:** 48px wide (w-12)

### Colors
- **Completed:** Blue background (#dbeafe), blue fill (#2563eb)
- **Active:** Blue background (#dbeafe), blue fill (#2563eb), blue ring
- **Future:** Gray background (#e5e7eb), no fill

### Animations
- Smooth transitions (300ms) on progress changes
- Bar fills left-to-right
- Ring appears on active chapter

---

## Real-World Example

### Vehicle Onboarding (4 chapters)

```typescript
const chapters: Chapter[] = [
  {
    id: 'vehicle-basics',
    name: 'Vehicle Information',
    stepCount: 3,
    currentStep: 3  // ✓ Completed (VIN, decode, confirm)
  },
  {
    id: 'ownership',
    name: 'Ownership Details',
    stepCount: 4,
    currentStep: 2  // ← Currently here (2 of 4 done)
  },
  {
    id: 'maintenance',
    name: 'Maintenance History',
    stepCount: 2,
    currentStep: undefined  // Not started
  },
  {
    id: 'preferences',
    name: 'Preferences',
    stepCount: 3,
    currentStep: undefined  // Not started
  }
]

// Visual result:
// ▓▓▓▓  ▓▓░░  ░░░░  ░░░░
// Done  Active Future Future
```

---

## Utility Functions

### `getChapterForStep`

Calculates which chapter a step belongs to:

```typescript
import { getChapterForStep } from '@/components/onboarding/ChapterProgress'

const chapterStepCounts = [3, 4, 2, 3] // 12 total steps

// Step 5 (0-indexed = 4) is in chapter 2, step 2
const { chapterIndex, stepInChapter } = getChapterForStep(4, chapterStepCounts)
// Returns: { chapterIndex: 1, stepInChapter: 2 }
```

---

## Design Decisions

### Why chapters instead of individual steps?

1. **Less clutter:** 3-5 bars vs. 10-15 dots
2. **Clearer context:** Users care about "sections," not individual steps
3. **Scales better:** Works with 1-10+ chapters
4. **More flexible:** Can group steps logically

### Why not show chapter name by default?

- Adds visual weight
- May compete with step title
- Not always necessary (bars are self-explanatory)
- Can be enabled per-use-case

### Why bar fill instead of solid colors?

- Shows sub-progress within active chapter
- More informative than binary "done/not done"
- Smooth, intuitive animation

---

## Accessibility

- Each bar has `role="progressbar"`
- `aria-label` describes chapter and percentage
- `aria-valuenow`, `aria-valuemin`, `aria-valuemax` set correctly
- Keyboard navigation supported via parent shell

---

## Mobile Considerations

- Bars scale proportionally (12-32px width)
- Touch-friendly spacing (8px gap)
- No hover states needed
- Works in portrait and landscape

---

## Migration from Dots

### Before (ProgressDots)
```typescript
<OnboardingShell
  currentStep={5}
  totalSteps={12}
  progress={42}
  {...props}
/>
```

### After (ChapterProgress)
```typescript
<OnboardingShell
  chapters={chapters}
  currentChapterId="ownership"
  {...props}
/>
```

### Fallback Support

The shell still supports legacy props for backward compatibility:

```typescript
// Still works!
<OnboardingShell
  currentStep={5}
  totalSteps={12}
  {...props}
/>
```

---

## Summary

**ChapterProgress provides:**
- Clean, adaptive progress bars
- Automatic sizing for 1-10+ chapters
- Sub-progress within active chapter
- Optional chapter names
- Smooth animations
- Fully accessible
- Mobile-optimized

**Perfect for:**
- Multi-section onboarding
- Complex wizards
- Any flow with logical "chapters"

**Not ideal for:**
- Simple 2-3 step wizards (use legacy dots)
- When you need exact step counts visible
