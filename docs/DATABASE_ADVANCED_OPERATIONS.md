# Database Advanced Operations - Phase 3 Complete

**Status:** ✅ PRODUCTION READY  
**Version:** 3.0.0  
**Last Updated:** October 18, 2024

---

## 🎯 THE VISION

**Production-Grade Database Operations**

Phase 3 adds enterprise-level operational tools:
- ✅ Deep schema introspection
- ✅ Safe migration execution with rollback
- ✅ Backup/restore capabilities
- ✅ Performance monitoring and analysis

---

## 🚀 QUICK START

### Schema Introspection

```bash
# Inspect full schema
npm run db schema:inspect

# Specific schema
npm run db schema:inspect --schema public
```

### Migration Management

```bash
# Plan migrations
npm run db migrate:plan database/supabase/migrations

# Dry run
npm run db migrate:run database/supabase/migrations --dry-run

# Execute migrations
npm run db migrate:run database/supabase/migrations
```

### Backup & Restore

```bash
# Full backup
npm run db backup backups/db_$(date +%Y%m%d).sql

# Specific tables
npm run db backup backups/vehicles.sql --tables vehicles,trips

# Schema only
npm run db backup backups/schema.sql --schema-only

# Restore
npm run db restore backups/db_20241018.sql --dry-run
npm run db restore backups/db_20241018.sql
```

### Performance Analysis

```bash
# Get metrics
npm run db perf:metrics

# Find bottlenecks
npm run db perf:bottlenecks
```

---

## 🔧 FEATURES

### 1. Schema Inspector

**Deep introspection of database structure**

```typescript
import { initDatabase } from '@/lib/database/core'

const db = await initDatabase()

// Full schema inspection
const inspection = await db.inspectSchema('public')

console.log(`Tables: ${inspection.summary.totalTables}`)
console.log(`Columns: ${inspection.summary.totalColumns}`)
console.log(`Indexes: ${inspection.summary.totalIndexes}`)
console.log(`Size: ${(inspection.summary.totalSize / 1024 / 1024).toFixed(2)} MB`)

// Get specific table info
const tables = await db.getTables('public')
const columns = await db.getColumns('vehicles', 'public')

// Compare schemas (drift detection)
const diff = await db.compareSchemas('public', 'staging')

console.log('Tables only in public:', diff.tablesOnlyIn1)
console.log('Tables only in staging:', diff.tablesOnlyIn2)
console.log('Differences:', diff.differences)
```

**Features:**
- ✅ Complete table/column metadata
- ✅ Index information with usage stats
- ✅ Constraint details
- ✅ Foreign key relationships
- ✅ Table dependencies
- ✅ Size and row count statistics
- ✅ Schema drift detection

**CLI:**
```bash
$ npm run db schema:inspect

📊 Schema: public

Tables: 15
Columns: 127
Indexes: 45
Constraints: 38
Total Size: 24.56 MB

📋 Tables:
  • vehicles (12 cols, 5 indexes, 150 rows)
  • trips (10 cols, 4 indexes, 1200 rows)
  • tracking_sessions (8 cols, 3 indexes, 500 rows)
```

### 2. Migration Runner

**Safe migration execution with tracking**

```typescript
// Plan migrations
const plan = await db.planMigrations('database/supabase/migrations')

console.log(`Pending: ${plan.pending.length}`)
console.log(`Applied: ${plan.applied.length}`)
console.log(`Est. time: ${(plan.estimatedTime / 1000).toFixed(0)}s`)

// Dry run first
const dryRun = await db.runMigrations('database/supabase/migrations', {
  dryRun: true
})

// Execute if dry run successful
const result = await db.runMigrations('database/supabase/migrations', {
  stopOnError: true
})

console.log(`Successful: ${result.summary.successful}`)
console.log(`Failed: ${result.summary.failed}`)
console.log(`Duration: ${(result.summary.totalTime / 1000).toFixed(2)}s`)

// Rollback if needed
await db.rollbackMigration('20241018_01')

// Validate checksums
const validation = await db.validateMigrations('database/supabase/migrations')

if (!validation.valid) {
  console.error('Migration files have been modified!')
  console.error(validation.mismatches)
}
```

**Features:**
- ✅ Migration tracking table
- ✅ Checksum validation
- ✅ Dry-run mode
- ✅ Transaction support
- ✅ Rollback capability
- ✅ Execution time tracking
- ✅ Error handling
- ✅ Dependency ordering

**CLI:**
```bash
$ npm run db migrate:plan database/supabase/migrations

📋 Migration Plan

Total migrations: 25
Applied: 20
Pending: 5
Estimated time: 25s

⏳ Pending Migrations:
  1. 20241018_01 - add_vehicle_events
  2. 20241018_02 - add_tracking_indexes
  3. 20241018_03 - add_performance_views
  4. 20241018_04 - add_rls_policies
  5. 20241018_05 - add_constraints
```

### 3. Backup & Restore

**Database backup with flexible options**

```typescript
// Full database backup
const backup = await db.backup('backups/full_backup.sql')

console.log(`Backup ID: ${backup.id}`)
console.log(`Tables: ${backup.tables.length}`)
console.log(`Rows: ${backup.rowCount}`)
console.log(`Size: ${(backup.sizeBytes / 1024 / 1024).toFixed(2)} MB`)

// Selective backup
await db.backup('backups/vehicles.sql', {
  tables: ['vehicles', 'vehicle_events'],
  schemaOnly: false
})

// Schema-only backup
await db.backup('backups/schema.sql', {
  schemaOnly: true
})

// Backup single table
await db.backupTable('vehicles', 'backups/vehicles.sql', {
  anonymize: ['vin', 'owner_email']
})

// Restore from backup
const restore = await db.restore('backups/full_backup.sql', {
  dryRun: true, // Test first
  skipErrors: false
})

if (restore.success) {
  console.log(`Restored ${restore.tablesRestored.length} tables`)
  console.log(`${restore.rowsRestored} rows in ${(restore.duration / 1000).toFixed(2)}s`)
}
```

**Features:**
- ✅ Full database backups
- ✅ Table-level backups
- ✅ Schema-only option
- ✅ Data-only option
- ✅ Data anonymization
- ✅ Metadata tracking
- ✅ Dry-run restore
- ✅ Error recovery

**CLI:**
```bash
$ npm run db backup backups/db_backup.sql

💾 Backup Created

File: backups/db_backup.sql
Tables: 15
Rows: 5,432
Size: 12.45 MB
Timestamp: 2024-10-18T20:30:00.000Z
```

### 4. Performance Analyzer

**Advanced performance monitoring**

```typescript
// Get comprehensive metrics
const metrics = await db.getPerformanceMetrics()

console.log('Database:')
console.log(`  Size: ${metrics.database.size}`)
console.log(`  Connections: ${metrics.database.connections}/${metrics.database.maxConnections}`)
console.log(`  TPS: ${metrics.database.transactionsPerSecond.toFixed(2)}`)
console.log(`  Cache Hit: ${metrics.database.cacheHitRatio.toFixed(2)}%`)

console.log('Queries:')
console.log(`  Total: ${metrics.queries.total}`)
console.log(`  Slow: ${metrics.queries.slow}`)
console.log(`  Avg Duration: ${metrics.queries.avgDuration.toFixed(2)}ms`)

// Get query profiles
const profiles = await db.getQueryProfiles(50, 10)

profiles.forEach(p => {
  console.log(`${p.fingerprint}:`)
  console.log(`  Calls: ${p.calls}`)
  console.log(`  Avg Time: ${p.meanTime.toFixed(2)}ms`)
  console.log(`  Cache Hit: ${p.cacheHitRatio.toFixed(2)}%`)
})

// Get table statistics
const stats = await db.getTableStats('public')

stats.forEach(t => {
  console.log(`${t.tableName}:`)
  console.log(`  Rows: ${t.rowCount}`)
  console.log(`  Size: ${t.totalSize}`)
  console.log(`  Seq Scans: ${t.seqScans}`)
  console.log(`  Index Scans: ${t.idxScans}`)
  console.log(`  Dead Tuples: ${t.deadTuples}`)
})

// Identify bottlenecks
const bottlenecks = await db.findBottlenecks()

console.log('Slow Queries:', bottlenecks.slowQueries.length)
console.log('Missing Indexes:', bottlenecks.missingIndexes.length)
console.log('Bloated Tables:', bottlenecks.bloatedTables.length)
console.log('Inefficient Queries:', bottlenecks.inefficientQueries.length)
```

**Features:**
- ✅ Query profiling (pg_stat_statements)
- ✅ Connection monitoring
- ✅ Cache hit ratio tracking
- ✅ Lock detection
- ✅ Table statistics
- ✅ Bottleneck identification
- ✅ Performance recommendations

**CLI:**
```bash
$ npm run db perf:metrics

📊 Performance Metrics

Database:
  Size: 24.56 MB
  Connections: 5/100
  Active: 2
  TPS: 45.23
  Cache Hit: 98.45%

Queries:
  Total: 1,234
  Slow: 12
  Avg Duration: 45.67ms

Locks:
  Total: 0
  Waiting: 0
  Blocking: 0
```

---

## 📊 USE CASES

### 1. Pre-Deployment Check

```bash
# Validate migrations
npm run db migrate:plan database/supabase/migrations

# Check for schema drift
npm run db schema:inspect

# Backup before deployment
npm run db backup backups/pre_deploy_$(date +%Y%m%d_%H%M).sql

# Run migrations (dry run first)
npm run db migrate:run database/supabase/migrations --dry-run
npm run db migrate:run database/supabase/migrations
```

### 2. Performance Investigation

```bash
# Get current metrics
npm run db perf:metrics

# Find bottlenecks
npm run db perf:bottlenecks

# Check specific queries
npm run db explain "SELECT * FROM vehicles WHERE vin = '...'"

# Get index recommendations
npm run db indexes --min-duration 100
```

### 3. Disaster Recovery

```bash
# Create backup
npm run db backup backups/emergency_backup.sql

# Test restore on different server
npm run db restore backups/emergency_backup.sql --dry-run

# Actual restore
npm run db restore backups/emergency_backup.sql
```

### 4. Database Maintenance

```bash
# Check table health
npm run db perf:bottlenecks

# Vacuum bloated tables
npm run db query "VACUUM ANALYZE vehicles"

# Rebuild indexes
npm run db query "REINDEX TABLE vehicles"

# Update statistics
npm run db query "ANALYZE"
```

---

## 🎯 BEST PRACTICES

### Migration Management

```typescript
// Always use descriptive migration names
// Format: YYYYMMDD_NN_description.sql
// Example: 20241018_01_add_vehicle_events_table.sql

// Always include rollback SQL
/*
-- Rollback SQL
DROP TABLE IF EXISTS vehicle_events CASCADE;
*/

// Always test in dry-run first
await db.runMigrations(dir, { dryRun: true })

// Validate checksums regularly
await db.validateMigrations(dir)
```

### Backup Strategy

```typescript
// Daily backups
const daily = await db.backup(`backups/daily_${date}.sql`)

// Weekly full backups
const weekly = await db.backup(`backups/weekly_${date}.sql`, {
  schemaOnly: false
})

// Table-specific backups for critical data
await db.backupTable('vehicles', 'backups/vehicles.sql')

// Keep metadata for tracking
// Backup metadata saved automatically to .meta.json
```

### Performance Monitoring

```typescript
// Weekly performance reviews
const metrics = await db.getPerformanceMetrics()
const bottlenecks = await db.findBottlenecks()

// Monthly query profile analysis
const profiles = await db.getQueryProfiles(100, 20)

// Quarterly table statistics review
const stats = await db.getTableStats()

// Apply recommended indexes
const indexes = await db.recommendIndexes(100)
// Review and apply recommendations
```

---

## 🔧 CONFIGURATION

### Migration Directory Structure

```
database/supabase/migrations/
├── 20241001_01_initial_schema.sql
├── 20241001_02_add_vehicles.sql
├── 20241015_01_add_trips.sql
├── 20241018_01_add_events.sql
└── schema_migrations (created automatically)
```

### Backup Storage

```
backups/
├── daily/
│   ├── 20241018.sql
│   ├── 20241018.sql.meta.json
│   └── 20241017.sql
├── weekly/
│   └── 2024_W42.sql
└── manual/
    └── pre_deploy_20241018.sql
```

---

## 📚 API REFERENCE

### Schema Inspector

```typescript
// Inspect full schema
await db.inspectSchema(schemaName?: string): Promise<SchemaInspectionResult>

// Get tables
await db.getTables(schemaName?: string): Promise<TableInfo[]>

// Get columns
await db.getColumns(tableName: string, schemaName?: string): Promise<ColumnInfo[]>

// Compare schemas
await db.compareSchemas(schema1: string, schema2: string): Promise<SchemaDiff>
```

### Migration Runner

```typescript
// Plan migrations
await db.planMigrations(directory: string): Promise<MigrationPlan>

// Run migrations
await db.runMigrations(directory: string, options?: {
  dryRun?: boolean
  stopOnError?: boolean
}): Promise<MigrationResult>

// Rollback migration
await db.rollbackMigration(migrationId: string): Promise<RollbackResult>

// Validate checksums
await db.validateMigrations(directory: string): Promise<ValidationResult>
```

### Backup & Restore

```typescript
// Backup database
await db.backup(outputPath: string, options?: {
  tables?: string[]
  schemaOnly?: boolean
  dataOnly?: boolean
  exclude?: string[]
}): Promise<BackupMetadata>

// Restore database
await db.restore(backupPath: string, options?: {
  overwrite?: boolean
  dryRun?: boolean
  skipErrors?: boolean
}): Promise<RestoreResult>

// Backup table
await db.backupTable(tableName: string, outputPath: string, options?: {
  schemaOnly?: boolean
  anonymize?: string[]
}): Promise<void>
```

### Performance Analyzer

```typescript
// Get metrics
await db.getPerformanceMetrics(): Promise<PerformanceMetrics>

// Get query profiles
await db.getQueryProfiles(limit?: number, minCalls?: number): Promise<QueryProfile[]>

// Get table stats
await db.getTableStats(schemaName?: string): Promise<TableStatistics[]>

// Find bottlenecks
await db.findBottlenecks(): Promise<PerformanceBottlenecks>
```

---

## 🎊 WHAT'S NEW IN PHASE 3

**4 Major Features:**

1. **Schema Inspector** - Deep introspection + drift detection
2. **Migration Runner** - Safe execution with rollback
3. **Backup & Restore** - Flexible backup options
4. **Performance Analyzer** - Advanced monitoring

**New CLI Commands:**
- `npm run db schema:inspect` - Schema introspection
- `npm run db migrate:plan <dir>` - Migration planning
- `npm run db migrate:run <dir>` - Migration execution
- `npm run db backup <output>` - Database backup
- `npm run db restore <backup>` - Database restore
- `npm run db perf:metrics` - Performance metrics
- `npm run db perf:bottlenecks` - Bottleneck analysis

**New API Methods:**
- `db.inspectSchema()` - Schema introspection
- `db.getTables()` - Get tables
- `db.getColumns()` - Get columns
- `db.compareSchemas()` - Drift detection
- `db.planMigrations()` - Migration planning
- `db.runMigrations()` - Migration execution
- `db.backup()` - Database backup
- `db.restore()` - Database restore
- `db.getPerformanceMetrics()` - Get metrics
- `db.findBottlenecks()` - Find bottlenecks

---

## 🚀 NEXT STEPS

### Phase 4: Replace Old Scripts (Coming Soon)
- Deprecate 25+ scattered scripts
- Unified interface for all DB operations
- Update MCP server integration
- CLI improvements

---

## 📖 RELATED DOCUMENTATION

- **Phase 1:** `docs/DATABASE_TOOLKIT_GUIDE.md`
- **Phase 2:** `docs/DATABASE_AI_INTEGRATION.md`
- **Quick Reference:** `docs/DATABASE_AI_CHEATSHEET.md`

---

**Advanced operations are now live! 🎉**
