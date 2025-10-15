#!/usr/bin/env tsx
/**
 * Feature Complexity Analyzer
 * 
 * Analyzes a feature to determine migration complexity and time estimate.
 * Based on 3 validated migrations: vehicles, timeline, capture.
 */

import * as fs from 'fs'
import * as path from 'path'
import { execSync } from 'child_process'

interface FeatureComplexity {
  featureName: string
  componentCount: number
  totalFiles: number
  maxNestingDepth: number
  hasSubdirectories: boolean
  hasInternalImports: boolean
  complexityLevel: 'low' | 'medium' | 'high'
  estimatedTime: string
  similarTo: string
  recommendations: string[]
  warnings: string[]
}

function countFiles(dir: string, extension: string): number {
  try {
    const result = execSync(
      `find ${dir} -name "*.${extension}" -type f 2>/dev/null | wc -l`,
      { encoding: 'utf-8' }
    )
    return parseInt(result.trim()) || 0
  } catch {
    return 0
  }
}

function getMaxDepth(dir: string): number {
  try {
    const result = execSync(
      `find ${dir} -type d 2>/dev/null | awk -F/ '{print NF}' | sort -n | tail -1`,
      { encoding: 'utf-8' }
    )
    const depth = parseInt(result.trim()) || 0
    const baseDepth = dir.split('/').length
    return depth - baseDepth
  } catch {
    return 0
  }
}

function hasSubdirectories(dir: string): boolean {
  try {
    const result = execSync(
      `find ${dir} -mindepth 1 -maxdepth 1 -type d 2>/dev/null | wc -l`,
      { encoding: 'utf-8' }
    )
    return parseInt(result.trim()) > 0
  } catch {
    return false
  }
}

function checkInternalImports(dir: string): boolean {
  try {
    // Check for relative imports or imports from same feature
    const result = execSync(
      `grep -r "from '\\." ${dir} 2>/dev/null | wc -l`,
      { encoding: 'utf-8' }
    )
    return parseInt(result.trim()) > 10 // Arbitrary threshold
  } catch {
    return false
  }
}

function analyzeFeature(featureName: string): FeatureComplexity {
  const componentDir = path.join(process.cwd(), 'components', featureName)
  
  // Check if feature exists
  if (!fs.existsSync(componentDir)) {
    throw new Error(`Feature not found: ${featureName} (looked in ${componentDir})`)
  }

  // Count files
  const tsxFiles = countFiles(componentDir, 'tsx')
  const tsFiles = countFiles(componentDir, 'ts')
  const totalFiles = tsxFiles + tsFiles
  const componentCount = tsxFiles // Components are .tsx files

  // Analyze structure
  const maxDepth = getMaxDepth(componentDir)
  const hasSubdirs = hasSubdirectories(componentDir)
  const hasInternalImports = checkInternalImports(componentDir)

  // Determine complexity
  let complexityLevel: 'low' | 'medium' | 'high'
  let estimatedTime: string
  let similarTo: string

  if (componentCount < 30 && maxDepth <= 2 && !hasInternalImports) {
    complexityLevel = 'low'
    estimatedTime = '0.5-1 hour'
    similarTo = 'capture'
  } else if (componentCount >= 45 || maxDepth > 3 || hasInternalImports) {
    complexityLevel = 'high'
    estimatedTime = '1.5-2 hours'
    similarTo = 'timeline'
  } else {
    complexityLevel = 'medium'
    estimatedTime = '1-1.5 hours'
    similarTo = 'vehicles'
  }

  // Generate recommendations
  const recommendations: string[] = []
  const warnings: string[] = []

  if (complexityLevel === 'low') {
    recommendations.push('✅ Straightforward migration - follow standard 4-phase process')
    recommendations.push('✅ Should be fastest migration yet (based on capture pattern)')
  }

  if (complexityLevel === 'medium') {
    recommendations.push('⚠️  Moderate complexity - allow extra time for component organization')
    recommendations.push('💡 Follow vehicles pattern: organize into subdirectories early')
  }

  if (complexityLevel === 'high') {
    recommendations.push('🚨 Complex migration - expect challenges with imports')
    recommendations.push('💡 Follow timeline pattern: create proper type exports first')
    recommendations.push('💡 Consider direct file imports instead of barrel exports')
  }

  if (hasInternalImports) {
    warnings.push('⚠️  Internal imports detected - will need careful refactoring')
    warnings.push('💡 Create index.ts or use absolute imports for internal modules')
  }

  if (maxDepth > 3) {
    warnings.push('⚠️  Deep nesting detected (depth: ' + maxDepth + ')')
    warnings.push('💡 Consider flattening structure during migration')
  }

  if (componentCount > 50) {
    warnings.push('🚨 Large component count - consider splitting into smaller batches')
  }

  return {
    featureName,
    componentCount,
    totalFiles,
    maxNestingDepth: maxDepth,
    hasSubdirectories: hasSubdirs,
    hasInternalImports,
    complexityLevel,
    estimatedTime,
    similarTo,
    recommendations,
    warnings
  }
}

function printAnalysis(analysis: FeatureComplexity): void {
  console.log('\n' + '='.repeat(60))
  console.log('🔍  FEATURE COMPLEXITY ANALYSIS')
  console.log('='.repeat(60))
  console.log()
  console.log(`📦  Feature: ${analysis.featureName}`)
  console.log()
  console.log('📊  Metrics:')
  console.log(`    Components: ${analysis.componentCount}`)
  console.log(`    Total Files: ${analysis.totalFiles}`)
  console.log(`    Max Nesting: ${analysis.maxNestingDepth} levels`)
  console.log(`    Subdirectories: ${analysis.hasSubdirectories ? 'Yes' : 'No'}`)
  console.log(`    Internal Imports: ${analysis.hasInternalImports ? 'Yes' : 'No'}`)
  console.log()
  console.log('🎯  Assessment:')
  console.log(`    Complexity: ${analysis.complexityLevel.toUpperCase()}`)
  console.log(`    Estimated Time: ${analysis.estimatedTime}`)
  console.log(`    Similar To: ${analysis.similarTo}`)
  console.log()

  if (analysis.warnings.length > 0) {
    console.log('⚠️   Warnings:')
    analysis.warnings.forEach(w => console.log(`    ${w}`))
    console.log()
  }

  if (analysis.recommendations.length > 0) {
    console.log('💡  Recommendations:')
    analysis.recommendations.forEach(r => console.log(`    ${r}`))
    console.log()
  }

  console.log('📋  Next Steps:')
  console.log(`    1. Generate checklist: npm run generate:checklist ${analysis.featureName}`)
  console.log(`    2. Review checklist and adjust time estimates`)
  console.log(`    3. Begin Phase 1: Test Infrastructure`)
  console.log()
  console.log('='.repeat(60))
  console.log()
}

// CLI
const featureName = process.argv[2]

if (!featureName) {
  console.error('❌ Usage: npm run analyze:feature <feature-name>')
  console.error('   Example: npm run analyze:feature events')
  process.exit(1)
}

try {
  const analysis = analyzeFeature(featureName)
  printAnalysis(analysis)
  
  // Export for use by checklist generator
  const outputPath = path.join(process.cwd(), `.migration-analysis-${featureName}.json`)
  fs.writeFileSync(outputPath, JSON.stringify(analysis, null, 2))
  console.log(`💾  Analysis saved to: .migration-analysis-${featureName}.json`)
  console.log()
} catch (error) {
  console.error('❌ Error:', error instanceof Error ? error.message : error)
  process.exit(1)
}
