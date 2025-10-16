# Contributing to MotoMind

Thank you for your interest in contributing to MotoMind! This guide will help you understand our development workflow and ensure your contributions align with our codebase patterns.

---

## 🚀 Quick Start

### 1. Installation
```bash
git clone <repo>
cd motomind-ai
npm install
cp .env.example .env
# Configure your .env with Supabase credentials
```

### 2. Understand the System
We have a comprehensive autonomous development system. Before making changes, run:
```bash
npm run windsurf:guide "what I'm about to do"
npm run repo:analyze
```

This will analyze the codebase and provide task-specific guidance.

---

## 📋 Development Workflow

### Before Starting Any Task

**Always run the context analyzer first:**
```bash
npm run windsurf:guide "add notification system"
```

This generates `.windsurf-context.md` with:
- Architectural guidelines
- Similar examples in the codebase
- Import patterns to follow
- Recommended structure
- Validation rules

**Read the guidance before writing code!**

### During Development

#### Import Rules (Critical!)

**ALWAYS use path aliases:**
```typescript
✅ import { VehicleService } from "@/lib/vehicles/api"
✅ import { VehicleCard } from "@/components/vehicles/VehicleCard"
```

**NEVER use deep relative imports:**
```typescript
❌ import { VehicleService } from "../../../../lib/vehicles/api"
❌ import { VehicleCard } from "../../../components/vehicles/VehicleCard"
```

#### Testing Requirements

**All new features must include:**
- Unit tests in `tests/<domain>/`
- Integration tests where appropriate
- Security tests for API routes

```bash
# Run tests
npm test

# Run specific suite
npm run test:security
npm run test:integration
```

#### Database Changes

**For any database changes:**

1. **Generate migration:**
```bash
npm run db:generate-migration add-feature table_name
```

2. **Test migration safely:**
```bash
npm run db:test-migration supabase/migrations/20251014_add_feature.sql
```

3. **Apply migration:**
```bash
npm run db:smart-migrate
```

4. **Validate database:**
```bash
npm run db:validate
```

**Never edit the database directly through Supabase Studio!**

### Before Committing

**Our pre-commit hook automatically runs:**
- Import validation (no deep imports)
- Repository analysis
- Issue detection
- Security tests
- Database validation (if migrations changed)

**You can run these manually:**
```bash
npm run repo:analyze
npm run repo:clean
npm run test:security
npm run windsurf:validate  # Runs all validations
```

---

## 🏗️ Architecture Guidelines

### Directory Structure

```
lib/
  <domain>/           # Business logic (pure)
    ├── types.ts      # TypeScript types
    ├── api.ts        # API client
    ├── validation.ts # Zod schemas
    └── utils.ts      # Helper functions

app/
  <domain>/           # Next.js routes
    ├── page.tsx      # Pages
    └── api/          # API routes

components/
  <domain>/           # React components
    ├── List.tsx
    └── Form.tsx

tests/
  <domain>/           # Tests
    └── api.test.ts
```

### Multi-Tenant Rules

**Every table must have:**
- `tenant_id UUID REFERENCES tenants(id)` column
- Row Level Security (RLS) policies
- Index on `tenant_id`

**API routes must use:**
```typescript
import { withTenantIsolation } from "@/lib/middleware/tenant-isolation"

export const GET = withTenantIsolation(async (req, { tenantId }) => {
  // tenantId is automatically available and validated
})
```

**RLS policies must use:**
```sql
CREATE POLICY "tenant_isolation" ON table_name
  USING (tenant_id = app.current_tenant_id());
```

### Security Rules

**NEVER:**
- Leave API routes unprotected
- Use `auth.uid()` in RLS policies (use `app.current_tenant_id()`)
- Hardcode tenant IDs
- Commit secrets to git
- Skip tests

**ALWAYS:**
- Use `withTenantIsolation` middleware
- Validate inputs with Zod schemas
- Include security tests
- Use environment variables for secrets

---

## 🔧 Available Tools

### Analysis & Planning
```bash
npm run repo:analyze           # Understand current state
npm run windsurf:guide "<task>" # Get task-specific guidance
npm run db:introspect          # Analyze database schema
```

### Database Operations
```bash
npm run db:generate-migration  # Create migrations
npm run db:test-migration      # Test safely
npm run db:smart-migrate       # Apply with safety checks
npm run db:validate            # Check health
npm run db:doctor              # Diagnose & fix issues
npm run db:storage             # Manage storage buckets
npm run db:schema-diff         # Compare schemas
```

### Repository Maintenance
```bash
npm run repo:clean             # Find issues
npm run repo:clean --fix       # Auto-fix safe issues
```

### Testing
```bash
npm test                       # All tests
npm run test:security          # Security tests
npm run test:integration       # Integration tests
```

### Validation
```bash
npm run windsurf:validate      # Full validation suite
```

---

## 📚 Key Documentation

- **[COMPLETE-SYSTEM-OVERVIEW.md](docs/COMPLETE-SYSTEM-OVERVIEW.md)** - All 13 tools
- **[ELITE-DATABASE-SYSTEM.md](docs/ELITE-DATABASE-SYSTEM.md)** - Database tools (1-10)
- **[REPO-MANAGEMENT.md](docs/REPO-MANAGEMENT.md)** - Repository tools (11-12)
- **[WINDSURF-INTEGRATION.md](docs/WINDSURF-INTEGRATION.md)** - AI context system (13)
- **[.cascade/instructions.md](.cascade/instructions.md)** - Windsurf-specific workflow

---

## 🐛 Common Issues

### "Deep import detected"
**Fix:** Use `@/` imports instead of `../../../`
```bash
npm run repo:clean --fix
```

### "Security tests failing"
**Check:** Are all routes protected with `withTenantIsolation`?
```bash
npm run test:security
```

### "Database validation failed"
**Check:** Do all tables have RLS policies?
```bash
npm run db:validate
npm run db:doctor --fix
```

---

## 💡 Best Practices

### 1. Study Existing Features
Before creating a new feature, find similar ones:
```bash
npm run windsurf:guide "add documents feature"
# Shows similar features like vehicles, garages
# Study those files first!
```

### 2. Test Migrations Safely
Never apply migrations directly to production:
```bash
# Always test first
npm run db:test-migration <file>

# Review impact analysis
# Then apply
npm run db:smart-migrate
```

### 3. Follow the Patterns
The codebase has established patterns. Copy them:
- Look at existing features
- Match their structure
- Use their import style
- Follow their testing approach

### 4. Validate Early and Often
Don't wait until the end:
```bash
# After each significant change
npm run repo:analyze
npm run repo:clean
npm test
```

---

## 📞 Getting Help

### Understanding the Codebase
```bash
npm run repo:analyze
npm run db:introspect
```

### Finding Examples
```bash
npm run windsurf:guide "your task"
# Will show similar features to study
```

### Fixing Issues
```bash
npm run db:doctor --fix
npm run repo:clean --fix
```

---

## 🎯 Pull Request Checklist

Before submitting a PR, ensure:

- [ ] Ran `windsurf:guide` and followed recommendations
- [ ] Used `@/` imports (no deep relative paths)
- [ ] Included comprehensive tests
- [ ] All tests passing (`npm test`)
- [ ] Security tests passing (`npm run test:security`)
- [ ] Database validated (`npm run db:validate`)
- [ ] Repository clean (`npm run repo:clean`)
- [ ] Pre-commit hook passes
- [ ] Documentation updated if needed
- [ ] No secrets committed

---

## 🏆 Recognition

We value quality contributions. Following these guidelines ensures:
- Your code integrates seamlessly
- Reviews are faster
- The codebase stays maintainable
- Everyone's time is respected

Thank you for contributing to MotoMind! 🚀
