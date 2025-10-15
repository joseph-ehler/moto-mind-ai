#!/usr/bin/env node

/**
 * Database Schema Audit Tool
 * Connects to Supabase and provides comprehensive schema analysis
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

async function auditDatabaseSchema() {
  console.log('🔍 MOTOMIND DATABASE SCHEMA AUDIT')
  console.log('=' .repeat(50))
  console.log(`Database: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`)
  console.log(`Timestamp: ${new Date().toISOString()}`)
  console.log('')

  try {
    // Get all tables in public schema
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_schema_tables', { schema_name: 'public' })

    if (tablesError) {
      // Fallback: Query information_schema directly
      const { data: fallbackTables, error: fallbackError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .eq('table_type', 'BASE TABLE')
        .order('table_name')

      if (fallbackError) {
        console.error('❌ Error fetching tables:', fallbackError)
        return
      }

      console.log(`📊 Found ${fallbackTables.length} tables in public schema\n`)
      
      for (const table of fallbackTables) {
        await analyzeTable(table.table_name)
      }
    } else {
      console.log(`📊 Found ${tables.length} tables in public schema\n`)
      
      for (const table of tables) {
        await analyzeTable(table.table_name)
      }
    }

    // Generate summary and recommendations
    await generateSummary()

  } catch (error) {
    console.error('❌ Audit failed:', error)
  }
}

async function analyzeTable(tableName) {
  console.log(`📋 TABLE: ${tableName}`)
  console.log('-'.repeat(30))

  try {
    // Get column information
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select(`
        column_name,
        data_type,
        is_nullable,
        column_default,
        character_maximum_length
      `)
      .eq('table_schema', 'public')
      .eq('table_name', tableName)
      .order('ordinal_position')

    if (columnsError) {
      console.error(`  ❌ Error fetching columns: ${columnsError.message}`)
      return
    }

    // Get row count
    const { count, error: countError } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true })

    const rowCount = countError ? 'Unknown' : count

    console.log(`  📊 Rows: ${rowCount}`)
    console.log(`  🏗️  Columns: ${columns.length}`)
    console.log('')

    // Display columns
    columns.forEach(col => {
      const nullable = col.is_nullable === 'YES' ? '?' : '!'
      const length = col.character_maximum_length ? `(${col.character_maximum_length})` : ''
      const defaultVal = col.column_default ? ` = ${col.column_default}` : ''
      
      console.log(`    ${col.column_name}${nullable}: ${col.data_type}${length}${defaultVal}`)
    })

    // Check for common patterns and issues
    await analyzeTablePatterns(tableName, columns, rowCount)

    console.log('')

  } catch (error) {
    console.error(`  ❌ Error analyzing table ${tableName}:`, error.message)
    console.log('')
  }
}

async function analyzeTablePatterns(tableName, columns, rowCount) {
  const columnNames = columns.map(c => c.column_name)
  const issues = []
  const recommendations = []

  // Check for standard patterns
  const hasId = columnNames.includes('id')
  const hasCreatedAt = columnNames.includes('created_at')
  const hasUpdatedAt = columnNames.includes('updated_at')
  const hasDeletedAt = columnNames.includes('deleted_at')
  const hasTenantId = columnNames.includes('tenant_id')

  // Standard field checks
  if (!hasId) issues.push('Missing primary key (id)')
  if (!hasCreatedAt) recommendations.push('Consider adding created_at timestamp')
  if (!hasUpdatedAt) recommendations.push('Consider adding updated_at timestamp')
  if (!hasDeletedAt) recommendations.push('Consider adding deleted_at for soft deletes')
  if (!hasTenantId && tableName !== 'tenants') {
    recommendations.push('Consider adding tenant_id for multi-tenancy')
  }

  // Usage analysis
  if (rowCount === 0) {
    issues.push('Table is empty - may be unused')
  } else if (rowCount === 'Unknown') {
    issues.push('Cannot determine usage')
  }

  // Naming conventions
  if (tableName.includes('_')) {
    // Good: snake_case
  } else if (tableName !== tableName.toLowerCase()) {
    recommendations.push('Consider using snake_case naming')
  }

  // Display analysis
  if (issues.length > 0) {
    console.log('  ⚠️  Issues:')
    issues.forEach(issue => console.log(`    - ${issue}`))
  }

  if (recommendations.length > 0) {
    console.log('  💡 Recommendations:')
    recommendations.forEach(rec => console.log(`    - ${rec}`))
  }

  if (issues.length === 0 && recommendations.length === 0) {
    console.log('  ✅ Table looks good!')
  }
}

async function generateSummary() {
  console.log('📈 SCHEMA SUMMARY & RECOMMENDATIONS')
  console.log('=' .repeat(50))

  // Get table counts and sizes
  const { data: tables } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .eq('table_type', 'BASE TABLE')

  console.log(`Total Tables: ${tables?.length || 'Unknown'}`)
  console.log('')

  console.log('🎯 RECOMMENDED ACTIONS:')
  console.log('1. Review empty tables for removal')
  console.log('2. Add missing timestamps where appropriate')
  console.log('3. Ensure tenant_id on all user data tables')
  console.log('4. Consider soft delete patterns (deleted_at)')
  console.log('5. Review naming conventions for consistency')
  console.log('')

  console.log('🔧 MAINTENANCE QUERIES:')
  console.log('-- Find all tables without created_at:')
  console.log(`SELECT table_name FROM information_schema.tables t 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
AND NOT EXISTS (
  SELECT 1 FROM information_schema.columns c 
  WHERE c.table_name = t.table_name 
  AND c.column_name = 'created_at'
);`)
  console.log('')
}

// Run the audit
if (require.main === module) {
  auditDatabaseSchema()
    .then(() => {
      console.log('✅ Schema audit complete!')
      process.exit(0)
    })
    .catch(error => {
      console.error('❌ Audit failed:', error)
      process.exit(1)
    })
}

module.exports = { auditDatabaseSchema }
