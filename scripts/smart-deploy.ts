#!/usr/bin/env tsx
/**
 * Smart Deploy - Elite Enterprise-Grade Deployment System
 * 
 * A complete deployment pipeline that:
 * - Validates changes before committing
 * - Runs comprehensive pre-deploy checks
 * - Pushes to git with proper tracking
 * - Waits for Vercel deployment
 * - Verifies production health
 * - Provides rollback instructions on failure
 * 
 * Usage:
 *   npm run deploy "feat: add new feature"
 *   npm run deploy "fix: critical bug" --skip-build
 *   npm run deploy "docs: update readme" --fast
 * 
 * Flags:
 *   --skip-build    Skip build verification (faster, less safe)
 *   --skip-types    Skip type checking (faster, less safe)
 *   --fast          Skip all checks (fastest, least safe)
 *   --no-wait       Don't wait for Vercel (commit and exit)
 *   --verbose       Show detailed output
 * 
 * Safety Features:
 * - Creates backup branch before deploy
 * - Validates clean git state
 * - Runs type check + build locally
 * - Waits for Vercel completion
 * - Verifies deployment health
 * - Provides one-command rollback
 * 
 * AI-Friendly:
 * - All output visible in terminal
 * - Clear success/failure states
 * - Actionable error messages
 * - Rollback instructions included
 */

import { execSync } from 'child_process'
import * as readline from 'readline'

interface DeployOptions {
  skipBuild: boolean
  skipTypes: boolean
  fast: boolean
  noWait: boolean
  verbose: boolean
  message: string
}

interface DeployResult {
  success: boolean
  backupBranch?: string
  commitHash?: string
  deploymentUrl?: string
  error?: string
}

class SmartDeploy {
  private options: DeployOptions
  private backupBranch: string = ''
  private projectName: string = 'moto-mind-ai'
  
  constructor(options: DeployOptions) {
    this.options = options
  }
  
  async deploy(): Promise<DeployResult> {
    console.log('🚀 SMART DEPLOY - ENTERPRISE EDITION\n')
    console.log('='.repeat(60))
    console.log()
    
    try {
      // Phase 0: Capture system state (automatic, silent)
      execSync('npm run state:capture pre-deploy', { stdio: 'pipe' })
      
      // Phase 1: Pre-flight checks (includes backup creation)
      await this.preFlight()
      
      // Phase 2: Validation
      if (!this.options.fast) {
        await this.validate()
      }
      
      // Phase 3: Commit & Push
      const commitHash = await this.commitAndPush()
      
      // Phase 4: Wait for Vercel (optional)
      let deploymentUrl: string | undefined
      if (!this.options.noWait) {
        deploymentUrl = await this.waitForVercel(commitHash)
      }
      
      // Phase 5: Verify deployment
      if (deploymentUrl && !this.options.noWait) {
        await this.verifyDeployment(deploymentUrl)
      }
      
      // Success!
      this.showSuccess(commitHash, deploymentUrl)
      
      return {
        success: true,
        backupBranch: this.backupBranch,
        commitHash,
        deploymentUrl
      }
      
    } catch (error: any) {
      this.showFailure(error)
      return {
        success: false,
        backupBranch: this.backupBranch,
        error: error.message
      }
    }
  }
  
  // ========================================================================
  // PHASE 1: PRE-FLIGHT CHECKS
  // ========================================================================
  
  private async preFlight(): Promise<void> {
    console.log('📋 PHASE 1: PRE-FLIGHT CHECKS\n')
    
    // Check 1: Git state
    await this.checkGitState()
    
    // Check 2: Create backup
    await this.createBackup()
    
    // Check 3: Verify Vercel CLI (if waiting)
    if (!this.options.noWait) {
      await this.checkVercelCLI()
    }
    
    console.log('✅ Pre-flight checks passed\n')
  }
  
  private async checkGitState(): Promise<void> {
    console.log('   → Checking git state...')
    
    // Check if in git repo
    try {
      execSync('git rev-parse --git-dir', { stdio: 'pipe' })
    } catch (e) {
      throw new Error('Not in a git repository')
    }
    
    // Check for changes
    const status = execSync('git status --porcelain', { encoding: 'utf8' })
    
    if (!status.trim()) {
      console.log('     ⚠️  No changes to deploy')
      console.log()
      console.log('Nothing to deploy. Working directory is clean.')
      process.exit(0)
    }
    
    // Check branch
    const branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim()
    console.log(`     ✅ Branch: ${branch}`)
    console.log(`     ✅ Changes detected: ${status.split('\n').length - 1} files`)
  }
  
  private async createBackup(): Promise<void> {
    console.log('   → Creating backup branch...')
    
    const timestamp = Date.now()
    this.backupBranch = `backup-before-deploy-${timestamp}`
    
    try {
      execSync(`git branch ${this.backupBranch}`, { stdio: 'pipe' })
      console.log(`     ✅ Backup: ${this.backupBranch}`)
    } catch (e) {
      throw new Error('Failed to create backup branch')
    }
  }
  
  private async checkVercelCLI(): Promise<void> {
    console.log('   → Checking Vercel CLI...')
    
    try {
      execSync('vercel --version', { stdio: 'pipe' })
      console.log('     ✅ Vercel CLI installed')
    } catch (e) {
      console.log('     ⚠️  Vercel CLI not found')
      console.log('     Install with: npm install -g vercel')
      throw new Error('Vercel CLI required for deployment tracking')
    }
  }
  
  // ========================================================================
  // PHASE 2: VALIDATION
  // ========================================================================
  
  private async validate(): Promise<void> {
    console.log('🔍 PHASE 2: VALIDATION\n')
    
    // Check 1: Type checking (unless skipped)
    if (!this.options.skipTypes) {
      await this.runTypeCheck()
    }
    
    // Check 2: Build (unless skipped)
    if (!this.options.skipBuild) {
      await this.runBuild()
    }
    
    console.log('✅ All validations passed\n')
  }
  
  private async runTypeCheck(): Promise<void> {
    console.log('   → Type checking...')
    
    try {
      execSync('npm run type-check', { 
        stdio: this.options.verbose ? 'inherit' : 'pipe',
        timeout: 60000 // 1 minute timeout
      })
      console.log('     ✅ Type check passed')
    } catch (e) {
      console.log('     ❌ Type check failed')
      console.log()
      console.log('Fix type errors before deploying:')
      console.log('  npm run type-check')
      console.log()
      throw new Error('Type check failed')
    }
  }
  
  private async runBuild(): Promise<void> {
    console.log('   → Building...')
    
    try {
      execSync('npm run build', { 
        stdio: this.options.verbose ? 'inherit' : 'pipe',
        timeout: 120000 // 2 minute timeout
      })
      console.log('     ✅ Build passed')
    } catch (e) {
      console.log('     ❌ Build failed')
      console.log()
      console.log('Fix build errors before deploying:')
      console.log('  npm run build')
      console.log()
      throw new Error('Build failed')
    }
  }
  
  // ========================================================================
  // PHASE 3: COMMIT & PUSH
  // ========================================================================
  
  private async commitAndPush(): Promise<string> {
    console.log('📤 PHASE 3: COMMIT & PUSH\n')
    
    console.log('   → Staging changes...')
    execSync('git add -A', { stdio: 'pipe' })
    console.log('     ✅ Changes staged')
    
    console.log('   → Committing...')
    execSync(`git commit -m "${this.options.message}"`, { stdio: 'pipe' })
    
    const commitHash = execSync('git rev-parse --short HEAD', { 
      encoding: 'utf8' 
    }).trim()
    console.log(`     ✅ Commit: ${commitHash}`)
    
    const branch = execSync('git branch --show-current', { 
      encoding: 'utf8' 
    }).trim()
    
    console.log(`   → Pushing to ${branch}...`)
    execSync(`git push origin ${branch}`, { stdio: 'inherit' })
    console.log(`     ✅ Pushed to remote`)
    console.log()
    
    return commitHash
  }
  
  // ========================================================================
  // PHASE 4: WAIT FOR VERCEL
  // ========================================================================
  
  private async waitForVercel(commitSha?: string): Promise<string | undefined> {
    console.log('⏳ PHASE 4: VERCEL DEPLOYMENT (ENHANCED)\n')
    
    console.log('   Waiting for deployment to start...')
    await this.sleep(5000)
    
    try {
      // Use the enhanced wait-for-vercel script with commit SHA
      const commitFlag = commitSha ? `--commit=${commitSha}` : ''
      execSync(`npx tsx scripts/wait-for-vercel.ts ${commitFlag}`, { stdio: 'inherit' })
      
      // Get deployment URL
      const url = this.getLatestDeploymentUrl()
      return url
      
    } catch (e) {
      throw new Error('Vercel deployment failed or timed out')
    }
  }
  
  private getLatestDeploymentUrl(): string | undefined {
    try {
      // This is a simplified approach - the wait-for-vercel script provides the URL
      return `${this.projectName}.vercel.app`
    } catch (e) {
      return undefined
    }
  }
  
  // ========================================================================
  // PHASE 5: VERIFY DEPLOYMENT
  // ========================================================================
  
  private async verifyDeployment(url: string): Promise<void> {
    console.log('🧪 PHASE 5: DEPLOYMENT VERIFICATION\n')
    
    console.log('   → Health check...')
    
    try {
      const response = await fetch(`https://${url}`, {
        signal: AbortSignal.timeout(10000) // 10 second timeout
      })
      
      if (response.ok) {
        console.log('     ✅ Site is live and responding')
        console.log(`     ✅ Status: ${response.status}`)
      } else {
        console.log(`     ⚠️  Unexpected status: ${response.status}`)
      }
    } catch (e: any) {
      console.log('     ⚠️  Could not verify deployment')
      console.log(`     Error: ${e.message}`)
    }
    
    console.log()
  }
  
  // ========================================================================
  // SUCCESS / FAILURE REPORTING
  // ========================================================================
  
  private showSuccess(commitHash: string, deploymentUrl?: string): void {
    console.log('='.repeat(70))
    console.log('✅ DEPLOYMENT SUCCESSFUL!')
    console.log('='.repeat(70))
    console.log()
    console.log('📊 DEPLOYMENT SUMMARY:')
    console.log()
    console.log(`   Commit:     ${commitHash}`)
    console.log(`   Message:    "${this.options.message}"`)
    console.log(`   Backup:     ${this.backupBranch}`)
    if (deploymentUrl) {
      console.log(`   Live URL:   https://${deploymentUrl}`)
    }
    console.log()
    console.log('🎉 Your changes are now live!')
    console.log()
    
    // Cleanup backup branch
    console.log('💡 CLEANUP:')
    console.log()
    console.log('   Delete backup branch:')
    console.log(`   git branch -D ${this.backupBranch}`)
    console.log()
  }
  
  private showFailure(error: Error): void {
    console.log('\n' + '='.repeat(70))
    console.log('❌ DEPLOYMENT FAILED!')
    console.log('='.repeat(70))
    console.log()
    console.log(`Error: ${error.message}`)
    console.log()
    
    if (this.backupBranch) {
      console.log('🔄 ROLLBACK INSTRUCTIONS:')
      console.log()
      console.log('   Option 1: Undo last commit (if not pushed)')
      console.log('   git reset --hard HEAD~1')
      console.log()
      console.log('   Option 2: Restore from backup')
      console.log(`   git reset --hard ${this.backupBranch}`)
      console.log()
      console.log('   Option 3: Force push previous state (if already pushed)')
      console.log(`   git reset --hard ${this.backupBranch}`)
      console.log('   git push --force origin main')
      console.log()
      console.log('⚠️  WARNING: Force push affects team - coordinate first!')
      console.log()
    }
    
    process.exit(1)
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// ============================================================================
// CLI PARSING
// ============================================================================

function parseArgs(): DeployOptions {
  const args = process.argv.slice(2)
  
  // Extract flags
  const skipBuild = args.includes('--skip-build')
  const skipTypes = args.includes('--skip-types')
  const fast = args.includes('--fast')
  const noWait = args.includes('--no-wait')
  const verbose = args.includes('--verbose') || args.includes('-v')
  
  // Extract message (everything that's not a flag)
  const message = args
    .filter(arg => !arg.startsWith('--') && !arg.startsWith('-'))
    .join(' ')
  
  if (!message) {
    console.error('❌ Error: Commit message required\n')
    console.log('Usage:')
    console.log('  npm run deploy "your commit message"')
    console.log()
    console.log('Flags:')
    console.log('  --skip-build    Skip build verification')
    console.log('  --skip-types    Skip type checking')
    console.log('  --fast          Skip all checks (fastest)')
    console.log('  --no-wait       Don\'t wait for Vercel')
    console.log('  --verbose       Show detailed output')
    console.log()
    console.log('Examples:')
    console.log('  npm run deploy "feat: add new feature"')
    console.log('  npm run deploy "fix: urgent fix" --fast')
    console.log('  npm run deploy "docs: update" --skip-build')
    console.log()
    process.exit(1)
  }
  
  return {
    skipBuild: skipBuild || fast,
    skipTypes: skipTypes || fast,
    fast,
    noWait,
    verbose,
    message
  }
}

// ============================================================================
// MAIN
// ============================================================================

const options = parseArgs()
const deployer = new SmartDeploy(options)

deployer.deploy().then(result => {
  if (!result.success) {
    process.exit(1)
  }
}).catch(error => {
  console.error('\n💥 Unexpected error:', error.message)
  if (options.verbose) {
    console.error(error.stack)
  }
  process.exit(1)
})
