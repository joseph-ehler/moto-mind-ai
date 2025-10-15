#!/usr/bin/env tsx
/**
 * AI-Powered Architecture Validator
 * 
 * Goes beyond rule-based validation to provide strategic architectural insights
 * Uses OpenAI to review architecture holistically and suggest improvements
 * 
 * Usage: npm run arch:validate:ai [--staged]
 */

import * as fs from 'fs'
import * as path from 'path'
import { execSync } from 'child_process'
import { getOpenAIAnalysis } from '../shared/ai-helper'

interface Violation {
  file: string
  type: string
  severity: 'error' | 'warning' | 'info'
  message: string
  suggestion: string
}

interface ArchitecturalInsight {
  category: 'structure' | 'coupling' | 'cohesion' | 'patterns' | 'tech_debt' | 'scalability'
  issue: string
  impact: 'high' | 'medium' | 'low'
  recommendation: string
  examples?: string[]
  priority: number
}

interface AIArchitectureReview {
  overallHealth: number // 0-100
  strengths: string[]
  concerns: string[]
  insights: ArchitecturalInsight[]
  refactoringOpportunities: string[]
  bestPractices: string[]
  confidence: number
}

class AIArchitectureValidator {
  private gitRoot: string
  private totalCost = 0
  
  constructor() {
    this.gitRoot = process.cwd()
  }
  
  /**
   * Main validation with AI review
   */
  async validate(mode: 'all' | 'staged' = 'all'): Promise<void> {
    console.log('🤖 AI-POWERED ARCHITECTURE VALIDATOR\n')
    console.log('='.repeat(70))
    console.log('Combining rule-based validation with AI strategic review')
    console.log('='.repeat(70))
    console.log()
    
    // Step 1: Get rule-based violations
    console.log('Step 1: Running rule-based validation...\n')
    const violations = await this.getRuleBasedViolations(mode)
    console.log(`Found ${violations.length} rule-based issue(s)\n`)
    
    // Step 2: Analyze codebase structure
    console.log('Step 2: Analyzing codebase structure...\n')
    const structure = await this.analyzeStructure()
    
    // Step 3: Get AI architectural review
    console.log('Step 3: Getting AI strategic review...\n')
    const review = await this.getAIReview(violations, structure)
    
    // Step 4: Report
    this.report(violations, review)
  }
  
  /**
   * Get rule-based violations (use existing validator logic)
   */
  private async getRuleBasedViolations(mode: 'all' | 'staged'): Promise<Violation[]> {
    // Simplified version - in practice would import from validate-architecture.ts
    const violations: Violation[] = []
    
    // Check feature structures
    const featuresDir = path.join(this.gitRoot, 'features')
    if (fs.existsSync(featuresDir)) {
      const features = fs.readdirSync(featuresDir, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => d.name)
      
      features.forEach(feature => {
        const featurePath = path.join(featuresDir, feature)
        const requiredDirs = ['domain', 'data', 'ui', 'hooks', '__tests__']
        const missingDirs: string[] = []
        
        requiredDirs.forEach(dir => {
          const dirPath = path.join(featurePath, dir)
          if (!fs.existsSync(dirPath)) {
            missingDirs.push(dir)
          } else {
            const files = fs.readdirSync(dirPath)
            if (files.length === 0) {
              missingDirs.push(`${dir} (empty)`)
            }
          }
        })
        
        if (missingDirs.length > 0) {
          violations.push({
            file: `features/${feature}/`,
            type: 'incomplete-structure',
            severity: 'info',
            message: 'Incomplete feature structure',
            suggestion: `Missing: ${missingDirs.join(', ')}`
          })
        }
      })
    }
    
    return violations
  }
  
  /**
   * Analyze codebase structure
   */
  private async analyzeStructure(): Promise<any> {
    const structure = {
      features: this.getFeatureStats(),
      shared: this.getSharedCodeStats(),
      dependencies: this.getDependencyStats(),
      patterns: this.detectPatterns()
    }
    
    return structure
  }
  
  /**
   * Get feature statistics
   */
  private getFeatureStats(): any {
    const featuresDir = path.join(this.gitRoot, 'features')
    if (!fs.existsSync(featuresDir)) return { count: 0, features: [] }
    
    const features = fs.readdirSync(featuresDir, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => {
        const featurePath = path.join(featuresDir, d.name)
        const hasBarrel = fs.existsSync(path.join(featurePath, 'index.ts'))
        const subdirs = fs.readdirSync(featurePath, { withFileTypes: true })
          .filter(x => x.isDirectory())
          .map(x => x.name)
        
        return {
          name: d.name,
          hasBarrel,
          structure: subdirs,
          complete: subdirs.includes('domain') && 
                    subdirs.includes('data') && 
                    subdirs.includes('ui')
        }
      })
    
    return {
      count: features.length,
      features,
      complete: features.filter(f => f.complete).length,
      withBarrels: features.filter(f => f.hasBarrel).length
    }
  }
  
  /**
   * Get shared code statistics
   */
  private getSharedCodeStats(): any {
    const libDir = path.join(this.gitRoot, 'lib')
    const componentsDir = path.join(this.gitRoot, 'components')
    
    return {
      libCount: fs.existsSync(libDir) 
        ? fs.readdirSync(libDir, { withFileTypes: true }).filter(d => d.isDirectory()).length 
        : 0,
      componentsCount: fs.existsSync(componentsDir)
        ? fs.readdirSync(componentsDir, { withFileTypes: true }).filter(d => d.isDirectory()).length
        : 0
    }
  }
  
  /**
   * Get dependency statistics
   */
  private getDependencyStats(): any {
    const packageJsonPath = path.join(this.gitRoot, 'package.json')
    if (!fs.existsSync(packageJsonPath)) return {}
    
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
    
    return {
      dependencies: Object.keys(packageJson.dependencies || {}).length,
      devDependencies: Object.keys(packageJson.devDependencies || {}).length
    }
  }
  
  /**
   * Detect architectural patterns
   */
  private detectPatterns(): string[] {
    const patterns: string[] = []
    
    // Check for feature-first
    if (fs.existsSync(path.join(this.gitRoot, 'features'))) {
      patterns.push('feature-first')
    }
    
    // Check for barrel exports
    const hasBarrels = this.hasBarrelExports()
    if (hasBarrels) {
      patterns.push('barrel-exports')
    }
    
    // Check for path aliases
    const hasTsConfig = fs.existsSync(path.join(this.gitRoot, 'tsconfig.json'))
    if (hasTsConfig) {
      patterns.push('path-aliases')
    }
    
    return patterns
  }
  
  /**
   * Check if barrel exports are used
   */
  private hasBarrelExports(): boolean {
    const featuresDir = path.join(this.gitRoot, 'features')
    if (!fs.existsSync(featuresDir)) return false
    
    const features = fs.readdirSync(featuresDir, { withFileTypes: true })
      .filter(d => d.isDirectory())
    
    return features.some(f => 
      fs.existsSync(path.join(featuresDir, f.name, 'index.ts'))
    )
  }
  
  /**
   * Get AI architectural review
   */
  private async getAIReview(
    violations: Violation[],
    structure: any
  ): Promise<AIArchitectureReview> {
    const result = await getOpenAIAnalysis<AIArchitectureReview>({
      role: 'senior software architect with 15+ years experience',
      task: `Review this codebase architecture and provide strategic insights.

Go beyond rule violations. Think about:
1. Overall architectural health
2. Coupling and cohesion
3. Scalability concerns
4. Technical debt
5. Refactoring opportunities
6. Best practices to adopt

Be specific and actionable. Focus on high-impact improvements.`,
      data: {
        violations,
        structure,
        context: {
          framework: 'Next.js 14',
          architecture: 'Feature-first with domain-driven design',
          scale: 'Mid-size SaaS application',
          team: 'Small team (1-3 developers)'
        }
      },
      format: `JSON with:
{
  "overallHealth": 0-100,
  "strengths": ["strength 1", "strength 2", ...],
  "concerns": ["concern 1", "concern 2", ...],
  "insights": [{
    "category": "structure|coupling|cohesion|patterns|tech_debt|scalability",
    "issue": "description",
    "impact": "high|medium|low",
    "recommendation": "what to do",
    "examples": ["example 1"],
    "priority": 1-5
  }],
  "refactoringOpportunities": ["opportunity 1", ...],
  "bestPractices": ["practice 1", ...],
  "confidence": 0.0-1.0
}`
    })
    
    this.totalCost += result.cost
    
    return result.analysis
  }
  
  /**
   * Report results
   */
  private report(violations: Violation[], review: AIArchitectureReview): void {
    console.log('\n' + '='.repeat(70))
    console.log('🤖 AI ARCHITECTURE REVIEW')
    console.log('='.repeat(70))
    console.log()
    
    // Overall health
    const healthEmoji = review.overallHealth >= 80 ? '🟢' : 
                       review.overallHealth >= 60 ? '🟡' : '🔴'
    console.log(`${healthEmoji} Overall Health: ${review.overallHealth}/100`)
    console.log(`   AI Confidence: ${(review.confidence * 100).toFixed(0)}%`)
    console.log()
    
    // Strengths
    if (review.strengths.length > 0) {
      console.log('✅ Strengths:')
      review.strengths.forEach(s => console.log(`   • ${s}`))
      console.log()
    }
    
    // Concerns
    if (review.concerns.length > 0) {
      console.log('⚠️  Concerns:')
      review.concerns.forEach(c => console.log(`   • ${c}`))
      console.log()
    }
    
    // Strategic insights (prioritized)
    if (review.insights.length > 0) {
      console.log('🔍 Strategic Insights (Prioritized):\n')
      
      const sorted = review.insights.sort((a, b) => b.priority - a.priority)
      
      sorted.forEach((insight, i) => {
        const impactEmoji = insight.impact === 'high' ? '🔴' : 
                           insight.impact === 'medium' ? '🟡' : '🟢'
        
        console.log(`${i + 1}. [${insight.category.toUpperCase()}] ${impactEmoji} ${insight.issue}`)
        console.log(`   Impact: ${insight.impact.toUpperCase()} | Priority: ${insight.priority}/5`)
        console.log(`   💡 ${insight.recommendation}`)
        
        if (insight.examples && insight.examples.length > 0) {
          console.log(`   Examples:`)
          insight.examples.forEach(ex => console.log(`      - ${ex}`))
        }
        console.log()
      })
    }
    
    // Refactoring opportunities
    if (review.refactoringOpportunities.length > 0) {
      console.log('🔧 Refactoring Opportunities:')
      review.refactoringOpportunities.forEach(opp => console.log(`   • ${opp}`))
      console.log()
    }
    
    // Best practices
    if (review.bestPractices.length > 0) {
      console.log('📚 Recommended Best Practices:')
      review.bestPractices.forEach(bp => console.log(`   • ${bp}`))
      console.log()
    }
    
    // Rule violations summary
    if (violations.length > 0) {
      console.log(`📋 Rule-Based Violations: ${violations.length}`)
      console.log(`   Run: npm run arch:validate for details`)
      console.log()
    }
    
    console.log('='.repeat(70))
    console.log(`💰 AI Review Cost: $${this.totalCost.toFixed(4)}`)
    console.log('='.repeat(70))
    console.log()
  }
}

// CLI
const mode = process.argv.includes('--staged') ? 'staged' : 'all'
const validator = new AIArchitectureValidator()

validator.validate(mode)
  .then(() => {
    console.log('✅ AI Architecture review complete!\n')
    process.exit(0)
  })
  .catch(err => {
    console.error('❌ Error:', err)
    process.exit(1)
  })
