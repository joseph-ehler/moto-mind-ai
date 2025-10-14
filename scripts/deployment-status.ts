#!/usr/bin/env tsx
/**
 * Deployment Status Manager
 * 
 * Persistent status tracking across sessions
 * Enables AI to check deployment state anytime
 * Tracks history and trends
 */

import * as fs from 'fs'
import * as path from 'path'
import { BuildError } from './parse-build-errors'

export interface DeploymentStatus {
  state: 'BUILDING' | 'READY' | 'ERROR' | 'CANCELED' | 'QUEUED' | 'UNKNOWN'
  url?: string
  timestamp: number
  errors?: BuildError[]
  commit?: string
  branch?: string
  duration?: number
  deploymentId?: string
  errorSummary?: string
}

export interface BuildHistory {
  deployments: DeploymentStatus[]
  stats: {
    total: number
    successful: number
    failed: number
    canceled: number
    averageDuration: number
    successRate: number
  }
  lastChecked: number
}

export class DeploymentStatusManager {
  private statusFile = '.vercel-status.json'
  private historyFile = '.build-history.json'
  private gitRoot: string
  
  constructor(gitRoot: string = process.cwd()) {
    this.gitRoot = gitRoot
  }
  
  private getFilePath(filename: string): string {
    return path.join(this.gitRoot, filename)
  }
  
  // Write current deployment status
  writeStatus(status: DeploymentStatus): void {
    const filePath = this.getFilePath(this.statusFile)
    fs.writeFileSync(filePath, JSON.stringify(status, null, 2))
    this.appendHistory(status)
  }
  
  // Read current deployment status
  readStatus(): DeploymentStatus | null {
    try {
      const filePath = this.getFilePath(this.statusFile)
      const content = fs.readFileSync(filePath, 'utf8')
      return JSON.parse(content)
    } catch {
      return null
    }
  }
  
  // Get build history
  readHistory(): BuildHistory | null {
    try {
      const filePath = this.getFilePath(this.historyFile)
      const content = fs.readFileSync(filePath, 'utf8')
      return JSON.parse(content)
    } catch {
      return null
    }
  }
  
  // Append to build history
  private appendHistory(status: DeploymentStatus): void {
    let history: BuildHistory
    
    try {
      history = this.readHistory() || this.createEmptyHistory()
    } catch {
      history = this.createEmptyHistory()
    }
    
    history.deployments.push(status)
    
    // Keep last 100 deployments
    if (history.deployments.length > 100) {
      history.deployments = history.deployments.slice(-100)
    }
    
    // Update stats
    this.updateStats(history)
    
    // Write back
    const filePath = this.getFilePath(this.historyFile)
    fs.writeFileSync(filePath, JSON.stringify(history, null, 2))
  }
  
  private createEmptyHistory(): BuildHistory {
    return {
      deployments: [],
      stats: {
        total: 0,
        successful: 0,
        failed: 0,
        canceled: 0,
        averageDuration: 0,
        successRate: 0
      },
      lastChecked: Date.now()
    }
  }
  
  private updateStats(history: BuildHistory): void {
    const total = history.deployments.length
    const successful = history.deployments.filter(d => d.state === 'READY').length
    const failed = history.deployments.filter(d => d.state === 'ERROR').length
    const canceled = history.deployments.filter(d => d.state === 'CANCELED').length
    
    const durations = history.deployments
      .filter(d => d.duration && d.duration > 0)
      .map(d => d.duration!)
    
    const averageDuration = durations.length > 0
      ? durations.reduce((a, b) => a + b, 0) / durations.length
      : 0
    
    const successRate = total > 0 ? (successful / total) * 100 : 0
    
    history.stats = {
      total,
      successful,
      failed,
      canceled,
      averageDuration,
      successRate
    }
    
    history.lastChecked = Date.now()
  }
  
  // Get deployment health status
  getHealth(): { status: string; emoji: string; message: string } {
    const history = this.readHistory()
    
    if (!history || history.stats.total < 3) {
      return {
        status: 'unknown',
        emoji: '❓',
        message: 'Not enough deployment data (need 3+ deploys)'
      }
    }
    
    const successRate = history.stats.successRate
    
    if (successRate >= 95) {
      return {
        status: 'excellent',
        emoji: '🟢',
        message: `Excellent (${successRate.toFixed(1)}% success rate)`
      }
    }
    
    if (successRate >= 80) {
      return {
        status: 'good',
        emoji: '🟡',
        message: `Good (${successRate.toFixed(1)}% success rate)`
      }
    }
    
    if (successRate >= 60) {
      return {
        status: 'warning',
        emoji: '🟠',
        message: `Needs attention (${successRate.toFixed(1)}% success rate)`
      }
    }
    
    return {
      status: 'critical',
      emoji: '🔴',
      message: `Critical (${successRate.toFixed(1)}% success rate)`
    }
  }
  
  // Get recent failures
  getRecentFailures(count: number = 5): DeploymentStatus[] {
    const history = this.readHistory()
    if (!history) return []
    
    return history.deployments
      .filter(d => d.state === 'ERROR')
      .slice(-count)
      .reverse()
  }
  
  // Check if recent deployments are concerning
  hasRecentIssues(): { hasIssues: boolean; message: string } {
    const history = this.readHistory()
    if (!history || history.stats.total < 5) {
      return { hasIssues: false, message: 'Not enough data' }
    }
    
    const recent = history.deployments.slice(-5)
    const recentFailures = recent.filter(d => d.state === 'ERROR').length
    
    if (recentFailures >= 3) {
      return {
        hasIssues: true,
        message: `${recentFailures} failures in last 5 deployments`
      }
    }
    
    return { hasIssues: false, message: 'Recent deployments healthy' }
  }
  
  // Format status for display
  formatStatus(status: DeploymentStatus): string {
    const age = Date.now() - status.timestamp
    const hours = age / (1000 * 60 * 60)
    const minutes = age / (1000 * 60)
    
    const timeAgo = hours >= 1 
      ? `${hours.toFixed(1)}h ago`
      : `${Math.floor(minutes)}m ago`
    
    let output = `📊 Current Deployment Status:\n\n`
    
    if (status.state === 'READY') {
      output += `   ✅ State: ${status.state}\n`
      output += `   🌐 URL: ${status.url}\n`
      output += `   ⏱️  Time: ${timeAgo}\n`
      if (status.duration) {
        output += `   ⚡ Duration: ${(status.duration / 1000).toFixed(1)}s\n`
      }
    } else if (status.state === 'ERROR') {
      output += `   ❌ State: ${status.state}\n`
      output += `   ⏱️  Failed: ${timeAgo}\n`
      if (status.errorSummary) {
        output += `   🔍 Errors: ${status.errorSummary}\n`
      }
      if (status.errors && status.errors.length > 0) {
        output += `   📋 Total: ${status.errors.length} errors\n`
      }
    } else if (status.state === 'BUILDING') {
      output += `   🏗️  State: ${status.state}\n`
      output += `   ⏱️  Started: ${timeAgo}\n`
      output += `   ${hours > 0.5 ? '⚠️  Taking longer than expected' : ''}\n`
    } else {
      output += `   ❓ State: ${status.state}\n`
      output += `   ⏱️  Time: ${timeAgo}\n`
    }
    
    if (status.commit) {
      output += `   📝 Commit: ${status.commit}\n`
    }
    
    if (status.branch) {
      output += `   🌿 Branch: ${status.branch}\n`
    }
    
    return output
  }
  
  // Format history summary
  formatHistorySummary(): string {
    const history = this.readHistory()
    if (!history || history.stats.total === 0) {
      return '📊 Build History: No deployments yet\n'
    }
    
    const health = this.getHealth()
    
    let output = `📊 Build History Summary:\n\n`
    output += `   ${health.emoji} Health: ${health.message}\n`
    output += `   📈 Total: ${history.stats.total} deployments\n`
    output += `   ✅ Success: ${history.stats.successful}\n`
    output += `   ❌ Failed: ${history.stats.failed}\n`
    
    if (history.stats.averageDuration > 0) {
      output += `   ⚡ Avg Duration: ${(history.stats.averageDuration / 1000).toFixed(1)}s\n`
    }
    
    const issues = this.hasRecentIssues()
    if (issues.hasIssues) {
      output += `\n   ⚠️  ${issues.message}\n`
    }
    
    return output
  }
}

// CLI usage
if (require.main === module) {
  const manager = new DeploymentStatusManager()
  
  const command = process.argv[2]
  
  if (command === 'status') {
    const status = manager.readStatus()
    if (status) {
      console.log(manager.formatStatus(status))
    } else {
      console.log('No deployment status available')
    }
  } else if (command === 'history') {
    console.log(manager.formatHistorySummary())
  } else if (command === 'health') {
    const health = manager.getHealth()
    console.log(`${health.emoji} ${health.message}`)
  } else {
    console.log('Usage:')
    console.log('  npx tsx deployment-status.ts status   # Show current status')
    console.log('  npx tsx deployment-status.ts history  # Show history summary')
    console.log('  npx tsx deployment-status.ts health   # Show health status')
  }
}
