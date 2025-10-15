#!/usr/bin/env tsx
/**
 * AI-Powered Build Error Parser
 * 
 * Takes cryptic build errors and makes them friendly + actionable
 * Uses OpenAI to explain errors in plain English with specific fixes
 * 
 * Usage: npm run build:errors:ai <logs-file>
 */

import * as fs from 'fs'
import * as path from 'path'
import { BuildError, BuildErrorParser } from './parse-build-errors'
import { getOpenAIAnalysis } from '../shared/ai-helper'

interface AIErrorExplanation {
  plainEnglish: string
  rootCause: string
  howToFix: string[]
  preventionTip: string
  relatedIssues?: string[]
  confidence: number
}

interface EnhancedError extends BuildError {
  aiExplanation?: AIErrorExplanation
}

class AIBuildErrorParser {
  private baseParser: BuildErrorParser
  private totalCost = 0
  
  constructor() {
    this.baseParser = new BuildErrorParser()
  }
  
  /**
   * Parse errors and enhance with AI explanations
   */
  async parseWithAI(logs: string, codebaseContext?: any): Promise<EnhancedError[]> {
    console.log('🤖 AI-POWERED BUILD ERROR ANALYSIS\n')
    console.log('='.repeat(70))
    console.log('Step 1: Parsing build logs...\n')
    
    // Use existing parser to extract structured errors
    const baseErrors = this.baseParser.parse(logs)
    
    if (baseErrors.length === 0) {
      console.log('✅ No errors found in build logs!')
      return []
    }
    
    console.log(`Found ${baseErrors.length} error(s)\n`)
    console.log('Step 2: Getting AI explanations...\n')
    
    // Get AI explanations for each error
    const enhancedErrors: EnhancedError[] = []
    
    for (let i = 0; i < baseErrors.length; i++) {
      const error = baseErrors[i]
      console.log(`   [${i + 1}/${baseErrors.length}] Analyzing: ${error.type} error...`)
      
      try {
        const explanation = await this.explainError(error, codebaseContext)
        enhancedErrors.push({
          ...error,
          aiExplanation: explanation
        })
      } catch (err) {
        console.log(`      ⚠️  AI explanation failed, using base parsing`)
        enhancedErrors.push(error)
      }
    }
    
    console.log('\n' + '='.repeat(70))
    console.log(`💰 AI Cost: $${this.totalCost.toFixed(4)}`)
    console.log('='.repeat(70))
    console.log()
    
    return enhancedErrors
  }
  
  /**
   * Get AI explanation for a single error
   */
  private async explainError(
    error: BuildError,
    codebaseContext?: any
  ): Promise<AIErrorExplanation> {
    const result = await getOpenAIAnalysis<AIErrorExplanation>({
      role: 'senior TypeScript/Next.js developer helping junior developers',
      task: `Explain this build error in plain English and provide actionable fixes.
      
Be specific and concrete. Assume the developer is competent but needs guidance.
Focus on:
1. What the error actually means (plain English)
2. Why it happened (root cause)
3. How to fix it (step-by-step)
4. How to prevent it (best practices)`,
      data: {
        error: {
          type: error.type,
          message: error.message,
          file: error.file,
          line: error.line,
          suggestion: error.suggestion
        },
        context: codebaseContext || {
          framework: 'Next.js 14',
          typescript: true,
          architecture: 'Feature-first with barrel exports',
          common_patterns: [
            'Use @/ aliases for imports',
            'Features in features/* with domain/data/ui/hooks',
            'Shared utilities in lib/*',
            'Design system in components/design-system'
          ]
        }
      },
      format: `JSON with:
{
  "plainEnglish": "What this means in simple terms",
  "rootCause": "Why this happened",
  "howToFix": ["step 1", "step 2", ...],
  "preventionTip": "How to avoid this in future",
  "relatedIssues": ["other issues this might cause"],
  "confidence": 0.0-1.0
}`
    })
    
    this.totalCost += result.cost
    
    return result.analysis
  }
  
  /**
   * Format enhanced errors for display
   */
  format(errors: EnhancedError[]): string {
    if (errors.length === 0) {
      return '\n✅ No errors found!\n'
    }
    
    let output = '\n🤖 AI-POWERED ERROR ANALYSIS:\n'
    output += '='.repeat(70) + '\n'
    
    errors.forEach((error, i) => {
      output += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`
      output += `\n🔴 ERROR ${i + 1} of ${errors.length}\n\n`
      
      // Original error
      output += `📋 Technical Error:\n`
      output += `   ${error.message}\n\n`
      
      if (error.file) {
        output += `📁 Location: ${error.file}`
        if (error.line) output += `:${error.line}`
        if (error.column) output += `:${error.column}`
        output += '\n\n'
      }
      
      // AI Explanation
      if (error.aiExplanation) {
        const ai = error.aiExplanation
        
        output += `💡 What This Means:\n`
        output += `   ${ai.plainEnglish}\n\n`
        
        output += `🔍 Root Cause:\n`
        output += `   ${ai.rootCause}\n\n`
        
        output += `🔧 How to Fix:\n`
        ai.howToFix.forEach((step, idx) => {
          output += `   ${idx + 1}. ${step}\n`
        })
        output += '\n'
        
        output += `🛡️  Prevention:\n`
        output += `   ${ai.preventionTip}\n`
        
        if (ai.relatedIssues && ai.relatedIssues.length > 0) {
          output += `\n⚠️  Watch Out For:\n`
          ai.relatedIssues.forEach(issue => {
            output += `   • ${issue}\n`
          })
        }
        
        output += `\n   AI Confidence: ${(ai.confidence * 100).toFixed(0)}%\n`
      } else if (error.suggestion) {
        output += `💡 Suggestion:\n`
        output += `   ${error.suggestion}\n`
      }
    })
    
    output += '\n' + '='.repeat(70) + '\n'
    output += `\n📊 Total: ${errors.length} error(s) analyzed\n`
    output += `💰 Analysis Cost: $${this.totalCost.toFixed(4)}\n\n`
    
    return output
  }
  
  /**
   * Generate markdown report
   */
  generateReport(errors: EnhancedError[]): string {
    let report = '# 🤖 AI Build Error Analysis Report\n\n'
    report += `**Generated:** ${new Date().toISOString()}\n`
    report += `**Total Errors:** ${errors.length}\n`
    report += `**Analysis Cost:** $${this.totalCost.toFixed(4)}\n\n`
    report += '---\n\n'
    
    errors.forEach((error, i) => {
      report += `## Error ${i + 1}: ${error.type.toUpperCase()}\n\n`
      
      report += '### Technical Details\n\n'
      report += `**Message:** ${error.message}\n\n`
      
      if (error.file) {
        report += `**Location:** \`${error.file}`
        if (error.line) report += `:${error.line}`
        if (error.column) report += `:${error.column}`
        report += '`\n\n'
      }
      
      if (error.aiExplanation) {
        const ai = error.aiExplanation
        
        report += '### 💡 Plain English Explanation\n\n'
        report += `${ai.plainEnglish}\n\n`
        
        report += '### 🔍 Root Cause\n\n'
        report += `${ai.rootCause}\n\n`
        
        report += '### 🔧 How to Fix\n\n'
        ai.howToFix.forEach((step, idx) => {
          report += `${idx + 1}. ${step}\n`
        })
        report += '\n'
        
        report += '### 🛡️ Prevention\n\n'
        report += `${ai.preventionTip}\n\n`
        
        if (ai.relatedIssues && ai.relatedIssues.length > 0) {
          report += '### ⚠️ Related Issues\n\n'
          ai.relatedIssues.forEach(issue => {
            report += `- ${issue}\n`
          })
          report += '\n'
        }
        
        report += `**AI Confidence:** ${(ai.confidence * 100).toFixed(0)}%\n\n`
      }
      
      report += '---\n\n'
    })
    
    report += '*Generated by AI Build Error Parser using OpenAI GPT-4*\n'
    
    return report
  }
}

// CLI
async function main() {
  const logsFile = process.argv[2]
  
  if (!logsFile) {
    console.error('❌ Error: Please provide build logs file\n')
    console.error('Usage: npm run build:errors:ai <logs-file>\n')
    console.error('Example: npm run build:errors:ai .vercel-build.log\n')
    process.exit(1)
  }
  
  if (!fs.existsSync(logsFile)) {
    console.error(`❌ Error: File not found: ${logsFile}\n`)
    process.exit(1)
  }
  
  const logs = fs.readFileSync(logsFile, 'utf8')
  const parser = new AIBuildErrorParser()
  
  try {
    const errors = await parser.parseWithAI(logs)
    
    // Display formatted output
    console.log(parser.format(errors))
    
    // Save detailed report
    const reportPath = path.join(process.cwd(), '.build-errors-ai.md')
    const report = parser.generateReport(errors)
    fs.writeFileSync(reportPath, report)
    
    console.log(`📄 Detailed report saved to: .build-errors-ai.md\n`)
    
    process.exit(errors.length > 0 ? 1 : 0)
  } catch (error) {
    console.error('❌ Error analyzing build logs:', error)
    process.exit(1)
  }
}

// Export for use in other scripts
export { AIBuildErrorParser }
export type { EnhancedError, AIErrorExplanation }

if (require.main === module) {
  main().catch(console.error)
}
