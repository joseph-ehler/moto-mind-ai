#!/usr/bin/env tsx
/**
 * Automated Pattern Detection
 * 
 * Automatically discovers patterns from migration history:
 * - Complexity indicators (what predicts complexity?)
 * - Common issues (what goes wrong frequently?)
 * - Time accuracy (how good are our estimates?)
 * - Success factors (what makes migrations successful?)
 * 
 * Updates .windsurf-guidance.json with learnings.
 */

import * as fs from 'fs'
import * as path from 'path'
import { getMigrationHistory } from '../lib/migration/history-db'

interface ComplexityIndicator {
  indicator: string
  correlation: number
  samples: number
  evidence: string
}

interface CommonIssue {
  type: string
  frequency: number
  phase: string
  solution: string
  occurrences: number
}

interface TimeAccuracy {
  avgVariance: number
  stdDev: number
  overestimates: number
  underestimates: number
  accurate: number
  recommendations: string[]
}

interface PatternReport {
  generatedAt: Date
  dataPoints: number
  complexityIndicators: ComplexityIndicator[]
  commonIssues: CommonIssue[]
  timeAccuracy: TimeAccuracy
  successFactors: string[]
  recommendations: string[]
}

function analyzeComplexityIndicators(): ComplexityIndicator[] {
  const history = getMigrationHistory()
  const records = history.getAll()
  
  if (records.length < 3) {
    return []
  }
  
  const indicators: ComplexityIndicator[] = []
  
  // Indicator 1: Component count
  const componentCorrelation = calculateCorrelation(
    records.map(r => r.componentsMigrated),
    records.map(r => r.actualDuration)
  )
  
  if (Math.abs(componentCorrelation) > 0.5) {
    indicators.push({
      indicator: 'componentCount',
      correlation: componentCorrelation,
      samples: records.length,
      evidence: `${(componentCorrelation * 100).toFixed(0)}% correlation between component count and migration time`
    })
  }
  
  // Indicator 2: Tests added (indicates domain complexity)
  const testCorrelation = calculateCorrelation(
    records.map(r => r.testsAdded),
    records.map(r => r.actualDuration)
  )
  
  if (Math.abs(testCorrelation) > 0.5) {
    indicators.push({
      indicator: 'testsAdded',
      correlation: testCorrelation,
      samples: records.length,
      evidence: `${(testCorrelation * 100).toFixed(0)}% correlation between tests added and migration time`
    })
  }
  
  // Indicator 3: Commits (indicates iteration/issues)
  const commitCorrelation = calculateCorrelation(
    records.map(r => r.totalCommits),
    records.map(r => r.actualDuration)
  )
  
  if (Math.abs(commitCorrelation) > 0.5) {
    indicators.push({
      indicator: 'commitCount',
      correlation: commitCorrelation,
      samples: records.length,
      evidence: `${(commitCorrelation * 100).toFixed(0)}% correlation between commit count and migration time`
    })
  }
  
  return indicators.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation))
}

function analyzeCommonIssues(): CommonIssue[] {
  const history = getMigrationHistory()
  const commonIssues = history.getCommonIssues()
  
  return commonIssues
    .filter(i => i.frequency > 0.2) // Only issues in 20%+ of migrations
    .map(i => ({
      type: i.type,
      frequency: i.frequency,
      phase: 'components', // Most issues are in components phase
      solution: i.resolutions[0] || 'See migration history',
      occurrences: i.count
    }))
}

function analyzeTimeAccuracy(): TimeAccuracy {
  const history = getMigrationHistory()
  const records = history.getAll()
  
  if (records.length === 0) {
    return {
      avgVariance: 0,
      stdDev: 0,
      overestimates: 0,
      underestimates: 0,
      accurate: 0,
      recommendations: []
    }
  }
  
  const variances = records.map(r => r.variance)
  const avgVariance = variances.reduce((sum, v) => sum + v, 0) / variances.length
  const stdDev = Math.sqrt(
    variances.reduce((sum, v) => sum + Math.pow(v - avgVariance, 2), 0) / variances.length
  )
  
  const overestimates = records.filter(r => r.variance < -10).length
  const underestimates = records.filter(r => r.variance > 10).length
  const accurate = records.filter(r => Math.abs(r.variance) <= 10).length
  
  const recommendations: string[] = []
  
  if (Math.abs(avgVariance) > 15) {
    recommendations.push('Time estimates are consistently off by >15 min')
    recommendations.push('Consider revising complexity multipliers')
  }
  
  if (stdDev > 20) {
    recommendations.push('High variance in estimates (σ > 20 min)')
    recommendations.push('Add more complexity factors or collect more data')
  }
  
  if (underestimates > overestimates * 1.5) {
    recommendations.push('Consistently underestimating (need more buffer time)')
  } else if (overestimates > underestimates * 1.5) {
    recommendations.push('Consistently overestimating (can reduce estimates)')
  }
  
  return {
    avgVariance,
    stdDev,
    overestimates,
    underestimates,
    accurate,
    recommendations
  }
}

function identifySuccessFactors(): string[] {
  const history = getMigrationHistory()
  const successful = history.getSuccessful()
  const failed = history.getAll().filter(r => !r.buildPassing || !r.allTestsPassing)
  
  const factors: string[] = []
  
  if (successful.length === 0) return factors
  
  // Factor 1: Test coverage
  const successfulAvgTests = successful.reduce((sum, r) => sum + r.testsAdded, 0) / successful.length
  const failedAvgTests = failed.length > 0 
    ? failed.reduce((sum, r) => sum + r.testsAdded, 0) / failed.length 
    : 0
  
  if (successfulAvgTests > failedAvgTests * 1.3) {
    factors.push(`Successful migrations have ${(successfulAvgTests / (failedAvgTests || 1)).toFixed(1)}x more tests`)
  }
  
  // Factor 2: Commit frequency
  const successfulAvgCommits = successful.reduce((sum, r) => sum + r.totalCommits, 0) / successful.length
  const failedAvgCommits = failed.length > 0
    ? failed.reduce((sum, r) => sum + r.totalCommits, 0) / failed.length
    : 0
  
  if (successfulAvgCommits > failedAvgCommits * 1.2) {
    factors.push('Frequent commits correlate with success')
  }
  
  // Factor 3: All successful migrations so far
  if (failed.length === 0) {
    factors.push('100% success rate maintained')
  }
  
  return factors
}

function calculateCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length < 2) return 0
  
  const n = x.length
  const sumX = x.reduce((a, b) => a + b, 0)
  const sumY = y.reduce((a, b) => a + b, 0)
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0)
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0)
  const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0)
  
  const numerator = n * sumXY - sumX * sumY
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY))
  
  if (denominator === 0) return 0
  
  return numerator / denominator
}

function generateRecommendations(report: PatternReport): string[] {
  const recommendations: string[] = []
  
  // Based on data points
  if (report.dataPoints < 5) {
    recommendations.push(`Limited data (only ${report.dataPoints} migrations) - patterns will improve with more examples`)
  } else if (report.dataPoints >= 10) {
    recommendations.push(`Good data volume (${report.dataPoints} migrations) - patterns are statistically significant`)
  }
  
  // Based on complexity indicators
  if (report.complexityIndicators.length === 0) {
    recommendations.push('Need more migrations to detect complexity patterns')
  } else {
    const topIndicator = report.complexityIndicators[0]
    recommendations.push(`Primary complexity driver: ${topIndicator.indicator} (${(Math.abs(topIndicator.correlation) * 100).toFixed(0)}% correlation)`)
  }
  
  // Based on common issues
  if (report.commonIssues.length > 0) {
    const topIssue = report.commonIssues[0]
    recommendations.push(`Watch for: ${topIssue.type} (occurs in ${(topIssue.frequency * 100).toFixed(0)}% of migrations)`)
  }
  
  // Based on time accuracy
  if (report.timeAccuracy.recommendations.length > 0) {
    recommendations.push(...report.timeAccuracy.recommendations)
  }
  
  return recommendations
}

function updateGuidance(report: PatternReport) {
  const guidancePath = path.join(process.cwd(), '.windsurf-guidance.json')
  
  if (!fs.existsSync(guidancePath)) {
    console.warn('⚠️  .windsurf-guidance.json not found, skipping update')
    return
  }
  
  const guidance = JSON.parse(fs.readFileSync(guidancePath, 'utf-8'))
  
  // Update with learnings
  if (!guidance.featureMigrationPatterns.learnings) {
    guidance.featureMigrationPatterns.learnings = {}
  }
  
  guidance.featureMigrationPatterns.learnings = {
    lastUpdated: report.generatedAt,
    dataPoints: report.dataPoints,
    complexityIndicators: report.complexityIndicators.map(i => ({
      factor: i.indicator,
      correlation: i.correlation,
      evidence: i.evidence
    })),
    commonIssues: report.commonIssues.map(i => ({
      type: i.type,
      frequency: i.frequency,
      mitigation: i.solution
    })),
    timeAccuracy: {
      avgError: report.timeAccuracy.avgVariance,
      recommendations: report.timeAccuracy.recommendations
    },
    recommendations: report.recommendations
  }
  
  fs.writeFileSync(guidancePath, JSON.stringify(guidance, null, 2))
  console.log('✅ Updated .windsurf-guidance.json with learnings')
}

function printReport(report: PatternReport) {
  console.log('\n' + '='.repeat(60))
  console.log('🔍 PATTERN DETECTION REPORT')
  console.log('='.repeat(60))
  console.log()
  console.log(`📊 Data Points: ${report.dataPoints} migrations`)
  console.log(`📅 Generated: ${report.generatedAt.toLocaleString()}`)
  console.log()
  
  if (report.complexityIndicators.length > 0) {
    console.log('🎯 COMPLEXITY INDICATORS:')
    report.complexityIndicators.forEach((ind, idx) => {
      console.log(`${idx + 1}. ${ind.indicator}`)
      console.log(`   Correlation: ${(ind.correlation * 100).toFixed(0)}%`)
      console.log(`   Evidence: ${ind.evidence}`)
    })
    console.log()
  } else {
    console.log('🎯 COMPLEXITY INDICATORS: Need more data (3+ migrations)')
    console.log()
  }
  
  if (report.commonIssues.length > 0) {
    console.log('🐛 COMMON ISSUES:')
    report.commonIssues.forEach((issue, idx) => {
      console.log(`${idx + 1}. ${issue.type}`)
      console.log(`   Frequency: ${(issue.frequency * 100).toFixed(0)}% (${issue.occurrences} times)`)
      console.log(`   Solution: ${issue.solution}`)
    })
    console.log()
  } else {
    console.log('🐛 COMMON ISSUES: None detected yet')
    console.log()
  }
  
  console.log('⏱️  TIME ACCURACY:')
  console.log(`   Average Variance: ${report.timeAccuracy.avgVariance > 0 ? '+' : ''}${report.timeAccuracy.avgVariance.toFixed(1)} min`)
  console.log(`   Std Deviation: ${report.timeAccuracy.stdDev.toFixed(1)} min`)
  console.log(`   Overestimates: ${report.timeAccuracy.overestimates}`)
  console.log(`   Underestimates: ${report.timeAccuracy.underestimates}`)
  console.log(`   Accurate (±10min): ${report.timeAccuracy.accurate}`)
  console.log()
  
  if (report.successFactors.length > 0) {
    console.log('✨ SUCCESS FACTORS:')
    report.successFactors.forEach(factor => {
      console.log(`   - ${factor}`)
    })
    console.log()
  }
  
  if (report.recommendations.length > 0) {
    console.log('💡 RECOMMENDATIONS:')
    report.recommendations.forEach(rec => {
      console.log(`   - ${rec}`)
    })
    console.log()
  }
  
  console.log('='.repeat(60))
  console.log()
}

function detect() {
  console.log('\n🔍 AUTOMATED PATTERN DETECTION\n')
  
  const history = getMigrationHistory()
  const dataPoints = history.count()
  
  console.log(`📊 Analyzing ${dataPoints} migrations...\n`)
  
  if (dataPoints === 0) {
    console.log('❌ No migration history found')
    console.log('   Complete at least one migration first')
    process.exit(1)
  }
  
  // Analyze patterns
  console.log('🔍 Detecting complexity indicators...')
  const complexityIndicators = analyzeComplexityIndicators()
  
  console.log('🐛 Finding common issues...')
  const commonIssues = analyzeCommonIssues()
  
  console.log('⏱️  Analyzing time accuracy...')
  const timeAccuracy = analyzeTimeAccuracy()
  
  console.log('✨ Identifying success factors...')
  const successFactors = identifySuccessFactors()
  
  const report: PatternReport = {
    generatedAt: new Date(),
    dataPoints,
    complexityIndicators,
    commonIssues,
    timeAccuracy,
    successFactors,
    recommendations: []
  }
  
  // Generate recommendations
  report.recommendations = generateRecommendations(report)
  
  // Print report
  printReport(report)
  
  // Update guidance
  console.log('💾 Updating .windsurf-guidance.json...')
  updateGuidance(report)
  
  console.log('✅ Pattern detection complete!')
  console.log()
}

// CLI
detect()
