# 🎬 Scroll Momentum Micro-Interaction Pattern

## ✅ What This Is:

A reusable, app-wide pattern for scroll-based animations that creates that dynamic, iOS/Android momentum feel.

**Status:** Ready to implement ✅  
**Performance:** 60fps with IntersectionObserver + requestAnimationFrame

---

## 🎯 **The Pattern:**

Cards and sections subtly animate as they enter/exit the viewport during scrolling, creating a sense of depth and momentum.

**Effects:**
1. **Fade-in** - Elements fade in as they appear
2. **Slide-up** - Elements slide up while fading
3. **Scale** - Elements scale from 95% to 100%
4. **Parallax** - Elements move at different speeds
5. **Stagger** - Multiple items animate in sequence

---

## 📦 **Files Created:**

### **1. `/hooks/useScrollAnimation.ts`**
Reusable hooks for scroll animations

### **2. `/components/design-system/AnimatedCard.tsx`**
Pre-configured Card component with animations

---

## 🚀 **Quick Start:**

### **Option 1: Use AnimatedCard (Easiest)**

```tsx
import { AnimatedCard } from '@/components/design-system/AnimatedCard'

<AnimatedCard animation="fade-up" delay={100}>
  <h3>Data Quality</h3>
  <p>Complete event information</p>
</AnimatedCard>
```

### **Option 2: Use Hook Directly**

```tsx
import { useScrollAnimation } from '@/hooks/useScrollAnimation'

function MyCard() {
  const ref = useScrollAnimation({ type: 'fade-up' })
  
  return (
    <div ref={ref}>
      <h3>Content</h3>
    </div>
  )
}
```

---

## 🎨 **Animation Types:**

### **1. fade-up (Default)**
```tsx
<AnimatedCard animation="fade-up">
```

**Effect:** Fades in while sliding up 20px  
**Use for:** Cards, sections, content blocks  
**Feel:** Smooth, elegant entrance

---

### **2. fade-scale**
```tsx
<AnimatedCard animation="fade-scale">
```

**Effect:** Fades in while scaling from 95% to 100%  
**Use for:** Important cards, CTAs, highlights  
**Feel:** Attention-grabbing, dynamic

---

### **3. parallax**
```tsx
<AnimatedCard animation="parallax">
```

**Effect:** Moves slower than scroll (depth effect)  
**Use for:** Background cards, images, decorative elements  
**Feel:** Depth, 3D-like

---

### **4. parallax-fast**
```tsx
<AnimatedCard animation="parallax-fast">
```

**Effect:** Moves faster than scroll  
**Use for:** Foreground elements, overlays  
**Feel:** Speed, dynamism

---

### **5. slide-left**
```tsx
<AnimatedCard animation="slide-left">
```

**Effect:** Slides in from right  
**Use for:** Alternating cards, list items  
**Feel:** Directional, flowing

---

### **6. slide-right**
```tsx
<AnimatedCard animation="slide-right">
```

**Effect:** Slides in from left  
**Use for:** Alternating cards (opposite side)  
**Feel:** Balanced layout

---

## ⚙️ **Options:**

```tsx
<AnimatedCard
  animation="fade-up"
  delay={100}        // Wait 100ms before animating
  duration={600}     // Animation takes 600ms
  once={true}        // Only animate first time
  disableAnimation={false}  // Disable on certain conditions
>
```

---

## 🎭 **Pattern Examples:**

### **1. Staggered Cards**

```tsx
// Cards animate in sequence
<Stack spacing="md">
  <AnimatedCard delay={0}>Card 1</AnimatedCard>
  <AnimatedCard delay={100}>Card 2</AnimatedCard>
  <AnimatedCard delay={200}>Card 3</AnimatedCard>
  <AnimatedCard delay={300}>Card 4</AnimatedCard>
</Stack>
```

**Result:** Cards appear one after another (100ms gap)

---

### **2. Alternating Slide**

```tsx
// Even cards from left, odd from right
{items.map((item, i) => (
  <AnimatedCard 
    key={item.id}
    animation={i % 2 === 0 ? 'slide-right' : 'slide-left'}
    delay={i * 50}
  >
    {item.content}
  </AnimatedCard>
))}
```

**Result:** Zig-zag entrance pattern

---

### **3. Hero + Staggered Content**

```tsx
<AnimatedSection animation="fade-scale">
  <Heading>Welcome</Heading>
</AnimatedSection>

<Stack spacing="md">
  <AnimatedCard delay={200}>Feature 1</AnimatedCard>
  <AnimatedCard delay={300}>Feature 2</AnimatedCard>
  <AnimatedCard delay={400}>Feature 3</AnimatedCard>
</Stack>
```

**Result:** Hero scales in, then features cascade

---

### **4. Parallax Layers**

```tsx
<AnimatedCard animation="parallax">
  <img src="background.jpg" />
</AnimatedCard>

<AnimatedCard animation="fade-up">
  <Content />
</AnimatedCard>

<AnimatedCard animation="parallax-fast">
  <FloatingElement />
</AnimatedCard>
```

**Result:** Multi-layer depth effect

---

## 🎯 **Where to Apply:**

### **Event Detail Page:**

```tsx
// Data Quality Card
<AnimatedCard animation="fade-up" delay={0}>
  <DataQualitySection />
</AnimatedCard>

// Financial Summary
<AnimatedCard animation="fade-up" delay={100}>
  <FinancialSummary />
</AnimatedCard>

// Location Card
<AnimatedCard animation="fade-up" delay={200}>
  <LocationCard />
</AnimatedCard>

// Weather
<AnimatedCard animation="fade-up" delay={300}>
  <WeatherCard />
</AnimatedCard>
```

---

### **Vehicle Timeline:**

```tsx
{events.map((event, i) => (
  <AnimatedCard
    key={event.id}
    animation="slide-left"
    delay={i * 50}
  >
    <EventCard event={event} />
  </AnimatedCard>
))}
```

---

### **Garage (Vehicle List):**

```tsx
<Grid columns="auto" gap="md">
  {vehicles.map((vehicle, i) => (
    <AnimatedCard
      key={vehicle.id}
      animation="fade-scale"
      delay={i * 100}
    >
      <VehicleCard vehicle={vehicle} />
    </AnimatedCard>
  ))}
</Grid>
```

---

## 🔧 **Technical Details:**

### **Performance:**

```tsx
// Uses IntersectionObserver (efficient)
const observer = new IntersectionObserver(callback, {
  threshold: 0.1  // Trigger when 10% visible
})

// Uses requestAnimationFrame (60fps)
const handleScroll = () => {
  requestAnimationFrame(() => {
    // Update transforms
  })
}
```

**Benefits:**
- No constant scroll listeners
- GPU-accelerated transforms
- Lazy evaluation
- Battery-friendly

---

### **CSS Transforms:**

```css
/* Fade Up */
opacity: 0;
transform: translateY(20px);
transition: all 600ms cubic-bezier(0.4, 0, 0.2, 1);

/* Animated */
opacity: 1;
transform: translateY(0);
```

**Easing:** Custom cubic-bezier for smooth, natural feel

---

### **Threshold Tuning:**

```tsx
threshold: 0.1   // Animate when 10% visible
threshold: 0.5   // Wait until 50% visible
threshold: 1.0   // Wait until fully visible
```

**Recommendation:** Use 0.1 for responsive feel

---

## 🎨 **Design Principles:**

### **1. Subtlety is Key**
```
✅ 20px movement
❌ 100px movement (too dramatic)

✅ 0.6s duration
❌ 2s duration (too slow)
```

### **2. Consistent Easing**
```tsx
cubic-bezier(0.4, 0, 0.2, 1)  // iOS-like
```

### **3. Stagger Delays**
```
First card: 0ms
Second: 100ms
Third: 200ms
(100ms gap = smooth cascade)
```

### **4. Once vs Repeat**
```tsx
once={true}   // Animate entering viewport once
once={false}  // Animate every time (can be distracting)
```

**Recommendation:** Use `once={true}` for most cases

---

## 📱 **Responsive Behavior:**

### **Disable on Low-End Devices:**

```tsx
const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
)

<AnimatedCard disableAnimation={prefersReducedMotion.matches}>
```

### **Adjust Duration by Device:**

```tsx
const isMobile = window.innerWidth < 768

<AnimatedCard duration={isMobile ? 400 : 600}>
```

---

## ✅ **Implementation Checklist:**

**Phase 1: Event Detail Page**
- [ ] Data Quality card - fade-up, delay 0
- [ ] Financial Summary - fade-up, delay 100
- [ ] Location card - fade-up, delay 200
- [ ] Weather card - fade-up, delay 300
- [ ] Edit history - fade-up, delay 400

**Phase 2: Vehicle Timeline**
- [ ] Event cards - slide-left, stagger 50ms
- [ ] Load more button - fade-scale

**Phase 3: Garage**
- [ ] Vehicle cards - fade-scale, stagger 100ms
- [ ] Add vehicle CTA - fade-up, delay 300

**Phase 4: Dashboard**
- [ ] Stats cards - fade-scale, stagger 100ms
- [ ] Recent events - slide-left, stagger 50ms
- [ ] Alerts - fade-up

---

## 🎉 **Expected Feel:**

**Before (Static):**
- Cards just appear
- Feels flat
- No depth
- Boring

**After (Animated):**
- Cards gracefully enter
- Feels dynamic
- Sense of depth
- Engaging
- Professional
- iOS/Android-like quality

---

## 📊 **Performance Metrics:**

**Target:**
- 60fps animations
- < 16ms per frame
- Smooth on mid-range devices

**Achieved:**
- ✅ IntersectionObserver (no constant scroll listeners)
- ✅ requestAnimationFrame (synced with repaint)
- ✅ CSS transforms (GPU-accelerated)
- ✅ No layout thrashing

---

## 🚀 **Quick Implementation:**

**Replace regular Cards:**

```tsx
// Before
import { Card } from '@/components/design-system'
<Card>Content</Card>

// After
import { AnimatedCard } from '@/components/design-system/AnimatedCard'
<AnimatedCard>Content</AnimatedCard>
```

**That's it!** Default fade-up animation applied automatically.

---

## 💡 **Pro Tips:**

### **1. Layer Animations**
```tsx
<AnimatedSection animation="parallax">
  <AnimatedCard animation="fade-up">
    {/* Parallax background + fading card */}
  </AnimatedCard>
</AnimatedSection>
```

### **2. Directional Flow**
```tsx
// Left sidebar
<AnimatedCard animation="slide-right">

// Main content
<AnimatedCard animation="fade-up">

// Right sidebar
<AnimatedCard animation="slide-left">
```

### **3. Cascade Effect**
```tsx
const delays = [0, 100, 200, 300, 400]
{items.map((item, i) => (
  <AnimatedCard delay={delays[i % delays.length]}>
))}
```

---

## 🎬 **Result:**

Your app will feel:
- ✅ Dynamic and alive
- ✅ Premium and polished
- ✅ iOS/Android quality
- ✅ Engaging to use
- ✅ Momentum-based
- ✅ Professional

**Users will notice:** "Wow, this feels smooth and native!"
