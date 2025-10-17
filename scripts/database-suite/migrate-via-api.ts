#!/usr/bin/env tsx
/**
 * Migration Runner via Supabase Dashboard SQL Editor
 * 
 * Workaround for DNS issues - generates SQL to paste into Supabase dashboard
 * Usage: npm run db:migrate:manual
 */

import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function executeSql(sql: string): Promise<any> {
  // Try using Supabase client's RPC or direct query
  const { data, error } = await supabase.rpc('exec', { sql })
  if (error) throw error
  return data
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
    await executeSql(sql)
    console.log('✅ schema_migrations table ready')
  } catch (error: any) {
    console.error('❌ Failed to create migrations table:', error.message)
    throw error
  }
}

async function getAppliedMigrations(): Promise<Set<string>> {
  try {
    const sql = 'SELECT filename FROM schema_migrations'
    const result = await executeSql(sql)
    return new Set(result.map((m: any) => m.filename))
  } catch (error) {
    return new Set()
  }
}

async function applyMigration(filename: string, sql: string) {
  console.log(`⏳ Applying: ${filename}`)
  
  try {
    // Execute migration
    await executeSql(sql)
    
    // Record migration
    const recordSql = `INSERT INTO schema_migrations (filename) VALUES ('${filename}')`
    await executeSql(recordSql)
    
    console.log(`✅ ${filename} applied successfully`)
    return true
  } catch (error: any) {
    console.error(`❌ Failed to apply ${filename}:`)
    console.error(`SQL execution failed: ${error.message}`)
    return false
  }
}

async function main() {
  console.log('\n🔄 DATABASE MIGRATION RUNNER (API Mode)\n')
  console.log(`📍 Supabase URL: ${SUPABASE_URL}\n`)

  try {
    await ensureMigrationsTable()

    const applied = await getAppliedMigrations()
    console.log(`✅ ${applied.size} migrations already applied\n`)

    // Get pending migrations
    const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations')
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
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
