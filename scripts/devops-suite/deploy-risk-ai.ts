#!/usr/bin/env tsx
/**
 * AI-Powered Deploy Risk Assessment
 * 
 * Analyzes changes before deployment and provides intelligent risk scoring
 * Uses OpenAI to catch issues humans might miss
 * 
 * Usage: npm run deploy:risk:ai
 */

import { execSync } from 'child_process'
import * as fs from 'fs'
import { getOpenAIAnalysis } from '../shared/ai-helper'

interface ChangeAnalysis {
  filesChanged: number
  additions: number
  deletions: number
  changedFiles: string[]
  categories: {
    backend: number
    frontend: number
    database: number
    infrastructure: number
    tests: number
    docs: number
  }
}

interface RiskFactor {
  factor: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  impact: string
  likelihood: string
  mitigation: string
}

interface DeploymentStrategy {
  recommended: string
  reasoning: string
  steps: string[]
  monitoring: string[]
  rollbackPlan: string
}

interface AIRiskAssessment {
  overallRisk: 'critical' | 'high' | 'medium' | 'low'
  riskScore: number // 0-100
  confidence: number
  safeToDeploy: boolean
  riskFactors: RiskFactor[]
  strategy: DeploymentStrategy
  warnings: string[]
  greenLights: string[]
}

class AIDeployRiskAssessor {
  private totalCost = 0
  
  /**
   * Main assessment
   */
  async assess(): Promise<void> {
    console.log('🤖 AI-POWERED DEPLOY RISK ASSESSMENT\n')
    console.log('='.repeat(70))
    console.log()
    
    // Step 1: Analyze changes
    console.log('Step 1: Analyzing changes...\n')
    const changes = await this.analyzeChanges()
    this.displayChangeSummary(changes)
    
    // Step 2: Get recent deployment history
    console.log('\nStep 2: Reviewing deployment history...\n')
    const history = await this.getDeploymentHistory()
    
    // Step 3: Check current system health
    console.log('Step 3: Checking system health...\n')
    const health = await this.getSystemHealth()
    
    // Step 4: Get AI risk assessment
    console.log('Step 4: AI analyzing deployment risk...\n')
    const assessment = await this.getAIAssessment(changes, history, health)
    
    // Step 5: Display results
    this.displayAssessment(assessment)
  }
  
  /**
   * Analyze what changed
   */
  private async analyzeChanges(): Promise<ChangeAnalysis> {
    try {
      // Get diff stats
      const stats = execSync('git diff --stat HEAD', { encoding: 'utf8' })
      const files = execSync('git diff --name-only HEAD', { encoding: 'utf8' })
        .split('\n')
        .filter(f => f.trim())
      
      // Parse stats
      const statsMatch = stats.match(/(\d+) files? changed(?:, (\d+) insertions?)?(?:, (\d+) deletions?)?/)
      
      const filesChanged = statsMatch ? parseInt(statsMatch[1]) : 0
      const additions = statsMatch?.[2] ? parseInt(statsMatch[2]) : 0
      const deletions = statsMatch?.[3] ? parseInt(statsMatch[3]) : 0
      
      // Categorize files
      const categories = {
        backend: files.filter(f => 
          f.includes('/api/') || 
          f.includes('/lib/') || 
          f.startsWith('pages/api/')
        ).length,
        frontend: files.filter(f => 
          f.includes('/ui/') || 
          f.includes('/components/') || 
          f.startsWith('pages/') && !f.includes('/api/')
        ).length,
        database: files.filter(f => 
          f.includes('/data/') || 
          f.includes('migration') || 
          f.includes('supabase/')
        ).length,
        infrastructure: files.filter(f => 
          f.includes('package.json') || 
          f.includes('tsconfig') || 
          f.includes('vercel') ||
          f.includes('.env')
        ).length,
        tests: files.filter(f => 
          f.includes('.test.') || 
          f.includes('.spec.') || 
          f.includes('__tests__')
        ).length,
        docs: files.filter(f => 
          f.includes('.md') || 
          f.includes('/docs/')
        ).length
      }
      
      return {
        filesChanged,
        additions,
        deletions,
        changedFiles: files,
        categories
      }
    } catch (e) {
      return {
        filesChanged: 0,
        additions: 0,
        deletions: 0,
        changedFiles: [],
        categories: {
          backend: 0,
          frontend: 0,
          database: 0,
          infrastructure: 0,
          tests: 0,
          docs: 0
        }
      }
    }
  }
  
  /**
   * Get recent deployment history
   */
  private async getDeploymentHistory(): Promise<any> {
    try {
      const recentCommits = execSync('git log --oneline -5', { encoding: 'utf8' })
      const lastDeployTime = execSync('git log -1 --format=%cr', { encoding: 'utf8' }).trim()
      
      return {
        recentCommits: recentCommits.split('\n').filter(c => c),
        lastDeployTime,
        deploysToday: 0 // Would need to track this
      }
    } catch (e) {
      return {
        recentCommits: [],
        lastDeployTime: 'unknown',
        deploysToday: 0
      }
    }
  }
  
  /**
   * Get current system health
   */
  private async getSystemHealth(): Promise<any> {
    // In practice, would check actual metrics
    return {
      status: 'healthy',
      errorRate: 'low',
      traffic: 'normal',
      lastIncident: 'none'
    }
  }
  
  /**
   * Get AI risk assessment
   */
  private async getAIAssessment(
    changes: ChangeAnalysis,
    history: any,
    health: any
  ): Promise<AIRiskAssessment> {
    const result = await getOpenAIAnalysis<AIRiskAssessment>({
      role: 'senior DevOps engineer with 15+ years experience in production deployments',
      task: `Assess the risk of deploying these changes to production.

Consider:
1. What could go wrong?
2. How likely are issues?
3. What's the blast radius?
4. What's the recommended strategy?
5. What should we monitor?
6. What's the rollback plan?

Be specific and practical. Think about real production scenarios.`,
      data: {
        changes,
        history,
        health,
        context: {
          environment: 'Production',
          framework: 'Next.js 14 on Vercel',
          database: 'Supabase (PostgreSQL)',
          traffic: 'Low-medium (growing SaaS)',
          teamSize: 'Small (1-3 developers)',
          timeOfDay: new Date().getHours()
        }
      },
      format: `JSON with:
{
  "overallRisk": "critical|high|medium|low",
  "riskScore": 0-100,
  "confidence": 0.0-1.0,
  "safeToDepl oy": boolean,
  "riskFactors": [{
    "factor": "description",
    "severity": "critical|high|medium|low",
    "impact": "what happens if this goes wrong",
    "likelihood": "how likely is this",
    "mitigation": "how to reduce risk"
  }],
  "strategy": {
    "recommended": "strategy name",
    "reasoning": "why this strategy",
    "steps": ["step 1", "step 2", ...],
    "monitoring": ["what to watch"],
    "rollbackPlan": "how to rollback"
  },
  "warnings": ["warning 1", ...],
  "greenLights": ["positive 1", ...]
}`
    })
    
    this.totalCost += result.cost
    
    return result.analysis
  }
  
  /**
   * Display change summary
   */
  private displayChangeSummary(changes: ChangeAnalysis): void {
    console.log('📊 Change Analysis:')
    console.log(`   Files Changed: ${changes.filesChanged}`)
    console.log(`   +${changes.additions} / -${changes.deletions} lines`)
    console.log()
    
    console.log('📦 Categories:')
    if (changes.categories.backend > 0) console.log(`   Backend: ${changes.categories.backend} files`)
    if (changes.categories.frontend > 0) console.log(`   Frontend: ${changes.categories.frontend} files`)
    if (changes.categories.database > 0) console.log(`   Database: ${changes.categories.database} files`)
    if (changes.categories.infrastructure > 0) console.log(`   Infrastructure: ${changes.categories.infrastructure} files`)
    if (changes.categories.tests > 0) console.log(`   Tests: ${changes.categories.tests} files`)
    if (changes.categories.docs > 0) console.log(`   Docs: ${changes.categories.docs} files`)
    console.log()
  }
  
  /**
   * Display assessment
   */
  private displayAssessment(assessment: AIRiskAssessment): void {
    console.log('\n' + '='.repeat(70))
    console.log('🎯 AI RISK ASSESSMENT')
    console.log('='.repeat(70))
    console.log()
    
    // Overall risk
    const riskEmoji = assessment.overallRisk === 'critical' ? '🔴' :
                     assessment.overallRisk === 'high' ? '🟠' :
                     assessment.overallRisk === 'medium' ? '🟡' : '🟢'
    
    console.log(`${riskEmoji} Overall Risk: ${assessment.overallRisk.toUpperCase()}`)
    console.log(`📊 Risk Score: ${assessment.riskScore}/100`)
    console.log(`🤖 AI Confidence: ${(assessment.confidence * 100).toFixed(0)}%`)
    console.log()
    
    // Safe to deploy?
    if (assessment.safeToDeploy) {
      console.log('✅ SAFE TO DEPLOY (with recommended strategy)')
    } else {
      console.log('⛔ NOT RECOMMENDED TO DEPLOY NOW')
    }
    console.log()
    
    // Green lights
    if (assessment.greenLights.length > 0) {
      console.log('✅ Positive Factors:')
      assessment.greenLights.forEach(gl => console.log(`   • ${gl}`))
      console.log()
    }
    
    // Warnings
    if (assessment.warnings.length > 0) {
      console.log('⚠️  Warnings:')
      assessment.warnings.forEach(w => console.log(`   • ${w}`))
      console.log()
    }
    
    // Risk factors
    if (assessment.riskFactors.length > 0) {
      console.log('🎯 Risk Factors (Prioritized):\n')
      
      const sorted = assessment.riskFactors.sort((a, b) => {
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
        return severityOrder[b.severity] - severityOrder[a.severity]
      })
      
      sorted.forEach((rf, i) => {
        const emoji = rf.severity === 'critical' ? '🔴' :
                     rf.severity === 'high' ? '🟠' :
                     rf.severity === 'medium' ? '🟡' : '🟢'
        
        console.log(`${i + 1}. ${emoji} ${rf.factor}`)
        console.log(`   Severity: ${rf.severity.toUpperCase()}`)
        console.log(`   Impact: ${rf.impact}`)
        console.log(`   Likelihood: ${rf.likelihood}`)
        console.log(`   💡 Mitigation: ${rf.mitigation}`)
        console.log()
      })
    }
    
    // Recommended strategy
    console.log('🚀 Recommended Deployment Strategy:\n')
    console.log(`Strategy: ${assessment.strategy.recommended}`)
    console.log(`Reasoning: ${assessment.strategy.reasoning}`)
    console.log()
    
    console.log('Steps:')
    assessment.strategy.steps.forEach((step, i) => {
      console.log(`   ${i + 1}. ${step}`)
    })
    console.log()
    
    console.log('📊 Monitoring (Watch These):')
    assessment.strategy.monitoring.forEach(m => {
      console.log(`   • ${m}`)
    })
    console.log()
    
    console.log('🔄 Rollback Plan:')
    console.log(`   ${assessment.strategy.rollbackPlan}`)
    console.log()
    
    console.log('='.repeat(70))
    console.log(`💰 AI Assessment Cost: $${this.totalCost.toFixed(4)}`)
    console.log('='.repeat(70))
    console.log()
    
    // Final recommendation
    if (assessment.safeToDeploy) {
      console.log('✅ Proceed with deployment using recommended strategy')
      console.log(`   Run: npm run deploy "<message>"`)
    } else {
      console.log('⛔ Address concerns before deploying')
      console.log('   Review warnings and risk factors above')
    }
    console.log()
  }
}

// CLI
const assessor = new AIDeployRiskAssessor()

assessor.assess()
  .then(() => {
    process.exit(0)
  })
  .catch(err => {
    console.error('❌ Error:', err)
    process.exit(1)
  })
