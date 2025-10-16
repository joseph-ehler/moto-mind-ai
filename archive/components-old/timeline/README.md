# Timeline Component Architecture

## 📋 Overview

The Timeline component has been refactored into a modular, maintainable architecture following clean code principles.

## 🏗️ Architecture Diagram

```
timeline/
├── Timeline.tsx                      ← Main orchestrator (< 300 lines)
├── TimelineHeader.tsx                ← Search & filter UI
├── TimelineStats.tsx                 ← Quick stats badges
├── TimelineMonth.tsx                 ← Month section (TODO)
├── TimelineItemCompact.tsx           ← Event card (needs refactoring)
├── TimelineInsights.tsx              ← Smart insights
├── MaintenancePredictor.tsx          ← Maintenance predictions
├── Sparkline.tsx                     ← Chart component
├── TimelineLoadingSkeleton.tsx       ← Loading states
├── hooks/
│   ├── useTimelineFilters.ts         ← Filter & search logic
│   ├── useTimelineState.ts           ← UI state management
│   └── useTimelineData.ts            ← Data transformations
└── README.md                         ← This file
```

## 🎯 Component Responsibilities

### Timeline.tsx (Main Orchestrator)
**Responsibility:** Compose sub-components and manage data flow
- Use custom hooks for logic
- Pass props to child components
- Handle event callbacks
- Keep render logic minimal

### TimelineHeader.tsx
**Responsibility:** Search and filter UI
- Mobile responsive (expanding search)
- Desktop persistent search
- Filter dropdown
- Capture button

### TimelineInsights.tsx
**Responsibility:** Analyze data and show smart recommendations
- Warning detection
- Spending trends
- Maintenance reminders
- Document suggestions

### MaintenancePredictor.tsx
**Responsibility:** Predict upcoming maintenance
- Pattern recognition
- Mileage-based predictions
- Time-based scheduling
- Priority calculation

### TimelineItemCompact.tsx
**Status:** ⚠️ Needs refactoring (1,195 lines)
**Next steps:** Extract event-type-specific logic

## 🪝 Custom Hooks

### useTimelineFilters
**Purpose:** Manage filtering and search
**Returns:**
- `searchQuery` - Current search text
- `setSearchQuery` - Update search
- `activeFilter` - Current filter
- `setActiveFilter` - Change filter
- `filteredItems` - Filtered results

### useTimelineState
**Purpose:** Manage UI state
**Returns:**
- Selection state (selectedIds, selectionMode)
- Expansion state (expandedMonths)
- Modal state (editingEvent, deletingEvent)
- Helper functions (toggleSelection, selectAll, etc.)

### useTimelineData
**Purpose:** Transform and group data
**Returns:**
- `monthGroups` - Items grouped by month
- `monthStats` - Calculated statistics
- `currentMileage` - Latest mileage
- `groupItemsByDate` - Date grouping function

## 📏 Code Quality Guidelines

### File Size Limits
- ✅ **< 200 lines** - Ideal
- ⚠️ **200-400 lines** - Acceptable
- ❌ **> 400 lines** - Needs refactoring

### Component Complexity
- **Single Responsibility** - One clear purpose per component
- **Pure Functions** - Predictable, testable logic
- **Composition** - Build complex UIs from simple pieces
- **Hooks for Logic** - Extract reusable logic

### Testing Strategy
- **Hooks:** Unit test with `@testing-library/react-hooks`
- **Components:** Integration test with `@testing-library/react`
- **Logic:** Isolated pure function tests

## 🚀 Next Refactoring Steps

### Priority 1: TimelineItemCompact (1,195 lines)
```
TimelineItemCompact.tsx
├── TimelineCard.tsx              ← Card wrapper & layout
├── EventHeader.tsx               ← Title, time, menu
├── EventDetails.tsx              ← Data rows
└── event-types/
    ├── FuelEvent.tsx             ← Fuel-specific rendering
    ├── ServiceEvent.tsx          ← Service-specific rendering
    ├── WarningEvent.tsx          ← Warning-specific rendering
    └── ...
```

### Priority 2: Extract Month Rendering
Create `TimelineMonth.tsx` to handle:
- Month header
- Expandable stats
- Date grouping
- Event list rendering

### Priority 3: Event Type System
Create a type registry pattern:
```typescript
interface EventTypeConfig {
  icon: ReactNode
  color: string
  render: (item: TimelineItem) => ReactNode
}

const EVENT_TYPES: Record<string, EventTypeConfig> = {
  fuel: { ... },
  service: { ... },
  ...
}
```

## 📊 Current Metrics

| File | Lines | Status |
|------|-------|--------|
| Timeline.tsx | ~400 | ✅ Good (after refactor) |
| TimelineHeader.tsx | ~220 | ✅ Good |
| TimelineItemCompact.tsx | 1,195 | ❌ Needs refactoring |
| TimelineInsights.tsx | ~260 | ✅ Good |
| MaintenancePredictor.tsx | ~240 | ✅ Good |

## 🎓 Lessons Learned

1. **Start modular** - Don't let components grow beyond 300 lines
2. **Extract early** - Move logic to hooks as soon as it's reusable
3. **Single responsibility** - Each file should have one clear job
4. **Test boundaries** - Hooks and functions are easier to test when isolated
5. **Documentation** - README helps future maintainers understand structure

## 🔗 Related Docs

- [Timeline Types](/types/timeline.ts)
- [Date Utilities](/lib/utils/date-grouping.ts)
- [Event Icons](/lib/utils/event-icons.ts)
