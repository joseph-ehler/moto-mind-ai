# JSON-Driven Onboarding Flows

**Status:** Ready for implementation  
**Config File:** `ONBOARDING_FLOW_V2_GOD_TIER.json`

---

## 🎯 **Vision**

All onboarding flows should be generated from JSON configurations.
- ✅ Non-technical users can edit content
- ✅ A/B test different flows without code changes
- ✅ Consistent patterns across all flows
- ✅ Easy to maintain and iterate

---

## 📋 **JSON Structure**

```json
{
  "metadata": {
    "name": "Vehicle Onboarding",
    "version": "2.0",
    "totalSteps": "dynamic",
    "estimatedTime": "≈ 2 minutes"
  },
  
  "baseFlow": [
    {
      "id": "welcome",
      "type": "informational",
      "title": "Welcome to MotoMind",
      "subtitle": "Your vehicle's digital home",
      "description": "Let's add your first vehicle...",
      "steps": [
        "Enter your VIN",
        "Confirm details",
        "Done!"
      ],
      "benefits": [
        { "icon": "car", "label": "Accurate specs" },
        { "icon": "clock", "label": "2 minutes" },
        { "icon": "shield", "label": "Privacy first" }
      ]
    },
    
    {
      "id": "chapter-intro",
      "type": "chapter",
      "chapterNumber": 1,
      "title": "Vehicle Basics",
      "description": "Let's start with your VIN...",
      "highlights": [
        "Accurate vehicle specs",
        "Recall information",
        "Service history"
      ]
    },
    
    {
      "id": "vin",
      "type": "input",
      "title": "Enter your VIN",
      "question": "What's your vehicle's VIN?",
      "description": "We'll use this 17-character code...",
      "inputType": "text",
      "validation": {
        "required": true,
        "length": 17,
        "pattern": "^[A-HJ-NPR-Z0-9]{17}$"
      },
      "help": {
        "locations": [
          "Dashboard (driver side)",
          "Door jamb",
          "Registration"
        ]
      }
    },
    
    {
      "id": "vin-decoding",
      "type": "processing",
      "title": "Decoding your VIN",
      "process": {
        "endpoint": "/api/vin/decode",
        "timeoutMs": 20000,
        "slowHintMs": 12000
      },
      "autoAdvance": true
    }
  ]
}
```

---

## 🏗️ **Component Mapping**

### **type: "informational"** → `<WelcomeScreen>`

```tsx
<WelcomeScreen
  title={step.title}
  subtitle={step.subtitle}
  description={step.description}
  steps={step.steps}
  benefits={step.benefits}
  illustration={getIcon(step.icon)}
/>
```

### **type: "chapter"** → `<ChapterIntro>`

```tsx
<ChapterIntro
  chapterNumber={step.chapterNumber}
  title={step.title}
  description={step.description}
  highlights={step.highlights}
  icon={getIcon(step.icon)}
/>
```

### **type: "input"** → `<FormSection> + <FormInput>`

```tsx
<FormSection
  title={step.question}
  description={step.description}
  icon={getIcon(step.icon)}
>
  <FormInput
    type={step.inputType}
    label={step.title}
    value={value}
    onChange={setValue}
    validation={step.validation}
  />
</FormSection>
```

### **type: "processing"** → `<LoadingScene>`

```tsx
<LoadingScene
  ticker={step.process.ticker}
  slowHintMs={step.process.slowHintMs}
  timeoutMs={step.process.timeoutMs}
  onTimeout={handleTimeout}
/>
```

---

## 🔄 **Flow Generator Pattern**

```tsx
// Flow Generator (future implementation)
function generateFlowFromJSON(config: OnboardingConfig) {
  return config.baseFlow.map((step) => {
    switch (step.type) {
      case 'informational':
        return <WelcomeScreen {...step} />
      
      case 'chapter':
        return <ChapterIntro {...step} />
      
      case 'input':
        return renderInputStep(step)
      
      case 'processing':
        return <LoadingScene {...step.process} />
      
      case 'confirmation':
        return renderConfirmationStep(step)
      
      default:
        throw new Error(`Unknown step type: ${step.type}`)
    }
  })
}
```

---

## 📝 **Current Implementation**

Right now, the VIN flow is **manually coded** but follows the JSON-ready pattern:

```tsx
// app/onboarding/vehicle/new-flow/page.tsx

{currentStep === 'welcome' && (
  <WelcomeScreen
    title="Welcome to MotoMind"
    subtitle="Your vehicle's digital home"
    description="Let's add your first vehicle..."
    steps={['Enter VIN', 'Confirm', 'Done!']}
    benefits={[...]}
  />
)}

{currentStep === 'chapter-intro' && (
  <ChapterIntro
    chapterNumber={1}
    title="Vehicle Basics"
    description="..."
    highlights={[...]}
  />
)}

{currentStep === 'vin' && (
  <VinCaptureV2 {...props} />
)}
```

**Next Step:** Build the flow generator to consume JSON directly.

---

## 🎯 **Benefits of JSON-Driven Flows**

### **1. Content Updates Without Code**
```json
// Change this in JSON:
"title": "Welcome to MotoMind v2"

// No code deployment needed!
```

### **2. A/B Testing**
```json
{
  "variants": [
    {
      "id": "variant-a",
      "title": "Welcome to MotoMind",
      "steps": [...]
    },
    {
      "id": "variant-b",
      "title": "Hey there! 👋",
      "steps": [...]
    }
  ]
}
```

### **3. Easy Localization**
```json
{
  "en": {
    "title": "Welcome to MotoMind",
    "description": "Let's add your first vehicle..."
  },
  "es": {
    "title": "Bienvenido a MotoMind",
    "description": "Agreguemos tu primer vehículo..."
  }
}
```

### **4. Rapid Iteration**
- Change copy in JSON
- Test immediately
- No Git commits for content changes
- Non-engineers can contribute

---

## 🚀 **Implementation Roadmap**

### **Phase 1: Manual (✅ Current)**
- All components JSON-ready
- Props match JSON structure
- Footer navigation centralized
- Patterns established

### **Phase 2: Semi-Automated**
- Flow generator utility
- JSON → Components mapping
- Runtime validation
- Config hot-reload (dev)

### **Phase 3: Fully Automated**
- CMS for JSON editing
- Live preview
- A/B test framework
- Analytics integration

---

## 📚 **JSON Schema**

```typescript
interface OnboardingConfig {
  metadata: {
    name: string
    version: string
    totalSteps: number | 'dynamic'
    estimatedTime: string
  }
  
  baseFlow: Step[]
}

type Step = 
  | InformationalStep
  | ChapterStep
  | InputStep
  | ProcessingStep
  | ConfirmationStep

interface InformationalStep {
  id: string
  type: 'informational'
  title: string
  subtitle?: string
  description: string
  steps?: string[]
  benefits?: Array<{
    icon?: string
    label: string
  }>
}

interface ChapterStep {
  id: string
  type: 'chapter'
  chapterNumber?: number
  title: string
  description: string
  highlights?: string[]
}

interface InputStep {
  id: string
  type: 'input'
  title: string
  question: string
  description?: string
  inputType: 'text' | 'email' | 'tel' | 'number'
  validation: {
    required?: boolean
    length?: number
    pattern?: string
    minLength?: number
    maxLength?: number
  }
  help?: {
    title?: string
    locations?: string[]
  }
}

interface ProcessingStep {
  id: string
  type: 'processing'
  title: string
  process: {
    endpoint: string
    timeoutMs: number
    slowHintMs: number
  }
  autoAdvance: boolean
}
```

---

## ✅ **Current Status**

| Feature | Status |
|---------|--------|
| JSON-ready components | ✅ Complete |
| Props match JSON | ✅ Complete |
| Footer navigation | ✅ Complete |
| Flow generator | ⏳ Next phase |
| CMS editor | 📋 Future |
| A/B testing | 📋 Future |

---

## 🎯 **Next Steps**

1. **Build Flow Generator**
   - Read JSON config
   - Map to components
   - Handle navigation
   - Validate steps

2. **Add Runtime Validation**
   - Zod schema for JSON
   - Type-safe parsing
   - Error handling

3. **Hot Reload (Dev)**
   - Watch JSON file
   - Reload on changes
   - Fast iteration

4. **CMS Integration (Future)**
   - Visual editor
   - Live preview
   - Version control

---

**All components are ready for JSON-driven generation!** 🚀
