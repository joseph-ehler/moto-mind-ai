#!/usr/bin/env tsx
/**
 * System State Capture - FULLY AUTOMATED
 * 
 * Captures complete system state including:
 * - Session context (current work, git state)
 * - Codebase structure (features, components, API routes)
 * - Health metrics (deployment, architecture, tests)
 * - Smart recommendations based on state
 * 
 * Auto-runs on:
 * - Pre-commit (via git hook)
 * - Pre-deploy (via smart-deploy)
 * - Session start (if stale >1 hour)
 * 
 * ZERO MAINTENANCE REQUIRED - Updates automatically on existing events
 */

import { execSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'

interface SystemState {
  meta: {
    timestamp: number
    capturedBy: 'pre-commit' | 'pre-deploy' | 'session-start' | 'manual'
    version: string
    age?: string
  }
  session: {
    branch: string
    uncommittedChanges: number
    uncommittedFiles: string[]
    recentCommits: Array<{ hash: string, message: string, time: string }>
    lastModified: string[]
  }
  codebase: {
    features: Record<string, {
      files: number
      tests: number
      coverage: number
      status: 'good' | 'ok' | 'poor' | 'none'
    }>
    components: number
    apiRoutes: number
    scripts: number
  }
  health: {
    deployment: any
    buildHistory: any
    architectureViolations: number
    testCoverage: number
    lastDeployment?: string
  }
  recommendations: string[]
}

class SystemStateCapture {
  
  /**
   * Check if cached state is stale (>1 hour old)
   */
  isStale(): boolean {
    try {
      const state = JSON.parse(fs.readFileSync('.system-state.json', 'utf8'))
      const age = Date.now() - state.meta.timestamp
      return age > 60 * 60 * 1000 // 1 hour
    } catch {
      return true // No file = stale
    }
  }
  
  /**
   * Main capture method - gathers all system state
   */
  capture(triggeredBy: 'pre-commit' | 'pre-deploy' | 'session-start' | 'manual' = 'manual'): SystemState {
    if (triggeredBy !== 'session-start') {
      console.log(`📸 Capturing system state (${triggeredBy})...`)
    }
    
    const state: SystemState = {
      meta: {
        timestamp: Date.now(),
        capturedBy: triggeredBy,
        version: '1.0.0'
      },
      session: this.captureSession(),
      codebase: this.captureCodebase(),
      health: this.captureHealth(),
      recommendations: []
    }
    
    // Generate smart recommendations
    state.recommendations = this.generateRecommendations(state)
    
    return state
  }
  
  /**
   * Capture current session/work context
   */
  private captureSession(): any {
    try {
      const branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim()
      const status = execSync('git status --porcelain', { encoding: 'utf8' })
      const uncommittedFiles = status.split('\n').filter(l => l.trim())
      const uncommittedChanges = uncommittedFiles.length
      
      // Recent commits with relative time
      const log = execSync('git log -5 --pretty=format:"%h|%s|%ar"', { encoding: 'utf8' })
      const recentCommits = log.split('\n')
        .filter(l => l.trim())
        .map(line => {
          const [hash, ...rest] = line.split('|')
          const parts = rest.join('|').split('|')
          const message = parts.slice(0, -1).join('|')
          const time = parts[parts.length - 1]
          return { hash, message, time }
        })
      
      // Files modified in last 5 commits (top 10)
      let lastModified: string[] = []
      try {
        const modified = execSync('git diff --name-only HEAD~5 2>/dev/null', { 
          encoding: 'utf8',
          stdio: 'pipe'
        })
        lastModified = modified.split('\n').filter(f => f.trim()).slice(0, 10)
      } catch {
        // Might be < 5 commits in repo
      }
      
      return {
        branch,
        uncommittedChanges,
        uncommittedFiles: uncommittedFiles.slice(0, 10), // Top 10
        recentCommits,
        lastModified
      }
    } catch (error) {
      return {
        branch: 'unknown',
        uncommittedChanges: 0,
        uncommittedFiles: [],
        recentCommits: [],
        lastModified: []
      }
    }
  }
  
  /**
   * Capture codebase structure
   */
  private captureCodebase(): any {
    const features: Record<string, any> = {}
    let totalComponents = 0
    let totalApiRoutes = 0
    let totalScripts = 0
    
    // Scan features/
    try {
      const featureDirs = fs.readdirSync('features')
      
      for (const feature of featureDirs) {
        if (feature.startsWith('.')) continue
        
        const featurePath = `features/${feature}`
        
        const allFiles = this.countFilesRecursive(featurePath)
        const testFiles = this.countFilesRecursive(`${featurePath}/__tests__`)
        
        const coverage = allFiles > 0 ? Math.round((testFiles / allFiles) * 100) : 0
        let status: 'good' | 'ok' | 'poor' | 'none' = 'none'
        
        if (testFiles > 0) {
          if (coverage >= 80) status = 'good'
          else if (coverage >= 50) status = 'ok'
          else status = 'poor'
        }
        
        features[feature] = {
          files: allFiles,
          tests: testFiles,
          coverage,
          status
        }
      }
    } catch (e) {
      // No features dir yet
    }
    
    // Count components
    try {
      totalComponents = this.countFilesRecursive('components')
    } catch {}
    
    // Count API routes
    try {
      totalApiRoutes = this.countFilesRecursive('pages/api')
    } catch {}
    
    // Count scripts
    try {
      totalScripts = this.countFilesRecursive('scripts')
    } catch {}
    
    return {
      features,
      components: totalComponents,
      apiRoutes: totalApiRoutes,
      scripts: totalScripts
    }
  }
  
  /**
   * Capture health metrics
   */
  private captureHealth(): any {
    // Read deployment status
    let deployment = null
    let lastDeployment = undefined
    try {
      deployment = JSON.parse(fs.readFileSync('.vercel-status.json', 'utf8'))
      if (deployment?.timestamp) {
        const age = Date.now() - deployment.timestamp
        const hours = age / (1000 * 60 * 60)
        lastDeployment = hours < 1 
          ? `${Math.floor(age / (1000 * 60))}m ago`
          : hours < 24
          ? `${hours.toFixed(1)}h ago`
          : `${Math.floor(hours / 24)}d ago`
      }
    } catch {}
    
    // Read build history
    let buildHistory = null
    try {
      buildHistory = JSON.parse(fs.readFileSync('.build-history.json', 'utf8'))
    } catch {}
    
    // Count architecture violations
    let architectureViolations = -1
    try {
      const output = execSync('npm run arch:validate 2>&1', { 
        encoding: 'utf8',
        stdio: 'pipe',
        timeout: 30000
      })
      const match = output.match(/Total: (\d+) issue/)
      architectureViolations = match ? parseInt(match[1]) : 0
    } catch {
      // Validator might fail, that's ok
    }
    
    // Estimate test coverage from features
    const testCoverage = this.estimateTestCoverage()
    
    return {
      deployment,
      buildHistory,
      architectureViolations,
      testCoverage,
      lastDeployment
    }
  }
  
  /**
   * Estimate overall test coverage
   */
  private estimateTestCoverage(): number {
    try {
      let totalFiles = 0
      let totalTests = 0
      
      // Count feature files vs tests
      try {
        const featureDirs = fs.readdirSync('features')
        for (const feature of featureDirs) {
          if (feature.startsWith('.')) continue
          const featurePath = `features/${feature}`
          totalFiles += this.countFilesRecursive(featurePath)
          totalTests += this.countFilesRecursive(`${featurePath}/__tests__`)
        }
      } catch {}
      
      // Add lib files (exclude node_modules, tests)
      try {
        totalFiles += this.countFilesRecursive('lib')
      } catch {}
      
      // Add tests/ directory
      try {
        totalTests += this.countFilesRecursive('tests')
      } catch {}
      
      return totalFiles > 0 ? Math.round((totalTests / totalFiles) * 100) : 0
    } catch {
      return 0
    }
  }
  
  /**
   * Count TypeScript/TSX files recursively
   */
  private countFilesRecursive(dir: string): number {
    try {
      let count = 0
      const items = fs.readdirSync(dir)
      
      for (const item of items) {
        if (item.startsWith('.') || item === 'node_modules') continue
        
        const fullPath = path.join(dir, item)
        const stat = fs.statSync(fullPath)
        
        if (stat.isDirectory()) {
          count += this.countFilesRecursive(fullPath)
        } else if (stat.isFile()) {
          if (item.endsWith('.ts') || item.endsWith('.tsx')) {
            count++
          }
        }
      }
      
      return count
    } catch {
      return 0
    }
  }
  
  /**
   * Generate smart recommendations based on current state
   */
  private generateRecommendations(state: SystemState): string[] {
    const recs: string[] = []
    
    // Uncommitted changes
    if (state.session.uncommittedChanges > 10) {
      recs.push(`${state.session.uncommittedChanges} uncommitted changes - consider committing progress`)
    } else if (state.session.uncommittedChanges > 0) {
      recs.push(`${state.session.uncommittedChanges} uncommitted changes ready to commit`)
    }
    
    // Architecture violations (if check succeeded)
    if (state.health.architectureViolations > 100) {
      recs.push(`${state.health.architectureViolations} architecture violations - start Phase 1: complete vehicles feature`)
    } else if (state.health.architectureViolations > 50) {
      recs.push(`${state.health.architectureViolations} architecture violations - continue feature migration`)
    } else if (state.health.architectureViolations > 0) {
      recs.push(`${state.health.architectureViolations} architecture violations remaining - almost there!`)
    }
    
    // Test coverage
    if (state.health.testCoverage < 50) {
      recs.push(`Test coverage ${state.health.testCoverage}% - add tests to critical features`)
    } else if (state.health.testCoverage < 80) {
      recs.push(`Test coverage ${state.health.testCoverage}% - good progress, aim for 80%+`)
    }
    
    // Deployment status
    if (state.health.deployment?.state === 'ERROR') {
      recs.push('⚠️  Last deployment FAILED - check .vercel-status.json for details')
    } else if (state.health.deployment?.state === 'READY') {
      recs.push(`✅ Production healthy (deployed ${state.health.lastDeployment})`)
    }
    
    // Features without tests
    const featuresNeedingTests = Object.entries(state.codebase.features)
      .filter(([name, info]: [string, any]) => info.tests === 0 && info.files > 0)
      .map(([name]) => name)
    
    if (featuresNeedingTests.length > 0) {
      const featureName = featuresNeedingTests[0]
      recs.push(`Feature '${featureName}' has no tests - add to features/${featureName}/__tests__/`)
    }
    
    // Next steps hint (if on main branch with no uncommitted changes)
    if (state.session.branch === 'main' && state.session.uncommittedChanges === 0) {
      if (state.health.architectureViolations > 100) {
        recs.push('📍 Suggested next: Start Phase 1 (complete vehicles feature) from QUICK-START guide')
      }
    }
    
    return recs.slice(0, 5) // Top 5 recommendations
  }
  
  /**
   * Write state to file
   */
  write(state: SystemState): void {
    fs.writeFileSync('.system-state.json', JSON.stringify(state, null, 2))
    if (state.meta.capturedBy !== 'session-start') {
      console.log('✅ System state captured')
    }
  }
  
  /**
   * Read cached state
   */
  read(): SystemState | null {
    try {
      const state = JSON.parse(fs.readFileSync('.system-state.json', 'utf8'))
      
      // Add age calculation
      const age = Date.now() - state.meta.timestamp
      const minutes = Math.floor(age / (1000 * 60))
      state.meta.age = minutes < 60 
        ? `${minutes}m ago`
        : minutes < 1440
        ? `${Math.floor(minutes / 60)}h ago`
        : `${Math.floor(minutes / 1440)}d ago`
      
      return state
    } catch {
      return null
    }
  }
  
  /**
   * Format state for human-readable display
   */
  format(state: SystemState): string {
    let output = `📊 SYSTEM STATE (captured ${state.meta.age || 'just now'} by ${state.meta.capturedBy})\n\n`
    
    // Session info
    output += `🔧 Current Work:\n`
    output += `   Branch: ${state.session.branch}\n`
    output += `   Uncommitted: ${state.session.uncommittedChanges} change${state.session.uncommittedChanges !== 1 ? 's' : ''}\n`
    if (state.session.recentCommits.length > 0) {
      const recent = state.session.recentCommits[0]
      output += `   Recent: ${recent.message} (${recent.time})\n`
    }
    output += `\n`
    
    // Codebase
    output += `📁 Codebase:\n`
    output += `   Features: ${Object.keys(state.codebase.features).length}\n`
    Object.entries(state.codebase.features).forEach(([name, info]: [string, any]) => {
      const icon = info.status === 'good' ? '✅' : info.status === 'ok' ? '⚠️' : info.status === 'poor' ? '❌' : '⚪'
      output += `     ${icon} ${name}: ${info.files} files, ${info.tests} tests (${info.coverage}%)\n`
    })
    output += `   Components: ${state.codebase.components}\n`
    output += `   API Routes: ${state.codebase.apiRoutes}\n`
    output += `\n`
    
    // Health
    output += `🏥 Health:\n`
    if (state.health.deployment) {
      const statusIcon = state.health.deployment.state === 'READY' ? '✅' : 
                        state.health.deployment.state === 'ERROR' ? '❌' : '⏳'
      output += `   Deployment: ${statusIcon} ${state.health.deployment.state}`
      if (state.health.lastDeployment) {
        output += ` (${state.health.lastDeployment})`
      }
      output += `\n`
    }
    if (state.health.architectureViolations >= 0) {
      output += `   Architecture: ${state.health.architectureViolations} violation${state.health.architectureViolations !== 1 ? 's' : ''}\n`
    }
    output += `   Test Coverage: ${state.health.testCoverage}%\n`
    output += `\n`
    
    // Recommendations
    if (state.recommendations.length > 0) {
      output += `💡 Recommendations:\n`
      state.recommendations.forEach(rec => {
        output += `   • ${rec}\n`
      })
      output += `\n`
    }
    
    output += `Ready to work! 🚀\n`
    
    return output
  }
}

// ============================================================================
// CLI
// ============================================================================

const args = process.argv.slice(2)
const command = args[0]

const capture = new SystemStateCapture()

if (command === 'capture') {
  const triggeredBy = (args[1] || 'manual') as any
  const state = capture.capture(triggeredBy)
  capture.write(state)
  console.log(capture.format(state))
  
} else if (command === 'read') {
  const state = capture.read()
  if (state) {
    console.log(capture.format(state))
  } else {
    console.log('❌ No system state found')
    console.log('   Run: npm run state:capture')
  }
  
} else if (command === 'check-stale') {
  const isStale = capture.isStale()
  if (isStale) {
    console.log('STALE')
    process.exit(1)
  } else {
    console.log('FRESH')
    process.exit(0)
  }
  
} else {
  console.log('System State Capture - Fully Automated')
  console.log('')
  console.log('Usage:')
  console.log('  npm run state:capture [trigger]   # Capture current state')
  console.log('  npm run state:read                # Read cached state')
  console.log('  npm run state:check-stale         # Check if stale (>1h)')
  console.log('')
  console.log('Auto-runs on: pre-commit, pre-deploy, session-start')
}

export { SystemStateCapture }
export type { SystemState }
