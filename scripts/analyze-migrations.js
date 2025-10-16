#!/usr/bin/env node

/**
 * Migration Analysis Tool
 * 
 * Analyzes all SQL files to:
 * 1. Identify schema changes
 * 2. Detect dependencies
 * 3. Suggest chronological order
 * 4. Find conflicts
 */

const fs = require('fs')
const path = require('path')

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
}

function log(color, ...args) {
  console.log(color, ...args, colors.reset)
}

function analyzeMigrations() {
  const rootDir = path.join(__dirname, '..')
  const sqlFiles = []
  
  // Find all SQL files
  function findSQLFiles(dir) {
    const items = fs.readdirSync(dir)
    
    for (const item of items) {
      const fullPath = path.join(dir, item)
      const stat = fs.statSync(fullPath)
      
      if (stat.isDirectory()) {
        // Skip node_modules, .git, etc.
        if (!item.startsWith('.') && item !== 'node_modules' && item !== 'archive') {
          findSQLFiles(fullPath)
        }
      } else if (item.endsWith('.sql')) {
        sqlFiles.push(fullPath)
      }
    }
  }
  
  log(colors.cyan, '\n🔍 Scanning for SQL files...')
  findSQLFiles(rootDir)
  log(colors.green, `✅ Found ${sqlFiles.length} SQL files\n`)
  
  // Analyze each file
  const migrations = sqlFiles.map(filePath => {
    const content = fs.readFileSync(filePath, 'utf-8')
    const fileName = path.basename(filePath)
    const stat = fs.statSync(filePath)
    
    return {
      fileName,
      filePath,
      size: stat.size,
      modified: stat.mtime,
      
      // Detect schema changes
      creates: (content.match(/CREATE TABLE/gi) || []).length,
      alters: (content.match(/ALTER TABLE/gi) || []).length,
      drops: (content.match(/DROP TABLE/gi) || []).length,
      inserts: (content.match(/INSERT INTO/gi) || []).length,
      
      // Detect table names
      tables: extractTableNames(content),
      
      // Detect features
      features: detectFeatures(fileName, content),
      
      // Full content for dependency analysis
      content
    }
  })
  
  // Sort by modification time (oldest first)
  migrations.sort((a, b) => a.modified - b.modified)
  
  // Print summary
  log(colors.bright + colors.yellow, '📊 MIGRATION SUMMARY')
  log(colors.yellow, '='.repeat(80))
  
  console.log('\nBy Type:')
  console.log(`  Schema changes: ${migrations.filter(m => m.creates > 0 || m.alters > 0).length}`)
  console.log(`  Data seeds: ${migrations.filter(m => m.inserts > 0 && m.creates === 0).length}`)
  console.log(`  Cleanup: ${migrations.filter(m => m.drops > 0).length}`)
  
  console.log('\nBy Feature:')
  const featureCounts = {}
  migrations.forEach(m => {
    m.features.forEach(f => {
      featureCounts[f] = (featureCounts[f] || 0) + 1
    })
  })
  Object.entries(featureCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([feature, count]) => {
      console.log(`  ${feature}: ${count} files`)
    })
  
  // Print chronological list
  log(colors.bright + colors.blue, '\n\n📅 CHRONOLOGICAL ORDER (Oldest → Newest)')
  log(colors.blue, '='.repeat(80))
  
  migrations.forEach((m, index) => {
    const number = String(index + 1).padStart(3, '0')
    const date = m.modified.toISOString().split('T')[0]
    const features = m.features.length > 0 ? ` [${m.features.join(', ')}]` : ''
    const changes = []
    
    if (m.creates > 0) changes.push(`+${m.creates} tables`)
    if (m.alters > 0) changes.push(`~${m.alters} alters`)
    if (m.drops > 0) changes.push(`-${m.drops} drops`)
    if (m.inserts > 0) changes.push(`${m.inserts} inserts`)
    
    const changeStr = changes.length > 0 ? ` (${changes.join(', ')})` : ''
    
    console.log(`${number}. ${date} - ${m.fileName}${changeStr}${features}`)
  })
  
  // Detect dependencies
  log(colors.bright + colors.yellow, '\n\n🔗 DEPENDENCIES')
  log(colors.yellow, '='.repeat(80))
  
  const dependencies = []
  migrations.forEach((m, i) => {
    m.tables.forEach(table => {
      // Check if any earlier migration creates this table
      const creator = migrations.slice(0, i).find(prev => 
        prev.content.match(new RegExp(`CREATE TABLE.*${table}`, 'i'))
      )
      
      if (creator && creator !== m) {
        dependencies.push({
          file: m.fileName,
          dependsOn: creator.fileName,
          table
        })
      }
    })
  })
  
  if (dependencies.length > 0) {
    dependencies.forEach(d => {
      console.log(`  ${d.file} depends on ${d.dependsOn} (table: ${d.table})`)
    })
  } else {
    console.log('  No dependencies detected')
  }
  
  // Detect conflicts
  log(colors.bright + colors.red, '\n\n⚠️  POTENTIAL CONFLICTS')
  log(colors.red, '='.repeat(80))
  
  const conflicts = []
  const tableCreations = {}
  
  migrations.forEach(m => {
    m.tables.forEach(table => {
      if (m.content.match(new RegExp(`CREATE TABLE.*${table}`, 'i'))) {
        if (tableCreations[table]) {
          conflicts.push({
            table,
            files: [tableCreations[table], m.fileName]
          })
        }
        tableCreations[table] = m.fileName
      }
    })
  })
  
  if (conflicts.length > 0) {
    conflicts.forEach(c => {
      console.log(`  ⚠️  Table "${c.table}" created in multiple files:`)
      c.files.forEach(f => console.log(`     - ${f}`))
    })
  } else {
    console.log('  No conflicts detected')
  }
  
  // Generate recommended organization
  log(colors.bright + colors.green, '\n\n✅ RECOMMENDED ORGANIZATION')
  log(colors.green, '='.repeat(80))
  
  console.log('\nSuggested migration order:')
  migrations.forEach((m, index) => {
    const number = String(index + 1).padStart(3, '0')
    const category = categorize(m)
    const newName = `${number}_${category}_${sanitizeFileName(m.fileName)}`
    console.log(`  ${newName}`)
  })
  
  // Save analysis to file
  const analysis = {
    totalFiles: migrations.length,
    byType: {
      schema: migrations.filter(m => m.creates > 0 || m.alters > 0).length,
      seeds: migrations.filter(m => m.inserts > 0 && m.creates === 0).length,
      cleanup: migrations.filter(m => m.drops > 0).length
    },
    features: featureCounts,
    dependencies,
    conflicts,
    chronologicalOrder: migrations.map((m, i) => ({
      number: i + 1,
      fileName: m.fileName,
      date: m.modified.toISOString(),
      changes: {
        creates: m.creates,
        alters: m.alters,
        drops: m.drops,
        inserts: m.inserts
      },
      features: m.features
    }))
  }
  
  const analysisPath = path.join(rootDir, 'docs', 'architecture', 'MIGRATION_ANALYSIS.json')
  fs.mkdirSync(path.dirname(analysisPath), { recursive: true })
  fs.writeFileSync(analysisPath, JSON.stringify(analysis, null, 2))
  
  log(colors.green, `\n✅ Analysis saved to: ${analysisPath}`)
  log(colors.cyan, '\nNext step: Run "node scripts/organize-migrations.js" to reorganize\n')
}

function extractTableNames(content) {
  const tables = new Set()
  
  // Match table names in various SQL patterns
  const patterns = [
    /CREATE TABLE\s+(?:IF NOT EXISTS\s+)?["']?(\w+)["']?/gi,
    /ALTER TABLE\s+["']?(\w+)["']?/gi,
    /DROP TABLE\s+(?:IF EXISTS\s+)?["']?(\w+)["']?/gi,
    /INSERT INTO\s+["']?(\w+)["']?/gi,
    /UPDATE\s+["']?(\w+)["']?/gi,
    /FROM\s+["']?(\w+)["']?/gi
  ]
  
  patterns.forEach(pattern => {
    const matches = content.matchAll(pattern)
    for (const match of matches) {
      if (match[1]) tables.add(match[1].toLowerCase())
    }
  })
  
  return Array.from(tables)
}

function detectFeatures(fileName, content) {
  const features = []
  
  const featurePatterns = {
    'ai-chat': /conversation|thread|message|chat/i,
    'vision': /vision|ocr|image|photo/i,
    'fuel': /fuel|fillup|gasoline/i,
    'maintenance': /maintenance|service|repair/i,
    'vehicle': /vehicle|car|truck/i,
    'garage': /garage|fleet/i,
    'user': /user|auth|account/i,
    'location': /location|gps|geocod/i,
    'analytics': /metric|analytic|dashboard/i,
    'notification': /notification|reminder|alert/i,
    'emissions': /emission|test/i
  }
  
  Object.entries(featurePatterns).forEach(([feature, pattern]) => {
    if (fileName.match(pattern) || content.match(pattern)) {
      features.push(feature)
    }
  })
  
  return features
}

function categorize(migration) {
  if (migration.features.includes('ai-chat')) return 'ai_chat'
  if (migration.features.includes('vision')) return 'vision'
  if (migration.features.includes('fuel')) return 'fuel'
  if (migration.features.includes('maintenance')) return 'maintenance'
  if (migration.features.includes('vehicle')) return 'vehicle'
  if (migration.features.includes('garage')) return 'garage'
  if (migration.features.includes('location')) return 'location'
  if (migration.features.includes('analytics')) return 'analytics'
  if (migration.features.includes('notification')) return 'notification'
  if (migration.creates > 0) return 'schema'
  if (migration.inserts > 0) return 'seed'
  if (migration.alters > 0) return 'alter'
  return 'misc'
}

function sanitizeFileName(fileName) {
  return fileName
    .replace(/\.sql$/i, '')
    .replace(/^(ADD|FIX|CREATE|UPDATE|DELETE|ENABLE|DISABLE|CORRECT|FINAL|WORKING|COMPLETE|SIMPLE|ENHANCED|IMPROVED|FIXED|CORRECTED)-/gi, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .substring(0, 50)
}

// Run analysis
analyzeMigrations()
