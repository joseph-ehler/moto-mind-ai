#!/usr/bin/env tsx
/**
 * Feature Migration Helper
 * 
 * Semi-automated tool to help migrate features to feature-first architecture.
 * Human stays in control - this tool ASSISTS, doesn't automate everything.
 * 
 * Usage: npm run migrate:feature <feature-name>
 * Example: npm run migrate:feature vehicles
 * 
 * What it does:
 * 1. Creates feature directory structure
 * 2. Discovers files that might belong to this feature
 * 3. Suggests where each file should go
 * 4. Lets you confirm each move
 * 5. Updates imports automatically
 * 6. Runs tests after each step
 * 
 * What it DOESN'T do:
 * - Doesn't move files without asking
 * - Doesn't assume it knows better than you
 * - Doesn't break things silently
 */

import * as fs from 'fs'
import * as path from 'path'
import { execSync } from 'child_process'
import * as readline from 'readline'

interface FileToMove {
  currentPath: string
  suggestedPath: string
  category: 'domain' | 'data' | 'ui' | 'hooks' | 'tests'
  confidence: 'high' | 'medium' | 'low'
  reason: string
}

class FeatureMigrationHelper {
  private featureName: string
  private gitRoot: string
  private rl: readline.Interface
  
  constructor(featureName: string) {
    this.featureName = featureName
    this.gitRoot = process.cwd()
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })
  }
  
  /**
   * Main migration flow
   */
  async migrate(): Promise<void> {
    console.log('🔄 FEATURE MIGRATION HELPER\n')
    console.log('='.repeat(60))
    console.log(`Feature: ${this.featureName}`)
    console.log('Mode: Semi-Automated (human confirms each step)')
    console.log('='.repeat(60))
    console.log()
    
    // Step 1: Create structure
    await this.createStructure()
    
    // Step 2: Discover files
    const filesToMove = await this.discoverFiles()
    
    if (filesToMove.length === 0) {
      console.log('ℹ️  No files found for this feature.')
      console.log('   Maybe already migrated, or feature name incorrect?')
      this.rl.close()
      return
    }
    
    console.log(`\n📁 Found ${filesToMove.length} files that might belong to ${this.featureName}\n`)
    
    // Step 3: Review and move files
    await this.reviewAndMoveFiles(filesToMove)
    
    // Step 4: Update imports
    await this.updateImports()
    
    // Step 5: Run tests
    await this.runTests()
    
    // Step 6: Summary
    this.showSummary()
    
    this.rl.close()
  }
  
  /**
   * Step 1: Create feature directory structure
   */
  private async createStructure(): Promise<void> {
    console.log('📁 Step 1: Creating feature directory structure...\n')
    
    const featureRoot = path.join(this.gitRoot, 'features', this.featureName)
    const directories = ['domain', 'data', 'ui', 'hooks', '__tests__']
    
    // Check if already exists
    if (fs.existsSync(featureRoot)) {
      const answer = await this.ask(`⚠️  features/${this.featureName}/ already exists. Continue? (y/n): `)
      if (answer.toLowerCase() !== 'y') {
        console.log('Migration cancelled.')
        process.exit(0)
      }
    } else {
      // Create directories
      directories.forEach(dir => {
        const dirPath = path.join(featureRoot, dir)
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true })
          console.log(`   ✅ Created ${dir}/`)
        } else {
          console.log(`   ⏭️  ${dir}/ already exists`)
        }
      })
    }
    
    console.log()
  }
  
  /**
   * Step 2: Discover files that might belong to this feature
   */
  private async discoverFiles(): Promise<FileToMove[]> {
    console.log('🔍 Step 2: Discovering files...\n')
    
    const filesToMove: FileToMove[] = []
    const featureLower = this.featureName.toLowerCase()
    const featurePattern = new RegExp(featureLower, 'i')
    
    // Search patterns
    const searchPaths = [
      'lib/**/*.ts',
      'lib/**/*.tsx',
      'components/**/*.tsx',
      'components/**/*.ts',
      'tests/**/*.ts',
      'tests/**/*.tsx'
    ]
    
    // Use git ls-files for speed
    try {
      const output = execSync('git ls-files', { 
        encoding: 'utf8',
        cwd: this.gitRoot
      })
      
      const allFiles = output.split('\n').filter(f => f.trim())
      
      allFiles.forEach(file => {
        // Skip non-source files
        if (!file.match(/\.(ts|tsx)$/)) return
        
        // Skip already migrated
        if (file.startsWith('features/')) return
        
        // Skip node_modules, .next, etc.
        if (file.includes('node_modules') || file.includes('.next')) return
        
        // Check if file relates to this feature
        const fileName = path.basename(file, path.extname(file))
        const dirName = path.dirname(file)
        
        // Check file name
        if (featurePattern.test(fileName) || featurePattern.test(dirName)) {
          filesToMove.push(this.categorizeFile(file))
        }
        
        // Check file contents (for imports/types that reference feature)
        else {
          try {
            const content = fs.readFileSync(path.join(this.gitRoot, file), 'utf8')
            if (featurePattern.test(content)) {
              // Only if it's a primary file for this feature, not just imports it
              const typeMatches = content.match(new RegExp(`(type|interface|class)\\s+${featureLower}`, 'i'))
              const exportMatches = content.match(new RegExp(`export.*${featureLower}`, 'i'))
              
              if (typeMatches || exportMatches) {
                filesToMove.push(this.categorizeFile(file))
              }
            }
          } catch (e) {
            // Skip unreadable files
          }
        }
      })
    } catch (e) {
      console.error('Error discovering files:', e)
    }
    
    return filesToMove
  }
  
  /**
   * Categorize file and suggest destination
   */
  private categorizeFile(filePath: string): FileToMove {
    const featureLower = this.featureName.toLowerCase()
    const fileName = path.basename(filePath)
    const baseFileName = path.basename(filePath, path.extname(filePath))
    const dirName = path.dirname(filePath)
    
    // Determine category based on path and name
    let category: FileToMove['category'] = 'domain'
    let confidence: FileToMove['confidence'] = 'medium'
    let reason = ''
    
    // FIX 1: API routes → data/ (highest priority - check first)
    if (filePath.startsWith('pages/api/')) {
      category = 'data'
      confidence = 'high'
      reason = 'API route'
    }
    // Tests
    else if (dirName.includes('tests/') || dirName.includes('__tests__') || fileName.includes('.test.') || fileName.includes('.spec.')) {
      category = 'tests'
      confidence = 'high'
      reason = 'Test file'
    }
    // FIX 2: React hooks → hooks/ (improved detection)
    // Matches: useVehicles, useVehicleEvents, etc. (use + PascalCase pattern)
    else if (baseFileName.startsWith('use') && baseFileName.match(/^use[A-Z]/)) {
      category = 'hooks'
      confidence = 'high'
      reason = 'React hook'
    }
    // UI Components
    else if (dirName.includes('components/') && fileName.match(/^[A-Z]/)) {
      category = 'ui'
      confidence = 'high'
      reason = 'UI component'
    }
    // Data/API (services, queries, mutations)
    else if (fileName.includes('api') || fileName.includes('query') || fileName.includes('queries') || fileName.includes('mutation') || dirName.includes('services/')) {
      category = 'data'
      confidence = 'high'
      reason = 'Data/API layer'
    }
    // Domain (types, entities, business logic)
    else if (fileName.includes('type') || fileName.includes('entity') || fileName.includes('entities') || dirName.includes('domain/')) {
      category = 'domain'
      confidence = 'high'
      reason = 'Domain logic'
    }
    // Low confidence - needs review
    else {
      category = 'domain'
      confidence = 'low'
      reason = 'Contains feature reference - needs review'
    }
    
    const suggestedPath = path.join('features', this.featureName, category, fileName)
    
    return {
      currentPath: filePath,
      suggestedPath,
      category,
      confidence,
      reason
    }
  }
  
  /**
   * Step 3: Review and move files
   */
  private async reviewAndMoveFiles(filesToMove: FileToMove[]): Promise<void> {
    console.log('📦 Step 3: Review and move files\n')
    console.log('For each file, you can:')
    console.log('  y = Yes, move to suggested location')
    console.log('  n = No, skip this file')
    console.log('  e = Edit destination path')
    console.log('  q = Quit migration\n')
    
    for (let i = 0; i < filesToMove.length; i++) {
      const file = filesToMove[i]
      
      console.log(`\n[${i + 1}/${filesToMove.length}] ${file.currentPath}`)
      console.log(`   → ${file.suggestedPath}`)
      console.log(`   Category: ${file.category} | Confidence: ${file.confidence}`)
      console.log(`   Reason: ${file.reason}`)
      
      const answer = await this.ask('   Move? (y/n/e/q): ')
      
      if (answer === 'q') {
        console.log('\nMigration stopped by user.')
        process.exit(0)
      }
      
      if (answer === 'n') {
        console.log('   ⏭️  Skipped')
        continue
      }
      
      let destinationPath = file.suggestedPath
      
      if (answer === 'e') {
        destinationPath = await this.ask('   Enter destination path: ')
      }
      
      // Move file
      try {
        const fullDestination = path.join(this.gitRoot, destinationPath)
        const fullSource = path.join(this.gitRoot, file.currentPath)
        
        // Create directory if needed
        const destDir = path.dirname(fullDestination)
        if (!fs.existsSync(destDir)) {
          fs.mkdirSync(destDir, { recursive: true })
        }
        
        // Use git mv to preserve history
        execSync(`git mv "${file.currentPath}" "${destinationPath}"`, {
          cwd: this.gitRoot,
          stdio: 'pipe'
        })
        
        console.log('   ✅ Moved')
      } catch (e: any) {
        console.log(`   ❌ Error: ${e.message}`)
        console.log('   Continuing with other files...')
      }
    }
    
    console.log()
  }
  
  /**
   * Step 4: Update imports
   */
  private async updateImports(): Promise<void> {
    console.log('🔧 Step 4: Updating imports...\n')
    
    const answer = await this.ask('Run automatic import updates? (y/n): ')
    
    if (answer.toLowerCase() !== 'y') {
      console.log('   ⏭️  Skipped. You can update imports manually.')
      console.log('   Or run: npm run migrate:update-imports')
      return
    }
    
    console.log('   🔄 Updating imports across codebase...')
    console.log('   This may take a moment...\n')
    
    // Find all TypeScript/TSX files
    try {
      const files = execSync('git ls-files "*.ts" "*.tsx"', {
        encoding: 'utf8',
        cwd: this.gitRoot
      }).split('\n').filter(f => f.trim())
      
      let updatedCount = 0
      
      files.forEach(file => {
        const fullPath = path.join(this.gitRoot, file)
        
        try {
          let content = fs.readFileSync(fullPath, 'utf8')
          const originalContent = content
          
          // Update common import patterns
          const patterns = [
            {
              from: new RegExp(`@/lib/domain/${this.featureName}`, 'g'),
              to: `@/features/${this.featureName}/domain`
            },
            {
              from: new RegExp(`@/lib/services/${this.featureName}`, 'g'),
              to: `@/features/${this.featureName}/data`
            },
            {
              from: new RegExp(`@/components/${this.featureName}`, 'g'),
              to: `@/features/${this.featureName}/ui`
            },
            {
              from: new RegExp(`@/lib/hooks/use${this.featureName.charAt(0).toUpperCase() + this.featureName.slice(1)}`, 'gi'),
              to: `@/features/${this.featureName}/hooks/use${this.featureName.charAt(0).toUpperCase() + this.featureName.slice(1)}`
            }
          ]
          
          patterns.forEach(pattern => {
            content = content.replace(pattern.from, pattern.to)
          })
          
          if (content !== originalContent) {
            fs.writeFileSync(fullPath, content, 'utf8')
            updatedCount++
          }
        } catch (e) {
          // Skip files we can't read/write
        }
      })
      
      console.log(`   ✅ Updated imports in ${updatedCount} files`)
    } catch (e: any) {
      console.log(`   ❌ Error updating imports: ${e.message}`)
    }
    
    console.log()
  }
  
  /**
   * Step 5: Run tests
   */
  private async runTests(): Promise<void> {
    console.log('🧪 Step 5: Running tests...\n')
    
    const answer = await this.ask('Run tests to verify migration? (y/n): ')
    
    if (answer.toLowerCase() !== 'y') {
      console.log('   ⏭️  Skipped. Remember to run tests manually!')
      return
    }
    
    console.log('   Running type check...')
    try {
      execSync('npx tsc --noEmit', {
        cwd: this.gitRoot,
        stdio: 'inherit'
      })
      console.log('   ✅ Type check passed\n')
    } catch (e) {
      console.log('   ❌ Type check failed')
      console.log('   Fix type errors before continuing\n')
      return
    }
    
    console.log('   Running tests...')
    try {
      execSync(`npm test -- features/${this.featureName}`, {
        cwd: this.gitRoot,
        stdio: 'inherit'
      })
      console.log('   ✅ Tests passed\n')
    } catch (e) {
      console.log('   ⚠️  Some tests failed')
      console.log('   Review and fix before committing\n')
    }
  }
  
  /**
   * Step 6: Show summary
   */
  private showSummary(): void {
    console.log('='.repeat(60))
    console.log('✅ MIGRATION COMPLETE')
    console.log('='.repeat(60))
    console.log()
    console.log('Next steps:')
    console.log('1. Review the changes: git status')
    console.log('2. Fix any remaining issues')
    console.log('3. Commit: git commit -m "feat(arch): migrate ' + this.featureName + ' to feature-first"')
    console.log()
    console.log('Old directories may still exist (Strangler Fig pattern).')
    console.log('This is OK! They\'ll be removed once you\'re confident.')
    console.log()
    console.log('Check usage: git grep "@/lib/services/' + this.featureName + '"')
    console.log('If empty, safe to delete old directories.')
    console.log()
  }
  
  /**
   * Helper: Ask user a question
   */
  private ask(question: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(question, (answer) => {
        resolve(answer)
      })
    })
  }
}

// CLI
const featureName = process.argv[2]

if (!featureName) {
  console.error('Usage: npm run migrate:feature <feature-name>')
  console.error('Example: npm run migrate:feature vehicles')
  process.exit(1)
}

const helper = new FeatureMigrationHelper(featureName)
helper.migrate().catch(console.error)
