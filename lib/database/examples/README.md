# Database Toolkit Examples

This directory contains example scripts demonstrating the God-Tier Database Toolkit features.

## Running Examples

### AI Features Demo

Comprehensive demo of all Phase 2 AI capabilities:

```bash
npx tsx lib/database/examples/ai-features-demo.ts
```

**Demonstrates:**
- Natural language queries
- Query explanation
- Index recommendations
- Schema context generation
- Schema export

## Quick Examples

### Natural Language Queries

```typescript
import { initDatabase } from '@/lib/database/core'

const db = await initDatabase()

// Ask in plain English
const result = await db.ask("Show me vehicles from last week")
console.log(result.rows)

// Dry run to preview SQL
const preview = await db.ask("Delete old trips", { dryRun: true })
console.log(preview.nlQuery.generatedSql)
```

### Query Explanation

```typescript
const explanation = await db.explain(`
  SELECT * FROM vehicles 
  WHERE vin = 'ABC123'
`)

console.log(explanation.summary)
console.log(explanation.performance.rating)
console.log(explanation.recommendations)
```

### Index Recommendations

```typescript
const { slowQueries, recommendations } = await db.recommendIndexes(100)

recommendations.forEach(rec => {
  console.log(`${rec.priority}: ${rec.table} (${rec.columns.join(', ')})`)
  console.log(rec.sql)
})
```

### Schema Context

```typescript
const context = await db.getSchemaContext()

console.log(`Tables: ${context.tables.length}`)
console.log(`Relationships: ${context.relationships.length}`)

// Export as markdown
await db.exportSchema('docs/schema.md')
```

## More Examples

See the full documentation:
- **AI Integration:** `docs/DATABASE_AI_INTEGRATION.md`
- **Quick Reference:** `docs/DATABASE_AI_CHEATSHEET.md`
- **Core Guide:** `docs/DATABASE_TOOLKIT_GUIDE.md`
