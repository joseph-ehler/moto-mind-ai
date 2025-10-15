#!/usr/bin/env tsx
/**
 * Post-Migration Analyzer
 * 
 * Analyzes results after migration completes:
 * - Compare baseline vs current state
 * - Calculate actual time vs estimate
 * - Capture quality metrics
 * - Save to history for learning
 */

import * as fs from 'fs'
import * as path from 'path'
import { execSync } from 'child_process'

interface MigrationSession {
  feature: string
  startTime: Date
  baseline: SystemState
  analysis: any
  checklistPath: string
  sessionId: string
  progress?: MigrationProgress
}

interface SystemState {
  timestamp: Date
  tests: number
  violations: number
  features: {
    migrated: string[]
    remaining: string[]
  }
}

interface MigrationProgress {
  phases: any
  currentPhase: string | null
  totalElapsed: number
  commits: number
  lastUpdate: Date
}

interface MigrationResult {
  feature: string
  sessionId: string
  
  // Timing
  startTime: Date
  endTime: Date
  actualDuration: number // minutes
  estimatedDuration: string
  variance: number // actual - estimated (in minutes)
  
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
}

function loadSession(): MigrationSession | null {
  const sessionPath = path.join(process.cwd(), '.migration-session.json')
  
  if (!fs.existsSync(sessionPath)) {
    return null
  }
  
  try {
    const session = JSON.parse(fs.readFileSync(sessionPath, 'utf-8'))
    session.startTime = new Date(session.startTime)
    return session
  } catch {
    return null
  }
}

function getCurrentState(): SystemState {
  // Count current tests
  const testCount = execSync(
    'find features/ -name "*.test.ts" | wc -l',
    { encoding: 'utf-8' }
  )
  
  // Get migrated features
  const migratedFeatures = execSync(
    'ls -d features/*/ 2>/dev/null | xargs -n 1 basename',
    { encoding: 'utf-8' }
  ).trim().split('\n').filter(Boolean)
  
  // Get remaining features
  const remainingFeatures = execSync(
    'ls -d components/*/ 2>/dev/null | xargs -n 1 basename',
    { encoding: 'utf-8' }
  ).trim().split('\n').filter(Boolean).filter(f => 
    !['design-system', 'app', 'app-specific'].includes(f)
  )
  
  return {
    timestamp: new Date(),
    tests: parseInt(testCount.trim()) || 0,
    violations: 0,
    features: {
      migrated: migratedFeatures,
      remaining: remainingFeatures
    }
  }
}

function countComponents(feature: string): number {
  try {
    const result = execSync(
      `find features/${feature}/ui -name "*.tsx" | wc -l`,
      { encoding: 'utf-8' }
    )
    return parseInt(result.trim()) || 0
  } catch {
    return 0
  }
}

function checkBuild(): boolean {
  try {
    execSync('npm run build', { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

function checkTests(feature: string): boolean {
  try {
    execSync(`npm test features/${feature} -- --silent`, { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

function parseEstimate(estimatedTime: string): number {
  const match = estimatedTime.match(/([\d.]+)-([\d.]+)/)
  if (!match) return 60
  
  const low = parseFloat(match[1])
  const high = parseFloat(match[2])
  return ((low + high) / 2) * 60
}

async function analyzeResults(session: MigrationSession): Promise<MigrationResult> {
  const currentState = getCurrentState()
  const endTime = new Date()
  const actualDuration = (endTime.getTime() - new Date(session.startTime).getTime()) / 1000 / 60
  const estimatedDuration = parseEstimate(session.analysis.estimatedTime)
  
  const result: MigrationResult = {
    feature: session.feature,
    sessionId: session.sessionId,
    
    startTime: new Date(session.startTime),
    endTime,
    actualDuration,
    estimatedDuration: session.analysis.estimatedTime,
    variance: actualDuration - estimatedDuration,
    
    testsAdded: currentState.tests - session.baseline.tests,
    componentsMigrated: countComponents(session.feature),
    violationsChanged: currentState.violations - session.baseline.violations,
    buildPassing: checkBuild(),
    allTestsPassing: checkTests(session.feature),
    
    phases: {},
    totalCommits: session.progress?.commits || 0,
    
    complexity: session.analysis.complexityLevel,
    similarTo: session.analysis.similarTo
  }
  
  // Extract phase durations
  if (session.progress?.phases) {
    const phases = session.progress.phases as any
    if (phases.tests?.duration) result.phases.tests = phases.tests.duration
    if (phases.components?.duration) result.phases.components = phases.components.duration
    if (phases.domain?.duration) result.phases.domain = phases.domain.duration
    if (phases.validation?.duration) result.phases.validation = phases.validation.duration
  }
  
  return result
}

function saveToHistory(result: MigrationResult) {
  const historyPath = path.join(process.cwd(), 'data', 'migration-history.json')
  
  // Ensure directory exists
  const dataDir = path.dirname(historyPath)
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
  
  // Load existing history
  let history: MigrationResult[] = []
  if (fs.existsSync(historyPath)) {
    try {
      history = JSON.parse(fs.readFileSync(historyPath, 'utf-8'))
    } catch {
      history = []
    }
  }
  
  // Add new result
  history.push(result)
  
  // Save
  fs.writeFileSync(historyPath, JSON.stringify(history, null, 2))
  
  return history.length
}

function printResults(result: MigrationResult, historyCount: number) {
  const quality = result.buildPassing && result.allTestsPassing ? 'EXCELLENT' : 'NEEDS WORK'
  const varianceIcon = result.variance > 5 ? '⚠️' : result.variance < -5 ? '✨' : '✅'
  
  console.log('\n' + '='.repeat(60))
  console.log(`✅ ${result.feature.toUpperCase()} MIGRATION COMPLETE!`)
  console.log('='.repeat(60))
  console.log()
  console.log('⏱️  TIMING:')
  console.log(`    Duration: ${result.actualDuration.toFixed(1)} min`)
  console.log(`    Estimated: ${result.estimatedDuration}`)
  console.log(`    Variance: ${varianceIcon} ${result.variance > 0 ? '+' : ''}${result.variance.toFixed(1)} min`)
  console.log()
  console.log('📊  METRICS:')
  console.log(`    Tests Added: ${result.testsAdded}`)
  console.log(`    Components: ${result.componentsMigrated}`)
  console.log(`    Commits: ${result.totalCommits}`)
  console.log()
  console.log('🎯  QUALITY:')
  console.log(`    Build: ${result.buildPassing ? '✅ Passing' : '❌ Failed'}`)
  console.log(`    Tests: ${result.allTestsPassing ? '✅ Passing' : '❌ Failed'}`)
  console.log(`    Overall: ${quality}`)
  console.log()
  
  if (Object.keys(result.phases).length > 0) {
    console.log('📋  PHASES:')
    if (result.phases.tests) console.log(`    Tests: ${result.phases.tests.toFixed(1)} min`)
    if (result.phases.components) console.log(`    Components: ${result.phases.components.toFixed(1)} min`)
    if (result.phases.domain) console.log(`    Domain: ${result.phases.domain.toFixed(1)} min`)
    if (result.phases.validation) console.log(`    Validation: ${result.phases.validation.toFixed(1)} min`)
    console.log()
  }
  
  console.log('💾  HISTORY:')
  console.log(`    Total Migrations: ${historyCount}`)
  console.log(`    Saved to: data/migration-history.json`)
  console.log()
  
  // Recommendations
  if (Math.abs(result.variance) > 15) {
    console.log('💡  RECOMMENDATIONS:')
    console.log(`    Large variance from estimate (${result.variance.toFixed(1)} min)`)
    console.log(`    Consider updating complexity heuristics for ${result.complexity} features`)
    console.log()
  }
  
  console.log('='.repeat(60))
  console.log()
}

function cleanup() {
  const sessionPath = path.join(process.cwd(), '.migration-session.json')
  if (fs.existsSync(sessionPath)) {
    fs.unlinkSync(sessionPath)
  }
}

async function analyze() {
  const session = loadSession()
  
  if (!session) {
    console.error('❌ No active migration session found')
    console.error('   Run this after completing a migration')
    process.exit(1)
  }
  
  console.log(`\n🔍 Analyzing ${session.feature} migration results...\n`)
  
  const result = await analyzeResults(session)
  const historyCount = saveToHistory(result)
  printResults(result, historyCount)
  cleanup()
  
  console.log(`✅ Analysis complete! Session closed.`)
  console.log()
  
  // Trigger learning if we have enough data
  if (historyCount >= 3) {
    console.log('🧠 Running pattern detection (3+ migrations)...')
    console.log()
    try {
      execSync('npm run migrate:patterns', { stdio: 'inherit' })
    } catch (error) {
      console.warn('⚠️  Pattern detection failed, continuing...')
    }
  } else {
    console.log(`💡 Pattern detection available after ${3 - historyCount} more migration${3 - historyCount === 1 ? '' : 's'}`)
    console.log(`   Run manually: npm run migrate:learn`)
    console.log()
  }
}

// CLI
analyze()
