#!/usr/bin/env tsx
/**
 * AI-Enhanced Code Structure Analyzer
 * 
 * Combines template-based analysis with LLM reasoning for deeper insights.
 * Uses Claude to detect hidden complexity and predict issues.
 */

import * as fs from 'fs'
import * as path from 'path'
import { execSync } from 'child_process'
import { callOpenAI, parseOpenAIJSON } from '../lib/ai/openai-client'

interface BasicAnalysis {
  featureName: string
  componentCount: number
  totalFiles: number
  maxNestingDepth: number
  hasSubdirectories: boolean
  hasInternalImports: boolean
  complexityLevel: 'low' | 'medium' | 'high'
  estimatedTime: string
  similarTo: string
}

interface CodeSample {
  path: string
  content: string
  type: 'component' | 'type' | 'hook' | 'util'
}

interface AIInsights {
  actualComplexity: 'low' | 'medium' | 'high'
  hiddenIssues: string[]
  recommendations: string[]
  estimatedTime: string
  reasoning: string
  confidence: number
  internalImports?: {
    count: number
    files: string[]
  }
}

interface EnhancedAnalysis extends BasicAnalysis {
  aiInsights: AIInsights
  confidenceLevel: number
  usedAI: boolean
  costEstimate: { inputTokens: number; outputTokens: number }
}

function loadBasicAnalysis(featureName: string): BasicAnalysis {
  const analysisPath = path.join(process.cwd(), `.migration-analysis-${featureName}.json`)
  
  if (!fs.existsSync(analysisPath)) {
    throw new Error(`Basic analysis not found. Run: npm run migrate:analyze ${featureName}`)
  }
  
  return JSON.parse(fs.readFileSync(analysisPath, 'utf-8'))
}

function readFile(filePath: string, maxChars: number = 1000): string {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    return content.slice(0, maxChars)
  } catch {
    return ''
  }
}

function sampleFiles(featureName: string): CodeSample[] {
  const featureDir = path.join(process.cwd(), 'components', featureName)
  const samples: CodeSample[] = []
  
  try {
    // Get all files
    const allFiles = execSync(
      `find ${featureDir} -name "*.ts" -o -name "*.tsx"`,
      { encoding: 'utf-8' }
    ).trim().split('\n').filter(Boolean)
    
    // Sample different types of files
    const types = allFiles.find(f => f.includes('type'))
    const hooks = allFiles.find(f => f.includes('hook') || f.includes('use'))
    const components = allFiles.filter(f => f.endsWith('.tsx') && !f.includes('type') && !f.includes('hook'))
    
    // Add type file if exists
    if (types) {
      samples.push({
        path: types.replace(process.cwd() + '/', ''),
        content: readFile(types, 800),
        type: 'type'
      })
    }
    
    // Add hook if exists
    if (hooks) {
      samples.push({
        path: hooks.replace(process.cwd() + '/', ''),
        content: readFile(hooks, 800),
        type: 'hook'
      })
    }
    
    // Add 2-3 component samples
    const componentSamples = components.slice(0, 3)
    componentSamples.forEach(comp => {
      samples.push({
        path: comp.replace(process.cwd() + '/', ''),
        content: readFile(comp, 800),
        type: 'component'
      })
    })
    
    return samples
  } catch (error) {
    console.warn('Warning: Could not sample files:', error)
    return []
  }
}

function detectInternalImports(featureName: string): { count: number; files: string[] } {
  const featureDir = path.join(process.cwd(), 'components', featureName)
  
  try {
    const result = execSync(
      `grep -r "from '\\./" ${featureDir} --include="*.tsx" --include="*.ts" | cut -d: -f1 | sort -u`,
      { encoding: 'utf-8' }
    ).trim()
    
    if (!result) {
      return { count: 0, files: [] }
    }
    
    const files = result.split('\n').map(f => f.replace(process.cwd() + '/', ''))
    return { count: files.length, files }
  } catch {
    return { count: 0, files: [] }
  }
}

async function getAIInsights(
  basicAnalysis: BasicAnalysis,
  samples: CodeSample[],
  internalImports: { count: number; files: string[] }
): Promise<{ insights: AIInsights; usage: { inputTokens: number; outputTokens: number } }> {
  
  const sampleCode = samples.map(s => 
    `// ${s.path} (${s.type}):\n${s.content}`
  ).join('\n\n---\n\n')
  
  const prompt = `Analyze this feature for migration complexity:

FEATURE: ${basicAnalysis.featureName}

TEMPLATE ANALYSIS:
- Components: ${basicAnalysis.componentCount}
- Total Files: ${basicAnalysis.totalFiles}
- Max Nesting: ${basicAnalysis.maxNestingDepth} levels
- Has Subdirectories: ${basicAnalysis.hasSubdirectories}
- Template Complexity: ${basicAnalysis.complexityLevel.toUpperCase()}
- Template Estimate: ${basicAnalysis.estimatedTime}
- Internal Imports: ${internalImports.count} files

CODE SAMPLES (first 800 chars of each):
${sampleCode}

MIGRATION CONTEXT:
We're moving this feature from components/${basicAnalysis.featureName}/ to features/${basicAnalysis.featureName}/.
This requires:
1. Moving all components to features/${basicAnalysis.featureName}/ui/
2. Extracting domain logic to features/${basicAnalysis.featureName}/domain/
3. Updating all import paths
4. Maintaining backward compatibility

QUESTIONS:
1. Does the code reveal hidden complexity not obvious from file counts?
2. Are there unusual patterns, circular dependencies, or tight coupling?
3. Will internal imports cause issues during migration?
4. Is the template complexity assessment accurate?
5. What specific issues might arise during migration?
6. What's the realistic time estimate?

Respond with JSON:
{
  "actualComplexity": "low|medium|high",
  "hiddenIssues": ["specific issue 1", "specific issue 2"],
  "recommendations": ["specific rec 1", "specific rec 2"],
  "estimatedTime": "X-Y hours",
  "reasoning": "brief explanation of your assessment",
  "confidence": 0.0-1.0
}

Be specific and concrete. Focus on migration-relevant insights.`

  try {
    const response = await callOpenAI({
      model: 'gpt-4-turbo-preview', // Will auto-upgrade to GPT-5 when available
      messages: [
        { 
          role: 'system', 
          content: 'You are an expert code analyzer. Respond only with valid JSON matching the requested schema.' 
        },
        { role: 'user', content: prompt }
      ],
      max_tokens: 2000,
      temperature: 0.2
    })
    
    const insights = parseOpenAIJSON<AIInsights>(response)
    
    // Add internal import info if detected
    if (internalImports.count > 0) {
      insights.internalImports = internalImports
    }
    
    return {
      insights,
      usage: {
        inputTokens: response.usage.prompt_tokens,
        outputTokens: response.usage.completion_tokens
      }
    }
  } catch (error) {
    console.error('AI analysis failed:', error)
    // Fallback to template analysis
    return {
      insights: {
        actualComplexity: basicAnalysis.complexityLevel,
        hiddenIssues: [],
        recommendations: ['AI analysis unavailable - using template estimates'],
        estimatedTime: basicAnalysis.estimatedTime,
        reasoning: 'Fallback to template analysis',
        confidence: 0.5
      },
      usage: { inputTokens: 0, outputTokens: 0 }
    }
  }
}

function calculateConfidence(
  basicAnalysis: BasicAnalysis,
  aiInsights: AIInsights
): number {
  // Combine AI confidence with agreement between template and AI
  const agreement = basicAnalysis.complexityLevel === aiInsights.actualComplexity ? 1.0 : 0.7
  return aiInsights.confidence * agreement
}

async function analyze(featureName: string): Promise<EnhancedAnalysis> {
  console.log('\n🔍 AI-ENHANCED ANALYSIS\n')
  
  // Step 1: Load basic analysis
  console.log('📊 Loading template analysis...')
  const basicAnalysis = loadBasicAnalysis(featureName)
  
  // Step 2: Sample code files
  console.log('📁 Sampling code files...')
  const samples = sampleFiles(featureName)
  console.log(`   Sampled ${samples.length} files`)
  
  // Step 3: Detect internal imports
  console.log('🔗 Analyzing internal imports...')
  const internalImports = detectInternalImports(featureName)
  if (internalImports.count > 0) {
    console.log(`   Found ${internalImports.count} files with internal imports`)
  }
  
  // Step 4: Get AI insights
  console.log('🤖 Requesting Claude analysis...')
  const { insights, usage } = await getAIInsights(basicAnalysis, samples, internalImports)
  console.log(`   Tokens: ${usage.inputTokens} in, ${usage.outputTokens} out`)
  
  // Step 5: Combine analyses
  const confidence = calculateConfidence(basicAnalysis, insights)
  
  const enhancedAnalysis: EnhancedAnalysis = {
    ...basicAnalysis,
    aiInsights: insights,
    confidenceLevel: confidence,
    usedAI: usage.inputTokens > 0,
    costEstimate: usage
  }
  
  // Save enhanced analysis
  const outputPath = path.join(process.cwd(), `.migration-analysis-ai-${featureName}.json`)
  fs.writeFileSync(outputPath, JSON.stringify(enhancedAnalysis, null, 2))
  
  return enhancedAnalysis
}

function printAnalysis(analysis: EnhancedAnalysis) {
  console.log('\n' + '='.repeat(60))
  console.log('🤖 AI-ENHANCED COMPLEXITY ANALYSIS')
  console.log('='.repeat(60))
  console.log()
  console.log(`📦 Feature: ${analysis.featureName}`)
  console.log()
  console.log('📊 TEMPLATE ANALYSIS:')
  console.log(`   Complexity: ${analysis.complexityLevel.toUpperCase()}`)
  console.log(`   Components: ${analysis.componentCount}`)
  console.log(`   Estimate: ${analysis.estimatedTime}`)
  console.log()
  console.log('🤖 AI INSIGHTS:')
  console.log(`   Actual Complexity: ${analysis.aiInsights.actualComplexity.toUpperCase()}`)
  console.log(`   Adjusted Estimate: ${analysis.aiInsights.estimatedTime}`)
  console.log(`   Confidence: ${(analysis.confidenceLevel * 100).toFixed(0)}%`)
  console.log()
  
  if (analysis.aiInsights.hiddenIssues.length > 0) {
    console.log('🚨 HIDDEN ISSUES DETECTED:')
    analysis.aiInsights.hiddenIssues.forEach(issue => {
      console.log(`   - ${issue}`)
    })
    console.log()
  }
  
  if (analysis.aiInsights.internalImports && analysis.aiInsights.internalImports.count > 0) {
    console.log('🔗 INTERNAL IMPORTS:')
    console.log(`   Count: ${analysis.aiInsights.internalImports.count} files`)
    console.log('   Files:')
    analysis.aiInsights.internalImports.files.slice(0, 5).forEach(file => {
      console.log(`   - ${file}`)
    })
    if (analysis.aiInsights.internalImports.files.length > 5) {
      console.log(`   ... and ${analysis.aiInsights.internalImports.files.length - 5} more`)
    }
    console.log()
  }
  
  if (analysis.aiInsights.recommendations.length > 0) {
    console.log('💡 AI RECOMMENDATIONS:')
    analysis.aiInsights.recommendations.forEach(rec => {
      console.log(`   - ${rec}`)
    })
    console.log()
  }
  
  console.log('🧠 AI REASONING:')
  console.log(`   ${analysis.aiInsights.reasoning}`)
  console.log()
  
  if (analysis.usedAI) {
    const cost = (analysis.costEstimate.inputTokens * 0.003 / 1000) + 
                 (analysis.costEstimate.outputTokens * 0.015 / 1000)
    console.log(`💰 Cost: ~$${cost.toFixed(4)} (${analysis.costEstimate.inputTokens} + ${analysis.costEstimate.outputTokens} tokens)`)
    console.log()
  }
  
  console.log('💾 Enhanced analysis saved to:')
  console.log(`   .migration-analysis-ai-${analysis.featureName}.json`)
  console.log()
  console.log('='.repeat(60))
  console.log()
}

// CLI
const featureName = process.argv[2]

if (!featureName) {
  console.error('❌ Usage: npm run migrate:analyze:ai <feature-name>')
  console.error('   Example: npm run migrate:analyze:ai vision')
  console.error('')
  console.error('   Note: Run basic analysis first: npm run migrate:analyze vision')
  process.exit(1)
}

analyze(featureName)
  .then(printAnalysis)
  .catch(error => {
    console.error('❌ Error:', error.message)
    process.exit(1)
  })
