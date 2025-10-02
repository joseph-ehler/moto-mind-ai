# 🔧 CODEBASE ORGANIZATION REFACTORING PLAN

## **CURRENT ISSUES IDENTIFIED:**

### **HIGH PRIORITY - Root Level Clutter**
- Duplicate trackers (`api-usage-tracker.ts` vs `usage-tracker.ts`)
- Misplaced infrastructure files (`circuit-breaker.ts`, `database.ts`)
- Client files scattered in root (`llm-client.ts`, `samsara-client.ts`)
- Generic utilities (`utils.ts` - only 166 bytes)

### **MEDIUM PRIORITY - Test File Sprawl**
- 32 test files across multiple locations
- API tests mixed with production code
- Archive files not properly isolated

### **LOW PRIORITY - Empty Directories**
- `/lib/services/images/` - Empty
- `/lib/services/reminders/` - Empty

---

## **PROPOSED STRUCTURE:**

```
/lib/
├── clients/                 # External service clients
│   ├── openai.ts           # Centralized OpenAI client
│   ├── samsara.ts          # Samsara API client
│   └── supabase.ts         # Supabase client
├── infrastructure/         # System-level utilities
│   ├── circuit-breaker.ts  # Moved from root
│   ├── monitoring.ts       # System monitoring
│   └── health-checks.ts    # Health check utilities
├── storage/                # Data persistence
│   ├── supabase-storage.ts # File storage
│   ├── database.ts         # DB utilities
│   └── cache.ts           # Caching layer
├── domain/                 # Business logic (existing)
├── services/              # Business services
│   ├── vehicles/          # Vehicle operations
│   ├── garages/           # Garage operations
│   ├── events/            # Event processing
│   └── documents/         # Document processing
├── vision/                # AI/Vision processing (existing - KEEP)
├── validation/            # Data validation (existing)
├── utils/                 # Shared utilities
│   ├── common.ts          # Common utilities
│   ├── formatting.ts      # Data formatting
│   └── constants.ts       # App constants
└── types/                 # TypeScript definitions
    ├── api.ts             # API types
    ├── database.ts        # DB types
    └── domain.ts          # Domain types
```

---

## **MIGRATION STEPS:**

### **Step 1: Create New Directory Structure**
```bash
mkdir -p lib/{clients,infrastructure,storage,utils,types}
mkdir -p lib/services/{events,documents}
```

### **Step 2: Move Infrastructure Files**
```bash
mv lib/circuit-breaker.ts lib/infrastructure/
mv lib/database.ts lib/storage/
mv lib/supabase-storage.ts lib/storage/
```

### **Step 3: Consolidate Client Files**
```bash
mv lib/llm-client.ts lib/clients/openai.ts
mv lib/samsara-client.ts lib/clients/samsara.ts
mv lib/supabase.ts lib/clients/supabase.ts
```

### **Step 4: Resolve Duplicates**
- Merge `api-usage-tracker.ts` and `usage-tracker.ts`
- Expand or remove minimal `utils.ts`
- Consolidate canonical image functions

### **Step 5: Clean Test Files**
```bash
mkdir -p tests/{unit,integration,api}
mv pages/api/test-*.ts tests/api/
mv scripts/test-*.ts tests/integration/
```

### **Step 6: Remove Empty Directories**
```bash
rmdir lib/services/images lib/services/reminders
```

---

## **IMPORT UPDATE STRATEGY:**

### **Automated Find & Replace**
```bash
# Update imports across codebase
find . -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's|from.*lib/circuit-breaker|from lib/infrastructure/circuit-breaker|g'
find . -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's|from.*lib/database|from lib/storage/database|g'
```

### **TypeScript Path Mapping**
Update `tsconfig.json`:
```json
{
  "compilerOptions": {
    "paths": {
      "@/lib/clients/*": ["lib/clients/*"],
      "@/lib/infrastructure/*": ["lib/infrastructure/*"],
      "@/lib/storage/*": ["lib/storage/*"],
      "@/lib/vision/*": ["lib/vision/*"],
      "@/lib/services/*": ["lib/services/*"]
    }
  }
}
```

---

## **BENEFITS OF REFACTORING:**

### **Developer Experience**
- **Clear mental model** - Know exactly where to find/add code
- **Faster navigation** - Logical grouping reduces search time
- **Reduced conflicts** - Clear ownership boundaries

### **Maintainability**
- **Single responsibility** - Each directory has clear purpose
- **Dependency clarity** - Import paths reveal architecture
- **Easier testing** - Test files organized by feature

### **Scalability**
- **Feature isolation** - New features have clear home
- **Team collaboration** - Clear ownership boundaries
- **Onboarding** - New developers understand structure quickly

---

## **RISK MITIGATION:**

### **Gradual Migration**
- Move one directory at a time
- Update imports incrementally
- Test after each migration step

### **Backup Strategy**
```bash
git checkout -b refactor/directory-structure
git add -A && git commit -m "Backup before refactoring"
```

### **Validation**
- Run full test suite after each step
- Verify all imports resolve correctly
- Check production build succeeds

---

## **SUCCESS METRICS:**

- **Import clarity** - All imports use logical paths
- **Directory purpose** - Each directory has clear responsibility
- **File discovery** - Developers can find files in <30 seconds
- **Zero broken imports** - All references resolve correctly
- **Test organization** - Tests grouped by feature/type

---

**ESTIMATED EFFORT:** 4-6 hours
**RISK LEVEL:** Low (mostly file moves + import updates)
**IMPACT:** High (significantly improved developer experience)
