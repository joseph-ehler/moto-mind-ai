# Ultra God-Tier Wizard Platform

**Status:** In Progress  
**Vision:** A platform that scales to any use case, edited by anyone, looks premium by default

---

## 🎯 **The 10 Pillars**

### **1. Single Source of Truth: Flow JSON + Schema**

One JSON defines everything:
- Chapters, steps, fields
- Branching logic
- Validation rules
- Privacy tags
- Analytics events
- Theming tokens

**Strict schema** validates at build & runtime.

```typescript
{
  "id": "vehicle-onboarding",
  "version": "2.1.0",
  "schemaVersion": "1.0.0",
  "i18nNS": "onboarding.vehicle",
  "theming": { "brand": "motomind", "tone": "calm" },
  "chapters": [...],
  "privacy": { "defaultRetention": "180d" },
  "analytics": { "namespace": "onboarding", "flow": "vehicle" }
}
```

---

### **2. Templates as First-Class**

**Template Catalog:**
- `informational` - Welcome, ChapterIntro
- `form.singleQuestion` - Default form layout
- `form.cardGrid` - Chips/cards layout
- `form.twoColumn` - Rare, only if needed
- `processing.scene` - Loading scene
- `confirm.card` - Confirmation

**Each template has slots:**
- headerMedia
- helper
- actions
- footerNote
- microInsight

---

### **3. Field Catalog**

**Complete set:**
- `text`, `number`, `textarea`
- `select`, `chips`
- `singleChoice`, `multiChoice`
- `date`, `time`, `toggle`

**Specializations (presets):**
- `vin` - text with uppercase + exclude I/O/Q
- `email` - text with email keyboard + validation
- `phone` - text with tel keyboard + formatting

**Every field supports:**
- label, placeholder, helper, error
- adornments.left/right
- counter, unit, prefix/suffix
- transform, validation, privacy

```json
{
  "id": "vin",
  "type": "text",
  "preset": "vinUppercase",
  "bind": "vehicle.vin",
  "label": "VIN",
  "transform": { "uppercase": true, "strip": [" ", "-"] },
  "validation": {
    "required": true,
    "length": 17,
    "pattern": "^[A-HJ-NPR-Z0-9]{17}$"
  },
  "privacy": {
    "classification": "SENSITIVE",
    "maskInLogs": true,
    "retention": "180d",
    "allowInAI": false
  }
}
```

---

### **4. Chapters & Steps with Weights & Conditions**

**Chapters:**
- Declare steps
- Progress weight (1.0 vs 0.5 for micro-steps)
- onEnter/onExit hooks

**Steps:**
- Branching with `shouldExistWhen`
- Conditional rendering
- Dynamic flow

```json
{
  "id": "vehicle-basics",
  "name": "Vehicle",
  "weight": 1.0,
  "steps": [
    { 
      "id": "fluids",
      "shouldExistWhen": "ctx.vehicle.mileage > 100000",
      "weight": 0.5
    }
  ]
}
```

---

### **5. Expression Language**

**Safe, simple expressions:**
- `shouldExistWhen` (branching)
- `continueEnabledWhen` (gating)
- `computed` (derived values)

**Binds to ctx:**
- `ctx.vehicle.vin`
- `ctx.state.level`
- `fields.vin.valid`

```json
"shouldExistWhen": "ctx.state.level == 'active' && ctx.state.warningLights == true",
"continueEnabledWhen": "fields.vin.valid && ctx.permissions.canContinue"
```

---

### **6. Validation: Local + Cross-Field + Async**

**Three levels:**

1. **Field-level** - length, pattern, min/max
2. **Step-level** - continueEnabledWhen
3. **Async** - Server validation with debounce

```json
"validation": {
  "required": true,
  "async": { 
    "source": "vinChecksum", 
    "debounceMs": 300 
  }
}
```

---

### **7. Data Sources (Reusable, Declarative)**

**Declare once, use everywhere:**

```json
{
  "dataSources": {
    "vinChecksum": {
      "type": "http.post",
      "url": "/api/validate/vin",
      "privacy": { "mask": "last4" }
    },
    "safetyRollup": {
      "type": "http.get",
      "url": "/api/safety/rollup?year={ctx.vehicle.year}",
      "cacheTtl": "24h"
    }
  }
}
```

**Types:**
- `http.get|post`
- `localCache`
- `computed`
- `memoized`
- `withPrivacyGate`

---

### **8. Theming & i18n**

**Theme tokens:**
- brand, tone, surface
- radius, shadow

**i18n keys:**
```json
{
  "titleKey": "vin.title",
  "subtitleKey": "vin.subtitle",
  "fields": [{
    "labelKey": "vin.label",
    "helperKey": "vin.helper"
  }]
}
```

**Per-brand overrides** from theme registry.

---

### **9. Privacy by Design**

**Every field has:**
- `classification` - PUBLIC, OPERATIONAL, PSEUDONYMIZED, SENSITIVE
- `purpose` - onboarding, safety, analytics, etc.
- `retention` - 180d, until-delete, etc.
- `allowInAI` - true/false
- `doNotTrain` - true/false

**Strict mode** refuses to render without privacy tags.

---

### **10. Observability & Experiments**

**Analytics per step:**
- view, complete, back, skip, error
- flow/chapter/step context

**A/B testing:**
- variantKey
- Feature flags
- Server-selected config

**Loading timings:**
- start, slow, timeout, success

---

## 🏗️ **Generator Contract**

### **Must do:**
1. ✅ Validate flow JSON (strict)
2. ✅ Resolve template → choose layout
3. ✅ Render fields with bind
4. ✅ Apply transforms (uppercase/strip)
5. ✅ Run local validation
6. ✅ Handle async validation (debounce + dataSource)
7. ✅ Set step validity
8. ✅ Enable footer when valid
9. ✅ Handle branching (shouldExistWhen)
10. ✅ Skip loading steps on Back
11. ✅ Emit analytics events

---

## 📋 **Complete Examples**

### **Single Question:**
```json
{
  "id": "mileage",
  "type": "form.singleQuestion",
  "titleKey": "mileage.title",
  "subtitleKey": "mileage.subtitle",
  "icon": "gauge",
  "fields": [{
    "id": "odo",
    "type": "number",
    "bind": "vehicle.mileage",
    "labelKey": "mileage.label",
    "adornments": { "right": { "type": "unit", "text": "mi" } },
    "validation": { "required": true, "min": 0, "max": 999999 },
    "privacy": {
      "classification": "OPERATIONAL",
      "purpose": "onboarding",
      "retention": "180d",
      "allowInAI": true
    }
  }],
  "navigation": {
    "continueLabel": "Continue",
    "showFooterBack": true
  },
  "validationLogic": {
    "continueEnabledWhen": "fields.odo.valid === true"
  }
}
```

### **Conditional Step:**
```json
{
  "id": "fluids",
  "type": "form.cardGrid",
  "titleKey": "fluids.title",
  "shouldExistWhen": "ctx.vehicle.mileage > 100000",
  "weight": 0.5,
  "fields": [{
    "id": "fluids_list",
    "type": "chips",
    "bind": "vehicle.fluids",
    "options": ["Transmission", "Coolant", "Neither", "Not sure"],
    "validation": { "required": true }
  }],
  "navigation": {
    "continueLabel": "Continue",
    "showFooterBack": true
  },
  "privacy": {
    "classification": "PSEUDONYMIZED",
    "retention": "180d"
  }
}
```

### **Processing with AI:**
```json
{
  "id": "vin-decoding",
  "type": "processing.scene",
  "titleKey": "vin.decode.title",
  "loading": {
    "baseTickers": [
      "Contacting VIN database...",
      "Validating checksum...",
      "Preparing confirmation..."
    ],
    "aiTickers": { "enabled": true, "timeoutMs": 500 },
    "slowHintMs": 12000,
    "timeoutMs": 20000
  },
  "navigation": {
    "hideContinueButton": true,
    "showFooterBack": true
  },
  "privacy": {
    "classification": "OPERATIONAL",
    "allowInAI": true
  }
}
```

---

## 🎨 **Theming & Aesthetics**

**Card design:**
```css
bg-gradient-to-br from-white to-gray-50
rounded-2xl
shadow-sm
p-6/8
```

**Icon halo:**
- Subtle gradient circle
- 24-32px icon

**Fields:**
- Consistent spacing
- Large labels (text-sm/medium)
- Bottom helper/errors

**Helpers:**
- info/warn/success variants
- Subtle backgrounds

**Footer:**
- Stacked on mobile
- 44px targets
- Safe-area padding
- Dynamic labels

**Progress:**
- Chapter bars
- Active fills
- Compact, non-distracting

---

## 🛡️ **Hardening & Ops**

### **Strict Mode:**
- Won't render without privacy tags
- Won't render without validation
- Won't render without navigation rules

### **CLI:**
```bash
npm run flows:validate
```
Prints human-readable errors with line/loc.

### **Storybook:**
- Fields/templates with JSON stories
- Visual regression testing

### **Visual Editor (future):**
- Simple JSON GUI
- Writes to repo or CMS
- Non-engineers can create flows

---

## 📅 **Rollout Plan**

### **Phase A: Contracts & Validator (1-2 days)** ⏳
1. Finalize JSON schema (Zod)
2. Add validator CLI
3. Bake in privacy tags requirement
4. Add i18n keys requirement
5. Strict mode toggle

### **Phase B: Generator & Catalog (2-4 days)**
1. Finish StepRenderer mapping
2. Complete field primitives
3. Add slots support
4. Add adornments
5. Expression engine (JSONLogic)

### **Phase C: Data Sources & Async (2-3 days)**
1. Data sources registry
2. Caching layer
3. Async field validation
4. Debounce wrapper
5. Loading states

### **Phase D: Theming & i18n (1-2 days)**
1. Tokenize theme
2. Wire i18n keys
3. Locale switch
4. Per-brand overrides

### **Phase E: Observability (1 day)**
1. Unified analytics
2. Event emitter
3. A/B test support
4. Variant JSON

---

## ✅ **Beautiful Layout Checklist**

- [ ] Title/subtitle spacing intentional
- [ ] Card corners/shadows consistent
- [ ] Field labels aligned
- [ ] Helpers/errors consistent placement
- [ ] Footer stacked on mobile
- [ ] 44px min height everywhere
- [ ] Safe-area padding
- [ ] Progress bars unobtrusive
- [ ] Respects prefers-reduced-motion

---

## 🎯 **The Vision**

**Product folks** can ship entire flows by editing JSON.  
**Engineers** keep the engine elegant.  
**Design** remains cohesive automatically.

This scales to:
- Onboarding
- Settings
- Surveys
- Claims
- Shop triage
- **Anything!**

Without sacrificing:
- Beauty
- Performance
- Privacy

---

**This is the platform MotoMind deserves.** 🚀
