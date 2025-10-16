#!/usr/bin/env tsx
/**
 * One-Command Rollback System
 * 
 * Safely rollback deployments, commits, or migrations with a single command.
 * 
 * Features:
 * - Interactive rollback selection
 * - Shows what will be rolled back
 * - Confirmation before executing
 * - Multiple rollback strategies
 * - Preserves work in progress
 * 
 * Usage:
 *   npm run rollback              # Interactive mode
 *   npm run rollback -- --last    # Rollback last commit
 *   npm run rollback -- --to <commit>  # Rollback to specific commit
 *   npm run rollback -- --branch <name>  # Restore from backup branch
 * 
 * Safety:
 * - Creates backup before rollback
 * - Stashes uncommitted changes
 * - Shows diff before confirming
 * - Provides undo instructions
 */

import { execSync } from 'child_process'
import * as readline from 'readline'

interface RollbackOptions {
  mode: 'interactive' | 'last' | 'to-commit' | 'from-branch'
  targetCommit?: string
  targetBranch?: string
  force?: boolean
  rollbackType?: 'git' | 'vercel' | 'both' // NEW: Rollback strategy
}

class RollbackSystem {
  private rl: readline.Interface
  
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })
  }
  
  // NEW: Show rollback strategy options
  private async chooseRollbackStrategy(): Promise<'git' | 'vercel' | 'both'> {
    console.log('\n🔄 ROLLBACK STRATEGY\n')
    console.log('Choose rollback method:\n')
    console.log('1. ⚡ VERCEL INSTANT ROLLBACK (5 seconds)')
    console.log('   - Production serves previous deployment immediately')
    console.log('   - Code stays the same (no git changes)')
    console.log('   - No new build needed')
    console.log('   - Perfect for: Emergency fixes')
    console.log()
    console.log('2. 📝 GIT ROLLBACK (2-3 minutes)')
    console.log('   - Reverts commit in git history')
    console.log('   - Changes source code')
    console.log('   - Triggers new Vercel deployment')
    console.log('   - Perfect for: Permanent code revert')
    console.log()
    console.log('3. 🎯 BOTH (Safest - Instant fix + code fix)')
    console.log('   - Vercel rollback first (instant production fix)')
    console.log('   - Git rollback second (fixes code)')
    console.log('   - Best of both worlds')
    console.log('   - Perfect for: Critical issues')
    console.log()
    
    const answer = await this.ask('Select option (1/2/3): ')
    
    switch (answer.trim()) {
      case '1':
        return 'vercel'
      case '2':
        return 'git'
      case '3':
        return 'both'
      default:
        console.log('Invalid option, defaulting to both')
        return 'both'
    }
  }
  
  // NEW: Instant Vercel rollback
  private async vercelRollback(): Promise<void> {
    console.log('\n⚡ VERCEL INSTANT ROLLBACK\n')
    console.log('='.repeat(70))
    
    try {
      // Get recent successful deployments
      const output = execSync('vercel ls moto-mind-ai --yes', { 
        encoding: 'utf8',
        stdio: 'pipe'
      })
      
      const lines = output.split('\n')
      
      // Find successful deployments
      const successful = lines
        .filter(l => l.includes('● Ready') && l.includes('Production'))
        .slice(0, 10) // Last 10 successful
      
      if (successful.length === 0) {
        console.log('❌ No successful deployments found')
        return
      }
      
      console.log('\n📋 Recent successful deployments:\n')
      successful.forEach((line, i) => {
        // Parse age from line
        const ageMatch = line.match(/(\d+[mhd])\s+/)
        const age = ageMatch ? ageMatch[1] : 'unknown'
        console.log(`${i + 1}. ${age} ago`)
      })
      
      console.log()
      const choice = await this.ask('Select deployment to restore (1-10): ')
      const selectedIndex = parseInt(choice) - 1
      
      if (selectedIndex < 0 || selectedIndex >= successful.length) {
        console.log('❌ Invalid selection')
        return
      }
      
      // Extract deployment URL from selected line
      const selectedLine = successful[selectedIndex]
      const urlMatch = selectedLine.match(/https:\/\/[^\s]+/)
      
      if (!urlMatch) {
        console.log('❌ Could not extract deployment URL')
        return
      }
      
      const deploymentUrl = urlMatch[0]
      
      console.log(`\n🔄 Promoting ${deploymentUrl} to production...`)
      console.log()
      
      // Promote to production
      execSync(`vercel promote ${deploymentUrl} --yes`, { stdio: 'inherit' })
      
      console.log('\n' + '='.repeat(70))
      console.log('✅ PRODUCTION RESTORED!')
      console.log('='.repeat(70))
      console.log()
      console.log('⚡ Time to fix: ~5 seconds')
      console.log('🌐 Production now serving previous deployment')
      console.log()
      console.log('💡 Next steps:')
      console.log('   1. Verify production is working')
      console.log('   2. Fix the code issue')
      console.log('   3. Deploy the fix with: npm run deploy "fix: ..."')
      console.log()
      
    } catch (error: any) {
      console.error('❌ Vercel rollback failed:', error.message)
      throw error
    }
  }
  
  async rollback(options: RollbackOptions): Promise<void> {
    console.log('🔄 ROLLBACK SYSTEM\n')
    console.log('='.repeat(60))
    
    try {
      // NEW: Step 1: Choose rollback strategy (if not specified)
      const rollbackType = options.rollbackType || await this.chooseRollbackStrategy()
      
      // If Vercel-only rollback, do it and return
      if (rollbackType === 'vercel') {
        await this.vercelRollback()
        this.rl.close()
        return
      }
      
      // For git or both, continue with git rollback
      // Step 2: Verify git state
      await this.verifyGitState()
      
      // Step 3: Determine rollback target
      const target = await this.determineTarget(options)
      
      // Step 3: Show what will be rolled back
      await this.showRollbackPreview(target)
      
      // Step 4: Confirm
      if (!options.force) {
        const confirmed = await this.confirm('Proceed with rollback?')
        if (!confirmed) {
          console.log('\n❌ Rollback canceled')
          this.rl.close()
          return
        }
      }
      
      // NEW: If "both" strategy, do Vercel rollback first (instant fix)
      if (rollbackType === 'both') {
        console.log('\n🎯 DUAL ROLLBACK STRATEGY\n')
        console.log('Step 1: Instant Vercel rollback (fix production now)')
        console.log('Step 2: Git rollback (fix code)\n')
        
        await this.vercelRollback()
        
        console.log('\n✅ Production fixed! Now rolling back git...\n')
        await this.sleep(2000) // Brief pause
      }
      
      // Step 5: Create safety backup
      await this.createSafetyBackup()
      
      // Step 6: Execute git rollback
      await this.executeRollback(target)
      
      // Step 7: Show success
      this.showSuccess(target)
      
    } catch (error: any) {
      this.showError(error)
      process.exit(1)
    } finally {
      this.rl.close()
    }
  }
  
  private async verifyGitState(): Promise<void> {
    console.log('📋 Verifying git state...\n')
    
    // Check if in git repo
    try {
      execSync('git rev-parse --git-dir', { stdio: 'pipe' })
    } catch (e) {
      throw new Error('Not in a git repository')
    }
    
    // Check for uncommitted changes
    const status = execSync('git status --porcelain', { encoding: 'utf8' })
    
    if (status.trim()) {
      console.log('⚠️  You have uncommitted changes:\n')
      console.log(status)
      console.log()
      
      const stash = await this.confirm('Stash these changes before rollback?')
      
      if (stash) {
        execSync('git stash push -m "Rollback safety stash"', { stdio: 'pipe' })
        console.log('✅ Changes stashed\n')
      } else {
        throw new Error('Cannot rollback with uncommitted changes. Stash or commit first.')
      }
    }
    
    console.log('✅ Git state verified\n')
  }
  
  private async determineTarget(options: RollbackOptions): Promise<string> {
    if (options.mode === 'last') {
      return 'HEAD~1'
    }
    
    if (options.mode === 'to-commit' && options.targetCommit) {
      return options.targetCommit
    }
    
    if (options.mode === 'from-branch' && options.targetBranch) {
      // Verify branch exists
      try {
        execSync(`git rev-parse --verify ${options.targetBranch}`, { stdio: 'pipe' })
        return options.targetBranch
      } catch (e) {
        throw new Error(`Branch not found: ${options.targetBranch}`)
      }
    }
    
    // Interactive mode
    return await this.interactiveSelect()
  }
  
  private async interactiveSelect(): Promise<string> {
    console.log('📜 Recent commits:\n')
    
    const log = execSync('git log --oneline -10', { encoding: 'utf8' })
    console.log(log)
    
    console.log('📦 Recent backup branches:\n')
    
    try {
      const backupBranches = execSync('git branch | grep backup-', { encoding: 'utf8' })
      console.log(backupBranches)
    } catch (e) {
      console.log('  (no backup branches found)\n')
    }
    
    const choice = await this.ask('\nSelect rollback target (commit hash or branch name): ')
    
    return choice.trim()
  }
  
  private async showRollbackPreview(target: string): Promise<void> {
    console.log('\n📊 ROLLBACK PREVIEW\n')
    console.log('='.repeat(60))
    
    try {
      const current = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim()
      
      console.log(`Current:  ${current}`)
      console.log(`Target:   ${target}`)
      console.log()
      
      // Show what will change
      console.log('Changes that will be lost:\n')
      
      try {
        const diff = execSync(`git log --oneline ${target}..HEAD`, { 
          encoding: 'utf8',
          stdio: 'pipe'
        })
        
        if (diff.trim()) {
          console.log(diff)
        } else {
          console.log('  (no commits will be lost)\n')
        }
      } catch (e) {
        console.log('  (unable to show diff - target may not be an ancestor)\n')
      }
      
    } catch (e: any) {
      throw new Error(`Invalid rollback target: ${target}`)
    }
    
    console.log('='.repeat(60))
  }
  
  private async createSafetyBackup(): Promise<void> {
    console.log('\n💾 Creating safety backup...')
    
    const timestamp = Date.now()
    const backupBranch = `rollback-backup-${timestamp}`
    
    try {
      execSync(`git branch ${backupBranch}`, { stdio: 'pipe' })
      console.log(`   ✅ Backup created: ${backupBranch}`)
    } catch (e) {
      throw new Error('Failed to create safety backup')
    }
  }
  
  private async executeRollback(target: string): Promise<void> {
    console.log('\n🔄 Executing rollback...')
    
    try {
      execSync(`git reset --hard ${target}`, { stdio: 'pipe' })
      console.log('   ✅ Rollback complete')
    } catch (e) {
      throw new Error(`Failed to rollback to ${target}`)
    }
  }
  
  private showSuccess(target: string): void {
    console.log('\n' + '='.repeat(60))
    console.log('✅ ROLLBACK SUCCESSFUL!')
    console.log('='.repeat(60))
    console.log()
    console.log(`Rolled back to: ${target}`)
    console.log()
    console.log('💡 NEXT STEPS:')
    console.log()
    console.log('   1. Verify state:')
    console.log('      git log --oneline -5')
    console.log()
    console.log('   2. If you need to restore stashed changes:')
    console.log('      git stash list')
    console.log('      git stash pop')
    console.log()
    console.log('   3. If you pushed to remote, force push:')
    console.log('      git push --force origin main')
    console.log('      ⚠️  Coordinate with team before force pushing!')
    console.log()
    console.log('   4. Cleanup backup branches:')
    console.log('      git branch | grep backup-')
    console.log('      git branch -D <backup-branch>')
    console.log()
  }
  
  private showError(error: Error): void {
    console.log('\n' + '='.repeat(60))
    console.log('❌ ROLLBACK FAILED!')
    console.log('='.repeat(60))
    console.log()
    console.log(`Error: ${error.message}`)
    console.log()
    console.log('💡 RECOVERY:')
    console.log()
    console.log('   If git is in a bad state:')
    console.log('   git reset --hard HEAD')
    console.log()
    console.log('   If you need to restore from reflog:')
    console.log('   git reflog')
    console.log('   git reset --hard HEAD@{n}')
    console.log()
  }
  
  private ask(question: string): Promise<string> {
    return new Promise(resolve => {
      this.rl.question(question, answer => {
        resolve(answer)
      })
    })
  }
  
  private async confirm(question: string): Promise<boolean> {
    const answer = await this.ask(`${question} (y/n): `)
    return answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes'
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// ============================================================================
// CLI
// ============================================================================

function parseArgs(): RollbackOptions {
  const args = process.argv.slice(2)
  
  // NEW: Rollback type flags
  let rollbackType: 'git' | 'vercel' | 'both' | undefined
  if (args.includes('--vercel-only')) {
    rollbackType = 'vercel'
  } else if (args.includes('--git-only')) {
    rollbackType = 'git'
  } else if (args.includes('--both')) {
    rollbackType = 'both'
  }
  
  if (args.includes('--last')) {
    return { mode: 'last', rollbackType }
  }
  
  const toIndex = args.indexOf('--to')
  if (toIndex !== -1 && args[toIndex + 1]) {
    return {
      mode: 'to-commit',
      targetCommit: args[toIndex + 1],
      rollbackType
    }
  }
  
  const branchIndex = args.indexOf('--branch')
  if (branchIndex !== -1 && args[branchIndex + 1]) {
    return {
      mode: 'from-branch',
      targetBranch: args[branchIndex + 1],
      rollbackType
    }
  }
  
  const force = args.includes('--force') || args.includes('-f')
  
  return { 
    mode: 'interactive',
    force,
    rollbackType
  }
}

// ============================================================================
// MAIN
// ============================================================================

const options = parseArgs()
const system = new RollbackSystem()

system.rollback(options).catch(error => {
  console.error('\n💥 Unexpected error:', error.message)
  process.exit(1)
})
