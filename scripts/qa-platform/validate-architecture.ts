#!/usr/bin/env tsx
/**
 * Architecture Validator
 * 
 * Validates code follows feature-first architecture principles.
 * 
 * Mode: WARNING ONLY (Week 1)
 * - Detects violations
 * - Shows helpful messages
 * - Does NOT block commits
 * 
 * Future: Can be tightened to block commits
 * 
 * Usage:
 * - npm run arch:validate          # Check entire codebase
 * - npm run arch:validate --staged # Check only staged files (pre-commit)
 * 
 * Checks:
 * 1. New feature-specific code goes in features/
 * 2. No feature-specific code in lib/ (infrastructure only)
 * 3. No feature-specific code in components/ (shared only)
 * 4. Feature structure is complete (domain, data, ui, hooks, tests)
 * 5. No deep imports (../.../../)
 */

import * as fs from 'fs'
import * as path from 'path'
import { execSync } from 'child_process'

interface Violation {
  file: string
  type: 'feature-in-lib' | 'feature-in-components' | 'incomplete-structure' | 'deep-import' | 'no-tests'
  severity: 'error' | 'warning' | 'info'
  message: string
  suggestion: string
}

class ArchitectureValidator {
  private gitRoot: string
  private violations: Violation[] = []
  private mode: 'all' | 'staged'
  
  constructor(mode: 'all' | 'staged' = 'all') {
    this.gitRoot = process.cwd()
    this.mode = mode
  }
  
  /**
   * Main validation
   */
  async validate(): Promise<boolean> {
    console.log('🏛️  ARCHITECTURE VALIDATOR\n')
    console.log('='.repeat(60))
    console.log('Mode: WARNING ONLY (Week 1)')
    console.log('Purpose: Help you learn the patterns')
    console.log('='.repeat(60))
    console.log()
    
    const files = this.getFilesToCheck()
    
    if (files.length === 0) {
      console.log('✅ No files to check\n')
      return true
    }
    
    console.log(`📁 Checking ${files.length} files...\n`)
    
    // Run checks
    files.forEach(file => {
      this.checkFeatureSpecificCode(file)
      this.checkDeepImports(file)
      this.checkTestCoverage(file)
    })
    
    this.checkFeatureStructures()
    
    // Report
    this.reportViolations()
    
    return true // Always return true (warning mode)
  }
  
  /**
   * Get files to check
   */
  private getFilesToCheck(): string[] {
    try {
      if (this.mode === 'staged') {
        // Only check staged files
        const output = execSync('git diff --cached --name-only --diff-filter=ACM', {
          encoding: 'utf8',
          cwd: this.gitRoot
        })
        return output.split('\n')
          .filter(f => f.trim())
          .filter(f => f.match(/\.(ts|tsx)$/))
          .filter(f => !f.includes('node_modules'))
      } else {
        // Check all source files
        const output = execSync('git ls-files "*.ts" "*.tsx"', {
          encoding: 'utf8',
          cwd: this.gitRoot
        })
        return output.split('\n')
          .filter(f => f.trim())
          .filter(f => !f.includes('node_modules'))
          .filter(f => !f.startsWith('features/')) // Skip already migrated
      }
    } catch (e) {
      return []
    }
  }
  
  /**
   * Check 1: Feature-specific code should be in features/
   */
  private checkFeatureSpecificCode(file: string): void {
    // Only check lib/ and components/
    if (!file.startsWith('lib/') && !file.startsWith('components/')) {
      return
    }
    
    const fullPath = path.join(this.gitRoot, file)
    
    try {
      const content = fs.readFileSync(fullPath, 'utf8')
      const fileName = path.basename(file)
      
      // Detect feature-specific code
      const featureIndicators = [
        /type\s+Vehicle/i,
        /interface\s+Vehicle/i,
        /class\s+Vehicle/i,
        /type\s+Capture/i,
        /interface\s+Capture/i,
        /type\s+Document/i,
        /interface\s+Document/i,
        /type\s+Event/i,
        /interface\s+Event/i,
        /type\s+Dashboard/i,
        /interface\s+Dashboard/i
      ]
      
      // Check if file defines feature-specific types/interfaces
      let isFeatureSpecific = false
      let detectedFeature = ''
      
      featureIndicators.forEach(pattern => {
        if (pattern.test(content)) {
          isFeatureSpecific = true
          const match = content.match(pattern)
          if (match) {
            detectedFeature = match[0].split(/\s+/)[1].toLowerCase()
          }
        }
      })
      
      if (isFeatureSpecific) {
        const location = file.startsWith('lib/') ? 'lib/' : 'components/'
        
        this.violations.push({
          file,
          type: location === 'lib/' ? 'feature-in-lib' : 'feature-in-components',
          severity: 'warning',
          message: `Feature-specific code found in ${location}`,
          suggestion: `Consider moving to features/${detectedFeature}/${this.guessCategory(file)}/`
        })
      }
    } catch (e) {
      // Skip unreadable files
    }
  }
  
  /**
   * Check 2: No deep imports
   */
  private checkDeepImports(file: string): void {
    const fullPath = path.join(this.gitRoot, file)
    
    try {
      const content = fs.readFileSync(fullPath, 'utf8')
      
      // Check for ../../../ patterns
      const deepImportPattern = /from\s+['"]\.\.[\/\\]\.\.[\/\\]\.\.[\/\\]/g
      const matches = content.match(deepImportPattern)
      
      if (matches && matches.length > 0) {
        this.violations.push({
          file,
          type: 'deep-import',
          severity: 'warning',
          message: `Found ${matches.length} deep import(s): ../../../`,
          suggestion: 'Use @/ path aliases instead: import { X } from "@/features/..."'
        })
      }
    } catch (e) {
      // Skip unreadable files
    }
  }
  
  /**
   * Check 3: New files should have tests
   */
  private checkTestCoverage(file: string): void {
    // Skip test files themselves
    if (file.includes('.test.') || file.includes('.spec.') || file.includes('__tests__')) {
      return
    }
    
    // Only check new files (if in staged mode)
    if (this.mode !== 'staged') {
      return
    }
    
    // Check if corresponding test exists
    const testPaths = this.getTestPaths(file)
    const hasTest = testPaths.some(testPath => 
      fs.existsSync(path.join(this.gitRoot, testPath))
    )
    
    if (!hasTest) {
      this.violations.push({
        file,
        type: 'no-tests',
        severity: 'info',
        message: 'New file without tests',
        suggestion: `Consider adding tests in: ${testPaths[0]}`
      })
    }
  }
  
  /**
   * Check 4: Feature structures are complete
   */
  private checkFeatureStructures(): void {
    const featuresDir = path.join(this.gitRoot, 'features')
    
    if (!fs.existsSync(featuresDir)) {
      return
    }
    
    const features = fs.readdirSync(featuresDir, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name)
    
    features.forEach(feature => {
      const featurePath = path.join(featuresDir, feature)
      const requiredDirs = ['domain', 'data', 'ui', 'hooks', '__tests__']
      const missingDirs: string[] = []
      
      requiredDirs.forEach(dir => {
        const dirPath = path.join(featurePath, dir)
        if (!fs.existsSync(dirPath)) {
          missingDirs.push(dir)
        } else {
          // Check if directory is empty
          const files = fs.readdirSync(dirPath)
          if (files.length === 0) {
            missingDirs.push(`${dir} (empty)`)
          }
        }
      })
      
      if (missingDirs.length > 0) {
        this.violations.push({
          file: `features/${feature}/`,
          type: 'incomplete-structure',
          severity: 'info',
          message: `Incomplete feature structure`,
          suggestion: `Missing or empty: ${missingDirs.join(', ')}`
        })
      }
    })
  }
  
  /**
   * Report violations
   */
  private reportViolations(): void {
    if (this.violations.length === 0) {
      console.log('✅ No architectural violations found!\n')
      console.log('   Your code follows the feature-first pattern.')
      console.log()
      return
    }
    
    // Group by severity
    const errors = this.violations.filter(v => v.severity === 'error')
    const warnings = this.violations.filter(v => v.severity === 'warning')
    const info = this.violations.filter(v => v.severity === 'info')
    
    if (errors.length > 0) {
      console.log('🔴 ERRORS:\n')
      errors.forEach(v => this.printViolation(v))
    }
    
    if (warnings.length > 0) {
      console.log('⚠️  WARNINGS:\n')
      warnings.forEach(v => this.printViolation(v))
    }
    
    if (info.length > 0) {
      console.log('💡 INFO:\n')
      info.forEach(v => this.printViolation(v))
    }
    
    console.log('='.repeat(60))
    console.log(`Total: ${this.violations.length} issue(s) found`)
    console.log('='.repeat(60))
    console.log()
    
    console.log('📚 Learn more: docs/FEATURE-MIGRATION-GUIDE.md')
    console.log('🔧 Migrate a feature: npm run migrate:feature <name>')
    console.log()
    
    console.log('⚠️  Note: These are WARNINGS only (Week 1)')
    console.log('   Your commit will proceed.')
    console.log('   Use these to learn the patterns.')
    console.log()
  }
  
  /**
   * Print a violation
   */
  private printViolation(violation: Violation): void {
    console.log(`   ${violation.file}`)
    console.log(`   Issue: ${violation.message}`)
    console.log(`   💡 ${violation.suggestion}`)
    console.log()
  }
  
  /**
   * Helper: Guess category from file path
   */
  private guessCategory(file: string): string {
    if (file.includes('/types') || file.includes('/entities') || file.includes('/domain')) {
      return 'domain'
    }
    if (file.includes('/api') || file.includes('/services') || file.includes('/queries')) {
      return 'data'
    }
    if (file.includes('/components')) {
      return 'ui'
    }
    if (file.includes('/hooks')) {
      return 'hooks'
    }
    return 'domain'
  }
  
  /**
   * Helper: Get possible test file paths
   */
  private getTestPaths(file: string): string[] {
    const parsed = path.parse(file)
    const baseName = parsed.name
    const dir = parsed.dir
    
    return [
      `${dir}/__tests__/${baseName}.test${parsed.ext}`,
      `tests/${dir}/${baseName}.test${parsed.ext}`,
      `${dir}/${baseName}.test${parsed.ext}`
    ]
  }
}

// CLI
const mode = process.argv.includes('--staged') ? 'staged' : 'all'
const validator = new ArchitectureValidator(mode)

validator.validate()
  .then(success => {
    process.exit(success ? 0 : 1)
  })
  .catch(err => {
    console.error('Error:', err)
    process.exit(1)
  })
