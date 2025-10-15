#!/usr/bin/env tsx
/**
 * Batch Operations System
 * 
 * Enables multi-file atomic operations with preview and rollback.
 * Solves the "single-file bottleneck" - can update 52 files in one operation.
 */

import * as fs from 'fs'
import * as path from 'path'
import { glob } from 'glob'
import { recordOperation } from './operation-history'

// ============================================================================
// TYPES
// ============================================================================

interface BatchOperation {
  id: string
  type: 'replace' | 'replace_import' | 'rename_file'
  pattern: string | RegExp
  replacement: string
  files: string[]
  preview?: PreviewResult
}

interface FileChange {
  file: string
  before: string
  after: string
  action: 'create' | 'modify' | 'delete'
  diff: string
}

interface PreviewResult {
  changes: FileChange[]
  total_files: number
  total_changes: number
  estimated_time_ms: number
}

interface ExecutionResult {
  success: boolean
  files_changed: number
  operation_id: string
  duration_ms: number
  errors: string[]
}

// ============================================================================
// DIFF GENERATION
// ============================================================================

function generateSimpleDiff(before: string, after: string): string {
  const beforeLines = before.split('\n')
  const afterLines = after.split('\n')
  
  const maxLines = Math.max(beforeLines.length, afterLines.length)
  const diffLines: string[] = []
  
  for (let i = 0; i < maxLines; i++) {
    const beforeLine = beforeLines[i]
    const afterLine = afterLines[i]
    
    if (beforeLine !== afterLine) {
      if (beforeLine !== undefined) {
        diffLines.push(`- ${beforeLine}`)
      }
      if (afterLine !== undefined) {
        diffLines.push(`+ ${afterLine}`)
      }
    } else if (beforeLine !== undefined) {
      // Show 2 lines of context
      if (diffLines.length > 0 && diffLines.length < 5) {
        diffLines.push(`  ${beforeLine}`)
      }
    }
  }
  
  return diffLines.join('\n')
}

// ============================================================================
// PREVIEW
// ============================================================================

export function previewBatchOperation(operation: BatchOperation): PreviewResult {
  const changes: FileChange[] = []
  let totalChanges = 0
  
  for (const filePath of operation.files) {
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️  File not found: ${filePath}`)
      continue
    }
    
    try {
      const content = fs.readFileSync(filePath, 'utf-8')
      let newContent: string
      
      if (operation.type === 'replace') {
        const regex = typeof operation.pattern === 'string' 
          ? new RegExp(escapeRegExp(operation.pattern), 'g')
          : operation.pattern
        newContent = content.replace(regex, operation.replacement)
      } else if (operation.type === 'replace_import') {
        // Smart import replacement
        const patternStr = typeof operation.pattern === 'string' 
          ? operation.pattern 
          : operation.pattern.source
        newContent = content.replace(
          new RegExp(`from ['"]${escapeRegExp(patternStr)}['"]`, 'g'),
          `from "${operation.replacement}"`
        )
      } else {
        newContent = content
      }
      
      if (newContent !== content) {
        const diff = generateSimpleDiff(content, newContent)
        const changeCount = (newContent.match(/\n/g) || []).length - (content.match(/\n/g) || []).length
        
        changes.push({
          file: filePath,
          before: content,
          after: newContent,
          action: 'modify',
          diff
        })
        
        totalChanges += Math.abs(changeCount) + 1
      }
    } catch (error) {
      console.error(`❌ Error processing ${filePath}:`, error)
    }
  }
  
  return {
    changes,
    total_files: changes.length,
    total_changes: totalChanges,
    estimated_time_ms: changes.length * 10  // ~10ms per file
  }
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// ============================================================================
// EXECUTION
// ============================================================================

export function executeBatchOperation(
  operation: BatchOperation,
  preview: PreviewResult,
  description: string
): ExecutionResult {
  const startTime = Date.now()
  const errors: string[] = []
  let filesChanged = 0
  
  console.log(`\n⚡ Executing batch operation...\n`)
  console.log(`   Files to modify: ${preview.total_files}`)
  console.log(`   Estimated time: ${preview.estimated_time_ms}ms\n`)
  
  // Execute all changes
  for (const change of preview.changes) {
    try {
      fs.writeFileSync(change.file, change.after, 'utf-8')
      filesChanged++
      
      if (filesChanged % 10 === 0) {
        console.log(`   Progress: ${filesChanged}/${preview.total_files} files...`)
      }
    } catch (error) {
      const msg = `Failed to write ${change.file}: ${error}`
      errors.push(msg)
      console.error(`   ❌ ${msg}`)
      
      // ROLLBACK - revert all changes made so far
      console.log(`\n⚠️  Error encountered. Rolling back...`)
      for (let i = 0; i < filesChanged; i++) {
        const prevChange = preview.changes[i]
        try {
          fs.writeFileSync(prevChange.file, prevChange.before, 'utf-8')
        } catch (rollbackError) {
          console.error(`   ❌ Rollback failed for ${prevChange.file}`)
        }
      }
      
      return {
        success: false,
        files_changed: 0,
        operation_id: '',
        duration_ms: Date.now() - startTime,
        errors
      }
    }
  }
  
  const duration = Date.now() - startTime
  
  console.log(`\n✅ Operation complete!`)
  console.log(`   Files changed: ${filesChanged}`)
  console.log(`   Duration: ${duration}ms\n`)
  
  // Record in history
  const operationId = recordOperation(
    'batch_edit',
    description,
    preview.changes.map(c => ({
      file: c.file,
      before: c.before,
      after: c.after,
      action: c.action
    })),
    'success',
    undefined,
    duration
  )
  
  return {
    success: true,
    files_changed: filesChanged,
    operation_id: operationId,
    duration_ms: duration,
    errors: []
  }
}

// ============================================================================
// HIGH-LEVEL OPERATIONS
// ============================================================================

export function replaceInFiles(
  pattern: string | RegExp,
  replacement: string,
  fileGlob: string,
  preview: boolean = true
): void {
  console.log('\n🔍 Batch Replace Operation\n')
  console.log(`Pattern: ${pattern}`)
  console.log(`Replacement: ${replacement}`)
  console.log(`Files: ${fileGlob}\n`)
  
  // Find files
  const files = glob.sync(fileGlob, {
    ignore: ['**/node_modules/**', '**/.next/**', '**/dist/**', '**/build/**'],
    absolute: true
  })
  
  if (files.length === 0) {
    console.log('❌ No files found matching pattern\n')
    return
  }
  
  console.log(`📦 Found ${files.length} files\n`)
  
  // Create operation
  const operation: BatchOperation = {
    id: `batch_${Date.now()}`,
    type: 'replace',
    pattern,
    replacement,
    files
  }
  
  // Generate preview
  const previewResult = previewBatchOperation(operation)
  
  if (previewResult.total_files === 0) {
    console.log('ℹ️  No changes needed\n')
    return
  }
  
  // Show preview
  console.log('📋 Preview of changes:\n')
  previewResult.changes.slice(0, 5).forEach((change, i) => {
    console.log(`${i + 1}. ${change.file}`)
    const lines = change.diff.split('\n').slice(0, 10)
    lines.forEach(line => console.log(`   ${line}`))
    if (change.diff.split('\n').length > 10) {
      console.log(`   ... (${change.diff.split('\n').length - 10} more lines)`)
    }
    console.log()
  })
  
  if (previewResult.changes.length > 5) {
    console.log(`... and ${previewResult.changes.length - 5} more files\n`)
  }
  
  console.log(`📊 Summary:`)
  console.log(`   Files to modify: ${previewResult.total_files}`)
  console.log(`   Total changes: ${previewResult.total_changes}`)
  console.log(`   Estimated time: ${previewResult.estimated_time_ms}ms\n`)
  
  if (preview) {
    console.log('ℹ️  Preview mode - no changes applied')
    console.log('   Run with --execute to apply changes\n')
    return
  }
  
  // Execute
  const result = executeBatchOperation(
    operation,
    previewResult,
    `Batch replace: ${pattern} → ${replacement}`
  )
  
  if (result.success) {
    console.log(`✅ Success!`)
    console.log(`   Operation ID: ${result.operation_id}`)
    console.log(`   Rollback: npm run windsurf:history rollback ${result.operation_id}\n`)
  } else {
    console.log(`❌ Operation failed`)
    result.errors.forEach(err => console.log(`   - ${err}`))
    console.log()
  }
}

export function replaceImports(
  oldImport: string,
  newImport: string,
  fileGlob: string = '**/*.{ts,tsx,js,jsx}',
  preview: boolean = true
): void {
  console.log('\n🔄 Batch Import Replacement\n')
  console.log(`Old import: ${oldImport}`)
  console.log(`New import: ${newImport}`)
  console.log(`Files: ${fileGlob}\n`)
  
  // Find files
  const files = glob.sync(fileGlob, {
    ignore: ['**/node_modules/**', '**/.next/**', '**/dist/**', '**/build/**'],
    absolute: true
  })
  
  console.log(`📦 Found ${files.length} files to scan\n`)
  
  // Filter files that actually have the import
  const filesWithImport: string[] = []
  files.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf-8')
      if (content.includes(oldImport)) {
        filesWithImport.push(file)
      }
    } catch (error) {
      // Skip files we can't read
    }
  })
  
  if (filesWithImport.length === 0) {
    console.log(`ℹ️  No files import from "${oldImport}"\n`)
    return
  }
  
  console.log(`📦 Found ${filesWithImport.length} files with this import\n`)
  
  // Create operation
  const operation: BatchOperation = {
    id: `batch_${Date.now()}`,
    type: 'replace_import',
    pattern: oldImport,
    replacement: newImport,
    files: filesWithImport
  }
  
  // Generate preview
  const previewResult = previewBatchOperation(operation)
  
  // Show preview
  console.log('📋 Files that will be updated:\n')
  previewResult.changes.forEach((change, i) => {
    console.log(`${i + 1}. ${change.file}`)
  })
  console.log()
  
  if (preview) {
    console.log('ℹ️  Preview mode - no changes applied')
    console.log('   Run with --execute to apply changes\n')
    return
  }
  
  // Execute
  const result = executeBatchOperation(
    operation,
    previewResult,
    `Replace import: ${oldImport} → ${newImport}`
  )
  
  if (result.success) {
    console.log(`✅ Success!`)
    console.log(`   Operation ID: ${result.operation_id}`)
    console.log(`   Rollback: npm run windsurf:history rollback ${result.operation_id}\n`)
  } else {
    console.log(`❌ Operation failed`)
    result.errors.forEach(err => console.log(`   - ${err}`))
    console.log()
  }
}

// ============================================================================
// CLI
// ============================================================================

const command = process.argv[2]

switch (command) {
  case 'replace': {
    const pattern = process.argv[3]
    const replacement = process.argv[4]
    const files = process.argv[5] || '**/*.{ts,tsx,js,jsx}'
    const execute = process.argv.includes('--execute')
    
    if (!pattern || !replacement) {
      console.error('Usage: windsurf:batch replace <pattern> <replacement> [files] [--execute]')
      process.exit(1)
    }
    
    replaceInFiles(pattern, replacement, files, !execute)
    break
  }
  
  case 'replace-import': {
    const oldImport = process.argv[3]
    const newImport = process.argv[4]
    const files = process.argv[5] || '**/*.{ts,tsx,js,jsx}'
    const execute = process.argv.includes('--execute')
    
    if (!oldImport || !newImport) {
      console.error('Usage: windsurf:batch replace-import <old-import> <new-import> [files] [--execute]')
      process.exit(1)
    }
    
    replaceImports(oldImport, newImport, files, !execute)
    break
  }
  
  default:
    console.log(`
⚡ Batch Operations Tool

Usage:
  npm run windsurf:batch <command> [args]

Commands:
  replace <pattern> <replacement> [files] [--execute]
    Replace text across multiple files
    
  replace-import <old-import> <new-import> [files] [--execute]
    Replace import statements across multiple files

Flags:
  --execute    Actually apply changes (default is preview mode)

Examples:
  # Preview changes
  npm run windsurf:batch replace "old-text" "new-text"
  
  # Execute changes
  npm run windsurf:batch replace "old-text" "new-text" --execute
  
  # Replace imports
  npm run windsurf:batch replace-import "@/lib/auth" "@/features/auth" --execute
  
  # Replace in specific files
  npm run windsurf:batch replace "pattern" "replacement" "features/**/*.ts" --execute

Note: All operations are recorded and can be rolled back:
  npm run windsurf:history rollback <operation-id>
`)
    break
}
