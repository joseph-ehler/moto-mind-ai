#!/usr/bin/env tsx
/**
 * Operation History System
 * 
 * Tracks all operations performed by Cascade for rollback and audit purposes.
 * Every batch operation is recorded with full before/after state.
 */

import * as fs from 'fs'
import * as path from 'path'
import { execSync } from 'child_process'

const HISTORY_PATH = '.windsurf/operation-history.json'

// ============================================================================
// TYPES
// ============================================================================

interface FileChange {
  file: string
  before: string
  after: string
  action: 'create' | 'modify' | 'delete'
}

interface Operation {
  id: string
  timestamp: string
  type: 'batch_edit' | 'single_edit' | 'move' | 'delete'
  description: string
  files: FileChange[]
  git_sha?: string  // Git commit before operation
  result: 'success' | 'failure' | 'rolled_back'
  error?: string
  duration_ms?: number
}

interface OperationHistory {
  version: string
  operations: Operation[]
}

// ============================================================================
// HISTORY MANAGEMENT
// ============================================================================

function loadHistory(): OperationHistory {
  if (!fs.existsSync(HISTORY_PATH)) {
    return {
      version: '1.0',
      operations: []
    }
  }
  
  try {
    return JSON.parse(fs.readFileSync(HISTORY_PATH, 'utf-8'))
  } catch (error) {
    console.warn('⚠️  Failed to load history, starting fresh')
    return {
      version: '1.0',
      operations: []
    }
  }
}

function saveHistory(history: OperationHistory): void {
  const dir = path.dirname(HISTORY_PATH)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  
  fs.writeFileSync(HISTORY_PATH, JSON.stringify(history, null, 2), 'utf-8')
}

function generateOperationId(): string {
  const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '')
  const random = Math.random().toString(36).substring(2, 6)
  return `op_${timestamp}_${random}`
}

function getCurrentGitSha(): string | undefined {
  try {
    return execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim()
  } catch {
    return undefined
  }
}

// ============================================================================
// RECORD OPERATION
// ============================================================================

export function recordOperation(
  type: Operation['type'],
  description: string,
  files: FileChange[],
  result: 'success' | 'failure',
  error?: string,
  duration_ms?: number
): string {
  const history = loadHistory()
  
  const operation: Operation = {
    id: generateOperationId(),
    timestamp: new Date().toISOString(),
    type,
    description,
    files,
    git_sha: getCurrentGitSha(),
    result,
    error,
    duration_ms
  }
  
  history.operations.unshift(operation)  // Add to front
  
  // Keep only last 100 operations
  if (history.operations.length > 100) {
    history.operations = history.operations.slice(0, 100)
  }
  
  saveHistory(history)
  
  return operation.id
}

// ============================================================================
// QUERY OPERATIONS
// ============================================================================

export function listOperations(limit: number = 20): Operation[] {
  const history = loadHistory()
  return history.operations.slice(0, limit)
}

export function getOperation(id: string): Operation | null {
  const history = loadHistory()
  return history.operations.find(op => op.id === id) || null
}

export function getLastOperation(): Operation | null {
  const history = loadHistory()
  return history.operations[0] || null
}

// ============================================================================
// ROLLBACK
// ============================================================================

export function rollbackOperation(id: string): boolean {
  const operation = getOperation(id)
  
  if (!operation) {
    console.error(`❌ Operation ${id} not found`)
    return false
  }
  
  if (operation.result === 'rolled_back') {
    console.error(`❌ Operation ${id} already rolled back`)
    return false
  }
  
  console.log(`\n🔄 Rolling back operation: ${operation.description}\n`)
  console.log(`   Files affected: ${operation.files.length}`)
  console.log(`   Original time: ${new Date(operation.timestamp).toLocaleString()}\n`)
  
  let rolledBack = 0
  const errors: string[] = []
  
  for (const change of operation.files) {
    try {
      if (change.action === 'create') {
        // Delete created file
        if (fs.existsSync(change.file)) {
          fs.unlinkSync(change.file)
          console.log(`   ✓ Deleted: ${change.file}`)
          rolledBack++
        }
      } else if (change.action === 'delete') {
        // Restore deleted file
        fs.writeFileSync(change.file, change.before, 'utf-8')
        console.log(`   ✓ Restored: ${change.file}`)
        rolledBack++
      } else {
        // Revert modified file
        fs.writeFileSync(change.file, change.before, 'utf-8')
        console.log(`   ✓ Reverted: ${change.file}`)
        rolledBack++
      }
    } catch (error) {
      const msg = `Failed to rollback ${change.file}: ${error}`
      errors.push(msg)
      console.error(`   ✗ ${msg}`)
    }
  }
  
  // Mark operation as rolled back
  const history = loadHistory()
  const op = history.operations.find(o => o.id === id)
  if (op) {
    op.result = 'rolled_back'
    saveHistory(history)
  }
  
  console.log(`\n✅ Rolled back ${rolledBack}/${operation.files.length} files`)
  
  if (errors.length > 0) {
    console.log(`\n⚠️  Errors encountered:`)
    errors.forEach(err => console.log(`   - ${err}`))
    return false
  }
  
  return true
}

// ============================================================================
// CLI
// ============================================================================

const command = process.argv[2]
const arg = process.argv[3]

switch (command) {
  case 'list': {
    const limit = arg ? parseInt(arg) : 20
    const ops = listOperations(limit)
    
    console.log(`\n📚 Operation History (last ${limit})\n`)
    
    if (ops.length === 0) {
      console.log('   No operations recorded yet\n')
      break
    }
    
    ops.forEach((op, i) => {
      const date = new Date(op.timestamp).toLocaleString()
      const status = op.result === 'success' ? '✅' : 
                     op.result === 'failure' ? '❌' : 
                     '🔄'
      
      console.log(`${i + 1}. ${status} ${op.id}`)
      console.log(`   ${op.description}`)
      console.log(`   Files: ${op.files.length} | Time: ${date}`)
      if (op.duration_ms) {
        console.log(`   Duration: ${op.duration_ms}ms`)
      }
      console.log()
    })
    break
  }
  
  case 'show': {
    if (!arg) {
      console.error('Usage: windsurf:history show <operation-id>')
      process.exit(1)
    }
    
    const op = getOperation(arg)
    if (!op) {
      console.error(`❌ Operation ${arg} not found`)
      process.exit(1)
    }
    
    console.log(`\n📋 Operation Details\n`)
    console.log(`ID: ${op.id}`)
    console.log(`Type: ${op.type}`)
    console.log(`Description: ${op.description}`)
    console.log(`Timestamp: ${new Date(op.timestamp).toLocaleString()}`)
    console.log(`Result: ${op.result}`)
    console.log(`Files affected: ${op.files.length}`)
    
    if (op.git_sha) {
      console.log(`Git SHA: ${op.git_sha}`)
    }
    
    if (op.duration_ms) {
      console.log(`Duration: ${op.duration_ms}ms`)
    }
    
    if (op.error) {
      console.log(`\n❌ Error: ${op.error}`)
    }
    
    console.log(`\nFiles:`)
    op.files.forEach(file => {
      const action = file.action === 'create' ? '➕' :
                     file.action === 'delete' ? '➖' : '✏️'
      console.log(`   ${action} ${file.file}`)
    })
    console.log()
    break
  }
  
  case 'rollback': {
    if (!arg) {
      console.error('Usage: windsurf:history rollback <operation-id>')
      process.exit(1)
    }
    
    const success = rollbackOperation(arg)
    process.exit(success ? 0 : 1)
  }
  
  case 'rollback-last': {
    const last = getLastOperation()
    if (!last) {
      console.error('❌ No operations to rollback')
      process.exit(1)
    }
    
    const success = rollbackOperation(last.id)
    process.exit(success ? 0 : 1)
  }
  
  default:
    console.log(`
🔄 Operation History Manager

Usage:
  npm run windsurf:history <command> [args]

Commands:
  list [limit]           - List recent operations (default: 20)
  show <operation-id>    - Show operation details
  rollback <operation-id> - Rollback an operation
  rollback-last          - Rollback the most recent operation

Examples:
  npm run windsurf:history list
  npm run windsurf:history show op_20251015_abc123
  npm run windsurf:history rollback op_20251015_abc123
  npm run windsurf:history rollback-last
`)
    break
}
