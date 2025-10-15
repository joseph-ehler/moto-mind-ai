#!/usr/bin/env node
// Comprehensive Codebase Taxonomy Audit - JavaScript Version

const fs = require('fs').promises
const path = require('path')

class CodebaseTaxonomyAuditor {
  constructor(rootPath) {
    this.rootPath = rootPath
    this.results = []
  }
  
  async auditDirectory(dirPath, relativePath = '') {
    const fullPath = path.join(this.rootPath, dirPath)
    let items
    
    try {
      items = await fs.readdir(fullPath, { withFileTypes: true })
    } catch (error) {
      return {
        path: relativePath || dirPath,
        name: path.basename(dirPath),
        fileCount: 0,
        subdirCount: 0,
        files: [],
        purpose: 'Directory not accessible',
        issues: [`Cannot access directory: ${error.message}`],
        recommendations: []
      }
    }
    
    const files = []
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
        try {
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
            issues: this.analyzeFileIssues(item.name, extension, relativePath, stats.size)
          })
        } catch (error) {
          files.push({
            name: item.name,
            path: path.join(relativePath, item.name),
            size: 0,
            type: 'file',
            extension: path.extname(item.name),
            category: 'error',
            issues: [`Cannot access file: ${error.message}`]
          })
        }
      }
    }
    
    const analysis = {
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
  
  categorizeFile(filename, extension) {
    const name = filename.toLowerCase()
    
    // Configuration files
    if (['.json', '.yaml', '.yml', '.toml', '.ini', '.env'].includes(extension)) {
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
    
    return 'other'
  }
  
  analyzeFileIssues(filename, extension, dirPath, size) {
    const issues = []
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
    const baseName = name.replace(extension, '')
    if (['index', 'utils', 'helpers', 'common', 'misc'].includes(baseName)) {
      issues.push('Generic name - could be more specific')
    }
    
    // Test files in wrong location
    if ((name.includes('test') || name.includes('spec')) && !dirPath.includes('test')) {
      issues.push('Test file not in test directory')
    }
    
    // Large files
    if ((['.ts', '.tsx', '.js', '.jsx'].includes(extension)) && size > 15000) {
      issues.push(`Large file (${Math.round(size/1024)}KB) - consider splitting`)
    }
    
    return issues
  }
  
  analyzeDirectoryIssues(dirPath, files) {
    const issues = []
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
  
  inferDirectoryPurpose(dirPath, files) {
    const name = path.basename(dirPath).toLowerCase()
    const fileTypes = files.filter(f => f.type === 'file').map(f => f.category)
    const dominantType = this.getMostCommon(fileTypes)
    
    // Known patterns
    const purposeMap = {
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
  
  generateRecommendations(analysis) {
    const recommendations = []
    
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
    const testFiles = analysis.files.filter(f => f.issues && f.issues.some(i => i.includes('Test file not in test directory')))
    if (testFiles.length > 0) {
      recommendations.push('Move test files to /tests/ directory')
    }
    
    // Large file recommendations
    const largeFiles = analysis.files.filter(f => f.issues && f.issues.some(i => i.includes('Large file')))
    if (largeFiles.length > 0) {
      recommendations.push(`Consider splitting large files: ${largeFiles.map(f => f.name).join(', ')}`)
    }
    
    return recommendations
  }
  
  getMostCommon(arr) {
    if (arr.length === 0) return undefined
    
    const counts = arr.reduce((acc, item) => {
      acc[item] = (acc[item] || 0) + 1
      return acc
    }, {})
    
    return Object.entries(counts).reduce((a, b) => counts[a[0]] > counts[b[0]] ? a : b)[0]
  }
  
  groupBy(array, keyFn) {
    return array.reduce((groups, item) => {
      const key = keyFn(item)
      if (!groups[key]) {
        groups[key] = []
      }
      groups[key].push(item)
      return groups
    }, {})
  }
  
  async generateReport() {
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
            const issues = file.issues && file.issues.length ? ` ⚠️ ${file.issues.length} issues` : ''
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

module.exports = { CodebaseTaxonomyAuditor }
