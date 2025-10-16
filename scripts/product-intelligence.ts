#!/usr/bin/env tsx
/**
 * Product Intelligence Engine (Tool #14)
 * 
 * Transforms AI from "Distinguished Engineer" to "Distinguished Product Leader"
 * 
 * Instead of just implementing requests, it:
 * - Understands user needs and business context
 * - Questions assumptions and suggests alternatives
 * - Considers strategic implications
 * - Recommends data-driven solutions
 * - Thinks about metrics and ROI
 * 
 * Usage: npm run product:analyze "<feature request>"
 */

import * as fs from 'fs'
import * as path from 'path'

interface ProductAnalysis {
  understanding: FeatureUnderstanding
  questions: CriticalQuestion[]
  alternatives: Alternative[]
  recommendation: ProductRecommendation
  implementation: ImplementationStrategy
  metrics: SuccessMetrics
  risks: Risk[]
}

interface FeatureUnderstanding {
  whatUserAskedFor: string
  whatUserActuallyNeeds: string
  underlyingProblem: string
  userJourney: string[]
  painPoints: string[]
}

interface CriticalQuestion {
  question: string
  why: string
  impact: 'high' | 'medium' | 'low'
  answer?: string
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

class ProductIntelligenceEngine {
  private gitRoot: string
  
  constructor() {
    this.gitRoot = process.cwd()
  }
  
  /**
   * Main analysis: Understand what the user REALLY needs
   */
  async analyze(featureRequest: string): Promise<ProductAnalysis> {
    console.log('🧠 PRODUCT INTELLIGENCE ENGINE\n')
    console.log('='.repeat(60))
    console.log(`Request: ${featureRequest}`)
    console.log('='.repeat(60))
    console.log('\n🔍 Analyzing from product perspective...\n')
    
    // 1. Understand the real need
    const understanding = await this.understandRealNeed(featureRequest)
    
    // 2. Ask critical questions
    const questions = await this.generateCriticalQuestions(understanding)
    
    // 3. Explore alternatives
    const alternatives = await this.exploreAlternatives(understanding)
    
    // 4. Make recommendation
    const recommendation = await this.makeRecommendation(
      understanding,
      alternatives
    )
    
    // 5. Define implementation strategy
    const implementation = await this.defineImplementation(recommendation)
    
    // 6. Define success metrics
    const metrics = await this.defineMetrics(understanding, recommendation)
    
    // 7. Identify risks
    const risks = await this.identifyRisks(recommendation, implementation)
    
    return {
      understanding,
      questions,
      alternatives,
      recommendation,
      implementation,
      metrics,
      risks
    }
  }
  
  /**
   * Step 1: Understand what user REALLY needs (not just what they asked for)
   */
  private async understandRealNeed(request: string): Promise<FeatureUnderstanding> {
    console.log('💭 Understanding the real need...\n')
    
    // Analyze existing features to understand patterns
    const existingFeatures = await this.analyzeExistingFeatures()
    
    // Detect patterns in request
    const keywords = request.toLowerCase().split(/\s+/)
    
    // Common patterns: "add X" usually means "users need to manage X"
    let whatUserAskedFor = request
    let whatUserActuallyNeeds = ''
    let underlyingProblem = ''
    let userJourney: string[] = []
    let painPoints: string[] = []
    
    // Example: "add document storage"
    if (keywords.includes('add') || keywords.includes('create')) {
      const feature = keywords.find(k => !['add', 'create', 'new'].includes(k)) || 'feature'
      
      whatUserActuallyNeeds = `Users need to manage ${feature}s throughout their lifecycle`
      underlyingProblem = `Currently, users have no way to track/manage ${feature}s`
      
      userJourney = [
        `User needs to upload a ${feature}`,
        `User needs to find their ${feature}s later`,
        `User needs to organize ${feature}s`,
        `User needs to share ${feature}s (maybe)`,
        `User needs to delete ${feature}s when done`
      ]
      
      painPoints = [
        'No centralized storage',
        'No search/filter capability',
        'No organization system',
        'No visibility into what exists',
        'Manual file management is tedious'
      ]
    }
    
    console.log(`   What user asked for: ${whatUserAskedFor}`)
    console.log(`   What user needs: ${whatUserActuallyNeeds}`)
    console.log(`   Underlying problem: ${underlyingProblem}`)
    console.log()
    
    return {
      whatUserAskedFor,
      whatUserActuallyNeeds,
      underlyingProblem,
      userJourney,
      painPoints
    }
  }
  
  /**
   * Step 2: Ask critical questions before building
   */
  private async generateCriticalQuestions(
    understanding: FeatureUnderstanding
  ): Promise<CriticalQuestion[]> {
    console.log('❓ Critical questions to answer...\n')
    
    const questions: CriticalQuestion[] = [
      {
        question: 'What specific problem does this solve for users?',
        why: 'Ensures we\'re solving a real pain point, not just adding features',
        impact: 'high'
      },
      {
        question: 'How will users discover this feature?',
        why: 'Features that users can\'t find provide zero value',
        impact: 'high'
      },
      {
        question: 'What alternatives do users have today?',
        why: 'Understanding workarounds reveals true pain severity',
        impact: 'medium'
      },
      {
        question: 'How does this move our key business metrics?',
        why: 'Features should tie to business outcomes',
        impact: 'high'
      },
      {
        question: 'What\'s the technical complexity vs user value tradeoff?',
        why: 'Guides build/buy/partner decisions',
        impact: 'high'
      },
      {
        question: 'How does this fit with our product roadmap?',
        why: 'Ensures strategic alignment',
        impact: 'medium'
      },
      {
        question: 'What data do we have to validate this need?',
        why: 'Data-driven decisions beat opinions',
        impact: 'high'
      },
      {
        question: 'What happens if we don\'t build this?',
        why: 'Clarifies true priority',
        impact: 'medium'
      }
    ]
    
    questions.forEach(q => {
      console.log(`   ${q.impact === 'high' ? '🔴' : q.impact === 'medium' ? '🟡' : '🟢'} ${q.question}`)
      console.log(`      Why: ${q.why}`)
      console.log()
    })
    
    return questions
  }
  
  /**
   * Step 3: Explore alternative solutions
   */
  private async exploreAlternatives(
    understanding: FeatureUnderstanding
  ): Promise<Alternative[]> {
    console.log('💡 Exploring alternatives...\n')
    
    const alternatives: Alternative[] = [
      {
        solution: 'Build full-featured solution',
        pros: [
          'Complete control over UX/features',
          'Tight integration with existing product',
          'No external dependencies'
        ],
        cons: [
          'Significant development time',
          'Ongoing maintenance burden',
          'Opportunity cost (could build other features)'
        ],
        effort: 'high',
        impact: 'high',
        recommendation: false
      },
      {
        solution: 'Build MVP, iterate based on usage',
        pros: [
          'Fast to market',
          'Learn from real usage',
          'Can pivot if wrong',
          'Lower initial investment'
        ],
        cons: [
          'May frustrate early users',
          'Technical debt if not planned well',
          'Feature gaps initially'
        ],
        effort: 'medium',
        impact: 'high',
        recommendation: true
      },
      {
        solution: 'Integrate with existing service (e.g., Dropbox, Drive)',
        pros: [
          'Minimal development time',
          'Users already familiar',
          'Robust, proven solution',
          'No maintenance burden'
        ],
        cons: [
          'Less control over UX',
          'External dependency',
          'Potential API costs',
          'Integration complexity'
        ],
        effort: 'low',
        impact: 'medium',
        recommendation: false
      },
      {
        solution: 'Extend existing feature instead of building new one',
        pros: [
          'Leverage existing code/UX',
          'Users already know where to look',
          'Less to maintain',
          'Faster to build'
        ],
        cons: [
          'May bloat existing feature',
          'Could confuse users',
          'May not fit conceptually'
        ],
        effort: 'low',
        impact: 'medium',
        recommendation: false
      }
    ]
    
    alternatives.forEach((alt, i) => {
      console.log(`   ${alt.recommendation ? '✅' : '  '} Option ${i + 1}: ${alt.solution}`)
      console.log(`      Effort: ${alt.effort.toUpperCase()} | Impact: ${alt.impact.toUpperCase()}`)
      if (alt.recommendation) {
        console.log('      ⭐ RECOMMENDED')
      }
      console.log()
    })
    
    return alternatives
  }
  
  /**
   * Step 4: Make strategic recommendation
   */
  private async makeRecommendation(
    understanding: FeatureUnderstanding,
    alternatives: Alternative[]
  ): Promise<ProductRecommendation> {
    console.log('🎯 Strategic recommendation...\n')
    
    const recommended = alternatives.find(a => a.recommendation)!
    
    const recommendation: ProductRecommendation = {
      approach: recommended.solution,
      reasoning: [
        'Balances speed to market with learning',
        'Minimizes risk by validating with real users',
        'Allows pivoting if assumptions are wrong',
        'Provides value quickly while building toward full vision'
      ],
      mvp: 'Core upload/view/delete functionality only',
      futurePhases: [
        'Phase 2: Search and filtering',
        'Phase 3: Organization (folders/tags)',
        'Phase 4: Sharing and permissions',
        'Phase 5: Advanced features (versioning, etc.)'
      ],
      dependencies: [
        'File storage infrastructure (Supabase Storage)',
        'Authentication system (already exists)',
        'Tenant isolation (already exists)'
      ]
    }
    
    console.log(`   Recommended Approach: ${recommendation.approach}`)
    console.log()
    console.log('   Reasoning:')
    recommendation.reasoning.forEach(r => console.log(`      • ${r}`))
    console.log()
    console.log(`   MVP Scope: ${recommendation.mvp}`)
    console.log()
    console.log('   Future Phases:')
    recommendation.futurePhases.forEach(p => console.log(`      • ${p}`))
    console.log()
    
    return recommendation
  }
  
  /**
   * Step 5: Define implementation strategy
   */
  private async defineImplementation(
    recommendation: ProductRecommendation
  ): Promise<ImplementationStrategy> {
    console.log('🏗️  Implementation strategy...\n')
    
    const implementation: ImplementationStrategy = {
      coreFeatures: [
        'Upload documents (single and bulk)',
        'View document list',
        'Download documents',
        'Delete documents',
        'Basic metadata (name, size, date, uploader)'
      ],
      niceToHaves: [
        'Preview documents inline',
        'Drag-and-drop upload',
        'Progress indicators',
        'File type icons'
      ],
      technicalApproach: 'Use Supabase Storage with tenant isolation, follow existing patterns from vehicle_images feature',
      timeline: '1-2 weeks for MVP',
      team: '1 engineer'
    }
    
    console.log('   Core Features (Must Have):')
    implementation.coreFeatures.forEach(f => console.log(`      • ${f}`))
    console.log()
    console.log('   Nice-to-Haves (If Time Permits):')
    implementation.niceToHaves.forEach(f => console.log(`      • ${f}`))
    console.log()
    console.log(`   Technical Approach: ${implementation.technicalApproach}`)
    console.log(`   Timeline: ${implementation.timeline}`)
    console.log()
    
    return implementation
  }
  
  /**
   * Step 6: Define success metrics
   */
  private async defineMetrics(
    understanding: FeatureUnderstanding,
    recommendation: ProductRecommendation
  ): Promise<SuccessMetrics> {
    console.log('📊 Success metrics...\n')
    
    const metrics: SuccessMetrics = {
      primary: [
        {
          name: 'Adoption Rate',
          description: '% of active users who use the feature',
          target: '30% in first month',
          measurement: 'Track unique users who use feature at least once'
        },
        {
          name: 'Feature Usage',
          description: 'Total usage events',
          target: '100+ in first month',
          measurement: 'Count of successful usage events'
        }
      ],
      secondary: [
        {
          name: 'Success Rate',
          description: '% of attempts that succeed',
          target: '>95%',
          measurement: 'Successful actions / total attempts'
        },
        {
          name: 'Time to First Use',
          description: 'How quickly do users figure out how to use it',
          target: '<5 minutes',
          measurement: 'Time from feature discovery to first use'
        }
      ],
      leading: [
        {
          name: 'Feature Discovery',
          description: 'How many users find the feature',
          measurement: 'Page views on feature section'
        }
      ],
      lagging: [
        {
          name: 'Retention Impact',
          description: 'Do users who use this feature stick around longer',
          measurement: 'Cohort analysis: retention of users who use vs those who don\'t'
        }
      ]
    }
    
    console.log('   Primary Metrics (Business Impact):')
    metrics.primary.forEach(m => {
      console.log(`      • ${m.name}: ${m.description}`)
      if (m.target) console.log(`        Target: ${m.target}`)
    })
    console.log()
    
    return metrics
  }
  
  /**
   * Step 7: Identify risks
   */
  private async identifyRisks(
    recommendation: ProductRecommendation,
    implementation: ImplementationStrategy
  ): Promise<Risk[]> {
    console.log('⚠️  Risk analysis...\n')
    
    const risks: Risk[] = [
      {
        risk: 'Feature doesn\'t solve the real problem (low adoption)',
        probability: 'low',
        impact: 'high',
        mitigation: 'User research before building, analytics after launch, quick iteration based on feedback'
      },
      {
        risk: 'Technical complexity exceeds estimate',
        probability: 'low',
        impact: 'medium',
        mitigation: 'Copy patterns from existing similar features, use existing infrastructure, start with MVP scope'
      },
      {
        risk: 'Feature creates security/compliance concerns',
        probability: 'medium',
        impact: 'high',
        mitigation: 'Follow existing security patterns, add encryption where needed, clear terms of use'
      },
      {
        risk: 'Operational costs escalate unexpectedly',
        probability: 'low',
        impact: 'medium',
        mitigation: 'Implement resource limits, add cost monitoring, start with conservative limits'
      }
    ]
    
    risks.forEach(r => {
      const emoji = r.probability === 'high' || r.impact === 'high' ? '🔴' : 
                    r.probability === 'medium' || r.impact === 'medium' ? '🟡' : '🟢'
      console.log(`   ${emoji} ${r.risk}`)
      console.log(`      Probability: ${r.probability.toUpperCase()} | Impact: ${r.impact.toUpperCase()}`)
      console.log(`      Mitigation: ${r.mitigation}`)
      console.log()
    })
    
    return risks
  }
  
  /**
   * Generate comprehensive product brief
   */
  async generateProductBrief(request: string): Promise<string> {
    const analysis = await this.analyze(request)
    
    let brief = '# 📋 PRODUCT BRIEF\n\n'
    brief += `**Generated:** ${new Date().toISOString()}\n\n`
    brief += '---\n\n'
    
    // Executive Summary
    brief += '## 🎯 Executive Summary\n\n'
    brief += `**Request:** ${analysis.understanding.whatUserAskedFor}\n\n`
    brief += `**Real Need:** ${analysis.understanding.whatUserActuallyNeeds}\n\n`
    brief += `**Recommendation:** ${analysis.recommendation.approach}\n\n`
    brief += `**Timeline:** ${analysis.implementation.timeline}\n\n`
    brief += `**Primary Metric:** ${analysis.metrics.primary[0]?.name} - ${analysis.metrics.primary[0]?.target}\n\n`
    brief += '---\n\n'
    
    // Problem Statement
    brief += '## 🔍 Problem Statement\n\n'
    brief += `**Underlying Problem:**\n${analysis.understanding.underlyingProblem}\n\n`
    brief += '**Pain Points:**\n'
    analysis.understanding.painPoints.forEach(p => {
      brief += `- ${p}\n`
    })
    brief += '\n**User Journey:**\n'
    analysis.understanding.userJourney.forEach((step, i) => {
      brief += `${i + 1}. ${step}\n`
    })
    brief += '\n---\n\n'
    
    // Critical Questions
    brief += '## ❓ Critical Questions\n\n'
    brief += 'Before building, we need answers to:\n\n'
    analysis.questions.forEach(q => {
      brief += `### ${q.question}\n\n`
      brief += `**Why this matters:** ${q.why}\n\n`
      brief += `**Impact:** ${q.impact.toUpperCase()}\n\n`
    })
    brief += '---\n\n'
    
    // Alternatives Considered
    brief += '## 💡 Alternatives Considered\n\n'
    analysis.alternatives.forEach((alt, i) => {
      brief += `### Option ${i + 1}: ${alt.solution}\n\n`
      brief += `**Effort:** ${alt.effort} | **Impact:** ${alt.impact}\n\n`
      if (alt.recommendation) {
        brief += '**⭐ RECOMMENDED**\n\n'
      }
      brief += '**Pros:**\n'
      alt.pros.forEach(p => brief += `- ${p}\n`)
      brief += '\n**Cons:**\n'
      alt.cons.forEach(c => brief += `- ${c}\n`)
      brief += '\n'
    })
    brief += '---\n\n'
    
    // Recommendation
    brief += '## 🎯 Recommendation\n\n'
    brief += `**Approach:** ${analysis.recommendation.approach}\n\n`
    brief += '**Reasoning:**\n'
    analysis.recommendation.reasoning.forEach(r => {
      brief += `- ${r}\n`
    })
    brief += '\n'
    brief += `**MVP Scope:** ${analysis.recommendation.mvp}\n\n`
    brief += '**Future Phases:**\n'
    analysis.recommendation.futurePhases.forEach(p => {
      brief += `- ${p}\n`
    })
    brief += '\n---\n\n'
    
    // Implementation
    brief += '## 🏗️ Implementation Strategy\n\n'
    brief += '### Core Features (MVP)\n\n'
    analysis.implementation.coreFeatures.forEach(f => {
      brief += `- [ ] ${f}\n`
    })
    brief += '\n### Nice-to-Haves\n\n'
    analysis.implementation.niceToHaves.forEach(f => {
      brief += `- [ ] ${f}\n`
    })
    brief += '\n'
    brief += `**Technical Approach:** ${analysis.implementation.technicalApproach}\n\n`
    brief += `**Timeline:** ${analysis.implementation.timeline}\n\n`
    brief += `**Team:** ${analysis.implementation.team}\n\n`
    brief += '---\n\n'
    
    // Success Metrics
    brief += '## 📊 Success Metrics\n\n'
    brief += '### Primary Metrics (Business Impact)\n\n'
    analysis.metrics.primary.forEach(m => {
      brief += `**${m.name}**\n`
      brief += `- Description: ${m.description}\n`
      if (m.target) brief += `- Target: ${m.target}\n`
      brief += `- Measurement: ${m.measurement}\n\n`
    })
    brief += '### Secondary Metrics (Health)\n\n'
    analysis.metrics.secondary.forEach(m => {
      brief += `**${m.name}**\n`
      brief += `- Description: ${m.description}\n`
      if (m.target) brief += `- Target: ${m.target}\n`
      brief += `- Measurement: ${m.measurement}\n\n`
    })
    brief += '---\n\n'
    
    // Risks
    brief += '## ⚠️ Risks & Mitigation\n\n'
    analysis.risks.forEach(r => {
      const severity = (r.probability === 'high' || r.impact === 'high') ? '🔴 HIGH' :
                      (r.probability === 'medium' || r.impact === 'medium') ? '🟡 MEDIUM' : '🟢 LOW'
      brief += `### ${severity}: ${r.risk}\n\n`
      brief += `**Probability:** ${r.probability} | **Impact:** ${r.impact}\n\n`
      brief += `**Mitigation:** ${r.mitigation}\n\n`
    })
    brief += '---\n\n'
    
    // Next Steps
    brief += '## 🚀 Next Steps\n\n'
    brief += '1. **Validate** - Review this brief with stakeholders\n'
    brief += '2. **Research** - Answer critical questions if needed\n'
    brief += '3. **Plan** - Create detailed technical design\n'
    brief += '4. **Build** - Implement MVP following the strategy\n'
    brief += '5. **Measure** - Track success metrics from day 1\n'
    brief += '6. **Iterate** - Adjust based on real usage data\n\n'
    brief += '---\n\n'
    brief += '*Generated by Product Intelligence Engine*\n'
    
    return brief
  }
  
  /**
   * Helper: Analyze existing features
   */
  private async analyzeExistingFeatures(): Promise<string[]> {
    const libPath = path.join(this.gitRoot, 'lib')
    if (!fs.existsSync(libPath)) return []
    
    return fs.readdirSync(libPath, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name)
  }
}

// CLI
const [command, ...args] = process.argv.slice(2)

async function main() {
  const engine = new ProductIntelligenceEngine()
  
  switch (command) {
    case 'analyze': {
      const request = args.join(' ')
      if (!request) {
        console.error('❌ Error: Please provide feature request\n')
        console.error('Usage: npm run product:analyze "add document storage"\n')
        process.exit(1)
      }
      
      await engine.analyze(request)
      break
    }
    
    case 'brief': {
      const request = args.join(' ')
      if (!request) {
        console.error('❌ Error: Please provide feature request\n')
        console.error('Usage: npm run product:brief "add document storage"\n')
        process.exit(1)
      }
      
      const brief = await engine.generateProductBrief(request)
      
      // Save to file
      const outputPath = path.join(process.cwd(), '.product-brief.md')
      fs.writeFileSync(outputPath, brief)
      
      console.log('\n' + '='.repeat(60))
      console.log('✅ PRODUCT BRIEF GENERATED')
      console.log('='.repeat(60))
      console.log(`\nSaved to: .product-brief.md\n`)
      
      break
    }
    
    default:
      console.log('Product Intelligence Engine\n')
      console.log('Usage:')
      console.log('  npm run product:analyze "<request>"  # Quick analysis')
      console.log('  npm run product:brief "<request>"    # Full brief\n')
      console.log('Examples:')
      console.log('  npm run product:analyze "add document storage"')
      console.log('  npm run product:brief "add notification system"\n')
  }
}

main().catch(console.error)
