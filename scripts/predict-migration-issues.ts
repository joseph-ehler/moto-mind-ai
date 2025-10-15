#!/usr/bin/env tsx
/**
 * Predictive Issue Detector
 * 
 * Predicts migration issues based on:
 * 1. Historical patterns from past migrations
 * 2. AI analysis of current feature
 * 3. Pattern matching against known issues
 */

import * as fs from 'fs'
import * as path from 'path'
import { callClaude, parseClaudeJSON } from '../lib/ai/claude-client'

interface MigrationHistory {
  feature: string
  complexity: string
  actualDuration: number
  issuesEncountered?: Array<{
    type: string
    description: string
    phase: string
    resolution: string
  }>
}

interface EnhancedAnalysis {
  featureName: string
  complexityLevel: string
  aiInsights: {
    actualComplexity: string
    hiddenIssues: string[]
    internalImports?: {
      count: number
      files: string[]
    }
  }
}

interface PredictedIssue {
  issue: string
  probability: number // 0-1
  phase: string // which phase it's likely to occur
  mitigation: string
  basedOn: 'history' | 'ai' | 'pattern'
}

interface IssuePrediction {
  feature: string
  historicalPatterns: Array<{
    issue: string
    frequency: number
    occurrences: number
  }>
  predictedIssues: PredictedIssue[]
  confidence: number
  dataPoints: number
}

function loadHistory(): MigrationHistory[] {
  const historyPath = path.join(process.cwd(), 'data', 'migration-history.json')
  
  if (!fs.existsSync(historyPath)) {
    return []
  }
  
  try {
    return JSON.parse(fs.readFileSync(historyPath, 'utf-8'))
  } catch {
    return []
  }
}

function loadEnhancedAnalysis(feature: string): EnhancedAnalysis | null {
  const aiPath = path.join(process.cwd(), `.migration-analysis-ai-${feature}.json`)
  
  if (fs.existsSync(aiPath)) {
    return JSON.parse(fs.readFileSync(aiPath, 'utf-8'))
  }
  
  // Fallback to basic analysis
  const basicPath = path.join(process.cwd(), `.migration-analysis-${feature}.json`)
  if (fs.existsSync(basicPath)) {
    const basic = JSON.parse(fs.readFileSync(basicPath, 'utf-8'))
    return {
      featureName: basic.featureName,
      complexityLevel: basic.complexityLevel,
      aiInsights: {
        actualComplexity: basic.complexityLevel,
        hiddenIssues: []
      }
    }
  }
  
  return null
}

function findHistoricalPatterns(
  history: MigrationHistory[],
  analysis: EnhancedAnalysis
): Array<{ issue: string; frequency: number; occurrences: number }> {
  if (history.length === 0) {
    return []
  }
  
  // Find similar features
  const similar = history.filter(h => 
    h.complexity === analysis.complexityLevel ||
    h.complexity === analysis.aiInsights.actualComplexity
  )
  
  // Aggregate all issues
  const allIssues = similar.flatMap(h => h.issuesEncountered || [])
  
  // Count frequencies
  const issueCounts = new Map<string, number>()
  allIssues.forEach(issue => {
    const key = issue.type || issue.description
    issueCounts.set(key, (issueCounts.get(key) || 0) + 1)
  })
  
  // Convert to array and calculate frequencies
  return Array.from(issueCounts.entries())
    .map(([issue, count]) => ({
      issue,
      occurrences: count,
      frequency: count / (similar.length || 1)
    }))
    .filter(p => p.frequency > 0.2) // Only show issues that happened in 20%+ of migrations
    .sort((a, b) => b.frequency - a.frequency)
}

async function getAIPredictions(
  analysis: EnhancedAnalysis,
  historicalPatterns: Array<{ issue: string; frequency: number; occurrences: number }>
): Promise<PredictedIssue[]> {
  
  const historicalContext = historicalPatterns.length > 0 
    ? historicalPatterns.map(p => 
        `- ${p.issue} (${(p.frequency * 100).toFixed(0)}% of similar migrations)`
      ).join('\n')
    : 'No historical data available'
  
  const prompt = `Predict migration issues for this feature:

FEATURE: ${analysis.featureName}
COMPLEXITY: ${analysis.aiInsights.actualComplexity.toUpperCase()}

AI-DETECTED ISSUES:
${analysis.aiInsights.hiddenIssues.length > 0 
  ? analysis.aiInsights.hiddenIssues.map(i => `- ${i}`).join('\n')
  : 'None detected'}

${analysis.aiInsights.internalImports && analysis.aiInsights.internalImports.count > 0
  ? `INTERNAL IMPORTS: ${analysis.aiInsights.internalImports.count} files with relative imports`
  : ''}

HISTORICAL PATTERNS (from past migrations):
${historicalContext}

MIGRATION PHASES:
1. Tests - Creating test infrastructure
2. Components - Moving UI components
3. Domain - Extracting business logic
4. Validation - Final checks

Predict specific issues likely to occur during this migration. Be concrete and actionable.

Respond with JSON array:
[
  {
    "issue": "specific issue description",
    "probability": 0.0-1.0,
    "phase": "tests|components|domain|validation",
    "mitigation": "specific action to prevent/fix"
  }
]

Focus on migration-specific issues like:
- Import resolution failures
- Type errors from moved files
- Circular dependencies
- Missing exports
- Build failures
- Test failures after moving`

  try {
    const response = await callClaude({
      model: 'claude-sonnet-4-20250514',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2000,
      temperature: 0.2
    })
    
    const predictions = parseClaudeJSON<PredictedIssue[]>(response)
    
    // Mark as AI-based
    predictions.forEach(p => p.basedOn = 'ai')
    
    return predictions
  } catch (error) {
    console.error('AI prediction failed:', error)
    return []
  }
}

function generatePatternBasedPredictions(
  analysis: EnhancedAnalysis,
  historicalPatterns: Array<{ issue: string; frequency: number; occurrences: number }>
): PredictedIssue[] {
  const predictions: PredictedIssue[] = []
  
  // Pattern 1: Internal imports always cause issues in Phase 2
  if (analysis.aiInsights.internalImports && analysis.aiInsights.internalImports.count > 5) {
    predictions.push({
      issue: `${analysis.aiInsights.internalImports.count} files with internal imports will need refactoring`,
      probability: 0.95,
      phase: 'components',
      mitigation: 'Create barrel exports (index.ts) or convert to absolute imports before moving',
      basedOn: 'pattern'
    })
  }
  
  // Pattern 2: High complexity features often have type issues
  if (analysis.aiInsights.actualComplexity === 'high') {
    predictions.push({
      issue: 'Type errors from circular dependencies or missing exports',
      probability: 0.7,
      phase: 'components',
      mitigation: 'Export all types from domain/types.ts before moving components',
      basedOn: 'pattern'
    })
  }
  
  // Pattern 3: Add historical patterns as predictions
  historicalPatterns.forEach(pattern => {
    if (pattern.frequency > 0.5) { // Happened in 50%+ of cases
      predictions.push({
        issue: pattern.issue,
        probability: pattern.frequency,
        phase: 'components', // Most historical issues are in component phase
        mitigation: 'See historical resolutions',
        basedOn: 'history'
      })
    }
  })
  
  return predictions
}

async function predict(feature: string): Promise<IssuePrediction> {
  console.log('\n🔮 PREDICTIVE ISSUE DETECTION\n')
  
  // Step 1: Load analysis
  console.log('📊 Loading feature analysis...')
  const analysis = loadEnhancedAnalysis(feature)
  if (!analysis) {
    throw new Error(`No analysis found for ${feature}. Run: npm run migrate:analyze ${feature}`)
  }
  
  // Step 2: Load history
  console.log('📚 Loading migration history...')
  const history = loadHistory()
  console.log(`   Found ${history.length} past migrations`)
  
  // Step 3: Find historical patterns
  console.log('🔍 Analyzing historical patterns...')
  const historicalPatterns = findHistoricalPatterns(history, analysis)
  console.log(`   Found ${historicalPatterns.length} common patterns`)
  
  // Step 4: Get AI predictions
  console.log('🤖 Requesting AI predictions...')
  const aiPredictions = await getAIPredictions(analysis, historicalPatterns)
  console.log(`   AI predicted ${aiPredictions.length} potential issues`)
  
  // Step 5: Generate pattern-based predictions
  console.log('🎯 Generating pattern-based predictions...')
  const patternPredictions = generatePatternBasedPredictions(analysis, historicalPatterns)
  console.log(`   Pattern matching found ${patternPredictions.length} likely issues`)
  
  // Combine and deduplicate
  const allPredictions = [...aiPredictions, ...patternPredictions]
  const uniquePredictions = Array.from(
    new Map(allPredictions.map(p => [p.issue, p])).values()
  ).sort((a, b) => b.probability - a.probability)
  
  const prediction: IssuePrediction = {
    feature,
    historicalPatterns,
    predictedIssues: uniquePredictions,
    confidence: history.length >= 3 ? 0.8 : 0.5,
    dataPoints: history.length
  }
  
  // Save predictions
  const outputPath = path.join(process.cwd(), `.migration-predictions-${feature}.json`)
  fs.writeFileSync(outputPath, JSON.stringify(prediction, null, 2))
  
  return prediction
}

function printPredictions(prediction: IssuePrediction) {
  console.log('\n' + '='.repeat(60))
  console.log('🔮 PREDICTED MIGRATION ISSUES')
  console.log('='.repeat(60))
  console.log()
  console.log(`📦 Feature: ${prediction.feature}`)
  console.log(`🎯 Confidence: ${(prediction.confidence * 100).toFixed(0)}% (based on ${prediction.dataPoints} past migrations)`)
  console.log()
  
  if (prediction.historicalPatterns.length > 0) {
    console.log('📚 HISTORICAL PATTERNS:')
    prediction.historicalPatterns.forEach(pattern => {
      console.log(`   - ${pattern.issue}`)
      console.log(`     Frequency: ${(pattern.frequency * 100).toFixed(0)}% (${pattern.occurrences} times)`)
    })
    console.log()
  }
  
  if (prediction.predictedIssues.length > 0) {
    console.log('⚠️  PREDICTED ISSUES (sorted by probability):')
    console.log()
    
    prediction.predictedIssues.forEach((issue, idx) => {
      const probIcon = issue.probability > 0.7 ? '🚨' : issue.probability > 0.4 ? '⚠️' : '💡'
      const sourceIcon = issue.basedOn === 'ai' ? '🤖' : issue.basedOn === 'history' ? '📚' : '🎯'
      
      console.log(`${idx + 1}. ${probIcon} ${issue.issue}`)
      console.log(`   Probability: ${(issue.probability * 100).toFixed(0)}% | Phase: ${issue.phase} | Source: ${sourceIcon}`)
      console.log(`   Mitigation: ${issue.mitigation}`)
      console.log()
    })
  } else {
    console.log('✅ No major issues predicted!')
    console.log()
  }
  
  if (prediction.dataPoints < 3) {
    console.log('💡 NOTE: Limited historical data (only ${prediction.dataPoints} migrations)')
    console.log('   Predictions will improve as more migrations complete')
    console.log()
  }
  
  console.log('💾 Predictions saved to:')
  console.log(`   .migration-predictions-${prediction.feature}.json`)
  console.log()
  console.log('='.repeat(60))
  console.log()
}

// CLI
const feature = process.argv[2]

if (!feature) {
  console.error('❌ Usage: npm run migrate:predict <feature-name>')
  console.error('   Example: npm run migrate:predict vision')
  process.exit(1)
}

predict(feature)
  .then(printPredictions)
  .catch(error => {
    console.error('❌ Error:', error.message)
    process.exit(1)
  })
