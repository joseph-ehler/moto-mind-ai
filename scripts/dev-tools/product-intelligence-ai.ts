#!/usr/bin/env tsx
/**
 * AI-Powered Product Intelligence Engine
 * 
 * Uses OpenAI GPT-4 for strategic product thinking
 * Provides counterpoint perspective to Windsurf/Claude
 * 
 * Usage: npm run product:analyze:ai "<feature request>"
 */

import * as fs from 'fs'
import * as path from 'path'
import { getOpenAIAnalysis, trackAIUsage, getAIUsageStats } from '../shared/ai-helper'

interface ProductAnalysis {
  understanding: FeatureUnderstanding
  questions: CriticalQuestion[]
  alternatives: Alternative[]
  recommendation: ProductRecommendation
  implementation: ImplementationStrategy
  metrics: SuccessMetrics
  risks: Risk[]
  aiMeta: {
    totalCost: number
    totalTokens: number
    model: string
  }
}

interface FeatureUnderstanding {
  whatUserAskedFor: string
  whatUserActuallyNeeds: string
  underlyingProblem: string
  userJourney: string[]
  painPoints: string[]
  confidence: number
}

interface CriticalQuestion {
  question: string
  why: string
  impact: 'high' | 'medium' | 'low'
}

interface Alternative {
  solution: string
  pros: string[]
  cons: string[]
  effort: 'low' | 'medium' | 'high'
  impact: 'low' | 'medium' | 'high'
  recommendation: boolean
}

interface ProductRecommendation {
  approach: string
  reasoning: string[]
  mvp: string
  futurePhases: string[]
  dependencies: string[]
  confidence: number
}

interface ImplementationStrategy {
  coreFeatures: string[]
  niceToHaves: string[]
  technicalApproach: string
  timeline: string
  team: string
}

interface SuccessMetrics {
  primary: Metric[]
  secondary: Metric[]
  leading: Metric[]
  lagging: Metric[]
}

interface Metric {
  name: string
  description: string
  target?: string
  measurement: string
}

interface Risk {
  risk: string
  probability: 'low' | 'medium' | 'high'
  impact: 'low' | 'medium' | 'high'
  mitigation: string
}

class AIProductIntelligenceEngine {
  private gitRoot: string
  private totalCost = 0
  private totalTokens = 0
  
  constructor() {
    this.gitRoot = process.cwd()
  }
  
  /**
   * Main analysis with OpenAI
   */
  async analyze(featureRequest: string): Promise<ProductAnalysis> {
    console.log('🤖 AI-POWERED PRODUCT INTELLIGENCE ENGINE\n')
    console.log('='.repeat(60))
    console.log(`Request: ${featureRequest}`)
    console.log('='.repeat(60))
    console.log('\n🔍 Analyzing with OpenAI GPT-4...\n')
    
    // Get product context
    const existingFeatures = await this.analyzeExistingFeatures()
    const productContext = this.getProductContext()
    
    // 1. Understand real need (AI)
    const understanding = await this.understandRealNeed(featureRequest, existingFeatures, productContext)
    
    // 2. Generate critical questions (AI)
    const questions = await this.generateCriticalQuestions(understanding)
    
    // 3. Explore alternatives (AI)
    const alternatives = await this.exploreAlternatives(understanding)
    
    // 4. Make recommendation (AI)
    const recommendation = await this.makeRecommendation(understanding, alternatives)
    
    // 5. Define implementation (AI)
    const implementation = await this.defineImplementation(recommendation, productContext)
    
    // 6. Define metrics (AI)
    const metrics = await this.defineMetrics(understanding, recommendation)
    
    // 7. Identify risks (AI)
    const risks = await this.identifyRisks(recommendation, implementation)
    
    console.log('\n' + '='.repeat(60))
    console.log('💰 AI USAGE SUMMARY')
    console.log('='.repeat(60))
    console.log(`Total Cost: $${this.totalCost.toFixed(4)}`)
    console.log(`Total Tokens: ${this.totalTokens.toLocaleString()}`)
    console.log('='.repeat(60))
    console.log()
    
    return {
      understanding,
      questions,
      alternatives,
      recommendation,
      implementation,
      metrics,
      risks,
      aiMeta: {
        totalCost: this.totalCost,
        totalTokens: this.totalTokens,
        model: 'gpt-4-turbo-preview'
      }
    }
  }
  
  /**
   * Step 1: AI understands what user REALLY needs
   */
  private async understandRealNeed(
    request: string,
    existingFeatures: string[],
    productContext: any
  ): Promise<FeatureUnderstanding> {
    console.log('💭 AI understanding the real need...\n')
    
    const result = await getOpenAIAnalysis<FeatureUnderstanding>({
      role: 'product strategist with deep understanding of user psychology',
      task: `Analyze this feature request and understand what the user REALLY needs.
      
Go beyond what they asked for. Think about:
- The underlying problem they're trying to solve
- The user journey and pain points
- What they actually need vs what they think they need`,
      data: {
        request,
        existingFeatures,
        productContext
      },
      format: `JSON with:
{
  "whatUserAskedFor": "literal request",
  "whatUserActuallyNeeds": "deeper need",
  "underlyingProblem": "root cause",
  "userJourney": ["step 1", "step 2", ...],
  "painPoints": ["pain 1", "pain 2", ...],
  "confidence": 0.0-1.0
}`
    })
    
    this.totalCost += result.cost
    this.totalTokens += result.tokens.input + result.tokens.output
    
    console.log(`   What user asked for: ${result.analysis.whatUserAskedFor}`)
    console.log(`   What user needs: ${result.analysis.whatUserActuallyNeeds}`)
    console.log(`   Underlying problem: ${result.analysis.underlyingProblem}`)
    console.log(`   AI Confidence: ${(result.analysis.confidence * 100).toFixed(0)}%`)
    console.log()
    
    return result.analysis
  }
  
  /**
   * Step 2: AI generates critical questions
   */
  private async generateCriticalQuestions(
    understanding: FeatureUnderstanding
  ): Promise<CriticalQuestion[]> {
    console.log('❓ AI generating critical questions...\n')
    
    const result = await getOpenAIAnalysis<{ questions: CriticalQuestion[] }>({
      role: 'experienced product leader who asks tough questions',
      task: `Generate 5-8 critical questions we must answer before building this feature.
      
Focus on:
- User validation
- Business impact
- Strategic fit
- Technical feasibility
- Risks and tradeoffs`,
      data: understanding,
      format: `JSON with: { questions: [{ question, why, impact: "high|medium|low" }] }`
    })
    
    this.totalCost += result.cost
    this.totalTokens += result.tokens.input + result.tokens.output
    
    result.analysis.questions.forEach(q => {
      const emoji = q.impact === 'high' ? '🔴' : q.impact === 'medium' ? '🟡' : '🟢'
      console.log(`   ${emoji} ${q.question}`)
      console.log(`      Why: ${q.why}`)
      console.log()
    })
    
    return result.analysis.questions
  }
  
  /**
   * Step 3: AI explores alternatives
   */
  private async exploreAlternatives(
    understanding: FeatureUnderstanding
  ): Promise<Alternative[]> {
    console.log('💡 AI exploring alternatives...\n')
    
    const result = await getOpenAIAnalysis<{ alternatives: Alternative[] }>({
      role: 'strategic thinker who considers multiple approaches',
      task: `Generate 3-5 alternative approaches to solving this problem.
      
Consider:
- Build full solution
- Build MVP and iterate
- Use existing service/integration
- Extend existing feature
- Don't build (different solution)

For each alternative, be honest about pros/cons and recommend the best.`,
      data: understanding,
      format: `JSON with: { alternatives: [{ solution, pros: [], cons: [], effort: "low|medium|high", impact: "low|medium|high", recommendation: boolean }] }`
    })
    
    this.totalCost += result.cost
    this.totalTokens += result.tokens.input + result.tokens.output
    
    result.analysis.alternatives.forEach((alt, i) => {
      console.log(`   ${alt.recommendation ? '✅' : '  '} Option ${i + 1}: ${alt.solution}`)
      console.log(`      Effort: ${alt.effort.toUpperCase()} | Impact: ${alt.impact.toUpperCase()}`)
      if (alt.recommendation) {
        console.log('      ⭐ AI RECOMMENDED')
      }
      console.log()
    })
    
    return result.analysis.alternatives
  }
  
  /**
   * Step 4: AI makes strategic recommendation
   */
  private async makeRecommendation(
    understanding: FeatureUnderstanding,
    alternatives: Alternative[]
  ): Promise<ProductRecommendation> {
    console.log('🎯 AI making strategic recommendation...\n')
    
    const result = await getOpenAIAnalysis<ProductRecommendation>({
      role: 'product executive making final decision',
      task: `Based on the analysis and alternatives, make a clear recommendation.
      
Include:
- Recommended approach
- Why this approach (specific reasoning)
- MVP scope (what's absolutely necessary)
- Future phases (what comes later)
- Dependencies needed
- Confidence in recommendation`,
      data: { understanding, alternatives },
      format: `JSON with: { approach, reasoning: [], mvp, futurePhases: [], dependencies: [], confidence: 0.0-1.0 }`
    })
    
    this.totalCost += result.cost
    this.totalTokens += result.tokens.input + result.tokens.output
    
    console.log(`   Recommended: ${result.analysis.approach}`)
    console.log(`   AI Confidence: ${(result.analysis.confidence * 100).toFixed(0)}%`)
    console.log()
    console.log('   Reasoning:')
    result.analysis.reasoning.forEach(r => console.log(`      • ${r}`))
    console.log()
    console.log(`   MVP: ${result.analysis.mvp}`)
    console.log()
    
    return result.analysis
  }
  
  /**
   * Step 5: AI defines implementation strategy
   */
  private async defineImplementation(
    recommendation: ProductRecommendation,
    productContext: any
  ): Promise<ImplementationStrategy> {
    console.log('🏗️  AI defining implementation...\n')
    
    const result = await getOpenAIAnalysis<ImplementationStrategy>({
      role: 'technical lead planning implementation',
      task: `Define concrete implementation strategy.
      
Specify:
- Core features (must-haves)
- Nice-to-haves (if time permits)
- Technical approach (specific)
- Realistic timeline
- Team size needed`,
      data: { recommendation, productContext },
      format: `JSON with: { coreFeatures: [], niceToHaves: [], technicalApproach, timeline, team }`
    })
    
    this.totalCost += result.cost
    this.totalTokens += result.tokens.input + result.tokens.output
    
    console.log('   Core Features:')
    result.analysis.coreFeatures.forEach(f => console.log(`      • ${f}`))
    console.log()
    console.log(`   Timeline: ${result.analysis.timeline}`)
    console.log(`   Team: ${result.analysis.team}`)
    console.log()
    
    return result.analysis
  }
  
  /**
   * Step 6: AI defines success metrics
   */
  private async defineMetrics(
    understanding: FeatureUnderstanding,
    recommendation: ProductRecommendation
  ): Promise<SuccessMetrics> {
    console.log('📊 AI defining success metrics...\n')
    
    const result = await getOpenAIAnalysis<SuccessMetrics>({
      role: 'data-driven product manager',
      task: `Define clear success metrics.
      
Categories:
- Primary: Business impact metrics (2-3)
- Secondary: Health/quality metrics (2-3)
- Leading: Early indicators (1-2)
- Lagging: Long-term impact (1-2)

Make metrics specific, measurable, with targets.`,
      data: { understanding, recommendation },
      format: `JSON with: { primary: [{ name, description, target, measurement }], secondary: [...], leading: [...], lagging: [...] }`
    })
    
    this.totalCost += result.cost
    this.totalTokens += result.tokens.input + result.tokens.output
    
    console.log('   Primary Metrics:')
    result.analysis.primary.forEach(m => {
      console.log(`      • ${m.name}: ${m.target || 'TBD'}`)
    })
    console.log()
    
    return result.analysis
  }
  
  /**
   * Step 7: AI identifies risks
   */
  private async identifyRisks(
    recommendation: ProductRecommendation,
    implementation: ImplementationStrategy
  ): Promise<Risk[]> {
    console.log('⚠️  AI analyzing risks...\n')
    
    const result = await getOpenAIAnalysis<{ risks: Risk[] }>({
      role: 'risk management expert',
      task: `Identify key risks and mitigation strategies.
      
Consider:
- Product risks (low adoption, wrong solution)
- Technical risks (complexity, performance)
- Business risks (cost, resources)
- Security/compliance risks

For each risk, assess probability and impact, provide specific mitigation.`,
      data: { recommendation, implementation },
      format: `JSON with: { risks: [{ risk, probability: "low|medium|high", impact: "low|medium|high", mitigation }] }`
    })
    
    this.totalCost += result.cost
    this.totalTokens += result.tokens.input + result.tokens.output
    
    result.analysis.risks.forEach(r => {
      const emoji = (r.probability === 'high' || r.impact === 'high') ? '🔴' :
                    (r.probability === 'medium' || r.impact === 'medium') ? '🟡' : '🟢'
      console.log(`   ${emoji} ${r.risk}`)
      console.log(`      P: ${r.probability} | I: ${r.impact}`)
      console.log(`      Mitigation: ${r.mitigation}`)
      console.log()
    })
    
    return result.analysis.risks
  }
  
  /**
   * Generate product brief
   */
  async generateProductBrief(request: string): Promise<string> {
    const analysis = await this.analyze(request)
    
    let brief = '# 📋 AI-POWERED PRODUCT BRIEF\n\n'
    brief += `**Generated:** ${new Date().toISOString()}\n`
    brief += `**AI Model:** ${analysis.aiMeta.model}\n`
    brief += `**Analysis Cost:** $${analysis.aiMeta.totalCost.toFixed(4)}\n\n`
    brief += '---\n\n'
    
    // Executive Summary
    brief += '## 🎯 Executive Summary\n\n'
    brief += `**Request:** ${analysis.understanding.whatUserAskedFor}\n\n`
    brief += `**Real Need:** ${analysis.understanding.whatUserActuallyNeeds}\n\n`
    brief += `**Recommendation:** ${analysis.recommendation.approach}\n\n`
    brief += `**Timeline:** ${analysis.implementation.timeline}\n\n`
    brief += `**AI Confidence:** ${(analysis.recommendation.confidence * 100).toFixed(0)}%\n\n`
    brief += '---\n\n'
    
    // Problem Statement
    brief += '## 🔍 Problem Statement\n\n'
    brief += `${analysis.understanding.underlyingProblem}\n\n`
    brief += '**Pain Points:**\n'
    analysis.understanding.painPoints.forEach(p => brief += `- ${p}\n`)
    brief += '\n**User Journey:**\n'
    analysis.understanding.userJourney.forEach((s, i) => brief += `${i + 1}. ${s}\n`)
    brief += '\n---\n\n'
    
    // Critical Questions
    brief += '## ❓ Critical Questions\n\n'
    analysis.questions.forEach(q => {
      brief += `### ${q.question}\n\n`
      brief += `**Why:** ${q.why}\n\n`
      brief += `**Impact:** ${q.impact.toUpperCase()}\n\n`
    })
    brief += '---\n\n'
    
    // Alternatives
    brief += '## 💡 Alternatives Considered\n\n'
    analysis.alternatives.forEach((alt, i) => {
      brief += `### ${alt.recommendation ? '⭐ ' : ''}Option ${i + 1}: ${alt.solution}\n\n`
      brief += `**Effort:** ${alt.effort} | **Impact:** ${alt.impact}\n\n`
      brief += '**Pros:** ' + alt.pros.join(', ') + '\n\n'
      brief += '**Cons:** ' + alt.cons.join(', ') + '\n\n'
    })
    brief += '---\n\n'
    
    // Recommendation
    brief += '## 🎯 Recommendation\n\n'
    brief += `**Approach:** ${analysis.recommendation.approach}\n\n`
    brief += '**Reasoning:**\n'
    analysis.recommendation.reasoning.forEach(r => brief += `- ${r}\n`)
    brief += `\n**MVP:** ${analysis.recommendation.mvp}\n\n`
    brief += '**Future Phases:**\n'
    analysis.recommendation.futurePhases.forEach(p => brief += `- ${p}\n`)
    brief += '\n---\n\n'
    
    // Implementation
    brief += '## 🏗️ Implementation\n\n'
    brief += '**Core Features:**\n'
    analysis.implementation.coreFeatures.forEach(f => brief += `- [ ] ${f}\n`)
    brief += '\n**Nice-to-Haves:**\n'
    analysis.implementation.niceToHaves.forEach(f => brief += `- [ ] ${f}\n`)
    brief += `\n**Technical:** ${analysis.implementation.technicalApproach}\n\n`
    brief += `**Timeline:** ${analysis.implementation.timeline}\n\n`
    brief += `**Team:** ${analysis.implementation.team}\n\n`
    brief += '---\n\n'
    
    // Metrics
    brief += '## 📊 Success Metrics\n\n'
    brief += '**Primary:**\n'
    analysis.metrics.primary.forEach(m => {
      brief += `- **${m.name}**: ${m.target || 'TBD'}\n`
    })
    brief += '\n**Secondary:**\n'
    analysis.metrics.secondary.forEach(m => {
      brief += `- **${m.name}**: ${m.target || 'TBD'}\n`
    })
    brief += '\n---\n\n'
    
    // Risks
    brief += '## ⚠️ Risks\n\n'
    analysis.risks.forEach(r => {
      brief += `**${r.risk}** (P:${r.probability}, I:${r.impact})\n`
      brief += `- Mitigation: ${r.mitigation}\n\n`
    })
    brief += '---\n\n'
    
    brief += `*Generated by AI Product Intelligence Engine using ${analysis.aiMeta.model}*\n`
    
    return brief
  }
  
  /**
   * Get product context
   */
  private getProductContext() {
    return {
      product: 'MotoMind',
      description: 'Fleet intelligence SaaS - compliance, maintenance, telematics',
      stack: 'Next.js, Supabase, OpenAI Vision',
      users: 'Fleet managers, compliance officers',
      existingCapabilities: [
        'Vehicle management',
        'Document capture (dashboard photos)',
        'AI-powered OCR',
        'Compliance tracking',
        'Multi-tenant architecture'
      ]
    }
  }
  
  /**
   * Analyze existing features
   */
  private async analyzeExistingFeatures(): Promise<string[]> {
    const featuresPath = path.join(this.gitRoot, 'features')
    if (!fs.existsSync(featuresPath)) return []
    
    return fs.readdirSync(featuresPath, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name)
  }
}

// CLI
const [command, ...args] = process.argv.slice(2)

async function main() {
  const engine = new AIProductIntelligenceEngine()
  
  switch (command) {
    case 'analyze': {
      const request = args.join(' ')
      if (!request) {
        console.error('❌ Error: Please provide feature request\n')
        console.error('Usage: npm run product:analyze:ai "add notification system"\n')
        process.exit(1)
      }
      
      await engine.analyze(request)
      break
    }
    
    case 'brief': {
      const request = args.join(' ')
      if (!request) {
        console.error('❌ Error: Please provide feature request\n')
        console.error('Usage: npm run product:brief:ai "add notification system"\n')
        process.exit(1)
      }
      
      const brief = await engine.generateProductBrief(request)
      
      // Save to file
      const outputPath = path.join(process.cwd(), '.product-brief-ai.md')
      fs.writeFileSync(outputPath, brief)
      
      console.log('\n' + '='.repeat(60))
      console.log('✅ AI PRODUCT BRIEF GENERATED')
      console.log('='.repeat(60))
      console.log(`\nSaved to: .product-brief-ai.md\n`)
      
      break
    }
    
    default:
      console.log('AI Product Intelligence Engine\n')
      console.log('Usage:')
      console.log('  npm run product:analyze:ai "<request>"  # AI analysis')
      console.log('  npm run product:brief:ai "<request>"    # AI brief\n')
      console.log('Examples:')
      console.log('  npm run product:analyze:ai "add notifications"')
      console.log('  npm run product:brief:ai "improve search"\n')
  }
}

main().catch(console.error)
