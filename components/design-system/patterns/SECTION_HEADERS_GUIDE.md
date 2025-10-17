# Section Headers Guide

## Overview

Section headers introduce and provide context for sections of content within pages. All variants follow the mandatory layout system (Stack, Flex, no raw divs).

---

## 7 Section Header Types

### 1. SectionHeader (Basic)
**Use for:** Standard section introductions

```tsx
<SectionHeader
  title="Recent Activity"
  description="View your latest events"
  size="default" // or "large"
  align="left" // or "center"
/>
```

**Variants:**
- Left aligned (default)
- Center aligned
- Default size
- Large size

---

### 2. SectionHeaderWithActions
**Use for:** Sections with action buttons

```tsx
<SectionHeaderWithActions
  title="Maintenance Schedule"
  description="Upcoming appointments"
  actions={
    <>
      <button>Filter</button>
      <button>Add Event</button>
    </>
  }
/>
```

**Layout:**
- Title + description on left
- Actions on right (flex-shrink-0)
- Responsive stacking on mobile

---

### 3. SectionHeaderWithTabs
**Use for:** Sections with tabbed navigation

```tsx
<SectionHeaderWithTabs
  title="Vehicle History"
  description="Track all events"
  tabs={[
    { label: 'All', active: true, onClick: () => {} },
    { label: 'Maintenance', active: false, onClick: () => {} },
    { label: 'Fuel', active: false, onClick: () => {} }
  ]}
/>
```

**Features:**
- Tab bar with border
- Active tab highlighted
- Horizontal scroll on mobile

---

### 4. SectionHeaderWithBadge
**Use for:** Sections with status or count

```tsx
<SectionHeaderWithBadge
  title="Active Alerts"
  description="Items requiring attention"
  badge="3 New"
  badgeColor="red" // blue, green, yellow, red, purple
/>
```

**Badge Colors:**
- Blue (default/info)
- Green (success)
- Yellow (warning)
- Red (error/urgent)
- Purple (feature)

---

### 5. SectionHeaderWithIcon
**Use for:** Sections with visual identity

```tsx
<SectionHeaderWithIcon
  title="Quick Start"
  description="Get started in minutes"
  icon={<Rocket className="w-5 h-5" />}
  iconColor="blue" // blue, green, yellow, red, purple
/>
```

**Icon Colors:**
- Match badge colors
- Icon in colored circle
- 40px icon container

---

### 6. DividerSectionHeader
**Use for:** Visual section breaks

```tsx
<DividerSectionHeader
  title="Section Break"
  showLine={true} // or false
/>
```

**Appearance:**
- Horizontal lines on both sides
- Title centered with gray text
- Optional: just title, no lines

---

### 7. CompactSectionHeader
**Use for:** Tight spaces (sidebars, cards)

```tsx
<CompactSectionHeader
  title="Quick Actions"
  action={{ label: "View all", onClick: () => {} }}
/>
```

**Features:**
- Smaller text (text-lg)
- Optional action link
- Minimal spacing

---

## When to Use Which

| Section Type | Use Case |
|--------------|----------|
| Basic | General sections |
| With Actions | Add/filter/settings needed |
| With Tabs | Multiple views of same data |
| With Badge | Status/count/new items |
| With Icon | Visual categorization |
| Divider | Major content breaks |
| Compact | Sidebars, tight spaces |

---

## Layout System Compliance

### ✅ All Headers Use

**Layout Components:**
```tsx
<Stack spacing="sm">  // For vertical spacing
<Flex className="items-center">  // For horizontal layouts
```

**Typography:**
```tsx
<Heading level="subtitle">Title</Heading>
<Text className="text-gray-600">Description</Text>
```

**NO raw HTML:**
- ❌ `<div className="space-y-2">`
- ❌ `<h2>Title</h2>`
- ❌ `<p>Description</p>`

---

## Common Patterns

### Page Section
```tsx
<Container size="md" useCase="articles">
  <Section spacing="lg">
    <Stack spacing="lg">
      <SectionHeader
        title="Your Vehicles"
        description="Manage your fleet"
      />
      
      <Grid columns={3} gap="md">
        {/* Vehicle cards */}
      </Grid>
    </Stack>
  </Section>
</Container>
```

### Section with Actions
```tsx
<Container size="md" useCase="articles">
  <Section spacing="lg">
    <Stack spacing="lg">
      <SectionHeaderWithActions
        title="Recent Activity"
        description="Last 30 days"
        actions={
          <button>View All</button>
        }
      />
      
      <Stack spacing="md">
        {/* Activity items */}
      </Stack>
    </Stack>
  </Section>
</Container>
```

### Tabbed Content
```tsx
<Container size="md" useCase="articles">
  <Section spacing="lg">
    <Stack spacing="lg">
      <SectionHeaderWithTabs
        title="Vehicle History"
        tabs={tabs}
      />
      
      {activeTab === 'all' && <AllEvents />}
      {activeTab === 'maintenance' && <Maintenance />}
    </Stack>
  </Section>
</Container>
```

### Card Section
```tsx
<BaseCard padding="lg">
  <Stack spacing="lg">
    <CompactSectionHeader
      title="Quick Actions"
      action={{ label: "More", onClick: handleMore }}
    />
    
    <Stack spacing="sm">
      {/* Action items */}
    </Stack>
  </Stack>
</BaseCard>
```

---

## Spacing Guidelines

**Between header and content:**
```tsx
<Stack spacing="lg">
  <SectionHeader title="Title" />
  <Content />
</Stack>
```

**Between sections:**
```tsx
<Stack spacing="xl">
  <Section spacing="lg">
    <SectionHeader title="Section 1" />
  </Section>
  
  <Section spacing="lg">
    <SectionHeader title="Section 2" />
  </Section>
</Stack>
```

---

## Accessibility

**All headers include:**
- ✅ Semantic heading elements (h2, h3)
- ✅ Proper heading hierarchy
- ✅ Focus rings on interactive elements
- ✅ Sufficient color contrast
- ✅ Touch-friendly tap targets (buttons)

---

## Responsive Behavior

**Typography scales:**
- Desktop: text-xl → text-2xl
- Mobile: text-lg → text-xl

**Layouts adapt:**
- SectionHeaderWithActions: Stack on mobile
- Tabs: Horizontal scroll on mobile
- Icon size: Consistent across breakpoints

---

## Best Practices

### ✅ Do

1. **Use appropriate variant**
   ```tsx
   // Actions needed → WithActions
   <SectionHeaderWithActions title="..." actions={...} />
   ```

2. **Respect hierarchy**
   ```tsx
   // Page uses h1, sections use h2
   <Heading level="hero">Page Title</Heading>
   <SectionHeader title="Section" /> // Uses h2
   ```

3. **Keep descriptions concise**
   ```tsx
   description="Brief context (1-2 lines max)"
   ```

4. **Use Stack for spacing**
   ```tsx
   <Stack spacing="lg">
     <SectionHeader />
     <Content />
   </Stack>
   ```

### ❌ Don't

1. **Don't use raw divs**
   ```tsx
   // ❌ Wrong
   <div className="space-y-4">
   
   // ✅ Right
   <Stack spacing="md">
   ```

2. **Don't nest headers**
   ```tsx
   // ❌ Wrong - too much nesting
   <SectionHeader>
     <SectionHeader />
   </SectionHeader>
   ```

3. **Don't mix variants unnecessarily**
   ```tsx
   // ❌ Inconsistent
   <SectionHeader />
   <SectionHeaderWithIcon />
   <SectionHeader />
   
   // ✅ Consistent
   <SectionHeader />
   <SectionHeader />
   <SectionHeader />
   ```

---

## Summary

**7 section headers for all use cases:**
1. SectionHeader - Basic
2. SectionHeaderWithActions - With buttons
3. SectionHeaderWithTabs - With navigation
4. SectionHeaderWithBadge - With status
5. SectionHeaderWithIcon - With visual
6. DividerSectionHeader - Content breaks
7. CompactSectionHeader - Tight spaces

**All follow layout system:**
- Stack for vertical
- Flex for horizontal
- Heading/Text components
- NO raw HTML

**Accessibility built-in:**
- Semantic headings
- Focus rings
- Proper contrast
- Touch-friendly

**Use them to introduce sections within Container md pages!**
