#!/usr/bin/env tsx
/**
 * Codebase Graph Generator
 * 
 * Analyzes the entire codebase and creates a knowledge graph that Cascade can read.
 * This solves the "codebase blindness" problem - Cascade can now see relationships
 * between all files instantly.
 */

import * as ts from 'typescript'
import * as fs from 'fs'
import * as path from 'path'
import { globSync } from 'glob'

// ============================================================================
// TYPES
// ============================================================================

interface FileNode {
  path: string
  exports: ExportInfo[]
  imports: ImportInfo[]
  imported_by: string[]
  dependencies: string[]
  complexity?: number
  last_modified?: string
  lines?: number
}

interface ExportInfo {
  name: string
  type: 'function' | 'class' | 'interface' | 'type' | 'const' | 'default' | 'unknown'
  line?: number
  isDefault?: boolean
}

interface ImportInfo {
  from: string
  names: string[]
  isDefault?: boolean
  line?: number
}

interface CodebaseGraph {
  version: string
  generated: string
  project: string
  files: Record<string, FileNode>
  exports_index: Record<string, string>  // export name -> file path
  stats: {
    total_files: number
    total_exports: number
    total_imports: number
    largest_file: { path: string; lines: number }
    most_imported: { path: string; count: number }
  }
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  rootDir: process.cwd(),
  outputPath: '.windsurf/codebase-graph.json',
  include: [
    'app/**/*.{ts,tsx,js,jsx}',
    'components/**/*.{ts,tsx,js,jsx}',
    'features/**/*.{ts,tsx,js,jsx}',
    'lib/**/*.{ts,tsx,js,jsx}',
    'pages/**/*.{ts,tsx,js,jsx}',
    'scripts/**/*.{ts,tsx,js,jsx}',
  ],
  exclude: [
    '**/*.test.{ts,tsx,js,jsx}',
    '**/*.spec.{ts,tsx,js,jsx}',
    '**/node_modules/**',
    '**/.next/**',
    '**/dist/**',
    '**/build/**',
  ]
}

// ============================================================================
// FILE ANALYSIS
// ============================================================================

function analyzeFile(filePath: string): FileNode | null {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    const sourceFile = ts.createSourceFile(
      filePath,
      content,
      ts.ScriptTarget.Latest,
      true
    )

    const exports: ExportInfo[] = []
    const imports: ImportInfo[] = []

    // Parse the AST
    const visit = (node: ts.Node): void => {
      // Extract exports
      if (ts.isExportDeclaration(node)) {
        if (node.exportClause && ts.isNamedExports(node.exportClause)) {
          node.exportClause.elements.forEach(element => {
            exports.push({
              name: element.name.text,
              type: 'unknown',
              line: sourceFile.getLineAndCharacterOfPosition(element.getStart()).line + 1
            })
          })
        }
      }

      // Function exports
      if (ts.isFunctionDeclaration(node) && node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)) {
        if (node.name) {
          exports.push({
            name: node.name.text,
            type: 'function',
            line: sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1
          })
        }
      }

      // Class exports
      if (ts.isClassDeclaration(node) && node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)) {
        if (node.name) {
          exports.push({
            name: node.name.text,
            type: 'class',
            line: sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1
          })
        }
      }

      // Interface exports
      if (ts.isInterfaceDeclaration(node) && node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)) {
        exports.push({
          name: node.name.text,
          type: 'interface',
          line: sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1
        })
      }

      // Type exports
      if (ts.isTypeAliasDeclaration(node) && node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)) {
        exports.push({
          name: node.name.text,
          type: 'type',
          line: sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1
        })
      }

      // Variable exports (const, let, var)
      if (ts.isVariableStatement(node) && node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)) {
        node.declarationList.declarations.forEach(decl => {
          if (ts.isIdentifier(decl.name)) {
            exports.push({
              name: decl.name.text,
              type: 'const',
              line: sourceFile.getLineAndCharacterOfPosition(decl.getStart()).line + 1
            })
          }
        })
      }

      // Extract imports
      if (ts.isImportDeclaration(node)) {
        const moduleSpecifier = node.moduleSpecifier
        if (ts.isStringLiteral(moduleSpecifier)) {
          const from = moduleSpecifier.text
          const names: string[] = []

          if (node.importClause) {
            // Default import
            if (node.importClause.name) {
              names.push(node.importClause.name.text)
            }

            // Named imports
            if (node.importClause.namedBindings) {
              if (ts.isNamedImports(node.importClause.namedBindings)) {
                node.importClause.namedBindings.elements.forEach(element => {
                  names.push(element.name.text)
                })
              }
            }
          }

          imports.push({
            from,
            names,
            line: sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1
          })
        }
      }

      ts.forEachChild(node, visit)
    }

    visit(sourceFile)

    const lines = content.split('\n').length
    const stats = fs.statSync(filePath)

    return {
      path: path.relative(CONFIG.rootDir, filePath),
      exports,
      imports,
      imported_by: [],
      dependencies: imports.map(i => i.from),
      lines,
      last_modified: stats.mtime.toISOString()
    }
  } catch (error) {
    console.warn(`⚠️  Failed to analyze ${filePath}:`, error)
    return null
  }
}

// ============================================================================
// GRAPH BUILDING
// ============================================================================

function buildGraph(): CodebaseGraph {
  console.log('🔍 Scanning codebase...\n')

  // Find all files
  const allFiles: string[] = []
  CONFIG.include.forEach(pattern => {
    const files = globSync(pattern, {
      cwd: CONFIG.rootDir,
      ignore: CONFIG.exclude,
      absolute: true
    })
    allFiles.push(...files)
  })

  console.log(`📁 Found ${allFiles.length} files to analyze\n`)

  // Analyze each file
  const files: Record<string, FileNode> = {}
  let analyzed = 0

  for (const filePath of allFiles) {
    const node = analyzeFile(filePath)
    if (node) {
      files[node.path] = node
      analyzed++
      if (analyzed % 50 === 0) {
        console.log(`   Analyzed ${analyzed}/${allFiles.length} files...`)
      }
    }
  }

  console.log(`\n✅ Analyzed ${analyzed} files\n`)

  // Build exports index and imported_by relationships
  console.log('🔗 Building relationships...\n')

  const exports_index: Record<string, string> = {}

  // First pass: build exports index
  Object.entries(files).forEach(([filePath, node]) => {
    node.exports.forEach(exp => {
      if (!exp.isDefault) {
        exports_index[exp.name] = filePath
      }
    })
  })

  // Second pass: build imported_by relationships
  Object.entries(files).forEach(([filePath, node]) => {
    node.imports.forEach(imp => {
      // Resolve import path
      let resolvedPath: string | null = null

      // Check if it's a relative import
      if (imp.from.startsWith('.')) {
        const dir = path.dirname(filePath)
        const resolved = path.join(dir, imp.from)
        
        // Try different extensions
        const extensions = ['', '.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx']
        for (const ext of extensions) {
          const candidate = resolved + ext
          if (files[candidate]) {
            resolvedPath = candidate
            break
          }
        }
      }
      // Check if it's a path alias import
      else if (imp.from.startsWith('@/')) {
        const withoutAlias = imp.from.replace('@/', '')
        const extensions = ['', '.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx']
        for (const ext of extensions) {
          const candidate = withoutAlias + ext
          if (files[candidate]) {
            resolvedPath = candidate
            break
          }
        }
      }

      // Add to imported_by
      if (resolvedPath && files[resolvedPath]) {
        if (!files[resolvedPath].imported_by.includes(filePath)) {
          files[resolvedPath].imported_by.push(filePath)
        }
      }
    })
  })

  // Calculate stats
  console.log('📊 Calculating statistics...\n')

  let totalExports = 0
  let totalImports = 0
  let largestFile = { path: '', lines: 0 }
  let mostImported = { path: '', count: 0 }

  Object.entries(files).forEach(([filePath, node]) => {
    totalExports += node.exports.length
    totalImports += node.imports.length

    if (node.lines && node.lines > largestFile.lines) {
      largestFile = { path: filePath, lines: node.lines }
    }

    if (node.imported_by.length > mostImported.count) {
      mostImported = { path: filePath, count: node.imported_by.length }
    }
  })

  return {
    version: '1.0',
    generated: new Date().toISOString(),
    project: 'motomind-ai',
    files,
    exports_index,
    stats: {
      total_files: Object.keys(files).length,
      total_exports: totalExports,
      total_imports: totalImports,
      largest_file: largestFile,
      most_imported: mostImported
    }
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('🚀 Windsurf Codebase Graph Generator\n')
  console.log('═'.repeat(60))
  console.log()

  const startTime = Date.now()

  try {
    // Build the graph
    const graph = buildGraph()

    // Ensure output directory exists
    const outputDir = path.dirname(CONFIG.outputPath)
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    // Write to file
    fs.writeFileSync(
      CONFIG.outputPath,
      JSON.stringify(graph, null, 2),
      'utf-8'
    )

    const duration = ((Date.now() - startTime) / 1000).toFixed(2)

    console.log('═'.repeat(60))
    console.log('\n✨ Graph generated successfully!\n')
    console.log(`📍 Output: ${CONFIG.outputPath}`)
    console.log(`⏱️  Duration: ${duration}s\n`)
    console.log('📊 Statistics:')
    console.log(`   Files analyzed: ${graph.stats.total_files}`)
    console.log(`   Total exports: ${graph.stats.total_exports}`)
    console.log(`   Total imports: ${graph.stats.total_imports}`)
    console.log(`   Largest file: ${graph.stats.largest_file.path} (${graph.stats.largest_file.lines} lines)`)
    console.log(`   Most imported: ${graph.stats.most_imported.path} (${graph.stats.most_imported.count} importers)\n`)
    console.log('🎯 Cascade can now:')
    console.log('   ✅ See all importers of any module instantly')
    console.log('   ✅ Find where exports are defined')
    console.log('   ✅ Analyze impact of changes before making them')
    console.log('   ✅ Detect architectural violations\n')

  } catch (error) {
    console.error('❌ Error generating graph:', error)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main()
}

export { buildGraph, analyzeFile }
