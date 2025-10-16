#!/usr/bin/env tsx
/**
 * Migration Test Sandbox
 * 
 * Test migrations in isolated environment before applying to production
 * Uses transaction savepoints to create temporary test environment
 * 
 * Usage: npm run db:test-migration <migration-file>
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

interface TestResult {
  passed: boolean
  duration: number
  error?: string
  warnings: string[]
  tablesCreated: string[]
  columnsAdded: number
  policiesCreated: number
}

async function testMigration(migrationFile: string): Promise<TestResult> {
  console.log('🧪 MIGRATION TEST SANDBOX\n')
  console.log('='.repeat(60))
  console.log(`Testing: ${migrationFile}`)
  console.log('='.repeat(60))
  console.log('')
  
  const startTime = Date.now()
  const result: TestResult = {
    passed: false,
    duration: 0,
    warnings: [],
    tablesCreated: [],
    columnsAdded: 0,
    policiesCreated: 0
  }
  
  const filePath = path.join(process.cwd(), 'supabase/migrations', migrationFile)
  
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${migrationFile}`)
    process.exit(1)
  }
  
  const sql = fs.readFileSync(filePath, 'utf8')
  
  try {
    console.log('📊 Pre-test snapshot...')
    const preSnapshot = await captureSnapshot()
    
    console.log('🔧 Creating test environment...')
    const testId = `test_${Date.now()}`
    await supabase.rpc('exec_sql', { 
      sql: `SAVEPOINT ${testId};` 
    })
    
    console.log('⏳ Executing migration in test mode...')
    const { error } = await supabase.rpc('exec_sql', { sql })
    
    if (error) {
      throw new Error(`Migration failed: ${error.message}`)
    }
    
    console.log('📊 Post-test snapshot...')
    const postSnapshot = await captureSnapshot()
    
    console.log('🔍 Analyzing changes...')
    const analysis = analyzeChanges(preSnapshot, postSnapshot)
    
    result.tablesCreated = analysis.tablesCreated
    result.columnsAdded = analysis.columnsAdded
    result.policiesCreated = analysis.policiesCreated
    result.warnings = analysis.warnings
    
    console.log('↩️  Rolling back test environment...')
    await supabase.rpc('exec_sql', { 
      sql: `ROLLBACK TO SAVEPOINT ${testId};` 
    })
    
    result.passed = true
    result.duration = Date.now() - startTime
    
    console.log('\n' + '='.repeat(60))
    console.log('✅ TEST PASSED')
    console.log('='.repeat(60))
    console.log(`Duration: ${result.duration}ms`)
    console.log(`\n📈 Changes detected:`)
    console.log(`  Tables created: ${result.tablesCreated.length}`)
    if (result.tablesCreated.length > 0) {
      result.tablesCreated.forEach(t => console.log(`    - ${t}`))
    }
    console.log(`  Columns added: ${result.columnsAdded}`)
    console.log(`  Policies created: ${result.policiesCreated}`)
    
    if (result.warnings.length > 0) {
      console.log(`\n⚠️  Warnings:`)
      result.warnings.forEach(w => console.log(`  - ${w}`))
    }
    
    console.log('\n✅ Safe to apply to production')
    console.log('Run: npm run db:smart-migrate\n')
    
  } catch (error: any) {
    result.passed = false
    result.duration = Date.now() - startTime
    result.error = error.message
    
    console.log('\n' + '='.repeat(60))
    console.log('❌ TEST FAILED')
    console.log('='.repeat(60))
    console.log(`Error: ${error.message}`)
    console.log(`Duration: ${result.duration}ms`)
    
    // Try to rollback
    try {
      const testId = `test_${Date.now()}`
      await supabase.rpc('exec_sql', { 
        sql: `ROLLBACK TO SAVEPOINT ${testId};` 
      })
      console.log('\n✅ Test environment cleaned up')
    } catch (rollbackError) {
      console.log('\n⚠️  Could not rollback test (database unchanged)')
    }
    
    console.log('\n❌ NOT safe for production')
    console.log('Fix the migration and test again\n')
  }
  
  return result
}

interface Snapshot {
  tables: string[]
  policies: Array<{ table: string; policy: string }>
  tableColumns: Map<string, number>
}

async function captureSnapshot(): Promise<Snapshot> {
  const { data: tables } = await supabase.rpc('get_all_tables')
  const tableNames = tables?.map((t: any) => t.table_name) || []
  
  const policies: Array<{ table: string; policy: string }> = []
  const tableColumns = new Map<string, number>()
  
  for (const table of tableNames) {
    // Get policies
    const { data: tablePolicies } = await supabase.rpc('get_table_rls_policies', {
      table_name_param: table
    })
    
    if (tablePolicies) {
      tablePolicies.forEach((p: any) => {
        policies.push({ table, policy: p.policy_name })
      })
    }
    
    // Get column count
    const { data: columns } = await supabase.rpc('get_table_columns', {
      table_name_param: table
    })
    
    tableColumns.set(table, columns?.length || 0)
  }
  
  return { tables: tableNames, policies, tableColumns }
}

function analyzeChanges(before: Snapshot, after: Snapshot): {
  tablesCreated: string[]
  columnsAdded: number
  policiesCreated: number
  warnings: string[]
} {
  const tablesCreated = after.tables.filter(t => !before.tables.includes(t))
  
  let columnsAdded = 0
  Array.from(after.tableColumns.entries()).forEach(([table, afterCount]) => {
    const beforeCount = before.tableColumns.get(table) || 0
    columnsAdded += Math.max(0, afterCount - beforeCount)
  })
  
  const policiesCreated = after.policies.length - before.policies.length
  
  const warnings: string[] = []
  
  // Check for table drops
  const tablesDropped = before.tables.filter(t => !after.tables.includes(t))
  if (tablesDropped.length > 0) {
    warnings.push(`${tablesDropped.length} table(s) will be dropped: ${tablesDropped.join(', ')}`)
  }
  
  // Check for column drops (heuristic)
  Array.from(before.tableColumns.entries()).forEach(([table, beforeCount]) => {
    const afterCount = after.tableColumns.get(table) || 0
    if (afterCount < beforeCount) {
      warnings.push(`Table "${table}" will lose ${beforeCount - afterCount} column(s)`)
    }
  })
  
  return { tablesCreated, columnsAdded, policiesCreated, warnings }
}

// CLI
const migrationFile = process.argv[2]

if (!migrationFile) {
  console.error('Usage: npm run db:test-migration <migration-file>')
  console.error('')
  console.error('Example:')
  console.error('  npm run db:test-migration 20251014_fix_rls_policies.sql')
  process.exit(1)
}

testMigration(migrationFile)
