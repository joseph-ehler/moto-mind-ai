# Card System Guide

## Overview

Comprehensive card components built on the MotoMind Design System foundation with accessibility, focus states, and interaction patterns built-in.

---

## Card Types

### 1. BaseCard
**Use for:** Static content containers

```tsx
<BaseCard elevation="low" border="default" padding="md">
  <Heading level="subtitle">Title</Heading>
  <Text>Content goes here</Text>
</BaseCard>
```

**Props:**
- `elevation`: `'flat' | 'low' | 'medium' | 'high'` - Shadow depth
- `border`: `'none' | 'default' | 'accent'` - Border style
- `rounded`: `'sm' | 'md' | 'lg' | 'xl'` - Corner radius
- `padding`: `'none' | 'sm' | 'md' | 'lg'` - Internal spacing

---

### 2. InteractiveCard
**Use for:** Clickable cards that trigger actions

```tsx
<InteractiveCard
  onClick={() => navigate('/details')}
  ariaLabel="View product details"
>
  <Heading level="subtitle">Click Me</Heading>
  <Text>I'm interactive!</Text>
</InteractiveCard>
```

**Features:**
- ✅ Focus ring (Tab navigation)
- ✅ Hover scale animation
- ✅ Keyboard support (Enter/Space)
- ✅ ARIA labels

---

### 3. ColoredCard
**Use for:** Semantic colored backgrounds with automatic contrast

```tsx
<ColoredCard variant="primary">
  <Heading level="subtitle">Primary Card</Heading>
  <Text>Text is automatically white!</Text>
</ColoredCard>

<ColoredCard variant="destructive">
  <Heading level="subtitle">Error State</Heading>
  <Text>White text on red background</Text>
</ColoredCard>
```

**Variants:**
- `primary` - Blue, for important content
- `secondary` - Muted, for less emphasis
- `destructive` - Red, for errors/warnings
- `muted` - Gray, for disabled/inactive

**Features:**
- ✅ Automatic text color (uses ColoredBox)
- ✅ WCAG AA/AAA compliance guaranteed
- ✅ No manual foreground classes needed

---

### 4. MetricCard
**Use for:** Displaying KPIs and statistics

```tsx
<MetricCard
  label="Total Revenue"
  value="$124,500"
  subtitle="Last 30 days"
  trend={{ value: "+12.5%", direction: "up" }}
  icon={<TrendingUp className="w-5 h-5" />}
/>
```

**Props:**
- `label` - Metric name (uppercase, small)
- `value` - Main metric value (large, bold)
- `subtitle` - Optional description
- `trend` - Optional trend indicator with direction
- `icon` - Optional icon (top-right)

**Trend directions:**
- `up` - Green background, up arrow
- `down` - Red background, down arrow
- `neutral` - Gray background, horizontal arrow

---

### 5. FeatureCard
**Use for:** Highlighting features or benefits

```tsx
<FeatureCard
  icon={<Zap className="w-6 h-6" />}
  title="Lightning Fast"
  description="Optimized performance with 60fps animations"
  link={{ label: "Learn more", href: "/docs" }}
/>
```

**Props:**
- `icon` - Feature icon
- `title` - Feature name
- `description` - Feature description
- `link` - Optional link (makes card interactive)

**Behavior:**
- Without link: Static card
- With link: Becomes InteractiveCard automatically

---

### 6. AlertCard
**Use for:** Contextual alerts and notifications

```tsx
<AlertCard
  variant="error"
  title="Payment failed"
  description="Please update your payment method"
  action={{ label: "Update payment", onClick: handleUpdate }}
  dismissible
  onDismiss={() => setDismissed(true)}
/>
```

**Variants:**
- `info` - Blue, informational messages
- `success` - Green, success confirmations
- `warning` - Yellow, warnings/cautions
- `error` - Red, errors/failures

**Props:**
- `variant` - Alert type
- `title` - Alert title
- `description` - Alert message
- `action` - Optional action button
- `dismissible` - Optional dismiss button
- `onDismiss` - Dismiss callback

---

### 7. ProductCard
**Use for:** E-commerce product displays

```tsx
<ProductCard
  image="/product.jpg"
  imageAlt="Product name"
  title="Product Title"
  description="Product description"
  price="$299"
  badge="Sale"
  onClick={() => viewProduct()}
/>
```

**Props:**
- `image` - Product image URL
- `imageAlt` - Image alt text (required for a11y)
- `title` - Product name
- `description` - Optional product description
- `price` - Optional price
- `badge` - Optional badge (top-right)
- `onClick` - Optional click handler

**Behavior:**
- Without onClick: Static display
- With onClick: Becomes InteractiveCard

---

### 8. TestimonialCard
**Use for:** Customer reviews and testimonials

```tsx
<TestimonialCard
  quote="This product changed my life!"
  author={{
    name: "John Doe",
    title: "CEO, Company",
    avatar: "/avatar.jpg"
  }}
  rating={5}
/>
```

**Props:**
- `quote` - Testimonial text
- `author` - Author details (name, title, avatar)
- `rating` - Optional star rating (1-5)

---

## When to Use Which Card

| Use Case | Card Type | Why |
|----------|-----------|-----|
| Static content | BaseCard | Simple, no interaction needed |
| Clickable item | InteractiveCard | Focus ring, keyboard support |
| Status/feedback | ColoredCard | Semantic colors, auto contrast |
| Dashboard metrics | MetricCard | Optimized for numbers & trends |
| Feature highlights | FeatureCard | Icon + text layout |
| Alerts/notices | AlertCard | Contextual colors, actions |
| Product listings | ProductCard | Image + details layout |
| Reviews | TestimonialCard | Quote + author format |

---

## Accessibility Checklist

### ✅ Always
- Use `ariaLabel` on InteractiveCards
- Provide image `alt` text on ProductCards
- Test keyboard navigation (Tab + Enter)
- Verify focus ring visibility

### ❌ Never
- Nest interactive cards inside each other
- Use ColoredCard without considering contrast
- Forget to handle onClick errors gracefully
- Use images without alt text

---

## Common Patterns

### Dashboard Grid
```tsx
<Grid columns={3} gap="lg">
  <MetricCard label="Users" value="1,234" trend={{ value: "+5%", direction: "up" }} />
  <MetricCard label="Revenue" value="$50K" trend={{ value: "+12%", direction: "up" }} />
  <MetricCard label="Churn" value="2.1%" trend={{ value: "-1%", direction: "down" }} />
</Grid>
```

### Feature Showcase
```tsx
<Grid columns={3} gap="lg">
  <FeatureCard icon={<Zap />} title="Fast" description="Lightning speed" />
  <FeatureCard icon={<Shield />} title="Secure" description="Bank-level security" />
  <FeatureCard icon={<Heart />} title="Loved" description="By thousands" />
</Grid>
```

### Alert Stack
```tsx
<Stack spacing="md">
  <AlertCard variant="error" title="Error" description="Something went wrong" />
  <AlertCard variant="warning" title="Warning" description="Action required" />
  <AlertCard variant="success" title="Success" description="All done!" />
</Stack>
```

### Product Grid
```tsx
<Grid columns={4} gap="md">
  {products.map(product => (
    <ProductCard
      key={product.id}
      {...product}
      onClick={() => viewProduct(product.id)}
    />
  ))}
</Grid>
```

---

## Responsive Behavior

All cards adapt to mobile screens automatically:

```tsx
// Desktop: 3 columns, Mobile: 1 column
<Grid columns={3} gap="lg">
  <MetricCard ... />
  <MetricCard ... />
  <MetricCard ... />
</Grid>

// Desktop: 4 columns, Tablet: 2, Mobile: 1
<Grid columns={1} gap="md" className="md:grid-cols-2 lg:grid-cols-4">
  <ProductCard ... />
  <ProductCard ... />
</Grid>
```

---

## Performance Tips

1. **Images**: Use lazy loading for ProductCard images
2. **Lists**: Virtualize long lists of cards
3. **Animations**: Respect `prefers-reduced-motion`
4. **Clicking**: Debounce onClick handlers if they trigger heavy operations

---

## Migration from Legacy

If you have old Card components:

```tsx
// OLD (Legacy Card.tsx)
<Card interactive onClick={handleClick}>
  <CardHeader>Title</CardHeader>
  <CardContent>Content</CardContent>
</Card>

// NEW (Cards.tsx)
<InteractiveCard onClick={handleClick} ariaLabel="View details">
  <Heading level="subtitle">Title</Heading>
  <Text>Content</Text>
</InteractiveCard>
```

---

## Summary

**Use the right card for the right job:**
- **BaseCard** - Static content
- **InteractiveCard** - Clickable
- **ColoredCard** - Semantic colors
- **MetricCard** - Numbers & KPIs
- **FeatureCard** - Product features
- **AlertCard** - Notifications
- **ProductCard** - E-commerce
- **TestimonialCard** - Reviews

**All cards include:**
- ✅ Accessibility (focus, ARIA, keyboard)
- ✅ Responsive design (mobile-first)
- ✅ Consistent styling (elevation, borders, padding)
- ✅ Type safety (full TypeScript support)
