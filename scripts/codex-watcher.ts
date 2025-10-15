#!/usr/bin/env tsx
/**
 * Codex Watcher
 * 
 * Watches for Windsurf requests and triggers Codex validations automatically.
 * Creates a feedback loop between IDE AI (Windsurf) and Terminal AI (Codex).
 */

import { execSync } from 'child_process'
import { getContextBridge, SharedContext } from '../lib/ai/context-bridge'

const POLL_INTERVAL = 3000 // Check every 3 seconds

interface WatcherOptions {
  verbose?: boolean
  autoRun?: boolean
}

class CodexWatcher {
  private bridge = getContextBridge()
  private options: WatcherOptions
  private running = false
  
  constructor(options: WatcherOptions = {}) {
    this.options = {
      verbose: false,
      autoRun: true,
      ...options
    }
  }
  
  async start() {
    this.running = true
    
    console.log('👁️  Codex Watcher Started')
    console.log('━'.repeat(50))
    console.log('Monitoring for Windsurf requests...')
    console.log('Press Ctrl+C to stop\n')
    
    // Show current context
    await this.showStatus()
    
    // Start watching
    while (this.running) {
      await this.poll()
      await this.sleep(POLL_INTERVAL)
    }
  }
  
  stop() {
    this.running = false
    console.log('\n✅ Codex Watcher stopped')
  }
  
  private async poll() {
    try {
      const hasPending = await this.bridge.hasPendingAction()
      
      if (hasPending) {
        const context = await this.bridge.read()
        await this.handleAction(context)
      }
    } catch (error) {
      console.error('❌ Poll error:', error)
    }
  }
  
  private async handleAction(context: SharedContext) {
    const { nextAction, feature } = context
    
    if (!nextAction) return
    
    console.log(`\n🔔 Windsurf requested: ${nextAction}`)
    console.log(`   Feature: ${feature || 'unknown'}`)
    console.log(`   Phase: ${context.phase || 'unknown'}`)
    console.log('')
    
    try {
      let command: string
      let description: string
      
      switch (nextAction) {
        case 'validate':
          command = this.getValidationCommand(context)
          description = 'Running validation...'
          break
        
        case 'test':
          command = `npm test features/${feature}`
          description = 'Running tests...'
          break
        
        case 'build':
          command = 'npm run build'
          description = 'Running build...'
          break
        
        case 'analyze':
          command = 'npm run arch:validate'
          description = 'Analyzing architecture...'
          break
        
        default:
          console.log(`⚠️  Unknown action: ${nextAction}`)
          return
      }
      
      console.log(`🤖 Codex: ${description}`)
      const result = await this.executeCommand(command)
      
      // Report back to Windsurf
      await this.bridge.updateFromCodex({
        command,
        result: result.output,
        success: result.success,
        suggestions: this.extractSuggestions(result.output, result.success)
      })
      
      console.log(result.success ? '✅ Success' : '❌ Failed')
      if (!result.success && this.options.verbose) {
        console.log('\nOutput:')
        console.log(result.output.substring(0, 500)) // First 500 chars
      }
      
      console.log('')
      console.log('Waiting for next request...\n')
      
    } catch (error) {
      console.error('❌ Error executing action:', error)
      
      await this.bridge.updateFromCodex({
        command: nextAction,
        result: `Error: ${error}`,
        success: false,
        suggestions: ['Check logs for details']
      })
    }
  }
  
  private getValidationCommand(context: SharedContext): string {
    const { phase, feature } = context
    
    switch (phase) {
      case 'tests':
        return `npm test features/${feature}`
      
      case 'components':
        return 'npm run build'
      
      case 'domain':
        return 'npm test'
      
      case 'validation':
        return 'npm test && npm run build && npm run arch:validate'
      
      default:
        return 'npm run build'
    }
  }
  
  private async executeCommand(command: string): Promise<{
    output: string
    success: boolean
  }> {
    try {
      const output = execSync(command, {
        encoding: 'utf-8',
        stdio: 'pipe'
      })
      
      return { output, success: true }
    } catch (error: any) {
      return {
        output: error.stdout || error.stderr || error.message,
        success: false
      }
    }
  }
  
  private extractSuggestions(output: string, success: boolean): string[] {
    if (success) return []
    
    const suggestions: string[] = []
    
    // Look for common error patterns
    if (output.includes('Module not found')) {
      suggestions.push('Check import paths - may need to update after file move')
    }
    
    if (output.includes('Type error') || output.includes('TS')) {
      suggestions.push('TypeScript error - check type exports and imports')
    }
    
    if (output.includes('Test failed') || output.includes('FAIL')) {
      suggestions.push('Tests failing - check if test imports were updated')
    }
    
    if (output.includes('Cannot find module')) {
      suggestions.push('Missing module - verify all files were moved correctly')
    }
    
    return suggestions
  }
  
  private async showStatus() {
    try {
      const context = await this.bridge.read()
      
      console.log('Current Context:')
      console.log(`  Task: ${context.currentTask}`)
      if (context.feature) console.log(`  Feature: ${context.feature}`)
      if (context.phase) console.log(`  Phase: ${context.phase}`)
      if (context.windsurfStatus) console.log(`  Status: ${context.windsurfStatus}`)
      console.log('')
    } catch {
      console.log('No active context yet\n')
    }
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Handle graceful shutdown
let watcher: CodexWatcher | null = null

process.on('SIGINT', () => {
  console.log('\n\nReceived SIGINT, shutting down gracefully...')
  if (watcher) {
    watcher.stop()
  }
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('\n\nReceived SIGTERM, shutting down gracefully...')
  if (watcher) {
    watcher.stop()
  }
  process.exit(0)
})

// CLI
const args = process.argv.slice(2)
const verbose = args.includes('--verbose') || args.includes('-v')

watcher = new CodexWatcher({ verbose })
watcher.start().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
