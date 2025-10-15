/**
 * Schema Introspection Module
 * Full database schema analysis with AI-parseable JSON output
 */

import { SupabaseClient } from '@supabase/supabase-js'

export interface ColumnInfo {
  name: string
  type: string
  nullable: boolean
  default: string | null
  isPrimaryKey: boolean
  isForeignKey: boolean
  references: string | null
  description: string | null
}

export interface IndexInfo {
  name: string
  columns: string[]
  unique: boolean
  type: string
}

export interface ConstraintInfo {
  name: string
  type: string
  definition: string
}

export interface RLSPolicy {
  name: string
  command: string
  roles: string[]
  using: string
  withCheck: string | null
  isTenantIsolated: boolean
}

export interface TableSchema {
  table: string
  columns: ColumnInfo[]
  indexes: IndexInfo[]
  constraints: ConstraintInfo[]
  rlsPolicies: RLSPolicy[]
  triggers: any[]
  rowCount: number
  estimatedSize: string
}

export async function getFullTableSchema(
  supabase: SupabaseClient,
  tableName: string
): Promise<TableSchema> {
  console.log(`\n🔍 ANALYZING TABLE: ${tableName}\n`)
  
  // Get columns
  const columns = await getColumns(supabase, tableName)
  
  // Get indexes
  const indexes = await getIndexes(supabase, tableName)
  
  // Get constraints
  const constraints = await getConstraints(supabase, tableName)
  
  // Get RLS policies
  const rlsPolicies = await getRLSPolicies(supabase, tableName)
  
  // Get row count
  const { count } = await supabase
    .from(tableName)
    .select('*', { count: 'exact', head: true })
  
  return {
    table: tableName,
    columns,
    indexes,
    constraints,
    rlsPolicies,
    triggers: [], // TODO: Add trigger detection
    rowCount: count || 0,
    estimatedSize: 'N/A' // TODO: Calculate size
  }
}

async function getColumns(
  supabase: SupabaseClient,
  tableName: string
): Promise<ColumnInfo[]> {
  // Get sample row to inspect structure
  const { data: sample } = await supabase
    .from(tableName)
    .select('*')
    .limit(1)
  
  if (!sample || sample.length === 0) {
    return []
  }
  
  const columns: ColumnInfo[] = []
  
  for (const [name, value] of Object.entries(sample[0])) {
    const type = typeof value
    
    columns.push({
      name,
      type: guessType(value),
      nullable: value === null,
      default: null,
      isPrimaryKey: name === 'id',
      isForeignKey: name.endsWith('_id') && name !== 'id',
      references: name.endsWith('_id') && name !== 'id' 
        ? `${name.replace('_id', '')}(id)` 
        : null,
      description: null
    })
  }
  
  return columns
}

function guessType(value: any): string {
  if (value === null) return 'unknown'
  if (typeof value === 'string') {
    // Check if UUID
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
      return 'uuid'
    }
    // Check if timestamp
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
      return 'timestamp'
    }
    return 'varchar'
  }
  if (typeof value === 'number') {
    return Number.isInteger(value) ? 'integer' : 'numeric'
  }
  if (typeof value === 'boolean') return 'boolean'
  if (typeof value === 'object') return 'jsonb'
  return 'unknown'
}

async function getIndexes(
  supabase: SupabaseClient,
  tableName: string
): Promise<IndexInfo[]> {
  // TODO: Query pg_indexes
  return []
}

async function getConstraints(
  supabase: SupabaseClient,
  tableName: string
): Promise<ConstraintInfo[]> {
  // TODO: Query pg_constraint
  return []
}

async function getRLSPolicies(
  supabase: SupabaseClient,
  tableName: string
): Promise<RLSPolicy[]> {
  // TODO: Query pg_policies
  const policies: RLSPolicy[] = []
  
  // For now, return placeholder
  return policies
}

export function formatSchemaAsJSON(schema: TableSchema): string {
  return JSON.stringify(schema, null, 2)
}

export function formatSchemaAsTable(schema: TableSchema): void {
  console.log('═'.repeat(70))
  console.log(`📊 TABLE: ${schema.table}`)
  console.log('═'.repeat(70))
  
  console.log(`\n📈 Stats:`)
  console.log(`   Rows: ${schema.rowCount.toLocaleString()}`)
  console.log(`   Columns: ${schema.columns.length}`)
  console.log(`   Indexes: ${schema.indexes.length}`)
  console.log(`   Policies: ${schema.rlsPolicies.length}`)
  
  console.log(`\n📋 Columns:`)
  schema.columns.forEach(col => {
    const flags = []
    if (col.isPrimaryKey) flags.push('PK')
    if (col.isForeignKey) flags.push(`FK → ${col.references}`)
    if (!col.nullable) flags.push('NOT NULL')
    
    console.log(`   ${col.name.padEnd(25)} ${col.type.padEnd(15)} ${flags.join(', ')}`)
  })
  
  if (schema.rlsPolicies.length > 0) {
    console.log(`\n🔒 RLS Policies:`)
    schema.rlsPolicies.forEach(policy => {
      const isolated = policy.isTenantIsolated ? '✅' : '⚠️'
      console.log(`   ${isolated} ${policy.name} (${policy.command})`)
    })
  }
  
  console.log('\n' + '═'.repeat(70) + '\n')
}
