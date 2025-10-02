#!/usr/bin/env node
// Terminology Codemod - Safe automated refactoring
// Replaces deprecated terminology with canonical domain language

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

// Terminology mappings
const REPLACEMENTS = [
  // Vehicle identification
  { from: /vehicle\.label/g, to: 'vehicle.display_name', description: 'Use display_name for vehicle identification' },
  { from: /vehicle\.nickname/g, to: 'vehicle.display_name', description: 'Use display_name instead of nickname' },
  { from: /\blabel:\s*string/g, to: 'display_name: string', description: 'Update type definitions' },
  
  // Navigation and routes
  { from: /href=["']\/fleet["']/g, to: 'href="/vehicles"', description: 'Update navigation links' },
  { from: /router\.push\(["']\/fleet["']\)/g, to: 'router.push("/vehicles")', description: 'Update programmatic navigation' },
  
  // API responses (be careful with these)
  { from: /vehicles:\s*\[\]/g, to: 'data: []', description: 'Update to new API envelope (verify manually)' },
  { from: /garages:\s*\[\]/g, to: 'data: []', description: 'Update to new API envelope (verify manually)' },
  
  // Comments and documentation
  { from: /fleet\s+management/gi, to: 'vehicle management', description: 'Update documentation' },
  { from: /fleet\s+page/gi, to: 'vehicles page', description: 'Update documentation' }
]

// File patterns to process
const INCLUDE_PATTERNS = [
  '**/*.ts',
  '**/*.tsx',
  '**/*.js',
  '**/*.jsx'
]

// Directories to exclude
const EXCLUDE_PATTERNS = [
  'node_modules/**',
  '.next/**',
  'dist/**',
  'build/**',
  '**/*.d.ts'
]

function findFiles(dir, patterns, excludePatterns) {
  const files = []
  
  function walk(currentDir) {
    const items = fs.readdirSync(currentDir)
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item)
      const relativePath = path.relative(dir, fullPath)
      
      // Skip excluded patterns
      if (excludePatterns.some(pattern => 
        relativePath.includes(pattern.replace('/**', '')) || 
        relativePath.includes(pattern.replace('**/', ''))
      )) {
        continue
      }
      
      let stat
      try {
        stat = fs.statSync(fullPath)
      } catch (error) {
        // Skip files that don't exist (broken symlinks, etc.)
        continue
      }
      
      if (stat.isDirectory()) {
        walk(fullPath)
      } else if (stat.isFile()) {
        // Check if file matches include patterns
        const ext = path.extname(item)
        if (['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
          files.push(fullPath)
        }
      }
    }
  }
  
  walk(dir)
  return files
}

function processFile(filePath, dryRun = true) {
  const content = fs.readFileSync(filePath, 'utf8')
  let newContent = content
  const changes = []
  
  for (const replacement of REPLACEMENTS) {
    const matches = content.match(replacement.from)
    if (matches) {
      newContent = newContent.replace(replacement.from, replacement.to)
      changes.push({
        description: replacement.description,
        count: matches.length
      })
    }
  }
  
  if (changes.length > 0) {
    console.log(`\n📝 ${path.relative(process.cwd(), filePath)}:`)
    changes.forEach(change => {
      console.log(`  • ${change.description} (${change.count} occurrence${change.count > 1 ? 's' : ''})`)
    })
    
    if (!dryRun) {
      fs.writeFileSync(filePath, newContent, 'utf8')
      console.log(`  ✅ Updated`)
    } else {
      console.log(`  🔍 Would update (dry run)`)
    }
  }
  
  return changes.length > 0
}

function main() {
  const args = process.argv.slice(2)
  const dryRun = !args.includes('--apply')
  const targetDir = args.find(arg => !arg.startsWith('--')) || process.cwd()
  
  console.log('🔧 MotoMind Terminology Codemod')
  console.log(`📁 Target directory: ${targetDir}`)
  console.log(`🎯 Mode: ${dryRun ? 'DRY RUN' : 'APPLY CHANGES'}`)
  
  if (dryRun) {
    console.log('\n💡 This is a dry run. Use --apply to make actual changes.')
  }
  
  console.log('\n🔍 Finding files to process...')
  const files = findFiles(targetDir, INCLUDE_PATTERNS, EXCLUDE_PATTERNS)
  console.log(`📊 Found ${files.length} files to check`)
  
  let processedFiles = 0
  let totalChanges = 0
  
  for (const file of files) {
    const hasChanges = processFile(file, dryRun)
    if (hasChanges) {
      processedFiles++
      totalChanges++
    }
  }
  
  console.log(`\n📊 Summary:`)
  console.log(`  • Files checked: ${files.length}`)
  console.log(`  • Files with changes: ${processedFiles}`)
  console.log(`  • Total replacements: ${totalChanges}`)
  
  if (dryRun && processedFiles > 0) {
    console.log(`\n🚀 To apply these changes, run:`)
    console.log(`  node scripts/terminology-codemod.js --apply`)
  } else if (!dryRun && processedFiles > 0) {
    console.log(`\n✅ Changes applied successfully!`)
    console.log(`\n⚠️  Important: Please review the changes and test thoroughly:`)
    console.log(`  • Check that API envelope changes are correct`)
    console.log(`  • Verify navigation still works`)
    console.log(`  • Run TypeScript compiler to catch any issues`)
    console.log(`  • Test critical user flows`)
  } else {
    console.log(`\n✨ No changes needed - terminology is already clean!`)
  }
}

// Safety checks
if (require.main === module) {
  // Verify we're in the right directory
  if (!fs.existsSync('package.json')) {
    console.error('❌ Error: package.json not found. Run this from the project root.')
    process.exit(1)
  }
  
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
  if (packageJson.name !== 'motomind-ai') {
    console.error('❌ Error: This script is designed for the MotoMind project.')
    process.exit(1)
  }
  
  main()
}
