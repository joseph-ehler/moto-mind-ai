# God-Tier Database Toolkit - Complete Guide

**Status:** ✅ Phase 1 Complete  
**Version:** 1.0.0  
**Last Updated:** October 18, 2024

---

## 🎯 THE VISION

A **bulletproof, AI-native database toolkit** that:
- ✅ Never fails (automatic fallbacks)
- ✅ Is always safe (dry-run, transactions, validations)
- ✅ Self-heals (proactive health checks)
- ✅ Speaks SQL & English (natural language queries coming)
- ✅ Works for humans & AI (Cascade can self-service 90%)

---

## 🏗️ ARCHITECTURE

```
lib/database/
├── core/
│   ├── types.ts                   # Shared types
│   ├── connection-manager.ts      # Smart multi-fallback connections
│   ├── query-executor.ts          # Safe SQL execution + transactions
│   ├── health-monitor.ts          # Proactive health checks
│   └── index.ts                   # Main Database class
│
├── cli/
│   └── index.ts                   # Unified CLI
│
└── (coming soon)
    ├── introspection/             # Schema analysis
    ├── operations/                # Migrations, backups
    ├── analysis/                  # Performance, security
    └── ai-tools/                  # Natural language queries
```

---

## 🔌 CONNECTION STRATEGY

### The Problem
Supabase offers **3 connection methods**:
1. **Direct Connection (Port 5432)** - Fast, requires IPv6
2. **Transaction Pooler (Port 6543)** - Serverless, no PREPARE
3. **Session Pooler** - IPv4 fallback

**Our Solution:** Try all 3 automatically until one works!

### Connection Priority

**For READ operations:**
1. Transaction Pooler (best for serverless)
2. Direct Connection (fastest)
3. Session Pooler (IPv4 fallback)
4. Supabase HTTP API (always works)

**For WRITE operations:**
1. Direct Connection (supports transactions)
2. Session Pooler (IPv4 fallback)
3. Supabase HTTP API (limited features)

### Health Monitoring
- Checks every 30 seconds
- Auto-reconnects on failure
- Tracks latency trends
- Alerts on degradation

---

## 🚀 QUICK START

### 1. Basic Usage

```typescript
import { initDatabase } from '@/lib/database/core'

// Initialize (auto-connects)
const db = await initDatabase()

// Simple query
const result = await db.query('SELECT * FROM vehicles LIMIT 10')
console.log(result.rows)

// With parameters (SQL injection prevention)
const vehicle = await db.query(
  'SELECT * FROM vehicles WHERE vin = $1',
  { params: ['1HGBH41JXMN109186'] }
)
```

### 2. Safe Operations

```typescript
// Dry run (preview without executing)
const preview = await db.query(
  'DELETE FROM vehicles WHERE status = \'inactive\'',
  { dryRun: true }
)

// Get query plan (optimization)
const plan = await db.query(
  'SELECT * FROM vehicles WHERE vin = $1',
  { explain: true, params: ['ABC123'] }
)
console.log(plan.plan.summary)

// Read-only mode (extra safety)
const data = await db.query(
  'SELECT * FROM vehicles',
  { readOnly: true }
)
```

### 3. Transactions

```typescript
// Single transaction
await db.transaction(async (db) => {
  await db.query('INSERT INTO vehicles (...) VALUES (...)')
  await db.query('INSERT INTO vehicle_events (...) VALUES (...)')
  // Both succeed or both fail
})

// With query executor
const result = await db.query(
  'UPDATE vehicles SET status = $1 WHERE id = $2',
  { 
    transaction: true,
    params: ['active', vehicleId]
  }
)
```

### 4. Streaming Large Results

```typescript
// Handle millions of rows without memory issues
for await (const batch of db.stream('SELECT * FROM trips', [], 1000)) {
  console.log(`Processing ${batch.length} rows...`)
  // Process batch
}
```

### 5. Health Checks

```typescript
// Quick check
const health = await db.healthQuick()
console.log(`Database: ${health.healthy ? '✅' : '❌'} (${health.latency}ms)`)

// Full report
const report = await db.health()
console.log(`Score: ${report.score}/100`)
console.log(`Status: ${report.overall}`)
console.log('Recommendations:', report.recommendations)
```

---

## 🖥️ CLI USAGE

### Basic Commands

```bash
# Health check
npm run db health

# Quick check (connections only)
npm run db health --quick

# Execute query
npm run db query "SELECT * FROM vehicles LIMIT 10"

# Preview query (dry-run)
npm run db query "DELETE FROM vehicles" --dry-run

# Get query plan
npm run db query "SELECT * FROM vehicles WHERE vin = 'ABC'" --explain

# Export as JSON
npm run db query "SELECT * FROM vehicles" --format=json > vehicles.json

# Export as CSV
npm run db query "SELECT * FROM vehicles" --format=csv > vehicles.csv
```

### Query Options

```bash
-f, --format <type>    Output format (table|json|csv)
-d, --dry-run          Preview without executing
-e, --explain          Show query plan
-r, --read-only        Execute in read-only mode
-t, --transaction      Execute in transaction
```

### Examples

```bash
# Safe delete (requires confirmation)
npm run db query "DELETE FROM vehicles WHERE status = 'test'"

# Read-only query
npm run db query "SELECT * FROM vehicles" --read-only

# Transaction
npm run db query "UPDATE vehicles SET status = 'active'" --transaction

# Get help
npm run db help
```

---

## 🛡️ SAFETY FEATURES

### 1. Destructive Query Detection

The toolkit automatically detects and blocks:
- `DROP TABLE/DATABASE/SCHEMA`
- `TRUNCATE`
- `DELETE` without WHERE clause
- `UPDATE` without WHERE clause

```typescript
// ❌ BLOCKED (no WHERE clause)
await db.query('DELETE FROM vehicles')
// Error: Destructive query requires confirmation

// ✅ ALLOWED (with confirmation)
await db.query('DELETE FROM vehicles WHERE status = \'test\'', {
  confirm: true
})
```

### 2. Query Validations

```typescript
// Warns about potential issues
await db.query('SELECT * FROM vehicles')
// Warning: SELECT * can be slow - consider specifying columns
// Warning: No LIMIT clause - could return many rows
```

### 3. Transaction Safety

```typescript
// Automatic rollback on error
await db.transaction(async (db) => {
  await db.query('INSERT INTO vehicles (...)')
  await db.query('INVALID SQL')  // Error here
  // First query automatically rolled back
})
```

### 4. Timeout Protection

```typescript
// Prevent runaway queries
await db.query('SELECT * FROM huge_table', {
  timeout: 5000  // Kill after 5 seconds
})
```

### 5. Retry Logic

```typescript
// Automatic retry with exponential backoff
const result = await db.queryWithRetry(
  'SELECT * FROM vehicles',
  { readOnly: true },
  3  // Max 3 retries
)
```

---

## 📊 HEALTH MONITORING

### Health Score (0-100)

**Factors:**
- Connection health (30 points)
- Connection pool utilization (10 points)
- Cache hit ratio (20 points)
- Slow queries (15 points)
- Deadlocks (10 points)
- Blocked queries (10 points)
- Long-running queries (5 points)

### Health Report

```typescript
const report = await db.health()

console.log(report)
// {
//   overall: 'healthy',
//   score: 95,
//   connections: [
//     { type: 'direct', status: 'healthy', latency: 12 },
//     { type: 'session', status: 'healthy', latency: 45 }
//   ],
//   database: {
//     size: '142 MB',
//     connections: 5,
//     maxConnections: 100,
//     slowQueries: 2,
//     cacheHitRatio: 98.5
//   },
//   recommendations: ['✅ All systems operational']
// }
```

---

## 🔥 ADVANCED FEATURES

### Custom Connection Config

```typescript
import { Database, ConnectionManager } from '@/lib/database/core'

const manager = new ConnectionManager({
  directUrl: process.env.DATABASE_URL!,
  sessionPoolerUrl: process.env.DATABASE_SESSION_POOLER_URL!,
  transactionPoolerUrl: process.env.DATABASE_TRANSACTION_POOLER_URL!,
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  poolMin: 2,
  poolMax: 10,
  connectionTimeout: 10000,
  statementTimeout: 30000
})

const db = new Database(manager)
await db.initialize()
```

### Direct Access to Components

```typescript
const db = await initDatabase()

// Access connection manager
const connections = db.getConnectionManager().getConnections()

// Access query executor
const executor = db.getQueryExecutor()

// Access health monitor
const health = db.getHealthMonitor()
```

---

## 🎯 USE CASES

### 1. Debugging

```bash
# Quick health check
npm run db health --quick

# Find slow queries
npm run db query "SELECT * FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10" --format=table

# Check table sizes
npm run db query "SELECT tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) FROM pg_tables WHERE schemaname = 'public'" --format=table
```

### 2. Data Export

```bash
# Export vehicles as JSON
npm run db query "SELECT * FROM vehicles" --format=json > vehicles.json

# Export trips as CSV
npm run db query "SELECT * FROM trips WHERE created_at >= NOW() - INTERVAL '7 days'" --format=csv > recent_trips.csv
```

### 3. Safe Maintenance

```typescript
// Preview destructive operation
const preview = await db.query(
  'DELETE FROM old_sessions WHERE created_at < NOW() - INTERVAL \'30 days\'',
  { dryRun: true }
)
console.log('Would delete:', preview.rowCount, 'rows')

// Execute after confirmation
const result = await db.query(
  'DELETE FROM old_sessions WHERE created_at < NOW() - INTERVAL \'30 days\'',
  { confirm: true, transaction: true }
)
console.log('Deleted:', result.rowCount, 'rows')
```

### 4. Performance Analysis

```typescript
// Get query plan
const plan = await db.query(
  `SELECT v.*, COUNT(t.id) as trip_count
   FROM vehicles v
   LEFT JOIN trips t ON t.vehicle_id = v.id
   GROUP BY v.id
   HAVING COUNT(t.id) > 100`,
  { explain: true }
)

console.log('Execution time:', plan.plan.executionTime, 'ms')
console.log('Planning time:', plan.plan.planningTime, 'ms')
console.log('Summary:', plan.plan.summary)
```

---

## 🚦 ERROR HANDLING

### Graceful Degradation

```typescript
try {
  const result = await db.query('SELECT * FROM vehicles')
} catch (error) {
  // Error includes context
  console.error(error.message)
  // "Query failed after 125ms: syntax error at or near 'SELCT'
  //  SQL: SELCT * FROM vehicles"
}
```

### Connection Failures

The toolkit automatically:
1. Tries next connection method
2. Logs warning
3. Retries with backoff
4. Eventually throws clear error

```typescript
// All connections failed
// Error: All connection strategies failed
```

---

## 📋 ENVIRONMENT VARIABLES

Required in `.env.local`:

```bash
# PostgreSQL connections
DATABASE_URL=postgresql://...                 # Direct (Port 5432)
DATABASE_SESSION_POOLER_URL=postgresql://...  # Session pooler
DATABASE_TRANSACTION_POOLER_URL=postgresql://... # Transaction pooler

# Supabase (fallback)
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

---

## 🎊 WHAT'S NEXT

### Phase 2: AI Integration (Coming Soon)
- Natural language queries
- Schema context for AI
- Query explanation
- Index recommendations

### Phase 3: Advanced Operations (Coming Soon)
- Schema introspection
- Migration runner
- Backup/restore
- Performance analyzer

### Phase 4: Security & Monitoring (Coming Soon)
- RLS policy validation
- Security audit
- Real-time monitoring
- Alert system

---

## 💡 BEST PRACTICES

### DO ✅
- Use parameterized queries
- Enable dry-run for destructive operations
- Monitor health regularly
- Use transactions for multi-step operations
- Stream large result sets
- Handle errors gracefully

### DON'T ❌
- Execute raw user input without validation
- Skip dry-run on DELETE/UPDATE without WHERE
- Ignore health warnings
- Fetch millions of rows at once
- Hardcode credentials
- Use `SELECT *` in production

---

## 🆘 TROUBLESHOOTING

### Connection Issues

```bash
# Check health
npm run db health

# If all connections failed, check:
1. Are environment variables set?
2. Is database accessible?
3. Are connection URLs correct?
4. Is IPv6 available (for direct connection)?
```

### Slow Queries

```bash
# Get query plan
npm run db query "YOUR_QUERY" --explain

# Check for missing indexes
# Check for full table scans
# Consider adding LIMIT clause
```

### Health Score Low

```bash
# Get recommendations
npm run db health

# Common issues:
- High connection pool utilization → Increase max connections
- Low cache hit ratio → Increase shared_buffers
- Many slow queries → Run performance analysis
- Deadlocks → Review transaction logic
```

---

## 📚 RESOURCES

- **Architecture:** This document
- **Code:** `lib/database/core/`
- **Examples:** See "Use Cases" section
- **CLI Help:** `npm run db help`

---

**Built for maximum reliability and developer velocity! 🗄️⚡**
