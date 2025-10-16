#!/usr/bin/env tsx
/**
 * God-Tier Database Architecture Analysis
 * 
 * Analyzes database schema JSON and codebase to assess:
 * - Future-proofing
 * - Scalability  
 * - Observability
 * - Extension usage
 * - JSONB optimization
 * - Best practices
 */

import * as fs from 'fs'
import * as path from 'path'

interface SchemaData {
  tables: Array<{
    name: string
    columns: Array<{
      name: string
      dataType: string
      isNullable: boolean
    }>
    indexes: Array<{
      name: string
      definition: string
    }>
    foreignKeys: any[]
    rlsEnabled: boolean
    rlsPolicies: any[]
    rowCount: number
  }>
  materializedViews?: Array<{
    name: string
    definition: string
    columns: any[]
    indexes: any[]
    rowCount: number
    lastRefresh: string | null
  }>
}

interface AnalysisResult {
  score: number
  category: string
  strengths: string[]
  weaknesses: string[]
  recommendations: Array<{
    priority: 'critical' | 'high' | 'medium' | 'low'
    title: string
    description: string
    implementation: string
    impact: string
  }>
}

function loadSchema(): SchemaData {
  const schemaPath = path.join(process.cwd(), 'docs', 'database-schema.json')
  return JSON.parse(fs.readFileSync(schemaPath, 'utf-8'))
}

function analyzeJSONBUsage(schema: SchemaData): AnalysisResult {
  const jsonbColumns: Array<{table: string, column: string, hasIndex: boolean}> = []
  
  for (const table of schema.tables) {
    for (const column of table.columns) {
      if (column.dataType === 'jsonb' || column.dataType === 'json') {
        const hasIndex = table.indexes.some(idx => 
          idx.definition.toLowerCase().includes(column.name.toLowerCase()) &&
          (idx.definition.toLowerCase().includes('gin') || idx.definition.toLowerCase().includes('gist'))
        )
        
        jsonbColumns.push({
          table: table.name,
          column: column.name,
          hasIndex
        })
      }
    }
  }
  
  const indexed = jsonbColumns.filter(c => c.hasIndex).length
  const unindexed = jsonbColumns.filter(c => !c.hasIndex).length
  
  const score = jsonbColumns.length === 0 ? 100 : 
    Math.round((indexed / jsonbColumns.length) * 100)
  
  const strengths: string[] = []
  const weaknesses: string[] = []
  
  if (jsonbColumns.length > 0) {
    strengths.push(`Using JSONB for flexible data: ${jsonbColumns.length} columns`)
  }
  if (indexed > 0) {
    strengths.push(`${indexed} JSONB columns have GIN/GIST indexes`)
  }
  if (unindexed > 0) {
    weaknesses.push(`${unindexed} JSONB columns lack indexes`)
  }
  
  const recommendations = []
  
  for (const col of jsonbColumns.filter(c => !c.hasIndex)) {
    recommendations.push({
      priority: 'medium' as const,
      title: `Add GIN Index to ${col.table}.${col.column}`,
      description: `JSONB column without index will cause slow queries`,
      implementation: `CREATE INDEX idx_${col.table}_${col.column}_gin ON ${col.table} USING gin(${col.column});`,
      impact: '10-100x faster JSONB queries with WHERE/? operators'
    })
  }
  
  // Check if we're OVER-using JSONB when we should normalize
  const tablesWithMultipleJsonb = schema.tables.filter(t => 
    t.columns.filter(c => c.dataType === 'jsonb').length > 1
  )
  
  if (tablesWithMultipleJsonb.length > 0) {
    recommendations.push({
      priority: 'low' as const,
      title: 'Review JSONB Usage for Over-Normalization',
      description: `${tablesWithMultipleJsonb.length} tables have multiple JSONB columns`,
      implementation: 'Consider if frequently-queried JSONB keys should be promoted to columns',
      impact: 'Better query performance and clearer schema'
    })
  }
  
  return {
    score,
    category: 'JSONB Usage',
    strengths,
    weaknesses,
    recommendations
  }
}

function analyzeIndexStrategy(schema: SchemaData): AnalysisResult {
  let totalIndexes = 0
  let tenantIndexes = 0
  let fkIndexes = 0
  let compositeIndexes = 0
  let partialIndexes = 0
  let ginIndexes = 0
  let gistIndexes = 0
  
  const missingTenantIndexes: string[] = []
  const missingFKIndexes: string[] = []
  
  for (const table of schema.tables) {
    totalIndexes += table.indexes.length
    
    const hasTenantId = table.columns.some(c => c.name === 'tenant_id')
    const hasTenantIndex = table.indexes.some(idx => 
      idx.definition.toLowerCase().includes('tenant_id')
    )
    
    if (hasTenantId) {
      if (hasTenantIndex) {
        tenantIndexes++
      } else {
        missingTenantIndexes.push(table.name)
      }
    }
    
    // Check FK indexes
    for (const fk of table.foreignKeys) {
      const hasFKIndex = table.indexes.some(idx =>
        idx.definition.toLowerCase().includes(fk.columnName.toLowerCase())
      )
      if (hasFKIndex) {
        fkIndexes++
      } else {
        missingFKIndexes.push(`${table.name}.${fk.columnName}`)
      }
    }
    
    // Count special index types
    for (const idx of table.indexes) {
      const def = idx.definition.toLowerCase()
      if (def.includes(',')) compositeIndexes++
      if (def.includes('where')) partialIndexes++
      if (def.includes(' gin')) ginIndexes++
      if (def.includes(' gist')) gistIndexes++
    }
  }
  
  // Elite-tier scoring: reward exceptional performance
  const indexesPerTable = totalIndexes / schema.tables.length
  const tenantTablesWithIndexes = schema.tables.filter(t => t.columns.some(c => c.name === 'tenant_id')).length
  const tenantCoverage = tenantTablesWithIndexes > 0 ? (tenantIndexes / tenantTablesWithIndexes) : 1
  
  let score = 0
  
  // Base: indexes per table (up to 40 points)
  if (indexesPerTable >= 9) score += 40 // Elite: 9+ per table
  else if (indexesPerTable >= 6) score += 30 // Great: 6-9 per table
  else if (indexesPerTable >= 3) score += 20 // Good: 3-6 per table
  else score += (indexesPerTable / 3) * 20
  
  // Tenant isolation (20 points)
  score += tenantCoverage * 20
  
  // Foreign keys (15 points)
  score += Math.min(15, (fkIndexes / Math.max(1, schema.tables.length)) * 15)
  
  // Composite indexes (10 points)
  if (compositeIndexes >= 50) score += 10 // Elite
  else if (compositeIndexes >= 30) score += 8
  else if (compositeIndexes > 0) score += 5
  
  // Partial indexes (10 points)
  if (partialIndexes >= 50) score += 10 // Elite
  else if (partialIndexes >= 30) score += 8
  else if (partialIndexes > 0) score += 5
  
  // Special index types (5 points)
  if (ginIndexes >= 20) score += 3 // Many JSONB/text indexes
  if (gistIndexes > 0) score += 2 // Geospatial
  
  score = Math.round(Math.min(100, score))
  
  const strengths: string[] = []
  const weaknesses: string[] = []
  
  strengths.push(`${totalIndexes} total indexes across ${schema.tables.length} tables`)
  if (compositeIndexes > 0) strengths.push(`${compositeIndexes} composite indexes for complex queries`)
  if (partialIndexes > 0) strengths.push(`${partialIndexes} partial indexes (WHERE clauses)`)
  if (ginIndexes > 0) strengths.push(`${ginIndexes} GIN indexes for full-text/JSONB`)
  if (gistIndexes > 0) strengths.push(`${gistIndexes} GIST indexes for geospatial`)
  
  if (missingTenantIndexes.length > 0) {
    weaknesses.push(`${missingTenantIndexes.length} tables with tenant_id lack indexes`)
  }
  if (missingFKIndexes.length > 0) {
    weaknesses.push(`${missingFKIndexes.length} foreign keys lack indexes`)
  }
  
  const recommendations = []
  
  for (const table of missingTenantIndexes.slice(0, 3)) {
    recommendations.push({
      priority: 'critical' as const,
      title: `Add tenant_id Index to ${table}`,
      description: 'Tenant isolation queries will be slow without this index',
      implementation: `CREATE INDEX idx_${table}_tenant_id ON ${table}(tenant_id);`,
      impact: 'Critical for RLS performance and multi-tenancy'
    })
  }
  
  for (const fk of missingFKIndexes.slice(0, 3)) {
    recommendations.push({
      priority: 'high' as const,
      title: `Add FK Index to ${fk}`,
      description: 'Foreign key joins will cause sequential scans',
      implementation: `CREATE INDEX idx_${fk.replace('.', '_')} ON ${fk.split('.')[0]}(${fk.split('.')[1]});`,
      impact: 'Faster JOIN operations'
    })
  }
  
  return {
    score,
    category: 'Index Strategy',
    strengths,
    weaknesses,
    recommendations
  }
}

function analyzeRLSSecurity(schema: SchemaData): AnalysisResult {
  const tablesWithTenantId = schema.tables.filter(t => 
    t.columns.some(c => c.name === 'tenant_id')
  )
  
  const tablesWithRLS = schema.tables.filter(t => t.rlsEnabled)
  const tenantTablesWithRLS = tablesWithTenantId.filter(t => t.rlsEnabled)
  
  const rlsCoverage = tablesWithTenantId.length > 0 ? 
    Math.round((tenantTablesWithRLS.length / tablesWithTenantId.length) * 100) : 100
  
  const policyCoverage = tablesWithRLS.filter(t => 
    t.rlsPolicies && t.rlsPolicies.length > 0
  ).length
  
  const score = Math.round((rlsCoverage * 0.7) + (policyCoverage / Math.max(1, tablesWithRLS.length)) * 30)
  
  const strengths: string[] = []
  const weaknesses: string[] = []
  
  strengths.push(`${tablesWithRLS.length}/${schema.tables.length} tables have RLS enabled`)
  if (rlsCoverage === 100) {
    strengths.push('100% tenant isolation coverage ✅')
  }
  strengths.push(`${policyCoverage} tables have active RLS policies`)
  
  const missingRLS = tablesWithTenantId.filter(t => !t.rlsEnabled)
  if (missingRLS.length > 0) {
    weaknesses.push(`${missingRLS.length} tenant tables lack RLS: ${missingRLS.map(t => t.name).join(', ')}`)
  }
  
  const emptyPolicies = tablesWithRLS.filter(t => !t.rlsPolicies || t.rlsPolicies.length === 0)
  if (emptyPolicies.length > 0) {
    weaknesses.push(`${emptyPolicies.length} tables have RLS enabled but no policies`)
  }
  
  const recommendations = []
  
  for (const table of missingRLS) {
    recommendations.push({
      priority: 'critical' as const,
      title: `Enable RLS on ${table.name}`,
      description: 'Tenant data is exposed without Row Level Security',
      implementation: `ALTER TABLE ${table.name} ENABLE ROW LEVEL SECURITY;`,
      impact: 'Critical security vulnerability - prevent cross-tenant data access'
    })
  }
  
  return {
    score,
    category: 'RLS Security',
    strengths,
    weaknesses,
    recommendations
  }
}

function analyzeDataTypes(schema: SchemaData): AnalysisResult {
  let timestampColumns = 0
  let timestampzColumns = 0
  let textVsVarchar = { text: 0, varchar: 0 }
  let uuidColumns = 0
  let enumColumns = 0
  
  const weakPatterns: string[] = []
  
  for (const table of schema.tables) {
    for (const column of table.columns) {
      const type = column.dataType.toLowerCase()
      
      if (type.includes('timestamp without')) timestampColumns++
      if (type.includes('timestamp with')) timestampzColumns++
      if (type === 'text') textVsVarchar.text++
      if (type.includes('character varying') || type.includes('varchar')) textVsVarchar.varchar++
      if (type === 'uuid') uuidColumns++
      if (type === 'user-defined') enumColumns++
      
      // Check for anti-patterns
      if (type.includes('timestamp without')) {
        weakPatterns.push(`${table.name}.${column.name} uses timestamp without time zone`)
      }
    }
  }
  
  const score = Math.round(
    (timestampzColumns / Math.max(1, timestampColumns + timestampzColumns)) * 30 +
    (uuidColumns > 0 ? 20 : 0) +
    (textVsVarchar.text > textVsVarchar.varchar ? 20 : 10) +
    30 // Base score
  )
  
  const strengths: string[] = []
  const weaknesses: string[] = []
  
  if (timestampzColumns > 0) {
    strengths.push(`${timestampzColumns} columns use timestamp with time zone (correct)`)
  }
  if (uuidColumns > 0) {
    strengths.push(`${uuidColumns} UUID columns (globally unique, secure)`)
  }
  if (textVsVarchar.text > textVsVarchar.varchar) {
    strengths.push(`Prefer TEXT over VARCHAR (PostgreSQL best practice)`)
  }
  
  if (timestampColumns > 0) {
    weaknesses.push(`${timestampColumns} columns use timestamp WITHOUT time zone`)
  }
  if (textVsVarchar.varchar > textVsVarchar.text) {
    weaknesses.push(`Using VARCHAR instead of TEXT (unnecessary in PostgreSQL)`)
  }
  
  const recommendations = []
  
  if (timestampColumns > 0) {
    recommendations.push({
      priority: 'medium' as const,
      title: 'Migrate to TIMESTAMPTZ',
      description: 'Timestamps without timezone cause issues in multi-timezone apps',
      implementation: 'ALTER TABLE [table] ALTER COLUMN [col] TYPE timestamptz USING [col] AT TIME ZONE \'UTC\';',
      impact: 'Proper timezone handling across regions'
    })
  }
  
  return {
    score,
    category: 'Data Types',
    strengths,
    weaknesses,
    recommendations
  }
}

function analyzeScalability(schema: SchemaData): AnalysisResult {
  const largeTables = schema.tables.filter(t => t.rowCount > 100000)
  const hasPartitioning = schema.tables.some(t => t.name.includes('_p_'))
  const hasSoftDeletes = schema.tables.filter(t => 
    t.columns.some(c => c.name === 'deleted_at')
  ).length
  
  const timeSeries = schema.tables.filter(t => 
    ['logs', 'events', 'metrics', 'audit'].some(prefix => t.name.includes(prefix)) &&
    t.rowCount > 10000
  )
  
  // Check for materialized views (advanced scalability feature)
  const materializedViewCount = schema.materializedViews?.length || 0
  const hasMaterializedViews = materializedViewCount > 0
  
  // Elite-tier scalability scoring
  let score = 0
  
  // Soft deletes (30 points)
  if (hasSoftDeletes >= 5) score += 30 // Comprehensive soft delete pattern
  else if (hasSoftDeletes >= 3) score += 20
  else if (hasSoftDeletes > 0) score += 10
  
  // Partitioning (25 points)
  if (hasPartitioning) score += 25
  else if (timeSeries.length > 0) score += 10 // Ready for partitioning
  
  // Materialized views (25 points) - advanced optimization
  if (hasMaterializedViews) score += 25
  
  // Base patterns (20 points)
  score += 20
  
  score = Math.round(score)
  
  const strengths: string[] = []
  const weaknesses: string[] = []
  
  if (hasSoftDeletes > 0) {
    strengths.push(`${hasSoftDeletes} tables use soft deletes (deleted_at)`)
  }
  if (hasPartitioning) {
    strengths.push('Table partitioning implemented')
  }
  if (hasMaterializedViews) {
    strengths.push(`${materializedViewCount} materialized views for instant aggregations`)
  }
  
  if (largeTables.length > 0 && !hasPartitioning) {
    weaknesses.push(`${largeTables.length} large tables without partitioning`)
  }
  if (timeSeries.length > 0 && !hasPartitioning) {
    weaknesses.push(`${timeSeries.length} time-series tables could benefit from partitioning`)
  }
  
  const recommendations = []
  
  if (timeSeries.length > 0 && !hasPartitioning) {
    for (const table of timeSeries.slice(0, 2)) {
      recommendations.push({
        priority: 'medium' as const,
        title: `Consider Partitioning ${table.name}`,
        description: `Time-series table with ${table.rowCount} rows`,
        implementation: `Partition by date range (monthly or yearly)`,
        impact: 'Faster queries, easier archival, better vacuum performance'
      })
    }
  }
  
  if (schema.tables.some(t => t.name === 'logs' && t.rowCount > 1000000)) {
    recommendations.push({
      priority: 'high' as const,
      title: 'Implement Log Retention Policy',
      description: 'Logs table growing unbounded',
      implementation: 'Add pg_cron job to archive/delete logs older than 90 days',
      impact: 'Prevent database bloat and maintain performance'
    })
  }
  
  return {
    score,
    category: 'Scalability',
    strengths,
    weaknesses,
    recommendations
  }
}

function analyzeObservability(schema: SchemaData): AnalysisResult {
  const hasLogsTable = schema.tables.some(t => t.name === 'logs')
  const hasAuditTables = schema.tables.filter(t => t.name.includes('audit')).length
  const hasMetricsTables = schema.tables.filter(t => t.name.includes('metrics')).length
  const hasTimestamps = schema.tables.filter(t => 
    t.columns.some(c => c.name === 'created_at') &&
    t.columns.some(c => c.name === 'updated_at')
  ).length
  
  // Elite-tier observability scoring
  let score = 0
  
  // Logging (30 points)
  if (hasLogsTable) score += 30
  
  // Audit trail (25 points)
  if (hasAuditTables > 0) score += 25
  
  // Metrics (20 points)
  if (hasMetricsTables >= 2) score += 20 // Multiple metrics tables
  else if (hasMetricsTables > 0) score += 15
  
  // Timestamps (25 points)
  const timestampCoverage = hasTimestamps / schema.tables.length
  if (timestampCoverage >= 0.85) score += 25 // 85%+ coverage
  else if (timestampCoverage >= 0.70) score += 20 // 70%+ coverage
  else score += timestampCoverage * 25
  
  score = Math.round(score)
  
  const strengths: string[] = []
  const weaknesses: string[] = []
  
  if (hasLogsTable) strengths.push('Centralized logs table ✅')
  if (hasAuditTables > 0) strengths.push(`${hasAuditTables} audit tables for change tracking`)
  if (hasMetricsTables > 0) strengths.push(`${hasMetricsTables} metrics tables`)
  if (hasTimestamps > schema.tables.length * 0.8) {
    strengths.push(`${hasTimestamps}/${schema.tables.length} tables have created_at/updated_at`)
  }
  
  if (!hasLogsTable) {
    weaknesses.push('No centralized logging table')
  }
  if (hasAuditTables === 0) {
    weaknesses.push('No audit trail for critical operations')
  }
  if (hasTimestamps < schema.tables.length * 0.5) {
    weaknesses.push(`Only ${hasTimestamps}/${schema.tables.length} tables have timestamps`)
  }
  
  const recommendations = []
  
  if (!hasMetricsTables) {
    recommendations.push({
      priority: 'medium' as const,
      title: 'Add Custom Metrics Table',
      description: 'Track business metrics (API calls, user actions, performance)',
      implementation: 'CREATE TABLE metrics (id, metric_name, value, tags jsonb, created_at)',
      impact: 'Better observability and business intelligence'
    })
  }
  
  if (hasAuditTables === 0) {
    recommendations.push({
      priority: 'high' as const,
      title: 'Implement Audit Logging',
      description: 'Track who changed what and when for compliance',
      implementation: 'Add audit triggers for critical tables (vehicles, events)',
      impact: 'Compliance, debugging, and security'
    })
  }
  
  return {
    score,
    category: 'Observability',
    strengths,
    weaknesses,
    recommendations
  }
}

function calculateOverallScore(results: AnalysisResult[]): number {
  const weights = {
    'RLS Security': 0.25,
    'Index Strategy': 0.20,
    'JSONB Usage': 0.15,
    'Scalability': 0.15,
    'Observability': 0.15,
    'Data Types': 0.10
  }
  
  let totalScore = 0
  for (const result of results) {
    const weight = weights[result.category as keyof typeof weights] || 0.1
    totalScore += result.score * weight
  }
  
  return Math.round(totalScore)
}

function generateReport(results: AnalysisResult[], overallScore: number): string {
  let report = '# 🏆 GOD-TIER DATABASE ARCHITECTURE ANALYSIS\n\n'
  report += `**Generated:** ${new Date().toISOString()}\n\n`
  report += `## 📊 GOD-TIER SCORE: ${overallScore}/100\n\n`
  
  if (overallScore >= 90) {
    report += '**Status:** 🏆 **GOD-TIER ARCHITECTURE** - World-class database design!\n\n'
  } else if (overallScore >= 80) {
    report += '**Status:** ⭐ **ELITE-TIER ARCHITECTURE** - Excellent with minor optimizations needed\n\n'
  } else if (overallScore >= 70) {
    report += '**Status:** ✅ **PRODUCTION-READY** - Solid foundation, room for improvement\n\n'
  } else {
    report += '**Status:** ⚠️  **NEEDS OPTIMIZATION** - Critical issues must be addressed\n\n'
  }
  
  report += '---\n\n'
  
  // Score breakdown
  report += '## 📈 CATEGORY SCORES\n\n'
  for (const result of results.sort((a, b) => b.score - a.score)) {
    const emoji = result.score >= 90 ? '🏆' : result.score >= 80 ? '⭐' : result.score >= 70 ? '✅' : '⚠️'
    report += `- ${emoji} **${result.category}:** ${result.score}/100\n`
  }
  report += '\n---\n\n'
  
  // Detailed analysis
  for (const result of results) {
    report += `## ${result.score >= 80 ? '✅' : result.score >= 60 ? '🟡' : '🔴'} ${result.category.toUpperCase()} (${result.score}/100)\n\n`
    
    if (result.strengths.length > 0) {
      report += '### 💪 Strengths\n\n'
      for (const strength of result.strengths) {
        report += `- ${strength}\n`
      }
      report += '\n'
    }
    
    if (result.weaknesses.length > 0) {
      report += '### ⚠️  Weaknesses\n\n'
      for (const weakness of result.weaknesses) {
        report += `- ${weakness}\n`
      }
      report += '\n'
    }
    
    if (result.recommendations.length > 0) {
      report += '### 🎯 Recommendations\n\n'
      
      const critical = result.recommendations.filter(r => r.priority === 'critical')
      const high = result.recommendations.filter(r => r.priority === 'high')
      const medium = result.recommendations.filter(r => r.priority === 'medium')
      const low = result.recommendations.filter(r => r.priority === 'low')
      
      if (critical.length > 0) {
        report += '#### 🚨 CRITICAL\n\n'
        for (const rec of critical) {
          report += `**${rec.title}**\n`
          report += `- ${rec.description}\n`
          report += `- **Implementation:** ${rec.implementation}\n`
          report += `- **Impact:** ${rec.impact}\n\n`
        }
      }
      
      if (high.length > 0) {
        report += '#### ⚠️  HIGH PRIORITY\n\n'
        for (const rec of high) {
          report += `**${rec.title}**\n`
          report += `- ${rec.description}\n`
          report += `- **Impact:** ${rec.impact}\n\n`
        }
      }
      
      if (medium.length > 0) {
        report += '#### 🟡 MEDIUM PRIORITY\n\n'
        for (const rec of medium) {
          report += `- **${rec.title}**: ${rec.description}\n`
        }
        report += '\n'
      }
      
      if (low.length > 0) {
        report += '#### ℹ️  LOW PRIORITY\n\n'
        for (const rec of low) {
          report += `- ${rec.title}\n`
        }
        report += '\n'
      }
    }
    
    report += '---\n\n'
  }
  
  // Summary recommendations
  const allRecs = results.flatMap(r => r.recommendations)
  const criticalRecs = allRecs.filter(r => r.priority === 'critical')
  
  if (criticalRecs.length > 0) {
    report += '## 🚨 ACTION REQUIRED\n\n'
    report += `**${criticalRecs.length} CRITICAL ISSUES** must be addressed before production:\n\n`
    for (const rec of criticalRecs) {
      report += `1. **${rec.title}** - ${rec.description}\n`
    }
    report += '\n'
  }
  
  return report
}

function main() {
  console.log('🏆 GOD-TIER DATABASE ARCHITECTURE ANALYSIS\n')
  
  const schema = loadSchema()
  console.log(`📊 Analyzing ${schema.tables.length} tables...\n`)
  
  const results: AnalysisResult[] = []
  
  console.log('🔒 Analyzing RLS Security...')
  results.push(analyzeRLSSecurity(schema))
  
  console.log('📊 Analyzing Index Strategy...')
  results.push(analyzeIndexStrategy(schema))
  
  console.log('📦 Analyzing JSONB Usage...')
  results.push(analyzeJSONBUsage(schema))
  
  console.log('⚡ Analyzing Scalability...')
  results.push(analyzeScalability(schema))
  
  console.log('📡 Analyzing Observability...')
  results.push(analyzeObservability(schema))
  
  console.log('🔤 Analyzing Data Types...')
  results.push(analyzeDataTypes(schema))
  
  const overallScore = calculateOverallScore(results)
  
  const report = generateReport(results, overallScore)
  
  const outputPath = path.join(process.cwd(), 'docs', 'GOD_TIER_DATABASE_ANALYSIS.md')
  fs.writeFileSync(outputPath, report, 'utf-8')
  
  console.log(`\n✅ Analysis complete!`)
  console.log(`📄 Report saved to: ${outputPath}`)
  console.log(`\n🏆 GOD-TIER SCORE: ${overallScore}/100`)
  
  if (overallScore >= 90) {
    console.log('   Status: 🏆 GOD-TIER ARCHITECTURE')
  } else if (overallScore >= 80) {
    console.log('   Status: ⭐ ELITE-TIER ARCHITECTURE')
  } else if (overallScore >= 70) {
    console.log('   Status: ✅ PRODUCTION-READY')
  } else {
    console.log('   Status: ⚠️  NEEDS OPTIMIZATION')
  }
  
  console.log('\n📋 Category Breakdown:')
  for (const result of results.sort((a, b) => b.score - a.score)) {
    const emoji = result.score >= 90 ? '🏆' : result.score >= 80 ? '⭐' : result.score >= 70 ? '✅' : '⚠️'
    console.log(`   ${emoji} ${result.category}: ${result.score}/100`)
  }
}

main()
