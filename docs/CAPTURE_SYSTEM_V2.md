# Capture System V2 - S-Tier Multi-Step Documentation Flow

## 🎯 Vision

Transform vehicle documentation from "snap a photo" to **intelligent, guided capture** that produces complete, structured data.

### Core Philosophy:
- **Context-First** - Know what you're capturing before you capture it
- **Progressive Disclosure** - Required → Recommended → Optional
- **AI-Assisted** - Vision knows what to extract based on event type
- **Non-Linear** - Add evidence anytime, not just during initial capture
- **Smart Defaults** - Serve casual users without limiting power users

---

## 🚀 Implementation Status

### ✅ Phase 1: Foundation (BUILT)

#### 1. **Flow Configuration System**
**File:** `/components/capture/flow-config.ts`

**What It Does:**
- Defines all 6 event types with complete metadata
- Specifies multi-step flows for each type
- Provides AI detection keywords
- Estimates capture time
- Lists expected data for each step

**Event Types:**
1. **⛽ Fuel Fill-Up** - Quick (30s) or Complete (2-3 min)
   - Required: Receipt
   - Recommended: Odometer
   - Optional: Fuel gauge, Additives

2. **🔧 Service/Maintenance** - Invoice + optional docs
   - Required: Invoice
   - Optional: Before/after photos, Parts

3. **🛞 Tire Inspection** - 4 tread photos required
   - Required: All 4 tires (FL, FR, RL, RR)
   - Optional: Tire sidewall info

4. **💥 Damage/Incident** - Multiple angles
   - Required: Overview + close-up
   - Optional: Other vehicle, Scene

5. **⚠️ Dashboard Warning** - Warning lights + odometer
   - Required: Warning lights + odometer

6. **📄 Document/Receipt** - Single photo
   - Required: Document

**Key Features:**
- TypeScript interfaces for type safety
- AI detection helper function
- Time estimation logic
- Extensible for new event types

#### 2. **Hybrid Entry Modal**
**File:** `/components/capture/CaptureEntryModal.tsx`

**What It Does:**
- Presents TWO capture paths to users
- Beautiful, modern UI with gradients
- Responsive and mobile-optimized

**Path A: Quick Capture** ⚡
```
User Flow:
1. Tap "Quick Capture"
2. Camera opens immediately
3. Snap photo
4. AI detects event type
5. Offer to add more photos
```

Benefits:
✅ Fastest (1 tap → done)
✅ AI does categorization
✅ Perfect for confident users
✅ Still allows adding more later

**Path B: Guided Capture** 🎯
```
User Flow:
1. Tap "Guided Capture"
2. Choose event type
3. Progressive step-by-step guidance
4. Required → Recommended → Optional
5. Complete documentation
```

Benefits:
✅ Clear context upfront
✅ Educational (shows what's possible)
✅ Thorough documentation
✅ Best for complex events

**UI Highlights:**
- Gradient button for Quick Capture (eye-catching)
- Clean bordered card for Guided (professional)
- Divider with "or" (clear choice)
- Event type grid with icons, descriptions, time estimates
- "Quick" badges for single-photo events
- Manual entry option (always available fallback)

---

## 📋 Next Steps - Week 1 Sprint

### **To Complete Phase 1:**

#### 3. **Multi-Step Flow UI** (Next to build)
**File:** `/components/capture/GuidedCaptureFlow.tsx`

```tsx
Features Needed:
- Step indicator (1 of 4)
- Required/Recommended/Optional badges
- Camera interface with guides
- Skip vs. Done distinction
- Progress preservation (if user exits)
```

Example UI:
```
┌─────────────────────────────────┐
│  Fuel Fill-Up Capture           │
│  ────────────────────────────── │
│                                 │
│  Step 1 of 4 (Required) ✓       │
│  📸 Receipt or Gas Pump         │
│  [Photo captured ✓]             │
│                                 │
│  Step 2 of 4 (Recommended) →    │
│  🎯 Odometer Reading            │
│  "Frame your dashboard"         │
│  [Open Camera] [Skip]           │
│                                 │
│  Steps 3-4 not started          │
│                                 │
│  [← Back]  [Save & Exit]        │
└─────────────────────────────────┘
```

#### 4. **Camera Capture Component** (Next to build)
**File:** `/components/capture/CameraCapture.tsx`

```tsx
Features Needed:
- Native camera integration
- Overlay guides (show what to frame)
- Example thumbnail
- Retake option
- Quality check feedback
```

Example UI:
```
┌─────────────────────────────────┐
│  Camera (Step 2 of 4)           │
│  ────────────────────────────── │
│                                 │
│  Frame your odometer            │
│  ┌───────────────────────┐     │
│  │                       │     │
│  │   [Live camera feed]  │     │
│  │                       │     │
│  │   Overlay guide box   │     │
│  │                       │     │
│  └───────────────────────┘     │
│                                 │
│  💡 Tip: Keep camera steady    │
│                                 │
│  [ 📸 Capture ]  [✕ Cancel]   │
└─────────────────────────────────┘
```

#### 5. **Review & Evidence Management** (Next to build)
**File:** `/components/capture/ReviewEvidence.tsx`

```tsx
Features Needed:
- Show all captured photos
- AI extraction results
- Confidence indicators
- Edit/retake options
- Add more evidence
- Manual entry fallback
```

Example UI:
```
┌─────────────────────────────────┐
│  Review Fuel Fill-Up            │
│  ────────────────────────────── │
│                                 │
│  ✓ Receipt                      │
│    [thumbnail]                  │
│    ✅ Extracted: $45.23, 12.5g │
│    [Edit] [Retake]              │
│                                 │
│  ✓ Odometer                     │
│    [thumbnail]                  │
│    ✅ Extracted: 45,234 miles   │
│    [Edit] [Retake]              │
│                                 │
│  ✗ Fuel Gauge (skipped)         │
│    [+ Add Photo]                │
│                                 │
│  [Save Event] [Add More]        │
└─────────────────────────────────┘
```

#### 6. **Integration with Vehicle Page**
**File:** `/app/(authenticated)/vehicles/[id]/page.tsx`

```tsx
Changes Needed:
1. Import CaptureEntryModal
2. Add state for modal visibility
3. Wire up FAB "Capture" button
4. Handle Quick Capture path
5. Handle Guided Capture path
6. Refresh events after save
```

Example Integration:
```tsx
const [showCaptureModal, setShowCaptureModal] = useState(false)

<VehicleFAB
  onCapture={() => setShowCaptureModal(true)}
  onAskAI={() => setShowAIModal(true)}
  onShowMore={() => setShowQuickActionsModal(true)}
/>

<CaptureEntryModal
  isOpen={showCaptureModal}
  onClose={() => setShowCaptureModal(false)}
  onQuickCapture={() => {
    // Open camera immediately
    router.push(`/vehicles/${vehicleId}/capture/quick`)
  }}
  onGuidedCapture={(eventType) => {
    // Start guided flow
    router.push(`/vehicles/${vehicleId}/capture/${eventType}`)
  }}
  vehicleId={vehicleId}
/>
```

---

## 🎨 Design Principles

### Visual Hierarchy:
```
1. Quick Capture (Gradient, prominent)
   ↓
2. "or" Divider
   ↓
3. Guided Capture (Bordered, clean)
   ↓
4. Event Type Grid (if guided)
   ↓
5. Manual Entry (dashed border, de-emphasized)
```

### Color System:
- **Quick Capture**: Blue → Purple → Pink gradient (exciting, fast)
- **Guided Capture**: White with gray border (professional, thorough)
- **Event Types**: Gray backgrounds with hover states
- **Required Steps**: Blue accents
- **Optional Steps**: Gray accents
- **Completed Steps**: Green checkmarks

### Responsive Behavior:
- **Mobile**: Full-screen modals, large touch targets
- **Desktop**: Centered modals, hover states
- **Animations**: Smooth transitions, scale effects
- **Accessibility**: ARIA labels, keyboard navigation

---

## 📊 Success Metrics (Future)

### User Behavior:
- % using Quick Capture vs Guided
- Average photos per event type
- Completion rate of optional steps
- Time to complete capture flows

### Data Quality:
- AI extraction accuracy by step
- Fields requiring manual correction
- Retake frequency
- Missing data rates

### Engagement:
- Events created per week
- Complete vs incomplete events
- Evidence added post-capture
- Template usage (Phase 3)

---

## 🔮 Future Enhancements (Phases 2-4)

### Phase 2: Smart Features (Week 2-3)
- **AI Event Detection** - Auto-categorize first photo
- **Smart Retake Suggestions** - Quality feedback
- **Add Evidence Later** - Non-linear workflow
- **Offline Queue** - Capture without internet

### Phase 3: Delight Features (Week 4-5)
- **Voice Guidance** - Hands-free capture
- **Location-Aware Defaults** - GPS-based suggestions
- **Template Capture** - Save repeat patterns
- **Predictive Prompts** - "Time for fuel?"

### Phase 4: Advanced (Week 6+)
- **Batch Capture Mode** - Multiple services in one visit
- **Achievements** - Gamification
- **Evidence Library** - Complete documentation view
- **Smart Recommendations** - "Users like you also capture..."

---

## 🏗️ Architecture Decisions

### Why Hybrid Entry Point?
- **Serves all users** - Casual to power users
- **Educational** - Shows what's possible
- **Fast path exists** - No compromise for speed
- **Scalable** - Easy to add AI detection later
- **Battle-tested** - Gmail, Linear use similar patterns

### Why Config-Driven Flows?
- **Maintainable** - Add new event types easily
- **Type-safe** - TypeScript catches errors
- **AI-friendly** - Clear instructions for Vision API
- **Testable** - Validate flows independently
- **Extensible** - Per-user customization possible

### Why Progressive Steps?
- **Reduces overwhelm** - One decision at a time
- **Educates users** - Shows complete documentation
- **Flexible** - Skip what you don't need
- **Completable later** - Non-destructive workflow

---

## 📚 Key Files Reference

```
/components/capture/
  ├── flow-config.ts              ✅ BUILT - Event type definitions
  ├── CaptureEntryModal.tsx       ✅ BUILT - Hybrid entry point
  ├── GuidedCaptureFlow.tsx       🚧 TODO - Multi-step UI
  ├── CameraCapture.tsx           🚧 TODO - Camera interface
  ├── ReviewEvidence.tsx          🚧 TODO - Review & edit
  └── QuickCapturePath.tsx        🚧 TODO - AI detection flow

/app/(authenticated)/vehicles/[id]/
  ├── capture/
  │   ├── quick/page.tsx          🚧 TODO - Quick capture route
  │   └── [eventType]/page.tsx    🚧 TODO - Guided capture route
  └── page.tsx                    🔧 UPDATE - Wire up modal
```

---

## 🎯 Current Status

✅ Flow configuration system (DONE)
✅ Hybrid entry modal (DONE)
✅ Smart suggestions (DONE)
✅ Recently used (DONE)
✅ Keyboard shortcuts (DONE)
✅ Integration with FAB (DONE)
✅ Routing setup (DONE)
✅ Multi-step flow UI (DONE) 🎉
✅ Quick capture flow (DONE) 🎉
✅ Step indicator (DONE) 🎉
✅ Guided capture page (DONE) 🎉
✅ Quick capture page (DONE) 🎉

🚧 Camera integration (TODO - using file picker for now)
🚧 AI detection API (TODO - mocked for now)
🚧 Event save API (TODO - simulated)
🚧 Loading states (TODO)
🚧 Analytics tracking (TODO)
- Events are created correctly
- No TypeScript errors
- Mobile responsive

---

## 💡 Pro Tips for Implementation

### 1. **Start with Fuel Flow** (Most Common)
- Build fuel capture first
- Get feedback early
- Iterate based on usage
- Then expand to other types

### 2. **Use Existing Components**
- Modal from design system
- Camera from mobile APIs
- Image storage already built
- Event creation API exists

### 3. **Progressive Enhancement**
- Start with basic camera
- Add AI detection later
- Add voice guidance later
- Add templates later

### 4. **Test on Real Devices**
- Camera works differently on iOS/Android
- Test touch targets
- Test in sunlight (receipt glare)
- Test offline mode

### 5. **Optimize for Speed**
- Preload camera
- Compress images client-side
- Parallel AI processing
- Show instant feedback

---

**Status**: Foundation complete! Ready to build multi-step flows. 🚀

**Next Step**: Build `GuidedCaptureFlow.tsx` with step-by-step UI.

**Timeline**: Week 1 Sprint (5-7 days to MVP)
