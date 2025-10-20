# Database AI Toolkit - Quick Reference

**One-page cheatsheet for AI-powered database operations**

---

## 🚀 CLI COMMANDS

### Query

```bash
# Raw SQL
npm run db query "SELECT * FROM vehicles LIMIT 10"

# Natural language
npm run db ask "Show me vehicles from last week"
npm run db ask "How many trips in December?"
npm run db ask "List crash events from today"

# With options
npm run db query "..." --dry-run
npm run db query "..." --explain
npm run db query "..." --format=json
npm run db ask "..." --dry-run
```

### Analysis

```bash
# Explain query
npm run db explain "SELECT * FROM vehicles WHERE vin = '...'"

# Find slow queries + missing indexes
npm run db indexes
npm run db indexes --min-duration 200

# Export schema docs
npm run db schema:export
npm run db schema:export -o docs/schema.md
```

### Health

```bash
# Full health check
npm run db health

# Quick check
npm run db health --quick
```

---

## 💻 PROGRAMMATIC API

### Natural Language

```typescript
import { initDatabase } from '@/lib/database/core'

const db = await initDatabase()

// Ask in English
const result = await db.ask("Show me vehicles from last week")
console.log(result.nlQuery.generatedSql)
console.log(result.rows)

// Dry run
const preview = await db.ask("...", { dryRun: true })
```

### Query Explanation

```typescript
// Explain any query
const explanation = await db.explain(`
  SELECT * FROM vehicles WHERE vin = 'ABC123'
`)

console.log(explanation.summary)
console.log(explanation.steps)
console.log(explanation.recommendations)
```

### Index Recommendations

```typescript
// Find missing indexes
const { slowQueries, recommendations } = await db.recommendIndexes()

recommendations.forEach(rec => {
  console.log(rec.priority, rec.table, rec.columns)
  console.log(rec.sql)
})
```

### Schema Context

```typescript
// Get full schema
const context = await db.getSchemaContext()

console.log(context.tables)
console.log(context.relationships)

// Export markdown
await db.exportSchema('docs/schema.md')
```

### Raw SQL

```typescript
// Execute query
const result = await db.query<Vehicle>('SELECT * FROM vehicles')

// With options
const result = await db.query(sql, {
  params: [userId],
  dryRun: true,
  explain: true,
  readOnly: true,
  transaction: true,
  timeout: 5000
})

// Stream large results
for await (const batch of db.stream(sql)) {
  console.log(batch) // Process in batches
}

// Transaction
await db.transaction(async (db) => {
  await db.query('INSERT ...')
  await db.query('UPDATE ...')
})
```

### Health Monitoring

```typescript
// Full health check
const report = await db.health()
console.log(report.overall) // 'healthy' | 'degraded' | 'down'
console.log(report.connections)
console.log(report.database)
console.log(report.recommendations)

// Quick check
const health = await db.healthQuick()
console.log(health.healthy)
console.log(health.latency)
```

---

## 🔧 CONFIGURATION

### Environment Variables

```bash
# Required
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# Database connections
SUPABASE_DB_HOST=xxx.supabase.co
SUPABASE_DB_PASSWORD=xxx

# Optional (for natural language queries)
OPENAI_API_KEY=sk-...
```

---

## 📊 OUTPUT FORMATS

### CLI Table

```bash
npm run db query "SELECT * FROM vehicles LIMIT 5"

# Output:
┌─────────┬──────────────────┬────────┬─────────┬──────┐
│ id      │ vin              │ make   │ model   │ year │
├─────────┼──────────────────┼────────┼─────────┼──────┤
│ abc...  │ 1HGBH41JXMN...   │ Honda  │ Civic   │ 2019 │
└─────────┴──────────────────┴────────┴─────────┴──────┘
```

### JSON

```bash
npm run db query "SELECT * FROM vehicles LIMIT 5" --format=json

# Output:
[
  { "id": "abc...", "vin": "1HGBH41JXMN...", "make": "Honda", ... }
]
```

### CSV

```bash
npm run db query "SELECT * FROM vehicles LIMIT 5" --format=csv

# Output:
id,vin,make,model,year
abc...,1HGBH41JXMN...,Honda,Civic,2019
```

---

## 🎯 COMMON PATTERNS

### Read Data

```typescript
// Natural language
const vehicles = await db.ask("Show me Honda vehicles from 2020")

// Raw SQL
const vehicles = await db.query<Vehicle>(
  'SELECT * FROM vehicles WHERE make = $1 AND year = $2',
  { params: ['Honda', 2020], readOnly: true }
)
```

### Write Data

```typescript
// Always in transaction
await db.transaction(async (db) => {
  await db.query('INSERT INTO vehicles (...) VALUES (...)')
  await db.query('INSERT INTO vehicle_events (...) VALUES (...)')
})
```

### Performance Analysis

```typescript
// 1. Find slow queries
const { recommendations } = await db.recommendIndexes(100)

// 2. Explain specific query
const explanation = await db.explain(sql)

// 3. Apply recommended indexes
// CREATE INDEX ... (from recommendations)
```

### Schema Documentation

```typescript
// Generate and save
await db.exportSchema('docs/schema.md')

// Get context for AI
const context = await db.getSchemaContext()
```

---

## ⚠️ BEST PRACTICES

### Safety

- ✅ Always use `dryRun: true` for destructive operations
- ✅ Use transactions for multi-statement writes
- ✅ Set `readOnly: true` for read queries
- ✅ Use parameterized queries ($1, $2) to prevent SQL injection

### Performance

- ✅ Run `npm run db indexes` monthly to find missing indexes
- ✅ Use `explain` to understand slow queries
- ✅ Use `stream()` for large result sets (>1000 rows)
- ✅ Set appropriate timeouts

### AI Queries

- ✅ Start with simple, specific questions
- ✅ Use `--dry-run` to preview generated SQL
- ✅ Review generated SQL before executing
- ✅ Check confidence scores in responses

---

## 🚨 TROUBLESHOOTING

### Connection Issues

```bash
# Check health
npm run db health

# Check connections
npm run db health --quick
```

### Slow Queries

```bash
# Find slow queries
npm run db indexes

# Explain specific query
npm run db explain "YOUR_SLOW_QUERY"
```

### Natural Language Not Working

```bash
# Check if OPENAI_API_KEY is set
echo $OPENAI_API_KEY

# Use --dry-run to see generated SQL
npm run db ask "..." --dry-run
```

---

## 📚 QUICK LINKS

- **Full Guide:** `docs/DATABASE_AI_INTEGRATION.md`
- **Core Guide:** `docs/DATABASE_TOOLKIT_GUIDE.md`
- **Code:** `lib/database/`

---

**🔥 God-Tier DB Toolkit - AI Edition**
