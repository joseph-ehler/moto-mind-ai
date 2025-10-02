#!/usr/bin/env node
// API Endpoints Organization Audit

const fs = require('fs').promises
const path = require('path')

class APIEndpointAuditor {
  constructor(rootPath) {
    this.rootPath = rootPath
    this.endpoints = []
    this.issues = []
  }
  
  async auditAPIDirectory() {
    const apiPath = path.join(this.rootPath, 'pages/api')
    await this.scanDirectory(apiPath, '/api')
    return this.generateReport()
  }
  
  async scanDirectory(dirPath, urlPath) {
    try {
      const items = await fs.readdir(dirPath, { withFileTypes: true })
      
      for (const item of items) {
        const itemPath = path.join(dirPath, item.name)
        
        if (item.isDirectory()) {
          // Scan subdirectory
          await this.scanDirectory(itemPath, `${urlPath}/${item.name}`)
        } else if (item.name.endsWith('.ts')) {
          // Analyze endpoint file
          const endpoint = await this.analyzeEndpoint(itemPath, urlPath, item.name)
          this.endpoints.push(endpoint)
        }
      }
    } catch (error) {
      this.issues.push(`Cannot access directory: ${dirPath} - ${error.message}`)
    }
  }
  
  async analyzeEndpoint(filePath, urlPath, fileName) {
    const stats = await fs.stat(filePath)
    const content = await fs.readFile(filePath, 'utf-8')
    
    // Extract endpoint info
    const baseName = fileName.replace('.ts', '')
    const isIndex = baseName === 'index'
    const isDynamic = baseName.includes('[') && baseName.includes(']')
    const url = isIndex ? urlPath : `${urlPath}/${baseName}`
    
    // Analyze content
    const methods = this.extractMethods(content)
    const hasAuth = content.includes('auth') || content.includes('tenant')
    const hasValidation = content.includes('zod') || content.includes('schema')
    const hasErrorHandling = content.includes('try') && content.includes('catch')
    
    // Identify issues
    const issues = []
    
    // Naming issues
    if (baseName.includes('-') && !['health-', 'canonical-image-', 'reminders-', 'vehicles-'].some(prefix => baseName.startsWith(prefix))) {
      issues.push('Uses kebab-case (consider camelCase for consistency)')
    }
    
    if (baseName.includes('_')) {
      issues.push('Uses snake_case (prefer camelCase)')
    }
    
    // Versioning issues
    if (baseName.match(/\d+$/) || baseName.includes('v2') || baseName.includes('new') || baseName.includes('old')) {
      issues.push('Appears to be versioned endpoint')
    }
    
    if (baseName.includes('simple') || baseName.includes('working') || baseName.includes('broken') || baseName.includes('optimized')) {
      issues.push('Appears to be duplicate/test endpoint')
    }
    
    // Size issues
    if (stats.size > 20000) {
      issues.push(`Large file (${Math.round(stats.size/1024)}KB) - consider splitting`)
    }
    
    // Missing patterns
    if (!hasErrorHandling) {
      issues.push('Missing error handling')
    }
    
    if (!hasValidation && methods.includes('POST')) {
      issues.push('POST endpoint without validation')
    }
    
    // Categorize endpoint
    const category = this.categorizeEndpoint(url, fileName, content)
    
    return {
      file: fileName,
      url,
      path: filePath,
      size: stats.size,
      category,
      methods,
      isDynamic,
      hasAuth,
      hasValidation,
      hasErrorHandling,
      issues,
      purpose: this.inferPurpose(url, content)
    }
  }
  
  extractMethods(content) {
    const methods = []
    if (content.includes("req.method === 'GET'") || content.includes('GET')) methods.push('GET')
    if (content.includes("req.method === 'POST'") || content.includes('POST')) methods.push('POST')
    if (content.includes("req.method === 'PUT'") || content.includes('PUT')) methods.push('PUT')
    if (content.includes("req.method === 'DELETE'") || content.includes('DELETE')) methods.push('DELETE')
    if (content.includes("req.method === 'PATCH'") || content.includes('PATCH')) methods.push('PATCH')
    
    return methods.length > 0 ? methods : ['GET'] // Default assumption
  }
  
  categorizeEndpoint(url, fileName, content) {
    // Core resources
    if (url.includes('/vehicles')) return 'vehicles'
    if (url.includes('/garages')) return 'garages'
    if (url.includes('/events')) return 'events'
    
    // Features
    if (url.includes('/vision') || url.includes('/ocr')) return 'vision'
    if (url.includes('/admin')) return 'admin'
    if (url.includes('/core')) return 'core'
    
    // Utilities
    if (url.includes('/health')) return 'health'
    if (url.includes('/metrics')) return 'monitoring'
    if (url.includes('/demo')) return 'demo'
    if (url.includes('/reminders')) return 'reminders'
    if (url.includes('/notifications')) return 'notifications'
    
    // Legacy/unclear
    if (fileName.includes('canonical-image')) return 'images'
    if (fileName.includes('upload')) return 'uploads'
    if (fileName.includes('vin')) return 'vin'
    if (fileName.includes('pdf')) return 'reports'
    
    return 'misc'
  }
  
  inferPurpose(url, content) {
    // Try to infer from URL and content
    if (url.includes('/health')) return 'Health check endpoint'
    if (url.includes('/metrics')) return 'System metrics'
    if (url.includes('/admin')) return 'Administrative functions'
    if (url.includes('/demo')) return 'Demo/testing utilities'
    if (url.includes('/vision')) return 'AI vision processing'
    if (url.includes('/vehicles')) return 'Vehicle management'
    if (url.includes('/garages')) return 'Garage management'
    if (url.includes('/events')) return 'Event logging'
    if (url.includes('/upload')) return 'File upload handling'
    if (url.includes('/vin')) return 'VIN processing'
    if (url.includes('/ocr')) return 'OCR processing'
    if (url.includes('/reminders')) return 'Reminder system'
    if (url.includes('/notifications')) return 'Notification system'
    
    return 'Purpose unclear from URL'
  }
  
  generateReport() {
    let report = '# 🔍 API ENDPOINTS ORGANIZATION AUDIT\n\n'
    report += `Generated: ${new Date().toISOString()}\n\n`
    
    // Summary stats
    const totalEndpoints = this.endpoints.length
    const endpointsWithIssues = this.endpoints.filter(e => e.issues.length > 0).length
    const totalIssues = this.endpoints.reduce((sum, e) => sum + e.issues.length, 0)
    
    report += `## 📊 SUMMARY\n\n`
    report += `**Total Endpoints:** ${totalEndpoints}\n`
    report += `**Endpoints with Issues:** ${endpointsWithIssues}\n`
    report += `**Total Issues:** ${totalIssues}\n\n`
    
    // Category breakdown
    const categories = this.groupBy(this.endpoints, e => e.category)
    
    report += `## 📁 ENDPOINTS BY CATEGORY\n\n`
    Object.entries(categories).forEach(([category, endpoints]) => {
      report += `### ${category.toUpperCase()} (${endpoints.length} endpoints)\n\n`
      
      endpoints.forEach(endpoint => {
        const size = endpoint.size > 1024 ? `${Math.round(endpoint.size / 1024)}KB` : `${endpoint.size}B`
        const methods = endpoint.methods.join(', ')
        const issues = endpoint.issues.length > 0 ? ` ⚠️ ${endpoint.issues.length} issues` : ''
        const auth = endpoint.hasAuth ? ' 🔒' : ''
        const validation = endpoint.hasValidation ? ' ✅' : ''
        
        report += `- **${endpoint.url}** (${methods}) - ${size}${auth}${validation}${issues}\n`
        report += `  - *Purpose:* ${endpoint.purpose}\n`
        
        if (endpoint.issues.length > 0) {
          endpoint.issues.forEach(issue => {
            report += `  - ⚠️ ${issue}\n`
          })
        }
        report += '\n'
      })
    })
    
    // Issues analysis
    const allIssues = this.endpoints.flatMap(e => e.issues)
    const issueFrequency = this.groupBy(allIssues, issue => issue)
    const topIssues = Object.entries(issueFrequency)
      .sort(([,a], [,b]) => b.length - a.length)
      .slice(0, 5)
    
    if (topIssues.length > 0) {
      report += `## ⚠️ MOST COMMON ISSUES\n\n`
      topIssues.forEach(([issue, occurrences]) => {
        report += `- **${issue}** (${occurrences.length} occurrences)\n`
      })
      report += '\n'
    }
    
    // Recommendations
    report += `## 💡 RECOMMENDATIONS\n\n`
    
    // Duplicate endpoints
    const duplicates = this.findDuplicateEndpoints()
    if (duplicates.length > 0) {
      report += `### 🔄 Duplicate/Versioned Endpoints\n\n`
      duplicates.forEach(group => {
        report += `**${group.base}:**\n`
        group.variants.forEach(variant => {
          report += `- ${variant.url} (${variant.file})\n`
        })
        report += `*Recommendation:* Consolidate into single endpoint with feature flags\n\n`
      })
    }
    
    // Large files
    const largeFiles = this.endpoints.filter(e => e.size > 15000)
    if (largeFiles.length > 0) {
      report += `### 📄 Large Files to Split\n\n`
      largeFiles.forEach(endpoint => {
        const size = Math.round(endpoint.size / 1024)
        report += `- **${endpoint.url}** (${size}KB) - Consider splitting into smaller modules\n`
      })
      report += '\n'
    }
    
    // Organizational improvements
    report += `### 🏗️ Structural Improvements\n\n`
    
    // Root level clutter
    const rootEndpoints = this.endpoints.filter(e => !e.url.includes('/', 5)) // After /api/
    if (rootEndpoints.length > 10) {
      report += `- **Root level clutter:** ${rootEndpoints.length} endpoints in /api/ root\n`
      report += `  - Consider grouping related endpoints into subdirectories\n`
    }
    
    // Missing patterns
    const missingAuth = this.endpoints.filter(e => !e.hasAuth && e.methods.includes('POST'))
    if (missingAuth.length > 0) {
      report += `- **Missing authentication:** ${missingAuth.length} POST endpoints without auth\n`
    }
    
    const missingValidation = this.endpoints.filter(e => !e.hasValidation && e.methods.includes('POST'))
    if (missingValidation.length > 0) {
      report += `- **Missing validation:** ${missingValidation.length} POST endpoints without validation\n`
    }
    
    // Score calculation
    const score = Math.max(0, 100 - (totalIssues * 3) - (endpointsWithIssues * 2))
    report += `\n## 📈 ORGANIZATION SCORE: ${score}/100\n\n`
    
    if (score >= 85) report += '🎉 **Excellent API organization!**\n'
    else if (score >= 70) report += '✅ **Good API organization with minor improvements needed**\n'
    else if (score >= 55) report += '⚠️ **Moderate API organization - several improvements recommended**\n'
    else report += '🚨 **Poor API organization - significant restructuring needed**\n'
    
    return report
  }
  
  findDuplicateEndpoints() {
    const groups = {}
    
    this.endpoints.forEach(endpoint => {
      // Extract base name without suffixes
      let base = endpoint.file.replace('.ts', '')
      base = base.replace(/-simple|-working|-broken|-optimized|-cached|\d+$/, '')
      
      if (!groups[base]) {
        groups[base] = []
      }
      groups[base].push(endpoint)
    })
    
    // Return only groups with multiple variants
    return Object.entries(groups)
      .filter(([base, variants]) => variants.length > 1)
      .map(([base, variants]) => ({ base, variants }))
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
}

// Main execution
async function main() {
  const auditor = new APIEndpointAuditor(process.cwd())
  
  console.log('🔍 Starting API endpoints organization audit...')
  
  try {
    const report = await auditor.auditAPIDirectory()
    
    // Write report to file
    const reportPath = 'API_ENDPOINTS_AUDIT.md'
    await fs.writeFile(reportPath, report)
    
    console.log(`✅ API audit complete! Report saved to: ${reportPath}`)
    
    // Extract summary
    const summaryMatch = report.match(/## 📊 SUMMARY([\s\S]*?)(?=##|$)/)
    if (summaryMatch) {
      console.log('\n📊 Quick Summary:')
      console.log(summaryMatch[1].trim())
    }
    
  } catch (error) {
    console.error('❌ API audit failed:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

module.exports = { APIEndpointAuditor }
