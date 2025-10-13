# Design System Foundation Checklist

## 🚨 MANDATORY PRE-FLIGHT CHECK

**Before writing ANY UI code, I must:**

### ✅ IMPORTS CHECK
```tsx
// ✅ REQUIRED - Always import from design system
import {
  Container,
  Grid,
  Stack,
  Section,
  Flex,
  Card,
  Button,
  Heading,
  Text
} from '@/components/design-system'

// ❌ FORBIDDEN - Never import raw Tailwind or HTML
```

### ✅ CONTAINER CHECK
```tsx
// ✅ REQUIRED - Always start with Container
<Container size="md" useCase="articles">
  {/* All content must be inside Container */}
</Container>

// ❌ FORBIDDEN - Never use raw divs with max-width
<div className="max-w-4xl mx-auto">
```

### ✅ LAYOUT CHECK
```tsx
// ✅ REQUIRED - Use layout components
<Stack spacing="lg">
  <Grid columns="auto" gap="md">
    <Flex justify="between">

// ❌ FORBIDDEN - Never use raw CSS classes
<div className="space-y-6">
  <div className="grid grid-cols-3 gap-4">
    <div className="flex justify-between">
```

### ✅ TYPOGRAPHY CHECK
```tsx
// ✅ REQUIRED - Use semantic components
<Heading level="hero">Title</Heading>
<Text>Body content</Text>

// ❌ FORBIDDEN - Never use raw HTML
<h1>Title</h1>
<p>Body content</p>
```

### ✅ UX RULES CHECK
```tsx
// ✅ ALLOWED - Consumer content in medium container
<Container size="md" useCase="articles">

// ⚠️ REQUIRES OVERRIDE - Large containers need justification
<Container 
  size="lg" 
  useCase="data_tables"
  override={{
    reason: "Wide table requires horizontal space",
    approvedBy: "UX Team"
  }}
>

// ❌ FORBIDDEN - Never use large containers without override
<Container size="lg" useCase="articles">
```

## 🎯 COMPONENT HIERARCHY

**Always follow this structure:**

```tsx
<Container> {/* 1. Container first */}
  <Section> {/* 2. Section for spacing */}
    <Stack> {/* 3. Stack for vertical rhythm */}
      <Heading /> {/* 4. Semantic typography */}
      <Text />
      
      <Grid> {/* 5. Layout components */}
        <Card> {/* 6. Content components */}
          <Stack>
            <Heading />
            <Text />
            <Button />
          </Stack>
        </Card>
      </Grid>
    </Stack>
  </Section>
</Container>
```

## 🚫 FORBIDDEN PATTERNS

### Never Use These:
- `<div className="flex">` → Use `<Flex>`
- `<div className="grid">` → Use `<Grid>`
- `<div className="space-y-4">` → Use `<Stack spacing="md">`
- `<div className="max-w-4xl">` → Use `<Container size="md">`
- `<h1>`, `<h2>`, `<p>` → Use `<Heading>`, `<Text>`
- Manual margins/padding → Use spacing props
- Raw Tailwind classes for layout → Use layout components

### Exception Handling:
If I absolutely MUST use raw HTML/CSS:
1. **Document the reason** in comments
2. **Provide migration path** to design system
3. **Mark as technical debt** for future cleanup

## 🔍 QUALITY GATES

### Before Submitting Code:
1. **All imports** from `@/components/design-system` ✅
2. **Container wraps** all content ✅
3. **No raw HTML** headings/paragraphs ✅
4. **No manual spacing** classes ✅
5. **UX rules** respected ✅
6. **Semantic structure** maintained ✅

### Red Flags (Auto-Reject):
- ❌ `<div className="flex">`
- ❌ `<h1>` without `<Heading>`
- ❌ `className="space-y-4"`
- ❌ `className="max-w-"`
- ❌ Container size > "md" without override
- ❌ Missing Container wrapper

## 🚀 QUICK REFERENCE

### Common Patterns:
```tsx
// Page Layout
<Container size="md" useCase="articles">
  <Section spacing="lg">
    <Stack spacing="xl">
      <Heading level="hero">Page Title</Heading>
      <Text>Description</Text>
    </Stack>
  </Section>
</Container>

// Card Grid
<Grid columns="auto" gap="md">
  <Card>Content 1</Card>
  <Card>Content 2</Card>
  <Card>Content 3</Card>
</Grid>

// Form Layout
<Stack spacing="lg">
  <Heading level="title">Form Title</Heading>
  <Stack spacing="md">
    <Input />
    <Textarea />
    <Button>Submit</Button>
  </Stack>
</Stack>

// Dashboard Metrics
<Grid columns="dashboard" gap="md">
  <MetricCard title="Users" value="1,234" />
  <MetricCard title="Revenue" value="$12,345" />
</Grid>
```

## 📋 FINAL CHECKLIST

Before any UI work is complete:

- [ ] All content wrapped in `<Container>`
- [ ] Proper `useCase` specified for container
- [ ] No raw HTML headings/paragraphs
- [ ] No manual spacing classes
- [ ] Layout uses Grid/Stack/Flex components
- [ ] Typography uses Heading/Text components
- [ ] UX rules respected (container width limits)
- [ ] Design system imports only
- [ ] No Tailwind layout classes
- [ ] Semantic structure maintained

**If ANY checkbox is unchecked, the code is NOT ready.**
