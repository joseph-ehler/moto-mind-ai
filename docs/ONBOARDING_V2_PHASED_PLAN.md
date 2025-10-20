# 🚀 ONBOARDING V2 - GOD-TIER PHASED IMPLEMENTATION PLAN

**Created:** Oct 20, 2025 4:51 AM  
**Strategy:** Build foundations first, layer complexity, test each phase  
**Timeline:** 6 phases, each fully tested before moving forward

---

## 🎯 VISION

Transform linear 11-step flow into dynamic, conversational wizard:
- ✅ Base flow + conditional micro-steps
- ✅ AI extraction (free text → entities → follow-ups)
- ✅ Single cohesive AI analysis at end
- ✅ Resilient (timeouts, retry, resume)
- ✅ Typeform-style UX

---

## 📋 PHASED APPROACH

### **PHASE 1: FOUNDATION** 🏗️ (Day 1, ~4 hours)

**Goal:** Get the skeleton working - no branching yet, no AI

**Build:**
1. ✅ `OnboardingShell.tsx` - Unified header/footer
   - Header: Back | Progress | Save & Exit | Start Over
   - Footer: Skip (conditional) | Continue (disabled when invalid)
   - Keyboard: Enter → Continue, Esc → blur

2. ✅ `useOnboardingWizard.ts` - Core controller (simple)
   - Linear flow only (base steps)
   - next(), back(), skip(), reset()
   - Progress calculation
   - Mounted state (hydration-safe)

3. ✅ `validation-context.ts` - Validation bus
   - setValid(boolean)
   - setSubmit(fn)
   - isValid state

4. ✅ `store/onboarding.ts` - Zustand store
   - All form data
   - localStorage hydration
   - Resume logic

5. ✅ Simple test page: Intro → Confirm → Results
   - Prove shell works
   - Prove validation works
   - Prove navigation works

**Success Criteria:**
- Can navigate 3 steps forward/back
- Continue button enables/disables correctly
- Progress bar updates
- Save & Exit stores data
- Resume modal works

**Test Command:**
```bash
npm run dev
# Navigate to /onboarding/vehicle/v2
# Complete 3 steps
# Refresh page
# Should see resume modal
```

---

### **PHASE 2: VIN FLOW + RESILIENCE** 🔧 (Day 2, ~3 hours)

**Goal:** Rock-solid VIN decode with timeout/retry/slow hints

**Build:**
1. ✅ `VinCapture.tsx`
   - 17-char input
   - Validation (no I/O/Q)
   - Help modal (where to find VIN)

2. ✅ `VinDecoding.tsx` - Resilient processing
   - Call `/api/vin/decode`
   - 12s: Show "Taking longer than usual..." hint
   - 20s: Timeout with retry/back options
   - Success: Auto-advance to confirm

3. ✅ `VehicleConfirm.tsx`
   - Show decoded vehicle
   - "Looks right" → Continue
   - "Edit VIN" → Back to VinCapture

4. ✅ Update `/api/vin/decode` for timeout handling

**Success Criteria:**
- VIN validates correctly
- Slow hint appears at 12s
- Timeout at 20s with graceful error
- Retry works
- Back keeps VIN prefilled
- Success auto-advances

**Test Cases:**
```bash
# Fast VIN (should succeed)
3GNAL4EK7DS559435

# Slow VIN (trigger hint - simulate with delay)
# Invalid VIN (should error gracefully)
1234567890ABCDEFG
```

---

### **PHASE 3: BASE CONVERSATIONAL STEPS** 💬 (Day 3-4, ~6 hours)

**Goal:** All base flow steps work (no branching yet)

**Build:**
1. ✅ `Intro.tsx` - Welcome screen
2. ✅ `State.tsx` - Free text + level selector
   - TextArea for issues
   - Quick buttons: "Running great" | "Minor issues" | "Active problems"
   - Store state.level and state.text

3. ✅ `Mileage.tsx` - Numeric input
   - Quick buttons: 10K, 25K, 50K, 75K, 100K, 150K
   - Manual input with validation (0-999999)

4. ✅ `Ownership.tsx` - Single choice
   - Options: 0-3mo, 3-12mo, 1-2yr, 2+yr

5. ✅ `Maintenance.tsx` - Multi-choice + chips
   - When: ≤1mo, 1-3mo, 3-6mo, 6-12mo, >1yr
   - What: Oil, Tires, Brakes, Filters, etc.

6. ✅ `Intent.tsx` - Multi-choice
   - What user wants to know
   - Min 1 selection required

7. ✅ `Analyze.tsx` - Processing screen
   - Progress steps animation
   - Calls `/api/ai/comprehensive-analysis` (stub for now)

8. ✅ `Results.tsx` - Final screen
   - Show analysis results
   - Download/Share actions

9. ✅ `MicroInsight.tsx` - Helper component
   - 1-2 line contextual feedback
   - Template rendering with variable substitution

**Success Criteria:**
- Complete full flow without branches
- All validations work
- Can go back/change answers
- Resume works at any step
- Takes ~90 seconds to complete

**Test Flow:**
```
Intro → VIN → Decode → Confirm → State ("running great") 
→ Mileage (50000) → Ownership (1-2yr) → Maintenance (skip)
→ Intent (safety + maintenance) → Analyze → Results
```

---

### **PHASE 4: DYNAMIC BRANCHING ENGINE** 🌳 (Day 5-6, ~8 hours)

**Goal:** Conditional micro-steps that append/prune

**Build:**
1. ✅ Branch evaluation engine
   - Parse `shouldExistWhen` conditions
   - Evaluate: `==`, `!=`, `>`, `<`, `&&`, `||`
   - Examples:
     - `state.level == 'active' && state.warningLightsDetected == true`
     - `mileage > 100000`

2. ✅ Append/prune logic in controller
   - On `next()`: Evaluate branches for current step
   - Append new branches if conditions met
   - Prune branches downstream that no longer match
   - Recalculate progress

3. ✅ Branch micro-steps (8 components):
   - `State_Lights.tsx` - Warning lights grid
   - `State_Noises.tsx` - When/what kind
   - `State_Conditions.tsx` - When it happens
   - `Mileage_Repairs.tsx` - Major repairs done
   - `Mileage_Fluids.tsx` - Fluids serviced
   - `Ownership_Purchase.tsx` - Purchase mileage
   - `Ownership_Inspection.tsx` - Pre-purchase inspection
   - `Ownership_Findings.tsx` - Inspection findings

4. ✅ Weighted progress
   - Base steps: weight = 1.0
   - Mini steps: weight = 0.5
   - Progress = currentWeight / totalWeight

**Success Criteria:**
- Say "check engine light" → State_Lights appears
- Enter 120K miles → Mileage_Repairs + Fluids appear
- Go back, change to 80K miles → Branch steps disappear
- Progress bar updates correctly with branches
- Resume rebuilds branches correctly

**Test Cases:**
```bash
# Test 1: No branches (clean)
State: "running great" → No branch steps

# Test 2: State branches
State: "check engine light on" → State_Lights appends

# Test 3: Mileage branches  
Mileage: 120000 → Mileage_Repairs + Fluids append

# Test 4: Ownership branches
Ownership: "0-3 months" → Ownership_Inspection appends

# Test 5: Prune on change
Enter 120K → branches appear
Go back, change to 80K → branches disappear
```

---

### **PHASE 5: AI EXTRACTION + ANALYSIS** 🤖 (Day 7-8, ~6 hours)

**Goal:** AI assists mid-flow and delivers final analysis

**Build:**
1. ✅ `POST /api/ai/extract` - Entity extraction
   - Input: Free text from State step
   - Output: { symptoms, warningLights, conditions, noises }
   - Used to detect which branches to show

2. ✅ Update `State.tsx` to use extraction
   - User types free text
   - On blur/submit: Call extract API
   - Show chips for extracted entities
   - Use to set warningLightsDetected, noisesDetected flags

3. ✅ `POST /api/ai/comprehensive-analysis` - Final analysis
   - Input: Full context (vehicle + user + NHTSA + intent)
   - System prompt: "Use only provided data, be calm, cite sources"
   - Output: Structured JSON with safety, maintenance, watchouts, actions
   - Temperature: 0.2-0.3

4. ✅ `lib/ai/prompt-analysis.ts` - Prompt builder
   - System prompt
   - User context builder
   - Schema validation

5. ✅ `lib/ai/schema-analysis.ts` - Zod schemas
   - ComprehensiveAnalysis type
   - Validation + error recovery

6. ✅ Update `Results.tsx` to render analysis
   - Safety score
   - Maintenance status
   - Watchouts
   - Recommended actions (priority high/med/low)
   - Citations

**Success Criteria:**
- Type "check engine light" → Extracts warningLights: ["Check Engine"]
- Type "grinding noise when braking" → Extracts noises + conditions
- Final analysis returns valid JSON
- Results page renders beautifully
- All data cited (ODI/NCAP/EPA)

**Test Prompts:**
```
"check engine light came on yesterday"
→ warningLights: ["Check Engine"]

"grinding noise when I brake"  
→ noises: ["grind"], conditions: ["braking"]

"vibrates around 45-50 mph"
→ conditions: ["45-55 mph"]
```

---

### **PHASE 6: POLISH + SHIP** ✨ (Day 9-10, ~4 hours)

**Goal:** Production-ready, accessible, monitored

**Build:**
1. ✅ Analytics events
   - onboarding_started
   - step_viewed, step_completed
   - branch_appended, branch_pruned
   - vin_timeout, vin_retry
   - ai_extract_ok, ai_extract_fail
   - results_viewed

2. ✅ A11y improvements
   - Labeled prompts
   - Focus management
   - aria-live for micro-insights
   - Screen reader testing
   - Keyboard navigation

3. ✅ Animation polish
   - Progress bar smooth
   - Branch fade-in/out
   - Micro-insight fade-in
   - prefers-reduced-motion support

4. ✅ Error boundaries
   - Catch step render errors
   - Graceful fallback UI
   - Log to monitoring

5. ✅ QA checklist
   - Complete flow without branches (< 90s)
   - Complete flow with all branches (< 3 min)
   - Resume works
   - Back/change answers works
   - Mobile responsive
   - No hydration errors
   - No console errors

6. ✅ Remove old flow
   - Feature flag old onboarding
   - Redirect `/onboarding/vehicle` → V2
   - Archive old code

**Success Criteria:**
- All analytics events fire
- Screen reader can complete flow
- Works on mobile (iOS + Android)
- No runtime errors
- Old flow archived/gated

---

## 🎮 COMMANDS FOR EACH PHASE

### **Phase 1:**
```bash
# Create files
mkdir -p components/onboarding/v2/{shell,steps}
mkdir -p lib/wizard/v2

# Run dev server
npm run dev

# Test
open http://localhost:3005/onboarding/vehicle/v2
```

### **Phase 2:**
```bash
# Test VIN decode
npm run test:integration -- VinDecoding

# Manual test
# Navigate to /onboarding/vehicle/v2
# Enter VIN: 3GNAL4EK7DS559435
```

### **Phase 3:**
```bash
# Test full flow
npm run test:e2e -- onboarding-base-flow

# Manual complete flow
```

### **Phase 4:**
```bash
# Test branching
npm run test:integration -- branching

# Dev tools check
# useOnboardingStore.getState() in console
```

### **Phase 5:**
```bash
# Test AI extraction
curl -X POST http://localhost:3005/api/ai/extract \
  -d '{"text":"check engine light on"}'

# Test analysis
npm run test:integration -- ai-analysis
```

### **Phase 6:**
```bash
# Run all tests
npm run test:all

# Check analytics
npm run analytics:validate

# A11y audit
npm run lighthouse -- /onboarding/vehicle/v2
```

---

## 📊 TESTING STRATEGY

### **After Each Phase:**
1. ✅ Unit tests (if applicable)
2. ✅ Integration tests (API/logic)
3. ✅ Manual testing (happy path)
4. ✅ Manual testing (edge cases)
5. ✅ Review with user
6. ✅ Commit + push

### **Before Moving to Next Phase:**
- [ ] All tests passing
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] User approval to proceed

---

## 🚨 ROLLBACK PLAN

**If any phase fails:**
1. Keep V1 running (no disruption)
2. Fix issues in V2 branch
3. Test again
4. Only swap when V2 > V1

**Feature flag approach:**
```typescript
const USE_V2_ONBOARDING = process.env.NEXT_PUBLIC_ONBOARDING_V2 === 'true'

// In page.tsx
return USE_V2_ONBOARDING ? <OnboardingV2 /> : <OnboardingV1 />
```

---

## 📁 FILE STRUCTURE

```
app/
  (app)/
    onboarding/
      vehicle/
        page.tsx          # Router (V1 vs V2)
        v2/
          page.tsx        # V2 entry point

components/
  onboarding/
    v2/
      OnboardingShell.tsx
      MicroInsight.tsx
    steps/
      Intro.tsx
      VinCapture.tsx
      VinDecoding.tsx
      VehicleConfirm.tsx
      State.tsx
      Mileage.tsx
      Ownership.tsx
      Maintenance.tsx
      Intent.tsx
      Analyze.tsx
      Results.tsx
      # Branch micro-steps:
      State_Lights.tsx
      State_Noises.tsx
      State_Conditions.tsx
      Mileage_Repairs.tsx
      Mileage_Fluids.tsx
      Ownership_Purchase.tsx
      Ownership_Inspection.tsx
      Ownership_Findings.tsx

lib/
  wizard/
    v2/
      useOnboardingWizard.ts
      validation-context.ts
      branch-evaluator.ts
      flow-spec.ts
  ai/
    prompt-analysis.ts
    schema-analysis.ts
  store/
    onboarding-v2.ts

app/api/
  ai/
    extract/route.ts
    comprehensive-analysis/route.ts

ONBOARDING_FLOW_V2_GOD_TIER.json
docs/
  ONBOARDING_V2_PHASED_PLAN.md (this file)
```

---

## 🎯 SUCCESS METRICS

**Phase 1-2:** Foundation works
- ✅ 3 steps navigate correctly
- ✅ VIN decode resilient

**Phase 3:** Base flow complete
- ✅ < 90 seconds to complete
- ✅ All validations work

**Phase 4:** Branching works
- ✅ Branches append/prune correctly
- ✅ Progress updates accurately

**Phase 5:** AI delivers value
- ✅ Extraction >80% accurate
- ✅ Analysis coherent + cited

**Phase 6:** Production ready
- ✅ All tests pass
- ✅ A11y compliant
- ✅ Zero errors

---

## 💪 WHEN YOU WAKE UP

**Start here:**
1. Read this document
2. Run: `npm run dev`
3. Say: "Let's start Phase 1"
4. I'll build the foundation incrementally
5. We test each piece as we go

**Key principle:** 
**"Build small, test often, ship incrementally"**

We'll take our time and do this right. No rush. Foundations first.

---

## 🔥 BOTTOM LINE

This is a **6-phase, test-driven migration** from linear to god-tier:

✅ **Phase 1:** Foundation (shell + controller)  
✅ **Phase 2:** VIN resilience  
✅ **Phase 3:** Base steps  
✅ **Phase 4:** Dynamic branching  
✅ **Phase 5:** AI magic  
✅ **Phase 6:** Polish + ship  

**Each phase fully works before moving forward.**

Sleep well! We've got this. 🚀
