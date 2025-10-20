/**
 * Index Advisor
 * 
 * Analyzes queries and recommends missing indexes.
 * Helps optimize database performance automatically.
 */

import { QueryExecutor } from '../core/query-executor'

export interface IndexRecommendation {
  table: string
  columns: string[]
  reason: string
  estimatedSizeKB: number
  estimatedImprovementMs: number
  priority: 'high' | 'medium' | 'low'
  sql: string
  impact: string
}

export interface SlowQuery {
  fingerprint: string
  sql: string
  avgDuration: number
  calls: number
  totalDuration: number
  missingIndexes: string[]
}

export class IndexAdvisor {
  constructor(private queryExecutor: QueryExecutor) {}
  
  /**
   * Analyze a specific query and recommend indexes
   */
  async analyzeQuery(sql: string): Promise<IndexRecommendation[]> {
    const recommendations: IndexRecommendation[] = []
    
    // Get query plan
    const plan = await this.getQueryPlan(sql)
    
    // Find sequential scans
    const seqScans = this.findSequentialScans(plan)
    
    for (const scan of seqScans) {
      // Extract WHERE clause columns
      const columns = this.extractWhereColumns(sql, scan.table)
      
      if (columns.length > 0) {
        const rec = await this.createRecommendation(
          scan.table,
          columns,
          scan.rows,
          'Sequential scan detected - add index for faster lookups'
        )
        
        recommendations.push(rec)
      }
    }
    
    // Find sort operations
    const sorts = this.findSorts(plan)
    
    for (const sort of sorts) {
      const columns = this.extractOrderByColumns(sql)
      
      if (columns.length > 0) {
        const rec = await this.createRecommendation(
          sort.table,
          columns,
          sort.rows,
          'Sort operation detected - add index to avoid in-memory sorting'
        )
        
        recommendations.push(rec)
      }
    }
    
    // Find join operations
    const joins = this.findJoins(plan)
    
    for (const join of joins) {
      const columns = this.extractJoinColumns(sql)
      
      if (columns.length > 0) {
        const rec = await this.createRecommendation(
          join.table,
          columns,
          join.rows,
          'Join operation detected - add index on join columns'
        )
        
        recommendations.push(rec)
      }
    }
    
    return recommendations
  }
  
  /**
   * Analyze all slow queries and recommend indexes
   */
  async analyzeSlowQueries(minDurationMs: number = 100): Promise<{
    slowQueries: SlowQuery[]
    recommendations: IndexRecommendation[]
  }> {
    // Get slow queries from pg_stat_statements
    const slowQueries = await this.getSlowQueries(minDurationMs)
    
    const recommendations: IndexRecommendation[] = []
    
    // Analyze each slow query
    for (const query of slowQueries) {
      try {
        const recs = await this.analyzeQuery(query.sql)
        recommendations.push(...recs)
      } catch (error) {
        console.warn(`Failed to analyze query: ${error}`)
      }
    }
    
    // Deduplicate recommendations
    const dedupedRecs = this.deduplicateRecommendations(recommendations)
    
    return {
      slowQueries,
      recommendations: dedupedRecs
    }
  }
  
  /**
   * Get slow queries from pg_stat_statements
   */
  private async getSlowQueries(minDurationMs: number): Promise<SlowQuery[]> {
    try {
      const result = await this.queryExecutor.execute<{
        query: string
        calls: number
        mean_exec_time: number
        total_exec_time: number
      }>(
        `SELECT 
          query,
          calls,
          mean_exec_time,
          total_exec_time
        FROM pg_stat_statements
        WHERE mean_exec_time > $1
          AND query NOT LIKE '%pg_stat_statements%'
        ORDER BY mean_exec_time DESC
        LIMIT 20`,
        { params: [minDurationMs], readOnly: true }
      )
      
      return result.rows.map(row => ({
        fingerprint: this.generateFingerprint(row.query),
        sql: row.query,
        avgDuration: row.mean_exec_time,
        calls: row.calls,
        totalDuration: row.total_exec_time,
        missingIndexes: []
      }))
    } catch (error) {
      // pg_stat_statements might not be enabled
      console.warn('pg_stat_statements not available')
      return []
    }
  }
  
  /**
   * Generate query fingerprint (normalize query)
   */
  private generateFingerprint(sql: string): string {
    // Remove literals and normalize whitespace
    return sql
      .replace(/'\w+'/g, '?')
      .replace(/\d+/g, '?')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 100)
  }
  
  /**
   * Get query plan
   */
  private async getQueryPlan(sql: string): Promise<any> {
    const result = await this.queryExecutor.execute(
      `EXPLAIN (FORMAT JSON) ${sql}`,
      { readOnly: true }
    )
    
    return result.rows[0]['QUERY PLAN'][0]
  }
  
  /**
   * Find sequential scans in query plan
   */
  private findSequentialScans(plan: any, scans: Array<{ table: string; rows: number }> = []): Array<{ table: string; rows: number }> {
    const node = plan.Plan
    
    if (node['Node Type'] === 'Seq Scan') {
      scans.push({
        table: node['Relation Name'],
        rows: node['Plan Rows'] || 0
      })
    }
    
    if (node.Plans) {
      for (const childPlan of node.Plans) {
        this.findSequentialScans({ Plan: childPlan }, scans)
      }
    }
    
    return scans
  }
  
  /**
   * Find sort operations in query plan
   */
  private findSorts(plan: any, sorts: Array<{ table: string; rows: number }> = []): Array<{ table: string; rows: number }> {
    const node = plan.Plan
    
    if (node['Node Type'] === 'Sort') {
      // Try to find the table being sorted
      const table = this.findTableInNode(node)
      
      if (table) {
        sorts.push({
          table,
          rows: node['Plan Rows'] || 0
        })
      }
    }
    
    if (node.Plans) {
      for (const childPlan of node.Plans) {
        this.findSorts({ Plan: childPlan }, sorts)
      }
    }
    
    return sorts
  }
  
  /**
   * Find join operations in query plan
   */
  private findJoins(plan: any, joins: Array<{ table: string; rows: number }> = []): Array<{ table: string; rows: number }> {
    const node = plan.Plan
    
    if (node['Node Type'].includes('Join')) {
      const table = this.findTableInNode(node)
      
      if (table) {
        joins.push({
          table,
          rows: node['Plan Rows'] || 0
        })
      }
    }
    
    if (node.Plans) {
      for (const childPlan of node.Plans) {
        this.findJoins({ Plan: childPlan }, joins)
      }
    }
    
    return joins
  }
  
  /**
   * Find table name in plan node
   */
  private findTableInNode(node: any): string | null {
    if (node['Relation Name']) {
      return node['Relation Name']
    }
    
    if (node.Plans) {
      for (const childPlan of node.Plans) {
        const table = this.findTableInNode(childPlan)
        if (table) return table
      }
    }
    
    return null
  }
  
  /**
   * Extract columns from WHERE clause
   */
  private extractWhereColumns(sql: string, table: string): string[] {
    const columns: string[] = []
    
    // Simple regex to find WHERE clause columns
    const whereMatch = sql.match(/WHERE\s+(.+?)(?:ORDER BY|GROUP BY|LIMIT|$)/is)
    
    if (whereMatch) {
      const whereClause = whereMatch[1]
      
      // Find column references
      const columnMatches = whereClause.matchAll(/(?:^|\s)(\w+)\s*[=<>]/g)
      
      for (const match of columnMatches) {
        columns.push(match[1])
      }
    }
    
    return [...new Set(columns)] // Deduplicate
  }
  
  /**
   * Extract columns from ORDER BY clause
   */
  private extractOrderByColumns(sql: string): string[] {
    const columns: string[] = []
    
    const orderByMatch = sql.match(/ORDER BY\s+(.+?)(?:LIMIT|$)/is)
    
    if (orderByMatch) {
      const orderByClause = orderByMatch[1]
      
      // Split by comma and extract column names
      const parts = orderByClause.split(',')
      
      for (const part of parts) {
        const columnMatch = part.trim().match(/^(\w+)/)
        if (columnMatch) {
          columns.push(columnMatch[1])
        }
      }
    }
    
    return columns
  }
  
  /**
   * Extract columns from JOIN clause
   */
  private extractJoinColumns(sql: string): string[] {
    const columns: string[] = []
    
    const joinMatches = sql.matchAll(/JOIN\s+\w+\s+ON\s+(.+?)(?:WHERE|ORDER BY|GROUP BY|LIMIT|$)/gis)
    
    for (const match of joinMatches) {
      const joinCondition = match[1]
      
      // Find column references
      const columnMatches = joinCondition.matchAll(/(\w+)\.(\w+)/g)
      
      for (const colMatch of columnMatches) {
        columns.push(colMatch[2])
      }
    }
    
    return [...new Set(columns)]
  }
  
  /**
   * Create index recommendation
   */
  private async createRecommendation(
    table: string,
    columns: string[],
    rows: number,
    reason: string
  ): Promise<IndexRecommendation> {
    // Estimate index size (rough estimate)
    const estimatedSizeKB = Math.ceil((rows * columns.length * 8) / 1024)
    
    // Estimate improvement (rough estimate based on rows)
    const estimatedImprovementMs = rows > 10000 ? rows / 100 : rows / 10
    
    // Determine priority
    let priority: IndexRecommendation['priority']
    if (rows > 100000) {
      priority = 'high'
    } else if (rows > 10000) {
      priority = 'medium'
    } else {
      priority = 'low'
    }
    
    // Generate SQL
    const indexName = `idx_${table}_${columns.join('_')}`
    const sql = `CREATE INDEX ${indexName} ON ${table} (${columns.join(', ')})`
    
    // Impact description
    const impact = `Will speed up queries filtering/sorting by ${columns.join(', ')} on ${table}`
    
    return {
      table,
      columns,
      reason,
      estimatedSizeKB,
      estimatedImprovementMs,
      priority,
      sql,
      impact
    }
  }
  
  /**
   * Deduplicate recommendations
   */
  private deduplicateRecommendations(
    recommendations: IndexRecommendation[]
  ): IndexRecommendation[] {
    const seen = new Set<string>()
    const deduped: IndexRecommendation[] = []
    
    for (const rec of recommendations) {
      const key = `${rec.table}:${rec.columns.join(',')}`
      
      if (!seen.has(key)) {
        seen.add(key)
        deduped.push(rec)
      }
    }
    
    // Sort by priority
    return deduped.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })
  }
  
  /**
   * Check if index already exists
   */
  async indexExists(table: string, columns: string[]): Promise<boolean> {
    const result = await this.queryExecutor.execute<{ exists: boolean }>(
      `SELECT EXISTS(
        SELECT 1
        FROM pg_indexes
        WHERE tablename = $1
          AND indexdef LIKE $2
      ) as exists`,
      {
        params: [
          table,
          `%${columns.join('%')}%`
        ],
        readOnly: true
      }
    )
    
    return result.rows[0]?.exists || false
  }
  
  /**
   * Generate migration SQL for all recommendations
   */
  generateMigrationSQL(recommendations: IndexRecommendation[]): string {
    const lines: string[] = []
    
    lines.push('-- Index Recommendations')
    lines.push(`-- Generated: ${new Date().toISOString()}`)
    lines.push('')
    
    for (const rec of recommendations) {
      lines.push(`-- ${rec.reason}`)
      lines.push(`-- Priority: ${rec.priority.toUpperCase()}`)
      lines.push(`-- Impact: ${rec.impact}`)
      lines.push(`-- Estimated size: ${rec.estimatedSizeKB}KB`)
      lines.push(rec.sql + ';')
      lines.push('')
    }
    
    return lines.join('\n')
  }
}
