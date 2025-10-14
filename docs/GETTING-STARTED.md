# Getting Started with MotoMind

Welcome! This guide will get you up and running with MotoMind's development workflow in **under 10 minutes**.

---

## 🚀 Quick Setup (5 minutes)

### 1. Clone & Install
```bash
git clone <repo>
cd motomind-ai
npm install
```

### 2. Environment Setup
```bash
cp .env.example .env
```

Edit `.env` and add:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth secret
- `NEXTAUTH_SECRET` - Generate with: `openssl rand -base64 32`
- `NEXTAUTH_URL` - Your app URL (e.g., `http://localhost:3000`)

### 3. Database Setup
```bash
# Analyze current database
npm run db:introspect

# Apply any pending migrations
npm run db:smart-migrate

# Validate everything is healthy
npm run db:validate
```

### 4. Verify Installation
```bash
# Run tests
npm test

# Start development server
npm run dev
```

Visit `http://localhost:3000` - you're ready! 🎉

---

## 🧠 The Elite Development Workflow

MotoMind has a **context-aware development system** that helps you (and AI) write perfect code.

### The Core Principle

**Before writing ANY code, understand the context:**

```bash
npm run windsurf:guide "what you're about to do"
```

This analyzes your codebase and generates task-specific guidance.

---

## 📋 Daily Workflow

### Morning (30 seconds)
```bash
npm run repo:analyze    # What changed?
npm run db:validate     # Database healthy?
```

### Starting a Task (1 minute)

**Example: Adding a new "Documents" feature**

```bash
# 1. Get context
npm run windsurf:guide "add document storage feature"

# 2. Read the guidance
cat .windsurf-context.md

# Output shows:
# - Similar features (vehicles, garages)
# - Recommended structure
# - Import patterns to use
# - Security requirements

# 3. Study the examples
cat lib/vehicles/types.ts
cat lib/vehicles/api.ts
# Copy their patterns!

# 4. Create files matching that structure
# (or let AI do it, following the guidance)

# 5. Validate
npm run repo:analyze
npm run repo:clean
npm test
```

### Before Committing (10 seconds)
```bash
npm run windsurf:validate  # Full validation
# Or let the pre-commit hook handle it
git commit -m "feat: add documents"
```

The pre-commit hook automatically runs:
- Import validation
- Security tests
- Repository checks
- Database validation

---

## 🏗️ Architecture Quick Reference

### Directory Structure
```
lib/<domain>/           # Pure business logic
  ├── types.ts          # TypeScript types
  ├── api.ts            # API client
  ├── validation.ts     # Zod schemas
  └── utils.ts          # Helpers

app/<domain>/           # Next.js routes
  ├── page.tsx          # Pages
  └── api/              # API routes

components/<domain>/    # React components
  ├── List.tsx
  └── Form.tsx

tests/<domain>/         # Tests
  └── api.test.ts
```

### Import Rules (Critical!)

**ALWAYS:**
```typescript
import { X } from "@/lib/vehicles/api"
```

**NEVER:**
```typescript
import { X } from "../../../../lib/vehicles/api"
```

### Multi-Tenant Rules

**Every API route:**
```typescript
import { withTenantIsolation } from "@/lib/middleware/tenant-isolation"

export const GET = withTenantIsolation(async (req, { tenantId }) => {
  // tenantId is automatic and validated
})
```

**Every table:**
- Has `tenant_id` column
- Has RLS policies using `app.current_tenant_id()`
- Has index on `tenant_id`

---

## 🔧 Essential Commands

### Context & Analysis
```bash
npm run windsurf:guide "<task>"    # Get task guidance
npm run repo:analyze               # Understand codebase state
npm run db:introspect             # See database schema
```

### Database Operations
```bash
npm run db:generate-migration     # Create migration
npm run db:test-migration <file>  # Test safely
npm run db:smart-migrate          # Apply safely
npm run db:validate               # Check health
npm run db:doctor                 # Diagnose & fix
```

### Repository Maintenance
```bash
npm run repo:clean                # Find issues
npm run repo:clean --fix          # Auto-fix
```

### Testing
```bash
npm test                          # All tests
npm run test:security             # Security tests
npm run test:integration          # Integration tests
```

### Full Validation
```bash
npm run windsurf:validate         # Everything
```

---

## 💡 Example: Adding a New Feature

Let's add a "Notifications" feature step-by-step.

### Step 1: Get Context
```bash
npm run windsurf:guide "add notifications feature"
```

**Output:**
```
🧠 WINDSURF CONTEXT ENGINE
📐 Analyzing architecture... ✅
📋 Extracting patterns... ✅
📦 Analyzing imports... ✅
📚 Finding examples... ✅

Similar features found:
- vehicles (lib/vehicles/, app/vehicles/, components/vehicles/)
- garages (lib/garages/, app/garages/, components/garages/)

Recommended structure:
lib/notifications/
app/notifications/
components/notifications/
tests/notifications/

⚠️ Import Warning: Found 12 files with deep imports
✅ Use @/ imports instead

Guidance saved to: .windsurf-context.md
```

### Step 2: Study Examples
```bash
# Look at the vehicles feature
ls lib/vehicles/
# types.ts  api.ts  validation.ts  utils.ts

# Read the code
cat lib/vehicles/types.ts
cat lib/vehicles/api.ts

# See the tests
cat tests/vehicles/api.test.ts
```

### Step 3: Create Structure
```bash
mkdir -p lib/notifications
mkdir -p app/notifications
mkdir -p components/notifications
mkdir -p tests/notifications
```

### Step 4: Create Files

**lib/notifications/types.ts:**
```typescript
// Copy pattern from lib/vehicles/types.ts
export interface Notification {
  id: string
  tenant_id: string
  user_id: string
  message: string
  read: boolean
  created_at: string
}
```

**lib/notifications/api.ts:**
```typescript
// Copy pattern from lib/vehicles/api.ts
import type { Notification } from "./types"

export async function getNotifications(tenantId: string): Promise<Notification[]> {
  const response = await fetch(`/api/notifications?tenantId=${tenantId}`)
  return response.json()
}
```

**app/notifications/api/route.ts:**
```typescript
// Copy pattern from app/vehicles/api/route.ts
import { withTenantIsolation } from "@/lib/middleware/tenant-isolation"

export const GET = withTenantIsolation(async (req, { tenantId }) => {
  // Tenant isolation automatic!
  const notifications = await getNotificationsFromDB(tenantId)
  return Response.json(notifications)
})
```

### Step 5: Database Migration
```bash
# Generate migration
npm run db:generate-migration add-table notifications

# Edit the generated file to add:
# - tenant_id column
# - RLS policies
# - Indexes

# Test it safely
npm run db:test-migration supabase/migrations/20251014_add_table_notifications.sql

# Apply it
npm run db:smart-migrate
```

### Step 6: Add Tests

**tests/notifications/api.test.ts:**
```typescript
// Copy pattern from tests/vehicles/api.test.ts
import { getNotifications } from "@/lib/notifications/api"

describe("Notifications API", () => {
  it("should fetch notifications for tenant", async () => {
    const notifications = await getNotifications("test-tenant-id")
    expect(notifications).toBeInstanceOf(Array)
  })
})
```

### Step 7: Validate
```bash
npm run repo:analyze
# ✅ Pattern detected: NEW-FEATURE
# ✅ Structure matches: vehicles, garages

npm run repo:clean
# ✅ No issues found

npm test
# ✅ All tests passing

npm run db:validate
# ✅ Database healthy
```

### Step 8: Commit
```bash
git add .
git commit -m "feat: add notifications feature"

# Pre-commit hook runs automatically:
# ✅ No deep imports
# ✅ Security tests pass
# ✅ Repository clean
# ✅ Database validated
```

**Done!** You added a complete feature following all patterns. 🎉

---

## 🤖 Working with AI (Windsurf)

Windsurf can help generate code, but it needs guidance.

### The Right Way

**Tell Windsurf:**
```
Before you generate code, run:
npm run windsurf:guide "add notifications feature"

Then read .windsurf-context.md and follow it exactly.
```

**Windsurf will:**
1. Analyze the codebase
2. Find similar features
3. Copy their patterns
4. Use correct imports
5. Include tests
6. Generate perfect code ✅

### The Wrong Way

**Don't do this:**
```
User: "Add notifications"
Windsurf: [generates 50 files immediately]

Result:
❌ Deep imports (../../../)
❌ No tests
❌ Doesn't match patterns
❌ Takes hours to fix
```

**Always analyze first!**

---

## 📚 Key Documentation

### For Daily Use
- **CONTRIBUTING.md** - Developer workflow
- **GETTING-STARTED.md** - This file
- `.cascade/instructions.md` - AI workflow

### For Deep Dives
- **COMPLETE-SYSTEM-OVERVIEW.md** - All 13 tools
- **ELITE-DATABASE-SYSTEM.md** - Database tools
- **REPO-MANAGEMENT.md** - Repository tools
- **WINDSURF-INTEGRATION.md** - AI context system

### Generated Per Task
- `.windsurf-context.md` - Task-specific guidance (run `windsurf:guide`)

---

## 🐛 Troubleshooting

### "Deep import detected"
```bash
# Auto-fix
npm run repo:clean --fix
```

### "Security tests failing"
```bash
# Check which routes are unprotected
npm run test:security

# Add withTenantIsolation to routes
```

### "Database validation failed"
```bash
# Diagnose issues
npm run db:doctor

# Auto-fix safe issues
npm run db:doctor --fix
```

### "Guidance shows wrong examples"
The context engine learns from your codebase. If guidance is off:
1. Ensure your existing features follow best practices
2. The engine will copy what it finds
3. Clean up problem files first: `npm run repo:clean --fix`

---

## 🎯 Success Checklist

You're doing it right when:
- [ ] You run `windsurf:guide` before each task
- [ ] All imports use `@/` (no `../../../`)
- [ ] New features match existing patterns
- [ ] Tests are comprehensive
- [ ] Pre-commit hook passes
- [ ] Database stays healthy
- [ ] Code looks consistent

---

## 💡 Pro Tips

### 1. Study Before Creating
Don't guess patterns - study similar features:
```bash
npm run windsurf:guide "your task"
# Shows you exactly which files to study
```

### 2. Test Migrations Safely
Never YOLO migrations:
```bash
npm run db:test-migration <file>
# See exactly what will happen before it happens
```

### 3. Validate Early
Catch issues early:
```bash
# After each file
npm run repo:analyze

# After each change
npm test
```

### 4. Use the Doctor
When stuck:
```bash
npm run db:doctor --fix
npm run repo:clean --fix
```

### 5. Let Pre-commit Save You
The hook catches issues before they become problems.
Don't bypass it!

---

## 🚀 Next Steps

1. **Run through the example** - Add the "Notifications" feature
2. **Read CONTRIBUTING.md** - Detailed workflow
3. **Explore the tools** - Try each command
4. **Form the habit** - Always analyze first

You're now ready to build with MotoMind! 🎉

---

**Questions?** Check the docs in `/docs` or run `npm run windsurf:guide "your question"`
