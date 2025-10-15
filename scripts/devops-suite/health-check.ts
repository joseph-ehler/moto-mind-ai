#!/usr/bin/env tsx
/**
 * System Health Check
 * 
 * Proactive monitoring of deployment, code quality, and system health
 * Runs automatically at session start to alert about issues
 * 
 * Usage: npm run health
 */

import { execSync } from 'child_process'
import { DeploymentStatusManager } from './deployment-status'

interface HealthCheck {
  name: string
  status: 'success' | 'warning' | 'error' | 'unknown'
  message: string
  action?: string
  details?: string[]
}

interface HealthReport {
  overall: 'healthy' | 'warning' | 'critical' | 'unknown'
  checks: HealthCheck[]
  timestamp: number
}

class SystemHealthCheck {
  private manager = new DeploymentStatusManager()
  
  async check(): Promise<HealthReport> {
    console.log('🏥 SYSTEM HEALTH CHECK\n')
    console.log('='.repeat(70))
    console.log()
    
    const checks: HealthCheck[] = []
    
    // Run all health checks
    checks.push(await this.checkDeploymentStatus())
    checks.push(await this.checkBuildHealth())
    checks.push(await this.checkCodeQuality())
    checks.push(await this.checkGitState())
    
    const report: HealthReport = {
      overall: this.determineOverall(checks),
      checks,
      timestamp: Date.now()
    }
    
    this.displayReport(report)
    
    return report
  }
  
  private async checkDeploymentStatus(): Promise<HealthCheck> {
    const status = this.manager.readStatus()
    
    if (!status) {
      return {
        name: 'Deployment Status',
        status: 'unknown',
        message: 'No recent deployments tracked',
        action: 'Deploy something to start tracking: npm run deploy "message"'
      }
    }
    
    const age = Date.now() - status.timestamp
    const hours = age / (1000 * 60 * 60)
    const minutes = age / (1000 * 60)
    
    const timeAgo = hours >= 1 
      ? `${hours.toFixed(1)}h ago`
      : `${Math.floor(minutes)}m ago`
    
    if (status.state === 'ERROR') {
      const details: string[] = []
      if (status.errorSummary) {
        details.push(status.errorSummary)
      }
      if (status.errors && status.errors.length > 0) {
        details.push(`${status.errors.length} errors detected`)
      }
      
      return {
        name: 'Deployment Status',
        status: 'error',
        message: `Last deployment failed ${timeAgo}`,
        action: 'Check errors: cat .vercel-status.json',
        details
      }
    }
    
    if (status.state === 'BUILDING' && hours > 0.5) {
      return {
        name: 'Deployment Status',
        status: 'warning',
        message: `Deployment stuck in BUILDING for ${timeAgo}`,
        action: 'Check Vercel dashboard or run: npm run deploy:wait'
      }
    }
    
    if (status.state === 'READY') {
      return {
        name: 'Deployment Status',
        status: 'success',
        message: `Production healthy (deployed ${timeAgo})`
      }
    }
    
    return {
      name: 'Deployment Status',
      status: 'unknown',
      message: `State: ${status.state} (${timeAgo})`
    }
  }
  
  private async checkBuildHealth(): Promise<HealthCheck> {
    const history = this.manager.readHistory()
    
    if (!history || history.stats.total < 3) {
      return {
        name: 'Build Health',
        status: 'unknown',
        message: 'Not enough build history (need 3+ deployments)'
      }
    }
    
    const health = this.manager.getHealth()
    const issues = this.manager.hasRecentIssues()
    
    if (issues.hasIssues) {
      return {
        name: 'Build Health',
        status: 'error',
        message: issues.message,
        action: 'Review recent changes: git log --oneline -10',
        details: [
          `Success rate: ${history.stats.successRate.toFixed(1)}%`,
          `Total deploys: ${history.stats.total}`
        ]
      }
    }
    
    if (history.stats.successRate < 80) {
      return {
        name: 'Build Health',
        status: 'warning',
        message: `Low success rate: ${history.stats.successRate.toFixed(1)}%`,
        action: 'Consider investigating recent failures',
        details: [
          `Successful: ${history.stats.successful}`,
          `Failed: ${history.stats.failed}`
        ]
      }
    }
    
    return {
      name: 'Build Health',
      status: 'success',
      message: `${health.message} (${history.stats.total} deploys)`,
      details: [
        `Successful: ${history.stats.successful}`,
        `Failed: ${history.stats.failed}`
      ]
    }
  }
  
  private async checkCodeQuality(): Promise<HealthCheck> {
    try {
      // Check for deep imports
      const deepImportsResult = execSync(
        'git grep -l "\\.\\./\\.\\./" -- "*.ts" "*.tsx" 2>/dev/null | wc -l || echo "0"',
        { encoding: 'utf8', stdio: 'pipe' }
      ).trim()
      
      const deepImports = parseInt(deepImportsResult)
      
      if (deepImports > 40) {
        return {
          name: 'Code Quality',
          status: 'warning',
          message: `${deepImports} files with deep imports (../../../)`,
          action: 'Fix with: npm run repo:clean --fix',
          details: ['These should use @/ aliases instead']
        }
      }
      
      if (deepImports > 0) {
        return {
          name: 'Code Quality',
          status: 'success',
          message: `${deepImports} files with deep imports (acceptable)`,
          details: ['Week 1 migration in progress']
        }
      }
      
      return {
        name: 'Code Quality',
        status: 'success',
        message: 'No major issues detected'
      }
    } catch (e) {
      return {
        name: 'Code Quality',
        status: 'unknown',
        message: 'Could not check code quality'
      }
    }
  }
  
  private async checkGitState(): Promise<HealthCheck> {
    try {
      // Check for uncommitted changes
      const status = execSync('git status --porcelain', { 
        encoding: 'utf8',
        stdio: 'pipe'
      }).trim()
      
      if (!status) {
        return {
          name: 'Git State',
          status: 'success',
          message: 'Working directory clean'
        }
      }
      
      const lines = status.split('\n')
      const modified = lines.filter(l => l.startsWith(' M')).length
      const untracked = lines.filter(l => l.startsWith('??')).length
      const staged = lines.filter(l => l.startsWith('M ')).length
      
      const details: string[] = []
      if (staged > 0) details.push(`${staged} staged`)
      if (modified > 0) details.push(`${modified} modified`)
      if (untracked > 0) details.push(`${untracked} untracked`)
      
      return {
        name: 'Git State',
        status: 'warning',
        message: `${lines.length} uncommitted changes`,
        details,
        action: 'Commit or stash before deploying'
      }
    } catch (e) {
      return {
        name: 'Git State',
        status: 'unknown',
        message: 'Could not check git state'
      }
    }
  }
  
  private determineOverall(checks: HealthCheck[]): 'healthy' | 'warning' | 'critical' | 'unknown' {
    const hasError = checks.some(c => c.status === 'error')
    const hasWarning = checks.some(c => c.status === 'warning')
    const hasUnknown = checks.every(c => c.status === 'unknown')
    
    if (hasError) return 'critical'
    if (hasWarning) return 'warning'
    if (hasUnknown) return 'unknown'
    return 'healthy'
  }
  
  private displayReport(report: HealthReport): void {
    // Display each check
    report.checks.forEach(check => {
      const icon = this.getStatusIcon(check.status)
      console.log(`${icon} ${check.name}: ${check.message}`)
      
      if (check.details && check.details.length > 0) {
        check.details.forEach(detail => {
          console.log(`   ${detail}`)
        })
      }
      
      if (check.action) {
        console.log(`   💡 ${check.action}`)
      }
      
      console.log()
    })
    
    // Overall status
    console.log('='.repeat(70))
    const overallIcon = this.getOverallIcon(report.overall)
    console.log(`\n${overallIcon} Overall: ${report.overall.toUpperCase()}`)
    console.log()
    
    // Recommendations based on overall status
    if (report.overall === 'critical') {
      console.log('⚠️  CRITICAL ISSUES DETECTED')
      console.log('   Address errors above before deploying')
      console.log()
    } else if (report.overall === 'warning') {
      console.log('⚠️  WARNINGS PRESENT')
      console.log('   Review warnings but safe to deploy')
      console.log()
    } else if (report.overall === 'healthy') {
      console.log('✅ SYSTEM HEALTHY')
      console.log('   Ready to deploy with confidence')
      console.log()
    }
  }
  
  private getStatusIcon(status: string): string {
    switch (status) {
      case 'success': return '✅'
      case 'warning': return '⚠️ '
      case 'error': return '❌'
      case 'unknown': return '❓'
      default: return '  '
    }
  }
  
  private getOverallIcon(overall: string): string {
    switch (overall) {
      case 'healthy': return '🟢'
      case 'warning': return '🟡'
      case 'critical': return '🔴'
      default: return '⚪'
    }
  }
  
  // Quick check for CI/CD
  async quickCheck(): Promise<boolean> {
    const status = this.manager.readStatus()
    
    if (!status) return true // No status = unknown, allow
    
    if (status.state === 'ERROR') {
      const age = Date.now() - status.timestamp
      const hours = age / (1000 * 60 * 60)
      
      // If last deployment failed recently (< 1 hour), warn
      if (hours < 1) {
        console.error('⚠️  Last deployment failed less than 1 hour ago')
        console.error('   Review errors before deploying again')
        return false
      }
    }
    
    return true
  }
}

// CLI
async function main() {
  const checker = new SystemHealthCheck()
  
  const command = process.argv[2]
  
  if (command === 'quick') {
    const canDeploy = await checker.quickCheck()
    process.exit(canDeploy ? 0 : 1)
  } else {
    const report = await checker.check()
    
    // Exit code based on overall health
    if (report.overall === 'critical') {
      process.exit(1)
    } else {
      process.exit(0)
    }
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('Error running health check:', error.message)
    process.exit(1)
  })
}

export { SystemHealthCheck, HealthCheck, HealthReport }
