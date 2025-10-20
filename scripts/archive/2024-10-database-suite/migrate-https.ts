#!/usr/bin/env tsx
/**
 * HTTPS-based Migration Runner
 * 
 * Uses Supabase Management API instead of direct PostgreSQL connection
 * Works around DNS resolution issues
 */

import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// Remove trailing slash
const baseUrl = SUPABASE_URL.replace(/\/$/, '')

async function executeSQL(sql: string): Promise<any> {
  // Use Supabase's SQL endpoint via PostgREST
  const response = await fetch(`${baseUrl}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_ROLE_KEY!,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY!}`,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({ query: sql })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`HTTP ${response.status}: ${errorText}`)
  }

  return response.json()
}

async function ensureMigrationsTable() {
  console.log('📦 Ensuring schema_migrations table exists...')
  
  const sql = `
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      filename TEXT UNIQUE NOT NULL,
      applied_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_schema_migrations_filename ON schema_migrations(filename);
  `
  
  try {
    await executeSQL(sql)
    console.log('✅ schema_migrations table ready')
  } catch (error: any) {
    console.error('❌ Failed to create migrations table:', error.message)
    throw error
  }
}

async function getAppliedMigrations(): Promise<Set<string>> {
  const sql = 'SELECT filename FROM schema_migrations'
  
  try {
    const result = await executeSQL(sql)
    return new Set(result.map((m: any) => m.filename))
  } catch (error) {
    console.warn('⚠️  Could not read migrations, assuming none applied')
    return new Set()
  }
}

async function applyMigration(filename: string, sql: string): Promise<boolean> {
  console.log(`⏳ Applying: ${filename}`)
  
  try {
    // Execute migration
    await executeSQL(sql)
    
    // Record migration
    const recordSql = `INSERT INTO schema_migrations (filename) VALUES ('${filename}')`
    await executeSQL(recordSql)
    
    console.log(`✅ ${filename} applied successfully`)
    return true
  } catch (error: any) {
    console.error(`❌ Failed to apply ${filename}:`)
    console.error(`   ${error.message}`)
    return false
  }
}

async function main() {
  console.log('\n🔄 DATABASE MIGRATION RUNNER (HTTPS Mode)\n')
  console.log(`📍 Database: ${SUPABASE_URL}\n`)

  try {
    await ensureMigrationsTable()

    const applied = await getAppliedMigrations()
    console.log(`✅ ${applied.size} migrations already applied\n`)

    // Get pending migrations
    const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations')
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql') && !f.endsWith('_rollback.sql'))
      .sort()

    const pending = files.filter(f => !applied.has(f))

    if (pending.length === 0) {
      console.log('✅ All migrations are up to date!')
      process.exit(0)
    }

    console.log(`📦 Found ${pending.length} pending migrations:\n`)
    pending.forEach((f, i) => console.log(`   ${i + 1}. ${f}`))
    console.log('\n')

    let success = 0
    let failed = 0

    for (const file of pending) {
      const filepath = path.join(migrationsDir, file)
      const sql = fs.readFileSync(filepath, 'utf-8')

      const result = await applyMigration(file, sql)
      
      if (result) {
        success++
      } else {
        failed++
        console.log('\n⚠️  Migration failed. Stopping here to prevent cascading errors.')
        break
      }
    }

    console.log('\n' + '='.repeat(60))
    console.log('📊 MIGRATION SUMMARY')
    console.log('='.repeat(60))
    console.log(`✅ Applied: ${success}`)
    console.log(`❌ Failed: ${failed}`)
    console.log(`⏸️  Remaining: ${pending.length - success - failed}`)

    process.exit(failed > 0 ? 1 : 0)

  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message)
    process.exit(1)
  }
}

main()
