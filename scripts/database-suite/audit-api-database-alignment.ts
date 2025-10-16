#!/usr/bin/env tsx
/**
 * API-Database Alignment Audit
 * 
 * Compares what the 31 API routes expect vs. what exists in database
 * Identifies missing tables, columns, indexes, and RLS policies
 * 
 * Run: npm run db:audit-api-alignment
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'
import { glob } from 'glob'

// Load .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing environment variables')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

interface TableExpectation {
  table: string
  columns?: string[]
  description: string
  usedBy: string[]
  critical: boolean
}

interface AuditResult {
  existingTables: string[]
  expectedTables: Map<string, TableExpectation>
  missingTables: TableExpectation[]
  missingIndexes: IndexRecommendation[]
  rlsIssues: RLSIssue[]
  performanceWarnings: PerformanceWarning[]
}

interface IndexRecommendation {
  table: string
  columns: string[]
  reason: string
  priority: 'critical' | 'high' | 'medium'
}

interface RLSIssue {
  table: string
  issue: string
  severity: 'critical' | 'warning'
}

interface PerformanceWarning {
  table: string
  warning: string
  impact: string
}

/**
 * Get all existing tables from database
 */
async function getExistingTables(): Promise<string[]> {
  const { data, error } = await supabase.rpc('get_tables', {})

  if (error) {
    // Fallback: Try raw SQL query
    const { data: rawData, error: rawError } = await supabase
      .from('information_schema.tables' as any)
      .select('table_name')
    
    if (rawError) {
      // Last resort: Read from introspection JSON if it exists
      const introspectionPath = path.join(process.cwd(), 'docs', 'database-schema.json')
      if (fs.existsSync(introspectionPath)) {
        const introspection = JSON.parse(fs.readFileSync(introspectionPath, 'utf-8'))
        return introspection.tables?.map((t: any) => t.name) || []
      }
      console.error('Error fetching tables:', error)
      return []
    }
    
    return rawData?.map((t: any) => t.table_name) || []
  }

  return data?.map((t: any) => t.table_name) || []
}

/**
 * Scan API routes and extract table expectations
 */
async function scanAPIRoutes(): Promise<Map<string, TableExpectation>> {
  const expectations = new Map<string, TableExpectation>()
  
  // Scan all route.ts files in app/api
  const routeFiles = await glob('app/api/**/route.ts', {
    cwd: process.cwd(),
    absolute: true
  })

  console.log(`🔍 Scanning ${routeFiles.length} API route files...`)

  for (const file of routeFiles) {
    const content = fs.readFileSync(file, 'utf-8')
    const relativePath = path.relative(process.cwd(), file)

    // Extract table references from .from() calls
    const fromMatches = Array.from(content.matchAll(/\.from\(['"`]([^'"`]+)['"`]\)/g))
    
    for (const match of fromMatches) {
      const tableName = match[1]
      
      if (!expectations.has(tableName)) {
        expectations.set(tableName, {
          table: tableName,
          description: `Used by API routes`,
          usedBy: [],
          critical: true,
          columns: []
        })
      }
      
      const expectation = expectations.get(tableName)!
      if (!expectation.usedBy.includes(relativePath)) {
        expectation.usedBy.push(relativePath)
      }

      // Extract column references from .select() calls after this .from()
      const selectRegex = new RegExp(
        `\\.from\\(['"\`]${tableName}['"\`]\\)\\s*\\.select\\(['"\`]([^'"\`]+)['"\`]\\)`,
        'g'
      )
      const selectMatches = Array.from(content.matchAll(selectRegex))
      
      for (const selectMatch of selectMatches) {
        const columns = selectMatch[1]
          .split(',')
          .map((c: string) => c.trim())
          .filter((c: string) => c !== '*' && !c.includes('('))
        
        expectation.columns = Array.from(
          new Set([...(expectation.columns || []), ...columns])
        )
      }
    }
  }

  return expectations
}

/**
 * Analyze what indexes are needed based on query patterns
 */
async function analyzeIndexNeeds(
  expectations: Map<string, TableExpectation>
): Promise<IndexRecommendation[]> {
  const recommendations: IndexRecommendation[] = []

  // Scan API routes for common query patterns
  const routeFiles = await glob('app/api/**/route.ts', {
    cwd: process.cwd(),
    absolute: true
  })

  for (const file of routeFiles) {
    const content = fs.readFileSync(file, 'utf-8')

    // Look for .eq() filters - these need indexes
    const eqMatches = content.matchAll(/\.eq\(['"`]([^'"`]+)['"`]/g)
    const eqColumns = new Set(Array.from(eqMatches).map(m => m[1]))

    // Look for .or() filters
    const orMatches = content.matchAll(/\.or\(['"`]([^'"`]+)/g)
    
    // Look for .gte/.lte (range queries) - composite indexes needed
    const rangeMatches = content.matchAll(/\.(gte|lte)\(['"`]([^'"`]+)['"`]/g)
    const rangeColumns = Array.from(rangeMatches).map(m => m[2])

    // CRITICAL: tenant_id should ALWAYS be indexed
    if (content.includes('tenant_id')) {
      // Try to find table name
      const tableMatch = content.match(/\.from\(['"`]([^'"`]+)['"`]\)/)
      if (tableMatch) {
        recommendations.push({
          table: tableMatch[1],
          columns: ['tenant_id'],
          reason: 'Tenant isolation - critical for RLS performance',
          priority: 'critical'
        })
      }
    }

    // CRITICAL: user_id indexes
    if (content.includes('user_id')) {
      const tableMatch = content.match(/\.from\(['"`]([^'"`]+)['"`]\)/)
      if (tableMatch) {
        recommendations.push({
          table: tableMatch[1],
          columns: ['user_id'],
          reason: 'User data filtering',
          priority: 'critical'
        })
      }
    }

    // HIGH: Foreign keys
    if (content.includes('vehicle_id')) {
      const tableMatch = content.match(/\.from\(['"`]([^'"`]+)['"`]\)/)
      if (tableMatch && tableMatch[1] !== 'vehicles') {
        recommendations.push({
          table: tableMatch[1],
          columns: ['vehicle_id'],
          reason: 'Foreign key lookups',
          priority: 'high'
        })
      }
    }

    // MEDIUM: Date ranges (composite with tenant_id)
    if (rangeColumns.includes('date') || rangeColumns.includes('created_at')) {
      const tableMatch = content.match(/\.from\(['"`]([^'"`]+)['"`]\)/)
      if (tableMatch) {
        recommendations.push({
          table: tableMatch[1],
          columns: ['tenant_id', rangeColumns[0]],
          reason: 'Date range queries with tenant isolation',
          priority: 'medium'
        })
      }
    }
  }

  // Deduplicate recommendations
  const uniqueRecommendations = Array.from(
    new Map(
      recommendations.map(r => [
        `${r.table}-${r.columns.join('-')}`,
        r
      ])
    ).values()
  )

  return uniqueRecommendations
}

/**
 * Check RLS policies on tables
 */
async function auditRLSPolicies(tables: string[]): Promise<RLSIssue[]> {
  const issues: RLSIssue[] = []

  for (const table of tables) {
    // Check if RLS is enabled
    const { data: rlsData } = await supabase
      .rpc('pg_get_rls_enabled', { table_name: table })
      .single()

    // Check if table has tenant_id column
    const { data: columns } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_schema', 'public')
      .eq('table_name', table)

    const hastenantId = columns?.some(c => c.column_name === 'tenant_id')

    if (hastenantId && !rlsData) {
      issues.push({
        table,
        issue: 'Table has tenant_id but RLS is not enabled',
        severity: 'critical'
      })
    }

    // Check if table stores user data but has no RLS
    const userDataTables = [
      'profiles',
      'vehicles',
      'vehicle_events',
      'garages',
      'favorite_stations',
      'user_maintenance_preferences'
    ]

    if (userDataTables.includes(table) && !rlsData) {
      issues.push({
        table,
        issue: 'User data table without RLS protection',
        severity: 'critical'
      })
    }
  }

  return issues
}

/**
 * Analyze performance concerns
 */
async function analyzePerformance(
  expectations: Map<string, TableExpectation>
): Promise<PerformanceWarning[]> {
  const warnings: PerformanceWarning[] = []

  // Check for tables without indexes on frequently queried columns
  const routeFiles = await glob('app/api/**/route.ts', {
    cwd: process.cwd(),
    absolute: true
  })

  for (const file of routeFiles) {
    const content = fs.readFileSync(file, 'utf-8')

    // Look for aggregations without indexes
    if (content.includes('.sum(') || content.includes('.avg(') || content.includes('.count(')) {
      const tableMatch = content.match(/\.from\(['"`]([^'"`]+)['"`]\)/)
      if (tableMatch) {
        warnings.push({
          table: tableMatch[1],
          warning: 'Aggregation queries detected',
          impact: 'Expensive operations on every request - consider caching or materialized views'
        })
      }
    }

    // Look for N+1 query patterns (Promise.all with map)
    if (content.includes('Promise.all') && content.includes('.map(')) {
      warnings.push({
        table: 'multiple',
        warning: 'Potential N+1 query pattern detected',
        impact: 'Multiple sequential database calls - consider JOIN or batch queries'
      })
    }

    // Look for lat/lng range queries without spatial indexes
    if (content.includes('geocoded_lat') && content.includes('geocoded_lng')) {
      const tableMatch = content.match(/\.from\(['"`]([^'"`]+)['"`]\)/)
      if (tableMatch) {
        warnings.push({
          table: tableMatch[1],
          warning: 'Geospatial queries without PostGIS indexes',
          impact: 'Slow location-based searches - recommend adding geography column with GIST index'
        })
      }
    }
  }

  return warnings
}

/**
 * Main audit function
 */
async function runAudit(): Promise<AuditResult> {
  console.log('🔍 STARTING API-DATABASE ALIGNMENT AUDIT...\n')

  // Step 1: Get existing tables
  console.log('📊 Step 1: Fetching existing tables...')
  const existingTables = await getExistingTables()
  console.log(`   Found ${existingTables.length} tables in database\n`)

  // Step 2: Scan API routes for expectations
  console.log('🔎 Step 2: Scanning API routes for table expectations...')
  const expectedTables = await scanAPIRoutes()
  console.log(`   Found ${expectedTables.size} tables referenced in API routes\n`)

  // Step 3: Identify missing tables
  console.log('❌ Step 3: Identifying missing tables...')
  const missingTables = Array.from(expectedTables.values()).filter(
    exp => !existingTables.includes(exp.table)
  )
  console.log(`   Missing ${missingTables.length} tables\n`)

  // Step 4: Analyze index needs
  console.log('📈 Step 4: Analyzing index requirements...')
  const missingIndexes = await analyzeIndexNeeds(expectedTables)
  console.log(`   Identified ${missingIndexes.length} index recommendations\n`)

  // Step 5: Audit RLS policies
  console.log('🔒 Step 5: Auditing RLS policies...')
  const rlsIssues = await auditRLSPolicies(existingTables)
  console.log(`   Found ${rlsIssues.length} RLS issues\n`)

  // Step 6: Analyze performance
  console.log('⚡ Step 6: Analyzing performance concerns...')
  const performanceWarnings = await analyzePerformance(expectedTables)
  console.log(`   Identified ${performanceWarnings.length} performance warnings\n`)

  return {
    existingTables,
    expectedTables,
    missingTables,
    missingIndexes,
    rlsIssues,
    performanceWarnings
  }
}

/**
 * Generate comprehensive report
 */
function generateReport(result: AuditResult): string {
  let report = '# 🔍 API-DATABASE ALIGNMENT AUDIT REPORT\n\n'
  report += `**Generated:** ${new Date().toISOString()}\n\n`
  report += '---\n\n'

  // Summary
  report += '## 📊 EXECUTIVE SUMMARY\n\n'
  report += '```\n'
  report += `Existing Tables:       ${result.existingTables.length}\n`
  report += `Expected Tables:       ${result.expectedTables.size}\n`
  report += `Missing Tables:        ${result.missingTables.length} ${result.missingTables.length > 0 ? '❌ CRITICAL' : '✅'}\n`
  report += `Missing Indexes:       ${result.missingIndexes.length} ${result.missingIndexes.length > 0 ? '⚠️  ACTION NEEDED' : '✅'}\n`
  report += `RLS Issues:            ${result.rlsIssues.length} ${result.rlsIssues.length > 0 ? '🚨 SECURITY RISK' : '✅'}\n`
  report += `Performance Warnings:  ${result.performanceWarnings.length} ${result.performanceWarnings.length > 0 ? '🟡 OPTIMIZATION NEEDED' : '✅'}\n`
  report += '```\n\n'
  
  const criticalIssues = 
    result.missingTables.length + 
    result.rlsIssues.filter(i => i.severity === 'critical').length +
    result.missingIndexes.filter(i => i.priority === 'critical').length

  if (criticalIssues > 0) {
    report += `**🚨 STATUS: NOT PRODUCTION READY (${criticalIssues} critical issues)**\n\n`
  } else {
    report += '**✅ STATUS: Production Ready (minor optimizations recommended)**\n\n'
  }

  report += '---\n\n'

  // Missing Tables
  if (result.missingTables.length > 0) {
    report += '## ❌ MISSING TABLES (CRITICAL)\n\n'
    report += 'These tables are referenced by API routes but do not exist in the database:\n\n'
    
    for (const table of result.missingTables) {
      report += `### \`${table.table}\`\n\n`
      report += `**Description:** ${table.description}\n\n`
      report += `**Used by:**\n`
      for (const route of table.usedBy) {
        report += `- \`${route}\`\n`
      }
      if (table.columns && table.columns.length > 0) {
        report += `\n**Expected columns:** ${table.columns.join(', ')}\n`
      }
      report += '\n'
    }
    report += '---\n\n'
  }

  // RLS Issues
  if (result.rlsIssues.length > 0) {
    report += '## 🔒 RLS SECURITY ISSUES\n\n'
    
    const critical = result.rlsIssues.filter(i => i.severity === 'critical')
    const warnings = result.rlsIssues.filter(i => i.severity === 'warning')
    
    if (critical.length > 0) {
      report += '### 🚨 CRITICAL (Action Required)\n\n'
      for (const issue of critical) {
        report += `- **\`${issue.table}\`**: ${issue.issue}\n`
      }
      report += '\n'
    }
    
    if (warnings.length > 0) {
      report += '### ⚠️  WARNINGS\n\n'
      for (const issue of warnings) {
        report += `- **\`${issue.table}\`**: ${issue.issue}\n`
      }
      report += '\n'
    }
    report += '---\n\n'
  }

  // Missing Indexes
  if (result.missingIndexes.length > 0) {
    report += '## 📈 RECOMMENDED INDEXES\n\n'
    
    const critical = result.missingIndexes.filter(i => i.priority === 'critical')
    const high = result.missingIndexes.filter(i => i.priority === 'high')
    const medium = result.missingIndexes.filter(i => i.priority === 'medium')
    
    if (critical.length > 0) {
      report += '### 🚨 CRITICAL (Add Immediately)\n\n'
      for (const idx of critical) {
        report += `#### \`${idx.table}\` → \`(${idx.columns.join(', ')})\`\n`
        report += `**Reason:** ${idx.reason}\n\n`
        report += '```sql\n'
        report += `CREATE INDEX idx_${idx.table}_${idx.columns.join('_')}\n`
        report += `ON ${idx.table} (${idx.columns.join(', ')});\n`
        report += '```\n\n'
      }
    }
    
    if (high.length > 0) {
      report += '### ⚠️  HIGH PRIORITY\n\n'
      for (const idx of high) {
        report += `- **\`${idx.table}\`** → \`(${idx.columns.join(', ')})\`: ${idx.reason}\n`
      }
      report += '\n'
    }
    
    if (medium.length > 0) {
      report += '### 🟡 MEDIUM PRIORITY\n\n'
      for (const idx of medium) {
        report += `- **\`${idx.table}\`** → \`(${idx.columns.join(', ')})\`: ${idx.reason}\n`
      }
      report += '\n'
    }
    report += '---\n\n'
  }

  // Performance Warnings
  if (result.performanceWarnings.length > 0) {
    report += '## ⚡ PERFORMANCE WARNINGS\n\n'
    for (const warning of result.performanceWarnings) {
      report += `### \`${warning.table}\`\n`
      report += `**Warning:** ${warning.warning}\n\n`
      report += `**Impact:** ${warning.impact}\n\n`
    }
    report += '---\n\n'
  }

  // Expected Tables Detail
  report += '## 📋 ALL EXPECTED TABLES\n\n'
  for (const [tableName, expectation] of Array.from(result.expectedTables.entries())) {
    const exists = result.existingTables.includes(tableName)
    const status = exists ? '✅' : '❌'
    
    report += `### ${status} \`${tableName}\`\n`
    report += `**Status:** ${exists ? 'Exists' : 'MISSING'}\n\n`
    report += `**Used by ${expectation.usedBy.length} route(s):**\n`
    for (const route of expectation.usedBy.slice(0, 3)) {
      report += `- \`${route}\`\n`
    }
    if (expectation.usedBy.length > 3) {
      report += `- ... and ${expectation.usedBy.length - 3} more\n`
    }
    report += '\n'
  }

  report += '---\n\n'
  report += '**End of Report**\n'

  return report
}

/**
 * Main execution
 */
async function main() {
  try {
    const result = await runAudit()
    
    // Generate report
    const report = generateReport(result)
    
    // Save report
    const outputPath = path.join(process.cwd(), 'docs', 'audits', 'API_DATABASE_ALIGNMENT_AUDIT.md')
    fs.mkdirSync(path.dirname(outputPath), { recursive: true })
    fs.writeFileSync(outputPath, report, 'utf-8')
    
    console.log('✅ AUDIT COMPLETE!\n')
    console.log(`📄 Report saved to: ${outputPath}\n`)
    
    // Print summary
    console.log('📊 SUMMARY:')
    console.log(`   Missing Tables: ${result.missingTables.length}`)
    console.log(`   Missing Indexes: ${result.missingIndexes.length}`)
    console.log(`   RLS Issues: ${result.rlsIssues.length}`)
    console.log(`   Performance Warnings: ${result.performanceWarnings.length}`)
    
    const criticalIssues = 
      result.missingTables.length + 
      result.rlsIssues.filter(i => i.severity === 'critical').length +
      result.missingIndexes.filter(i => i.priority === 'critical').length
    
    if (criticalIssues > 0) {
      console.log(`\n🚨 ${criticalIssues} CRITICAL ISSUES FOUND!`)
      console.log('   Database is NOT production ready')
      process.exit(1)
    } else {
      console.log('\n✅ No critical issues found')
      console.log('   Database is production ready (optimizations recommended)')
    }
  } catch (error) {
    console.error('❌ Audit failed:', error)
    process.exit(1)
  }
}

main()
