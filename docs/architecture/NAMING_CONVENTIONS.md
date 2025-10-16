# 📝 MotoMind AI: Naming Conventions

**Last Updated:** October 16, 2025  
**Status:** Official Standard  
**Enforcement:** Mandatory for all new code

---

## 🎯 PURPOSE

This document defines the **official naming conventions** for all code, files, folders, and architectural decisions in MotoMind AI. These conventions ensure consistency, readability, and maintainability across the codebase.

**When in doubt, refer to this document.**

---

## 📁 FOLDER NAMING RULES

### **Rule 1: Use Lowercase**
```
✅ app/              (correct)
✅ components/       (correct)
✅ features/         (correct)

❌ App/              (incorrect - capitalized)
❌ Components/       (incorrect - capitalized)
❌ FEATURES/         (incorrect - all caps)
```

**Reason:** Unix/Linux systems are case-sensitive. Lowercase prevents confusion and follows industry standards.

---

### **Rule 2: Use Kebab-Case for Multi-Word Folders**
```
✅ design-system/        (correct)
✅ ui-polish/            (correct)
✅ migration-tools/      (correct)

❌ designSystem/         (incorrect - camelCase)
❌ DesignSystem/         (incorrect - PascalCase)
❌ design_system/        (incorrect - snake_case)
❌ designsystem/         (incorrect - no separator)
```

**Reason:** Kebab-case is URL-friendly, Git-friendly, and universally readable.

---

### **Rule 3: Use Plural for Collections**
```
✅ components/           (collection of components)
✅ features/             (collection of features)
✅ hooks/                (collection of hooks)
✅ types/                (collection of type definitions)
✅ tests/                (collection of tests)
✅ scripts/              (collection of scripts)
✅ docs/                 (collection of documents)
✅ tools/                (collection of tools)

Exception: When referring to conceptual unit:
✅ database/             (singular - one database concept)
✅ app/                  (singular - one application)
✅ public/               (singular - one public directory)
```

**Reason:** Plural indicates "this folder contains multiple items of this type."

---

### **Rule 4: Use Standard Abbreviations Only**
```
ACCEPTABLE ABBREVIATIONS:
✅ lib/          (library - universal standard)
✅ docs/         (documentation - universal standard)
✅ app/          (application - universal standard)
✅ api/          (application programming interface)
✅ ui/           (user interface)
✅ db/           (database - in filenames only, not folders)

NOT ACCEPTABLE:
❌ comp/         (use components/)
❌ feat/         (use features/)
❌ scr/          (use scripts/)
❌ tst/          (use tests/)
❌ tmp/          (acceptable only for temporary directory)
```

**Reason:** Only use abbreviations that are universally understood in software development.

---

### **Rule 5: Descriptive Over Clever**
```
✅ tests/                (immediately clear)
✅ components/           (immediately clear)
✅ authentication/       (immediately clear)

❌ spec/                 (ambiguous - specs? tests? specifications?)
❌ stuff/                (unclear)
❌ misc/                 (catch-all - indicates poor organization)
❌ helpers/              (vague - helpers for what?)
```

**Reason:** New developers should understand folder purpose instantly without documentation.

---

### **Rule 6: No Special Characters or Spaces**
```
✅ user-profile/
✅ api-client/
✅ design-tokens/

❌ user profile/         (spaces not allowed)
❌ user_profile/         (underscore - use kebab-case)
❌ user@profile/         (special characters)
❌ user.profile/         (dots reserved for files)
```

**Reason:** Compatibility with all systems and tools.

---

## 📄 FILE NAMING RULES

### **Components: PascalCase**
```
✅ LoginForm.tsx
✅ UserProfile.tsx
✅ NavigationMenu.tsx
✅ DataTable.tsx

❌ loginForm.tsx         (incorrect - camelCase)
❌ login-form.tsx        (incorrect - kebab-case)
❌ LOGINFORM.tsx         (incorrect - all caps)
```

**Reason:** React convention. Component names are PascalCase in code, so files should match.

---

### **Utilities & Functions: camelCase**
```
✅ formatDate.ts
✅ calculateTotal.ts
✅ parseUserInput.ts
✅ fetchUserData.ts

❌ FormatDate.ts         (incorrect - PascalCase for non-component)
❌ format-date.ts        (incorrect - kebab-case)
❌ format_date.ts        (incorrect - snake_case)
```

**Reason:** JavaScript/TypeScript convention for functions.

---

### **Configuration Files: kebab-case**
```
✅ next.config.js
✅ jest.config.js
✅ tailwind.config.js
✅ tsconfig.json

Reason: Framework convention, universally adopted
```

---

### **Type Definitions: camelCase with .types suffix**
```
✅ user.types.ts
✅ event.types.ts
✅ api.types.ts

Alternative (also acceptable):
✅ types.ts              (in feature folder)
✅ index.types.ts        (barrel export)
```

---

### **Test Files: .test or .spec suffix**
```
✅ LoginForm.test.tsx        (for components)
✅ formatDate.test.ts        (for utilities)
✅ api.integration.test.ts   (integration tests)
✅ LoginForm.spec.tsx        (alternative - spec format)

❌ test-LoginForm.tsx        (incorrect - prefix)
❌ LoginFormTest.tsx         (incorrect - suffix in name)
```

**Reason:** Test runners recognize .test and .spec patterns automatically.

---

### **Hook Files: use prefix**
```
✅ useAuth.ts
✅ useLocalStorage.ts
✅ useDebounce.ts

❌ auth.hook.ts              (incorrect - suffix)
❌ AuthHook.ts               (incorrect - PascalCase)
```

**Reason:** React convention - hooks always start with "use".

---

## 🏗️ WHEN TO CREATE NEW FOLDERS

### **Before Creating a Root-Level Folder, Ask:**

**Question 1:** Does this fit in an existing folder?
```
If YES → Use existing folder
If NO → Continue to Q2
```

**Question 2:** Will this be used by 3+ features or areas?
```
If NO → Put in single feature folder
If YES → Continue to Q3
```

**Question 3:** Will this contain 5+ files?
```
If NO → Keep files in parent folder
If YES → Continue to Q4
```

**Question 4:** Does this have a distinct, clear purpose?
```
If NO → Rethink organization
If YES → New folder MAY be justified
```

### **Decision Tree:**

```
NEW CODE TO ADD
       ↓
Is it a ROUTE?
  → YES → app/[route]/
  → NO → Continue
       ↓
Is it a NEW FEATURE?
  → YES → Create features/[feature]/
  → NO → Continue
       ↓
Is it SPECIFIC to one feature?
  → YES → features/[existing-feature]/
  → NO → Continue
       ↓
Is it SHARED across 2+ features?
  ├→ UI Component? → components/design-system/
  ├→ React Hook? → hooks/
  ├→ Type Definition? → types/
  ├→ Utility? → lib/utils/
  └→ Infrastructure? → lib/[category]/
       ↓
Is it DATABASE related?
  → YES → database/migrations/application/
  → NO → Continue
       ↓
Is it a TEST?
  → YES → tests/[unit|integration|e2e]/
  → NO → Continue
       ↓
Is it DOCUMENTATION?
  → YES → docs/[category]/
  → NO → Continue
       ↓
Is it OLD/DEPRECATED?
  → YES → archive/[category]/
```

---

## 🚫 ANTI-PATTERNS

### **Don't Create These Folders:**

```
❌ helpers/
   → Too vague. Use lib/utils/ or specific lib/[domain]/

❌ common/
   → Too vague. Use lib/ or components/

❌ shared/
   → Redundant. lib/ and components/ are already shared

❌ misc/ or stuff/
   → Indicates poor organization. Find proper category

❌ temp/ or tmp/ (at root)
   → Use .tmp/ (hidden) or don't commit

❌ utils/ (at root)
   → Use lib/utils/ for organization

❌ constants/
   → Put constants with the code that uses them

❌ interfaces/ or types/ (with code)
   → Keep types with implementation or in root types/
```

---

## 📦 FEATURE FOLDER STRUCTURE

### **Standard Feature Layout:**

```
features/[feature-name]/
├── domain/              # Business logic, types (pure)
│   ├── types.ts
│   ├── schemas.ts
│   └── validation.ts
├── data/                # API calls, data fetching
│   ├── api.ts
│   ├── queries.ts
│   └── mutations.ts
├── hooks/               # Feature-specific React hooks
│   ├── useFeature.ts
│   └── useFeatureData.ts
├── ui/                  # UI components
│   ├── FeatureView.tsx
│   ├── FeatureForm.tsx
│   └── components/      # Sub-components
└── utils/               # Feature-specific utilities
    └── helpers.ts
```

### **Feature Naming:**
```
✅ auth/                 (authentication)
✅ capture/              (photo capture)
✅ timeline/             (event timeline)
✅ user-profile/         (multi-word with kebab-case)

❌ Auth/                 (capitalized)
❌ userProfile/          (camelCase)
❌ user_profile/         (snake_case)
```

---

## 🎨 VARIABLE NAMING IN CODE

### **Variables: camelCase**
```typescript
✅ const userName = "John"
✅ const isAuthenticated = true
✅ const totalAmount = 100

❌ const user_name = "John"        // snake_case
❌ const UserName = "John"         // PascalCase
❌ const TOTAL_AMOUNT = 100        // (unless const)
```

### **Constants: SCREAMING_SNAKE_CASE**
```typescript
✅ const MAX_RETRY_ATTEMPTS = 3
✅ const API_BASE_URL = "https://..."
✅ const DEFAULT_TIMEOUT = 5000

✅ const COLORS = { ... }          // Object constant
```

### **Types & Interfaces: PascalCase**
```typescript
✅ interface User { ... }
✅ type UserRole = "admin" | "user"
✅ interface ApiResponse<T> { ... }

❌ interface user { ... }
❌ type userRole = ...
```

### **Functions: camelCase**
```typescript
✅ function formatDate() { ... }
✅ const calculateTotal = () => { ... }
✅ async function fetchUserData() { ... }

❌ function FormatDate() { ... }   // PascalCase
❌ function format_date() { ... }  // snake_case
```

### **Classes: PascalCase**
```typescript
✅ class UserService { ... }
✅ class ApiClient { ... }
✅ class EventEmitter { ... }

❌ class userService { ... }
❌ class api_client { ... }
```

---

## 🗄️ DATABASE NAMING

### **Tables: snake_case**
```sql
✅ users
✅ vehicle_events
✅ user_preferences

❌ Users                  // Capitalized
❌ vehicleEvents          // camelCase
❌ UserPreferences        // PascalCase
```

### **Columns: snake_case**
```sql
✅ user_id
✅ created_at
✅ total_amount
✅ is_active

❌ userId                 // camelCase
❌ CreatedAt              // PascalCase
```

---

## 🔄 MIGRATION NAMING

### **Format:** `YYYYMMDD_HHMMSS_description.sql`

```
✅ 20250116_143000_add_user_preferences.sql
✅ 20250116_150000_create_events_table.sql

❌ add_user_preferences.sql        // No timestamp
❌ 001_add_user_preferences.sql    // Sequential numbers (conflicts)
❌ AddUserPreferences.sql          // PascalCase
```

---

## 📊 CONSISTENCY CHECKLIST

Before committing code, verify:

- [ ] Folder names are lowercase
- [ ] Multi-word folders use kebab-case
- [ ] Component files are PascalCase.tsx
- [ ] Utility files are camelCase.ts
- [ ] Test files have .test or .spec suffix
- [ ] Hooks start with "use"
- [ ] Types/interfaces are PascalCase
- [ ] Variables are camelCase
- [ ] Constants are SCREAMING_SNAKE_CASE
- [ ] Database tables/columns are snake_case
- [ ] No special characters in names (except - and _)
- [ ] Names are descriptive, not abbreviated (except standard)

---

## 🚨 ENFORCEMENT

### **Required:**
- All new code MUST follow these conventions
- All new folders MUST be discussed before creation
- All PRs will be reviewed for naming consistency

### **Existing Code:**
- Existing code will be gradually migrated
- Don't rename just for the sake of renaming
- Rename when you're already modifying the file

### **Exceptions:**
- Framework requirements (e.g., Next.js `app/` folder)
- External library conventions
- Generated code from tools
- Legacy migrations (don't rename deployed migrations)

**All exceptions must be documented in this file.**

---

## 📚 REFERENCES

### **Official Sources:**
- [Next.js Project Structure](https://nextjs.org/docs/getting-started/project-structure)
- [TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html)
- [React Naming Conventions](https://react.dev/learn/thinking-in-react)

### **Internal Documentation:**
- [Folder Structure Guide](./FOLDER_STRUCTURE.md)
- [Contributing Guidelines](../../CONTRIBUTING.md)
- [Architectural Naming Analysis](../ARCHITECTURAL_NAMING_ANALYSIS.md)

---

## 🔄 UPDATES

### **Change Log:**

**2025-10-16:** Initial version - Codified existing conventions  
**Future:** This document will be updated as conventions evolve

### **Proposing Changes:**
1. Create GitHub issue with "convention" label
2. Discuss with team
3. Update this document
4. Announce in team chat
5. Update related documentation

---

**Last Updated:** October 16, 2025  
**Status:** ✅ Official Standard  
**Maintained By:** Engineering Team

**Questions?** See [CONTRIBUTING.md](../../CONTRIBUTING.md) or ask the team!
