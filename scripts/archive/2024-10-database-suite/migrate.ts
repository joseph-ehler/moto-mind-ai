#!/usr/bin/env tsx
/**
 * Autonomous Migration Runner
 * 
 * Applies migrations directly to Supabase database using PostgreSQL client
 * Usage: npm run db:migrate
 */

import { Client } from 'pg'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  console.error('❌ Missing DATABASE_URL in .env.local')
  process.exit(1)
}

const client = new Client({ connectionString: DATABASE_URL })

async function ensureMigrationsTable() {
  try {
    // Try to query the table - if it doesn't exist, create it
    await client.query('SELECT 1 FROM schema_migrations LIMIT 1')
  } catch (error: any) {
    // Table doesn't exist, create it
    console.log('📦 Creating schema_migrations table...')
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        filename TEXT UNIQUE NOT NULL,
        applied_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_schema_migrations_filename ON schema_migrations(filename);
    `)
    
    console.log('✅ schema_migrations table created')
  }
}

async function getAppliedMigrations(): Promise<Set<string>> {
  try {
    const result = await client.query('SELECT filename FROM schema_migrations')
    return new Set(result.rows.map((m: any) => m.filename))
  } catch (error: any) {
    console.warn('⚠️  Could not read schema_migrations:', error.message)
    return new Set()
  }
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
  try {
    await client.query(sql)
  } catch (error: any) {
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
    await client.query(
      'INSERT INTO schema_migrations (filename) VALUES ($1) ON CONFLICT (filename) DO NOTHING',
      [fileName]
    )
    
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
  console.log(`📍 Database: ${DATABASE_URL?.split('@')[1]?.split('/')[0] || 'Connected'}\n`)
  
  try {
    // Connect to database
    await client.connect()
    
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
    await client.end()
    process.exit(1)
  } finally {
    await client.end()
  }
}

runMigrations().catch((error) => {
  console.error('\n💥 Fatal error:', error)
  process.exit(1)
})
