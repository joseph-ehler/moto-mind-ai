# 🎯 features/ Directory

**Purpose:** Feature modules - the PRIMARY codebase where all feature-specific business logic lives.

---

## 🎯 What Is a Feature?

A **feature** is a distinct area of functionality that:
- ✅ Has clear user-facing functionality
- ✅ Contains business logic and domain models
- ✅ Can be developed and tested independently
- ✅ Owns its UI, data, and business rules

**Features are the heart of the codebase!** ⭐

---

## 📁 Current Features

```
features/
├── assistant/       # AI assistant and chat
├── auth/            # Authentication and authorization
├── capture/         # Photo and document capture
├── chat/            # Conversational interface
├── events/          # Vehicle event management
├── insights/        # Analytics and insights
├── migrations/      # Data migrations
├── timeline/        # Event timeline display
├── vehicles/        # Vehicle management
└── vision/          # Computer vision and OCR
```

---

## 🏗️ Standard Feature Structure

### **Recommended Layout:**

```
features/[feature-name]/
│
├── domain/              # Business logic & types (PURE)
│   ├── types.ts        # Domain types
│   ├── schemas.ts      # Validation schemas
│   ├── constants.ts    # Feature constants
│   └── validation.ts   # Business rules
│
├── data/                # Data access layer
│   ├── api.ts          # API endpoints
│   ├── queries.ts      # React Query queries
│   ├── mutations.ts    # React Query mutations
│   └── cache.ts        # Caching logic
│
├── hooks/               # React hooks
│   ├── useFeature.ts   # Main feature hook
│   └── useFeatureData.ts
│
├── ui/                  # UI components
│   ├── FeatureView.tsx # Main view
│   ├── FeatureForm.tsx # Form components
│   └── components/     # Sub-components
│       ├── FeatureList.tsx
│       └── FeatureCard.tsx
│
├── utils/               # Feature-specific utilities
│   └── helpers.ts
│
└── README.md            # Feature documentation
```

### **Not all features need all folders!**
Only create what you need. Small features might just have:
```
features/simple-feature/
├── ui/              # UI components
└── hooks/           # React hooks
```

---

## 🎨 Folder Purposes

### **domain/** - Business Logic
```
Purpose: Pure business logic and domain models
Contains:
- Type definitions
- Business rules
- Validation logic
- Constants
- Domain calculations

Rules:
✅ NO side effects
✅ NO API calls
✅ NO UI code
✅ 100% testable
✅ Pure functions only
```

### **data/** - Data Access
```
Purpose: All data fetching and mutations
Contains:
- API endpoint definitions
- React Query queries
- React Query mutations
- Cache management
- Data transformations

Rules:
✅ Uses React Query
✅ Error handling included
✅ Loading states managed
✅ Optimistic updates where appropriate
```

### **hooks/** - React Hooks
```
Purpose: Feature-specific React hooks
Contains:
- Custom hooks for this feature
- State management hooks
- Effect hooks

Rules:
✅ Follow React hooks rules
✅ Prefix with "use"
✅ Only feature-specific hooks
✅ Shared hooks go in /hooks at root
```

### **ui/** - User Interface
```
Purpose: UI components for this feature
Contains:
- Feature views/pages
- Feature forms
- Feature-specific components
- Sub-component folder

Rules:
✅ Use design system components
✅ Follow layout system
✅ Container pattern for data
✅ Presentational components
```

### **utils/** - Utilities
```
Purpose: Feature-specific helper functions
Contains:
- Formatters
- Parsers
- Helpers
- Calculations

Rules:
✅ Only used within this feature
✅ If used by 2+ features → lib/utils/
✅ Pure functions preferred
✅ Fully tested
```

---

## 🚦 When to Create a New Feature

### **Create a Feature When:**

```
✅ It has distinct user-facing functionality
✅ It can be developed independently
✅ It has its own domain models
✅ It will contain 5+ files
✅ It has clear boundaries
✅ It owns specific business logic
```

### **Examples:**

```
✅ features/auth/         - Authentication system
✅ features/capture/      - Photo capture workflow
✅ features/timeline/     - Event timeline display
✅ features/chat/         - Conversational interface
```

### **DON'T Create a Feature For:**

```
❌ Shared UI components    → components/design-system/
❌ General utilities       → lib/utils/
❌ Infrastructure code     → lib/infrastructure/
❌ Single component        → Put in existing feature
❌ Routes only             → app/ directory
```

---

## 📋 Feature Development Workflow

### **1. Plan the Feature**

```markdown
Answer these questions:
- What problem does it solve?
- What are the domain models?
- What data does it need?
- What UI will it have?
- Does it depend on other features?
```

### **2. Create Feature Structure**

```bash
# Create feature directory
mkdir -p features/my-feature/{domain,data,hooks,ui,utils}

# Create initial files
touch features/my-feature/domain/types.ts
touch features/my-feature/ui/MyFeatureView.tsx
touch features/my-feature/README.md
```

### **3. Start with Domain**

```typescript
// features/my-feature/domain/types.ts
export interface MyFeature {
  id: string
  name: string
  createdAt: Date
}

// features/my-feature/domain/schemas.ts
import { z } from 'zod'

export const myFeatureSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  createdAt: z.date()
})
```

### **4. Add Data Layer**

```typescript
// features/my-feature/data/api.ts
export async function getMyFeature(id: string) {
  const response = await fetch(`/api/my-feature/${id}`)
  return response.json()
}

// features/my-feature/data/queries.ts
import { useQuery } from '@tanstack/react-query'
import { getMyFeature } from './api'

export function useMyFeature(id: string) {
  return useQuery({
    queryKey: ['my-feature', id],
    queryFn: () => getMyFeature(id)
  })
}
```

### **5. Build UI**

```typescript
// features/my-feature/ui/MyFeatureView.tsx
import { useMyFeature } from '../data/queries'

export function MyFeatureView({ id }: Props) {
  const { data, isLoading } = useMyFeature(id)
  
  if (isLoading) return <Loading />
  
  return (
    <Container>
      <Heading>{data.name}</Heading>
      {/* ... */}
    </Container>
  )
}
```

### **6. Add Tests**

```typescript
// tests/unit/features/my-feature/domain/types.test.ts
import { myFeatureSchema } from '@/features/my-feature/domain/schemas'

describe('MyFeature Schema', () => {
  it('validates correct data', () => {
    const valid = { id: '1', name: 'Test', createdAt: new Date() }
    expect(myFeatureSchema.parse(valid)).toEqual(valid)
  })
})
```

### **7. Document the Feature**

```markdown
// features/my-feature/README.md
# My Feature

## Purpose
[What this feature does]

## Key Files
- `domain/` - Business logic
- `ui/` - User interface
- `data/` - API integration

## Usage
[How to use this feature]
```

---

## 🔗 Inter-Feature Communication

### **✅ Good Patterns:**

**Shared Events:**
```typescript
// Use event bus for decoupled communication
eventBus.publish('vehicle.updated', vehicleData)
```

**Shared Hooks:**
```typescript
// Export hooks from features for others to use
export { useVehicleData } from './hooks/useVehicleData'

// In other feature:
import { useVehicleData } from '@/features/vehicles/hooks/useVehicleData'
```

**Props/Composition:**
```typescript
// Compose features via props
<CaptureFlow onComplete={(data) => saveToVehicle(data)} />
```

### **❌ Bad Patterns:**

**Direct Imports of Internals:**
```typescript
// ❌ Don't import domain types directly
import { VehicleState } from '@/features/vehicles/domain/state'

// ✅ Export from feature index
export { VehicleState } from './domain/state'
// Then: import { VehicleState } from '@/features/vehicles'
```

**Circular Dependencies:**
```typescript
// ❌ Feature A imports Feature B, Feature B imports Feature A
// ✅ Extract shared code to lib/ or use events
```

---

## 🎯 Feature Boundaries

### **Strong Boundaries:**

Each feature should be able to answer:
- **What does it do?** Clear purpose
- **What does it own?** Domain models, UI, data
- **What does it need?** Dependencies on other features
- **What does it expose?** Public API for other features

### **Example: Auth Feature**

```
features/auth/
│
OWNS:
- User authentication logic
- Login/logout UI
- Auth state management
- Session handling

EXPOSES:
- useAuth() hook
- AuthProvider component
- auth utilities

DEPENDS ON:
- lib/clients/supabase
- lib/storage for tokens
```

---

## 📊 Feature Health Checklist

### **Healthy Feature:**
- [ ] Has clear purpose (documented in README)
- [ ] Domain logic is pure (no side effects)
- [ ] Data layer uses React Query
- [ ] UI uses design system
- [ ] Has tests (>70% coverage)
- [ ] Has no circular dependencies
- [ ] Exports clean public API
- [ ] Types are well-defined

### **Unhealthy Feature:**
- [ ] Business logic mixed with UI
- [ ] Direct database calls from components
- [ ] No tests
- [ ] Massive files (>500 lines)
- [ ] Unclear purpose
- [ ] Tightly coupled to other features

---

## 🚫 Common Mistakes

### **Don't:**

**Mix Concerns:**
```typescript
// ❌ UI component with business logic
export function VehicleCard({ vehicle }) {
  const total = vehicle.events.reduce(...)  // Business logic!
  const formatted = formatCurrency(total)   // Formatting!
  
  return <Card>...</Card>
}

// ✅ Separate concerns
// domain/calculations.ts
export function calculateTotal(events) { ... }

// ui/VehicleCard.tsx
export function VehicleCard({ vehicle, total }) {
  return <Card>{formatCurrency(total)}</Card>
}
```

**Create God Features:**
```
❌ features/app/  (everything in one feature)
✅ features/auth/, features/capture/, etc. (focused features)
```

**Skip Domain Layer:**
```
❌ Putting types in UI files
✅ Dedicated domain/ folder with types
```

---

## 📚 Related Documentation

- [Folder Structure Guide](../docs/architecture/FOLDER_STRUCTURE.md)
- [Naming Conventions](../docs/architecture/NAMING_CONVENTIONS.md)
- [Feature Development Guide](../docs/development/FEATURE_DEVELOPMENT.md)

---

## 💡 Best Practices

1. **Start small** - Don't create all folders upfront
2. **Domain first** - Define types and business logic first
3. **Test early** - Write tests as you build
4. **Document** - Add README.md to complex features
5. **Review dependencies** - Keep features loosely coupled
6. **Extract shared code** - Don't duplicate across features

---

## ❓ Questions?

**"Should this be a new feature or part of existing?"**
→ If it has distinct functionality → New feature
→ If it extends existing → Add to existing

**"Where does shared code go?"**
→ Used by 2+ features → lib/
→ Used by 1 feature → features/[name]/

**"How do features communicate?"**
→ Exported hooks, props, or events
→ Not direct imports of internals

---

**Maintained By:** Engineering Team  
**Questions?** See [CONTRIBUTING.md](../CONTRIBUTING.md)
