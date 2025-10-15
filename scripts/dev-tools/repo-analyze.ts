#!/usr/bin/env tsx
/**
 * Intelligent Repository Analyzer
 * 
 * Context-aware analysis that understands:
 * - Refactoring in progress
 * - New feature development  
 * - Feature extensions
 * - Technical debt vs intentional duplication
 */

import * as fs from 'fs'
import * as path from 'path'
import { execSync } from 'child_process'
import { glob } from 'glob'

interface FileInfo {
  path: string
  created: Date
  modified: Date
  size: number
  lines: number
}

interface Pattern {
  type: 'refactor' | 'new-feature' | 'extension' | 'cleanup' | 'maintenance'
  confidence: number
  evidence: string[]
  suggestions: string[]
}

interface FeatureAnalysis {
  name: string
  fileCount: number
  completeness: {
    routes: number
    logic: number
    components: number
    tests: number
  }
  status: 'new' | 'incomplete' | 'complete' | 'extended'
  ageInDays: number
  suggestions: string[]
}

class IntelligentAnalyzer {
  private gitRoot: string
  
  constructor() {
    this.gitRoot = process.cwd()
  }
  
  async analyze(): Promise<void> {
    console.log('🧠 INTELLIGENT REPOSITORY ANALYZER\n')
    console.log('='.repeat(60))
    console.log('Analyzing patterns, context, and intentions...')
    console.log('='.repeat(60))
    console.log('')
    
    // 1. Detect overall pattern
    const pattern = await this.detectPattern()
    this.printPattern(pattern)
    
    // 2. Feature-specific analysis
    const features = await this.analyzeFeatures()
    if (features.length > 0) {
      this.printFeatures(features)
    }
    
    // 3. Repository health
    await this.checkHealth()
  }
  
  async detectPattern(): Promise<Pattern> {
    const changes = this.getRecentChanges()
    
    const evidence: string[] = []
    let type: Pattern['type'] = 'maintenance'
    let confidence = 0.5
    
    // Pattern 1: Refactoring (files moved/renamed)
    if (changes.moved.length > 2) {
      type = 'refactor'
      confidence = 0.9
      evidence.push(`${changes.moved.length} files moved/renamed`)
      evidence.push('Organized into new directory structure')
    }
    // Pattern 2: New Feature (new directory with multiple files)
    else if (changes.newDirs.length > 0 && changes.added.length > 5) {
      type = 'new-feature'
      confidence = 0.85
      evidence.push(`${changes.newDirs.length} new directories created`)
      evidence.push(`${changes.added.length} new files added`)
      evidence.push(`New domains: ${changes.newDirs.join(', ')}`)
    }
    // Pattern 3: Extension (files added to existing directory)
    else if (changes.added.length > 2 && changes.added.length < 10 && changes.newDirs.length === 0) {
      type = 'extension'
      confidence = 0.75
      evidence.push(`${changes.added.length} files added to existing features`)
    }
    // Pattern 4: Cleanup (mostly deletions)
    else if (changes.deleted.length > changes.added.length && changes.modified.length < 5) {
      type = 'cleanup'
      confidence = 0.8
      evidence.push(`${changes.deleted.length} files removed`)
      evidence.push('Cleaning up unused code')
    }
    
    const suggestions = this.generateSuggestions(type, changes)
    
    return { type, confidence, evidence, suggestions }
  }
  
  private getRecentChanges() {
    try {
      const diffStat = execSync('git diff --name-status HEAD~10 HEAD', {
        encoding: 'utf8',
        cwd: this.gitRoot,
        stdio: ['pipe', 'pipe', 'ignore']
      }).trim()
      
      const added: string[] = []
      const modified: string[] = []
      const deleted: string[] = []
      const moved: string[] = []
      
      if (diffStat) {
        diffStat.split('\n').forEach(line => {
          const parts = line.split('\t')
          const status = parts[0]
          
          if (status === 'A' && parts[1]) added.push(parts[1])
          else if (status === 'M' && parts[1]) modified.push(parts[1])
          else if (status === 'D' && parts[1]) deleted.push(parts[1])
          else if (status.startsWith('R') && parts[2]) moved.push(parts[2])
        })
      }
      
      // Detect new directories
      const newDirs = new Set<string>()
      added.forEach(file => {
        const parts = file.split('/')
        if (parts.length > 1 && (parts[0] === 'lib' || parts[0] === 'app' || parts[0] === 'components')) {
          newDirs.add(parts[1])
        }
      })
      
      return {
        added,
        modified,
        deleted,
        moved,
        newDirs: Array.from(newDirs)
      }
    } catch (error) {
      return {
        added: [],
        modified: [],
        deleted: [],
        moved: [],
        newDirs: []
      }
    }
  }
  
  private generateSuggestions(type: Pattern['type'], changes: any): string[] {
    const suggestions: string[] = []
    
    switch (type) {
      case 'refactor':
        suggestions.push('Update imports across codebase: npm run refactor:verify-imports')
        suggestions.push('Run tests to ensure nothing broke: npm test')
        suggestions.push('Update documentation to reflect new structure')
        break
        
      case 'new-feature':
        suggestions.push('Ensure all necessary files created (routes, logic, components, tests)')
        suggestions.push('Add database migrations if needed: npm run db:generate-migration')
        suggestions.push('Add integration tests: tests/integration/')
        suggestions.push('Update API documentation')
        break
        
      case 'extension':
        suggestions.push('Verify backward compatibility')
        suggestions.push('Update existing tests')
        suggestions.push('Run full test suite: npm test')
        break
        
      case 'cleanup':
        suggestions.push('Verify no broken imports: npm run refactor:verify-imports')
        suggestions.push('Run full test suite: npm test')
        break
    }
    
    return suggestions
  }
  
  async analyzeFeatures(): Promise<FeatureAnalysis[]> {
    const features: FeatureAnalysis[] = []
    
    // Detect domains from lib/ directory
    const libPath = path.join(this.gitRoot, 'lib')
    if (!fs.existsSync(libPath)) return features
    
    const domains = fs.readdirSync(libPath, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name)
    
    for (const domain of domains) {
      const analysis = await this.analyzeDomain(domain)
      if (analysis) features.push(analysis)
    }
    
    return features
  }
  
  private async analyzeDomain(domain: string): Promise<FeatureAnalysis | null> {
    const locations = {
      routes: `{app,pages/api}/${domain}/**/*.{ts,tsx,js,jsx}`,
      logic: `lib/${domain}/**/*.{ts,tsx,js,jsx}`,
      components: `components/${domain}/**/*.{ts,tsx,js,jsx}`,
      tests: `tests/**/${domain}*.test.{ts,tsx,js,jsx}`
    }
    
    const counts = {
      routes: 0,
      logic: 0,
      components: 0,
      tests: 0
    }
    
    let oldestFile: Date | null = null
    let totalFiles = 0
    
    for (const [key, pattern] of Object.entries(locations)) {
      const files = await glob(pattern, { cwd: this.gitRoot })
      counts[key as keyof typeof counts] = files.length
      totalFiles += files.length
      
      // Find oldest file
      for (const file of files) {
        const fullPath = path.join(this.gitRoot, file)
        if (fs.existsSync(fullPath)) {
          const stats = fs.statSync(fullPath)
          if (!oldestFile || stats.birthtimeMs < oldestFile.getTime()) {
            oldestFile = stats.birthtime
          }
        }
      }
    }
    
    if (totalFiles === 0) return null
    
    const ageInDays = oldestFile 
      ? Math.floor((Date.now() - oldestFile.getTime()) / (1000 * 60 * 60 * 24))
      : 0
    
    // Determine status
    let status: FeatureAnalysis['status'] = 'complete'
    const suggestions: string[] = []
    
    if (ageInDays < 7) {
      status = 'new'
    } else if (counts.tests === 0 || counts.routes === 0) {
      status = 'incomplete'
    }
    
    // Generate suggestions
    if (counts.routes === 0 && counts.logic > 0) {
      suggestions.push(`Add API routes in app/${domain}/ or pages/api/${domain}/`)
    }
    if (counts.components === 0 && counts.routes > 0) {
      suggestions.push(`Add UI components in components/${domain}/`)
    }
    if (counts.tests === 0) {
      suggestions.push(`Add tests in tests/${domain}/ or tests/integration/`)
      status = 'incomplete'
    }
    if (counts.logic > 10 && counts.tests === 0) {
      suggestions.push('⚠️  Large codebase without tests - high priority!')
    }
    
    return {
      name: domain,
      fileCount: totalFiles,
      completeness: counts,
      status,
      ageInDays,
      suggestions
    }
  }
  
  private async checkHealth(): Promise<void> {
    console.log('\n' + '='.repeat(60))
    console.log('🏥 REPOSITORY HEALTH')
    console.log('='.repeat(60))
    console.log('')
    
    const issues: string[] = []
    
    // Check for TODO/FIXME comments
    const codeFiles = await glob('**/*.{ts,tsx,js,jsx}', {
      ignore: ['node_modules/**', '.next/**', 'dist/**'],
      cwd: this.gitRoot
    })
    
    let todoCount = 0
    for (const file of codeFiles) {
      const content = fs.readFileSync(path.join(this.gitRoot, file), 'utf8')
      const matches = content.match(/\/\/ TODO:|\/\/ FIXME:/g)
      if (matches) todoCount += matches.length
    }
    
    if (todoCount > 10) {
      issues.push(`⚠️  ${todoCount} TODO/FIXME comments - consider addressing`)
    } else if (todoCount > 0) {
      console.log(`💡 ${todoCount} TODO/FIXME comments`)
    }
    
    // Check for large files
    let largeFiles = 0
    for (const file of codeFiles) {
      const fullPath = path.join(this.gitRoot, file)
      const content = fs.readFileSync(fullPath, 'utf8')
      const lines = content.split('\n').length
      if (lines > 500) largeFiles++
    }
    
    if (largeFiles > 0) {
      issues.push(`💡 ${largeFiles} files > 500 lines - consider splitting`)
    }
    
    if (issues.length === 0) {
      console.log('✅ Repository health looks good!\n')
    } else {
      issues.forEach(issue => console.log(issue))
      console.log('')
    }
  }
  
  private printPattern(pattern: Pattern): void {
    console.log(`\n🔍 Detected Pattern: ${pattern.type.toUpperCase()}`)
    console.log(`   Confidence: ${Math.round(pattern.confidence * 100)}%`)
    
    if (pattern.evidence.length > 0) {
      console.log(`\n   Evidence:`)
      pattern.evidence.forEach(e => console.log(`   - ${e}`))
    }
    
    if (pattern.suggestions.length > 0) {
      console.log(`\n💡 Suggestions:`)
      pattern.suggestions.forEach(s => console.log(`   - ${s}`))
    }
  }
  
  private printFeatures(features: FeatureAnalysis[]): void {
    console.log('\n' + '='.repeat(60))
    console.log('📦 FEATURE ANALYSIS')
    console.log('='.repeat(60))
    
    for (const feature of features) {
      const statusEmoji = {
        new: '🆕',
        incomplete: '⚠️',
        complete: '✅',
        extended: '📈'
      }[feature.status]
      
      console.log(`\n📁 ${feature.name.toUpperCase()}`)
      console.log(`   Status: ${statusEmoji} ${feature.status}`)
      console.log(`   Age: ${this.formatAge(feature.ageInDays)}`)
      console.log(`   Files: ${feature.fileCount}`)
      console.log(`\n   Completeness:`)
      console.log(`   - Routes:     ${feature.completeness.routes} files`)
      console.log(`   - Logic:      ${feature.completeness.logic} files`)
      console.log(`   - Components: ${feature.completeness.components} files`)
      console.log(`   - Tests:      ${feature.completeness.tests} files`)
      
      if (feature.suggestions.length > 0) {
        console.log(`\n   💡 Suggestions:`)
        feature.suggestions.forEach(s => console.log(`      - ${s}`))
      }
    }
  }
  
  private formatAge(days: number): string {
    if (days < 1) return 'Created today'
    if (days === 1) return 'Created yesterday'
    if (days < 7) return `Created ${days} days ago`
    if (days < 30) return `Created ${Math.floor(days / 7)} weeks ago`
    return `Created ${Math.floor(days / 30)} months ago`
  }
}

// Run
const analyzer = new IntelligentAnalyzer()
analyzer.analyze().catch(console.error)
