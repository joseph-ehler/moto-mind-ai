# 🚀 Design System Quick Reference

## 📦 REQUIRED IMPORTS
```tsx
import {
  Container, Section, Stack, Grid, Flex,
  Card, Button, Heading, Text, MetricCard
} from '@/components/design-system'
```

## 🏗️ BASIC STRUCTURE
```tsx
<Container size="md" useCase="articles">
  <Section spacing="lg">
    <Stack spacing="xl">
      <Heading level="hero">Title</Heading>
      <Text>Description</Text>
      
      <Grid columns="auto" gap="md">
        <Card>Content</Card>
      </Grid>
    </Stack>
  </Section>
</Container>
```

## 🎯 COMPONENT MAPPING

| Instead of | Use This |
|------------|----------|
| `<div className="flex">` | `<Flex>` |
| `<div className="grid">` | `<Grid>` |
| `<div className="space-y-4">` | `<Stack spacing="md">` |
| `<div className="max-w-4xl">` | `<Container size="md">` |
| `<h1>` | `<Heading level="hero">` |
| `<h2>` | `<Heading level="title">` |
| `<h3>` | `<Heading level="subtitle">` |
| `<p>` | `<Text>` |

## 📏 CONTAINER SIZES

| Size | Max Width | Use Case | Override Required |
|------|-----------|----------|-------------------|
| `sm` | 672px | Forms, modals | ❌ |
| `md` | 896px | **Consumer content** | ❌ |
| `lg` | 1152px | Data tables | ✅ |
| `xl` | 1280px | Admin only | ✅ |

## 🎨 SPACING SCALE

| Prop | Size | Use For |
|------|------|---------|
| `xs` | 4px | Tight spacing |
| `sm` | 8px | Close elements |
| `md` | 16px | **Standard** |
| `lg` | 24px | Sections |
| `xl` | 32px | Major sections |

## 🔧 COMMON PATTERNS

### Page Layout
```tsx
<Container size="md" useCase="articles">
  <Section spacing="lg">
    <Stack spacing="xl">
      <Heading level="hero">Page Title</Heading>
      <Text>Description</Text>
    </Stack>
  </Section>
</Container>
```

### Card Grid
```tsx
<Grid columns="auto" gap="md">
  <Card>Item 1</Card>
  <Card>Item 2</Card>
  <Card>Item 3</Card>
</Grid>
```

### Dashboard Metrics
```tsx
<Grid columns="dashboard" gap="md">
  <MetricCard title="Users" value="1,234" />
  <MetricCard title="Revenue" value="$12K" />
</Grid>
```

### Form Layout
```tsx
<Stack spacing="lg">
  <Heading level="title">Form Title</Heading>
  <Stack spacing="md">
    <Input />
    <Textarea />
    <Button>Submit</Button>
  </Stack>
</Stack>
```

### Two-Column
```tsx
<Grid columns={2} gap="xl">
  <Stack spacing="md">
    <Heading level="subtitle">Left</Heading>
    <Text>Content</Text>
  </Stack>
  <Stack spacing="md">
    <Heading level="subtitle">Right</Heading>
    <Text>Content</Text>
  </Stack>
</Grid>
```

## ⚠️ OVERRIDE EXAMPLE
```tsx
<Container 
  size="lg" 
  useCase="data_tables"
  override={{
    reason: "Wide table requires horizontal space",
    approvedBy: "UX Team"
  }}
>
  <DataTable />
</Container>
```

## 🚫 FORBIDDEN
- ❌ Raw `<div>` with layout classes
- ❌ Raw `<h1>`, `<h2>`, `<p>` tags  
- ❌ Manual spacing: `mt-4`, `space-y-6`
- ❌ Layout classes: `flex`, `grid`, `max-w-`
- ❌ Large containers without override

## ✅ QUALITY CHECK
- [ ] All imports from design system
- [ ] Container wraps content
- [ ] No raw HTML typography
- [ ] No manual spacing
- [ ] Proper useCase specified
- [ ] UX rules respected
