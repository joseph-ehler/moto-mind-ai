# Ultra God-Tier Wizard: Hardening Plan

**Status:** In Progress  
**Goal:** Make the platform bulletproof, wildly scalable, and production-ready

---

## ✅ **What's Already God-Tier**

1. **Contracts First** - Zod schema + CLI validator with strict mode
2. **Templates, Not Pages** - 5 layouts cover 95% of use cases
3. **Privacy Baked In** - Required: classification, purpose, retention, allowInAI
4. **Progress + Shell** - Chapter bars + footer + mobile-stacked
5. **Loading Primitives** - Button + Scene with slow-hint/timeout/retry
6. **AI Tickers** - Non-blocking prefetch with 500ms budget

**The rails are down. Now harden them.**

---

## 🔧 **10 Gaps to Close (High Leverage)**

### **1. Flow Lifecycle: Definition of Ready / Done**

**Problem:** Flows can ship "nearly correct"  
**Solution:** Explicit DoR/DoD contracts

#### **Definition of Ready (per flow JSON):**
- ✅ `flow.version`, `schemaVersion` match validator
- ✅ All steps have `navigation` + `privacy` (strict mode)
- ✅ At least one chapter with non-zero weight
- ✅ All fields: `bind` is present and resolvable
- ✅ No TODO strings (lint)

#### **Definition of Done (runtime):**
- ✅ `flows:validate` passed in CI (strict)
- ✅ Renderer snapshot tests pass
- ✅ A11y smoke check (axe) passes
- ✅ Analytics events verified in dev

**Implementation:**
- PR template checklist
- CI gate (`flows:validate` required)
- Storybook snapshot tests

---

### **2. Expression Engine Guardrails**

**Problem:** Expressions can be unsafe or break  
**Solution:** Tiny, safe engine with allowlist

#### **Safe Expression Engine:**
- Use JSONLogic or custom
- Allowlisted ops only:
  - `==`, `!=`, `>`, `<`, `>=`, `<=`
  - `&&`, `||`, `!`
  - `in()`, `empty()`, `has()`
- Bind readonly `ctx` (no functions)
- Log evaluation errors (once per expression)
- Unit tests for tricky expressions

#### **DSL Example:**
```json
"shouldExistWhen": "ctx.vehicle.mileage > 100000",
"continueEnabledWhen": "fields.vin.valid && !empty(fields.vin.value)"
```

#### **Safe-Eval Guard:**
```typescript
try {
  result = evaluateExpression(expr, ctx)
} catch (error) {
  console.error(`Expression failed: ${expr}`, error)
  result = false // Default to false
  // Surface validator warning
}
```

**Files to Create:**
- `lib/wizard/expression-engine.ts`
- `lib/wizard/expression-engine.test.ts`

---

### **3. Field Catalog: 10/10 Polish**

**Problem:** Inconsistent behaviors across fields  
**Solution:** Standardize all fields

#### **Consistent Behaviors:**

1. **Transforms run BEFORE validation**
   ```typescript
   value = applyTransforms(rawValue, field.transform)
   errors = validateField(value, field.validation)
   ```

2. **Keyboard hints** - Set per field type
   - `text` → `inputMode="text"`, `enterKeyHint="next"`
   - `email` → `inputMode="email"`, `enterKeyHint="next"`
   - `tel` → `inputMode="tel"`, `enterKeyHint="done"`
   - `number` → `inputMode="numeric"`, `enterKeyHint="done"`

3. **Adornments** - Standardized spacing
   - Left: icon 16px from edge, field 8px from icon
   - Right: icon 8px from field, 16px from edge
   - Prefix/suffix: text, not icon

4. **Errors** - Same placement, motion, colors
   - Below field, 8px gap
   - Slide down with ease-out
   - Red text + icon
   - `aria-live="polite"`

5. **Async validation**
   - Built-in debounce (300ms default)
   - "Validating..." state on field only (not global)
   - Success/error icons in field

#### **Storybook Catalog:**
- Gallery powered by JSON seeds
- Shows all field types
- Shows all states (empty, filled, error, validating, success)

**Files to Create:**
- `stories/wizard/field-catalog.stories.tsx`
- `lib/wizard/field-behaviors.ts`

---

### **4. Slots System for Layouts**

**Problem:** Forking layouts for small variations  
**Solution:** Named slots in templates

#### **Supported Slots:**
- `headerMedia` - Icon/illustration at top
- `helper` - Info/warn/success chips
- `actionsInline` - Rare, tiny in-screen actions
- `footerNote` - "We never share your data"

#### **JSON Example:**
```json
{
  "type": "form.singleQuestion",
  "slots": {
    "headerMedia": {
      "type": "illustration",
      "src": "/illustrations/vin-scan.svg"
    },
    "footerNote": {
      "type": "privacy",
      "content": "Your VIN is encrypted and never shared"
    }
  }
}
```

#### **Renderer:**
```typescript
const SlotComponent = getSlotComponent(slot.type)
return <SlotComponent {...slot} />
```

**Files to Create:**
- `lib/wizard/slots.ts`
- `components/wizard/slots/`

---

### **5. Data Sources as a Registry**

**Problem:** Ad-hoc data fetching  
**Solution:** Centralized registry with caching + privacy

#### **Registry:**
```typescript
const dataSources = {
  vinChecksum: {
    type: 'http.post',
    url: '/api/validate/vin',
    privacy: { mask: 'last4' },
    cacheTTL: 0, // No cache for validation
  },
  safetyRollup: {
    type: 'http.get',
    url: '/api/safety/rollup',
    privacy: { classification: 'PUBLIC' },
    cacheTTL: 24 * 60 * 60 * 1000, // 24h
  },
}
```

#### **Runtime:**
```typescript
const result = await dataSourceRegistry.fetch('vinChecksum', { vin })
// Automatic:
// - Caching by key (stringify inputs)
// - Privacy gate enforcement
// - Logging (started/success/error/duration)
```

#### **Privacy Gate:**
```typescript
withPrivacyGate(dataSource, {
  mask: 'last4',
  allowInAI: false,
  logAccess: true,
})
```

**Files to Create:**
- `lib/wizard/data-source-registry.ts`
- `lib/wizard/data-source-cache.ts`
- `lib/wizard/privacy-gate.ts`

---

### **6. Renderer Resilience (No Blank Screens)**

**Problem:** One config error breaks entire flow  
**Solution:** Graceful fallbacks everywhere

#### **Resilience Patterns:**

1. **Step validation fails at runtime:**
   ```tsx
   <ConfigErrorCard
     stepId={step.id}
     summary="Missing required field: bind"
     docsLink="/docs/wizard/fields"
     showInDev={true}
   />
   // Still show footer (Back/Exit)
   ```

2. **Data source fails:**
   ```tsx
   <StepWithInlineError
     step={step}
     error="Unable to fetch safety data"
     action="Retry"
   />
   // Don't crash flow, show deterministic error
   ```

3. **Unknown template:**
   ```tsx
   <FallbackTemplate
     step={step}
     warning="Unknown template: form.custom"
   />
   // Fall back to form.singleQuestion
   ```

#### **Error Boundaries:**
```typescript
<StepErrorBoundary
  fallback={<ConfigErrorCard />}
  onError={(error, stepId) => {
    logError('step-render-failed', { stepId, error })
  }}
>
  <StepRenderer step={step} />
</StepErrorBoundary>
```

**Files to Create:**
- `components/wizard/ConfigErrorCard.tsx`
- `components/wizard/StepErrorBoundary.tsx`

---

### **7. Theming/i18n Ergonomics**

**Problem:** Manual JSON editing is error-prone  
**Solution:** VSCode schema + fallbacks

#### **VSCode JSON Schema:**
```json
{
  "$schema": "https://motomind.ai/schemas/flow-v1.json",
  "id": "vehicle-onboarding",
  ...
}
```

- Autocomplete for field types, templates, etc.
- Inline validation errors
- Hover documentation

#### **i18n Fallback:**
```typescript
// Renderer prefers key
const title = step.titleKey 
  ? t(step.titleKey) 
  : step.title

// Log once if using literal
if (!step.titleKey && step.title) {
  console.warn(`Step ${step.id} uses literal title, prefer titleKey`)
}
```

#### **Theme Tokens (small set):**
- `radius`: none, sm, md, lg, xl
- `shadow`: none, sm, md, lg
- `surface`: white, gray-50, gray-100
- `accent`: brand color

**Files to Create:**
- `schemas/flow-v1.json` (JSON Schema)
- `.vscode/settings.json` (schema mapping)
- `lib/wizard/theme-tokens.ts`

---

### **8. Analytics Normalization**

**Problem:** Inconsistent event tracking  
**Solution:** Single helper, auto-called

#### **Unified Helper:**
```typescript
// Renderer calls automatically
trackStepView(flowId, chapterId, stepId, {
  variant,
  device,
  mode,
})

trackStepComplete(flowId, chapterId, stepId, {
  duration,
  valid,
})

trackBack(flowId, chapterId, stepId)

trackError(flowId, chapterId, stepId, {
  code,
  message,
})
```

#### **Normalized Properties:**
- Always: `flowId`, `chapterId`, `stepId`
- Context: `variant`, `device`, `mode`
- Timing: `duration`, `slow` (p95 threshold)

#### **Testing:**
- Confirm events in dev console
- Snapshot tests verify calls
- Analytics guide documents all events

**Files to Create:**
- `lib/wizard/analytics.ts`
- `lib/wizard/analytics.test.ts`
- `docs/WIZARD_ANALYTICS_GUIDE.md`

---

### **9. Flow Registry & Overrides**

**Problem:** One-size-fits-all doesn't scale  
**Solution:** Base + per-tenant/brand overrides

#### **Resolver:**
```typescript
const flow = resolveFlow('vehicle-onboarding', {
  tenant: 'enterprise-fleet',
  brand: 'pro',
  variant: 'variant-b',
})

// Merges deeply:
// 1. Base JSON (config/onboarding/vehicle-flow.json)
// 2. Brand override (config/brands/pro.json)
// 3. Tenant override (config/tenants/enterprise-fleet.json)
// 4. Variant override (flags)
```

#### **Override Example:**
```json
// config/tenants/enterprise-fleet.json
{
  "chapters": [{
    "id": "vehicle-basics",
    "steps": [{
      "id": "vin",
      "titleKey": "vin.title.fleet"  // Override title
    }]
  }]
}
```

#### **Validation After Merge:**
```typescript
const merged = deepMerge(base, brandOverride, tenantOverride)
const result = validateFlow(merged, strictMode)
if (!result.valid) {
  throw new Error('Override broke flow')
}
```

**Files to Create:**
- `lib/wizard/flow-resolver.ts`
- `lib/wizard/deep-merge.ts`
- `config/brands/`
- `config/tenants/`

---

### **10. Release Discipline**

**Problem:** Regressions slip through  
**Solution:** Automated gates

#### **CI Required:**
```yaml
# .github/workflows/flows.yml
- name: Validate Flows
  run: npm run flows:validate "config/**/*.json"
  
- name: Snapshot Tests
  run: npm run test:snapshots
  
- name: A11y Check
  run: npm run test:a11y
```

#### **Linting:**
```bash
npm run flows:lint
```

**Checks:**
- Missing helpers for long forms (>3 fields)
- Unchecked async validation
- Help missing for special fields (VIN, SSN, etc.)
- Sensitive data without maskInLogs

#### **Golden Screenshots:**
- Wizard shell on mobile/desktop
- Each template with sample data
- Visual regression tests

**Files to Create:**
- `scripts/lint-flows.ts`
- `.github/workflows/flows.yml`
- `tests/snapshots/wizard/`

---

## 🚀 **Minimal High-ROI Next Moves**

### **B-1. VSCode JSON Schema** (30 min)
- Create `schemas/flow-v1.json`
- Add to `.vscode/settings.json`
- Autocomplete + inline validation

### **B-2. Expression Engine** (2-3 hours)
- Allowlisted ops only
- Safe eval with defaults
- Unit tests

### **B-3. Data Source Registry** (3-4 hours)
- Registry + caching
- Privacy gates
- Dev logging

### **B-4. Renderer Safe Mode** (2-3 hours)
- ConfigErrorCard
- StepErrorBoundary
- Graceful fallbacks

### **B-5. CI Validation** (30 min)
- `flows:validate` required
- Exit code enforcement

### **B-6. Storybook Catalog** (2-3 hours)
- Field catalog gallery
- JSON-powered stories
- Visual regression

**Total: ~10-15 hours for bulletproof platform**

---

## 🎯 **Definition of Ready (Per Step)**

✅ `type` maps to known template  
✅ `title` OR `titleKey` present  
✅ All fields have `bind`, `validation`, `privacy`  
✅ `navigation` present (back/continue rules)  
✅ `privacy.allowInAI` explicit for every field  
✅ `shouldExistWhen` compiles (if present)

**Add to PR template!**

---

## 🚨 **Risk Register & Mitigations**

| Risk | Mitigation |
|------|------------|
| Flow JSON drift | Strict schema + CLI + VSCode schema |
| Expressions gone wild | Allowlist ops + safe defaults + logging |
| PII accidental leakage | AI gateway allowlist + allowInAI + mask |
| UX fragmentation | Templates + slots only; forbid ad-hoc JSX |
| Flaky async validation | Debounce + local field state + optimistic |
| Tenant overrides break | Validate after merge |

---

## 📊 **Success Metrics**

**Platform:**
- ✅ 100% flows pass `flows:validate` in CI
- ✅ Zero blank screens in production
- ✅ < 5% expression evaluation failures
- ✅ 100% data source calls logged

**UX:**
- ✅ 95%+ flows use templates (no custom JSX)
- ✅ 100% fields have privacy tags
- ✅ Zero PII leakage to AI (enforced)

**Engineering:**
- ✅ Non-engineers can create flows
- ✅ < 1 day to add new field type
- ✅ < 1 hour to add new template

---

**With these hardening items, the platform becomes truly ultra-god-tier and bulletproof.** 🛡️
