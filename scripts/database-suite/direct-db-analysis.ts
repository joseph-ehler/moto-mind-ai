// Direct Database Analysis - Extract actual table structures and data
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { writeFileSync, readdirSync, readFileSync } from 'fs'
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

interface DatabaseAnalysis {
  timestamp: string
  migration_files: string[]
  tables: {
    [tableName: string]: {
      row_count: number
      sample_data: any[]
      column_analysis: {
        total_columns: number
        nullable_columns: number
        has_timestamps: boolean
        has_tenant_id: boolean
        has_soft_delete: boolean
        foreign_key_columns: string[]
      }
    }
  }
  technical_debt: string[]
  data_quality_issues: string[]
  recommendations: string[]
}

async function directDatabaseAnalysis(): Promise<DatabaseAnalysis> {
  console.log('🔍 Starting direct database analysis...')
  
  const analysis: DatabaseAnalysis = {
    timestamp: new Date().toISOString(),
    migration_files: [],
    tables: {},
    technical_debt: [],
    data_quality_issues: [],
    recommendations: []
  }

  // Step 1: Analyze migration files
  console.log('📋 Step 1: Analyzing migration files...')
  analyzeMigrationFiles(analysis)

  // Step 2: Analyze actual table data
  console.log('📊 Step 2: Analyzing table data...')
  const knownTables = [
    'vehicles', 'garages', 'vehicle_events', 'reminders', 
    'vehicle_images', 'schema_migrations'
  ]

  for (const tableName of knownTables) {
    await analyzeTableData(tableName, analysis)
  }

  // Step 3: Identify issues
  console.log('🔍 Step 3: Identifying technical debt and data quality issues...')
  identifyIssues(analysis)

  return analysis
}

function analyzeMigrationFiles(analysis: DatabaseAnalysis) {
  try {
    const migrationsDir = join(process.cwd(), 'migrations')
    const files = readdirSync(migrationsDir).filter(f => f.endsWith('.sql'))
    
    analysis.migration_files = files.sort()
    
    console.log(`  📄 Found ${files.length} migration files`)
    
    // Analyze migration patterns
    for (const file of files) {
      const content = readFileSync(join(migrationsDir, file), 'utf8')
      
      // Look for common patterns
      if (content.includes('CREATE TABLE') && !content.includes('created_at')) {
        analysis.technical_debt.push(`Migration ${file}: Table created without created_at timestamp`)
      }
      
      if (content.includes('CREATE TABLE') && !content.includes('tenant_id')) {
        analysis.technical_debt.push(`Migration ${file}: Table created without tenant_id for multi-tenancy`)
      }
      
      if (content.includes('ALTER TABLE') && content.includes('ADD COLUMN')) {
        analysis.technical_debt.push(`Migration ${file}: Schema evolution - column added after initial creation`)
      }
    }
    
  } catch (error) {
    console.log('  ⚠️  Could not analyze migration files:', error)
  }
}

async function analyzeTableData(tableName: string, analysis: DatabaseAnalysis) {
  console.log(`  📊 Analyzing ${tableName}...`)
  
  try {
    // Get row count
    const { count, error: countError } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true })

    if (countError) {
      console.log(`    ❌ Could not access ${tableName}:`, countError.message)
      return
    }

    // Get sample data to analyze structure
    const { data: sampleData, error: sampleError } = await supabase
      .from(tableName)
      .select('*')
      .limit(5)

    if (sampleError) {
      console.log(`    ⚠️  Could not get sample data for ${tableName}:`, sampleError.message)
      analysis.tables[tableName] = {
        row_count: count || 0,
        sample_data: [],
        column_analysis: {
          total_columns: 0,
          nullable_columns: 0,
          has_timestamps: false,
          has_tenant_id: false,
          has_soft_delete: false,
          foreign_key_columns: []
        }
      }
      return
    }

    // Analyze column structure from sample data
    const columnAnalysis = analyzeColumns(sampleData || [], tableName)
    
    analysis.tables[tableName] = {
      row_count: count || 0,
      sample_data: sampleData || [],
      column_analysis: columnAnalysis
    }

    console.log(`    ✅ ${tableName}: ${count} rows, ${columnAnalysis.total_columns} columns`)

  } catch (error) {
    console.log(`    ❌ Failed to analyze ${tableName}:`, error)
  }
}

function analyzeColumns(sampleData: any[], tableName: string) {
  if (sampleData.length === 0) {
    return {
      total_columns: 0,
      nullable_columns: 0,
      has_timestamps: false,
      has_tenant_id: false,
      has_soft_delete: false,
      foreign_key_columns: []
    }
  }

  const firstRow = sampleData[0]
  const columns = Object.keys(firstRow)
  
  const foreignKeyColumns = columns.filter(col => 
    col.endsWith('_id') && col !== 'id'
  )

  // Check for null values across all samples
  const nullableCounts = columns.map(col => {
    const nullCount = sampleData.filter(row => row[col] === null || row[col] === undefined).length
    return { column: col, nulls: nullCount }
  })

  return {
    total_columns: columns.length,
    nullable_columns: nullableCounts.filter(nc => nc.nulls > 0).length,
    has_timestamps: columns.includes('created_at') && columns.includes('updated_at'),
    has_tenant_id: columns.includes('tenant_id'),
    has_soft_delete: columns.includes('deleted_at'),
    foreign_key_columns: foreignKeyColumns
  }
}

function identifyIssues(analysis: DatabaseAnalysis) {
  const debt: string[] = []
  const dataQuality: string[] = []

  for (const [tableName, tableInfo] of Object.entries(analysis.tables)) {
    const { column_analysis, sample_data } = tableInfo

    // Schema issues
    if (!column_analysis.has_timestamps && tableName !== 'schema_migrations') {
      debt.push(`${tableName}: Missing created_at/updated_at timestamps`)
    }

    if (!column_analysis.has_tenant_id && tableName !== 'schema_migrations') {
      debt.push(`${tableName}: Missing tenant_id for multi-tenancy isolation`)
    }

    if (!column_analysis.has_soft_delete && tableName !== 'schema_migrations') {
      debt.push(`${tableName}: Missing soft delete capability (deleted_at)`)
    }

    // Data quality issues
    if (sample_data.length > 0) {
      const firstRow = sample_data[0]
      
      // Check for inconsistent naming
      if ('label' in firstRow && 'display_name' in firstRow) {
        dataQuality.push(`${tableName}: Inconsistent naming - both 'label' and 'display_name' columns exist`)
      }

      if ('nickname' in firstRow && 'display_name' in firstRow) {
        dataQuality.push(`${tableName}: Inconsistent naming - both 'nickname' and 'display_name' columns exist`)
      }

      // Check for empty/null critical fields
      for (const row of sample_data) {
        if (tableName === 'vehicles') {
          if (!row.make || !row.model) {
            dataQuality.push(`${tableName}: Missing critical vehicle identification (make/model)`)
            break
          }
        }

        if (tableName === 'garages') {
          if (!row.name) {
            dataQuality.push(`${tableName}: Missing garage name`)
            break
          }
        }
      }

      // Check for orphaned records
      if (column_analysis.foreign_key_columns.length > 0) {
        for (const fkCol of column_analysis.foreign_key_columns) {
          const hasNulls = sample_data.some(row => row[fkCol] === null)
          if (hasNulls && fkCol !== 'garage_id') { // garage_id can be null
            dataQuality.push(`${tableName}: Potential orphaned records - null ${fkCol}`)
          }
        }
      }
    }
  }

  // Generate comprehensive recommendations
  const recommendations = [
    '=== IMMEDIATE PRIORITIES ===',
    '1. Standardize timestamps: Add created_at, updated_at to all tables',
    '2. Implement multi-tenancy: Add tenant_id to all user data tables',
    '3. Add soft delete: Implement deleted_at for data recovery',
    '4. Resolve naming conflicts: Standardize on display_name vs label/nickname',
    '',
    '=== PERFORMANCE & SCALABILITY ===',
    '5. Add database indexes on foreign keys and query patterns',
    '6. Implement connection pooling (PgBouncer) for high concurrency',
    '7. Set up read replicas for reporting and analytics queries',
    '8. Add database monitoring and query performance tracking',
    '',
    '=== DATA INTEGRITY ===',
    '9. Add CHECK constraints for enum-like fields (status, category, etc)',
    '10. Implement proper CASCADE/RESTRICT on foreign key relationships',
    '11. Add unique constraints where business logic requires uniqueness',
    '12. Validate JSONB schemas for structured data in payload columns',
    '',
    '=== OBSERVABILITY & MONITORING ===',
    '13. Implement row-level security (RLS) policies for tenant isolation',
    '14. Add database health checks and automated alerts',
    '15. Set up query performance monitoring and slow query logging',
    '16. Implement automated backup verification and recovery testing',
    '',
    '=== ARCHITECTURE IMPROVEMENTS ===',
    '17. Consider event sourcing for vehicle_events table',
    '18. Implement proper audit trails for sensitive data changes',
    '19. Add database-level data validation and constraints',
    '20. Plan for horizontal scaling with proper partitioning strategies'
  ]

  analysis.technical_debt = [...analysis.technical_debt, ...debt]
  analysis.data_quality_issues = dataQuality
  analysis.recommendations = recommendations
}

async function main() {
  try {
    console.log('🚀 Starting MotoMind Direct Database Analysis...\n')
    
    const analysis = await directDatabaseAnalysis()
    
    // Save detailed analysis
    const outputPath = join(process.cwd(), 'docs/database-analysis-detailed.json')
    writeFileSync(outputPath, JSON.stringify(analysis, null, 2))
    
    // Create summary report
    const summaryReport = generateSummaryReport(analysis)
    const summaryPath = join(process.cwd(), 'docs/database-analysis-summary.md')
    writeFileSync(summaryPath, summaryReport)
    
    console.log(`\n📄 Detailed analysis saved to: ${outputPath}`)
    console.log(`📋 Summary report saved to: ${summaryPath}`)
    
    // Print key findings
    console.log('\n📊 KEY FINDINGS:')
    console.log(`📋 Tables analyzed: ${Object.keys(analysis.tables).length}`)
    console.log(`📄 Migration files: ${analysis.migration_files.length}`)
    console.log(`⚠️  Technical debt items: ${analysis.technical_debt.length}`)
    console.log(`🔍 Data quality issues: ${analysis.data_quality_issues.length}`)
    
    if (analysis.technical_debt.length > 0) {
      console.log('\n🚨 TOP TECHNICAL DEBT ISSUES:')
      analysis.technical_debt.slice(0, 8).forEach(debt => {
        console.log(`  • ${debt}`)
      })
    }
    
    if (analysis.data_quality_issues.length > 0) {
      console.log('\n🔍 DATA QUALITY ISSUES:')
      analysis.data_quality_issues.forEach(issue => {
        console.log(`  • ${issue}`)
      })
    }
    
    console.log('\n✅ Database analysis complete!')
    
  } catch (error) {
    console.error('💥 Analysis failed:', error)
    process.exit(1)
  }
}

function generateSummaryReport(analysis: DatabaseAnalysis): string {
  const totalRows = Object.values(analysis.tables).reduce((sum, table) => sum + table.row_count, 0)
  
  return `# MotoMind Database Architecture Analysis

**Analysis Date:** ${analysis.timestamp}

## Executive Summary

Your MotoMind database shows signs of rapid development with **${analysis.technical_debt.length} technical debt items** and **${analysis.data_quality_issues.length} data quality issues** that need attention for production scalability.

## Database Overview

- **Tables:** ${Object.keys(analysis.tables).length}
- **Total Records:** ${totalRows.toLocaleString()}
- **Migration Files:** ${analysis.migration_files.length}

## Table Analysis

${Object.entries(analysis.tables).map(([name, info]) => `
### ${name}
- **Rows:** ${info.row_count.toLocaleString()}
- **Columns:** ${info.column_analysis.total_columns}
- **Has Timestamps:** ${info.column_analysis.has_timestamps ? '✅' : '❌'}
- **Has Tenant ID:** ${info.column_analysis.has_tenant_id ? '✅' : '❌'}
- **Has Soft Delete:** ${info.column_analysis.has_soft_delete ? '✅' : '❌'}
- **Foreign Keys:** ${info.column_analysis.foreign_key_columns.join(', ') || 'None'}
`).join('')}

## Critical Issues

### Technical Debt (${analysis.technical_debt.length} items)
${analysis.technical_debt.map(debt => `- ${debt}`).join('\n')}

### Data Quality Issues (${analysis.data_quality_issues.length} items)
${analysis.data_quality_issues.map(issue => `- ${issue}`).join('\n')}

## Recommendations

${analysis.recommendations.join('\n')}

---

*Generated by MotoMind Database Analysis Tool*
`
}

main()
