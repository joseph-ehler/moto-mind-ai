#!/usr/bin/env tsx
/**
 * Self-Improving Estimates
 * 
 * Uses migration history to improve future time estimates.
 * Updates complexity heuristics based on actual data.
 */

import * as fs from 'fs'
import * as path from 'path'
import { getMigrationHistory } from '../lib/migration/history-db'

interface ImprovedEstimate {
  complexity: string
  estimate: string
  basedOn: number
  confidence: 'low' | 'medium' | 'high'
  avgDuration: number
  stdDev: number
  range: { min: number; max: number }
}

interface EstimateImprovements {
  generatedAt: Date
  dataPoints: number
  estimates: ImprovedEstimate[]
  changesSuggested: boolean
  recommendations: string[]
}

function calculateImprovedEstimates(): ImprovedEstimate[] {
  const history = getMigrationHistory()
  const complexityLevels = ['low', 'medium', 'high']
  
  return complexityLevels.map(complexity => {
    const records = history.getByComplexity(complexity)
    
    if (records.length === 0) {
      // No data - use defaults
      const defaults = {
        low: '0.5-1 hour',
        medium: '1-1.5 hours',
        high: '1.5-2 hours'
      }
      
      return {
        complexity,
        estimate: defaults[complexity as keyof typeof defaults],
        basedOn: 0,
        confidence: 'low',
        avgDuration: 0,
        stdDev: 0,
        range: { min: 0, max: 0 }
      }
    }
    
    // Calculate stats
    const avgDuration = history.getAverageDuration(complexity)
    const stdDev = history.getStdDevDuration(complexity)
    
    // Calculate range (avg ± stdDev, converted to hours)
    const minHours = Math.max(0.25, (avgDuration - stdDev) / 60)
    const maxHours = (avgDuration + stdDev) / 60
    
    // Round to nice values
    const roundedMin = Math.round(minHours * 4) / 4 // Round to nearest 0.25
    const roundedMax = Math.round(maxHours * 4) / 4
    
    // Format estimate
    const estimate = `${roundedMin}-${roundedMax} hour${roundedMax !== 1 ? 's' : ''}`
    
    // Determine confidence
    let confidence: 'low' | 'medium' | 'high'
    if (records.length >= 5) {
      confidence = 'high'
    } else if (records.length >= 3) {
      confidence = 'medium'
    } else {
      confidence = 'low'
    }
    
    return {
      complexity,
      estimate,
      basedOn: records.length,
      confidence,
      avgDuration,
      stdDev,
      range: { min: minHours, max: maxHours }
    }
  })
}

function compareWithCurrent(): { current: any; improved: any; changes: string[] } {
  const analysisPath = path.join(process.cwd(), 'scripts', 'analyze-feature-complexity.ts')
  
  if (!fs.existsSync(analysisPath)) {
    return { current: {}, improved: {}, changes: [] }
  }
  
  // Read current estimates from the code (simple regex parsing)
  const code = fs.readFileSync(analysisPath, 'utf-8')
  
  // Extract current time estimates (very simplified)
  const currentEstimates = {
    low: '0.5-1 hour',
    medium: '1-1.5 hours',
    high: '1.5-2 hours'
  }
  
  const improved = calculateImprovedEstimates()
  const changes: string[] = []
  
  improved.forEach(est => {
    const current = currentEstimates[est.complexity as keyof typeof currentEstimates]
    if (est.basedOn >= 3 && est.estimate !== current) {
      changes.push(
        `${est.complexity}: ${current} → ${est.estimate} (based on ${est.basedOn} migrations, ${est.confidence} confidence)`
      )
    }
  })
  
  return { current: currentEstimates, improved, changes }
}

function generateRecommendations(improvements: EstimateImprovements): string[] {
  const recs: string[] = []
  
  if (improvements.dataPoints < 10) {
    recs.push(`Limited data (${improvements.dataPoints} migrations) - continue collecting before making major changes`)
  }
  
  improvements.estimates.forEach(est => {
    if (est.confidence === 'high' && est.stdDev > 20) {
      recs.push(`${est.complexity}: High variance (σ=${est.stdDev.toFixed(0)}min) suggests need for better complexity indicators`)
    }
    
    if (est.confidence === 'low') {
      recs.push(`${est.complexity}: Only ${est.basedOn} samples - need more data for reliable estimates`)
    }
  })
  
  if (improvements.changesSuggested) {
    recs.push('Suggested estimate changes detected - review and apply if confident in data')
  }
  
  return recs
}

function updateAnalyzer(improvements: ImprovedEstimate[]) {
  console.log('\n💡 To update analyzer with improved estimates:')
  console.log()
  console.log('Edit scripts/analyze-feature-complexity.ts:')
  console.log()
  
  improvements.forEach(est => {
    if (est.basedOn >= 3) {
      console.log(`// ${est.complexity.toUpperCase()} (${est.basedOn} samples, ${est.confidence} confidence)`)
      console.log(`estimatedTime = '${est.estimate}'`)
      console.log()
    }
  })
  
  console.log('Or wait for more data if confidence is low.')
  console.log()
}

function printReport(improvements: EstimateImprovements, comparison: any) {
  console.log('\n' + '='.repeat(60))
  console.log('📈 SELF-IMPROVING ESTIMATES REPORT')
  console.log('='.repeat(60))
  console.log()
  console.log(`📊 Based on: ${improvements.dataPoints} migrations`)
  console.log(`📅 Generated: ${improvements.generatedAt.toLocaleString()}`)
  console.log()
  
  console.log('ESTIMATED TIMES BY COMPLEXITY:')
  console.log()
  
  improvements.estimates.forEach(est => {
    const icon = est.confidence === 'high' ? '✅' : est.confidence === 'medium' ? '⚠️' : '💡'
    console.log(`${icon} ${est.complexity.toUpperCase()}:`)
    console.log(`   Estimate: ${est.estimate}`)
    console.log(`   Samples: ${est.basedOn}`)
    console.log(`   Confidence: ${est.confidence}`)
    if (est.basedOn > 0) {
      console.log(`   Avg: ${est.avgDuration.toFixed(1)} min`)
      console.log(`   StdDev: ${est.stdDev.toFixed(1)} min`)
    }
    console.log()
  })
  
  if (comparison.changes.length > 0) {
    console.log('🔄 SUGGESTED CHANGES:')
    comparison.changes.forEach((change: string) => {
      console.log(`   ${change}`)
    })
    console.log()
  } else {
    console.log('✅ Current estimates align with data - no changes needed')
    console.log()
  }
  
  if (improvements.recommendations.length > 0) {
    console.log('💡 RECOMMENDATIONS:')
    improvements.recommendations.forEach(rec => {
      console.log(`   - ${rec}`)
    })
    console.log()
  }
  
  console.log('='.repeat(60))
  console.log()
}

function improve() {
  console.log('\n📈 SELF-IMPROVING ESTIMATES\n')
  
  const history = getMigrationHistory()
  const dataPoints = history.count()
  
  console.log(`📊 Analyzing ${dataPoints} migrations...\n`)
  
  if (dataPoints === 0) {
    console.log('❌ No migration history found')
    console.log('   Complete at least one migration first')
    process.exit(1)
  }
  
  // Calculate improved estimates
  console.log('🔍 Calculating improved estimates...')
  const improved = calculateImprovedEstimates()
  
  // Compare with current
  console.log('📊 Comparing with current estimates...')
  const comparison = compareWithCurrent()
  
  const improvements: EstimateImprovements = {
    generatedAt: new Date(),
    dataPoints,
    estimates: improved,
    changesSuggested: comparison.changes.length > 0,
    recommendations: []
  }
  
  // Generate recommendations
  improvements.recommendations = generateRecommendations(improvements)
  
  // Print report
  printReport(improvements, comparison)
  
  // Show update instructions if changes suggested
  if (improvements.changesSuggested) {
    updateAnalyzer(improved)
  }
  
  console.log('✅ Estimate improvement analysis complete!')
  console.log()
}

// CLI
improve()
