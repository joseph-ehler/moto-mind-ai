# ⚠️ DEPRECATED: Database Suite Scripts

**Status:** All scripts in this directory are DEPRECATED as of October 18, 2024  
**Reason:** Replaced by the unified God-Tier Database Toolkit  
**Migration Guide:** See `docs/PHASE_4_COMPLETE.md`

---

## 🚀 Use the Unified CLI Instead

**All functionality from these 25+ scripts is now available via:**

```bash
npm run db [command]
```

**For help:**
```bash
npm run db help
```

---

## 📋 SCRIPT MIGRATION MAP

### Health & Schema Scripts

| Old Script | New Command | Status |
|------------|-------------|--------|
| `check-supabase-health.ts` | `npm run db health` | ✅ Replaced |
| `test-db-connection.ts` | `npm run db health --quick` | ✅ Replaced |
| `db-introspect.ts` | `npm run db schema:inspect` | ✅ Replaced |
| `introspect-supabase-schema.ts` | `npm run db schema:inspect` | ✅ Replaced |
| `check-database-schema.ts` | `npm run db schema:inspect` | ✅ Replaced |
| `analyze-db-architecture.ts` | `npm run db schema:inspect` | ✅ Replaced |
| `diff.ts` | `npm run db schema:compare <s1> <s2>` | ✅ Replaced |
| `validate.ts` | `npm run db schema:inspect` | ✅ Replaced |

### Migration Scripts

| Old Script | New Command | Status |
|------------|-------------|--------|
| `migrate.ts` | `npm run db migrate:run` | ✅ Replaced |
| `migrate-https.ts` | `npm run db migrate:run` | ✅ Replaced |
| `migrate-via-api.ts` | `npm run db migrate:run` | ✅ Replaced |
| `generate-migration-sql.ts` | `npm run db migrate:generate <name>` | ✅ Replaced |

### RLS Scripts

| Old Script | New Command | Status |
|------------|-------------|--------|
| `apply-rls-simple.ts` | `npm run db rls:enable <table>` | ✅ Replaced |
| `apply-master-rls-fix.ts` | `npm run db rls:validate` + `npm run db rls:apply-nextauth <table>` | ✅ Replaced |

### Storage Scripts

| Old Script | New Command | Status |
|------------|-------------|--------|
| `storage-manager.ts` | `npm run db storage:list` | ✅ Replaced |
| `setup-supabase-storage.ts` | `npm run db storage:create <name>` | ✅ Replaced |
| `test-storage.ts` | `npm run db storage:stats <bucket>` | ✅ Replaced |

### Performance & Admin Scripts

| Old Script | New Command | Status |
|------------|-------------|--------|
| `direct-db-analysis.ts` | `npm run db perf:bottlenecks` | ✅ Replaced |
| `doctor-ai.ts` | `npm run db perf:metrics` | ✅ Replaced |
| `supabase-admin-v2.ts` | `npm run db admin:*` commands | ✅ Replaced |

### Data Management Scripts

| Old Script | New Command | Status |
|------------|-------------|--------|
| `cleanup-empty-tenants.sql` | `npm run db seed:truncate <table>` | ✅ Replaced |

---

## ✨ NEW FEATURES NOT IN OLD SCRIPTS

The unified CLI provides features that didn't exist before:

### RLS Management
- **NextAuth-aware validation:** Detects auth.uid() issues automatically
- **One-command fix:** `npm run db rls:apply-nextauth <table>`

### Storage Management
- **Dry-run cleanup:** Preview file deletions before executing
- **Bucket statistics:** Get size, file count, mime types

### Seed Management
- **Confirmed resets:** Prevents accidental data deletion
- **Row counts:** Quick table inspection
- **Multiple formats:** SQL, JSON, TypeScript seed files

### Migration Generation
- **Schema diff:** Auto-generate migrations from schema changes
- **Templates:** Built-in templates for common migrations

### Admin Operations
- **Connection management:** List, monitor, terminate connections
- **Performance:** VACUUM, ANALYZE, REINDEX with progress

---

## 🗂️ WHAT TO DO WITH THESE FILES

### Option 1: Keep as Reference (Recommended)
Leave them here with this DEPRECATED.md file as historical reference.

### Option 2: Archive
Move to `scripts/archive/2024-10-database-suite/` if you want them out of sight.

### Option 3: Delete
Only do this if you're 100% certain you won't need them (not recommended yet).

---

## 📚 DOCUMENTATION

**Complete guides:**
- `docs/PHASE_4_COMPLETE.md` - Complete Phase 4 summary
- `docs/PHASE_4_MIGRATION_PLAN.md` - Migration roadmap
- `docs/DATABASE_TOOLKIT_GUIDE.md` - Getting started guide

**Quick reference:**
```bash
npm run db help
```

---

## 🚨 IMPORTANT NOTES

1. **These scripts still work** - They're deprecated, not broken
2. **Deprecation warnings added** - Running them will show migration instructions
3. **No breaking changes** - Existing scripts in package.json still work
4. **Unified CLI is better** - More features, better UX, actively maintained

---

## 🎯 MIGRATION EXAMPLES

### Before (Old Scripts)
```bash
# Multiple different patterns
npm run db:health
npm run db:introspect
npm run db:migrate
npm run db:apply-rls
npm run db:storage
tsx scripts/database-suite/doctor-ai.ts
```

### After (Unified CLI)
```bash
# One consistent pattern
npm run db health
npm run db schema:inspect
npm run db migrate:run
npm run db rls:validate
npm run db storage:list
npm run db perf:metrics
```

---

## ✅ BENEFITS OF MIGRATION

1. **Consistency** - All commands follow same pattern
2. **Discoverability** - `npm run db help` shows everything
3. **Better UX** - Spinners, colors, progress bars
4. **More Features** - New capabilities not in old scripts
5. **Type Safety** - Full TypeScript integration
6. **Maintained** - Single codebase to update/fix
7. **Documented** - Comprehensive docs and examples

---

## 🔄 ROLLBACK (If Needed)

If you absolutely need to use old scripts temporarily:

```bash
# Remove deprecation warnings
# Comment out the console.warn() lines in each script

# Or use the old npm scripts if they still exist
npm run db:health  # Old command
npm run db health  # New command
```

---

**Questions?** See `docs/PHASE_4_COMPLETE.md` or run `npm run db help`

**Last Updated:** October 18, 2024  
**Deprecated By:** Phase 4 - God-Tier Database Toolkit
