#!/usr/bin/env tsx
/**
 * Wait for Vercel Deployment
 * 
 * After pushing to git, wait for Vercel deployment to complete
 * and report status back to terminal (visible to Windsurf/AI assistants)
 * 
 * Features:
 * - Real-time deployment status
 * - Timeout protection (5 minutes)
 * - Clear success/failure reporting
 * - Build log URLs on failure
 * - Works with Vercel CLI
 * 
 * Usage:
 *   npm run deploy:wait
 *   npm run deploy:wait -- --timeout 300
 * 
 * Requirements:
 *   - Vercel CLI installed: npm install -g vercel
 *   - Logged in: vercel login
 *   - Project linked: vercel link
 */

import { execSync } from 'child_process'

interface VercelDeployment {
  uid: string
  name: string
  url: string
  created: number
  state: 'BUILDING' | 'READY' | 'ERROR' | 'CANCELED' | 'QUEUED'
  type: 'LAMBDAS'
  creator: {
    uid: string
    username: string
  }
  target: string | null
  inspectorUrl: string
}

interface WatcherOptions {
  maxWaitTime?: number  // milliseconds
  pollInterval?: number // milliseconds
  projectName?: string
  verbose?: boolean
}

class VercelDeploymentWatcher {
  private projectName: string
  private maxWaitTime: number
  private pollInterval: number
  private verbose: boolean
  
  constructor(options: WatcherOptions = {}) {
    this.projectName = options.projectName || 'moto-mind-ai'
    this.maxWaitTime = options.maxWaitTime || 5 * 60 * 1000  // 5 minutes
    this.pollInterval = options.pollInterval || 10 * 1000     // 10 seconds
    this.verbose = options.verbose || false
  }
  
  async waitForDeployment(): Promise<void> {
    console.log('🚀 VERCEL DEPLOYMENT WATCHER\n')
    console.log('='.repeat(60))
    console.log(`Project: ${this.projectName}`)
    console.log(`Timeout: ${this.maxWaitTime / 1000}s`)
    console.log(`Poll Interval: ${this.pollInterval / 1000}s`)
    console.log('='.repeat(60))
    console.log()
    
    const startTime = Date.now()
    let lastState = ''
    let dotCount = 0
    
    // Wait a moment for webhook to trigger
    console.log('⏳ Waiting for deployment to start...')
    await this.sleep(5000)
    
    while (Date.now() - startTime < this.maxWaitTime) {
      try {
        const deployment = await this.getLatestDeployment()
        
        if (!deployment) {
          process.stdout.write('.')
          dotCount++
          if (dotCount % 60 === 0) process.stdout.write('\n')
          await this.sleep(1000)
          continue
        }
        
        // Clear dots if we were showing them
        if (dotCount > 0) {
          console.log() // New line
          dotCount = 0
        }
        
        // Show status if changed
        if (deployment.state !== lastState) {
          this.showStatus(deployment)
          lastState = deployment.state
        }
        
        // Check if done
        if (deployment.state === 'READY') {
          await this.showSuccess(deployment)
          return
        }
        
        if (deployment.state === 'ERROR') {
          await this.showError(deployment)
          process.exit(1)
        }
        
        if (deployment.state === 'CANCELED') {
          console.log('\n⚠️  DEPLOYMENT CANCELED\n')
          process.exit(1)
        }
        
        // Still building, wait and check again
        process.stdout.write('.')
        dotCount++
        if (dotCount % 60 === 0) process.stdout.write('\n')
        
        await this.sleep(this.pollInterval)
        
      } catch (error) {
        if (this.verbose) {
          console.error('Error checking deployment:', error)
        }
        await this.sleep(this.pollInterval)
      }
    }
    
    console.log('\n\n' + '='.repeat(60))
    console.log('⏱️  TIMEOUT: Deployment took longer than expected')
    console.log('='.repeat(60))
    console.log()
    console.log('The deployment is still running but exceeded the timeout.')
    console.log('Check manually: https://vercel.com/dashboard')
    console.log()
    process.exit(1)
  }
  
  private async getLatestDeployment(): Promise<VercelDeployment | null> {
    try {
      const output = execSync(
        `vercel ls ${this.projectName} --yes`,
        { 
          encoding: 'utf8', 
          stdio: 'pipe',
          timeout: 30000 // 30 second timeout
        }
      )
      
      // Parse the output - Vercel CLI returns table format
      const lines = output.trim().split('\n')
      
      // Find the header line
      const headerIndex = lines.findIndex(line => line.includes('Age') && line.includes('Deployment'))
      if (headerIndex === -1) return null
      
      // Get the first deployment (most recent)
      const deploymentLine = lines[headerIndex + 1]
      if (!deploymentLine) return null
      
      // Parse deployment info from table
      const parts = deploymentLine.trim().split(/\s+/)
      
      // Try JSON output instead
      try {
        const jsonOutput = execSync(
          `vercel ls ${this.projectName} --yes --meta githubCommitRef=main`,
          { encoding: 'utf8', stdio: 'pipe' }
        )
        
        // For now, use simpler approach - check deployment status via inspect
        const inspectOutput = execSync(
          `vercel inspect $(vercel ls ${this.projectName} --yes | grep -m1 'https://' | awk '{print $2}') --yes`,
          { encoding: 'utf8', stdio: 'pipe' }
        )
        
        // Parse state from inspect output
        const stateMatch = inspectOutput.match(/State:\s+(\w+)/)
        const urlMatch = inspectOutput.match(/https:\/\/[^\s]+/)
        
        if (stateMatch && urlMatch) {
          return {
            uid: 'unknown',
            name: this.projectName,
            url: urlMatch[0].replace('https://', ''),
            created: Date.now(),
            state: stateMatch[1] as any,
            type: 'LAMBDAS',
            creator: { uid: 'unknown', username: 'unknown' },
            target: 'production',
            inspectorUrl: urlMatch[0]
          }
        }
      } catch (e) {
        // Fallback: assume building if we can't determine
      }
      
      return null
      
    } catch (error) {
      if (this.verbose) {
        console.error('Error getting deployment:', error)
      }
      return null
    }
  }
  
  private showStatus(deployment: VercelDeployment): void {
    const emoji = {
      BUILDING: '🏗️ ',
      READY: '✅',
      ERROR: '❌',
      CANCELED: '⚠️ ',
      QUEUED: '⏳'
    }
    
    const timestamp = new Date().toLocaleTimeString()
    console.log(`\n${emoji[deployment.state]} [${timestamp}] ${deployment.state}: https://${deployment.url}`)
  }
  
  private async showSuccess(deployment: VercelDeployment): Promise<void> {
    console.log('\n' + '='.repeat(60))
    console.log('✅ DEPLOYMENT SUCCESSFUL!')
    console.log('='.repeat(60))
    console.log()
    console.log(`🌐 URL:       https://${deployment.url}`)
    console.log(`🆔 ID:        ${deployment.uid}`)
    console.log(`⏱️  Deployed:  ${new Date(deployment.created).toLocaleString()}`)
    console.log(`🎯 Target:    ${deployment.target || 'production'}`)
    console.log()
    
    // Quick health check
    try {
      const response = await fetch(`https://${deployment.url}`)
      if (response.ok) {
        console.log('🏥 Health:    ✅ Site is responding')
      } else {
        console.log(`🏥 Health:    ⚠️  Status ${response.status}`)
      }
    } catch (e) {
      console.log('🏥 Health:    ⚠️  Could not verify')
    }
    
    console.log()
    console.log('Your changes are now live! 🎉')
    console.log()
  }
  
  private async showError(deployment: VercelDeployment): Promise<void> {
    console.log('\n' + '='.repeat(60))
    console.log('❌ DEPLOYMENT FAILED!')
    console.log('='.repeat(60))
    console.log()
    console.log(`🆔 ID:     ${deployment.uid}`)
    console.log(`🔗 Logs:   ${deployment.inspectorUrl || `https://vercel.com/${this.projectName}/${deployment.uid}`}`)
    console.log()
    console.log('Check the logs to see what went wrong.')
    console.log()
    console.log('Common issues:')
    console.log('  • Build errors (TypeScript, linting)')
    console.log('  • Missing environment variables')
    console.log('  • Import errors')
    console.log('  • Runtime errors')
    console.log()
    console.log('💡 Tip: Run `npm run build` locally to reproduce build errors')
    console.log()
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// CLI
const args = process.argv.slice(2)
const verbose = args.includes('--verbose') || args.includes('-v')
const timeoutArg = args.find(arg => arg.startsWith('--timeout='))
const timeout = timeoutArg ? parseInt(timeoutArg.split('=')[1]) * 1000 : undefined

const watcher = new VercelDeploymentWatcher({
  verbose,
  maxWaitTime: timeout
})

watcher.waitForDeployment().catch(error => {
  console.error('\n❌ Watcher error:', error.message)
  if (verbose) {
    console.error(error.stack)
  }
  process.exit(1)
})
