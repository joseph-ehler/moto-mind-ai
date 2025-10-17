# Heroes Guide

## ⚠️ CRITICAL: Layout System Rules

**ALL heroes MUST follow the mandatory layout system:**

- ✅ Use `Container size="md"` by default
- ✅ Only use `size="lg"` with proper override
- ✅ Use Section, Stack, Grid, Flex - NO raw divs
- ✅ Use Heading and Text components - NO raw HTML

---

## Hero Types

### 1. MarketingHero
**For:** Landing pages, marketing site

**Container:** 
- Centered: `md` 
- Split: `lg` with override

```tsx
// Centered (default)
<MarketingHero
  badge="New Feature"
  headline="Build faster"
  subheadline="A comprehensive design system"
  primaryCTA={{ label: "Start", onClick: handleStart }}
  secondaryCTA={{ label: "Learn", onClick: handleLearn }}
  visual={<YourVisual />}
  layout="centered"
/>

// Split layout (wider)
<MarketingHero
  headline="Track your fleet"
  subheadline="Complete vehicle management"
  primaryCTA={{ label: "Start", onClick: handleStart }}
  visual={<YourVisual />}
  layout="split"
/>
```

**Layout:**
- Centered: Container md, text-center
- Split: Container lg with override, 2-column grid

---

### 2. PageHero
**For:** Internal app pages

**Container:** `md` (always)

```tsx
<PageHero
  breadcrumbs={[
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Current Page' }
  ]}
  icon={<Icon className="w-6 h-6" />}
  title="Page Title"
  description="Page description"
  actions={
    <>
      <button>Action 1</button>
      <button>Action 2</button>
    </>
  }
  tabs={<YourTabs />}
/>
```

**Structure:**
- Breadcrumbs (optional)
- Icon + Title + Description
- Actions (right-aligned buttons)
- Tabs (optional)

---

### 3. DashboardHero
**For:** Dashboard pages with metrics

**Container:** `md` (always)

```tsx
<DashboardHero
  title="Dashboard"
  description="Overview of your fleet"
  metrics={[
    { label: 'Vehicles', value: '24', change: '+2', trend: 'up' },
    { label: 'Active', value: '22', change: '0', trend: 'neutral' },
    { label: 'Due', value: '3', change: '-1', trend: 'down' }
  ]}
  actions={
    <button>Add Vehicle</button>
  }
/>
```

**Features:**
- Title + description
- Quick metrics (up to 4)
- Trend indicators
- Action buttons

---

### 4. FeatureHero
**For:** Feature announcements

**Container:** `md` (always)

```tsx
<FeatureHero
  badge="Beta"
  feature="OCR Scanning"
  headline="Scan documents instantly"
  description="Use your camera to capture data"
  cta={{ label: "Try it", onClick: handleTry }}
  visual={<Screenshot />}
/>
```

**Structure:**
- Badge (NEW, BETA, etc.)
- Feature name
- Headline + description
- Single CTA
- Visual/screenshot

---

### 5. EmptyStateHero
**For:** Empty states

**Container:** `md` (always)

```tsx
<EmptyStateHero
  icon={<Inbox className="w-12 h-12" />}
  title="No vehicles yet"
  description="Start by adding your first vehicle"
  action={{ label: "Add Vehicle", onClick: handleAdd }}
  secondaryAction={{ label: "Import", onClick: handleImport }}
/>
```

**Structure:**
- Icon
- Title + description
- Primary action
- Secondary action (optional)

---

## Container Width Rules

### Default: `md` (672px)

**Use for:**
- Page content
- Articles
- Forms
- Internal pages

```tsx
<Container size="md" useCase="articles">
  {/* Content */}
</Container>
```

### Override: `lg` (1024px)

**ONLY with proper justification:**

```tsx
<Container 
  size="lg" 
  useCase="marketing_hero"
  override={{
    reason: "Split layout needs space for visual",
    approvedBy: "Design System"
  }}
>
  {/* Content */}
</Container>
```

**Valid reasons:**
- Marketing hero split layout
- Data tables
- Wide comparison charts
- Image galleries

**Invalid reasons:**
- "Looks better"
- "More space"
- "Personal preference"

---

## Layout System Compliance

### ✅ Correct Usage

```tsx
// Use layout components
<Section spacing="xl">
  <Container size="md" useCase="articles">
    <Stack spacing="lg">
      <Heading level="hero">Title</Heading>
      <Text size="xl">Description</Text>
      
      <Grid columns={2} gap="md">
        <BaseCard>Card 1</BaseCard>
        <BaseCard>Card 2</BaseCard>
      </Grid>
    </Stack>
  </Container>
</Section>
```

### ❌ Incorrect Usage

```tsx
// DON'T use raw HTML
<div className="py-16">
  <div className="max-w-7xl mx-auto">
    <div className="space-y-8">
      <h1>Title</h1>
      <p>Description</p>
      
      <div className="grid grid-cols-2 gap-4">
        <div>Card 1</div>
        <div>Card 2</div>
      </div>
    </div>
  </div>
</div>
```

---

## Common Patterns

### Marketing Landing Page

```tsx
export default function LandingPage() {
  return (
    <>
      {/* Hero - centered */}
      <MarketingHero
        headline="Welcome to MotoMind"
        subheadline="Track your fleet effortlessly"
        primaryCTA={{ label: "Get Started", onClick: handleStart }}
        layout="centered"
      />

      {/* Features */}
      <Container size="md" useCase="articles">
        <Section spacing="xl">
          <Stack spacing="lg">
            <Heading level="title">Features</Heading>
            <Grid columns={3} gap="md">
              <BaseCard>Feature 1</BaseCard>
              <BaseCard>Feature 2</BaseCard>
              <BaseCard>Feature 3</BaseCard>
            </Grid>
          </Stack>
        </Section>
      </Container>
    </>
  )
}
```

### Internal App Page

```tsx
export default function VehiclePage() {
  return (
    <>
      {/* Page hero */}
      <PageHero
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Vehicles' }
        ]}
        icon={<Car />}
        title="Vehicles"
        description="Manage your fleet"
        actions={<button>Add Vehicle</button>}
      />

      {/* Content */}
      <Container size="md" useCase="articles">
        <Section spacing="lg">
          <Stack spacing="md">
            {/* Vehicle list */}
          </Stack>
        </Section>
      </Container>
    </>
  )
}
```

### Dashboard Page

```tsx
export default function DashboardPage() {
  return (
    <>
      {/* Dashboard hero with metrics */}
      <DashboardHero
        title="Dashboard"
        description="Fleet overview"
        metrics={[
          { label: 'Vehicles', value: '24', trend: 'up' },
          { label: 'Due', value: '3', trend: 'down' }
        ]}
        actions={<button>Add Vehicle</button>}
      />

      {/* Dashboard content */}
      <Container size="md" useCase="articles">
        <Section spacing="lg">
          <Grid columns={2} gap="md">
            <BaseCard>Chart 1</BaseCard>
            <BaseCard>Chart 2</BaseCard>
          </Grid>
        </Section>
      </Container>
    </>
  )
}
```

---

## Accessibility

**All heroes include:**
- ✅ Semantic HTML (proper heading levels)
- ✅ Focus rings on buttons
- ✅ Proper contrast ratios
- ✅ Responsive typography
- ✅ Touch-friendly CTAs (48px minimum)

---

## Responsive Behavior

**All heroes are mobile-first:**
- Typography scales (text-4xl → text-5xl → text-6xl)
- Grids stack on mobile (Grid columns="2" → 1 column on mobile)
- CTAs remain touch-friendly (48px height)
- Spacing adjusts (Stack spacing="xl" → smaller on mobile)

---

## Summary

**5 hero types:**
1. MarketingHero - Landing pages
2. PageHero - Internal pages
3. DashboardHero - Dashboards with metrics
4. FeatureHero - Feature launches
5. EmptyStateHero - Empty states

**Container rules:**
- Default: `md` (672px)
- Override: `lg` only with justification
- Always specify useCase

**Layout system:**
- Section for spacing
- Stack for vertical
- Grid/Flex for layouts
- Heading/Text for typography
- NO raw divs or HTML tags

**All heroes respect the mandatory layout system!**
