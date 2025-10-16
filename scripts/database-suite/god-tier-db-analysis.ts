#!/usr/bin/env tsx
/**
 * God-Tier Database Architecture Analysis
 * 
 * Comprehensive analysis of database architecture for:
 * - Future-proofing
 * - Scalability
 * - Observability
 * - Extension usage
 * - JSONB optimization
 * - Performance patterns
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

interface ArchitectureAnalysis {
  extensions: ExtensionAnalysis
  jsonbUsage: JsonbAnalysis
  indexes: IndexAnalysis
  constraints: ConstraintAnalysis
  triggers: TriggerAnalysis
  functions: FunctionAnalysis
  views: ViewAnalysis
  partitioning: PartitioningAnalysis
  replication: ReplicationAnalysis
  observability: ObservabilityAnalysis
  recommendations: Recommendation[]
  godTierScore: number
}

interface ExtensionAnalysis {
  installed: string[]
  available: string[]
  recommended: string[]
  missing: string[]
}

interface JsonbAnalysis {
  tables: Array<{
    table: string
    column: string
    hasIndex: boolean
    indexType: string | null
    sampleSize: number
    keysUsed: string[]
    recommendations: string[]
  }>
  totalJsonbColumns: number
  indexed: number
  unindexed: number
}

interface IndexAnalysis {
  total: number
  byType: Record<string, number>
  unused: string[]
  missing: string[]
  recommendations: string[]
}

interface ConstraintAnalysis {
  foreignKeys: number
  checkConstraints: number
  unique: number
  notNull: number
  missing: string[]
}

interface TriggerAnalysis {
  total: number
  byPurpose: Record<string, number>
  recommendations: string[]
}

interface FunctionAnalysis {
  total: number
  language: Record<string, number>
  recommendations: string[]
}

interface ViewAnalysis {
  total: number
  materialized: number
  recommendations: string[]
}

interface PartitioningAnalysis {
  tablesPartitioned: number
  candidates: string[]
  recommendations: string[]
}

interface ReplicationAnalysis {
  enabled: boolean
  publications: number
  subscriptions: number
  recommendations: string[]
}

interface ObservabilityAnalysis {
  loggingSetup: boolean
  metricsCollected: string[]
  tracingEnabled: boolean
  recommendations: string[]
}

interface Recommendation {
  category: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  title: string
  description: string
  implementation: string
  impact: string
}

async function analyzeExtensions(): Promise<ExtensionAnalysis> {
  console.log('\n🔌 Analyzing Extensions...')
  
  // Get installed extensions
  const { data: installed } = await supabase.rpc('exec_sql' as any, {
    query: 'SELECT extname FROM pg_extension WHERE extname NOT IN (\'plpgsql\') ORDER BY extname'
  })
  
  const installedNames = installed?.map((e: any) => e.extname) || []
  
  // Recommended extensions for production
  const recommended = [
    'pg_stat_statements', // Query performance tracking
    'pg_trgm',           // Fuzzy text search (already have)
    'postgis',           // Geospatial (already have)
    'uuid-ossp',         // UUID generation
    'pg_cron',           // Scheduled jobs
    'pgaudit',           // Audit logging
    'pg_partman',        // Partition management
    'timescaledb',       // Time-series optimization
    'pgroonga',          // Full-text search
    'pg_stat_monitor',   // Enhanced monitoring
  ]
  
  const missing = recommended.filter(ext => !installedNames.includes(ext))
  
  return {
    installed: installedNames,
    available: recommended,
    recommended,
    missing
  }
}

async function analyzeJsonbUsage(): Promise<JsonbAnalysis> {
  console.log('\n📦 Analyzing JSONB Usage...')
  
  // Find all JSONB columns
  const { data: jsonbCols } = await supabase.rpc('exec_sql' as any, {
    query: `
      SELECT 
        table_name,
        column_name
      FROM information_schema.columns
      WHERE table_schema = 'public' 
        AND data_type = 'jsonb'
      ORDER BY table_name, column_name
    `
  })
  
  const tables: any[] = []
  
  for (const col of jsonbCols || []) {
    // Check if there's an index on this JSONB column
    const { data: indexes } = await supabase.rpc('exec_sql' as any, {
      query: `
        SELECT 
          indexname,
          indexdef
        FROM pg_indexes
        WHERE tablename = '${col.table_name}'
          AND indexdef ILIKE '%${col.column_name}%'
      `
    })
    
    const hasIndex = indexes && indexes.length > 0
    const indexType = hasIndex ? (
      indexes[0].indexdef.includes('gin') ? 'GIN' :
      indexes[0].indexdef.includes('gist') ? 'GIST' :
      'B-tree'
    ) : null
    
    // Sample the data to see what keys are commonly used
    const { data: sample } = await supabase
      .from(col.table_name as any)
      .select(col.column_name)
      .limit(100)
    
    const keysUsed = new Set<string>()
    if (sample) {
      for (const row of sample) {
        const json = row[col.column_name]
        if (json && typeof json === 'object') {
          Object.keys(json).forEach(key => keysUsed.add(key))
        }
      }
    }
    
    const recommendations: string[] = []
    if (!hasIndex && keysUsed.size > 0) {
      recommendations.push(`Add GIN index for ${col.column_name} queries`)
    }
    if (keysUsed.size > 20) {
      recommendations.push(`Consider normalizing - ${keysUsed.size} keys in JSONB`)
    }
    
    tables.push({
      table: col.table_name,
      column: col.column_name,
      hasIndex,
      indexType,
      sampleSize: sample?.length || 0,
      keysUsed: Array.from(keysUsed),
      recommendations
    })
  }
  
  return {
    tables,
    totalJsonbColumns: tables.length,
    indexed: tables.filter(t => t.hasIndex).length,
    unindexed: tables.filter(t => !t.hasIndex).length
  }
}

async function analyzeIndexes(): Promise<IndexAnalysis> {
  console.log('\n📊 Analyzing Indexes...')
  
  const { data: indexes } = await supabase.rpc('exec_sql' as any, {
    query: `
      SELECT 
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname
    `
  })
  
  const byType: Record<string, number> = {
    'B-tree': 0,
    'GIN': 0,
    'GIST': 0,
    'Hash': 0,
    'Other': 0
  }
  
  for (const idx of indexes || []) {
    if (idx.indexdef.includes(' gin ')) byType['GIN']++
    else if (idx.indexdef.includes(' gist ')) byType['GIST']++
    else if (idx.indexdef.includes(' hash ')) byType['Hash']++
    else if (idx.indexdef.includes(' btree ')) byType['B-tree']++
    else byType['Other']++
  }
  
  // Check for unused indexes (this requires pg_stat_statements)
  const unused: string[] = []
  const missing: string[] = []
  
  // Recommendations based on common patterns
  const recommendations = [
    'Consider partial indexes for soft-deleted records',
    'Add covering indexes for frequently queried column combinations',
    'Monitor index bloat with pg_stat_user_indexes',
  ]
  
  return {
    total: indexes?.length || 0,
    byType,
    unused,
    missing,
    recommendations
  }
}

async function analyzeConstraints(): Promise<ConstraintAnalysis> {
  console.log('\n🔒 Analyzing Constraints...')
  
  const { data: fks } = await supabase.rpc('exec_sql' as any, {
    query: `
      SELECT COUNT(*) as count
      FROM information_schema.table_constraints
      WHERE constraint_schema = 'public'
        AND constraint_type = 'FOREIGN KEY'
    `
  })
  
  const { data: checks } = await supabase.rpc('exec_sql' as any, {
    query: `
      SELECT COUNT(*) as count
      FROM information_schema.table_constraints
      WHERE constraint_schema = 'public'
        AND constraint_type = 'CHECK'
    `
  })
  
  const { data: uniques } = await supabase.rpc('exec_sql' as any, {
    query: `
      SELECT COUNT(*) as count
      FROM information_schema.table_constraints
      WHERE constraint_schema = 'public'
        AND constraint_type = 'UNIQUE'
    `
  })
  
  return {
    foreignKeys: fks?.[0]?.count || 0,
    checkConstraints: checks?.[0]?.count || 0,
    unique: uniques?.[0]?.count || 0,
    notNull: 0, // Would need column analysis
    missing: []
  }
}

async function analyzeTriggers(): Promise<TriggerAnalysis> {
  console.log('\n⚡ Analyzing Triggers...')
  
  const { data: triggers } = await supabase.rpc('exec_sql' as any, {
    query: `
      SELECT 
        trigger_name,
        event_manipulation,
        event_object_table,
        action_timing
      FROM information_schema.triggers
      WHERE trigger_schema = 'public'
      ORDER BY event_object_table, trigger_name
    `
  })
  
  const byPurpose: Record<string, number> = {
    'updated_at': 0,
    'audit': 0,
    'validation': 0,
    'computed': 0,
    'other': 0
  }
  
  for (const trigger of triggers || []) {
    if (trigger.trigger_name.includes('updated_at') || trigger.trigger_name.includes('timestamp')) {
      byPurpose['updated_at']++
    } else if (trigger.trigger_name.includes('audit') || trigger.trigger_name.includes('log')) {
      byPurpose['audit']++
    } else {
      byPurpose['other']++
    }
  }
  
  return {
    total: triggers?.length || 0,
    byPurpose,
    recommendations: [
      'Add updated_at triggers for audit tables',
      'Consider audit triggers for sensitive data changes',
    ]
  }
}

async function analyzeFunctions(): Promise<FunctionAnalysis> {
  console.log('\n⚙️  Analyzing Functions...')
  
  const { data: functions } = await supabase.rpc('exec_sql' as any, {
    query: `
      SELECT 
        proname as name,
        prolang::regproc as language
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public'
      ORDER BY proname
    `
  })
  
  const language: Record<string, number> = {}
  
  for (const func of functions || []) {
    const lang = func.language || 'unknown'
    language[lang] = (language[lang] || 0) + 1
  }
  
  return {
    total: functions?.length || 0,
    language,
    recommendations: [
      'Create helper functions for complex queries',
      'Add functions for data validation',
    ]
  }
}

async function analyzeViews(): Promise<ViewAnalysis> {
  console.log('\n👁️  Analyzing Views...')
  
  const { data: views } = await supabase.rpc('exec_sql' as any, {
    query: `
      SELECT 
        table_name,
        'view' as type
      FROM information_schema.views
      WHERE table_schema = 'public'
      UNION
      SELECT 
        matviewname as table_name,
        'materialized' as type
      FROM pg_matviews
      WHERE schemaname = 'public'
    `
  })
  
  const materialized = views?.filter((v: any) => v.type === 'materialized').length || 0
  
  return {
    total: views?.length || 0,
    materialized,
    recommendations: [
      'Consider materialized views for expensive aggregations',
      'Add refresh strategies for materialized views',
    ]
  }
}

async function analyzePartitioning(): Promise<PartitioningAnalysis> {
  console.log('\n🗂️  Analyzing Partitioning...')
  
  const { data: partitions } = await supabase.rpc('exec_sql' as any, {
    query: `
      SELECT 
        schemaname,
        tablename
      FROM pg_tables
      WHERE schemaname = 'public'
        AND tablename LIKE '%_p%'
    `
  })
  
  // Analyze which tables would benefit from partitioning
  const { data: largeTables } = await supabase.rpc('exec_sql' as any, {
    query: `
      SELECT 
        relname as table_name,
        n_live_tup as row_count
      FROM pg_stat_user_tables
      WHERE schemaname = 'public'
      ORDER BY n_live_tup DESC
      LIMIT 10
    `
  })
  
  const candidates = largeTables
    ?.filter((t: any) => t.row_count > 100000)
    .map((t: any) => t.table_name) || []
  
  return {
    tablesPartitioned: partitions?.length || 0,
    candidates,
    recommendations: candidates.length > 0 ? [
      `Consider partitioning: ${candidates.join(', ')}`
    ] : []
  }
}

async function analyzeReplication(): Promise<ReplicationAnalysis> {
  console.log('\n🔄 Analyzing Replication...')
  
  // Supabase handles this at infrastructure level
  return {
    enabled: true, // Supabase provides this
    publications: 0,
    subscriptions: 0,
    recommendations: [
      'Leverage Supabase Realtime for live updates',
      'Consider read replicas for heavy read workloads',
    ]
  }
}

async function analyzeObservability(): Promise<ObservabilityAnalysis> {
  console.log('\n📡 Analyzing Observability...')
  
  // Check if logs table exists
  const { data: tables } = await supabase.rpc('exec_sql' as any, {
    query: `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'logs'
    `
  })
  
  const loggingSetup = tables && tables.length > 0
  
  const metricsCollected: string[] = []
  if (loggingSetup) metricsCollected.push('Application logs')
  
  return {
    loggingSetup,
    metricsCollected,
    tracingEnabled: false,
    recommendations: [
      'Implement query performance tracking with pg_stat_statements',
      'Add custom metrics tracking table',
      'Set up alerts for slow queries',
      'Track RLS policy performance',
    ]
  }
}

function calculateGodTierScore(analysis: Partial<ArchitectureAnalysis>): number {
  let score = 0
  let maxScore = 0
  
  // Extensions (20 points)
  maxScore += 20
  if (analysis.extensions) {
    score += (analysis.extensions.installed.length / analysis.extensions.recommended.length) * 20
  }
  
  // JSONB optimization (15 points)
  maxScore += 15
  if (analysis.jsonbUsage) {
    const indexRatio = analysis.jsonbUsage.indexed / Math.max(analysis.jsonbUsage.totalJsonbColumns, 1)
    score += indexRatio * 15
  }
  
  // Indexes (15 points)
  maxScore += 15
  if (analysis.indexes) {
    score += Math.min(analysis.indexes.total / 30, 1) * 15
  }
  
  // Constraints (10 points)
  maxScore += 10
  if (analysis.constraints) {
    score += Math.min(analysis.constraints.foreignKeys / 20, 1) * 10
  }
  
  // Observability (20 points)
  maxScore += 20
  if (analysis.observability) {
    score += analysis.observability.loggingSetup ? 10 : 0
    score += analysis.observability.metricsCollected.length * 2
  }
  
  // Views & Functions (10 points)
  maxScore += 10
  if (analysis.views && analysis.functions) {
    score += Math.min(analysis.views.total / 5, 1) * 5
    score += Math.min(analysis.functions.total / 10, 1) * 5
  }
  
  // Triggers (5 points)
  maxScore += 5
  if (analysis.triggers) {
    score += Math.min(analysis.triggers.total / 10, 1) * 5
  }
  
  // Partitioning (5 points)
  maxScore += 5
  if (analysis.partitioning) {
    score += analysis.partitioning.tablesPartitioned > 0 ? 5 : 0
  }
  
  return Math.round((score / maxScore) * 100)
}

async function generateRecommendations(analysis: Partial<ArchitectureAnalysis>): Promise<Recommendation[]> {
  const recommendations: Recommendation[] = []
  
  // Extension recommendations
  if (analysis.extensions && analysis.extensions.missing.length > 0) {
    recommendations.push({
      category: 'Extensions',
      priority: 'high',
      title: 'Enable Critical Supabase Extensions',
      description: `${analysis.extensions.missing.length} recommended extensions are not enabled`,
      implementation: `Enable: ${analysis.extensions.missing.slice(0, 3).join(', ')}`,
      impact: 'Unlock advanced features like cron jobs, better monitoring, and audit logging'
    })
  }
  
  // JSONB recommendations
  if (analysis.jsonbUsage && analysis.jsonbUsage.unindexed > 0) {
    recommendations.push({
      category: 'JSONB Optimization',
      priority: 'medium',
      title: 'Add GIN Indexes to JSONB Columns',
      description: `${analysis.jsonbUsage.unindexed} JSONB columns lack indexes`,
      implementation: 'CREATE INDEX idx_[table]_[column] ON [table] USING gin([column])',
      impact: '10-100x faster JSONB queries'
    })
  }
  
  // Observability recommendations
  if (analysis.observability && !analysis.observability.tracingEnabled) {
    recommendations.push({
      category: 'Observability',
      priority: 'high',
      title: 'Implement Query Performance Tracking',
      description: 'No query performance monitoring detected',
      implementation: 'Enable pg_stat_statements extension and create metrics dashboard',
      impact: 'Identify slow queries and optimization opportunities'
    })
  }
  
  // Partitioning recommendations
  if (analysis.partitioning && analysis.partitioning.candidates.length > 0) {
    recommendations.push({
      category: 'Scalability',
      priority: 'medium',
      title: 'Consider Table Partitioning',
      description: `${analysis.partitioning.candidates.length} tables are large enough to benefit from partitioning`,
      implementation: 'Partition by date for time-series data (vehicle_events, logs)',
      impact: 'Improved query performance and easier data archival'
    })
  }
  
  return recommendations
}

async function main() {
  console.log('🏆 GOD-TIER DATABASE ARCHITECTURE ANALYSIS\n')
  console.log(`📍 Database: ${process.env.NEXT_PUBLIC_SUPABASE_URL}\n`)
  
  const analysis: Partial<ArchitectureAnalysis> = {}
  
  try {
    analysis.extensions = await analyzeExtensions()
    analysis.jsonbUsage = await analyzeJsonbUsage()
    analysis.indexes = await analyzeIndexes()
    analysis.constraints = await analyzeConstraints()
    analysis.triggers = await analyzeTriggers()
    analysis.functions = await analyzeFunctions()
    analysis.views = await analyzeViews()
    analysis.partitioning = await analyzePartitioning()
    analysis.replication = await analyzeReplication()
    analysis.observability = await analyzeObservability()
    
    analysis.recommendations = await generateRecommendations(analysis)
    analysis.godTierScore = calculateGodTierScore(analysis)
    
    // Generate report
    const report = generateReport(analysis as ArchitectureAnalysis)
    
    // Save report
    const outputPath = path.join(process.cwd(), 'docs', 'GOD_TIER_DATABASE_ANALYSIS.md')
    fs.writeFileSync(outputPath, report, 'utf-8')
    
    console.log(`\n✅ Analysis complete!`)
    console.log(`📄 Report saved to: ${outputPath}`)
    console.log(`\n🏆 GOD-TIER SCORE: ${analysis.godTierScore}/100`)
    
    if (analysis.godTierScore >= 90) {
      console.log('   Status: 🏆 GOD-TIER ARCHITECTURE')
    } else if (analysis.godTierScore >= 75) {
      console.log('   Status: ⭐ ELITE-TIER ARCHITECTURE')
    } else if (analysis.godTierScore >= 60) {
      console.log('   Status: ✅ PRODUCTION-READY')
    } else {
      console.log('   Status: ⚠️  NEEDS OPTIMIZATION')
    }
    
  } catch (error) {
    console.error('❌ Analysis failed:', error)
    process.exit(1)
  }
}

function generateReport(analysis: ArchitectureAnalysis): string {
  let report = '# 🏆 GOD-TIER DATABASE ARCHITECTURE ANALYSIS\n\n'
  report += `**Generated:** ${new Date().toISOString()}\n\n`
  report += `**God-Tier Score:** ${analysis.godTierScore}/100\n\n`
  
  if (analysis.godTierScore >= 90) {
    report += '**Status:** 🏆 **GOD-TIER ARCHITECTURE**\n\n'
  } else if (analysis.godTierScore >= 75) {
    report += '**Status:** ⭐ **ELITE-TIER ARCHITECTURE**\n\n'
  } else if (analysis.godTierScore >= 60) {
    report += '**Status:** ✅ **PRODUCTION-READY**\n\n'
  } else {
    report += '**Status:** ⚠️  **NEEDS OPTIMIZATION**\n\n'
  }
  
  report += '---\n\n'
  
  // Extensions
  report += '## 🔌 EXTENSIONS\n\n'
  report += `**Installed:** ${analysis.extensions.installed.length}/${analysis.extensions.recommended.length}\n\n`
  report += '**Currently Installed:**\n'
  analysis.extensions.installed.forEach(ext => {
    report += `- ✅ ${ext}\n`
  })
  report += '\n**Missing (Recommended):**\n'
  analysis.extensions.missing.forEach(ext => {
    report += `- ⚠️  ${ext}\n`
  })
  report += '\n---\n\n'
  
  // JSONB
  report += '## 📦 JSONB USAGE\n\n'
  report += `**Total JSONB Columns:** ${analysis.jsonbUsage.totalJsonbColumns}\n`
  report += `**Indexed:** ${analysis.jsonbUsage.indexed}\n`
  report += `**Unindexed:** ${analysis.jsonbUsage.unindexed}\n\n`
  
  if (analysis.jsonbUsage.tables.length > 0) {
    report += '**Details:**\n\n'
    analysis.jsonbUsage.tables.forEach(t => {
      report += `### \`${t.table}.${t.column}\`\n`
      report += `- **Indexed:** ${t.hasIndex ? '✅ Yes' : '❌ No'} ${t.indexType ? `(${t.indexType})` : ''}\n`
      report += `- **Keys Used:** ${t.keysUsed.length} keys\n`
      if (t.recommendations.length > 0) {
        report += `- **Recommendations:** ${t.recommendations.join(', ')}\n`
      }
      report += '\n'
    })
  }
  
  report += '---\n\n'
  
  // Indexes
  report += '## 📊 INDEXES\n\n'
  report += `**Total Indexes:** ${analysis.indexes.total}\n\n`
  report += '**By Type:**\n'
  Object.entries(analysis.indexes.byType).forEach(([type, count]) => {
    report += `- ${type}: ${count}\n`
  })
  report += '\n---\n\n'
  
  // Observability
  report += '## 📡 OBSERVABILITY\n\n'
  report += `**Logging:** ${analysis.observability.loggingSetup ? '✅ Enabled' : '❌ Not Setup'}\n`
  report += `**Tracing:** ${analysis.observability.tracingEnabled ? '✅ Enabled' : '❌ Not Setup'}\n`
  report += `**Metrics:** ${analysis.observability.metricsCollected.length} types collected\n\n`
  
  report += '---\n\n'
  
  // Recommendations
  report += '## 🎯 RECOMMENDATIONS\n\n'
  
  const byPriority = {
    critical: analysis.recommendations.filter(r => r.priority === 'critical'),
    high: analysis.recommendations.filter(r => r.priority === 'high'),
    medium: analysis.recommendations.filter(r => r.priority === 'medium'),
    low: analysis.recommendations.filter(r => r.priority === 'low'),
  }
  
  if (byPriority.critical.length > 0) {
    report += '### 🚨 CRITICAL\n\n'
    byPriority.critical.forEach(r => {
      report += `#### ${r.title}\n`
      report += `**Category:** ${r.category}\n\n`
      report += `${r.description}\n\n`
      report += `**Implementation:** ${r.implementation}\n\n`
      report += `**Impact:** ${r.impact}\n\n`
    })
  }
  
  if (byPriority.high.length > 0) {
    report += '### ⚠️  HIGH PRIORITY\n\n'
    byPriority.high.forEach(r => {
      report += `#### ${r.title}\n`
      report += `${r.description}\n\n`
      report += `**Impact:** ${r.impact}\n\n`
    })
  }
  
  if (byPriority.medium.length > 0) {
    report += '### 🟡 MEDIUM PRIORITY\n\n'
    byPriority.medium.forEach(r => {
      report += `- **${r.title}**: ${r.description}\n`
    })
    report += '\n'
  }
  
  return report
}

main()
