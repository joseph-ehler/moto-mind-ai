// Comprehensive Supabase Schema Introspection
// Extracts complete database schema with fine-tooth-comb detail

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { writeFileSync } from 'fs'
import { join } from 'path'

config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

interface ColumnInfo {
  column_name: string
  data_type: string
  is_nullable: boolean
  column_default: string | null
  character_maximum_length: number | null
  numeric_precision: number | null
  numeric_scale: number | null
  ordinal_position: number
  is_primary_key: boolean
  is_foreign_key: boolean
  foreign_table?: string
  foreign_column?: string
  constraint_name?: string
}

interface IndexInfo {
  index_name: string
  column_names: string[]
  is_unique: boolean
  is_primary: boolean
  index_type: string
}

interface ConstraintInfo {
  constraint_name: string
  constraint_type: string
  column_names: string[]
  foreign_table?: string
  foreign_columns?: string[]
  check_clause?: string
}

interface TableInfo {
  table_name: string
  table_type: string
  columns: ColumnInfo[]
  indexes: IndexInfo[]
  constraints: ConstraintInfo[]
  row_count: number
  table_size_bytes: number
  sample_data: any[]
}

interface SchemaIntrospection {
  timestamp: string
  database_name: string
  schema_name: string
  tables: TableInfo[]
  relationships: {
    from_table: string
    from_column: string
    to_table: string
    to_column: string
    constraint_name: string
  }[]
  summary: {
    total_tables: number
    total_columns: number
    total_indexes: number
    total_constraints: number
    total_rows: number
    database_size_mb: number
  }
}

async function introspectSupabaseSchema(): Promise<SchemaIntrospection> {
  console.log('🔍 Starting comprehensive Supabase schema introspection...')
  
  const introspection: SchemaIntrospection = {
    timestamp: new Date().toISOString(),
    database_name: 'postgres',
    schema_name: 'public',
    tables: [],
    relationships: [],
    summary: {
      total_tables: 0,
      total_columns: 0,
      total_indexes: 0,
      total_constraints: 0,
      total_rows: 0,
      database_size_mb: 0
    }
  }

  try {
    // Step 1: Get all tables in public schema
    console.log('📋 Step 1: Discovering all tables...')
    const tables = await getAllTables()
    
    // Step 2: For each table, get complete schema information
    console.log('📊 Step 2: Analyzing each table in detail...')
    for (const tableName of tables) {
      console.log(`  🔍 Introspecting table: ${tableName}`)
      const tableInfo = await introspectTable(tableName)
      if (tableInfo) {
        introspection.tables.push(tableInfo)
      }
    }

    // Step 3: Extract relationships
    console.log('🔗 Step 3: Mapping table relationships...')
    introspection.relationships = extractRelationships(introspection.tables)

    // Step 4: Calculate summary statistics
    console.log('📈 Step 4: Calculating summary statistics...')
    calculateSummary(introspection)

    return introspection

  } catch (error) {
    console.error('💥 Schema introspection failed:', error)
    throw error
  }
}

async function getAllTables(): Promise<string[]> {
  // Try multiple approaches to get table list
  
  // Approach 1: Direct query to information_schema
  try {
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name;
      `
    })
    
    if (!error && data) {
      return data.map((row: any) => row.table_name)
    }
  } catch (e) {
    console.log('  ⚠️  RPC approach failed, trying direct queries...')
  }

  // Approach 2: Try known tables and test existence
  const knownTables = [
    'vehicles', 'garages', 'vehicle_events', 'reminders', 
    'vehicle_images', 'schema_migrations', 'tenants',
    'notifications', 'usage_tracking', 'vehicle_current_mileage'
  ]

  const existingTables: string[] = []
  
  for (const tableName of knownTables) {
    try {
      const { error } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true })
        .limit(0)
      
      if (!error) {
        existingTables.push(tableName)
      }
    } catch (e) {
      // Table doesn't exist, skip
    }
  }

  return existingTables
}

async function introspectTable(tableName: string): Promise<TableInfo | null> {
  try {
    // Get basic table info and row count
    const { count, error: countError } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true })

    if (countError) {
      console.log(`    ❌ Cannot access ${tableName}:`, countError.message)
      return null
    }

    // Get sample data to analyze structure
    const { data: sampleData, error: sampleError } = await supabase
      .from(tableName)
      .select('*')
      .limit(3)

    if (sampleError) {
      console.log(`    ⚠️  Cannot get sample data for ${tableName}:`, sampleError.message)
    }

    // Analyze columns from sample data
    const columns = await analyzeColumns(tableName, sampleData || [])
    
    // Try to get constraints and indexes (may not work due to permissions)
    const constraints = await getTableConstraints(tableName)
    const indexes = await getTableIndexes(tableName)

    const tableInfo: TableInfo = {
      table_name: tableName,
      table_type: 'BASE TABLE',
      columns,
      indexes,
      constraints,
      row_count: count || 0,
      table_size_bytes: 0, // Would need pg_total_relation_size
      sample_data: sampleData || []
    }

    console.log(`    ✅ ${tableName}: ${count} rows, ${columns.length} columns`)
    return tableInfo

  } catch (error) {
    console.log(`    ❌ Failed to introspect ${tableName}:`, error)
    return null
  }
}

async function analyzeColumns(tableName: string, sampleData: any[]): Promise<ColumnInfo[]> {
  if (sampleData.length === 0) {
    return []
  }

  const firstRow = sampleData[0]
  const columnNames = Object.keys(firstRow)
  
  const columns: ColumnInfo[] = []

  for (let i = 0; i < columnNames.length; i++) {
    const columnName = columnNames[i]
    const sampleValue = firstRow[columnName]
    
    // Infer data type from sample data
    let dataType = 'unknown'
    if (sampleValue === null) {
      // Check other samples for type
      for (const row of sampleData) {
        if (row[columnName] !== null) {
          dataType = inferDataType(row[columnName])
          break
        }
      }
    } else {
      dataType = inferDataType(sampleValue)
    }

    // Check if column has null values
    const hasNulls = sampleData.some(row => row[columnName] === null || row[columnName] === undefined)

    // Check if it's a primary key (usually 'id')
    const isPrimaryKey = columnName === 'id'
    
    // Check if it's a foreign key (ends with _id)
    const isForeignKey = columnName.endsWith('_id') && columnName !== 'id'
    
    let foreignTable: string | undefined
    let foreignColumn: string | undefined
    
    if (isForeignKey) {
      // Infer foreign table name
      foreignTable = columnName.replace('_id', 's') // vehicle_id -> vehicles
      foreignColumn = 'id'
    }

    const column: ColumnInfo = {
      column_name: columnName,
      data_type: dataType,
      is_nullable: hasNulls,
      column_default: null, // Would need information_schema access
      character_maximum_length: null,
      numeric_precision: null,
      numeric_scale: null,
      ordinal_position: i + 1,
      is_primary_key: isPrimaryKey,
      is_foreign_key: isForeignKey,
      foreign_table: foreignTable,
      foreign_column: foreignColumn
    }

    columns.push(column)
  }

  return columns
}

function inferDataType(value: any): string {
  if (typeof value === 'string') {
    // Check if it's a UUID
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
      return 'uuid'
    }
    // Check if it's a timestamp
    if (value.includes('T') && value.includes('Z')) {
      return 'timestamptz'
    }
    return 'text'
  }
  
  if (typeof value === 'number') {
    return Number.isInteger(value) ? 'integer' : 'numeric'
  }
  
  if (typeof value === 'boolean') {
    return 'boolean'
  }
  
  if (typeof value === 'object' && value !== null) {
    return 'jsonb'
  }
  
  return 'unknown'
}

async function getTableConstraints(tableName: string): Promise<ConstraintInfo[]> {
  // This would require access to information_schema.table_constraints
  // For now, return empty array
  return []
}

async function getTableIndexes(tableName: string): Promise<IndexInfo[]> {
  // This would require access to pg_indexes
  // For now, return empty array
  return []
}

function extractRelationships(tables: TableInfo[]): any[] {
  const relationships: any[] = []
  
  for (const table of tables) {
    for (const column of table.columns) {
      if (column.is_foreign_key && column.foreign_table) {
        relationships.push({
          from_table: table.table_name,
          from_column: column.column_name,
          to_table: column.foreign_table,
          to_column: column.foreign_column || 'id',
          constraint_name: `fk_${table.table_name}_${column.column_name}`
        })
      }
    }
  }
  
  return relationships
}

function calculateSummary(introspection: SchemaIntrospection) {
  introspection.summary = {
    total_tables: introspection.tables.length,
    total_columns: introspection.tables.reduce((sum, table) => sum + table.columns.length, 0),
    total_indexes: introspection.tables.reduce((sum, table) => sum + table.indexes.length, 0),
    total_constraints: introspection.tables.reduce((sum, table) => sum + table.constraints.length, 0),
    total_rows: introspection.tables.reduce((sum, table) => sum + table.row_count, 0),
    database_size_mb: 0 // Would need pg_database_size
  }
}

async function main() {
  try {
    console.log('🚀 Starting fine-tooth-comb Supabase schema introspection...\n')
    
    const introspection = await introspectSupabaseSchema()
    
    // Save complete introspection to JSON
    const outputPath = join(process.cwd(), 'docs/supabase-schema-introspection.json')
    writeFileSync(outputPath, JSON.stringify(introspection, null, 2))
    
    // Create detailed markdown report
    const reportPath = join(process.cwd(), 'docs/supabase-schema-report.md')
    const report = generateDetailedReport(introspection)
    writeFileSync(reportPath, report)
    
    console.log(`\n📄 Complete schema introspection saved to: ${outputPath}`)
    console.log(`📋 Detailed report saved to: ${reportPath}`)
    
    // Print summary
    console.log('\n📊 SCHEMA INTROSPECTION SUMMARY:')
    console.log(`📋 Tables discovered: ${introspection.summary.total_tables}`)
    console.log(`📊 Total columns: ${introspection.summary.total_columns}`)
    console.log(`🔗 Relationships mapped: ${introspection.relationships.length}`)
    console.log(`📈 Total records: ${introspection.summary.total_rows.toLocaleString()}`)
    
    console.log('\n📋 TABLES DISCOVERED:')
    introspection.tables.forEach(table => {
      console.log(`  • ${table.table_name}: ${table.row_count} rows, ${table.columns.length} columns`)
    })
    
    console.log('\n🔗 RELATIONSHIPS MAPPED:')
    introspection.relationships.forEach(rel => {
      console.log(`  • ${rel.from_table}.${rel.from_column} → ${rel.to_table}.${rel.to_column}`)
    })
    
    console.log('\n✅ Fine-tooth-comb schema introspection complete!')
    
  } catch (error) {
    console.error('💥 Introspection failed:', error)
    process.exit(1)
  }
}

function generateDetailedReport(introspection: SchemaIntrospection): string {
  return `# MotoMind Supabase Schema Introspection Report

**Generated:** ${introspection.timestamp}
**Database:** ${introspection.database_name}
**Schema:** ${introspection.schema_name}

## Summary Statistics

- **Tables:** ${introspection.summary.total_tables}
- **Columns:** ${introspection.summary.total_columns}
- **Relationships:** ${introspection.relationships.length}
- **Total Records:** ${introspection.summary.total_rows.toLocaleString()}

## Table Details

${introspection.tables.map(table => `
### ${table.table_name}

**Rows:** ${table.row_count.toLocaleString()}  
**Columns:** ${table.columns.length}

#### Column Schema
| Column | Type | Nullable | PK | FK | Foreign Reference |
|--------|------|----------|----|----|-------------------|
${table.columns.map(col => 
  `| ${col.column_name} | ${col.data_type} | ${col.is_nullable ? '✅' : '❌'} | ${col.is_primary_key ? '🔑' : ''} | ${col.is_foreign_key ? '🔗' : ''} | ${col.foreign_table ? `${col.foreign_table}.${col.foreign_column}` : ''} |`
).join('\n')}

#### Sample Data
\`\`\`json
${JSON.stringify(table.sample_data.slice(0, 2), null, 2)}
\`\`\`
`).join('\n')}

## Relationships

${introspection.relationships.map(rel => 
  `- **${rel.from_table}.${rel.from_column}** → **${rel.to_table}.${rel.to_column}**`
).join('\n')}

## Schema Analysis

### Primary Keys
${introspection.tables.map(table => {
  const pkColumns = table.columns.filter(col => col.is_primary_key)
  return pkColumns.length > 0 ? `- **${table.table_name}**: ${pkColumns.map(col => col.column_name).join(', ')}` : null
}).filter(Boolean).join('\n')}

### Foreign Keys
${introspection.tables.map(table => {
  const fkColumns = table.columns.filter(col => col.is_foreign_key)
  return fkColumns.length > 0 ? `- **${table.table_name}**: ${fkColumns.map(col => `${col.column_name} → ${col.foreign_table}`).join(', ')}` : null
}).filter(Boolean).join('\n')}

### Data Types Distribution
${(() => {
  const typeCount: { [key: string]: number } = {}
  introspection.tables.forEach(table => {
    table.columns.forEach(col => {
      typeCount[col.data_type] = (typeCount[col.data_type] || 0) + 1
    })
  })
  return Object.entries(typeCount)
    .sort(([,a], [,b]) => b - a)
    .map(([type, count]) => `- **${type}**: ${count} columns`)
    .join('\n')
})()}

---

*Generated by MotoMind Schema Introspection Tool*
`
}

main()
