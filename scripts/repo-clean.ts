#!/usr/bin/env tsx
/**
 * Repository Cleaner
 * 
 * Finds and fixes common repository issues:
 * - Duplicate migrations
 * - Broken migrations
 * - Unused files
 * - Naming issues
 */

import * as fs from 'fs'
import * as path from 'path'
import { glob } from 'glob'

interface CleanupIssue {
  type: 'duplicate' | 'broken' | 'unused' | 'naming'
  severity: 'high' | 'medium' | 'low'
  file: string
  issue: string
  suggestion: string
  autofix: boolean
  fix?: () => Promise<void>
}

class RepoCleaner {
  private gitRoot: string
  
  constructor() {
    this.gitRoot = process.cwd()
  }
  
  async analyze(): Promise<CleanupIssue[]> {
    console.log('🔍 Analyzing repository for cleanup opportunities...\n')
    
    const issues: CleanupIssue[] = []
    
    // 1. Check for duplicate migrations
    await this.checkDuplicateMigrations(issues)
    
    // 2. Check for broken migrations
    await this.checkBrokenMigrations(issues)
    
    // 3. Check for temp/backup files
    await this.checkTempFiles(issues)
    
    // 4. Check for naming issues
    await this.checkNaming(issues)
    
    return issues
  }
  
  private async checkDuplicateMigrations(issues: CleanupIssue[]): Promise<void> {
    const migrations = await glob('supabase/migrations/*.sql', { cwd: this.gitRoot })
    
    // Find MASTER files
    const masterFiles = migrations.filter(m => m.includes('MASTER'))
    
    if (masterFiles.length === 0) return
    
    // Find individual files that might be redundant
    const individualFiles = migrations.filter(m => 
      !m.includes('MASTER') && 
      !m.includes('rollback') &&
      !m.includes('.skip')
    )
    
    // Check if individual files match MASTER date
    for (const master of masterFiles) {
      const dateMatch = master.match(/(\d{8})/)
      if (!dateMatch) continue
      
      const date = dateMatch[1]
      const redundant = individualFiles.filter(f => f.includes(date))
      
      if (redundant.length > 0) {
        issues.push({
          type: 'duplicate',
          severity: 'medium',
          file: 'supabase/migrations/',
          issue: `${redundant.length} individual migration files may be redundant (date matches MASTER file)`,
          suggestion: 'Archive individual files if MASTER was applied',
          autofix: true,
          fix: async () => {
            const archiveDir = path.join(this.gitRoot, 'supabase/migrations/archive/')
            if (!fs.existsSync(archiveDir)) {
              fs.mkdirSync(archiveDir, { recursive: true })
            }
            
            for (const file of redundant) {
              const basename = path.basename(file)
              const fullPath = path.join(this.gitRoot, file)
              const archivePath = path.join(archiveDir, basename)
              
              if (fs.existsSync(fullPath)) {
                fs.renameSync(fullPath, archivePath)
                console.log(`   ✅ Archived: ${basename}`)
              }
            }
          }
        })
      }
    }
  }
  
  private async checkBrokenMigrations(issues: CleanupIssue[]): Promise<void> {
    const migrations = await glob('supabase/migrations/*.sql', { cwd: this.gitRoot })
    
    for (const migration of migrations) {
      if (migration.includes('.skip')) continue
      
      const fullPath = path.join(this.gitRoot, migration)
      const content = fs.readFileSync(fullPath, 'utf8')
      
      // Check for unmatched quotes
      const singleQuotes = (content.match(/'/g) || []).length
      if (singleQuotes % 2 !== 0) {
        issues.push({
          type: 'broken',
          severity: 'high',
          file: migration,
          issue: 'Unmatched single quotes - will cause SQL syntax error',
          suggestion: 'Fix syntax or rename to .skip',
          autofix: true,
          fix: async () => {
            fs.renameSync(fullPath, fullPath + '.skip')
            console.log(`   ✅ Renamed to .skip: ${path.basename(migration)}`)
          }
        })
      }
      
      // Check for RAISE NOTICE outside DO blocks
      if (content.includes('RAISE NOTICE') && !content.includes('DO $$')) {
        issues.push({
          type: 'broken',
          severity: 'high',
          file: migration,
          issue: 'RAISE NOTICE outside DO block - will cause syntax error',
          suggestion: 'Fix syntax or rename to .skip',
          autofix: false
        })
      }
    }
  }
  
  private async checkTempFiles(issues: CleanupIssue[]): Promise<void> {
    const tempFiles = await glob('**/*.{tmp,temp,bak,backup,old}', {
      ignore: ['node_modules/**', '.next/**'],
      cwd: this.gitRoot
    })
    
    if (tempFiles.length > 0) {
      issues.push({
        type: 'unused',
        severity: 'low',
        file: 'various',
        issue: `${tempFiles.length} temporary/backup files found`,
        suggestion: 'Delete or move to proper location',
        autofix: true,
        fix: async () => {
          for (const file of tempFiles) {
            const fullPath = path.join(this.gitRoot, file)
            if (fs.existsSync(fullPath)) {
              fs.unlinkSync(fullPath)
              console.log(`   ✅ Deleted: ${file}`)
            }
          }
        }
      })
    }
  }
  
  private async checkNaming(issues: CleanupIssue[]): Promise<void> {
    const allFiles = await glob('**/*.{ts,tsx,js,jsx}', {
      ignore: ['node_modules/**', '.next/**', 'dist/**'],
      cwd: this.gitRoot
    })
    
    const namingIssues = allFiles.filter(file => {
      const basename = path.basename(file)
      return (
        basename.includes(' ') ||
        basename.includes('Copy') ||
        basename.toLowerCase().includes('untitled')
      )
    })
    
    if (namingIssues.length > 0) {
      issues.push({
        type: 'naming',
        severity: 'low',
        file: 'various',
        issue: `${namingIssues.length} files with naming issues (spaces, 'Copy', etc.)`,
        suggestion: 'Rename to follow conventions',
        autofix: false
      })
    }
  }
  
  async clean(fix: boolean = false): Promise<void> {
    const issues = await this.analyze()
    
    if (issues.length === 0) {
      console.log('✅ Repository is clean! No issues found.\n')
      return
    }
    
    this.printReport(issues)
    
    if (fix) {
      await this.autoFix(issues)
    }
  }
  
  private printReport(issues: CleanupIssue[]): void {
    console.log('='.repeat(60))
    console.log('📋 CLEANUP REPORT')
    console.log('='.repeat(60))
    
    const byPriority = {
      high: issues.filter(i => i.severity === 'high'),
      medium: issues.filter(i => i.severity === 'medium'),
      low: issues.filter(i => i.severity === 'low')
    }
    
    if (byPriority.high.length > 0) {
      console.log('\n❌ HIGH PRIORITY:')
      byPriority.high.forEach(issue => {
        console.log(`   ${issue.file}`)
        console.log(`   Issue: ${issue.issue}`)
        console.log(`   Fix: ${issue.suggestion}`)
        if (issue.autofix) console.log(`   ✅ Can auto-fix`)
        console.log()
      })
    }
    
    if (byPriority.medium.length > 0) {
      console.log('\n⚠️  MEDIUM PRIORITY:')
      byPriority.medium.forEach(issue => {
        console.log(`   ${issue.file}`)
        console.log(`   Issue: ${issue.issue}`)
        console.log(`   Fix: ${issue.suggestion}`)
        if (issue.autofix) console.log(`   ✅ Can auto-fix`)
        console.log()
      })
    }
    
    if (byPriority.low.length > 0) {
      console.log('\n💡 LOW PRIORITY:')
      byPriority.low.forEach(issue => {
        console.log(`   ${issue.file}`)
        console.log(`   Issue: ${issue.issue}`)
        console.log()
      })
    }
    
    console.log('='.repeat(60))
    console.log(`Total issues: ${issues.length}`)
    console.log(`Auto-fixable: ${issues.filter(i => i.autofix).length}`)
    
    if (issues.filter(i => i.autofix).length > 0) {
      console.log('\n🔧 Run with --fix to auto-fix issues')
    }
    console.log('')
  }
  
  private async autoFix(issues: CleanupIssue[]): Promise<void> {
    const fixable = issues.filter(i => i.autofix && i.fix)
    
    if (fixable.length === 0) {
      console.log('\n⚠️  No auto-fixable issues\n')
      return
    }
    
    console.log(`\n🔧 Auto-fixing ${fixable.length} issues...\n`)
    
    for (const issue of fixable) {
      console.log(`⏳ Fixing: ${issue.issue}`)
      try {
        await issue.fix!()
      } catch (error: any) {
        console.error(`   ❌ Failed: ${error.message}`)
      }
    }
    
    console.log(`\n✅ Fixed ${fixable.length} issues!\n`)
  }
}

// CLI
const shouldFix = process.argv.includes('--fix')
const cleaner = new RepoCleaner()

cleaner.clean(shouldFix).catch(console.error)
