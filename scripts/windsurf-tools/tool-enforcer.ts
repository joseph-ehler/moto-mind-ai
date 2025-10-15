#!/usr/bin/env tsx
/**
 * Tool Usage Enforcer
 * 
 * Ensures AI tools are ALWAYS used by:
 * 1. Creating visible reminders
 * 2. Logging tool usage
 * 3. Detecting when tools are skipped
 * 4. Providing helpful prompts
 * 
 * Run automatically via git hooks or manually
 */

import * as fs from 'fs'
import * as path from 'path'
import { execSync } from 'child_process'

interface ToolUsageLog {
  timestamp: Date
  tool: string
  task?: string
  success: boolean
}

class ToolUsageEnforcer {
  private logFile = '.windsurf/tool-usage.log'
  private gitRoot = process.cwd()
  
  /**
   * Check if context analysis was run recently
   */
  async checkContextAnalysis(): Promise<boolean> {
    const contextFile = path.join(this.gitRoot, '.windsurf-context.md')
    
    if (!fs.existsSync(contextFile)) {
      console.log('⚠️  WARNING: No context analysis found!')
      console.log('   Run: npm run windsurf:guide "<task>"')
      return false
    }
    
    // Check if file is recent (< 1 hour old)
    const stats = fs.statSync(contextFile)
    const ageMinutes = (Date.now() - stats.mtimeMs) / (1000 * 60)
    
    if (ageMinutes > 60) {
      console.log('⚠️  WARNING: Context analysis is stale (> 1 hour old)')
      console.log('   Run: npm run windsurf:guide "<task>"')
      return false
    }
    
    console.log('✅ Context analysis found (generated', Math.floor(ageMinutes), 'minutes ago)')
    return true
  }
  
  /**
   * Log tool usage
   */
  logUsage(tool: string, task?: string, success: boolean = true): void {
    const logDir = path.dirname(path.join(this.gitRoot, this.logFile))
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true })
    }
    
    const entry: ToolUsageLog = {
      timestamp: new Date(),
      tool,
      task,
      success
    }
    
    const logLine = JSON.stringify(entry) + '\n'
    fs.appendFileSync(path.join(this.gitRoot, this.logFile), logLine)
  }
  
  /**
   * Get recent tool usage stats
   */
  getUsageStats(hours: number = 24): {
    total: number
    byTool: Record<string, number>
    successRate: number
  } {
    const logPath = path.join(this.gitRoot, this.logFile)
    if (!fs.existsSync(logPath)) {
      return { total: 0, byTool: {}, successRate: 0 }
    }
    
    const logs = fs.readFileSync(logPath, 'utf8')
      .split('\n')
      .filter(line => line.trim())
      .map(line => JSON.parse(line) as ToolUsageLog)
    
    const cutoff = Date.now() - (hours * 60 * 60 * 1000)
    const recent = logs.filter(log => 
      new Date(log.timestamp).getTime() > cutoff
    )
    
    const byTool: Record<string, number> = {}
    let successes = 0
    
    recent.forEach(log => {
      byTool[log.tool] = (byTool[log.tool] || 0) + 1
      if (log.success) successes++
    })
    
    return {
      total: recent.length,
      byTool,
      successRate: recent.length > 0 ? successes / recent.length : 0
    }
  }
  
  /**
   * Show reminder banner
   */
  showReminder(context: 'start' | 'before-code' | 'after-code' | 'before-commit'): void {
    console.log('\n' + '='.repeat(70))
    console.log('🤖 WINDSURF TOOL REMINDER')
    console.log('='.repeat(70))
    
    switch (context) {
      case 'start':
        console.log('\n📋 Starting a task? Run these FIRST:\n')
        console.log('   1. npm run windsurf:guide "<your task>"')
        console.log('   2. cat .windsurf-context.md')
        console.log('   3. Study the examples shown\n')
        console.log('Then generate code following the guidance exactly.')
        break
        
      case 'before-code':
        console.log('\n⚠️  About to generate code?\n')
        console.log('   Have you run: npm run windsurf:guide "<task>" ?')
        console.log('   Have you read: .windsurf-context.md ?\n')
        console.log('If NO to either, STOP and run them now!')
        break
        
      case 'after-code':
        console.log('\n✅ Generated code? Validate it:\n')
        console.log('   1. npm run repo:analyze')
        console.log('   2. npm run repo:clean')
        console.log('   3. npm test\n')
        console.log('Fix any issues before considering it "done".')
        break
        
      case 'before-commit':
        console.log('\n🔒 About to commit? Final checks:\n')
        console.log('   1. npm run windsurf:validate')
        console.log('   2. Review any warnings')
        console.log('   3. Fix issues before committing\n')
        console.log('Your pre-commit hook will also run automatically.')
        break
    }
    
    console.log('='.repeat(70) + '\n')
  }
  
  /**
   * Generate reminder files
   */
  generateReminders(): void {
    const reminders = {
      'BEFORE-YOU-START.md': `# ⚠️  BEFORE YOU START ANY TASK

Run these commands FIRST:

\`\`\`bash
# 1. Analyze codebase for this specific task
npm run windsurf:guide "<your task>"

# 2. Read the guidance
cat .windsurf-context.md

# 3. Study examples shown
\`\`\`

**DO NOT skip these steps!**

Your code will be better if you follow the guidance.

---

*This file is automatically generated. Delete it after reading.*
`,
      'AFTER-CODE-CHECKLIST.md': `# ✅ AFTER GENERATING CODE

Before considering the task "done", run:

\`\`\`bash
# Validate patterns
npm run repo:analyze

# Check for issues
npm run repo:clean

# Run tests
npm test
\`\`\`

Fix any issues found.

**Code is only "done" when validation passes.**

---

*This file is automatically generated. Delete it after validation passes.*
`
    }
    
    Object.entries(reminders).forEach(([filename, content]) => {
      const filepath = path.join(this.gitRoot, filename)
      if (!fs.existsSync(filepath)) {
        fs.writeFileSync(filepath, content)
        console.log(`✅ Created reminder: ${filename}`)
      }
    })
  }
  
  /**
   * Check if AI assistant is being used correctly
   */
  async detectImproperUsage(): Promise<string[]> {
    const issues: string[] = []
    
    // Check 1: Recent code changes without context analysis
    try {
      const recentFiles = execSync('git diff --name-only HEAD@{1.hour.ago} HEAD 2>/dev/null || true', { 
        encoding: 'utf8',
        cwd: this.gitRoot 
      })
        .split('\n')
        .filter(f => f.match(/\.(ts|tsx|js|jsx)$/))
      
      if (recentFiles.length > 0) {
        const hasContext = await this.checkContextAnalysis()
        if (!hasContext) {
          issues.push('Code was changed but context analysis not run')
        }
      }
    } catch {
      // Git history not available, skip
    }
    
    // Check 2: Deep imports in recent changes
    try {
      const diff = execSync('git diff HEAD@{1.hour.ago} HEAD 2>/dev/null || true', { 
        encoding: 'utf8',
        cwd: this.gitRoot 
      })
      
      if (diff.match(/from ['"]\.\.\/\.\.\/\.\.\//)) {
        issues.push('Deep imports (../../../) detected in recent changes')
      }
    } catch {
      // Skip
    }
    
    // Check 3: New files without tests
    try {
      const newFiles = execSync('git diff --name-only --diff-filter=A HEAD@{1.hour.ago} HEAD 2>/dev/null || true', { 
        encoding: 'utf8',
        cwd: this.gitRoot 
      })
        .split('\n')
        .filter(f => f.match(/^(lib|app)\//))
      
      const newTests = execSync('git diff --name-only --diff-filter=A HEAD@{1.hour.ago} HEAD 2>/dev/null || true', { 
        encoding: 'utf8',
        cwd: this.gitRoot 
      })
        .split('\n')
        .filter(f => f.includes('test'))
      
      if (newFiles.length > 0 && newTests.length === 0) {
        issues.push(`${newFiles.length} new files but no tests added`)
      }
    } catch {
      // Skip
    }
    
    return issues
  }
  
  /**
   * Main enforcement check
   */
  async enforce(): Promise<void> {
    console.log('🔍 Checking tool usage...\n')
    
    // Show stats
    const stats = this.getUsageStats(24)
    console.log('📊 Tool Usage (Last 24 hours):')
    console.log(`   Total: ${stats.total} tool invocations`)
    console.log(`   Success Rate: ${(stats.successRate * 100).toFixed(1)}%`)
    
    if (Object.keys(stats.byTool).length > 0) {
      console.log('   By Tool:')
      Object.entries(stats.byTool).forEach(([tool, count]) => {
        console.log(`      ${tool}: ${count}`)
      })
    }
    console.log()
    
    // Check for issues
    const issues = await this.detectImproperUsage()
    
    if (issues.length > 0) {
      console.log('⚠️  Potential Issues Detected:\n')
      issues.forEach(issue => {
        console.log(`   ❌ ${issue}`)
      })
      console.log('\n💡 Recommendations:')
      console.log('   1. Always run windsurf:guide before generating code')
      console.log('   2. Use @/ imports (not ../../../)')
      console.log('   3. Add tests for new features')
      console.log()
    } else {
      console.log('✅ No issues detected!')
      console.log('   Tools are being used correctly.\n')
    }
    
    // Check context analysis
    await this.checkContextAnalysis()
  }
}

// CLI
const [command, ...args] = process.argv.slice(2)

async function main() {
  const enforcer = new ToolUsageEnforcer()

  switch (command) {
    case 'remind':
      enforcer.showReminder('start')
      break
      
    case 'before-code':
      enforcer.showReminder('before-code')
      break
      
    case 'after-code':
      enforcer.showReminder('after-code')
      break
      
    case 'before-commit':
      enforcer.showReminder('before-commit')
      break
      
    case 'check':
      await enforcer.enforce()
      break
      
    case 'generate-reminders':
      enforcer.generateReminders()
      break
      
    case 'log': {
      const tool = args[0]
      const task = args.slice(1).join(' ')
      if (tool) {
        enforcer.logUsage(tool, task)
        console.log(`✅ Logged usage of: ${tool}`)
      }
      break
    }
      
    default:
      console.log('Tool Usage Enforcer\n')
      console.log('Usage:')
      console.log('  npm run tools:remind              # Show reminders')
      console.log('  npm run tools:check               # Check usage')
      console.log('  npm run tools:generate-reminders  # Create reminder files')
      console.log('  npm run tools:log <tool> [task]   # Log tool usage')
  }
}

main().catch(console.error)
