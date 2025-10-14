#!/usr/bin/env tsx
/**
 * Database Introspection Tool
 * 
 * Generates complete database schema documentation
 * Run: npm run db:introspect
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing environment variables:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL')
  console.error('   SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

interface TableInfo {
  name: string
  columns: ColumnInfo[]
  foreignKeys: ForeignKeyInfo[]
  indexes: IndexInfo[]
  rowCount: number
  rlsEnabled: boolean
  rlsPolicies: RLSPolicyInfo[]
}

interface ColumnInfo {
  name: string
  dataType: string
  isNullable: boolean
  defaultValue: string | null
  maxLength: number | null
}

interface ForeignKeyInfo {
  columnName: string
  foreignTableName: string
  foreignColumnName: string
  deleteRule: string
  updateRule: string
}

interface IndexInfo {
  name: string
  definition: string
}

interface RLSPolicyInfo {
  name: string
  permissive: boolean
  roles: string[]
  command: string
  using: string | null
  withCheck: string | null
}

async function getTables(): Promise<string[]> {
  const { data, error } = await supabase.rpc('exec_sql', {
    query: `
      SELECT tablename
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `
  }).single() as any

  if (error) {
    // Fallback: use information_schema
    const result = await supabase
      .from('information_schema.tables' as any)
      .select('table_name')
      .eq('table_schema', 'public')

    if (result.error) throw result.error
    return result.data?.map((r: any) => r.table_name) || []
  }

  return data || []
}

async function getColumns(tableName: string): Promise<ColumnInfo[]> {
  const query = `
    SELECT 
      column_name,
      data_type,
      is_nullable,
      column_default,
      character_maximum_length
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = '${tableName}'
    ORDER BY ordinal_position
  `

  const { data, error } = await supabase.rpc('exec_sql', { query }).single() as any
  
  if (error) {
    console.warn(`⚠️  Could not get columns for ${tableName}:`, error.message)
    return []
  }

  return (data || []).map((col: any) => ({
    name: col.column_name,
    dataType: col.data_type,
    isNullable: col.is_nullable === 'YES',
    defaultValue: col.column_default,
    maxLength: col.character_maximum_length,
  }))
}

async function getForeignKeys(tableName: string): Promise<ForeignKeyInfo[]> {
  const query = `
    SELECT
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name,
      rc.delete_rule,
      rc.update_rule
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
    JOIN information_schema.referential_constraints AS rc
      ON rc.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name = '${tableName}'
      AND tc.table_schema = 'public'
  `

  const { data, error } = await supabase.rpc('exec_sql', { query }).single() as any
  
  if (error) {
    console.warn(`⚠️  Could not get foreign keys for ${tableName}`)
    return []
  }

  return (data || []).map((fk: any) => ({
    columnName: fk.column_name,
    foreignTableName: fk.foreign_table_name,
    foreignColumnName: fk.foreign_column_name,
    deleteRule: fk.delete_rule,
    updateRule: fk.update_rule,
  }))
}

async function getIndexes(tableName: string): Promise<IndexInfo[]> {
  const query = `
    SELECT indexname, indexdef
    FROM pg_indexes
    WHERE tablename = '${tableName}'
      AND schemaname = 'public'
  `

  const { data, error } = await supabase.rpc('exec_sql', { query }).single() as any
  
  if (error) {
    console.warn(`⚠️  Could not get indexes for ${tableName}`)
    return []
  }

  return (data || []).map((idx: any) => ({
    name: idx.indexname,
    definition: idx.indexdef,
  }))
}

async function getRowCount(tableName: string): Promise<number> {
  const { count, error } = await supabase
    .from(tableName as any)
    .select('*', { count: 'exact', head: true })

  if (error) {
    console.warn(`⚠️  Could not get row count for ${tableName}`)
    return 0
  }

  return count || 0
}

async function getRLSInfo(tableName: string): Promise<{ enabled: boolean; policies: RLSPolicyInfo[] }> {
  // Check if RLS is enabled
  const rlsQuery = `
    SELECT rowsecurity as rls_enabled
    FROM pg_tables
    WHERE tablename = '${tableName}'
      AND schemaname = 'public'
  `

  const { data: rlsData, error: rlsError } = await supabase.rpc('exec_sql', { query: rlsQuery }).single() as any
  
  const rlsEnabled = rlsData?.[0]?.rls_enabled || false

  // Get policies
  const policiesQuery = `
    SELECT
      policyname,
      permissive,
      roles,
      cmd,
      qual,
      with_check
    FROM pg_policies
    WHERE tablename = '${tableName}'
      AND schemaname = 'public'
  `

  const { data: policiesData, error: policiesError } = await supabase.rpc('exec_sql', { query: policiesQuery }).single() as any
  
  const policies = (policiesData || []).map((pol: any) => ({
    name: pol.policyname,
    permissive: pol.permissive === 'PERMISSIVE',
    roles: Array.isArray(pol.roles) ? pol.roles : [pol.roles],
    command: pol.cmd,
    using: pol.qual,
    withCheck: pol.with_check,
  }))

  return { enabled: rlsEnabled, policies }
}

async function introspectTable(tableName: string): Promise<TableInfo> {
  console.log(`📊 Introspecting ${tableName}...`)

  const [columns, foreignKeys, indexes, rowCount, rlsInfo] = await Promise.all([
    getColumns(tableName),
    getForeignKeys(tableName),
    getIndexes(tableName),
    getRowCount(tableName),
    getRLSInfo(tableName),
  ])

  return {
    name: tableName,
    columns,
    foreignKeys,
    indexes,
    rowCount,
    rlsEnabled: rlsInfo.enabled,
    rlsPolicies: rlsInfo.policies,
  }
}

async function auditTenantData() {
  console.log('\n🔍 Auditing tenant data...')

  const tenantTables = ['vehicles', 'vehicle_events', 'vehicle_images', 'photo_metadata']
  const auditResults: any[] = []

  for (const table of tenantTables) {
    const { count: total } = await supabase
      .from(table as any)
      .select('*', { count: 'exact', head: true })

    const { count: withTenant } = await supabase
      .from(table as any)
      .select('*', { count: 'exact', head: true })
      .not('tenant_id', 'is', null)

    auditResults.push({
      table,
      totalRows: total || 0,
      rowsWithTenant: withTenant || 0,
      rowsMissingTenant: (total || 0) - (withTenant || 0),
    })

    console.log(`  ${table}: ${withTenant}/${total} rows have tenant_id`)
  }

  return auditResults
}

async function main() {
  console.log('🔍 DATABASE INTROSPECTION STARTING...\n')
  console.log(`📍 Database: ${SUPABASE_URL}\n`)

  try {
    // Get all tables
    const tables = await getTables()
    console.log(`Found ${tables.length} tables\n`)

    // Introspect each table
    const tableInfos: TableInfo[] = []
    for (const tableName of tables) {
      const info = await introspectTable(tableName)
      tableInfos.push(info)
    }

    // Audit tenant data
    const tenantAudit = await auditTenantData()

    // Generate report
    const report = {
      generatedAt: new Date().toISOString(),
      database: SUPABASE_URL,
      totalTables: tables.length,
      tables: tableInfos,
      tenantDataAudit: tenantAudit,
    }

    // Save to file
    const outputPath = path.join(process.cwd(), 'docs', 'database-schema.json')
    fs.mkdirSync(path.dirname(outputPath), { recursive: true })
    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2))

    console.log(`\n✅ Introspection complete!`)
    console.log(`📄 Report saved to: ${outputPath}`)

    // Print summary
    console.log('\n📊 SUMMARY:')
    console.log(`  Tables: ${tables.length}`)
    console.log(`  Total Rows: ${tableInfos.reduce((sum, t) => sum + t.rowCount, 0)}`)
    console.log(`  Tables with RLS: ${tableInfos.filter(t => t.rlsEnabled).length}`)
    
    console.log('\n🔒 TENANT DATA AUDIT:')
    tenantAudit.forEach(audit => {
      const pct = audit.totalRows > 0 
        ? ((audit.rowsWithTenant / audit.totalRows) * 100).toFixed(1)
        : '0'
      console.log(`  ${audit.table}: ${pct}% complete (${audit.rowsMissingTenant} missing)`)
    })

  } catch (error) {
    console.error('❌ Introspection failed:', error)
    process.exit(1)
  }
}

main()
