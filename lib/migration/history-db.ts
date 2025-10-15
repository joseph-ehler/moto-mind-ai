/**
 * Migration History Database
 * 
 * Provides structured access to migration history for learning and analysis.
 */

import * as fs from 'fs'
import * as path from 'path'

export interface MigrationRecord {
  feature: string
  sessionId: string
  
  // Timing
  startTime: Date
  endTime: Date
  actualDuration: number // minutes
  estimatedDuration: string
  variance: number
  
  // Quality
  testsAdded: number
  componentsMigrated: number
  violationsChanged: number
  buildPassing: boolean
  allTestsPassing: boolean
  
  // Progress
  phases: {
    tests?: number
    components?: number
    domain?: number
    validation?: number
  }
  totalCommits: number
  
  // Metadata
  complexity: string
  similarTo: string
  
  // Issues (optional)
  issuesEncountered?: Array<{
    type: string
    description: string
    phase: string
    resolution: string
  }>
}

export class MigrationHistory {
  private historyPath: string
  private records: MigrationRecord[]
  
  constructor() {
    this.historyPath = path.join(process.cwd(), 'data', 'migration-history.json')
    this.records = this.load()
  }
  
  private load(): MigrationRecord[] {
    if (!fs.existsSync(this.historyPath)) {
      return []
    }
    
    try {
      const data = JSON.parse(fs.readFileSync(this.historyPath, 'utf-8'))
      // Convert date strings back to Date objects
      return data.map((r: any) => ({
        ...r,
        startTime: new Date(r.startTime),
        endTime: new Date(r.endTime)
      }))
    } catch {
      return []
    }
  }
  
  private save() {
    const dataDir = path.dirname(this.historyPath)
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
    }
    
    fs.writeFileSync(this.historyPath, JSON.stringify(this.records, null, 2))
  }
  
  /**
   * Add a new migration record
   */
  add(record: MigrationRecord): void {
    this.records.push(record)
    this.save()
  }
  
  /**
   * Get all records
   */
  getAll(): MigrationRecord[] {
    return [...this.records]
  }
  
  /**
   * Get record by feature name
   */
  getByFeature(feature: string): MigrationRecord | undefined {
    return this.records.find(r => r.feature === feature)
  }
  
  /**
   * Find migrations similar to given parameters
   */
  findSimilar(params: {
    complexity?: string
    componentCount?: number
    componentTolerance?: number
  }): MigrationRecord[] {
    let results = this.records
    
    if (params.complexity) {
      results = results.filter(r => r.complexity === params.complexity)
    }
    
    if (params.componentCount !== undefined) {
      const tolerance = params.componentTolerance || 10
      results = results.filter(r => 
        Math.abs(r.componentsMigrated - params.componentCount) <= tolerance
      )
    }
    
    return results
  }
  
  /**
   * Get all successful migrations (build + tests passing)
   */
  getSuccessful(): MigrationRecord[] {
    return this.records.filter(r => r.buildPassing && r.allTestsPassing)
  }
  
  /**
   * Get migrations by complexity level
   */
  getByComplexity(complexity: string): MigrationRecord[] {
    return this.records.filter(r => r.complexity === complexity)
  }
  
  /**
   * Calculate average duration by complexity
   */
  getAverageDuration(complexity?: string): number {
    const records = complexity 
      ? this.getByComplexity(complexity)
      : this.records
    
    if (records.length === 0) return 0
    
    const total = records.reduce((sum, r) => sum + r.actualDuration, 0)
    return total / records.length
  }
  
  /**
   * Calculate standard deviation of duration
   */
  getStdDevDuration(complexity?: string): number {
    const records = complexity 
      ? this.getByComplexity(complexity)
      : this.records
    
    if (records.length === 0) return 0
    
    const avg = this.getAverageDuration(complexity)
    const squaredDiffs = records.map(r => Math.pow(r.actualDuration - avg, 2))
    const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / records.length
    
    return Math.sqrt(variance)
  }
  
  /**
   * Get accuracy metrics for predictions
   */
  getAccuracyMetrics(): {
    timePredictionError: number // average absolute error in minutes
    complexityAccuracy: number // not applicable yet, returns 1
    count: number
  } {
    if (this.records.length === 0) {
      return { timePredictionError: 0, complexityAccuracy: 1, count: 0 }
    }
    
    const errors = this.records.map(r => Math.abs(r.variance))
    const avgError = errors.reduce((sum, e) => sum + e, 0) / errors.length
    
    return {
      timePredictionError: avgError,
      complexityAccuracy: 1, // We'd need predicted vs actual complexity for this
      count: this.records.length
    }
  }
  
  /**
   * Get most common issues across all migrations
   */
  getCommonIssues(): Array<{
    type: string
    frequency: number
    count: number
    resolutions: string[]
  }> {
    const allIssues = this.records.flatMap(r => r.issuesEncountered || [])
    
    if (allIssues.length === 0) return []
    
    // Group by type
    const grouped = allIssues.reduce((acc, issue) => {
      const type = issue.type || 'unknown'
      if (!acc[type]) {
        acc[type] = {
          count: 0,
          resolutions: new Set<string>()
        }
      }
      acc[type].count++
      if (issue.resolution) {
        acc[type].resolutions.add(issue.resolution)
      }
      return acc
    }, {} as Record<string, { count: number; resolutions: Set<string> }>)
    
    // Convert to array
    return Object.entries(grouped)
      .map(([type, data]) => ({
        type,
        count: data.count,
        frequency: data.count / this.records.length,
        resolutions: Array.from(data.resolutions)
      }))
      .sort((a, b) => b.count - a.count)
  }
  
  /**
   * Get statistics summary
   */
  getStats(): {
    totalMigrations: number
    successRate: number
    averageDuration: number
    totalTestsAdded: number
    totalComponentsMigrated: number
    byComplexity: {
      low: { count: number; avgDuration: number }
      medium: { count: number; avgDuration: number }
      high: { count: number; avgDuration: number }
    }
  } {
    const successful = this.getSuccessful()
    
    return {
      totalMigrations: this.records.length,
      successRate: this.records.length > 0 ? successful.length / this.records.length : 0,
      averageDuration: this.getAverageDuration(),
      totalTestsAdded: this.records.reduce((sum, r) => sum + r.testsAdded, 0),
      totalComponentsMigrated: this.records.reduce((sum, r) => sum + r.componentsMigrated, 0),
      byComplexity: {
        low: {
          count: this.getByComplexity('low').length,
          avgDuration: this.getAverageDuration('low')
        },
        medium: {
          count: this.getByComplexity('medium').length,
          avgDuration: this.getAverageDuration('medium')
        },
        high: {
          count: this.getByComplexity('high').length,
          avgDuration: this.getAverageDuration('high')
        }
      }
    }
  }
  
  /**
   * Get total count
   */
  count(): number {
    return this.records.length
  }
}

// Singleton instance
let instance: MigrationHistory | null = null

export function getMigrationHistory(): MigrationHistory {
  if (!instance) {
    instance = new MigrationHistory()
  }
  return instance
}
