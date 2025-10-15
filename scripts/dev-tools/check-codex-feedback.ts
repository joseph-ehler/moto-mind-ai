#!/usr/bin/env tsx
/**
 * Check Codex Feedback
 * 
 * Quick command to see what Codex validated after your last commit.
 * Run this after committing to see if Codex found any issues.
 */

import { getContextBridge } from '../lib/ai/context-bridge'

async function checkFeedback() {
  const bridge = getContextBridge()
  
  try {
    const context = await bridge.read()
    const feedback = await bridge.getCodexFeedback()
    
    console.log('\n' + '='.repeat(50))
    console.log('🤖 CODEX FEEDBACK')
    console.log('='.repeat(50))
    console.log()
    
    // Show current context
    console.log('📊 Current Context:')
    if (context.feature) console.log(`   Feature: ${context.feature}`)
    if (context.phase) console.log(`   Phase: ${context.phase}`)
    if (context.windsurfStatus) console.log(`   Status: ${context.windsurfStatus}`)
    console.log()
    
    // Show Codex feedback
    if (!feedback) {
      console.log('⏳ No Codex feedback yet')
      console.log('   Codex may still be running validation')
      console.log('   Or watcher may not be running')
      console.log()
      console.log('💡 Start watcher: npm run codex:watch')
      console.log()
      return
    }
    
    console.log('🤖 Last Codex Validation:')
    console.log(`   Command: ${feedback.command}`)
    console.log(`   Status: ${feedback.success ? '✅ Success' : '❌ Failed'}`)
    
    if (feedback.timestamp) {
      const timeAgo = Math.floor((Date.now() - new Date(feedback.timestamp).getTime()) / 1000)
      console.log(`   Time: ${timeAgo}s ago`)
    }
    
    console.log()
    
    if (!feedback.success) {
      console.log('❌ Issues Found:')
      console.log()
      console.log('Output:')
      console.log(feedback.result.substring(0, 500))
      if (feedback.result.length > 500) {
        console.log('...(truncated)')
      }
      console.log()
      
      if (feedback.suggestions && feedback.suggestions.length > 0) {
        console.log('💡 Suggestions:')
        feedback.suggestions.forEach(s => console.log(`   - ${s}`))
        console.log()
      }
    } else {
      console.log('✅ All validations passed!')
      console.log()
      console.log(feedback.result.substring(0, 200))
      console.log()
    }
    
    // Show next action if any
    if (context.nextAction) {
      console.log(`⏭️  Next Action: ${context.nextAction}`)
      console.log('   (Codex will handle this automatically if watcher is running)')
      console.log()
    }
    
    console.log('='.repeat(50))
    console.log()
    
  } catch (error: any) {
    console.error('❌ Error:', error.message)
    console.log()
    console.log('💡 Make sure you have an active migration session')
    console.log('   Start one: npm run migrate:codex <feature>')
    console.log()
  }
}

checkFeedback()
