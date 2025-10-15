/**
 * Performance Analyzer
 * Identifies slow queries, missing indexes, and optimization opportunities
 */

import { SupabaseClient } from '@supabase/supabase-js'

export interface PerformanceIssue {
  severity: 'critical' | 'warning' | 'info'
  type: 'slow-query' | 'missing-index' | 'large-table' | 'inefficient-query'
  table: string
  issue: string
  impact: string
  recommendation: string
  estimatedImprovement?: string
}

export interface PerformanceReport {
  score: number // 0-100
  issues: PerformanceIssue[]
  slowQueries: number
  missingIndexes: number
  tablesAnalyzed: number
  totalRecords: number
}

export async function analyzePerformance(
  supabase: SupabaseClient,
  tables: string[]
): Promise<PerformanceReport> {
  console.log('\n⚡ PERFORMANCE ANALYSIS\n')
  console.log('Analyzing queries, indexes, and optimization opportunities...\n')
  
  const issues: PerformanceIssue[] = []
  let totalRecords = 0
  
  for (const table of tables) {
    console.log(`📊 Analyzing: ${table}...`)
    
    const tableIssues = await analyzeTable(supabase, table)
    issues.push(...tableIssues)
    
    const { count } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true })
    
    totalRecords += count || 0
    
    if (tableIssues.length === 0) {
      console.log(`   ✅ Optimized`)
    } else {
      console.log(`   ⚠️  ${tableIssues.length} issue(s) found`)
    }
  }
  
  const slowQueries = issues.filter(i => i.type === 'slow-query').length
  const missingIndexes = issues.filter(i => i.type === 'missing-index').length
  
  const score = Math.max(
    0,
    100 - (slowQueries * 10) - (missingIndexes * 5) - (issues.length * 2)
  )
  
  return {
    score,
    issues,
    slowQueries,
    missingIndexes,
    tablesAnalyzed: tables.length,
    totalRecords
  }
}

async function analyzeTable(
  supabase: SupabaseClient,
  table: string
): Promise<PerformanceIssue[]> {
  const issues: PerformanceIssue[] = []
  
  // Check 1: Table size
  const sizeIssue = await checkTableSize(supabase, table)
  if (sizeIssue) issues.push(sizeIssue)
  
  // Check 2: Missing indexes
  const indexIssues = await checkMissingIndexes(supabase, table)
  issues.push(...indexIssues)
  
  // Check 3: Query performance
  const queryIssues = await testQueryPerformance(supabase, table)
  issues.push(...queryIssues)
  
  return issues
}

async function checkTableSize(
  supabase: SupabaseClient,
  table: string
): Promise<PerformanceIssue | null> {
  const { count } = await supabase
    .from(table)
    .select('*', { count: 'exact', head: true })
  
  if (!count) return null
  
  // Large tables (> 10k rows) should have indexes
  if (count > 10000) {
    return {
      severity: 'info',
      type: 'large-table',
      table,
      issue: 'Large table',
      impact: `${count.toLocaleString()} rows - queries may be slow`,
      recommendation: 'Ensure proper indexes on frequently queried columns',
      estimatedImprovement: 'Up to 10x faster queries with proper indexes'
    }
  }
  
  return null
}

async function checkMissingIndexes(
  supabase: SupabaseClient,
  table: string
): Promise<PerformanceIssue[]> {
  const issues: PerformanceIssue[] = []
  
  // Get sample to check for foreign keys
  const { data } = await supabase
    .from(table)
    .select('*')
    .limit(1)
  
  if (!data || data.length === 0) return issues
  
  const sample = data[0]
  const foreignKeyColumns = Object.keys(sample).filter(
    key => key.endsWith('_id') && key !== 'id'
  )
  
  // Check if foreign keys likely have indexes
  // In production, you'd query pg_indexes
  if (foreignKeyColumns.length > 0) {
    const { count } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true })
    
    if (count && count > 1000) {
      foreignKeyColumns.forEach(col => {
        issues.push({
          severity: 'warning',
          type: 'missing-index',
          table,
          issue: `Potential missing index on ${col}`,
          impact: 'Queries filtering by this column may be slow',
          recommendation: `CREATE INDEX idx_${table}_${col} ON ${table}(${col});`,
          estimatedImprovement: '5-10x faster queries'
        })
      })
    }
  }
  
  // Check for tenant_id index (critical for multi-tenant)
  if ('tenant_id' in sample) {
    const { count } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true })
    
    if (count && count > 100) {
      issues.push({
        severity: 'warning',
        type: 'missing-index',
        table,
        issue: 'Tenant isolation queries need index',
        impact: 'Tenant-filtered queries may be slow',
        recommendation: `CREATE INDEX idx_${table}_tenant_id ON ${table}(tenant_id);`,
        estimatedImprovement: '10-100x faster tenant queries'
      })
    }
  }
  
  return issues
}

async function testQueryPerformance(
  supabase: SupabaseClient,
  table: string
): Promise<PerformanceIssue[]> {
  const issues: PerformanceIssue[] = []
  
  // Test common query patterns
  const start = Date.now()
  
  try {
    await supabase
      .from(table)
      .select('*')
      .limit(10)
    
    const duration = Date.now() - start
    
    if (duration > 500) {
      issues.push({
        severity: 'critical',
        type: 'slow-query',
        table,
        issue: 'Slow SELECT query',
        impact: `Query took ${duration}ms (> 500ms threshold)`,
        recommendation: 'Add indexes or optimize query',
        estimatedImprovement: 'Reduce to < 100ms with proper indexing'
      })
    } else if (duration > 200) {
      issues.push({
        severity: 'warning',
        type: 'slow-query',
        table,
        issue: 'Moderate query latency',
        impact: `Query took ${duration}ms (> 200ms threshold)`,
        recommendation: 'Consider adding indexes for better performance',
        estimatedImprovement: 'Reduce to < 50ms'
      })
    }
  } catch (error) {
    // Query failed - that's also a performance issue
    issues.push({
      severity: 'critical',
      type: 'inefficient-query',
      table,
      issue: 'Query failed',
      impact: 'Unable to query table efficiently',
      recommendation: 'Check table structure and permissions'
    })
  }
  
  return issues
}

export function printPerformanceReport(report: PerformanceReport): void {
  console.log('\n' + '═'.repeat(70))
  console.log('⚡ PERFORMANCE ANALYSIS REPORT')
  console.log('═'.repeat(70))
  
  const scoreColor = report.score >= 90 ? '🟢' : report.score >= 70 ? '🟡' : '🔴'
  console.log(`\n${scoreColor} Performance Score: ${report.score}/100`)
  
  console.log(`\n📊 Summary:`)
  console.log(`   Tables Analyzed: ${report.tablesAnalyzed}`)
  console.log(`   Total Records: ${report.totalRecords.toLocaleString()}`)
  console.log(`   Slow Queries: ${report.slowQueries}`)
  console.log(`   Missing Indexes: ${report.missingIndexes}`)
  console.log(`   Total Issues: ${report.issues.length}`)
  
  if (report.issues.length > 0) {
    // Group by severity
    const critical = report.issues.filter(i => i.severity === 'critical')
    const warnings = report.issues.filter(i => i.severity === 'warning')
    const info = report.issues.filter(i => i.severity === 'info')
    
    if (critical.length > 0) {
      console.log(`\n❌ CRITICAL PERFORMANCE ISSUES (${critical.length}):\n`)
      critical.forEach((issue, i) => {
        console.log(`${i + 1}. ${issue.table}: ${issue.issue}`)
        console.log(`   Impact: ${issue.impact}`)
        console.log(`   Fix: ${issue.recommendation}`)
        if (issue.estimatedImprovement) {
          console.log(`   Improvement: ${issue.estimatedImprovement}`)
        }
        console.log()
      })
    }
    
    if (warnings.length > 0) {
      console.log(`⚠️  PERFORMANCE WARNINGS (${warnings.length}):\n`)
      warnings.forEach((issue, i) => {
        console.log(`${i + 1}. ${issue.table}: ${issue.issue}`)
        console.log(`   Recommendation: ${issue.recommendation}`)
        if (issue.estimatedImprovement) {
          console.log(`   Improvement: ${issue.estimatedImprovement}`)
        }
        console.log()
      })
    }
    
    if (info.length > 0) {
      console.log(`ℹ️  OPTIMIZATION OPPORTUNITIES (${info.length}):\n`)
      info.forEach((issue, i) => {
        console.log(`${i + 1}. ${issue.table}: ${issue.issue}`)
        console.log(`   Tip: ${issue.recommendation}`)
        console.log()
      })
    }
  } else {
    console.log(`\n✅ No performance issues found!`)
    console.log(`   All queries are optimized.`)
  }
  
  console.log('═'.repeat(70) + '\n')
}

export function generateOptimizationSQL(issues: PerformanceIssue[]): string {
  console.log('\n📝 OPTIMIZATION SQL:\n')
  
  let sql = `-- Performance Optimization Script
-- Generated: ${new Date().toISOString()}
--
-- Review before executing in production\n\n`
  
  const indexIssues = issues.filter(i => i.type === 'missing-index')
  
  if (indexIssues.length > 0) {
    sql += `-- Add Missing Indexes\n`
    indexIssues.forEach(issue => {
      sql += `${issue.recommendation}\n`
    })
    sql += '\n'
  }
  
  sql += `-- Analyze tables after creating indexes\n`
  const tables = Array.from(new Set(issues.map(i => i.table)))
  tables.forEach(table => {
    sql += `ANALYZE ${table};\n`
  })
  
  console.log(sql)
  
  return sql
}
