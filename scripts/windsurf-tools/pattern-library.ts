#!/usr/bin/env tsx
/**
 * Pattern Library System
 * 
 * Learns from successful operations and auto-applies proven patterns.
 * This is the "intelligence" layer - Cascade gets smarter over time.
 */

import * as fs from 'fs'
import * as path from 'path'

const PATTERNS_PATH = '.windsurf/patterns.json'
const HISTORY_PATH = '.windsurf/operation-history.json'

// ============================================================================
// TYPES
// ============================================================================

interface Pattern {
  id: string
  name: string
  description: string
  type: 'migration' | 'refactor' | 'batch_operation' | 'custom'
  steps: PatternStep[]
  outcomes: Outcome[]
  confidence: number
  success_rate: number
  avg_duration_ms: number
  auto_apply_threshold: number
  created_at: string
  last_used?: string
}

interface PatternStep {
  action: string
  description: string
  command?: string
  validation?: string
}

interface Outcome {
  timestamp: string
  result: 'success' | 'failure'
  duration_ms: number
  context?: Record<string, any>
}

interface PatternLibrary {
  version: string
  patterns: Record<string, Pattern>
  total_applications: number
  total_successes: number
}

interface OperationHistory {
  operations: Array<{
    id: string
    type: string
    description: string
    result: string
    timestamp: string
    duration_ms?: number
  }>
}

// ============================================================================
// LIBRARY MANAGEMENT
// ============================================================================

function loadLibrary(): PatternLibrary {
  if (!fs.existsSync(PATTERNS_PATH)) {
    return {
      version: '1.0',
      patterns: {},
      total_applications: 0,
      total_successes: 0
    }
  }
  
  try {
    return JSON.parse(fs.readFileSync(PATTERNS_PATH, 'utf-8'))
  } catch (error) {
    console.warn('⚠️  Failed to load pattern library, starting fresh')
    return {
      version: '1.0',
      patterns: {},
      total_applications: 0,
      total_successes: 0
    }
  }
}

function saveLibrary(library: PatternLibrary): void {
  const dir = path.dirname(PATTERNS_PATH)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  
  fs.writeFileSync(PATTERNS_PATH, JSON.stringify(library, null, 2), 'utf-8')
}

function generatePatternId(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '_')
}

// ============================================================================
// PATTERN OPERATIONS
// ============================================================================

export function createPattern(
  name: string,
  description: string,
  type: Pattern['type'],
  steps: PatternStep[]
): string {
  const library = loadLibrary()
  const id = generatePatternId(name)
  
  if (library.patterns[id]) {
    console.warn(`⚠️  Pattern "${name}" already exists, updating...`)
  }
  
  const pattern: Pattern = {
    id,
    name,
    description,
    type,
    steps,
    outcomes: [],
    confidence: 0.5, // Start with neutral confidence
    success_rate: 0,
    avg_duration_ms: 0,
    auto_apply_threshold: 0.90, // Auto-apply at 90% confidence
    created_at: new Date().toISOString()
  }
  
  library.patterns[id] = pattern
  saveLibrary(library)
  
  return id
}

export function recordOutcome(
  patternId: string,
  result: 'success' | 'failure',
  duration_ms: number,
  context?: Record<string, any>
): void {
  const library = loadLibrary()
  const pattern = library.patterns[patternId]
  
  if (!pattern) {
    console.error(`❌ Pattern ${patternId} not found`)
    return
  }
  
  // Add outcome
  pattern.outcomes.push({
    timestamp: new Date().toISOString(),
    result,
    duration_ms,
    context
  })
  
  // Update statistics
  const successes = pattern.outcomes.filter(o => o.result === 'success').length
  const total = pattern.outcomes.length
  
  pattern.success_rate = successes / total
  pattern.confidence = calculateConfidence(pattern)
  pattern.avg_duration_ms = 
    pattern.outcomes.reduce((sum, o) => sum + o.duration_ms, 0) / total
  pattern.last_used = new Date().toISOString()
  
  // Update library totals
  library.total_applications++
  if (result === 'success') {
    library.total_successes++
  }
  
  saveLibrary(library)
}

function calculateConfidence(pattern: Pattern): number {
  if (pattern.outcomes.length === 0) return 0.5
  
  // Base confidence from success rate
  let confidence = pattern.success_rate
  
  // Boost confidence with more samples (up to 10 samples)
  const sampleBoost = Math.min(pattern.outcomes.length / 10, 1) * 0.2
  confidence += sampleBoost
  
  // Recent success bias (last 3 outcomes)
  const recent = pattern.outcomes.slice(-3)
  const recentSuccesses = recent.filter(o => o.result === 'success').length
  if (recentSuccesses === recent.length && recent.length >= 3) {
    confidence += 0.1 // Bonus for consistent recent success
  }
  
  // Cap at 0.98 (never 100% certain)
  return Math.min(confidence, 0.98)
}

export function shouldAutoApply(patternId: string): boolean {
  const library = loadLibrary()
  const pattern = library.patterns[patternId]
  
  if (!pattern) return false
  
  // Need at least 3 successful applications
  const successes = pattern.outcomes.filter(o => o.result === 'success').length
  if (successes < 3) return false
  
  // Check confidence threshold
  return pattern.confidence >= pattern.auto_apply_threshold
}

export function getPattern(patternId: string): Pattern | null {
  const library = loadLibrary()
  return library.patterns[patternId] || null
}

export function listPatterns(): Pattern[] {
  const library = loadLibrary()
  return Object.values(library.patterns)
    .sort((a, b) => b.confidence - a.confidence)
}

// ============================================================================
// PATTERN DETECTION
// ============================================================================

export function detectPatternsFromHistory(): void {
  console.log('\n🔍 Analyzing operation history for patterns...\n')
  
  if (!fs.existsSync(HISTORY_PATH)) {
    console.log('ℹ️  No operation history found yet\n')
    return
  }
  
  const history: OperationHistory = JSON.parse(fs.readFileSync(HISTORY_PATH, 'utf-8'))
  
  if (history.operations.length === 0) {
    console.log('ℹ️  No operations recorded yet\n')
    return
  }
  
  console.log(`📊 Found ${history.operations.length} operations\n`)
  
  // Detect feature migration pattern
  const migrations = history.operations.filter(op => 
    op.description.toLowerCase().includes('migration') ||
    op.description.toLowerCase().includes('move') ||
    op.description.toLowerCase().includes('features/')
  )
  
  if (migrations.length >= 2) {
    const successfulMigrations = migrations.filter(m => m.result === 'success')
    console.log(`✅ Detected feature migration pattern (${successfulMigrations.length} successful)`)
    
    if (successfulMigrations.length >= 3) {
      console.log('   📈 High confidence - ready for auto-apply')
    }
  }
  
  // Detect import replacement pattern
  const importReplacements = history.operations.filter(op =>
    op.description.toLowerCase().includes('import') ||
    op.description.toLowerCase().includes('replace import')
  )
  
  if (importReplacements.length >= 2) {
    const successful = importReplacements.filter(m => m.result === 'success')
    console.log(`✅ Detected import replacement pattern (${successful.length} successful)`)
  }
  
  // Detect batch operations pattern
  const batchOps = history.operations.filter(op => op.type === 'batch_edit')
  
  if (batchOps.length >= 2) {
    const successful = batchOps.filter(m => m.result === 'success')
    console.log(`✅ Detected batch operations pattern (${successful.length} successful)`)
  }
  
  console.log()
}

// ============================================================================
// PREDEFINED PATTERNS
// ============================================================================

export function initializeCommonPatterns(): void {
  console.log('\n📚 Initializing common patterns...\n')
  
  const library = loadLibrary()
  
  // Feature Migration Pattern
  if (!library.patterns['feature_migration']) {
    createPattern(
      'Feature Migration',
      'Migrate code from old structure to features/ architecture',
      'migration',
      [
        {
          action: 'analyze',
          description: 'Analyze feature complexity and dependencies',
          command: 'npm run migrate:analyze:ai <feature>'
        },
        {
          action: 'create_structure',
          description: 'Create features/<name>/ directory structure'
        },
        {
          action: 'move_files',
          description: 'Move files to appropriate subdirectories (ui, domain, data)'
        },
        {
          action: 'update_imports',
          description: 'Update all import statements',
          command: 'npm run windsurf:batch replace-import'
        },
        {
          action: 'create_exports',
          description: 'Create index.ts barrel files'
        },
        {
          action: 'generate_tests',
          description: 'Generate test suite for feature'
        },
        {
          action: 'validate',
          description: 'Run build and tests',
          command: 'npm run build && npm test',
          validation: 'All tests pass, build succeeds'
        }
      ]
    )
    console.log('✅ Created: Feature Migration pattern')
  }
  
  // Import Replacement Pattern
  if (!library.patterns['import_replacement']) {
    createPattern(
      'Import Replacement',
      'Replace import statements across multiple files',
      'batch_operation',
      [
        {
          action: 'query_graph',
          description: 'Find all files with old import',
          command: 'npm run windsurf:query importers <module>'
        },
        {
          action: 'preview',
          description: 'Preview changes',
          command: 'npm run windsurf:batch replace-import <old> <new>'
        },
        {
          action: 'execute',
          description: 'Execute batch replacement',
          command: 'npm run windsurf:batch replace-import <old> <new> --execute'
        },
        {
          action: 'validate',
          description: 'Verify build passes',
          command: 'npm run build',
          validation: 'Build succeeds with no import errors'
        }
      ]
    )
    console.log('✅ Created: Import Replacement pattern')
  }
  
  // Component Migration Pattern
  if (!library.patterns['component_migration']) {
    createPattern(
      'Component Migration',
      'Move UI component to features structure',
      'migration',
      [
        {
          action: 'identify',
          description: 'Identify component and dependencies'
        },
        {
          action: 'create_directory',
          description: 'Create features/<name>/ui/ directory'
        },
        {
          action: 'move_component',
          description: 'Move component file to new location'
        },
        {
          action: 'create_barrel',
          description: 'Create ui/index.ts and features/<name>/index.ts'
        },
        {
          action: 'update_imports',
          description: 'Update all imports using batch operation',
          command: 'npm run windsurf:batch replace-import'
        },
        {
          action: 'generate_tests',
          description: 'Create component tests'
        },
        {
          action: 'validate',
          description: 'Build and test',
          command: 'npm run build && npm test'
        }
      ]
    )
    console.log('✅ Created: Component Migration pattern')
  }
  
  console.log('\n✨ Common patterns initialized\n')
}

// ============================================================================
// CLI
// ============================================================================

const command = process.argv[2]

switch (command) {
  case 'list': {
    const patterns = listPatterns()
    
    console.log('\n📚 Pattern Library\n')
    
    if (patterns.length === 0) {
      console.log('   No patterns recorded yet')
      console.log('   Run: npm run windsurf:patterns init\n')
      break
    }
    
    patterns.forEach((pattern, i) => {
      const autoApply = shouldAutoApply(pattern.id) ? '⚡ AUTO' : '📋 MANUAL'
      const confidence = (pattern.confidence * 100).toFixed(0)
      
      console.log(`${i + 1}. ${autoApply} ${pattern.name} (${confidence}% confidence)`)
      console.log(`   ID: ${pattern.id}`)
      console.log(`   Type: ${pattern.type}`)
      console.log(`   Applications: ${pattern.outcomes.length}`)
      console.log(`   Success Rate: ${(pattern.success_rate * 100).toFixed(0)}%`)
      console.log(`   Avg Duration: ${(pattern.avg_duration_ms / 1000).toFixed(1)}s`)
      console.log()
    })
    
    const library = loadLibrary()
    console.log(`📊 Library Stats:`)
    console.log(`   Total Applications: ${library.total_applications}`)
    console.log(`   Total Successes: ${library.total_successes}`)
    console.log(`   Overall Success Rate: ${library.total_applications > 0 ? ((library.total_successes / library.total_applications) * 100).toFixed(0) : 0}%`)
    console.log()
    break
  }
  
  case 'show': {
    const patternId = process.argv[3]
    if (!patternId) {
      console.error('Usage: windsurf:patterns show <pattern-id>')
      process.exit(1)
    }
    
    const pattern = getPattern(patternId)
    if (!pattern) {
      console.error(`❌ Pattern ${patternId} not found`)
      process.exit(1)
    }
    
    console.log(`\n📋 Pattern: ${pattern.name}\n`)
    console.log(`ID: ${pattern.id}`)
    console.log(`Type: ${pattern.type}`)
    console.log(`Description: ${pattern.description}`)
    console.log(`Confidence: ${(pattern.confidence * 100).toFixed(0)}%`)
    console.log(`Success Rate: ${(pattern.success_rate * 100).toFixed(0)}%`)
    console.log(`Auto-Apply: ${shouldAutoApply(pattern.id) ? 'YES ⚡' : 'NO'}`)
    console.log(`\nSteps:`)
    pattern.steps.forEach((step, i) => {
      console.log(`${i + 1}. ${step.action}: ${step.description}`)
      if (step.command) {
        console.log(`   Command: ${step.command}`)
      }
    })
    console.log(`\nOutcomes: ${pattern.outcomes.length} applications`)
    if (pattern.outcomes.length > 0) {
      const recent = pattern.outcomes.slice(-5).reverse()
      console.log(`Recent:`)
      recent.forEach(outcome => {
        const status = outcome.result === 'success' ? '✅' : '❌'
        console.log(`   ${status} ${new Date(outcome.timestamp).toLocaleString()} (${(outcome.duration_ms / 1000).toFixed(1)}s)`)
      })
    }
    console.log()
    break
  }
  
  case 'init': {
    initializeCommonPatterns()
    break
  }
  
  case 'detect': {
    detectPatternsFromHistory()
    break
  }
  
  case 'record': {
    const patternId = process.argv[3]
    const result = process.argv[4] as 'success' | 'failure'
    const duration = parseInt(process.argv[5] || '0')
    
    if (!patternId || !result) {
      console.error('Usage: windsurf:patterns record <pattern-id> <success|failure> [duration-ms]')
      process.exit(1)
    }
    
    recordOutcome(patternId, result, duration)
    console.log(`✅ Recorded ${result} for pattern ${patternId}`)
    break
  }
  
  default:
    console.log(`
📚 Pattern Library Manager

Usage:
  npm run windsurf:patterns <command> [args]

Commands:
  list              - List all patterns with confidence scores
  show <pattern-id> - Show pattern details
  init              - Initialize common patterns
  detect            - Detect patterns from operation history
  record <pattern-id> <success|failure> [duration-ms]
                    - Record pattern application outcome

Examples:
  npm run windsurf:patterns init
  npm run windsurf:patterns list
  npm run windsurf:patterns show feature_migration
  npm run windsurf:patterns detect
  npm run windsurf:patterns record feature_migration success 45000

Pattern Confidence:
  < 50%: Low confidence - manual review required
  50-80%: Medium confidence - preview recommended
  80-90%: High confidence - ready for auto-suggest
  > 90%: Very high confidence - auto-apply enabled ⚡
`)
    break
}
