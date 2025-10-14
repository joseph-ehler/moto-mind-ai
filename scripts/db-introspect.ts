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
import * as dotenv from 'dotenv'

// Load .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

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
  const { data, error } = await supabase.rpc('get_all_tables')

  if (error) {
    console.error('Failed to get tables:', error)
    throw error
  }

  return data?.map((r: any) => r.table_name) || []
}

async function getColumns(tableName: string): Promise<ColumnInfo[]> {
  const { data, error } = await supabase.rpc('get_table_columns', { table_name_param: tableName })
  
  if (error) {
    console.warn(`⚠️  Could not get columns for ${tableName}:`, error.message)
    return []
  }

  return (data || []).map((col: any) => ({
    name: col.column_name,
    dataType: col.data_type,
    isNullable: col.is_nullable,
    defaultValue: col.column_default,
    maxLength: col.max_length,
  }))
}

async function getForeignKeys(tableName: string): Promise<ForeignKeyInfo[]> {
  const { data, error } = await supabase.rpc('get_table_foreign_keys', { table_name_param: tableName })
  
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
  const { data, error } = await supabase.rpc('get_table_indexes', { table_name_param: tableName })
  
  if (error) {
    console.warn(`⚠️  Could not get indexes for ${tableName}`)
    return []
  }

  return (data || []).map((idx: any) => ({
    name: idx.index_name,
    definition: idx.index_definition,
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
  const { data: rlsEnabled, error: rlsError } = await supabase.rpc('get_table_rls_status', { table_name_param: tableName })
  
  // Get policies
  const { data: policiesData, error: policiesError } = await supabase.rpc('get_table_rls_policies', { table_name_param: tableName })
  
  const policies = (policiesData || []).map((pol: any) => ({
    name: pol.policy_name,
    permissive: pol.permissive === 'PERMISSIVE',
    roles: pol.roles || [],
    command: pol.command,
    using: pol.qual,
    withCheck: pol.with_check,
  }))

  return { enabled: rlsEnabled || false, policies }
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

  const { data, error } = await supabase.rpc('get_tenant_data_audit')
  
  if (error) {
    console.error('Failed to audit tenant data:', error)
    return []
  }

  const auditResults = (data || []).map((row: any) => ({
    table: row.table_name,
    totalRows: row.total_rows,
    rowsWithTenant: row.rows_with_tenant,
    rowsMissingTenant: row.rows_missing_tenant,
  }))

  auditResults.forEach((audit: any) => {
    console.log(`  ${audit.table}: ${audit.rowsWithTenant}/${audit.totalRows} rows have tenant_id`)
  })

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
