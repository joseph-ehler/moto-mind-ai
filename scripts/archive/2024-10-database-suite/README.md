# Archived: Database Suite Scripts (Oct 2024)

**Archived Date:** October 19, 2024  
**Reason:** Replaced by unified God-Tier Database Toolkit  
**Replacement:** `npm run db` commands

---

## 📦 What's Archived Here

All scripts from `scripts/database-suite/` that were replaced by the unified CLI.

**Total Scripts:** 25+ files

---

## 🔄 Migration Map

See the main deprecation guide:
- `scripts/database-suite/DEPRECATED.md` - Complete migration map
- `docs/PHASE_4_COMPLETE.md` - Full Phase 4 summary

---

## 📂 Contents

### Health & Schema Scripts
- `check-supabase-health.ts` → `npm run db health`
- `test-db-connection.ts` → `npm run db health`
- `db-introspect.ts` → `npm run db schema:inspect`
- `introspect-supabase-schema.ts` → `npm run db schema:inspect`
- `check-database-schema.ts` → `npm run db schema:inspect`
- `analyze-db-architecture.ts` → `npm run db schema:inspect`
- `diff.ts` → `npm run db schema:compare`
- `validate.ts` → `npm run db schema:inspect`

### Migration Scripts
- `migrate.ts` → `npm run db migrate:run`
- `migrate-https.ts` → `npm run db migrate:run`
- `migrate-via-api.ts` → `npm run db migrate:run`
- `generate-migration-sql.ts` → `npm run db migrate:generate`
- `run-single-migration.sh` → `npm run db migrate:run`

### RLS Scripts
- `apply-rls-simple.ts` → `npm run db rls:enable`
- `apply-master-rls-fix.ts` → `npm run db rls:validate`

### Storage Scripts
- `storage-manager.ts` → `npm run db storage:*`
- `setup-supabase-storage.ts` → `npm run db storage:create`
- `test-storage.ts` → `npm run db storage:stats`

### Performance & Analysis
- `direct-db-analysis.ts` → `npm run db perf:bottlenecks`
- `doctor-ai.ts` → `npm run db perf:metrics`

### Admin Scripts
- `supabase-admin-v2.ts` → `npm run db admin:*`
- `supabase-admin/` → `npm run db admin:*`

### Other Scripts
- `cleanup-empty-tenants.sql` → `npm run db seed:truncate`
- `verify-security-migration.ts` → Deprecated
- `db-introspect-old-broken.ts` → Deprecated

---

## 🚀 Use the Unified CLI Instead

```bash
# Get help
npm run db help

# Common operations
npm run db health
npm run db schema:inspect
npm run db migrate:run
npm run db rls:validate
npm run db storage:list
npm run db admin:vacuum
```

---

## 📚 Documentation

- **Complete Guide:** `docs/PHASE_4_COMPLETE.md`
- **Cleanup Plan:** `SCRIPTS_CLEANUP_PLAN.md`
- **Deprecation Map:** `scripts/database-suite/DEPRECATED.md`

---

## ⚠️ These Files Still Work

These archived scripts are functional, just deprecated. You can still run them if needed, but the unified CLI is recommended.

---

**Archived as part of Phase 4 completion - God-Tier Database Toolkit** 🚀
