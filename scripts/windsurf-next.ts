#!/usr/bin/env tsx
/**
 * Windsurf Next Action Helper
 * 
 * Quick command to see what Windsurf should do next.
 * Ultra-concise output for fast copy-paste.
 */

import { getContextBridge } from '../lib/ai/context-bridge'

async function getNextAction() {
  const bridge = getContextBridge()
  
  try {
    const context = await bridge.read()
    const feedback = await bridge.getCodexFeedback()
    
    if (!context.sessionId || context.sessionId === 'unknown') {
      console.log('No active session. Start: npm run migrate:codex <feature>')
      return
    }
    
    console.log('\n🎯 NEXT ACTION FOR WINDSURF:')
    console.log('-'.repeat(50))
    
    if (!feedback) {
      console.log('⏳ Waiting for Codex validation')
      if (context.nextAction) {
        console.log(`   Requested: ${context.nextAction}`)
      }
      console.log('\n💡 Run: npm run windsurf:status (for full context)')
      return
    }
    
    if (!feedback.success) {
      console.log('❌ Validation failed')
      console.log(`   Error: ${feedback.result.substring(0, 100)}...`)
      console.log('\n→ Analyze error and fix')
      console.log('\n💡 Run: npm run windsurf:status (for details)')
      return
    }
    
    // Success - what's next?
    const phase = context.phase
    
    if (phase === 'tests') {
      console.log('✅ Tests validated')
      console.log('\n→ Move to Phase 2: Components')
      console.log('   Generate component files in features/*/ui/')
    } else if (phase === 'components') {
      console.log('✅ Components validated')
      console.log('\n→ Move to Phase 3: Domain Logic')
      console.log('   Extract business logic')
    } else if (phase === 'domain') {
      console.log('✅ Domain logic validated')
      console.log('\n→ Run final validation')
      console.log('   npm run migrate:complete')
    } else {
      console.log(`✅ ${phase} validated`)
      console.log('\n→ Continue to next phase')
    }
    
    console.log('-'.repeat(50))
    console.log()
    
  } catch (error) {
    console.log('Error: No active migration')
    console.log('Start: npm run migrate:codex <feature>')
  }
}

getNextAction()
