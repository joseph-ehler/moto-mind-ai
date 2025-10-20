# AI-Authorable Flows: The Ultimate Vision

**Status:** Roadmap  
**Goal:** Any AI can author complete, valid, production-ready flows from brief descriptions

---

## 🎯 **The Core Insight**

> **"Design your platform as if the AI is your primary author."**

This means:
- Tightening contracts so AI can't fail
- Building a "Wizard Forge" - a compiler the AI calls
- Exposing atomic tools (function-calling API)
- Making errors machine-readable and auto-fixable
- Providing golden examples and presets
- Building safe-mode so invalid JSON never breaks UX

**Result:** Windsurf/Cascade can take a 3-5 line brief → generate validated, privacy-safe, accessible flow → renders immediately.

---

## 🏗️ **The "Wizard Forge" - AI's Compiler**

### **Concept:**
A tiny service the AI calls (not raw file writes).

### **Inputs:**
```yaml
brief: |
  Create a vehicle onboarding flow.
  Capture VIN (17 chars, uppercase, no I/O/Q).
  Decode VIN from NHTSA.
  Confirm vehicle details.
  
components: ["singleQuestion", "processing.scene", "confirm.card"]
brand: "motomind"
tone: "calm"
privacy: "OPERATIONAL"
```

### **Forge Passes:**

1. **Generate Draft**
   ```
   brief + schema → draft flow.json
   ```

2. **Validate (Strict)**
   ```
   draft → Zod validator → errors
   ```

3. **Auto-Fix Common Misses**
   ```
   Missing privacy tags → add from presets
   Missing continueEnabledWhen → add defaults
   Missing navigation → add standard rules
   ```

4. **Simulate**
   ```
   Test with random + edge inputs
   Ensure no dead paths
   Check all expressions compile
   ```

5. **Annotate Warnings**
   ```
   Long form without helper
   Async without debounce
   Sensitive data without consent
   ```

### **Outputs:**
```json
{
  "flow": { /* validated flow.json */ },
  "diff": { /* what changed from last version */ },
  "warnings": [
    {
      "code": "LONG_FORM_NO_HELPER",
      "path": "chapters.vehicle-basics.steps.details",
      "suggestion": "Add helper text for forms with >3 fields"
    }
  ],
  "simulated_itinerary": {
    "paths": 5,
    "dead_steps": [],
    "expression_failures": 0
  },
  "checklists": {
    "a11y": ["✅ All fields have labels", "✅ Touch targets ≥44px"],
    "analytics": ["✅ Events attached", "⚠ Missing completion event"],
    "privacy": ["✅ All fields have privacy tags"]
  }
}
```

**This Forge guarantees output is renderable!**

---

## 🛠️ **AI Function-Calling API**

Expose atomic tools the AI can compose:

### **Schema Discovery:**
```typescript
flows.listSchemas() 
→ { versions, stepTypes, fieldTypes, operators, presets }

flows.getPreset('vinUppercase')
→ { type: 'text', transform: {...}, validation: {...}, privacy: {...} }
```

### **Flow Construction:**
```typescript
flows.new({ name: 'vehicle-onboarding', version: '1.0.0' })
→ { flowId, scaffolded chapters }

flows.addChapter({ flowId, id: 'vehicle-basics', name: 'Vehicle' })
→ { chapterId }

flows.addStep({ 
  chapterId, 
  template: 'form.singleQuestion',
  title: "What's your VIN?"
})
→ { stepId }

flows.addField({ 
  stepId, 
  preset: 'vinUppercase', 
  bind: 'vehicle.vin' 
})
→ { fieldId }
```

### **Privacy & Validation:**
```typescript
flows.setPrivacy({ 
  fieldId, 
  classification: 'SENSITIVE',
  purpose: ['onboarding'],
  retention: '180d',
  allowInAI: false
})
→ { success: true }

flows.bindValidation({ 
  fieldId, 
  validation: { required: true, length: 17 },
  continueEnabledWhen: 'fields.vin.valid'
})
→ { success: true }
```

### **Data Sources:**
```typescript
flows.addDataSource({ 
  name: 'vinChecksum',
  method: 'http.post',
  url: '/api/validate/vin',
  ttl: 0,
  privacyGate: { mask: 'last4' }
})
→ { dataSourceId }
```

### **Validation & Simulation:**
```typescript
flows.lint({ flowId })
→ { errors: [], warnings: [], suggestions: [] }

flows.validate({ flowId, strict: true })
→ { valid: true, flow: {...} }

flows.simulate({ flowId, paths: 10 })
→ { dead_steps: [], expression_failures: 0 }
```

### **Preview:**
```typescript
flows.snapshot({ flowId })
→ { html: '...', png: 'base64...' }
```

**AI composes these tools instead of editing giant JSON blobs!**

---

## 📚 **Presets & Patterns**

### **Field Presets:**
```json
{
  "vinUppercase": {
    "type": "text",
    "transform": { "uppercase": true, "strip": [" ", "-"] },
    "validation": {
      "required": true,
      "length": 17,
      "pattern": "^[A-HJ-NPR-Z0-9]{17}$",
      "excludeChars": ["I", "O", "Q"]
    },
    "inputMode": "text",
    "enterKeyHint": "done",
    "privacy": {
      "classification": "SENSITIVE",
      "purpose": ["onboarding"],
      "retention": "180d",
      "allowInAI": false
    }
  },
  "email": {
    "type": "text",
    "validation": { "pattern": "^[^@]+@[^@]+\\.[^@]+$" },
    "inputMode": "email",
    "enterKeyHint": "next",
    "privacy": { "classification": "OPERATIONAL" }
  },
  "phone": {
    "type": "text",
    "transform": { "mask": "(###) ###-####" },
    "inputMode": "tel",
    "privacy": { "classification": "OPERATIONAL" }
  },
  "mileageBand": {
    "type": "chips",
    "options": ["0-25k", "25k-50k", "50k-100k", "100k-150k", "150k+"],
    "privacy": { "classification": "PSEUDONYMIZED" }
  },
  "usState": {
    "type": "select",
    "options": ["AL", "AK", ...],
    "privacy": { "classification": "PSEUDONYMIZED" }
  }
}
```

### **Step Presets:**
```json
{
  "vin.capture": {
    "type": "form.singleQuestion",
    "titleKey": "vin.capture.title",
    "fields": [{ "preset": "vinUppercase", "bind": "vehicle.vin" }],
    "help": { /* standard VIN help */ }
  },
  "vin.decode.scene": {
    "type": "processing.scene",
    "loading": {
      "baseTickers": ["Contacting NHTSA...", "Decoding VIN...", "Almost done..."],
      "slowHintMs": 12000,
      "timeoutMs": 20000
    }
  },
  "vehicle.confirm.card": {
    "type": "confirm.card",
    "titleKey": "vehicle.confirm.title"
  },
  "user.consent": {
    "type": "form.singleQuestion",
    "fields": [{ "type": "toggle", "bind": "user.consent.analytics" }],
    "privacy": { "needsConsent": true }
  }
}
```

### **Privacy Bundles:**
```json
{
  "PII.minimal": {
    "classification": "PSEUDONYMIZED",
    "purpose": ["onboarding"],
    "retention": "180d",
    "allowInAI": false,
    "maskInLogs": true
  },
  "SENSITIVE.onboarding": {
    "classification": "SENSITIVE",
    "purpose": ["onboarding"],
    "retention": "180d",
    "allowInAI": false,
    "doNotTrain": true,
    "maskInLogs": true,
    "needsConsent": true
  }
}
```

**AI chooses from these blocks rather than inventing!**

---

## 🛡️ **Guardrails the AI Understands**

### **Deterministic, Machine-Readable Errors:**
```json
{
  "code": "MISSING_PRIVACY",
  "path": "chapters.vehicle-basics.steps.vin.fields.vin",
  "message": "Field 'vin' missing required privacy configuration",
  "severity": "error",
  "fix": {
    "type": "add",
    "path": "chapters.vehicle-basics.steps.vin.fields.vin.privacy",
    "value": {
      "classification": "SENSITIVE",
      "purpose": ["onboarding"],
      "retention": "180d",
      "allowInAI": false
    }
  }
}
```

**AI can apply the patch automatically!**

### **Golden Constraints:**
- ✅ Max fields per step: ≤4 on mobile
- ✅ Require helper text on steps with ≥3 validations
- ✅ Require slow-hint/timeout for processing.scene
- ✅ Forbid allowInAI:true on SENSITIVE unless needsConsent:true
- ✅ Touch targets ≥44px (enforced in renderer)
- ✅ Color contrast ≥4.5:1

### **Safety Tests (Auto-Run):**
```typescript
flows.lintPrivacy({ flowId })
→ No VIN in logs/AI, no PII without tags

flows.lintExpressions({ flowId })
→ No unsupported ops, all expressions compile

flows.lintA11y({ flowId })
→ Labels, touch targets, color contrast
```

---

## 🎨 **FormScreen Layout Templates**

### **1. Single Question (Hero Prompt)**
```json
{
  "type": "form.singleQuestion",
  "layout": {
    "prompt": "hero",
    "fieldSize": "large",
    "spacing": "generous"
  }
}
```

**Use for:** Primary data capture (VIN, email, name)

### **2. Two Column**
```json
{
  "type": "form.twoColumn",
  "layout": {
    "primary": { "field": "make", "size": "2/3" },
    "secondary": { "field": "year", "size": "1/3" }
  }
}
```

**Use for:** Related fields (city/state, make/year)

### **3. Card Grid**
```json
{
  "type": "form.cardGrid",
  "layout": {
    "columns": "auto",
    "cardSize": "compact"
  }
}
```

**Use for:** Selectable options with icons/images

### **4. Review**
```json
{
  "type": "form.review",
  "layout": {
    "editable": true,
    "showSummary": true
  }
}
```

**Use for:** Confirmation screens with edit affordances

---

## 🎯 **Visual Tokens (Themeable)**

```typescript
{
  "spacing": {
    "sectionGap": "32px",
    "fieldGap": "24px",
    "helperGap": "8px"
  },
  "surfaces": {
    "default": "bg-white",
    "emphasis": "bg-gray-50",
    "accent": "bg-blue-50"
  },
  "accent": {
    "primary": "blue-600",
    "muted": "blue-400"
  },
  "radius": {
    "sm": "4px",
    "md": "8px",
    "lg": "12px"
  },
  "shadow": {
    "sm": "0 1px 2px rgba(0,0,0,0.05)",
    "md": "0 4px 6px rgba(0,0,0,0.1)",
    "lg": "0 10px 15px rgba(0,0,0,0.1)"
  },
  "animation": {
    "duration": {
      "fast": "150ms",
      "normal": "250ms",
      "slow": "350ms"
    },
    "easing": "cubic-bezier(0.4, 0, 0.2, 1)"
  }
}
```

---

## 📝 **Authoring Prompts for AI**

### **System Prompt:**
```
You author MotoMind wizards using the Wizard Forge API.

RULES:
1. Output valid JSON conforming to FlowSchema v1.0.0
2. Use presets for common fields (vinUppercase, email, phone)
3. ALL fields must include privacy tags
4. Do not exceed 4 fields per form step
5. Use singleQuestion for mobile unless told otherwise
6. Use processing.scene for any operation >2 seconds
7. Add helper text for forms with ≥3 validations
8. Set slowHintMs=12000, timeoutMs=20000 for loading

AVAILABLE PRESETS:
- Field: vinUppercase, email, phone, mileageBand, usState
- Step: vin.capture, vin.decode.scene, vehicle.confirm.card
- Privacy: PII.minimal, SENSITIVE.onboarding

TOOLS:
Use flows.* function calls to build flows atomically.
Never generate giant JSON blobs - compose with tools.

VALIDATION:
After each step, call flows.validate(strict=true).
If errors, apply suggested fixes automatically.
If warnings, log but continue.

TONE:
Calm, professional, mobile-first, accessible.
Titles: 5-8 words, sentence case, no exclamation.
Descriptions: 1-2 compact sentences, no "please/just".
```

### **Few-Shot Examples:**

**Good Flow (Complete):**
```json
{
  "id": "vehicle-onboarding",
  "version": "1.0.0",
  "schemaVersion": "1.0.0",
  "i18nNS": "onboarding.vehicle",
  "theming": { "brand": "motomind", "tone": "calm" },
  "privacy": { "defaultRetention": "180d" },
  "analytics": { "namespace": "onboarding", "flow": "vehicle" },
  "chapters": [
    {
      "id": "vehicle-basics",
      "name": "Vehicle",
      "steps": [
        {
          "id": "welcome",
          "type": "informational",
          "title": "Welcome to MotoMind",
          "subtitle": "Your vehicle's digital home"
        },
        {
          "id": "vin",
          "type": "form.singleQuestion",
          "title": "What's your VIN?",
          "fields": [{
            "id": "vin",
            "preset": "vinUppercase",
            "bind": "vehicle.vin"
          }],
          "navigation": { "continueLabel": "Continue" }
        },
        {
          "id": "decode",
          "type": "processing.scene",
          "loading": {
            "baseTickers": ["Decoding VIN..."],
            "slowHintMs": 12000,
            "timeoutMs": 20000
          }
        }
      ]
    }
  ]
}
```

**Bad Flow → Fixed:**
```json
// BAD: Missing privacy, no navigation
{
  "id": "vin",
  "type": "form.singleQuestion",
  "fields": [{
    "id": "vin",
    "type": "text"
  }]
}

// FIXED: Added privacy + navigation + preset
{
  "id": "vin",
  "type": "form.singleQuestion",
  "fields": [{
    "id": "vin",
    "preset": "vinUppercase",
    "bind": "vehicle.vin",
    "privacy": {
      "classification": "SENSITIVE",
      "purpose": ["onboarding"],
      "retention": "180d",
      "allowInAI": false
    }
  }],
  "navigation": {
    "continueLabel": "Continue",
    "showFooterBack": true
  }
}
```

---

## 📅 **Rollout Plan (Updated)**

### **Already Shipped:**
- ✅ Phase 0: Shell, progress, accessibility
- ✅ Phase 1: VIN chapter, footer unification
- ✅ Phase 2: Loading primitives
- ✅ Phase 3: AI loading tickers
- ✅ Phase A: Contracts + Validator
- ✅ B-1: VSCode schema + DoR/DoD

### **Next 10-15h (B-2 through B-6):**

**B-2: Expression Engine (2-3h)**
- Allowlisted ops: ==, !=, >, <, &&, ||, in, empty
- Safe defaults: invalid → false (warn)
- Unit tests

**B-3: Data Source Registry (3-4h)**
- Declarative sources
- Privacy gates
- Dev logging

**B-4: Renderer Safe Mode (2-3h)**
- Unknown template → fallback
- ConfigErrorCard
- StepErrorBoundary

**B-5: CI Validation (30min)**
- flows:validate required
- Exit codes

**B-6: Storybook Catalog (2-3h)**
- Field gallery
- Visual regression

### **B-7: Wizard Forge (3-5h) - THE KEY!**

**The AI's Compiler:**

1. **API Endpoints** (1-2h)
   ```typescript
   POST /api/wizard/forge/generate
   POST /api/wizard/forge/validate
   POST /api/wizard/forge/simulate
   POST /api/wizard/forge/snapshot
   ```

2. **Tool Functions** (2-3h)
   ```typescript
   // Schema discovery
   flows.listSchemas()
   flows.getPreset(name)
   
   // Construction
   flows.new({ name, version })
   flows.addChapter({ flowId, ... })
   flows.addStep({ chapterId, template, ... })
   flows.addField({ stepId, preset, bind })
   
   // Configuration
   flows.setPrivacy({ fieldId, ... })
   flows.bindValidation({ fieldId, ... })
   flows.addDataSource({ name, ... })
   
   // Validation
   flows.lint({ flowId })
   flows.validate({ flowId, strict })
   flows.simulate({ flowId, paths })
   flows.snapshot({ flowId })
   ```

3. **Auto-Fixer** (30min)
   - Missing privacy → add from preset
   - Missing navigation → add defaults
   - Missing bind → suggest from field id

4. **Golden Examples** (30min)
   - 3-5 perfect flows
   - 1 bad → fixed pair

**Total: ~10h for AI-authorable platform**

---

## ✨ **Success Criteria**

**AI Authoring:**
- ✅ AI generates valid flow from 3-5 line brief on first attempt: >80%
- ✅ Auto-fix patches handle remaining issues
- ✅ Simulated itinerary shows all branches work
- ✅ No manual JSON editing needed

**UX:**
- ✅ Median form step time: <14s
- ✅ Abandon on loading screens: <2%
- ✅ Blank screens: 0

**A11y:**
- ✅ Keyboard-only works by default
- ✅ Screen reader checks pass
- ✅ Touch targets ≥44px enforced

**Privacy:**
- ✅ 0 fields without privacy tags
- ✅ 0 PII in analytics
- ✅ AI calls only include allowlisted fields

**Ops:**
- ✅ CI blocks invalid flows
- ✅ Renderer never crashes
- ✅ Safe-mode renders any unknown gracefully

---

## 🎯 **The Vision**

```
Human writes brief:
"Create vehicle onboarding: capture VIN, decode, confirm details"

     ↓

AI uses Wizard Forge:
flows.new() → flows.addChapter() → flows.addStep(preset='vin.capture')

     ↓

Forge validates + auto-fixes:
Missing privacy? → Added from preset
Missing navigation? → Added defaults

     ↓

Forge simulates:
Test 10 paths → All expressions compile → No dead steps

     ↓

Forge outputs:
flow.json (valid) + warnings + simulated itinerary

     ↓

Renderer displays:
Beautiful, accessible, privacy-safe form → Zero code changes
```

**From brief → production in one pass!** 🚀

---

## 🏆 **The Ultimate Platform**

When complete, we'll have:

✅ **JSON-driven** - All content in JSON  
✅ **Type-safe** - Zod schema + VSCode autocomplete  
✅ **Privacy-first** - Required tags, enforced contracts  
✅ **Mobile-first** - 44px targets, proper keyboards  
✅ **Accessible** - A11y baked in, not bolted on  
✅ **Observable** - Analytics + timing by default  
✅ **Themeable** - Token system, brand overrides  
✅ **Resilient** - Safe mode, graceful fallbacks  
✅ **AI-authorable** - Forge + tools + presets + examples  

**Any AI can author flows. Engineers maintain platform. Design stays cohesive automatically.**

**This is the ultra-god-tier wizard platform!** 🎊
