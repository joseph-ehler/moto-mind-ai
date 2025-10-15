#!/usr/bin/env tsx
/**
 * Migration Orchestrator
 * 
 * Single command that runs the entire migration flow:
 * 1. Capture baseline
 * 2. Analyze complexity
 * 3. Generate checklist
 * 4. Start progress tracking
 * 5. Monitor and guide
 */

import * as fs from 'fs'
import * as path from 'path'
import { execSync } from 'child_process'
import { getContextBridge } from '../lib/ai/context-bridge'

interface MigrationSession {
  feature: string
  startTime: Date
  baseline: SystemState
  analysis: FeatureAnalysis
  checklistPath: string
  sessionId: string
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

interface FeatureAnalysis {
  featureName: string
  componentCount: number
  totalFiles: number
  complexityLevel: 'low' | 'medium' | 'high'
  estimatedTime: string
  similarTo: string
}

async function captureBaseline(): Promise<SystemState> {
  console.log('📊 Capturing baseline state...')
  
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
    violations: 0, // Will be filled by arch validator
    features: {
      migrated: migratedFeatures,
      remaining: remainingFeatures
    }
  }
}

async function analyzeFeature(featureName: string): Promise<FeatureAnalysis> {
  console.log(`🔍 Analyzing ${featureName} complexity...`)
  
  // Run existing analyzer
  const analysisPath = path.join(process.cwd(), `.migration-analysis-${featureName}.json`)
  
  // Clean up old analysis if exists
  if (fs.existsSync(analysisPath)) {
    fs.unlinkSync(analysisPath)
  }
  
  // Run analyzer
  execSync(`npm run migrate:analyze ${featureName}`, { stdio: 'inherit' })
  
  // Read results
  if (!fs.existsSync(analysisPath)) {
    throw new Error(`Analysis failed for ${featureName}`)
  }
  
  const analysis = JSON.parse(fs.readFileSync(analysisPath, 'utf-8'))
  return analysis
}

async function generateChecklist(featureName: string): Promise<string> {
  console.log('📋 Generating migration checklist...')
  
  // Run existing checklist generator
  execSync(`npm run migrate:checklist ${featureName}`, { stdio: 'inherit' })
  
  const checklistPath = path.join(
    process.cwd(),
    'docs',
    `${featureName.toUpperCase()}-MIGRATION-CHECKLIST.md`
  )
  
  if (!fs.existsSync(checklistPath)) {
    throw new Error(`Checklist generation failed for ${featureName}`)
  }
  
  return checklistPath
}

function createSession(
  feature: string,
  baseline: SystemState,
  analysis: FeatureAnalysis,
  checklistPath: string
): MigrationSession {
  const session: MigrationSession = {
    feature,
    startTime: new Date(),
    baseline,
    analysis,
    checklistPath,
    sessionId: `migration-${feature}-${Date.now()}`
  }
  
  // Save session
  const sessionPath = path.join(process.cwd(), '.migration-session.json')
  fs.writeFileSync(sessionPath, JSON.stringify(session, null, 2))
  
  return session
}

function printSummary(session: MigrationSession) {
  const { feature, analysis, checklistPath, baseline } = session
  
  console.log('\n' + '='.repeat(60))
  console.log('🚀  MIGRATION SESSION STARTED')
  console.log('='.repeat(60))
  console.log()
  console.log(`📦  Feature: ${feature}`)
  console.log(`📊  Complexity: ${analysis.complexityLevel.toUpperCase()}`)
  console.log(`⏱️   Estimated Time: ${analysis.estimatedTime}`)
  console.log(`🎯  Similar To: ${analysis.similarTo}`)
  console.log()
  console.log('📈  Baseline:')
  console.log(`    Tests: ${baseline.tests}`)
  console.log(`    Migrated Features: ${baseline.features.migrated.length}`)
  console.log(`    Remaining Features: ${baseline.features.remaining.length}`)
  console.log()
  console.log('📋  Next Steps:')
  console.log(`    1. Review checklist: code ${checklistPath}`)
  console.log(`    2. Follow step-by-step guide`)
  console.log(`    3. System will auto-track progress via git commits`)
  console.log()
  console.log('💡  Tips:')
  console.log(`    - Commit after each phase`)
  console.log(`    - Use format: "feat: migrate ${feature} [phase]"`)
  console.log(`    - Pre-commit hooks will track progress automatically`)
  console.log()
  console.log('='.repeat(60))
  console.log()
}

async function orchestrateWithAI(featureName: string, useCodex: boolean = false) {
  try {
    console.log('\n🚀 MIGRATION ORCHESTRATOR (AI-ENHANCED)\n')
    
    // Step 0: Initialize context bridge for Codex integration
    if (useCodex) {
      const bridge = getContextBridge()
      await bridge.initialize(`Migrate ${featureName} feature`)
      await bridge.updateFromWindsurf({
        task: `Migrate ${featureName}`,
        feature: featureName,
        phase: 'analysis',
        status: 'Starting AI-enhanced migration'
      })
      console.log('🔗 Context bridge initialized for Windsurf ↔ Codex collaboration\n')
    }
    
    // Step 1: Capture baseline
    const baseline = await captureBaseline()
    
    // Step 2: Template analysis
    const analysis = await analyzeFeature(featureName)
    
    // Step 3: AI-enhanced analysis
    console.log('\n🤖 Running AI-enhanced analysis...')
    try {
      execSync(`npm run migrate:analyze:ai ${featureName}`, { stdio: 'inherit' })
    } catch (error) {
      console.warn('⚠️  AI analysis failed, falling back to template analysis')
    }
    
    // Step 4: Predict issues
    console.log('\n🔮 Predicting potential issues...')
    try {
      execSync(`npm run migrate:predict ${featureName}`, { stdio: 'inherit' })
    } catch (error) {
      console.warn('⚠️  Issue prediction failed, continuing without predictions')
    }
    
    // Step 5: Generate adaptive checklist
    console.log('\n📋 Generating AI-enhanced checklist...')
    let checklistPath: string
    try {
      execSync(`npm run migrate:checklist:ai ${featureName}`, { stdio: 'inherit' })
      checklistPath = path.join(
        process.cwd(),
        'docs',
        `${featureName.toUpperCase()}-MIGRATION-CHECKLIST-AI.md`
      )
    } catch (error) {
      console.warn('⚠️  Adaptive checklist failed, using template checklist')
      checklistPath = await generateChecklist(featureName)
    }
    
    // Step 6: Create session
    const session = createSession(featureName, baseline, analysis, checklistPath)
    
    // Step 7: Print summary
    printSummary(session)
    
    console.log('✅ AI-enhanced migration session initialized!')
    console.log(`💾 Session saved to: .migration-session.json`)
    console.log()
    console.log(`🎯 Ready to start Phase 1: Test Infrastructure`)
    console.log()
    
  } catch (error) {
    console.error('❌ Migration orchestration failed:', error)
    process.exit(1)
  }
}

async function orchestrate(featureName: string, useAI: boolean = false, useCodex: boolean = false) {
  if (useAI) {
    return orchestrateWithAI(featureName, useCodex)
  }
  
  try {
    console.log('\n🚀 MIGRATION ORCHESTRATOR\n')
    
    // Step 1: Capture baseline
    const baseline = await captureBaseline()
    
    // Step 2: Analyze feature
    const analysis = await analyzeFeature(featureName)
    
    // Step 3: Generate checklist
    const checklistPath = await generateChecklist(featureName)
    
    // Step 4: Create session
    const session = createSession(featureName, baseline, analysis, checklistPath)
    
    // Step 5: Print summary
    printSummary(session)
    
    console.log('✅ Migration session initialized!')
    console.log(`💾 Session saved to: .migration-session.json`)
    console.log()
    console.log(`🎯 Ready to start Phase 1: Test Infrastructure`)
    console.log()
    console.log(`💡 Tip: Use 'npm run migrate:ai ${featureName}' for AI-enhanced analysis`)
    console.log()
    
  } catch (error) {
    console.error('❌ Migration orchestration failed:', error)
    process.exit(1)
  }
}

// CLI
const args = process.argv.slice(2)
const useAI = args.includes('--ai')
const useCodex = args.includes('--codex')
const featureName = args.find(arg => !arg.startsWith('--'))

if (!featureName) {
  console.error('❌ Usage: npm run migrate <feature-name> [--ai] [--codex]')
  console.error('   Example: npm run migrate vision')
  console.error('   Example: npm run migrate vision --ai           # AI-enhanced')
  console.error('   Example: npm run migrate vision --ai --codex   # AI + Codex collaboration')
  process.exit(1)
}

// If using Codex, AI mode is required
if (useCodex && !useAI) {
  console.error('❌ --codex requires --ai mode')
  console.error('   Use: npm run migrate vision --ai --codex')
  process.exit(1)
}

orchestrate(featureName, useAI, useCodex)
