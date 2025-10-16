# Timeline Card Design System

## Final Card Layout

### Structure
```
┌────────────────────────────────────────────────┐
│  [☑] 🟣  Dashboard Check          8:21 PM  ⋮  │
│          306 mi · No warnings                  │
│          📷 Photo attached                     │
└────────────────────────────────────────────────┘
```

### Layout Breakdown

```
<Card padding="16px" border="1px gray-200" rounded="8px">
  <Row align="start" gap="12px">
    
    <!-- Left: Checkbox + Icon -->
    <LeftSection>
      [Checkbox] (20px, only in selection mode)
      [Icon Circle] (44px diameter)
    </LeftSection>
    
    <!-- Middle: Content (flex-1) -->
    <ContentSection>
      <TitleRow>
        <Title>Dashboard Check</Title> (15px, semibold)
        <Time>8:21 PM</Time> (11px, uppercase)
      </TitleRow>
      
      <MetadataRow>
        306 mi · No warnings · Fuel 75% (13px, gray-600)
      </MetadataRow>
      
      <PhotoBadge> (if photo exists)
        📷 Photo attached (11px, blue badge)
      </PhotoBadge>
    </ContentSection>
    
    <!-- Right: Actions -->
    <ActionsSection>
      <OverflowMenu> (shows on hover)
        ⋮ (3-dot menu)
      </OverflowMenu>
      <Chevron>
        → (20px, gray-400)
      </Chevron>
    </ActionsSection>
    
  </Row>
</Card>
```

## Spacing Standards

| Element | Value |
|---------|-------|
| Card padding | 16px (p-4) |
| Card margin bottom | 12px (mb-3) |
| Between checkbox/icon/content | 12px (gap-3) |
| Between title rows | 4px (mb-1) |
| Between metadata and photo | 8px (mt-2) |
| Between date sections | 32px (space-y-8) |

## Typography Standards

| Element | Size | Weight | Color |
|---------|------|--------|-------|
| Title | 15px | Semibold | gray-900 |
| Time | 11px | Medium | gray-500 |
| Metadata | 13px | Regular | gray-600 |
| Photo badge | 11px | Medium | blue-700 |
| Date header | 14px | Bold | gray-900 |

## Icon Standards

| Type | Container | Icon Size | Background | Icon Color |
|------|-----------|-----------|------------|------------|
| Fuel | 44px circle | 24px | green-50 | green-600 |
| Dashboard | 44px circle | 24px | purple-50 | purple-600 |
| Odometer | 44px circle | 24px | blue-50 | blue-600 |
| Service | 44px circle | 24px | orange-50 | orange-600 |
| Damage | 44px circle | 24px | red-50 | red-600 |

## Interaction States

### Hover
```css
border-color: gray-300 (from gray-200)
box-shadow: md
overflow-menu: opacity 100% (from 0%)
```

### Selected
```css
border-color: blue-500
background: blue-50
```

## Photo Handling

When an event has a photo:
- Show small badge below metadata
- Badge style: `bg-blue-50 rounded px-2 py-1`
- Icon: Camera (12px)
- Text: "Photo attached" (11px, blue-700)

## Overflow Menu

- Hidden by default (opacity: 0)
- Shows on card hover (opacity: 100%)
- Position: top-right of actions section
- Includes: Edit, Copy ID, Delete

## Responsive Behavior

- Title truncates with ellipsis if too long
- Metadata wraps to second line if needed
- Time always stays on same line as title
- Chevron/menu always stay visible (don't push off screen)

## Accessibility

- Full card is clickable
- Checkbox doesn't trigger card click
- Overflow menu doesn't trigger card click
- All actions have proper keyboard support
- ARIA labels on icon-only buttons

## Key Improvements

✅ **Clear hierarchy** - Title, time, metadata all have distinct sizes
✅ **No overflow** - Time and actions properly positioned
✅ **Photo support** - Clean badge when image present
✅ **Scannable** - Important info (title, time) at top
✅ **Functional** - Overflow menu hidden until needed
✅ **Consistent** - All cards follow same layout

## Example Variants

### Fuel Entry with Photo
```
🟢  Fuel Fill-Up                   8:00 PM  ⋮ →
    306 mi · 13.2 gal · $42.50 · Shell
    📷 Photo attached
```

### Dashboard Check (No Photo)
```
🟣  Dashboard Check                8:21 PM  ⋮ →
    306 mi · No warnings · Fuel 75% · 72°F
```

### Service Record
```
🟠  Oil Change                     2:45 PM  ⋮ →
    77,000 mi · $89.99 · Jiffy Lube · 3 items
    📷 Photo attached
```

### Damage Report
```
🔴  Damage Report                  1:30 PM  ⋮ →
    Moderate damage · Front bumper · Est. $850
    📷 Photo attached
```

---

**This design handles all content types cleanly without overwhelming the user!**
