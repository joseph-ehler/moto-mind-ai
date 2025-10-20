# Archived: One-Off Migration Scripts (Oct 2024)

**Archived Date:** October 19, 2024  
**Reason:** Replaced by unified database toolkit  
**Replacement:** `npm run db` commands

---

## 📦 What's Archived Here

One-off migration and seed scripts that are now handled by the unified CLI.

---

## 📂 Contents

### Seed Scripts
- `seed.ts` → `npm run db seed <file>`
- `seed-smartphone.ts` → `npm run db seed <file>`

### RLS Migration
- `apply-master-rls-fix.ts` → `npm run db rls:validate` + `npm run db rls:apply-nextauth`

### Database Migrations
- `apply-conversation-migration.ts` → `npm run db migrate:run`
- `apply-dashboard-migration.ts` → `npm run db migrate:run`
- `apply-email-verification.ts` → `npm run db migrate:run`
- `apply-migration-directly.ts` → `npm run db migrate:run`
- `apply-new-migrations.ts` → `npm run db migrate:run`
- `analyze-migration-results.ts` → Built into unified CLI

---

## 🚀 Use the Unified CLI Instead

```bash
# Seed data
npm run db seed seeds/dev-data.sql
npm run db seed:truncate vehicles --cascade
npm run db seed:reset --confirm

# Run migrations
npm run db migrate:run database/supabase/migrations

# RLS management
npm run db rls:validate
npm run db rls:apply-nextauth <table>
```

---

## 📚 Documentation

- **Complete Guide:** `docs/PHASE_4_COMPLETE.md`
- **Cleanup Plan:** `SCRIPTS_CLEANUP_PLAN.md`

---

**Archived as part of Phase 4 completion** 🚀
