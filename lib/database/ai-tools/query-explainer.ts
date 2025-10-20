/**
 * Query Explainer
 * 
 * Explains SQL queries and query plans in plain English.
 * Helps understand what queries do and how they perform.
 */

import { QueryExecutor } from '../core/query-executor'

export interface QueryExplanation {
  summary: string
  steps: ExplanationStep[]
  performance: PerformanceAnalysis
  recommendations: string[]
}

export interface ExplanationStep {
  step: number
  operation: string
  description: string
  cost: number
  rows: number
}

export interface PerformanceAnalysis {
  totalCost: number
  executionTime?: number
  planningTime?: number
  indexUsage: string[]
  bottlenecks: string[]
  rating: 'excellent' | 'good' | 'fair' | 'poor'
}

export class QueryExplainer {
  constructor(private queryExecutor: QueryExecutor) {}
  
  /**
   * Explain a SQL query in plain English
   */
  async explain(sql: string): Promise<QueryExplanation> {
    // Get query plan
    const plan = await this.getQueryPlan(sql)
    
    // Parse plan into steps
    const steps = this.parsePlan(plan)
    
    // Analyze performance
    const performance = this.analyzePerformance(plan, steps)
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(plan, steps, performance)
    
    // Create summary
    const summary = this.generateSummary(sql, steps, performance)
    
    return {
      summary,
      steps,
      performance,
      recommendations
    }
  }
  
  /**
   * Get EXPLAIN plan from database
   */
  private async getQueryPlan(sql: string): Promise<any> {
    const result = await this.queryExecutor.execute(
      `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${sql}`,
      { readOnly: true }
    )
    
    return result.rows[0]['QUERY PLAN'][0]
  }
  
  /**
   * Parse query plan into explanation steps
   */
  private parsePlan(plan: any, step: number = 1, depth: number = 0): ExplanationStep[] {
    const steps: ExplanationStep[] = []
    
    const node = plan.Plan
    const nodeType = node['Node Type']
    const rows = node['Actual Rows'] || node['Plan Rows'] || 0
    const cost = node['Total Cost'] || 0
    
    // Generate description based on node type
    const description = this.describeNode(node, depth)
    
    steps.push({
      step,
      operation: nodeType,
      description,
      cost,
      rows
    })
    
    // Recursively process child nodes
    if (node.Plans) {
      let childStep = step + 1
      for (const childPlan of node.Plans) {
        const childSteps = this.parsePlan({ Plan: childPlan }, childStep, depth + 1)
        steps.push(...childSteps)
        childStep += childSteps.length
      }
    }
    
    return steps
  }
  
  /**
   * Describe a plan node in plain English
   */
  private describeNode(node: any, depth: number): string {
    const type = node['Node Type']
    const relation = node['Relation Name']
    const indexName = node['Index Name']
    const rows = node['Actual Rows'] || node['Plan Rows'] || 0
    
    const indent = '  '.repeat(depth)
    
    switch (type) {
      case 'Seq Scan':
        return `${indent}Scanning all rows in ${relation} (${rows} rows) - Consider adding an index`
      
      case 'Index Scan':
        return `${indent}Using index ${indexName} on ${relation} to find ${rows} rows efficiently`
      
      case 'Index Only Scan':
        return `${indent}Using index ${indexName} on ${relation} without accessing table (${rows} rows) - Very efficient!`
      
      case 'Bitmap Index Scan':
        return `${indent}Building bitmap from index ${indexName} for ${rows} rows`
      
      case 'Bitmap Heap Scan':
        return `${indent}Fetching ${rows} rows from ${relation} using bitmap`
      
      case 'Nested Loop':
        return `${indent}Joining tables by checking each combination (${rows} rows)`
      
      case 'Hash Join':
        return `${indent}Joining tables using hash table (${rows} rows) - Efficient for large datasets`
      
      case 'Merge Join':
        return `${indent}Joining pre-sorted tables (${rows} rows) - Very efficient`
      
      case 'Sort':
        return `${indent}Sorting ${rows} rows - Memory intensive`
      
      case 'Aggregate':
        return `${indent}Computing aggregate functions on ${rows} rows`
      
      case 'Limit':
        return `${indent}Limiting results to ${rows} rows`
      
      default:
        return `${indent}${type} operation on ${rows} rows`
    }
  }
  
  /**
   * Analyze query performance
   */
  private analyzePerformance(
    plan: any,
    steps: ExplanationStep[]
  ): PerformanceAnalysis {
    const node = plan.Plan
    const totalCost = node['Total Cost'] || 0
    const executionTime = plan['Execution Time']
    const planningTime = plan['Planning Time']
    
    // Find index usage
    const indexUsage = steps
      .filter(s => s.operation.includes('Index'))
      .map(s => s.description)
    
    // Find bottlenecks (high cost steps)
    const bottlenecks = steps
      .filter(s => s.cost > totalCost * 0.3) // Steps using >30% of total cost
      .map(s => `${s.operation}: ${s.description}`)
    
    // Add Seq Scan bottlenecks
    const seqScans = steps.filter(s => s.operation === 'Seq Scan')
    if (seqScans.length > 0) {
      bottlenecks.push(...seqScans.map(s => s.description))
    }
    
    // Rate performance
    let rating: PerformanceAnalysis['rating']
    if (executionTime < 10) {
      rating = 'excellent'
    } else if (executionTime < 100) {
      rating = 'good'
    } else if (executionTime < 1000) {
      rating = 'fair'
    } else {
      rating = 'poor'
    }
    
    return {
      totalCost,
      executionTime,
      planningTime,
      indexUsage,
      bottlenecks,
      rating
    }
  }
  
  /**
   * Generate optimization recommendations
   */
  private generateRecommendations(
    plan: any,
    steps: ExplanationStep[],
    performance: PerformanceAnalysis
  ): string[] {
    const recommendations: string[] = []
    
    // Check for sequential scans
    const seqScans = steps.filter(s => s.operation === 'Seq Scan')
    if (seqScans.length > 0) {
      recommendations.push(
        `Add indexes to avoid sequential scans: ${seqScans.map(s => s.description).join(', ')}`
      )
    }
    
    // Check for sorts
    const sorts = steps.filter(s => s.operation === 'Sort')
    if (sorts.length > 0) {
      recommendations.push(
        `Consider adding indexes on sorted columns to avoid in-memory sorting`
      )
    }
    
    // Check for nested loops with many rows
    const nestedLoops = steps.filter(s => s.operation === 'Nested Loop' && s.rows > 1000)
    if (nestedLoops.length > 0) {
      recommendations.push(
        `Nested loop joins with many rows detected - consider hash join instead`
      )
    }
    
    // Check execution time
    if (performance.executionTime && performance.executionTime > 1000) {
      recommendations.push(
        `Query is slow (${performance.executionTime.toFixed(0)}ms) - review bottlenecks and add indexes`
      )
    }
    
    // Check planning time
    if (performance.planningTime && performance.planningTime > 100) {
      recommendations.push(
        `High planning time (${performance.planningTime.toFixed(0)}ms) - consider prepared statements`
      )
    }
    
    // If no recommendations, query is good
    if (recommendations.length === 0) {
      recommendations.push('Query is well-optimized! ✅')
    }
    
    return recommendations
  }
  
  /**
   * Generate summary of query execution
   */
  private generateSummary(
    sql: string,
    steps: ExplanationStep[],
    performance: PerformanceAnalysis
  ): string {
    const lines: string[] = []
    
    // What the query does
    if (sql.trim().toUpperCase().startsWith('SELECT')) {
      lines.push('This query retrieves data from the database.')
    } else if (sql.trim().toUpperCase().startsWith('INSERT')) {
      lines.push('This query inserts data into the database.')
    } else if (sql.trim().toUpperCase().startsWith('UPDATE')) {
      lines.push('This query updates data in the database.')
    } else if (sql.trim().toUpperCase().startsWith('DELETE')) {
      lines.push('This query deletes data from the database.')
    }
    
    // Performance rating
    const ratingEmoji = {
      excellent: '🚀',
      good: '✅',
      fair: '⚠️',
      poor: '🐌'
    }
    
    lines.push(
      `Performance: ${ratingEmoji[performance.rating]} ${performance.rating.toUpperCase()}`
    )
    
    // Execution details
    if (performance.executionTime) {
      lines.push(
        `Execution time: ${performance.executionTime.toFixed(2)}ms`
      )
    }
    
    if (performance.planningTime) {
      lines.push(
        `Planning time: ${performance.planningTime.toFixed(2)}ms`
      )
    }
    
    // Index usage
    if (performance.indexUsage.length > 0) {
      lines.push(`Uses ${performance.indexUsage.length} index(es) efficiently`)
    } else {
      lines.push('⚠️  No indexes used - may be slow on large tables')
    }
    
    return lines.join(' • ')
  }
  
  /**
   * Compare two queries
   */
  async compare(sql1: string, sql2: string): Promise<{
    query1: QueryExplanation
    query2: QueryExplanation
    winner: 'query1' | 'query2' | 'tie'
    comparison: string
  }> {
    const [explanation1, explanation2] = await Promise.all([
      this.explain(sql1),
      this.explain(sql2)
    ])
    
    // Determine winner based on execution time
    let winner: 'query1' | 'query2' | 'tie'
    const time1 = explanation1.performance.executionTime || Infinity
    const time2 = explanation2.performance.executionTime || Infinity
    
    if (Math.abs(time1 - time2) < 5) {
      winner = 'tie'
    } else if (time1 < time2) {
      winner = 'query1'
    } else {
      winner = 'query2'
    }
    
    // Generate comparison
    const comparison = `Query 1: ${time1.toFixed(2)}ms (${explanation1.performance.rating}) vs Query 2: ${time2.toFixed(2)}ms (${explanation2.performance.rating})`
    
    return {
      query1: explanation1,
      query2: explanation2,
      winner,
      comparison
    }
  }
}
