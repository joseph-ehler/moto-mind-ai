#!/usr/bin/env tsx
/**
 * Autonomous Migration Runner
 * 
 * Applies migrations directly to Supabase database
 * Usage: npm run db:migrate
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing environment variables')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function ensureMigrationsTable() {
  // Check if migrations table exists
  const { data: tables } = await supabase.rpc('get_all_tables')
  
  const hasMigrationsTable = tables?.some((t: any) => t.table_name === 'schema_migrations')
  
  if (!hasMigrationsTable) {
    console.log('📦 Creating schema_migrations table...')
    
    // Create using raw SQL through a function
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        applied_at TIMESTAMPTZ DEFAULT NOW()
      );
    `
    
    // We need to execute this via a privileged function or direct SQL
    // For now, we'll use service role to create it via INSERT (which will fail gracefully)
    // The user will need to create this table once manually or we use a different approach
    
    console.log('⚠️  Please create schema_migrations table manually:')
    console.log(createTableSQL)
    console.log('\nOr run this in Supabase SQL Editor, then run db:migrate again')
    process.exit(1)
  }
}

async function getAppliedMigrations(): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('schema_migrations')
    .select('name')
  
  if (error) {
    console.warn('⚠️  Could not read schema_migrations:', error.message)
    return new Set()
  }
  
  return new Set(data?.map(m => m.name) || [])
}

async function getPendingMigrations(appliedSet: Set<string>): Promise<string[]> {
  const migrationsDir = path.join(process.cwd(), 'supabase/migrations')
  
  if (!fs.existsSync(migrationsDir)) {
    console.error('❌ Migrations directory not found:', migrationsDir)
    process.exit(1)
  }
  
  const files = fs.readdirSync(migrationsDir)
    .filter(f => 
      f.endsWith('.sql') && 
      !f.endsWith('_rollback.sql') &&
      !appliedSet.has(f)
    )
    .sort()
  
  return files
}

async function executeSQLFile(filePath: string): Promise<void> {
  const sql = fs.readFileSync(filePath, 'utf8')
  
  // Execute the entire file as one block
  const { error } = await supabase.rpc('exec_sql', { sql })
  
  if (error) {
    throw new Error(`SQL execution failed: ${error.message}`)
  }
}

async function applyMigration(fileName: string): Promise<boolean> {
  const filePath = path.join(process.cwd(), 'supabase/migrations', fileName)
  
  console.log(`\n⏳ Applying: ${fileName}`)
  
  try {
    // Execute the migration
    await executeSQLFile(filePath)
    
    // Record as applied
    const { error } = await supabase
      .from('schema_migrations')
      .insert({ name: fileName })
    
    if (error && !error.message.includes('duplicate key')) {
      throw error
    }
    
    console.log(`✅ ${fileName} applied successfully`)
    return true
    
  } catch (error: any) {
    console.error(`❌ Failed to apply ${fileName}:`)
    console.error(error.message || error)
    return false
  }
}

async function runMigrations() {
  console.log('🔄 DATABASE MIGRATION RUNNER\n')
  console.log(`📍 Database: ${SUPABASE_URL}\n`)
  
  try {
    // Ensure migrations table exists
    await ensureMigrationsTable()
    
    // Get applied migrations
    const appliedSet = await getAppliedMigrations()
    console.log(`✅ ${appliedSet.size} migrations already applied\n`)
    
    // Get pending migrations
    const pending = await getPendingMigrations(appliedSet)
    
    if (pending.length === 0) {
      console.log('✨ Database is up to date! No pending migrations.\n')
      return
    }
    
    console.log(`📦 Found ${pending.length} pending migrations:\n`)
    pending.forEach((f, i) => console.log(`   ${i + 1}. ${f}`))
    console.log('')
    
    // Apply each migration
    let applied = 0
    let failed = 0
    
    for (const file of pending) {
      const success = await applyMigration(file)
      if (success) {
        applied++
      } else {
        failed++
        console.log('\n⚠️  Migration failed. Stopping here to prevent cascading errors.')
        break
      }
    }
    
    console.log('\n' + '='.repeat(60))
    console.log('📊 MIGRATION SUMMARY')
    console.log('='.repeat(60))
    console.log(`✅ Applied: ${applied}`)
    if (failed > 0) {
      console.log(`❌ Failed: ${failed}`)
      console.log(`⏸️  Remaining: ${pending.length - applied - failed}`)
    }
    console.log('')
    
    if (failed === 0) {
      console.log('🎉 All migrations applied successfully!')
      console.log('Run: npm run db:validate')
    }
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error)
    process.exit(1)
  }
}

runMigrations()
