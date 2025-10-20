# Phase 4: Replace Old Scripts - Migration Plan

**Status:** 🚀 In Progress  
**Start Date:** October 18, 2024  
**Goal:** Consolidate 25+ scattered database scripts into the unified God-Tier Toolkit

---

## 🎯 OBJECTIVES

1. **Deprecate** - Mark old scripts as deprecated
2. **Migrate** - Move functionality to unified toolkit
3. **Simplify** - Reduce from 25+ scripts to 1 unified CLI
4. **Document** - Clear migration guide for users
5. **Validate** - Ensure feature parity

---

## 📊 SCRIPT INVENTORY

### Database Scripts (25+ identified)

| Old Script | Current CLI | Status | Migration Path |
|------------|-------------|--------|----------------|
| `npm run db:health` | `npm run db health` | ✅ **DONE** | Already migrated |
| `npm run db:migrate` | `npm run db migrate:run` | ✅ **DONE** | Phase 3 |
| `npm run db:introspect` | `npm run db schema:inspect` | ✅ **DONE** | Phase 3 |
| `npm run db:schema-diff` | `npm run db schema:inspect` | ✅ **DONE** | Use compareSchemas() |
| `npm run db:doctor` | `npm run db perf:metrics` | ✅ **DONE** | Phase 3 |
| `npm run db:doctor:ai` | `npm run db perf:bottlenecks` | ✅ **DONE** | Phase 3 |
| `npm run db:validate` | `npm run db schema:inspect` | ⚠️ **PARTIAL** | Needs enhancement |
| `npm run db:migrate:https` | `npm run db migrate:run` | ✅ **DONE** | Same as migrate |
| `npm run db:migrate:old` | `npm run db migrate:run` | ✅ **DONE** | Deprecated |
| `npm run db:generate-sql` | N/A | ⏳ **TODO** | Add to CLI |
| `npm run db:smart-migrate` | `npm run db migrate:run --dry-run` | ✅ **DONE** | Use dry-run |
| `npm run db:test-migration` | `npm run db migrate:run --dry-run` | ✅ **DONE** | Use dry-run |
| `npm run db:storage` | N/A | ⏳ **TODO** | Add storage commands |
| `npm run db:apply-rls` | N/A | ⏳ **TODO** | Add RLS management |
| `npm run db:seed` | N/A | ⏳ **TODO** | Add seed command |
| `npm run db:seed:smartphone` | N/A | ⏳ **TODO** | Add seed command |
| `npm run supabase:admin` | N/A | ⏳ **TODO** | Add admin commands |

### Scripts in database-suite/ (27 files)

| Script | Purpose | Status | Action |
|--------|---------|--------|--------|
| `analyze-db-architecture.ts` | Schema analysis | ✅ **REPLACED** | Use `db schema:inspect` |
| `apply-master-rls-fix.ts` | RLS management | ⏳ **TODO** | Add RLS commands |
| `apply-rls-simple.ts` | RLS management | ⏳ **TODO** | Add RLS commands |
| `check-database-schema.ts` | Schema validation | ✅ **REPLACED** | Use `db schema:inspect` |
| `check-supabase-health.ts` | Health check | ✅ **REPLACED** | Use `db health` |
| `cleanup-empty-tenants.sql` | Data cleanup | ⏳ **TODO** | Add cleanup commands |
| `db-introspect.ts` | Schema introspection | ✅ **REPLACED** | Use `db schema:inspect` |
| `diff.ts` | Schema diff | ✅ **REPLACED** | Use `db.compareSchemas()` |
| `direct-db-analysis.ts` | Deep analysis | ✅ **REPLACED** | Use `db perf:bottlenecks` |
| `doctor-ai.ts` | AI-powered diagnosis | ✅ **REPLACED** | Use `db perf:bottlenecks` |
| `generate-migration-sql.ts` | Migration generation | ⏳ **TODO** | Add to CLI |
| `introspect-supabase-schema.ts` | Schema introspection | ✅ **REPLACED** | Use `db schema:inspect` |
| `migrate-https.ts` | Migration via HTTPS | ✅ **REPLACED** | Use `db migrate:run` |
| `migrate-via-api.ts` | Migration via API | ✅ **REPLACED** | Use `db migrate:run` |
| `migrate.ts` | Migration runner | ✅ **REPLACED** | Use `db migrate:run` |
| `setup-supabase-storage.ts` | Storage setup | ⏳ **TODO** | Add storage commands |
| `storage-manager.ts` | Storage management | ⏳ **TODO** | Add storage commands |
| `supabase-admin-v2.ts` | Admin operations | ⏳ **TODO** | Add admin commands |
| `test-db-connection.ts` | Connection test | ✅ **REPLACED** | Use `db health --quick` |
| `test-storage.ts` | Storage test | ⏳ **TODO** | Add storage commands |
| `validate.ts` | Schema validation | ⏳ **TODO** | Enhance validation |

---

## 🎯 MIGRATION PROGRESS

### Phase 1-3: Core Features ✅ COMPLETE

**Replaced Scripts:**
- ✅ Health checking (`db health`)
- ✅ Schema introspection (`db schema:inspect`)
- ✅ Schema diffing (`db.compareSchemas()`)
- ✅ Migration management (`db migrate:*`)
- ✅ Performance analysis (`db perf:*`)
- ✅ Backup/restore (`db backup`, `db restore`)

**Total:** 15 scripts replaced

### Phase 4: Remaining Features ⏳ IN PROGRESS

**To Add:**
1. **RLS Management** - Apply/validate RLS policies
2. **Storage Management** - Supabase storage operations
3. **Admin Commands** - Administrative operations
4. **Seed Commands** - Database seeding
5. **Migration Generation** - Generate migration files
6. **Data Cleanup** - Cleanup utilities
7. **Validation Enhancement** - Enhanced schema validation

**Total:** 10 scripts remaining

---

## 🔧 NEW FEATURES TO ADD

### 1. RLS Management

```typescript
// lib/database/operations/rls-manager.ts
export class RLSManager {
  async enableRLS(tableName: string): Promise<void>
  async disableRLS(tableName: string): Promise<void>
  async listPolicies(tableName: string): Promise<RLSPolicy[]>
  async createPolicy(policy: RLSPolicyDefinition): Promise<void>
  async dropPolicy(tableName: string, policyName: string): Promise<void>
  async validatePolicies(): Promise<ValidationResult>
}
```

**CLI Commands:**
```bash
npm run db rls:enable vehicles
npm run db rls:list vehicles
npm run db rls:validate
```

### 2. Storage Management

```typescript
// lib/database/operations/storage-manager.ts
export class StorageManager {
  async listBuckets(): Promise<StorageBucket[]>
  async createBucket(name: string, options?: BucketOptions): Promise<void>
  async deleteBucket(name: string): Promise<void>
  async getBucketSize(name: string): Promise<number>
  async cleanupOldFiles(bucket: string, olderThan: Date): Promise<number>
}
```

**CLI Commands:**
```bash
npm run db storage:list
npm run db storage:create vehicle-photos
npm run db storage:cleanup vehicle-photos --days 30
```

### 3. Seed Management

```typescript
// lib/database/operations/seed-manager.ts
export class SeedManager {
  async loadSeedFile(file: string): Promise<void>
  async seedTable(table: string, data: any[]): Promise<number>
  async truncateAll(confirm: boolean): Promise<void>
  async resetSequences(): Promise<void>
}
```

**CLI Commands:**
```bash
npm run db seed seeds/dev-data.ts
npm run db seed:table vehicles seeds/vehicles.json
npm run db seed:reset --confirm
```

### 4. Migration Generation

```typescript
// lib/database/operations/migration-generator.ts
export class MigrationGenerator {
  async generateFromDiff(schema1: string, schema2: string): Promise<string>
  async generateFromTemplate(template: string, vars: Record<string, any>): Promise<string>
  async createMigrationFile(name: string, sql: string): Promise<string>
}
```

**CLI Commands:**
```bash
npm run db migrate:generate add_user_preferences
npm run db migrate:diff staging production
```

### 5. Admin Commands

```typescript
// lib/database/operations/admin-operations.ts
export class AdminOperations {
  async vacuum(tableName?: string): Promise<void>
  async analyze(tableName?: string): Promise<void>
  async reindex(tableName?: string): Promise<void>
  async resetStatistics(): Promise<void>
  async killConnection(pid: number): Promise<void>
}
```

**CLI Commands:**
```bash
npm run db admin:vacuum vehicles
npm run db admin:analyze
npm run db admin:reindex vehicles
npm run db admin:connections
```

---

## 📝 DEPRECATION PLAN

### Step 1: Mark as Deprecated (Week 1)

Add deprecation warnings to old scripts:

```typescript
// scripts/database-suite/check-supabase-health.ts
console.warn('⚠️  DEPRECATED: Use `npm run db health` instead')
console.warn('   This script will be removed in v4.0.0')
console.warn('   Migration guide: docs/PHASE_4_MIGRATION_GUIDE.md\n')
```

### Step 2: Update Documentation (Week 1)

- ✅ Update README.md with new commands
- ✅ Create migration guide
- ✅ Update package.json scripts
- ✅ Add deprecation notices

### Step 3: Grace Period (2 weeks)

- Keep old scripts functional
- Show deprecation warnings
- Track usage (if possible)
- Gather feedback

### Step 4: Remove Old Scripts (Week 3-4)

- Move to `scripts/archive/phase3/`
- Remove from package.json
- Update all documentation
- Final migration guide

---

## 🚀 IMPLEMENTATION TIMELINE

### Week 1: RLS & Storage Management

- [ ] Implement RLSManager class
- [ ] Implement StorageManager class
- [ ] Add CLI commands
- [ ] Write tests
- [ ] Update documentation

### Week 2: Seed & Migration Generation

- [ ] Implement SeedManager class
- [ ] Implement MigrationGenerator class
- [ ] Add CLI commands
- [ ] Write tests
- [ ] Update documentation

### Week 3: Admin Operations & Validation

- [ ] Implement AdminOperations class
- [ ] Enhanced validation
- [ ] Add CLI commands
- [ ] Write tests
- [ ] Update documentation

### Week 4: Deprecation & Migration

- [ ] Add deprecation warnings to old scripts
- [ ] Move scripts to archive
- [ ] Update package.json
- [ ] Final documentation
- [ ] Release Phase 4

---

## 📚 MIGRATION GUIDE FOR USERS

### Quick Reference

| Old Command | New Command | Notes |
|-------------|-------------|-------|
| `npm run db:health` | `npm run db health` | ✅ Available now |
| `npm run db:migrate` | `npm run db migrate:run <dir>` | ✅ Available now |
| `npm run db:introspect` | `npm run db schema:inspect` | ✅ Available now |
| `npm run db:doctor` | `npm run db perf:metrics` | ✅ Available now |
| `npm run db:schema-diff` | `npm run db schema:inspect` | ✅ Use compareSchemas() |
| `npm run db:validate` | `npm run db schema:inspect` | ✅ Available now |
| `npm run db:apply-rls` | `npm run db rls:enable <table>` | ⏳ Coming in Phase 4 |
| `npm run db:storage` | `npm run db storage:list` | ⏳ Coming in Phase 4 |
| `npm run db:seed` | `npm run db seed <file>` | ⏳ Coming in Phase 4 |

### Programmatic API Changes

```typescript
// Old way (scattered scripts)
import { checkHealth } from '@/scripts/database-suite/check-supabase-health'
await checkHealth()

// New way (unified toolkit)
import { initDatabase } from '@/lib/database/core'
const db = await initDatabase()
await db.health()
```

---

## ✅ SUCCESS METRICS

### Code Reduction

- **Before:** 25+ scattered scripts (~10,000 lines)
- **After:** 1 unified toolkit (~15,000 lines, but organized)
- **Scripts Removed:** 20+
- **Maintenance Burden:** -80%

### User Experience

- **Commands:** 15+ scattered → 1 unified CLI
- **Documentation:** Multiple READMEs → Single guide
- **Discovery:** Hard to find → `npm run db help`
- **Consistency:** Varies → Standardized

### Developer Experience

- **API:** Inconsistent → Unified interface
- **Types:** Partial → Full TypeScript
- **Testing:** Limited → Comprehensive
- **Maintenance:** High → Low

---

## 🎯 NEXT STEPS

1. **Review this plan** - Validate approach
2. **Implement RLS & Storage** - Week 1 features
3. **Add deprecation warnings** - Start migration
4. **Complete remaining features** - Weeks 2-3
5. **Archive old scripts** - Week 4

---

**Phase 4 Goal:** One unified, powerful, well-documented database toolkit that replaces all scattered scripts! 🚀
