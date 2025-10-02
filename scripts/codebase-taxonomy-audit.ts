#!/usr/bin/env ts-node
// Comprehensive Codebase Taxonomy Audit
// Analyzes directory structure, file naming, and organizational patterns

import { promises as fs } from 'fs'
import path from 'path'

interface FileInfo {
  name: string
  path: string
  size: number
  type: 'file' | 'directory'
  extension?: string
  category?: string
  issues?: string[]
}

interface DirectoryAnalysis {
  path: string
  name: string
  fileCount: number
  subdirCount: number
  files: FileInfo[]
  purpose: string
  issues: string[]
  recommendations: string[]
}

class CodebaseTaxonomyAuditor {
  private rootPath: string
  private results: DirectoryAnalysis[] = []
  
  constructor(rootPath: string) {
    this.rootPath = rootPath
  }
  
  async auditDirectory(dirPath: string, relativePath: string = ''): Promise<DirectoryAnalysis> {
    const fullPath = path.join(this.rootPath, dirPath)
    const items = await fs.readdir(fullPath, { withFileTypes: true })
    
    const files: FileInfo[] = []
    let fileCount = 0
    let subdirCount = 0
    
    for (const item of items) {
      if (item.isDirectory()) {
        subdirCount++
        files.push({
          name: item.name,
          path: path.join(relativePath, item.name),
          size: 0,
          type: 'directory'
        })
      } else {
        fileCount++
        const filePath = path.join(fullPath, item.name)
        const stats = await fs.stat(filePath)
        const extension = path.extname(item.name)
        
        files.push({
          name: item.name,
          path: path.join(relativePath, item.name),
          size: stats.size,
          type: 'file',
          extension,
          category: this.categorizeFile(item.name, extension),
          issues: this.analyzeFileIssues(item.name, extension, relativePath)
        })
      }
    }
    
    const analysis: DirectoryAnalysis = {
      path: relativePath || dirPath,
      name: path.basename(dirPath),
      fileCount,
      subdirCount,
      files,
      purpose: this.inferDirectoryPurpose(dirPath, files),
      issues: this.analyzeDirectoryIssues(dirPath, files),
      recommendations: []
    }
    
    analysis.recommendations = this.generateRecommendations(analysis)
    
    return analysis
  }
  
  private categorizeFile(filename: string, extension: string): string {
    const name = filename.toLowerCase()
    
    // Configuration files
    if (['.json', '.yaml', '.yml', '.toml', '.ini'].includes(extension)) {
      return 'configuration'
    }
    
    // Documentation
    if (['.md', '.txt', '.rst'].includes(extension)) {
      return 'documentation'
    }
    
    // TypeScript/JavaScript
    if (['.ts', '.tsx', '.js', '.jsx'].includes(extension)) {
      if (name.includes('test') || name.includes('spec')) return 'test'
      if (name.includes('type') || name.includes('interface')) return 'types'
      if (name.includes('util') || name.includes('helper')) return 'utility'
      if (name.includes('client')) return 'client'
      if (name.includes('service')) return 'service'
      if (name.includes('component')) return 'component'
      if (name.includes('hook')) return 'hook'
      if (name.includes('api')) return 'api'
      return 'code'
    }
    
    // SQL files
    if (['.sql'].includes(extension)) {
      return 'database'
    }
    
    // Other
    return 'other'
  }
  
  private analyzeFileIssues(filename: string, extension: string, dirPath: string): string[] {
    const issues: string[] = []
    const name = filename.toLowerCase()
    
    // Naming convention issues
    if (filename.includes(' ')) {
      issues.push('Contains spaces (should use kebab-case or camelCase)')
    }
    
    if (filename.includes('_') && !name.includes('test') && extension !== '.sql') {
      issues.push('Uses snake_case (prefer kebab-case for files)')
    }
    
    // Version/duplicate indicators
    if (name.match(/\d+$/) || name.includes('v2') || name.includes('new') || name.includes('old')) {
      issues.push('Appears to be versioned/duplicate file')
    }
    
    if (name.includes('copy') || name.includes('backup') || name.includes('temp')) {
      issues.push('Appears to be temporary/backup file')
    }
    
    // Generic naming
    if (['index', 'utils', 'helpers', 'common', 'misc'].includes(name.replace(extension, ''))) {
      issues.push('Generic name - could be more specific')
    }
    
    // Test files in wrong location
    if ((name.includes('test') || name.includes('spec')) && !dirPath.includes('test')) {
      issues.push('Test file not in test directory')
    }
    
    // Large files
    if (extension === '.ts' || extension === '.tsx') {
      // We'll check size in the actual audit
    }
    
    return issues
  }
  
  private analyzeDirectoryIssues(dirPath: string, files: FileInfo[]): string[] {
    const issues: string[] = []
    const name = path.basename(dirPath).toLowerCase()
    
    // Empty directories
    if (files.length === 0) {
      issues.push('Empty directory')
    }
    
    // Single file directories
    if (files.length === 1 && files[0].type === 'file') {
      issues.push('Contains only one file - consider consolidation')
    }
    
    // Mixed concerns
    const categories = new Set(files.filter(f => f.type === 'file').map(f => f.category))
    if (categories.size > 3) {
      issues.push('Mixed file types - lacks clear purpose')
    }
    
    // Naming issues
    if (name.includes('_')) {
      issues.push('Uses snake_case (prefer kebab-case)')
    }
    
    if (name.includes(' ')) {
      issues.push('Contains spaces')
    }
    
    // Generic names
    if (['misc', 'other', 'stuff', 'temp'].includes(name)) {
      issues.push('Generic directory name')
    }
    
    // Versioned directories
    if (name.match(/\d+$/) || name.includes('v2') || name.includes('new') || name.includes('old')) {
      issues.push('Appears to be versioned directory')
    }
    
    return issues
  }
  
  private inferDirectoryPurpose(dirPath: string, files: FileInfo[]): string {
    const name = path.basename(dirPath).toLowerCase()
    const fileTypes = files.filter(f => f.type === 'file').map(f => f.category)
    const dominantType = this.getMostCommon(fileTypes)
    
    // Known patterns
    const purposeMap: Record<string, string> = {
      'api': 'API endpoints and handlers',
      'components': 'React components',
      'hooks': 'React hooks',
      'pages': 'Next.js pages',
      'lib': 'Shared libraries and utilities',
      'utils': 'Utility functions',
      'services': 'Business logic services',
      'types': 'TypeScript type definitions',
      'clients': 'External service clients',
      'infrastructure': 'System infrastructure code',
      'storage': 'Data persistence logic',
      'vision': 'AI/Vision processing',
      'tests': 'Test files',
      'migrations': 'Database migrations',
      'scripts': 'Build and utility scripts',
      'docs': 'Documentation',
      'config': 'Configuration files'
    }
    
    if (purposeMap[name]) {
      return purposeMap[name]
    }
    
    // Infer from content
    if (dominantType === 'test') return 'Test files'
    if (dominantType === 'configuration') return 'Configuration'
    if (dominantType === 'documentation') return 'Documentation'
    if (dominantType === 'database') return 'Database scripts'
    
    return 'Mixed purpose - needs clarification'
  }
  
  private generateRecommendations(analysis: DirectoryAnalysis): string[] {
    const recommendations: string[] = []
    
    // Empty directory recommendations
    if (analysis.issues.includes('Empty directory')) {
      recommendations.push('Remove empty directory or add README explaining future purpose')
    }
    
    // Single file recommendations
    if (analysis.issues.includes('Contains only one file - consider consolidation')) {
      recommendations.push('Consider moving single file to parent directory or merging with related files')
    }
    
    // Mixed concerns
    if (analysis.issues.includes('Mixed file types - lacks clear purpose')) {
      recommendations.push('Split into focused subdirectories by file type/purpose')
    }
    
    // Naming improvements
    if (analysis.issues.includes('Uses snake_case (prefer kebab-case)')) {
      recommendations.push(`Rename to kebab-case: ${analysis.name.replace(/_/g, '-')}`)
    }
    
    // Generic names
    if (analysis.issues.includes('Generic directory name')) {
      recommendations.push('Use more specific name that describes actual purpose')
    }
    
    // Test organization
    const testFiles = analysis.files.filter(f => f.issues?.includes('Test file not in test directory'))
    if (testFiles.length > 0) {
      recommendations.push('Move test files to /tests/ directory')
    }
    
    // Large file recommendations
    const largeFiles = analysis.files.filter(f => f.size > 10000 && f.extension === '.ts')
    if (largeFiles.length > 0) {
      recommendations.push(`Consider splitting large files: ${largeFiles.map(f => f.name).join(', ')}`)
    }
    
    return recommendations
  }
  
  private getMostCommon<T>(arr: T[]): T | undefined {
    if (arr.length === 0) return undefined
    
    const counts = arr.reduce((acc, item) => {
      acc[item as string] = (acc[item as string] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    return Object.entries(counts).reduce((a, b) => counts[a[0]] > counts[b[0]] ? a : b)[0] as T
  }
  
  async generateReport(): Promise<string> {
    // Audit key directories
    const directoriesToAudit = [
      'lib',
      'pages/api',
      'components',
      'hooks',
      'tests',
      'scripts',
      'migrations'
    ]
    
    let report = '# 🔍 COMPREHENSIVE CODEBASE TAXONOMY AUDIT\n\n'
    report += `Generated: ${new Date().toISOString()}\n\n`
    
    for (const dir of directoriesToAudit) {
      try {
        const analysis = await this.auditDirectory(dir)
        this.results.push(analysis)
        
        report += `## 📁 /${dir}/\n\n`
        report += `**Purpose:** ${analysis.purpose}\n`
        report += `**Files:** ${analysis.fileCount} | **Subdirectories:** ${analysis.subdirCount}\n\n`
        
        if (analysis.issues.length > 0) {
          report += `**⚠️ Issues:**\n`
          analysis.issues.forEach(issue => {
            report += `- ${issue}\n`
          })
          report += '\n'
        }
        
        if (analysis.recommendations.length > 0) {
          report += `**💡 Recommendations:**\n`
          analysis.recommendations.forEach(rec => {
            report += `- ${rec}\n`
          })
          report += '\n'
        }
        
        // File breakdown
        if (analysis.files.length > 0) {
          report += `**📄 File Analysis:**\n`
          
          const categories = this.groupBy(analysis.files.filter(f => f.type === 'file'), f => f.category || 'uncategorized')
          
          Object.entries(categories).forEach(([category, files]) => {
            report += `\n*${category.toUpperCase()}:*\n`
            files.forEach(file => {
              const size = file.size > 1024 ? `${Math.round(file.size / 1024)}KB` : `${file.size}B`
              const issues = file.issues?.length ? ` ⚠️ ${file.issues.length} issues` : ''
              report += `- \`${file.name}\` (${size})${issues}\n`
            })
          })
          
          // Subdirectories
          const subdirs = analysis.files.filter(f => f.type === 'directory')
          if (subdirs.length > 0) {
            report += `\n*SUBDIRECTORIES:*\n`
            subdirs.forEach(subdir => {
              report += `- 📁 \`${subdir.name}/\`\n`
            })
          }
        }
        
        report += '\n---\n\n'
        
        // Recursively audit subdirectories
        const subdirs = analysis.files.filter(f => f.type === 'directory')
        for (const subdir of subdirs) {
          const subdirAnalysis = await this.auditDirectory(path.join(dir, subdir.name), path.join(dir, subdir.name))
          this.results.push(subdirAnalysis)
          
          if (subdirAnalysis.issues.length > 0 || subdirAnalysis.recommendations.length > 0) {
            report += `### 📁 /${path.join(dir, subdir.name)}/\n\n`
            report += `**Purpose:** ${subdirAnalysis.purpose}\n`
            report += `**Files:** ${subdirAnalysis.fileCount} | **Subdirectories:** ${subdirAnalysis.subdirCount}\n\n`
            
            if (subdirAnalysis.issues.length > 0) {
              report += `**⚠️ Issues:**\n`
              subdirAnalysis.issues.forEach(issue => {
                report += `- ${issue}\n`
              })
              report += '\n'
            }
            
            if (subdirAnalysis.recommendations.length > 0) {
              report += `**💡 Recommendations:**\n`
              subdirAnalysis.recommendations.forEach(rec => {
                report += `- ${rec}\n`
              })
              report += '\n'
            }
            
            report += '\n'
          }
        }
        
      } catch (error) {
        report += `## ❌ Error auditing /${dir}/\n`
        report += `${error}\n\n`
      }
    }
    
    // Summary
    report += '## 📊 SUMMARY\n\n'
    
    const totalIssues = this.results.reduce((sum, r) => sum + r.issues.length, 0)
    const totalRecommendations = this.results.reduce((sum, r) => sum + r.recommendations.length, 0)
    const directoriesWithIssues = this.results.filter(r => r.issues.length > 0).length
    
    report += `**Total Directories Analyzed:** ${this.results.length}\n`
    report += `**Directories with Issues:** ${directoriesWithIssues}\n`
    report += `**Total Issues Found:** ${totalIssues}\n`
    report += `**Total Recommendations:** ${totalRecommendations}\n\n`
    
    // Top issues
    const allIssues = this.results.flatMap(r => r.issues)
    const issueFrequency = this.groupBy(allIssues, issue => issue)
    const topIssues = Object.entries(issueFrequency)
      .sort(([,a], [,b]) => b.length - a.length)
      .slice(0, 5)
    
    if (topIssues.length > 0) {
      report += `**Most Common Issues:**\n`
      topIssues.forEach(([issue, occurrences]) => {
        report += `- ${issue} (${occurrences.length} occurrences)\n`
      })
      report += '\n'
    }
    
    // Organizational score
    const score = Math.max(0, 100 - (totalIssues * 2) - (directoriesWithIssues * 5))
    report += `**📈 Organizational Score:** ${score}/100\n\n`
    
    if (score >= 90) report += '🎉 **Excellent organization!**\n'
    else if (score >= 75) report += '✅ **Good organization with minor improvements needed**\n'
    else if (score >= 60) report += '⚠️ **Moderate organization - several improvements recommended**\n'
    else report += '🚨 **Poor organization - significant restructuring needed**\n'
    
    return report
  }
  
  private groupBy<T, K extends string | number | symbol>(
    array: T[],
    keyFn: (item: T) => K
  ): Record<K, T[]> {
    return array.reduce((groups, item) => {
      const key = keyFn(item)
      if (!groups[key]) {
        groups[key] = []
      }
      groups[key].push(item)
      return groups
    }, {} as Record<K, T[]>)
  }
}

// Main execution
async function main() {
  const auditor = new CodebaseTaxonomyAuditor(process.cwd())
  
  console.log('🔍 Starting comprehensive codebase taxonomy audit...')
  
  try {
    const report = await auditor.generateReport()
    
    // Write report to file
    const reportPath = 'CODEBASE_TAXONOMY_AUDIT.md'
    await fs.writeFile(reportPath, report)
    
    console.log(`✅ Audit complete! Report saved to: ${reportPath}`)
    console.log('\n📊 Quick Summary:')
    
    // Extract summary from report
    const summaryMatch = report.match(/## 📊 SUMMARY([\s\S]*?)(?=##|$)/)
    if (summaryMatch) {
      console.log(summaryMatch[1].trim())
    }
    
  } catch (error) {
    console.error('❌ Audit failed:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

export { CodebaseTaxonomyAuditor }
