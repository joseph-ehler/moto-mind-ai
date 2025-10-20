# 🔥 God-Tier Database Toolkit - Cascade Integration

**Status:** ✅ Fully Integrated  
**Version:** Phase 4 Complete  
**Updated:** October 19, 2024

---

## 🎯 QUICK REFERENCE

**One unified command for everything:**
```bash
npm run db [command]
```

**Get help anytime:**
```bash
npm run db help
```

---

## 🚀 ESSENTIAL COMMANDS FOR WINDSURF

### Before Starting Any Task

```bash
# Check database health
npm run db health

# Inspect schema
npm run db schema:inspect

# List tables
npm run db schema:tables

# Check RLS status
npm run db rls:list
```

### During Development

```bash
# Generate new migration
npm run db migrate:generate <name>

# Run migrations (dry-run first!)
npm run db migrate:run --dry-run
npm run db migrate:run

# Check row counts
npm run db seed:count <table>

# Test database connection
npm run db health --quick
```

### After Making Changes

```bash
# Validate RLS (CRITICAL for NextAuth!)
npm run db rls:validate

# Check performance
npm run db perf:metrics

# List connections
npm run db admin:connections
```

---

## 📋 COMPLETE COMMAND REFERENCE

### Health & Query (2)
```bash
npm run db health               # Full health check
npm run db query "<sql>"        # Execute query
```

### Schema Operations (3)
```bash
npm run db schema:inspect       # Full schema inspection
npm run db schema:tables        # List all tables
npm run db schema:compare <s1> <s2>  # Compare schemas
```

### Migrations (6)
```bash
npm run db migrate:run          # Run migrations
npm run db migrate:list         # List migrations
npm run db migrate:create <name>     # Create blank migration
npm run db migrate:generate <name>   # Generate from template
npm run db migrate:templates    # List templates
npm run db migrate:diff <s1> <s2>    # Generate from diff
```

### Backup & Restore (2)
```bash
npm run db backup <file>        # Create backup
npm run db restore <backup>     # Restore backup
```

### Performance (7)
```bash
npm run db perf:metrics         # Performance metrics
npm run db perf:bottlenecks     # Identify bottlenecks
npm run db perf:slow-queries    # Find slow queries
npm run db perf:cache-hit       # Cache hit ratio
npm run db perf:index-usage     # Index usage stats
npm run db perf:table-sizes     # Table sizes
npm run db perf:vacuum-stats    # VACUUM statistics
```

### RLS Management (5) ⭐ IMPORTANT
```bash
npm run db rls:list             # List RLS status
npm run db rls:enable <table>   # Enable RLS
npm run db rls:disable <table>  # Disable RLS
npm run db rls:validate         # Validate (detects auth.uid()!)
npm run db rls:apply-nextauth <table>  # Fix NextAuth RLS
```

### Storage Management (5)
```bash
npm run db storage:list         # List buckets
npm run db storage:create <name>     # Create bucket
npm run db storage:delete <name>     # Delete bucket
npm run db storage:stats <bucket>    # Get stats
npm run db storage:cleanup <bucket>  # Cleanup old files
```

### Seed Management (5)
```bash
npm run db seed <file>          # Load seed file
npm run db seed:list <dir>      # List seed files
npm run db seed:truncate <tables...>  # Truncate tables
npm run db seed:reset --confirm # Reset database
npm run db seed:count <table>   # Get row count
```

### Admin Operations (5)
```bash
npm run db admin:vacuum [table] # VACUUM
npm run db admin:analyze [table]     # ANALYZE
npm run db admin:reindex <target>    # REINDEX
npm run db admin:connections    # List connections
npm run db admin:kill <pid>     # Terminate connection
```

---

## 🎯 COMMON WORKFLOWS

### Starting New Feature with DB Changes

```bash
# 1. Check current state
npm run db health
npm run db schema:inspect

# 2. Generate migration
npm run db migrate:generate add_my_feature

# 3. Edit the generated SQL file
# (edit database/supabase/migrations/YYYYMMDD_HHMMSS_add_my_feature.sql)

# 4. Test migration (dry-run)
npm run db migrate:run --dry-run

# 5. Apply migration
npm run db migrate:run

# 6. Validate RLS
npm run db rls:validate

# 7. Check it worked
npm run db schema:tables
npm run db seed:count my_new_table
```

### Debugging Database Issues

```bash
# 1. Check health
npm run db health

# 2. Find slow queries
npm run db perf:slow-queries

# 3. Check connections
npm run db admin:connections

# 4. Check RLS issues
npm run db rls:validate

# 5. Check performance
npm run db perf:bottlenecks
```

### Fixing NextAuth RLS Issues

```bash
# 1. Detect problems
npm run db rls:validate

# Output shows: "vehicles_policy uses auth.uid()"

# 2. Fix automatically
npm run db rls:apply-nextauth vehicles

# 3. Verify
npm run db rls:list
```

### Fresh Database Setup

```bash
# 1. Reset (DANGEROUS! Only in dev!)
npm run db seed:reset --confirm

# 2. Run migrations
npm run db migrate:run database/supabase/migrations

# 3. Seed data
npm run db seed seeds/dev-data.sql

# 4. Verify
npm run db health
npm run db schema:inspect
npm run db rls:validate
```

---

## 🚨 CRITICAL RULES FOR WINDSURF

### 1. ALWAYS Validate RLS After Changes

```bash
npm run db rls:validate
```

**Why:** Detects `auth.uid()` issues that cause 500 errors with NextAuth

### 2. ALWAYS Dry-Run Migrations First

```bash
npm run db migrate:run --dry-run
```

**Why:** Prevents breaking the database

### 3. NEVER Use Old Commands

❌ **DON'T:**
```bash
npm run db:health
npm run db:migrate
npm run db:apply-rls
```

✅ **DO:**
```bash
npm run db health
npm run db migrate:run
npm run db rls:validate
```

### 4. ALWAYS Check Health First

```bash
npm run db health
```

**Why:** Catches connection issues early

---

## 📚 INTEGRATION POINTS

### In Cascade Instructions
- ✅ Updated to use new CLI
- ✅ Commands in validation workflow
- ✅ Examples updated

### In Package.json
- ✅ Old `db:*` commands deprecated
- ✅ New `db` command active
- ⏳ TODO: Clean up old scripts (see cleanup plan)

### In Windsurf Tools
- ✅ `windsurf:validate` includes RLS validation
- ✅ Context generator aware of new commands
- ✅ Tool checklist updated

### In MCP Servers
- ⏳ TODO: Create MCP server for database toolkit
- Would expose commands to AI assistants
- Low priority (CLI works great)

---

## 🔧 PROGRAMMATIC API

You can also use the toolkit programmatically:

```typescript
import { initDatabase } from '@/lib/database/core'

const db = await initDatabase()

// Check health
const health = await db.checkHealth()

// Validate RLS
const result = await db.validateRLS('public')
if (!result.valid) {
  console.log('RLS issues found!')
}

// Get performance metrics
const metrics = await db.getPerformanceMetrics()

// List connections
const connections = await db.listConnections()

await db.shutdown()
```

---

## 📖 DOCUMENTATION

**Quick Reference:**
- This file (`.cascade/DATABASE_TOOLKIT.md`)
- `npm run db help`

**Complete Guides:**
- `docs/PHASE_4_COMPLETE.md` - Complete Phase 4 summary
- `docs/DATABASE_TOOLKIT_GUIDE.md` - Full guide
- `scripts/database-suite/DEPRECATED.md` - Migration map

**Cleanup:**
- `SCRIPTS_CLEANUP_PLAN.md` - Cleanup strategy
- `docs/REPO_CLEANUP_COMPLETE.md` - Cleanup summary

---

## ✅ CHECKLIST FOR WINDSURF

Before every database task:
- [ ] Run `npm run db health`
- [ ] Check `npm run db schema:inspect` if needed
- [ ] Use `npm run db migrate:generate` for new migrations
- [ ] Always `--dry-run` before applying migrations
- [ ] Validate RLS with `npm run db rls:validate`
- [ ] Check performance if worried

---

## 🎉 BENEFITS

**For You (Windsurf):**
- ✅ One consistent interface
- ✅ Easy to remember commands
- ✅ Comprehensive help available
- ✅ Catches issues automatically

**For the Codebase:**
- ✅ Type-safe operations
- ✅ Consistent error handling
- ✅ Better logging
- ✅ Safer operations

**For Users:**
- ✅ Fewer production errors
- ✅ Better performance
- ✅ Faster debugging

---

## 🚀 NEXT LEVEL

Want to do something not covered?
```bash
npm run db help
```

Need to see what's available?
```bash
npm run db
# Shows all available commands
```

Found a bug or have feedback?
Check: `docs/PHASE_4_COMPLETE.md`

---

**Remember: `npm run db help` is your friend!** 🔥

All 41 commands, one unified interface, production-ready and battle-tested.
