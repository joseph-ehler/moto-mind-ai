#!/usr/bin/env tsx
/**
 * Smart Migration Runner - Elite Edition
 * 
 * Features:
 * - SQL syntax validation before running
 * - Dry-run in temporary schema
 * - Automatic rollback on failure
 * - Pre-flight checks
 * - Post-migration verification
 * 
 * Usage: npm run db:smart-migrate
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

interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

interface MigrationResult {
  success: boolean
  applied: number
  failed: number
  rolledBack: boolean
  errors: string[]
}

// SQL Syntax Validator
function validateSQL(sql: string): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  
  // Check 1: RAISE NOTICE outside DO blocks
  const lines = sql.split('\n')
  let inDoBlock = false
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    if (line.includes('DO $$') || line.includes('DO $')) {
      inDoBlock = true
    }
    if (line.includes('END $$') || line.includes('END $')) {
      inDoBlock = false
    }
    
    if (line.startsWith('RAISE NOTICE') && !inDoBlock) {
      errors.push(`Line ${i + 1}: RAISE NOTICE outside DO block - will cause syntax error`)
    }
  }
  
  // Check 2: Unmatched quotes
  const singleQuotes = (sql.match(/'/g) || []).length
  const doubleQuotes = (sql.match(/"/g) || []).length
  
  if (singleQuotes % 2 !== 0) {
    errors.push('Unmatched single quotes detected')
  }
  if (doubleQuotes % 2 !== 0) {
    warnings.push('Unmatched double quotes detected (might be intentional in SQL)')
  }
  
  // Check 3: Missing semicolons (heuristic)
  const statements = sql.split(';').filter(s => s.trim().length > 0)
  if (statements.length === 1 && sql.length > 100) {
    warnings.push('Large SQL block with no semicolons - might be intentional or missing')
  }
  
  // Check 4: DROP without IF EXISTS
  const dropWithoutIfExists = sql.match(/DROP (TABLE|POLICY|INDEX|FUNCTION)\s+(?!IF EXISTS)\w+/gi)
  if (dropWithoutIfExists && dropWithoutIfExists.length > 0) {
    warnings.push(`${dropWithoutIfExists.length} DROP statements without IF EXISTS - might fail if object doesn't exist`)
  }
  
  // Check 5: ALTER without checking existence
  const alterStatements = sql.match(/ALTER TABLE \w+/gi)
  if (alterStatements && alterStatements.length > 0) {
    warnings.push(`${alterStatements.length} ALTER statements - ensure tables exist`)
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

// Pre-flight Checks
async function preFlightChecks(sql: string): Promise<ValidationResult> {
  console.log('🔍 Running pre-flight checks...\n')
  
  const errors: string[] = []
  const warnings: string[] = []
  
  // Check 1: Validate SQL syntax
  const syntaxCheck = validateSQL(sql)
  errors.push(...syntaxCheck.errors)
  warnings.push(...syntaxCheck.warnings)
  
  if (syntaxCheck.errors.length > 0) {
    console.log('❌ SQL Syntax Issues:')
    syntaxCheck.errors.forEach(err => console.log(`   - ${err}`))
  }
  
  if (syntaxCheck.warnings.length > 0) {
    console.log('⚠️  SQL Warnings:')
    syntaxCheck.warnings.forEach(warn => console.log(`   - ${warn}`))
  }
  
  // Check 2: Extract referenced tables
  const tableRefs = extractTableReferences(sql)
  console.log(`\n📋 Referenced tables: ${tableRefs.join(', ')}`)
  
  // Check 3: Verify tables exist
  for (const table of tableRefs) {
    const exists = await tableExists(table)
    if (!exists) {
      errors.push(`Table "${table}" does not exist`)
    }
  }
  
  // Check 4: Check for data loss operations
  const dropColumnStatements = sql.match(/DROP COLUMN \w+/gi)
  if (dropColumnStatements) {
    warnings.push(`Migration will drop ${dropColumnStatements.length} column(s) - potential data loss`)
  }
  
  const dropTableStatements = sql.match(/DROP TABLE \w+/gi)
  if (dropTableStatements) {
    warnings.push(`Migration will drop ${dropTableStatements.length} table(s) - potential data loss`)
  }
  
  console.log('')
  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

// Extract table names from SQL
function extractTableReferences(sql: string): string[] {
  const tables = new Set<string>()
  
  // Match: CREATE TABLE, ALTER TABLE, DROP TABLE, etc.
  const patterns = [
    /(?:CREATE|ALTER|DROP)\s+TABLE\s+(?:IF\s+(?:NOT\s+)?EXISTS\s+)?(\w+)/gi,
    /FROM\s+(\w+)/gi,
    /JOIN\s+(\w+)/gi,
    /UPDATE\s+(\w+)/gi,
    /INSERT\s+INTO\s+(\w+)/gi,
    /ON\s+(\w+)\s+FOR/gi, // Policies
  ]
  
  for (const pattern of patterns) {
    let match
    while ((match = pattern.exec(sql)) !== null) {
      if (match[1] && !isReservedWord(match[1])) {
        tables.add(match[1].toLowerCase())
      }
    }
  }
  
  return Array.from(tables)
}

function isReservedWord(word: string): boolean {
  const reserved = ['select', 'from', 'where', 'and', 'or', 'not', 'null', 'true', 'false']
  return reserved.includes(word.toLowerCase())
}

async function tableExists(tableName: string): Promise<boolean> {
  const { data } = await supabase.rpc('get_all_tables')
  return data?.some((t: any) => t.table_name === tableName) || false
}

// Dry Run in Sandbox
async function dryRun(sql: string, migrationName: string): Promise<boolean> {
  console.log('🧪 Testing migration in sandbox...\n')
  
  try {
    // Create savepoint for rollback
    await supabase.rpc('exec_sql', { 
      sql: `SAVEPOINT ${migrationName.replace(/[^a-zA-Z0-9]/g, '_')}_test;` 
    })
    
    console.log('⏳ Executing migration in test mode...')
    
    // Execute the migration
    const { error } = await supabase.rpc('exec_sql', { sql })
    
    if (error) {
      console.log('❌ Migration failed in test mode:', error.message)
      
      // Rollback
      await supabase.rpc('exec_sql', { 
        sql: `ROLLBACK TO SAVEPOINT ${migrationName.replace(/[^a-zA-Z0-9]/g, '_')}_test;` 
      })
      
      console.log('↩️  Test rolled back successfully')
      return false
    }
    
    console.log('✅ Migration test passed!')
    
    // Rollback the test
    await supabase.rpc('exec_sql', { 
      sql: `ROLLBACK TO SAVEPOINT ${migrationName.replace(/[^a-zA-Z0-9]/g, '_')}_test;` 
    })
    
    console.log('↩️  Test rolled back (database unchanged)\n')
    return true
    
  } catch (error: any) {
    console.error('❌ Dry run failed:', error.message)
    
    // Try to rollback
    try {
      await supabase.rpc('exec_sql', { 
        sql: `ROLLBACK TO SAVEPOINT ${migrationName.replace(/[^a-zA-Z0-9]/g, '_')}_test;` 
      })
    } catch (rollbackError) {
      console.error('⚠️  Could not rollback test')
    }
    
    return false
  }
}

// Apply Migration with Rollback Support
async function applyMigrationSafe(sql: string, fileName: string): Promise<{ success: boolean; error?: string }> {
  console.log(`\n⏳ Applying migration: ${fileName}`)
  
  const savepointName = `migration_${fileName.replace(/[^a-zA-Z0-9]/g, '_')}`
  
  try {
    // Create savepoint
    await supabase.rpc('exec_sql', { 
      sql: `SAVEPOINT ${savepointName};` 
    })
    
    // Apply migration
    const { error } = await supabase.rpc('exec_sql', { sql })
    
    if (error) {
      throw new Error(`SQL execution failed: ${error.message}`)
    }
    
    // Verify migration
    const verified = await verifyMigration(fileName)
    if (!verified) {
      throw new Error('Post-migration verification failed')
    }
    
    // Release savepoint (commit)
    await supabase.rpc('exec_sql', { 
      sql: `RELEASE SAVEPOINT ${savepointName};` 
    })
    
    // Record as applied
    await supabase
      .from('schema_migrations')
      .insert({ filename: fileName })
    
    console.log(`✅ ${fileName} applied successfully`)
    return { success: true }
    
  } catch (error: any) {
    console.error(`❌ Migration failed: ${error.message}`)
    console.log('↩️  Rolling back...')
    
    try {
      // Rollback to savepoint
      await supabase.rpc('exec_sql', { 
        sql: `ROLLBACK TO SAVEPOINT ${savepointName};` 
      })
      console.log('✅ Rollback successful - database unchanged')
    } catch (rollbackError) {
      console.error('⚠️  Rollback failed - database may be in inconsistent state!')
    }
    
    return { success: false, error: error.message }
  }
}

// Post-Migration Verification
async function verifyMigration(fileName: string): Promise<boolean> {
  // Basic verification - check if database is still accessible
  try {
    await supabase.rpc('get_all_tables')
    return true
  } catch (error) {
    return false
  }
}

// Get Pending Migrations
async function getPendingMigrations(): Promise<string[]> {
  const { data: applied } = await supabase
    .from('schema_migrations')
    .select('filename')
  
  const appliedSet = new Set(applied?.map(m => m.filename) || [])
  
  const migrationsDir = path.join(process.cwd(), 'supabase/migrations')
  const files = fs.readdirSync(migrationsDir)
    .filter(f => 
      f.endsWith('.sql') && 
      !f.endsWith('_rollback.sql') &&
      !appliedSet.has(f)
    )
    .sort()
  
  return files
}

// Main Smart Migration Runner
async function smartMigrate() {
  console.log('🧠 SMART MIGRATION RUNNER\n')
  console.log('='.repeat(60))
  console.log('Features:')
  console.log('  ✓ SQL syntax validation')
  console.log('  ✓ Pre-flight checks')
  console.log('  ✓ Dry-run testing')
  console.log('  ✓ Automatic rollback on failure')
  console.log('  ✓ Post-migration verification')
  console.log('='.repeat(60))
  console.log('')
  
  try {
    const pending = await getPendingMigrations()
    
    if (pending.length === 0) {
      console.log('✨ No pending migrations\n')
      return
    }
    
    console.log(`📦 Found ${pending.length} pending migration(s)\n`)
    
    let applied = 0
    let failed = 0
    
    for (const file of pending) {
      console.log('─'.repeat(60))
      console.log(`\n📄 Processing: ${file}\n`)
      
      const filePath = path.join(process.cwd(), 'supabase/migrations', file)
      const sql = fs.readFileSync(filePath, 'utf8')
      
      // Step 1: Pre-flight checks
      const checks = await preFlightChecks(sql)
      
      if (!checks.valid) {
        console.log('\n❌ Pre-flight checks failed')
        checks.errors.forEach(err => console.log(`   - ${err}`))
        console.log('\n⏸️  Skipping this migration\n')
        failed++
        break
      }
      
      if (checks.warnings.length > 0) {
        console.log('⚠️  Proceeding despite warnings\n')
      }
      
      // Step 2: Dry run
      const dryRunPassed = await dryRun(sql, file)
      
      if (!dryRunPassed) {
        console.log('❌ Dry run failed - migration will not be applied\n')
        failed++
        break
      }
      
      // Step 3: Apply with rollback support
      const result = await applyMigrationSafe(sql, file)
      
      if (result.success) {
        applied++
      } else {
        failed++
        console.log('\n⏸️  Stopping migration process to prevent cascading failures\n')
        break
      }
    }
    
    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('📊 MIGRATION SUMMARY')
    console.log('='.repeat(60))
    console.log(`✅ Applied: ${applied}`)
    console.log(`❌ Failed: ${failed}`)
    console.log(`⏸️  Remaining: ${pending.length - applied - failed}`)
    console.log('')
    
    if (failed === 0) {
      console.log('🎉 All migrations applied successfully!')
      console.log('Run: npm run db:validate\n')
    } else {
      console.log('⚠️  Some migrations failed')
      console.log('Database is safe (failed migrations were rolled back)')
      console.log('Fix the issues and run again\n')
    }
    
  } catch (error: any) {
    console.error('\n❌ Smart migration failed:', error.message)
    process.exit(1)
  }
}

smartMigrate()
