// Comprehensive Database Architecture Analysis
// Extracts schema, relationships, data patterns, and identifies technical debt

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

interface TableInfo {
  table_name: string
  column_name: string
  data_type: string
  is_nullable: string
  column_default: string | null
  is_primary_key: boolean
  foreign_key_table?: string
  foreign_key_column?: string
}

interface DatabaseAnalysis {
  timestamp: string
  tables: {
    [tableName: string]: {
      schema: TableInfo[]
      row_count: number
      sample_data: any[]
      indexes: any[]
      foreign_keys: any[]
      constraints: any[]
    }
  }
  relationships: any[]
  technical_debt: string[]
  recommendations: string[]
}

async function analyzeDatabaseArchitecture(): Promise<DatabaseAnalysis> {
  console.log('🔍 Starting comprehensive database architecture analysis...')
  
  const analysis: DatabaseAnalysis = {
    timestamp: new Date().toISOString(),
    tables: {},
    relationships: [],
    technical_debt: [],
    recommendations: []
  }

  try {
    // Step 1: Get all tables in the public schema
    console.log('📋 Step 1: Discovering tables...')
    
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_table_list')
      .single()
    
    if (tablesError) {
      // Fallback: try to get tables from information_schema
      const { data: tableNames, error: fallbackError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .neq('table_type', 'VIEW')
      
      if (fallbackError) {
        console.log('⚠️  Cannot access information_schema, using known tables...')
        // Use known tables from our codebase
        const knownTables = [
          'vehicles', 'garages', 'vehicle_events', 'reminders', 
          'vehicle_images', 'schema_migrations', 'tenants'
        ]
        
        for (const tableName of knownTables) {
          await analyzeTable(tableName, analysis)
        }
      } else {
        for (const table of tableNames || []) {
          await analyzeTable(table.table_name, analysis)
        }
      }
    }

    // Step 2: Analyze relationships and constraints
    console.log('🔗 Step 2: Analyzing relationships...')
    await analyzeRelationships(analysis)

    // Step 3: Identify technical debt
    console.log('🔍 Step 3: Identifying technical debt...')
    identifyTechnicalDebt(analysis)

    // Step 4: Generate recommendations
    console.log('💡 Step 4: Generating recommendations...')
    generateRecommendations(analysis)

    return analysis

  } catch (error) {
    console.error('💥 Analysis failed:', error)
    throw error
  }
}

async function analyzeTable(tableName: string, analysis: DatabaseAnalysis) {
  console.log(`  📊 Analyzing table: ${tableName}`)
  
  try {
    // Get table schema
    const { data: columns, error: schemaError } = await supabase
      .from('information_schema.columns')
      .select(`
        column_name,
        data_type,
        is_nullable,
        column_default
      `)
      .eq('table_schema', 'public')
      .eq('table_name', tableName)
      .order('ordinal_position')

    if (schemaError) {
      console.log(`    ⚠️  Could not get schema for ${tableName}:`, schemaError.message)
      return
    }

    // Get row count and sample data
    const { count, error: countError } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true })

    const { data: sampleData, error: sampleError } = await supabase
      .from(tableName)
      .select('*')
      .limit(3)

    analysis.tables[tableName] = {
      schema: columns || [],
      row_count: count || 0,
      sample_data: sampleData || [],
      indexes: [], // Will be populated if we can access pg_indexes
      foreign_keys: [],
      constraints: []
    }

    console.log(`    ✅ ${tableName}: ${count || 0} rows, ${columns?.length || 0} columns`)

  } catch (error) {
    console.log(`    ❌ Failed to analyze ${tableName}:`, error)
  }
}

async function analyzeRelationships(analysis: DatabaseAnalysis) {
  // This would require access to information_schema.key_column_usage
  // For now, we'll infer relationships from column names and known patterns
  
  for (const [tableName, tableInfo] of Object.entries(analysis.tables)) {
    for (const column of tableInfo.schema) {
      // Look for foreign key patterns
      if (column.column_name.endsWith('_id') && column.column_name !== 'id') {
        const referencedTable = column.column_name.replace('_id', 's')
        if (analysis.tables[referencedTable]) {
          analysis.relationships.push({
            from_table: tableName,
            from_column: column.column_name,
            to_table: referencedTable,
            to_column: 'id',
            type: 'foreign_key'
          })
        }
      }
    }
  }
}

function identifyTechnicalDebt(analysis: DatabaseAnalysis) {
  const debt: string[] = []

  for (const [tableName, tableInfo] of Object.entries(analysis.tables)) {
    const columns = tableInfo.schema
    const columnNames = columns.map(c => c.column_name)

    // Check for missing standard columns
    if (!columnNames.includes('created_at')) {
      debt.push(`${tableName}: Missing created_at timestamp`)
    }
    if (!columnNames.includes('updated_at')) {
      debt.push(`${tableName}: Missing updated_at timestamp`)
    }
    if (!columnNames.includes('tenant_id') && tableName !== 'tenants' && tableName !== 'schema_migrations') {
      debt.push(`${tableName}: Missing tenant_id for multi-tenancy`)
    }

    // Check for inconsistent naming
    const hasLabel = columnNames.includes('label')
    const hasDisplayName = columnNames.includes('display_name')
    const hasNickname = columnNames.includes('nickname')
    
    if (hasLabel && hasDisplayName) {
      debt.push(`${tableName}: Inconsistent naming - both 'label' and 'display_name' exist`)
    }
    if (hasNickname && hasDisplayName) {
      debt.push(`${tableName}: Inconsistent naming - both 'nickname' and 'display_name' exist`)
    }

    // Check for missing indexes on foreign keys
    for (const column of columns) {
      if (column.column_name.endsWith('_id') && column.column_name !== 'id') {
        // Should have an index - we can't check this without pg_indexes access
        debt.push(`${tableName}.${column.column_name}: Potential missing index on foreign key`)
      }
    }

    // Check for nullable foreign keys (potential data integrity issues)
    for (const column of columns) {
      if (column.column_name.endsWith('_id') && column.is_nullable === 'YES') {
        debt.push(`${tableName}.${column.column_name}: Nullable foreign key may cause orphaned records`)
      }
    }

    // Check for missing soft delete
    if (!columnNames.includes('deleted_at') && tableName !== 'schema_migrations') {
      debt.push(`${tableName}: Missing soft delete capability (deleted_at)`)
    }

    // Check for large text fields without constraints
    for (const column of columns) {
      if (column.data_type === 'text' && !column.column_name.includes('description') && !column.column_name.includes('notes')) {
        debt.push(`${tableName}.${column.column_name}: Unbounded text field may need length constraints`)
      }
    }
  }

  analysis.technical_debt = debt
}

function generateRecommendations(analysis: DatabaseAnalysis) {
  const recommendations: string[] = []

  // Schema standardization
  recommendations.push('SCHEMA STANDARDIZATION:')
  recommendations.push('- Add created_at, updated_at timestamps to all tables')
  recommendations.push('- Implement consistent tenant_id for multi-tenancy')
  recommendations.push('- Add deleted_at for soft delete capability')
  recommendations.push('- Standardize on display_name instead of label/nickname')

  // Performance optimizations
  recommendations.push('\nPERFORMANCE OPTIMIZATIONS:')
  recommendations.push('- Add indexes on all foreign key columns')
  recommendations.push('- Add composite indexes for common query patterns')
  recommendations.push('- Consider partitioning for large event tables')
  recommendations.push('- Add database-level constraints for data integrity')

  // Observability enhancements
  recommendations.push('\nOBSERVABILITY & TELEMETRY:')
  recommendations.push('- Add query performance monitoring')
  recommendations.push('- Implement database health checks')
  recommendations.push('- Add row-level security (RLS) policies')
  recommendations.push('- Set up automated backup verification')
  recommendations.push('- Add database connection pooling metrics')

  // Data integrity improvements
  recommendations.push('\nDATA INTEGRITY:')
  recommendations.push('- Add CHECK constraints for enum-like fields')
  recommendations.push('- Implement referential integrity with proper CASCADE/RESTRICT')
  recommendations.push('- Add unique constraints where appropriate')
  recommendations.push('- Validate JSON schema for JSONB columns')

  // Scalability preparations
  recommendations.push('\nSCALABILITY PREPARATIONS:')
  recommendations.push('- Consider read replicas for reporting queries')
  recommendations.push('- Implement connection pooling (PgBouncer)')
  recommendations.push('- Add database monitoring and alerting')
  recommendations.push('- Plan for horizontal scaling strategies')

  analysis.recommendations = recommendations
}

async function main() {
  try {
    console.log('🚀 Starting MotoMind Database Architecture Analysis...\n')
    
    const analysis = await analyzeDatabaseArchitecture()
    
    // Save analysis to file
    const outputPath = join(process.cwd(), 'docs/database-analysis.json')
    writeFileSync(outputPath, JSON.stringify(analysis, null, 2))
    
    console.log(`\n📄 Analysis saved to: ${outputPath}`)
    
    // Print summary
    console.log('\n📊 ANALYSIS SUMMARY:')
    console.log(`📋 Tables analyzed: ${Object.keys(analysis.tables).length}`)
    console.log(`🔗 Relationships found: ${analysis.relationships.length}`)
    console.log(`⚠️  Technical debt items: ${analysis.technical_debt.length}`)
    console.log(`💡 Recommendations: ${analysis.recommendations.length}`)
    
    if (analysis.technical_debt.length > 0) {
      console.log('\n🚨 TOP TECHNICAL DEBT ISSUES:')
      analysis.technical_debt.slice(0, 10).forEach(debt => {
        console.log(`  • ${debt}`)
      })
    }
    
    console.log('\n✅ Database architecture analysis complete!')
    
  } catch (error) {
    console.error('💥 Analysis failed:', error)
    process.exit(1)
  }
}

main()
