# 📄 Detail Page Template - Universal Design System

**Philosophy:** Every detail page (event, vehicle, service, trip) follows the same sophisticated pattern.

---

## 🎯 Template Structure

### **Universal Pattern:**
```
┌─────────────────────────────────────┐
│ 🌊 Animated Hero (Dark Glassmorphic)│
│    - Entity type-specific blobs     │
│    - Title, key metrics, actions    │
└─────────────────────────────────────┘
        ↓ (Scroll triggers sticky header)
┌─────────────────────────────────────┐
│ 🖤 Glassmorphic Sticky Header        │
│    - Back button, title, key action │
└─────────────────────────────────────┘
        ↓
┌─────────────────────────────────────┐
│ 🎴 Clean White Glass Cards           │
│    - Organized data sections        │
│    - Collapsible/expandable         │
│    - AI attribution visible         │
└─────────────────────────────────────┘
        ↓
┌─────────────────────────────────────┐
│ 📋 Change History (if applicable)    │
│    - Top 3 changes by default       │
│    - Expandable timeline            │
└─────────────────────────────────────┘
        ↓
┌─────────────────────────────────────┐
│ 🎮 Footer Gamification               │
│    - Entity-specific value props    │
└─────────────────────────────────────┘
```

---

## 🎨 Design System Components

### **1. Animated Hero (Required)**

**Structure:**
```tsx
<div className="hero-gradient-animated">
  {/* Fixed glass overlay */}
  <div className="hero-glass-overlay" />
  
  <Container>
    <Section>
      {/* Hero content */}
      <Heading level="hero">{entityName}</Heading>
      <KeyMetrics />
      <PrimaryActions />
    </Section>
  </Container>
</div>
```

**Customization per entity:**
```tsx
// Events: Fuel/service themed colors
colors: [blue, red, purple]

// Vehicles: Brand/model themed colors
colors: [brand primary, silver, black]

// Trips: Journey themed colors
colors: [blue, green, orange]

// Service: Maintenance themed colors
colors: [red, orange, yellow]
```

**Constants:**
- Blob sizes: 620-750px
- Travel: 320px horizontal
- Timing: 28s/22s ultra-slow
- Glass overlay: 24px blur, 1.4x saturate
- Performance: GPU-optimized, CSS containment

---

### **2. Glassmorphic Sticky Header (Required)**

**Structure:**
```tsx
<div className="sticky-header-glassmorphic">
  <Container>
    <Flex justify="between" align="center">
      <BackButton />
      <Title />
      <PrimaryAction />
    </Flex>
  </Container>
</div>
```

**CSS:**
```css
background: linear-gradient(180deg, 
  rgba(0, 0, 0, 0.70-0.90) 0%,
  rgba(0, 0, 0, 0.65-0.85) 50%,
  rgba(0, 0, 0, 0.68-0.88) 100%
);
backdrop-filter: blur(24-36px) saturate(1.4) brightness(1.1);
border-bottom: 1px solid rgba(255, 255, 255, 0.20);
box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
z-index: 50;
```

**Constants across all pages:**
- Same glassmorphic effect
- Same elevation (z-50)
- Same blur progression
- Same fade-in behavior (150-350px scroll)

---

### **3. Data Section Cards (Required)**

**Structure:**
```tsx
<Card className="bg-white/95 backdrop-blur-md border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all">
  {/* Collapsible header */}
  <CardHeader expandable>
    <Icon />
    <Title />
    <FieldCount />
    <ExpandIcon />
  </CardHeader>
  
  {/* Content (expandable) */}
  <CardContent>
    <Stack spacing="md">
      <InlineField />
      <InlineField />
      {/* ... */}
    </Stack>
  </CardContent>
</Card>
```

**CSS:**
```css
background: rgba(255, 255, 255, 0.95);
backdrop-filter: blur(12px);
border: 1px solid #E5E7EB;
hover: {
  border-color: #D1D5DB;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}
```

**Constants:**
- Always white/95 glass
- Always 12px blur
- Always subtle borders
- Always hover lift (shadow-md)

---

### **4. Change History Timeline (Optional)**

**When to include:**
- ✅ Events (edit history)
- ✅ Vehicles (modification history)
- ✅ Services (update history)
- ❌ Static data (no history)

**Structure:**
```tsx
<ChangeHistoryTimeline
  changes={entityChanges}
  createdAt={entityCreatedAt}
  initialVisible={3}
/>
```

**Constants:**
- Always show top 3 by default
- Always expandable
- Always same timeline design
- Always Edit2 icon for changes

---

### **5. Footer Gamification (Required)**

**Structure:**
```tsx
<Section className="bg-gradient-to-br from-gray-50 to-gray-100">
  <Heading level="h2">Your [Entity] Unlocks</Heading>
  <Grid columns="3" gap="lg">
    <ValuePropCard icon="💡" title="..." />
    <ValuePropCard icon="📊" title="..." />
    <ValuePropCard icon="🎯" title="..." />
  </Grid>
</Section>
```

**Customize per entity type**

---

## 🚗 Example: Vehicle Detail Page

### **Hero Section:**
```tsx
<div className="hero-gradient-animated">
  {/* Vehicle-themed colors: brand primary + silver + black */}
  <div className="hero-glass-overlay" />
  
  <Container>
    <Section>
      {/* Vehicle hero content */}
      <Heading level="hero">2020 Tesla Model 3</Heading>
      <Flex gap="md">
        <KeyMetric>45,231 mi</KeyMetric>
        <KeyMetric>$42,350 value</KeyMetric>
        <KeyMetric>92% health</KeyMetric>
      </Flex>
      <Flex gap="sm">
        <Button>Add Service</Button>
        <Button variant="secondary">Export Report</Button>
      </Flex>
    </Section>
  </Container>
</div>
```

### **Data Cards:**
```tsx
<Stack spacing="lg">
  {/* Vehicle Information */}
  <DataSection
    title="Vehicle Details"
    icon={<Car />}
    fields={[
      { label: "Make", value: "Tesla", editable: false },
      { label: "Model", value: "Model 3", editable: false },
      { label: "Year", value: "2020", editable: false },
      { label: "VIN", value: "5YJ3E1EA...", editable: false },
      { label: "License Plate", value: "ABC123", editable: true },
      { label: "Nickname", value: "Thunder", editable: true },
    ]}
  />

  {/* Ownership & Registration */}
  <DataSection
    title="Ownership & Registration"
    icon={<FileText />}
    fields={[
      { label: "Owner", value: "John Doe", editable: true },
      { label: "Purchase Date", value: "Jan 15, 2020", editable: true },
      { label: "Purchase Price", value: "$48,990", editable: true },
      { label: "Registration Exp", value: "Dec 31, 2025", editable: true },
    ]}
  />

  {/* Performance Metrics */}
  <DataSection
    title="Performance & Health"
    icon={<Activity />}
    fields={[
      { label: "Current Odometer", value: "45,231 mi", aiGenerated: true },
      { label: "Avg Fuel Economy", value: "28.5 MPG", aiGenerated: true },
      { label: "Health Score", value: "92%", aiGenerated: true },
      { label: "Battery Health", value: "94%", aiGenerated: true },
    ]}
  />

  {/* Service History Summary */}
  <DataSection
    title="Service Summary"
    icon={<Wrench />}
    fields={[
      { label: "Last Service", value: "Oct 1, 2025", editable: false },
      { label: "Next Service Due", value: "Jan 1, 2026", aiGenerated: true },
      { label: "Total Services", value: "12", editable: false },
      { label: "Total Spent", value: "$3,245", editable: false },
    ]}
  />

  {/* Change History */}
  <ChangeHistoryTimeline
    changes={vehicleChanges}
    createdAt={vehicleCreatedAt}
  />
</Stack>
```

### **Footer:**
```tsx
<Section>
  <Heading level="h2">Your Vehicle Unlocks</Heading>
  <Grid columns="3">
    <ValuePropCard
      icon="🔧"
      title="Service Tracking"
      description="Never miss maintenance with AI-powered reminders"
    />
    <ValuePropCard
      icon="💰"
      title="Value Monitoring"
      description="Track your vehicle's worth and equity over time"
    />
    <ValuePropCard
      icon="📊"
      title="Performance Analytics"
      description="Comprehensive insights into your vehicle's health"
    />
  </Grid>
</Section>
```

---

## 🎯 Example: Service Record Detail

### **Hero:**
```tsx
{/* Service-themed colors: red + orange + yellow (warning/maintenance) */}
<Heading level="hero">Oil Change - Oct 1, 2025</Heading>
<KeyMetric>45,200 mi</KeyMetric>
<KeyMetric>$89.99</KeyMetric>
<KeyMetric>Joe's Auto</KeyMetric>
```

### **Data Cards:**
```tsx
<DataSection title="Service Details" icon={<Wrench />} />
<DataSection title="Parts & Labor" icon={<DollarSign />} />
<DataSection title="Service Location" icon={<MapPin />} />
<DataSection title="Next Service Due" icon={<Calendar />} />
```

---

## 🗺️ Example: Trip Detail

### **Hero:**
```tsx
{/* Journey-themed colors: blue + green + orange (adventure) */}
<Heading level="hero">Summer Road Trip 2025</Heading>
<KeyMetric>1,245 mi</KeyMetric>
<KeyMetric>5 days</KeyMetric>
<KeyMetric>12 stops</KeyMetric>
```

### **Data Cards:**
```tsx
<DataSection title="Trip Overview" icon={<Map />} />
<DataSection title="Route & Stops" icon={<MapPin />} />
<DataSection title="Fuel & Costs" icon={<DollarSign />} />
<DataSection title="Photos & Memories" icon={<Camera />} />
```

---

## 📐 Universal Spacing System

### **Container Sizes:**
```tsx
// Detail pages always use "md" container
<Container size="md" useCase="articles">
```

### **Section Spacing:**
```tsx
<Section spacing="xl"> {/* Between major sections */}
<Stack spacing="lg">   {/* Between cards */}
<Stack spacing="md">   {/* Within card content */}
```

### **Card Spacing:**
```tsx
// Vertical stack of data cards
<Stack spacing="lg">
  <DataSection />
  <DataSection />
  <DataSection />
</Stack>
```

---

## 🎨 Color Theming Per Entity

### **Event Pages (Current):**
```css
--hero-colors: 
  blue (#2563EB),
  red (#DC2626),
  purple (#581C87)
```

### **Vehicle Pages:**
```css
--hero-colors:
  brand-primary (e.g., Tesla red #E82127),
  silver (#C0C0C0),
  black (#000000)
```

### **Service Pages:**
```css
--hero-colors:
  red (#DC2626),
  orange (#EA580C),
  yellow (#CA8A04)
```

### **Trip Pages:**
```css
--hero-colors:
  blue (#2563EB),
  green (#16A34A),
  orange (#EA580C)
```

**Implementation:**
```tsx
// Create theme variant prop
<DetailPageHero theme="event" />
<DetailPageHero theme="vehicle" />
<DetailPageHero theme="service" />
<DetailPageHero theme="trip" />
```

---

## 🔧 Reusable Components to Create

### **1. DetailPageHero**
```tsx
interface DetailPageHeroProps {
  theme: 'event' | 'vehicle' | 'service' | 'trip'
  title: string
  metrics: KeyMetric[]
  actions: Action[]
}
```

### **2. GlassmorphicStickyHeader**
```tsx
interface GlassmorphicStickyHeaderProps {
  title: string
  backUrl: string
  primaryAction?: React.ReactNode
}
```

### **3. DataSection (already exists!)**
```tsx
// Already perfect, just reuse!
<DataSectionV2
  title={string}
  fields={DataField[]}
  defaultExpanded={boolean}
/>
```

### **4. ChangeHistoryTimeline (already exists!)**
```tsx
// Already perfect, just reuse!
<ChangeHistoryTimeline
  changes={ChangeEntry[]}
  createdAt={string}
/>
```

### **5. ValuePropCard**
```tsx
interface ValuePropCardProps {
  icon: string | React.ReactNode
  title: string
  description: string
}
```

---

## 📋 Implementation Checklist

### **For Each New Detail Page:**

- [ ] Copy hero structure with animated blobs
- [ ] Customize blob colors for entity theme
- [ ] Add glassmorphic sticky header
- [ ] Use DataSectionV2 for all data cards
- [ ] Include ChangeHistoryTimeline if applicable
- [ ] Add entity-specific footer value props
- [ ] Ensure all AI fields have sparkles (✨)
- [ ] Test popover elevation (z-[100])
- [ ] Verify glassmorphic effects
- [ ] Confirm 60fps performance

---

## 🎯 Design Principles

### **Universal Rules:**

**1. Dark Glassmorphic Hero**
- Always black background
- Always animated blobs
- Always glass overlay
- Always ultra-slow motion

**2. Clean White Glass Cards**
- Always 95% white background
- Always 12px backdrop blur
- Always subtle borders
- Always hover lift effect

**3. Proper Elevation**
- Popovers: z-[100], shadow-2xl
- Sticky header: z-50, shadow-lg
- Cards: z-0, shadow-md on hover

**4. AI Transparency**
- Always show sparkles (✨) on AI fields
- Always provide hover explanations
- Always honest attribution

**5. Performance First**
- Always GPU-optimized
- Always CSS containment
- Always 60fps target
- Always test on mobile

---

## 🚀 Migration Strategy

### **Phase 1: Vehicle Details**
- Apply template to existing vehicle detail page
- Test with real vehicle data
- Verify performance
- User testing

### **Phase 2: Service Records**
- Create service detail page with template
- Add service-specific sections
- Test with real service data

### **Phase 3: Trip Details**
- Create trip detail page with template
- Add route/map sections
- Test with real trip data

### **Phase 4: Other Detail Pages**
- Apply to remaining detail pages
- Consistent experience across app
- User feedback iteration

---

## 💡 Benefits of Universal Template

### **For Users:**
- ✅ Consistent experience everywhere
- ✅ Familiar navigation patterns
- ✅ Predictable interactions
- ✅ Professional polish throughout

### **For Development:**
- ✅ Reusable components
- ✅ Faster implementation
- ✅ Consistent design system
- ✅ Easier maintenance
- ✅ Less code duplication

### **For Business:**
- ✅ Premium brand perception
- ✅ Higher perceived value
- ✅ Better user engagement
- ✅ Reduced bounce rates

---

## 🎉 Result

**One Template, Infinite Applications:**
- 🎫 Event details
- 🚗 Vehicle details
- 🔧 Service records
- 🗺️ Trip details
- 📊 Analytics pages
- 📄 Report pages
- 🏆 Achievement pages

**All with:**
- 🌊 Mesmerizing animated heroes
- 🖤 Premium glassmorphic headers
- 🎴 Clean white glass cards
- 🪟 Perfect popover elevation
- 📋 Scalable change history
- ⚡ 60fps performance

---

**Universal detail page template! Consistent, professional, scalable!** 🎨✨🚀
