#!/usr/bin/env tsx
/**
 * Schema Diff & Sync
 * 
 * Compare schemas between environments and generate sync migrations
 * Useful for keeping local/staging/production in sync
 * 
 * Features:
 * - Compare table structures
 * - Detect missing tables/columns
 * - Find policy differences
 * - Generate sync migrations
 * - Prevent schema drift
 * 
 * Usage: npm run db:schema-diff [--generate-migration]
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

interface TableSchema {
  name: string
  columns: Array<{
    name: string
    type: string
    nullable: boolean
    default?: string
  }>
  indexes: Array<{
    name: string
    definition: string
  }>
  foreignKeys: Array<{
    column: string
    refTable: string
    refColumn: string
  }>
  rlsEnabled: boolean
  policies: Array<{
    name: string
  }>
}

interface SchemaSnapshot {
  tables: Map<string, TableSchema>
  capturedAt: string
}

interface SchemaDiff {
  missingTables: string[]
  extraTables: string[]
  missingColumns: Array<{ table: string; column: string; type: string }>
  extraColumns: Array<{ table: string; column: string }>
  typeMismatches: Array<{ table: string; column: string; currentType: string; expectedType: string }>
  missingIndexes: Array<{ table: string; index: string }>
  missingPolicies: Array<{ table: string; policy: string }>
  rlsMismatches: Array<{ table: string; currentRls: boolean; expectedRls: boolean }>
}

class SchemaManager {
  async captureSnapshot(): Promise<SchemaSnapshot> {
    console.log('📸 Capturing current schema snapshot...\n')
    
    const tables = new Map<string, TableSchema>()
    
    const { data: tableList } = await supabase.rpc('get_all_tables')
    
    for (const tableRow of tableList || []) {
      const tableName = tableRow.table_name
      
      console.log(`   Analyzing ${tableName}...`)
      
      // Get columns
      const { data: columns } = await supabase.rpc('get_table_columns', {
        table_name_param: tableName
      })
      
      // Get indexes
      const { data: indexes } = await supabase.rpc('get_table_indexes', {
        table_name_param: tableName
      })
      
      // Get foreign keys
      const { data: foreignKeys } = await supabase.rpc('get_table_foreign_keys', {
        table_name_param: tableName
      })
      
      // Get RLS status
      const { data: rlsEnabled } = await supabase.rpc('get_table_rls_status', {
        table_name_param: tableName
      })
      
      // Get policies
      const { data: policies } = await supabase.rpc('get_table_rls_policies', {
        table_name_param: tableName
      })
      
      tables.set(tableName, {
        name: tableName,
        columns: (columns || []).map((c: any) => ({
          name: c.column_name,
          type: c.data_type,
          nullable: c.is_nullable,
          default: c.column_default
        })),
        indexes: (indexes || []).map((i: any) => ({
          name: i.index_name,
          definition: i.index_definition
        })),
        foreignKeys: (foreignKeys || []).map((fk: any) => ({
          column: fk.column_name,
          refTable: fk.foreign_table_name,
          refColumn: fk.foreign_column_name
        })),
        rlsEnabled: rlsEnabled || false,
        policies: (policies || []).map((p: any) => ({
          name: p.policy_name
        }))
      })
    }
    
    console.log(`\n✅ Captured ${tables.size} tables\n`)
    
    return {
      tables,
      capturedAt: new Date().toISOString()
    }
  }
  
  async saveSnapshot(snapshot: SchemaSnapshot, filename: string): Promise<void> {
    const snapshotPath = path.join(process.cwd(), 'docs', filename)
    
    const serializable = {
      capturedAt: snapshot.capturedAt,
      tables: Array.from(snapshot.tables.entries()).map(([_tableName, schema]) => schema)
    }
    
    fs.writeFileSync(snapshotPath, JSON.stringify(serializable, null, 2))
    console.log(`💾 Snapshot saved to: ${snapshotPath}\n`)
  }
  
  async loadSnapshot(filename: string): Promise<SchemaSnapshot> {
    const snapshotPath = path.join(process.cwd(), 'docs', filename)
    
    if (!fs.existsSync(snapshotPath)) {
      throw new Error(`Snapshot not found: ${filename}`)
    }
    
    const data = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'))
    
    const tables = new Map<string, TableSchema>()
    data.tables.forEach((table: any) => {
      tables.set(table.name, table)
    })
    
    return {
      tables,
      capturedAt: data.capturedAt
    }
  }
  
  compareSnapshots(current: SchemaSnapshot, target: SchemaSnapshot): SchemaDiff {
    console.log('🔍 Comparing schemas...\n')
    console.log(`Current: ${current.capturedAt}`)
    console.log(`Target:  ${target.capturedAt}\n`)
    
    const diff: SchemaDiff = {
      missingTables: [],
      extraTables: [],
      missingColumns: [],
      extraColumns: [],
      typeMismatches: [],
      missingIndexes: [],
      missingPolicies: [],
      rlsMismatches: []
    }
    
    // Find missing and extra tables
    Array.from(target.tables.keys()).forEach(tableName => {
      if (!current.tables.has(tableName)) {
        diff.missingTables.push(tableName)
      }
    })
    
    Array.from(current.tables.keys()).forEach(tableName => {
      if (!target.tables.has(tableName)) {
        diff.extraTables.push(tableName)
      }
    })
    
    // Compare matching tables
    Array.from(target.tables.entries()).forEach(([tableName, targetTable]) => {
      const currentTable = current.tables.get(tableName)
      if (!currentTable) return
      
      // Compare columns
      for (const targetCol of targetTable.columns) {
        const currentCol = currentTable.columns.find(c => c.name === targetCol.name)
        
        if (!currentCol) {
          diff.missingColumns.push({
            table: tableName,
            column: targetCol.name,
            type: targetCol.type
          })
        } else if (currentCol.type !== targetCol.type) {
          diff.typeMismatches.push({
            table: tableName,
            column: targetCol.name,
            currentType: currentCol.type,
            expectedType: targetCol.type
          })
        }
      }
      
      // Check for extra columns
      for (const currentCol of currentTable.columns) {
        if (!targetTable.columns.find(c => c.name === currentCol.name)) {
          diff.extraColumns.push({
            table: tableName,
            column: currentCol.name
          })
        }
      }
      
      // Compare indexes
      for (const targetIndex of targetTable.indexes) {
        if (!currentTable.indexes.find(i => i.name === targetIndex.name)) {
          diff.missingIndexes.push({
            table: tableName,
            index: targetIndex.name
          })
        }
      }
      
      // Compare RLS
      if (currentTable.rlsEnabled !== targetTable.rlsEnabled) {
        diff.rlsMismatches.push({
          table: tableName,
          currentRls: currentTable.rlsEnabled,
          expectedRls: targetTable.rlsEnabled
        })
      }
      
      // Compare policies
      for (const targetPolicy of targetTable.policies) {
        if (!currentTable.policies.find((p: { name: string }) => p.name === targetPolicy.name)) {
          diff.missingPolicies.push({
            table: tableName,
            policy: targetPolicy.name
          })
        }
      }
    })
    
    return diff
  }
  
  printDiff(diff: SchemaDiff): void {
    console.log('='.repeat(60))
    console.log('📊 SCHEMA DIFFERENCES')
    console.log('='.repeat(60))
    
    let hasIssues = false
    
    if (diff.missingTables.length > 0) {
      hasIssues = true
      console.log(`\n❌ Missing tables (${diff.missingTables.length}):`)
      diff.missingTables.forEach(t => console.log(`   - ${t}`))
    }
    
    if (diff.extraTables.length > 0) {
      hasIssues = true
      console.log(`\n⚠️  Extra tables (${diff.extraTables.length}):`)
      diff.extraTables.forEach(t => console.log(`   - ${t}`))
    }
    
    if (diff.missingColumns.length > 0) {
      hasIssues = true
      console.log(`\n❌ Missing columns (${diff.missingColumns.length}):`)
      diff.missingColumns.forEach(c => 
        console.log(`   - ${c.table}.${c.column} (${c.type})`)
      )
    }
    
    if (diff.extraColumns.length > 0) {
      hasIssues = true
      console.log(`\n⚠️  Extra columns (${diff.extraColumns.length}):`)
      diff.extraColumns.forEach(c => 
        console.log(`   - ${c.table}.${c.column}`)
      )
    }
    
    if (diff.typeMismatches.length > 0) {
      hasIssues = true
      console.log(`\n❌ Type mismatches (${diff.typeMismatches.length}):`)
      diff.typeMismatches.forEach(m => 
        console.log(`   - ${m.table}.${m.column}: ${m.currentType} → ${m.expectedType}`)
      )
    }
    
    if (diff.missingIndexes.length > 0) {
      hasIssues = true
      console.log(`\n⚠️  Missing indexes (${diff.missingIndexes.length}):`)
      diff.missingIndexes.forEach(i => 
        console.log(`   - ${i.table}.${i.index}`)
      )
    }
    
    if (diff.rlsMismatches.length > 0) {
      hasIssues = true
      console.log(`\n❌ RLS mismatches (${diff.rlsMismatches.length}):`)
      diff.rlsMismatches.forEach(r => 
        console.log(`   - ${r.table}: ${r.currentRls} → ${r.expectedRls}`)
      )
    }
    
    if (diff.missingPolicies.length > 0) {
      hasIssues = true
      console.log(`\n⚠️  Missing policies (${diff.missingPolicies.length}):`)
      diff.missingPolicies.forEach(p => 
        console.log(`   - ${p.table}.${p.policy}`)
      )
    }
    
    console.log('\n' + '='.repeat(60))
    
    if (!hasIssues) {
      console.log('✅ Schemas are in sync!\n')
    } else {
      console.log('⚠️  Schema drift detected')
      console.log('Run with --generate-migration to create sync migration\n')
    }
  }
  
  generateSyncMigration(diff: SchemaDiff): string {
    let migration = `-- ============================================\n`
    migration += `-- SCHEMA SYNC MIGRATION\n`
    migration += `-- Generated: ${new Date().toISOString()}\n`
    migration += `-- ============================================\n\n`
    
    // Add missing tables
    if (diff.missingTables.length > 0) {
      migration += `-- Missing tables\n`
      diff.missingTables.forEach(table => {
        migration += `-- TODO: Create table ${table}\n`
        migration += `-- CREATE TABLE ${table} (...);\n\n`
      })
    }
    
    // Add missing columns
    if (diff.missingColumns.length > 0) {
      migration += `-- Missing columns\n`
      diff.missingColumns.forEach(col => {
        migration += `ALTER TABLE ${col.table} ADD COLUMN ${col.column} ${col.type};\n`
      })
      migration += `\n`
    }
    
    // Fix type mismatches
    if (diff.typeMismatches.length > 0) {
      migration += `-- Type mismatches\n`
      diff.typeMismatches.forEach(mismatch => {
        migration += `ALTER TABLE ${mismatch.table} ALTER COLUMN ${mismatch.column} TYPE ${mismatch.expectedType};\n`
      })
      migration += `\n`
    }
    
    // Add missing indexes
    if (diff.missingIndexes.length > 0) {
      migration += `-- Missing indexes\n`
      diff.missingIndexes.forEach(index => {
        migration += `-- TODO: Create index ${index.index} on ${index.table}\n`
      })
      migration += `\n`
    }
    
    // Fix RLS
    if (diff.rlsMismatches.length > 0) {
      migration += `-- RLS mismatches\n`
      diff.rlsMismatches.forEach(rls => {
        if (rls.expectedRls) {
          migration += `ALTER TABLE ${rls.table} ENABLE ROW LEVEL SECURITY;\n`
        } else {
          migration += `ALTER TABLE ${rls.table} DISABLE ROW LEVEL SECURITY;\n`
        }
      })
      migration += `\n`
    }
    
    return migration
  }
}

// CLI
const manager = new SchemaManager()
const shouldGenerateMigration = process.argv.includes('--generate-migration')
const command = process.argv[2]

async function main() {
  if (command === 'capture') {
    // Capture current schema and save
    const snapshot = await manager.captureSnapshot()
    await manager.saveSnapshot(snapshot, 'schema-snapshot.json')
    
  } else if (command === 'compare') {
    // Compare current with saved snapshot
    const targetFile = process.argv[3] || 'schema-snapshot.json'
    
    console.log('📸 Capturing current schema...\n')
    const current = await manager.captureSnapshot()
    
    console.log('📂 Loading target snapshot...\n')
    const target = await manager.loadSnapshot(targetFile)
    
    const diff = manager.compareSnapshots(current, target)
    manager.printDiff(diff)
    
    if (shouldGenerateMigration) {
      const migration = manager.generateSyncMigration(diff)
      const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '')
      const filename = `${timestamp}_schema_sync.sql`
      const filepath = path.join(process.cwd(), 'supabase/migrations', filename)
      
      fs.writeFileSync(filepath, migration)
      console.log(`✅ Migration generated: ${filename}\n`)
    }
    
  } else {
    console.log('🔄 SCHEMA DIFF & SYNC\n')
    console.log('Commands:')
    console.log('  capture                 - Capture current schema')
    console.log('  compare [snapshot]      - Compare with snapshot')
    console.log('')
    console.log('Options:')
    console.log('  --generate-migration    - Generate sync migration')
    console.log('')
    console.log('Examples:')
    console.log('  npm run db:schema-diff capture')
    console.log('  npm run db:schema-diff compare')
    console.log('  npm run db:schema-diff compare --generate-migration')
  }
}

main().catch(console.error)
