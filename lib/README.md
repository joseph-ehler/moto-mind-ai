# 📚 lib/ Directory

**Purpose:** Shared utilities and infrastructure code used across multiple features.

---

## 🎯 What Goes Here

**Use `lib/` for code that:**
- ✅ Is used by **2 or more features**
- ✅ Has **no feature-specific business logic**
- ✅ Is **truly reusable** and general-purpose
- ✅ Provides **infrastructure** or **utility** functions

---

## 📁 Current Structure

```
lib/
├── ai/                  # AI/LLM integrations (OpenAI, prompts)
├── analytics/           # Analytics and tracking utilities
├── auth/                # Authentication utilities
├── cache/               # Caching strategies
├── clients/             # External API clients
├── config/              # Configuration management
├── dashboard/           # Dashboard-related utilities
├── design-system/       # Design system utilities
├── domain/              # Domain models and business rules
├── geocoding/           # Location services
├── hooks/               # Shared React hooks (deprecated - use /hooks)
├── http/                # HTTP utilities
├── images/              # Image processing utilities
├── infrastructure/      # Infrastructure code (circuit breakers, etc.)
├── location/            # Location services and geocoding
├── memory/              # Caching and memoization
├── metrics/             # Performance metrics
├── ml/                  # Machine learning utilities
│   └── training-data/   # ML training datasets
├── monitoring/          # Usage tracking, error monitoring
├── ocr/                 # OCR utilities
│   └── training-data/   # OCR training files
├── processing/          # Data processing utilities
├── pwa/                 # Progressive Web App utilities
├── quality/             # Quality scoring and analysis
├── reasoning/           # LLM reasoning utilities
├── services/            # Shared service layer
├── storage/             # Storage and database utilities
├── types/               # Shared type definitions
├── ui/                  # UI utilities
├── utils/               # General utilities ⭐ START HERE
└── validation/          # Validation schemas (Zod)
```

---

## 🎨 Categories Explained

### **Infrastructure**
Code that provides foundational capabilities:
- `infrastructure/` - Circuit breakers, rate limiters
- `monitoring/` - Usage tracking, error monitoring
- `cache/` - Caching strategies
- `storage/` - Database and storage utilities

### **External Integrations**
Clients for external services:
- `ai/` - OpenAI, LLM integrations
- `clients/` - External API clients
- `geocoding/` - Geocoding services
- `location/` - Location intelligence

### **Data Processing**
Transform and analyze data:
- `images/` - Image processing, resizing, compression
- `ocr/` - OCR and text extraction
- `processing/` - General data processing
- `ml/` - Machine learning utilities
- `quality/` - Quality scoring

### **Application Utilities**
Helper functions for common tasks:
- `utils/` - **General utilities (START HERE!)**
- `validation/` - Schema validation (Zod)
- `analytics/` - Event tracking
- `metrics/` - Performance metrics

---

## 🚦 When to Use lib/

### **✅ Good Examples:**

```typescript
// ✅ Used by multiple features
lib/utils/formatDate.ts
→ Used by: timeline, capture, events, dashboard

// ✅ Infrastructure code
lib/infrastructure/circuit-breaker.ts
→ Used by: all external API calls

// ✅ External client
lib/clients/openai.ts
→ Used by: vision, chat, assistant features
```

### **❌ Bad Examples:**

```typescript
// ❌ Feature-specific logic
lib/captureHelpers.ts
→ Should be: features/capture/utils/helpers.ts

// ❌ Single feature use
lib/timelineFormatting.ts
→ Should be: features/timeline/utils/formatting.ts

// ❌ UI Components
lib/components/LoginForm.tsx
→ Should be: components/design-system/ or features/auth/ui/
```

---

## 📋 Decision Tree

```
I need to add a utility function...
              ↓
Is it used by 2+ features?
   ├─ NO → Put in features/[name]/utils/
   └─ YES → Continue
              ↓
Is it truly general-purpose?
   ├─ NO → Put in features/[name]/utils/
   └─ YES → Continue
              ↓
What category does it fit?
   ├─ General utility? → lib/utils/
   ├─ Infrastructure? → lib/infrastructure/
   ├─ External client? → lib/clients/
   ├─ Image processing? → lib/images/
   ├─ Data validation? → lib/validation/
   └─ Other? → Find appropriate subdirectory
```

---

## 🛠️ Common Tasks

### **Adding a New Utility:**

```typescript
// 1. Choose appropriate subdirectory
lib/utils/myNewHelper.ts

// 2. Create the utility
export function myNewHelper(input: string): string {
  return input.trim().toLowerCase()
}

// 3. Export from index (if applicable)
lib/utils/index.ts
export { myNewHelper } from './myNewHelper'

// 4. Import in your code
import { myNewHelper } from '@/lib/utils/myNewHelper'
// Or: import { myNewHelper } from '@/lib/utils'
```

### **Adding a New Client:**

```typescript
// 1. Create client file
lib/clients/myService.ts

// 2. Implement with error handling
export class MyServiceClient {
  private apiKey: string
  
  constructor(apiKey: string) {
    this.apiKey = apiKey
  }
  
  async fetchData(): Promise<Data> {
    // Implementation with circuit breaker
  }
}

// 3. Export configured instance
export const myServiceClient = new MyServiceClient(
  process.env.MY_SERVICE_API_KEY!
)
```

---

## 🚫 What NOT to Put Here

### **DON'T put in lib/:**

**React Components**
```
❌ lib/components/LoginForm.tsx
✅ components/design-system/LoginForm.tsx
✅ features/auth/ui/LoginForm.tsx
```

**Feature-Specific Code**
```
❌ lib/captureHelpers.ts
✅ features/capture/utils/helpers.ts
```

**React Hooks** (use /hooks instead)
```
❌ lib/hooks/useAuth.ts
✅ hooks/useAuth.ts (if shared)
✅ features/auth/hooks/useAuth.ts (if feature-specific)
```

**Routes**
```
❌ lib/routes/dashboard.tsx
✅ app/dashboard/page.tsx
```

**Tests**
```
❌ lib/utils/test/formatDate.test.ts
✅ tests/unit/lib/utils/formatDate.test.ts
```

---

## 📦 lib/utils/ - The Starting Point

**When in doubt, start with `lib/utils/`!**

This is the catch-all for general-purpose utilities that don't fit other categories.

### **Good for:**
- String manipulation
- Date/time formatting
- Number formatting
- Array helpers
- Object helpers
- Type guards
- Common calculations

### **Examples:**
```
lib/utils/
├── formatDate.ts
├── formatCurrency.ts
├── parseUrl.ts
├── debounce.ts
├── throttle.ts
└── classNames.ts
```

---

## 🔍 Finding Code

### **How to find utilities:**

```bash
# Search by keyword
grep -r "formatDate" lib/

# Find all utilities
find lib/utils/ -name "*.ts"

# See what's exported
cat lib/utils/index.ts
```

### **How to find clients:**

```bash
# List all clients
ls lib/clients/

# Search for API usage
grep -r "OpenAI" lib/
```

---

## 📚 Related Documentation

- [Folder Structure Guide](../docs/architecture/FOLDER_STRUCTURE.md)
- [Naming Conventions](../docs/architecture/NAMING_CONVENTIONS.md)
- [Contributing Guidelines](../CONTRIBUTING.md)

---

## 💡 Best Practices

1. **Keep it pure:** Utilities should have no side effects when possible
2. **Keep it tested:** All utilities should have unit tests
3. **Keep it documented:** Add JSDoc comments for complex functions
4. **Keep it typed:** Strong TypeScript types required
5. **Keep it organized:** Use subdirectories for categories
6. **Keep it DRY:** Extract common patterns, but don't over-abstract

---

## ❓ Questions?

**"Should this go in lib/ or features/?"**
→ If used by 2+ features → lib/
→ If used by 1 feature → features/[name]/

**"Which lib/ subdirectory?"**
→ Use decision tree above
→ When in doubt → lib/utils/

**"Can I create a new subdirectory?"**
→ If you have 5+ related files → Yes
→ Otherwise → Use existing subdirectory

---

**Maintained By:** Engineering Team  
**Questions?** Ask in team chat or see [CONTRIBUTING.md](../CONTRIBUTING.md)
