#!/usr/bin/env tsx
/**
 * Codebase Graph Query Tool
 * 
 * Helper tool for Cascade to quickly query the codebase graph.
 * Provides simple commands to answer common questions.
 */

import * as fs from 'fs'
import * as path from 'path'

const GRAPH_PATH = '.windsurf/codebase-graph.json'

interface CodebaseGraph {
  files: Record<string, {
    exports: Array<{ name: string; type: string; line?: number }>
    imports: Array<{ from: string; names: string[] }>
    imported_by: string[]
    dependencies: string[]
  }>
  exports_index: Record<string, string>
  stats: any
}

function loadGraph(): CodebaseGraph {
  if (!fs.existsSync(GRAPH_PATH)) {
    console.error('❌ Graph not found. Run: npm run windsurf:graph')
    process.exit(1)
  }
  return JSON.parse(fs.readFileSync(GRAPH_PATH, 'utf-8'))
}

function getImporters(file: string): string[] {
  const graph = loadGraph()
  
  // Normalize path
  const normalized = file.replace(/^@\//, '').replace(/\.(ts|tsx|js|jsx)$/, '')
  
  // Try exact match
  if (graph.files[normalized]) {
    return graph.files[normalized].imported_by
  }
  
  // Try with extensions
  const extensions = ['.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx']
  for (const ext of extensions) {
    const candidate = normalized + ext
    if (graph.files[candidate]) {
      return graph.files[candidate].imported_by
    }
  }
  
  return []
}

function findExport(name: string): string | null {
  const graph = loadGraph()
  return graph.exports_index[name] || null
}

function getExports(file: string): string[] {
  const graph = loadGraph()
  const normalized = file.replace(/^@\//, '').replace(/\.(ts|tsx|js|jsx)$/, '')
  
  if (graph.files[normalized]) {
    return graph.files[normalized].exports.map(e => e.name)
  }
  
  return []
}

function getDependencies(file: string): string[] {
  const graph = loadGraph()
  const normalized = file.replace(/^@\//, '').replace(/\.(ts|tsx|js|jsx)$/, '')
  
  if (graph.files[normalized]) {
    return graph.files[normalized].dependencies
  }
  
  return []
}

function getStats() {
  const graph = loadGraph()
  return graph.stats
}

// ============================================================================
// CLI
// ============================================================================

const command = process.argv[2]
const arg = process.argv[3]

switch (command) {
  case 'importers':
    if (!arg) {
      console.error('Usage: windsurf:query importers <file>')
      process.exit(1)
    }
    const importers = getImporters(arg)
    console.log(`\n📦 Files that import from "${arg}":\n`)
    if (importers.length === 0) {
      console.log('   None found')
    } else {
      console.log(`   Found ${importers.length} importers:\n`)
      importers.forEach(imp => console.log(`   - ${imp}`))
    }
    console.log()
    break

  case 'find':
    if (!arg) {
      console.error('Usage: windsurf:query find <export-name>')
      process.exit(1)
    }
    const location = findExport(arg)
    console.log(`\n🔍 Looking for export "${arg}":\n`)
    if (location) {
      console.log(`   Found in: ${location}`)
    } else {
      console.log(`   Not found`)
    }
    console.log()
    break

  case 'exports':
    if (!arg) {
      console.error('Usage: windsurf:query exports <file>')
      process.exit(1)
    }
    const exports = getExports(arg)
    console.log(`\n📤 Exports from "${arg}":\n`)
    if (exports.length === 0) {
      console.log('   None found')
    } else {
      exports.forEach(exp => console.log(`   - ${exp}`))
    }
    console.log()
    break

  case 'deps':
    if (!arg) {
      console.error('Usage: windsurf:query deps <file>')
      process.exit(1)
    }
    const deps = getDependencies(arg)
    console.log(`\n🔗 Dependencies of "${arg}":\n`)
    if (deps.length === 0) {
      console.log('   None found')
    } else {
      deps.forEach(dep => console.log(`   - ${dep}`))
    }
    console.log()
    break

  case 'stats':
    const stats = getStats()
    console.log('\n📊 Codebase Statistics:\n')
    console.log(`   Total files: ${stats.total_files}`)
    console.log(`   Total exports: ${stats.total_exports}`)
    console.log(`   Total imports: ${stats.total_imports}`)
    console.log(`   Largest file: ${stats.largest_file.path} (${stats.largest_file.lines} lines)`)
    console.log(`   Most imported: ${stats.most_imported.path} (${stats.most_imported.count} importers)`)
    console.log()
    break

  default:
    console.log(`
🔍 Windsurf Graph Query Tool

Usage:
  npm run windsurf:query <command> [args]

Commands:
  importers <file>    - List all files that import from this file
  find <export>       - Find where an export is defined
  exports <file>      - List all exports from a file
  deps <file>         - List all dependencies of a file
  stats               - Show codebase statistics

Examples:
  npm run windsurf:query importers features/auth/index.ts
  npm run windsurf:query find authOptions
  npm run windsurf:query exports features/auth/domain/config.ts
  npm run windsurf:query stats
`)
    break
}
