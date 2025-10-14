# 🚨 WINDSURF: READ THIS BEFORE EVERY TASK

## MANDATORY WORKFLOW

### 1. ANALYZE FIRST (Always!)

Before generating ANY code, you MUST run:
```bash
npm run windsurf:guide "<description of what you're about to do>"
```

Example:
```bash
npm run windsurf:guide "add document storage feature"
npm run windsurf:guide "refactor vehicle imports"
npm run windsurf:guide "add notification system"
```

### 2. READ THE GUIDANCE

After running the command, a file `.windsurf-context.md` is generated.

**YOU MUST:**
- Read the entire file
- Note the examples it shows
- Follow the recommended structure EXACTLY
- Use the import patterns shown

### 3. STUDY EXAMPLES

The guidance will show you similar features in this codebase.

Before writing code:
- Look at those files
- Understand their structure
- Copy their patterns

### 4. GENERATE CODE

Now you can generate code, following:
- Architecture from guidance
- Import style from examples
- Structure from similar features
- Validation rules from guidance

### 5. VALIDATE AFTER

After generating code, ALWAYS run:
```bash
npm run repo:analyze
npm run repo:clean
npm run db:validate  # if database changes
npm test
```

Fix any issues found before considering the task complete.

---

## 🚨 CRITICAL RULES

### Import Rules (MOST IMPORTANT!)

**ALWAYS:**
```typescript
import { X } from "@/lib/vehicles/api"
import { Y } from "@/components/vehicles/VehicleCard"
```

**NEVER:**
```typescript
import { X } from "../../../../lib/vehicles/api"
import { Y } from "../../../components/vehicles/VehicleCard"
```

**WHY:** This codebase already has 12+ files with deep import nesting. DO NOT ADD MORE!

### Testing Rules

**ALWAYS:**
- Generate tests for every feature
- Put tests in `tests/<domain>/`
- Run tests before marking complete

### Security Rules

**ALWAYS:**
- Use `withTenantIsolation` middleware for API routes
- Add `tenant_id` to new database tables
- Use `app.current_tenant_id` in RLS policies

**NEVER:**
- Leave API routes unprotected
- Use `auth.uid()` in RLS policies
- Hardcode tenant IDs

---

## 📋 TASK CHECKLIST

For EVERY task, verify:
- [ ] Ran `windsurf:guide` first
- [ ] Read `.windsurf-context.md`
- [ ] Studied example features
- [ ] Used `@/` imports
- [ ] Matched existing structure
- [ ] Included tests
- [ ] Ran validation commands
- [ ] Fixed any issues found

---

## 🔧 AVAILABLE TOOLS

### Before Starting:
```bash
npm run windsurf:guide "<task>"      # Get context
npm run repo:analyze                 # Understand state
npm run db:introspect               # See database
```

### During Development:
```bash
npm run db:generate-migration       # Create migrations
npm run db:test-migration           # Test migrations
npm test                            # Run tests
```

### After Changes:
```bash
npm run repo:analyze                # Check patterns
npm run repo:clean                  # Find issues
npm run repo:clean --fix            # Auto-fix
npm run db:validate                 # Validate DB
npm run test:security               # Security check
npm run windsurf:validate           # Full validation
```

---

## 💡 EXAMPLES

### ✅ Good Task Execution:

```
User: "Add document storage feature"

Windsurf:
1. First, let me analyze the codebase:
   npm run windsurf:guide "add document storage feature"

2. I see the guidance recommends:
   - Structure: lib/documents/, app/documents/, components/documents/
   - Similar to: vehicles feature
   - Use @/ imports

3. Let me study the vehicles feature first...
   [reads lib/vehicles/types.ts, api.ts, etc.]

4. Now generating code matching that pattern...
   [generates code]

5. Validating...
   npm run repo:analyze
   npm run repo:clean
   npm test

6. All checks passed! ✅
```

### ❌ Bad Task Execution:

```
User: "Add document storage feature"

Windsurf:
[immediately generates 50 files with deep imports]

❌ No analysis first
❌ Didn't read guidance
❌ Didn't study examples
❌ Used ../../../ imports
❌ No tests included
```

---

## 🎯 YOUR SUCCESS CRITERIA

### Code is good when:
- ✅ Matches existing patterns
- ✅ Uses `@/` imports (flat, not nested)
- ✅ Includes comprehensive tests
- ✅ Passes all validation
- ✅ Follows guidance recommendations
- ✅ Looks like it was written by the original developer

### Code needs work when:
- ❌ Uses deep imports (`../../../`)
- ❌ No tests included
- ❌ Doesn't match existing structure
- ❌ Validation shows issues
- ❌ Looks different from existing code

---

## 📚 DOCUMENTATION

Full details in:
- `docs/COMPLETE-SYSTEM-OVERVIEW.md` - All 13 tools
- `docs/WINDSURF-INTEGRATION.md` - This system
- `.windsurfcontext` - Quick reference
- `.windsurf-context.md` - Generated per-task (read this!)

---

**Remember: ANALYZE → STUDY → FOLLOW → VALIDATE**

These tools exist to help you generate perfect code. Use them every single time.
