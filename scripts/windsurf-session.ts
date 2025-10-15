#!/usr/bin/env tsx
/**
 * Windsurf Session Manager
 * 
 * Formats current migration context for easy copy-paste to Windsurf.
 * Bridges the gap between git/Codex automation and Windsurf intelligence.
 * 
 * Usage:
 *   npm run windsurf:status
 *   Copy output and paste to Windsurf chat
 *   Windsurf reads context and responds with next steps
 */

import { getContextBridge } from '../lib/ai/context-bridge'
import { existsSync, readFileSync } from 'fs'

async function getSessionStatus() {
  const bridge = getContextBridge()
  
  try {
    const context = await bridge.read()
    const feedback = await bridge.getCodexFeedback()
    
    // Check if we have an active session
    if (!context.sessionId || context.sessionId === 'unknown') {
      console.log('\n⚠️  No active migration session')
      console.log('   Start one: npm run migrate:codex <feature>')
      console.log()
      return
    }
    
    // Load AI analysis if it exists
    const analysisPath = context.feature 
      ? `.migration-analysis-ai-${context.feature}.json`
      : null
    
    const analysis = analysisPath && existsSync(analysisPath)
      ? JSON.parse(readFileSync(analysisPath, 'utf-8'))
      : null
    
    // Load prediction data if it exists
    const predictionPath = context.feature
      ? `.migration-predictions-${context.feature}.json`
      : null
      
    const predictions = predictionPath && existsSync(predictionPath)
      ? JSON.parse(readFileSync(predictionPath, 'utf-8'))
      : null
    
    // Format output for Windsurf
    console.log('\n' + '='.repeat(70))
    console.log('📊 MIGRATION STATUS - Copy and paste this to Windsurf →')
    console.log('='.repeat(70))
    console.log()
    
    // Basic info
    console.log(`**Feature:** ${context.feature || 'Unknown'}`)
    console.log(`**Phase:** ${context.phase || 'Not started'}`)
    console.log(`**Status:** ${context.windsurfStatus || 'In progress'}`)
    
    if (context.files && context.files.length > 0) {
      console.log(`**Files:** ${context.files.length} files modified`)
    }
    
    console.log()
    
    // Codex validation results
    if (feedback) {
      const icon = feedback.success ? '✅' : '❌'
      console.log(`${icon} **Latest Codex Validation:**`)
      console.log(`   Command: \`${feedback.command}\``)
      console.log(`   Result: ${feedback.success ? '**PASSED**' : '**FAILED**'}`)
      
      if (!feedback.success) {
        console.log()
        console.log('   **Error:**')
        console.log('   ```')
        console.log('   ' + feedback.result.substring(0, 300).split('\n').join('\n   '))
        if (feedback.result.length > 300) {
          console.log('   ...(truncated)')
        }
        console.log('   ```')
        
        if (feedback.suggestions && feedback.suggestions.length > 0) {
          console.log()
          console.log('   **Suggestions:**')
          feedback.suggestions.forEach(s => {
            console.log(`   - ${s}`)
          })
        }
      } else {
        const resultPreview = feedback.result.substring(0, 150)
        console.log(`   Output: ${resultPreview}${feedback.result.length > 150 ? '...' : ''}`)
      }
      
      const timeAgo = Math.floor((Date.now() - new Date(feedback.timestamp).getTime()) / 1000)
      console.log(`   *Validated ${timeAgo}s ago*`)
    } else {
      console.log('⏳ **Waiting for Codex validation...**')
      if (context.nextAction) {
        console.log(`   Requested action: ${context.nextAction}`)
      }
    }
    
    console.log()
    
    // AI Analysis summary
    if (analysis) {
      console.log('🤖 **AI Analysis Summary:**')
      console.log(`   Complexity: **${analysis.aiInsights.actualComplexity.toUpperCase()}**`)
      console.log(`   Time Estimate: ${analysis.aiInsights.estimatedTime}`)
      console.log(`   Confidence: ${Math.round(analysis.confidenceLevel * 100)}%`)
      
      if (analysis.aiInsights.hiddenIssues && analysis.aiInsights.hiddenIssues.length > 0) {
        console.log()
        console.log('   **Hidden Issues Detected:**')
        analysis.aiInsights.hiddenIssues.slice(0, 3).forEach((issue: string) => {
          console.log(`   - ${issue}`)
        })
        if (analysis.aiInsights.hiddenIssues.length > 3) {
          console.log(`   - ...and ${analysis.aiInsights.hiddenIssues.length - 3} more`)
        }
      }
      
      console.log()
    }
    
    // High-probability predicted issues
    if (predictions && predictions.predictions) {
      const highProbIssues = predictions.predictions
        .filter((p: any) => p.probability >= 80)
        .slice(0, 3)
      
      if (highProbIssues.length > 0) {
        console.log('⚠️  **High-Probability Issues:**')
        highProbIssues.forEach((issue: any) => {
          console.log(`   - ${issue.issue} (${issue.probability}% likely)`)
        })
        console.log()
      }
    }
    
    // Intelligent next step suggestion
    console.log('🎯 **What Should Windsurf Do Next:**')
    console.log()
    
    const nextStep = determineNextStep(context, feedback, analysis)
    console.log(nextStep)
    
    console.log()
    console.log('='.repeat(70))
    console.log()
    
  } catch (error: any) {
    console.error('❌ Error reading session:', error.message)
    console.log()
    console.log('💡 Make sure you have an active migration:')
    console.log('   npm run migrate:codex <feature>')
    console.log()
  }
}

function determineNextStep(
  context: any,
  feedback: any,
  analysis: any
): string {
  // No feedback yet
  if (!feedback) {
    return '⏳ Waiting for Codex validation. Once complete, run this command again.'
  }
  
  // Validation failed
  if (!feedback.success) {
    return `❌ **Validation failed.** Windsurf should:
   1. Analyze the error above
   2. Determine the root cause
   3. Fix the issue (likely import/export problem)
   4. Request re-validation
   
   Say: "I see the validation failed. Let me analyze the error and fix it..."`
  }
  
  // Validation succeeded - determine next phase
  const phase = context.phase
  
  if (phase === 'tests') {
    return `✅ **Tests validated!** Windsurf should:
   1. Acknowledge test success
   2. Move to Phase 2: Components
   3. Start migrating component files
   
   Say: "Tests are validated! ${feedback.result.includes('passing') ? 'All tests passing.' : ''} Let me start Phase 2: Component Migration..."`
  }
  
  if (phase === 'components') {
    return `✅ **Components validated!** Windsurf should:
   1. Acknowledge build success
   2. Move to Phase 3: Domain Logic
   3. Extract business logic from components
   
   Say: "Components migrated successfully! Build is passing. Let me work on Phase 3: Domain Logic..."`
  }
  
  if (phase === 'domain') {
    return `✅ **Domain logic validated!** Windsurf should:
   1. Acknowledge completion
   2. Run final validation
   3. Prepare for completion
   
   Say: "Domain logic extracted! Let me run final validation and complete the migration..."`
  }
  
  if (phase === 'validation' || phase === 'complete') {
    return `✅ **Migration complete!** Windsurf should:
   1. Celebrate completion
   2. Run: npm run migrate:complete
   3. Review results and document learnings
   
   Say: "Migration complete! All phases validated. Let me run the completion analysis..."`
  }
  
  return `✅ **Validation passed.** Windsurf should:
   Continue current phase work and commit when ready.`
}

// CLI
getSessionStatus()
