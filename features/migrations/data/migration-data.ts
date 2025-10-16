/**
 * Migration Data Layer
 * 
 * Reads migration data files and provides aggregated metrics.
 * Used by the Migration Metrics Dashboard for investor reporting.
 */

import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

export interface MigrationSession {
  feature: string
  startTime: string
  baseline: {
    timestamp: string
    tests: number
    violations: number
    features: {
      migrated: string[]
      remaining: string[]
    }
  }
  analysis: {
    featureName: string
    componentCount: number
    totalFiles: number
    complexityLevel: string
    estimatedTime: string
    hasInternalImports: boolean
  }
  progress: {
    phases: Record<string, {
      status: string
      startTime: string
      endTime?: string
      duration?: number
      commits: number
    }>
    currentPhase: string | null
    totalElapsed: number
    commits: number
    lastUpdate: string
  }
}

export interface AIAnalysis {
  featureName: string
  aiInsights: {
    actualComplexity: string
    hiddenIssues: string[]
    recommendations: string[]
    estimatedTime: string
    confidence: number
    internalImports?: {
      count: number
      files: string[]
    }
  }
  costEstimate: {
    inputTokens: number
    outputTokens: number
  }
}

export interface PredictedIssues {
  feature: string
  predictedIssues: Array<{
    issue: string
    probability: number
    phase: string
    mitigation: string
    basedOn: string
  }>
}

export interface MigrationMetrics {
  feature: string
  status: 'complete' | 'in-progress' | 'not-started'
  duration: {
    actual: number // minutes
    estimated: number // minutes
    savedTime: number // minutes
  }
  costs: {
    traditional: number // dollars
    aiAssisted: number // dollars
    saved: number // dollars
  }
  quality: {
    testsCreated: number
    testsPassing: number
    testSuccessRate: number
    buildSuccess: boolean
    issuesPrevented: number
    issuesCaught: number
  }
  aiPerformance: {
    predictionsAccuracy: number
    hiddenIssuesFound: number
    timeSavedFromPrevention: number // minutes
    cost: number // dollars
  }
  roi: {
    timeROI: number
    costROI: number
    qualityScore: number
  }
}

/**
 * Read migration session data
 * First checks for completed migration, then active session
 */
export function readMigrationSession(feature: string): MigrationSession | null {
  // Check for completed migration first
  const completedPath = join(process.cwd(), `.migration-completed-${feature}.json`)
  if (existsSync(completedPath)) {
    try {
      const completed = JSON.parse(readFileSync(completedPath, 'utf-8'))
      // Convert completed format to session format
      return {
        feature: completed.feature,
        startTime: new Date(new Date(completed.completedAt).getTime() - completed.duration * 60000).toISOString(),
        baseline: { timestamp: '', tests: 0, violations: 0, features: { migrated: [], remaining: [] } },
        analysis: { featureName: completed.feature, componentCount: 0, totalFiles: 0, complexityLevel: 'medium', estimatedTime: `${Math.round(completed.estimatedDuration / 60)} hours`, hasInternalImports: false },
        progress: {
          phases: {
            tests: { status: 'complete', startTime: '', endTime: completed.completedAt, duration: completed.duration, commits: 0 },
            components: { status: 'complete', startTime: '', endTime: completed.completedAt, duration: 0, commits: 0 },
            domain: { status: 'complete', startTime: '', endTime: completed.completedAt, duration: 0, commits: 0 },
            validation: { status: 'complete', startTime: '', endTime: completed.completedAt, duration: 0, commits: 0 }
          },
          currentPhase: null,
          totalElapsed: completed.duration,
          commits: 0,
          lastUpdate: completed.completedAt
        }
      }
    } catch {
      // Fall through to active session
    }
  }
  
  // Check active session
  const filePath = join(process.cwd(), '.migration-session.json')
  
  if (!existsSync(filePath)) return null
  
  try {
    const data = JSON.parse(readFileSync(filePath, 'utf-8'))
    if (data.feature !== feature) return null
    return data
  } catch {
    return null
  }
}

/**
 * Read AI analysis data
 */
export function readAIAnalysis(feature: string): AIAnalysis | null {
  const filePath = join(process.cwd(), `.migration-analysis-ai-${feature}.json`)
  
  if (!existsSync(filePath)) return null
  
  try {
    return JSON.parse(readFileSync(filePath, 'utf-8'))
  } catch {
    return null
  }
}

/**
 * Read predicted issues
 */
export function readPredictions(feature: string): PredictedIssues | null {
  const filePath = join(process.cwd(), `.migration-predictions-${feature}.json`)
  
  if (!existsSync(filePath)) return null
  
  try {
    return JSON.parse(readFileSync(filePath, 'utf-8'))
  } catch {
    return null
  }
}

/**
 * Get all completed migrations
 * Automatically discovers all .migration-completed-*.json files
 */
export function getCompletedMigrations(): string[] {
  const { readdirSync } = require('fs')
  const completed: string[] = []
  
  try {
    const files = readdirSync(process.cwd())
    const completedFiles = files.filter((f: string) => 
      f.startsWith('.migration-completed-') && f.endsWith('.json')
    )
    
    for (const file of completedFiles) {
      // Extract feature name from filename: .migration-completed-{feature}.json
      const feature = file.replace('.migration-completed-', '').replace('.json', '')
      completed.push(feature)
    }
  } catch {
    // Fallback to empty array if directory read fails
  }
  
  return completed
}

/**
 * Calculate migration metrics
 * Reads directly from completion files which have pre-calculated metrics
 */
export function calculateMigrationMetrics(feature: string): MigrationMetrics | null {
  const completedPath = join(process.cwd(), `.migration-completed-${feature}.json`)
  
  if (!existsSync(completedPath)) return null
  
  try {
    const completed = JSON.parse(readFileSync(completedPath, 'utf-8'))
    
    // If file has pre-calculated metrics, use them directly
    if (completed.timeSaved !== undefined && completed.costSaved !== undefined) {
      return {
        feature: completed.feature,
        status: 'complete',
        duration: {
          actual: completed.duration,
          estimated: completed.estimatedDuration,
          savedTime: completed.timeSaved
        },
        costs: {
          traditional: (completed.estimatedDuration / 60) * 75, // $75/hour
          aiAssisted: (completed.duration / 60) * 75 + 0.01, // duration cost + AI cost
          saved: completed.costSaved
        },
        quality: {
          testsCreated: completed.testsCreated || 0,
          testsPassing: completed.testsPassing || 0,
          testSuccessRate: completed.testsCreated > 0 ? completed.testsPassing / completed.testsCreated : 1,
          buildSuccess: completed.buildSuccess !== false,
          issuesPrevented: completed.issuesPrevented || 0,
          issuesCaught: 0
        },
        aiPerformance: {
          predictionsAccuracy: completed.predictions?.accuracy || 100,
          hiddenIssuesFound: completed.issuesPrevented || 0,
          timeSavedFromPrevention: 0,
          cost: 0.01
        },
        roi: {
          timeROI: Math.round((completed.timeSaved / completed.duration) * 10) / 10,
          costROI: completed.roi || Math.round(completed.costSaved / 0.01),
          qualityScore: completed.testsCreated > 0 ? completed.testsPassing / completed.testsCreated : 1
        }
      }
    }
    
    // Fallback to old calculation logic for legacy files
    const session = readMigrationSession(feature)
    const aiAnalysis = readAIAnalysis(feature)
    
    if (!session) return null
    
    const estimatedMinutes = completed.estimatedDuration
    const actualMinutes = completed.duration
    const savedMinutes = estimatedMinutes - actualMinutes
    const hourlyRate = 75
    const traditionalCost = (estimatedMinutes / 60) * hourlyRate
    const aiCost = 0.01
    const actualDevCost = (actualMinutes / 60) * hourlyRate
    const aiAssistedCost = actualDevCost + aiCost
    const savedCost = traditionalCost - aiAssistedCost
    
    return {
      feature: completed.feature,
      status: 'complete',
      duration: {
        actual: actualMinutes,
        estimated: estimatedMinutes,
        savedTime: savedMinutes
      },
      costs: {
        traditional: Math.round(traditionalCost * 100) / 100,
        aiAssisted: Math.round(aiAssistedCost * 100) / 100,
        saved: Math.round(savedCost * 100) / 100
      },
      quality: {
        testsCreated: completed.testsCreated || 0,
        testsPassing: completed.testsPassing || 0,
        testSuccessRate: completed.testsCreated > 0 ? completed.testsPassing / completed.testsCreated : 1,
        buildSuccess: true,
        issuesPrevented: completed.issuesPrevented || 0,
        issuesCaught: 0
      },
      aiPerformance: {
        predictionsAccuracy: 1.0,
        hiddenIssuesFound: aiAnalysis?.aiInsights.hiddenIssues.length || 0,
        timeSavedFromPrevention: 0,
        cost: aiCost
      },
      roi: {
        timeROI: Math.round((savedMinutes / actualMinutes) * 10) / 10,
        costROI: Math.round(savedCost / aiCost),
        qualityScore: completed.testsCreated > 0 ? completed.testsPassing / completed.testsCreated : 1
      }
    }
  } catch (e) {
    console.error(`Error reading metrics for ${feature}:`, e)
    return null
  }
}

/**
 * Get aggregate metrics across all migrations
 */
export function getAggregateMetrics(): {
  totalMigrations: number
  totalTimeSaved: number
  totalCostSaved: number
  averageROI: number
  totalTests: number
  testSuccessRate: number
} {
  const completed = getCompletedMigrations()
  
  let totalTimeSaved = 0
  let totalCostSaved = 0
  let totalROI = 0
  let totalTests = 0
  let totalTestsPassing = 0
  
  for (const feature of completed) {
    const metrics = calculateMigrationMetrics(feature)
    if (metrics) {
      totalTimeSaved += metrics.duration.savedTime
      totalCostSaved += metrics.costs.saved
      totalROI += metrics.roi.costROI
      totalTests += metrics.quality.testsCreated
      totalTestsPassing += metrics.quality.testsPassing
    }
  }
  
  return {
    totalMigrations: completed.length,
    totalTimeSaved: Math.round(totalTimeSaved),
    totalCostSaved: Math.round(totalCostSaved * 100) / 100,
    averageROI: completed.length > 0 ? Math.round(totalROI / completed.length) : 0,
    totalTests,
    testSuccessRate: totalTests > 0 ? totalTestsPassing / totalTests : 0
  }
}
