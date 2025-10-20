#!/usr/bin/env tsx
/**
 * Generate Combined Migration SQL
 * 
 * Creates a single SQL file you can paste into Supabase Dashboard SQL Editor
 * Usage: npm run db:generate-sql
 */

import * as fs from 'fs'
import * as path from 'path'

const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations')
const outputDir = path.join(process.cwd(), '.migrations-output')
const outputFile = path.join(outputDir, 'pending-migrations.sql')

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true })
}

// These migrations need to be applied
const pendingMigrations = [
  '20251016_14_fix_security_issues.sql'
]

console.log('\n📝 GENERATING MIGRATION SQL\n')

let combinedSql = `-- ============================================================================
-- PENDING MIGRATIONS
-- Generated: ${new Date().toISOString()}
-- ============================================================================

-- Ensure migrations table exists
CREATE TABLE IF NOT EXISTS schema_migrations (
  id SERIAL PRIMARY KEY,
  filename TEXT UNIQUE NOT NULL,
  applied_at TIMESTAMPTZ DEFAULT NOW()
);

`

for (const file of pendingMigrations) {
  const filepath = path.join(migrationsDir, file)
  
  if (!fs.existsSync(filepath)) {
    console.error(`❌ Migration not found: ${file}`)
    continue
  }
  
  const sql = fs.readFileSync(filepath, 'utf-8')
  
  combinedSql += `
-- ============================================================================
-- MIGRATION: ${file}
-- ============================================================================

${sql}

-- Record migration
INSERT INTO schema_migrations (filename) VALUES ('${file}')
  ON CONFLICT (filename) DO NOTHING;

`
  
  console.log(`✅ Added: ${file}`)
}

fs.writeFileSync(outputFile, combinedSql)

console.log(`\n✅ SQL generated: ${outputFile}`)
console.log('\n📋 NEXT STEPS:')
console.log('1. Open: https://supabase.com/dashboard/project/ucbbzzoimghnaoihyqbd/sql/new')
console.log('2. Copy the contents of: pending-migrations.sql')
console.log('3. Paste into SQL Editor')
console.log('4. Click "Run" button')
console.log('\n')
