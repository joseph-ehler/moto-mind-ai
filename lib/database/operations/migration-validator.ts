/**
 * Migration Validator
 * 
 * Pre-flight checks for migrations to catch issues before applying:
 * - Reserved word usage (like "references", "user", "order")
 * - Timestamp conflicts
 * - Dangerous operations without confirmation
 * - Syntax validation via dry-run
 * 
 * Prevents bugs like:
 * - "relation does not exist" (missing dependencies)
 * - "syntax error at or near 'references'" (reserved words)
 * - Partial migrations (caught via transaction test)
 */

import * as fs from 'fs'
import * as path from 'path'
import type { Database } from '../core'

/**
 * SQL reserved words that cause issues as identifiers
 * This is a subset of commonly problematic ones
 */
const RESERVED_WORDS = [
  'references', 'user', 'order', 'limit', 'default', 'primary',
  'check', 'constraint', 'table', 'column', 'index', 'key',
  'select', 'from', 'where', 'group', 'having', 'join',
  'grant', 'revoke', 'case', 'when', 'then', 'end',
  'union', 'except', 'intersect', 'all', 'distinct',
  'current_date', 'current_time', 'current_timestamp',
  'transaction', 'commit', 'rollback', 'savepoint'
]

/**
 * Patterns for dangerous DDL operations
 */
const DANGEROUS_PATTERNS = [
  /\bDROP\s+TABLE\b/i,
  /\bDROP\s+COLUMN\b/i,
  /\bTRUNCATE\b/i,
  /\bALTER\s+TABLE\s+\w+\s+DROP\b/i,
  /\bALTER\s+TYPE\s+\w+\s+DROP\b/i,
  /\bDROP\s+SCHEMA\b/i,
  /\bDROP\s+DATABASE\b/i,
]

/**
 * Non-transactional SQL patterns that must run outside transactions
 */
export const NON_TRANSACTIONAL_PATTERNS = [
  /\bCREATE\s+INDEX\s+CONCURRENTLY\b/i,
  /\bREFRESH\s+MATERIALIZED\s+VIEW\s+CONCURRENTLY\b/i,
  /\bVACUUM\b/i,
  /\bREINDEX\b/i,
]

export interface ValidationIssue {
  severity: 'error' | 'warning'
  category: string
  message: string
  fix?: string
  line?: number
}

export interface ValidationResult {
  valid: boolean
  issues: ValidationIssue[]
  warnings: ValidationIssue[]
  errors: ValidationIssue[]
}

/**
 * Split SQL into statements (simple splitter, handles most cases)
 */
function splitSqlStatements(sql: string): string[] {
  // Remove comments
  const withoutComments = sql
    .replace(/--.*$/gm, '') // Single-line comments
    .replace(/\/\*[\s\S]*?\*\//g, '') // Multi-line comments
  
  // Split on semicolons (naive, doesn't handle strings/functions perfectly)
  return withoutComments
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0)
}

/**
 * SQL keyword patterns where reserved words are SAFE (used as keywords, not identifiers)
 */
const SAFE_KEYWORD_PATTERNS = [
  /CREATE\s+TABLE/i,
  /DROP\s+TABLE/i,
  /ALTER\s+TABLE/i,
  /TRUNCATE\s+TABLE/i,
  /CREATE\s+INDEX/i,
  /DROP\s+INDEX/i,
  /PRIMARY\s+KEY/i,
  /FOREIGN\s+KEY/i,
  /UNIQUE\s+KEY/i,
  /DEFAULT\s+/i,
  /REFERENCES\s+\w+\s*\(/i,  // REFERENCES table(column)
  /CHECK\s*\(/i,
  /CONSTRAINT\s+/i,
  /FROM\s+/i,
  /JOIN\s+/i,
  /WHERE\s+/i,
  /GROUP\s+BY/i,
  /ORDER\s+BY/i,
  /LIMIT\s+/i,
  /OFFSET\s+/i,
  /INSERT\s+INTO/i,
  /UPDATE\s+/i,
  /DELETE\s+FROM/i,
  /SELECT\s+/i,
  /UNION\s+ALL/i,
  /CASE\s+WHEN/i,
  /END\s*[,;)]/i,  // END at statement end
  /\bALL\s+(PRIVILEGES|OPERATIONS)/i,
  /WITH\s+CHECK/i,
  /USING\s*\(/i,
]

/**
 * Check if a reserved word appears in a safe context (as keyword, not identifier)
 */
function isInSafeKeywordContext(line: string, word: string): boolean {
  // Check if the word appears in any safe keyword pattern
  for (const pattern of SAFE_KEYWORD_PATTERNS) {
    if (pattern.test(line)) {
      // Word is part of a SQL keyword, not an identifier
      return true
    }
  }
  
  // Check if word is already quoted (safe)
  if (line.includes(`"${word}"`) || line.includes(`'${word}'`)) {
    return true
  }
  
  // Check if in a comment
  if (line.trim().startsWith('--') || line.includes(`/*`) || line.includes(`*/`)) {
    return true
  }
  
  return false
}

/**
 * Check for reserved words used as identifiers (context-aware)
 */
function checkReservedWords(sql: string): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const lines = sql.split('\n')
  
  // Patterns that indicate identifier usage (column/table names)
  const identifierPatterns = [
    // Column definitions: "name TYPE"
    /^\s*(\w+)\s+(TEXT|INTEGER|UUID|BOOLEAN|TIMESTAMPTZ|NUMERIC|SERIAL|BIGINT|VARCHAR)/i,
    // Table creation: "CREATE TABLE name"
    /CREATE\s+TABLE\s+(?:\w+\.)?(\w+)/i,
    // Column in CREATE TABLE: "name TYPE,"
    /^\s*(\w+)\s+\w+.*,?\s*$/,
  ]
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()
    
    // Skip comments and empty lines
    if (trimmed.startsWith('--') || trimmed.length === 0) {
      continue
    }
    
    for (const word of RESERVED_WORDS) {
      const wordPattern = new RegExp(`\\b${word}\\b`, 'i')
      
      // Only check if word appears on this line
      if (!wordPattern.test(line)) {
        continue
      }
      
      // Check if word is already quoted (safe)
      if (line.includes(`"${word}"`) || line.includes(`'${word}'`)) {
        continue
      }
      
      // Check specific identifier contexts
      let isIdentifier = false
      
      // Check if it's a column name in CREATE TABLE
      // Example: "  references TEXT,"
      const columnMatch = line.match(/^\s*(\w+)\s+(TEXT|INTEGER|UUID|BOOLEAN|TIMESTAMPTZ|NUMERIC|SERIAL|BIGINT|VARCHAR|JSONB|DATE|TIME|BIGSERIAL)/i)
      if (columnMatch && columnMatch[1].toLowerCase() === word.toLowerCase()) {
        isIdentifier = true
      }
      
      // Check if it's a table name in CREATE TABLE
      // Example: "CREATE TABLE user ("
      const tableMatch = line.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:\w+\.)?(\w+)/i)
      if (tableMatch && tableMatch[1].toLowerCase() === word.toLowerCase()) {
        isIdentifier = true
      }
      
      // Check if it's a schema.table reference
      // Example: "public.user"
      const schemaTableMatch = line.match(/\w+\.(\w+)/g)
      if (schemaTableMatch) {
        for (const match of schemaTableMatch) {
          const tableName = match.split('.')[1]
          if (tableName && tableName.toLowerCase() === word.toLowerCase()) {
            isIdentifier = true
          }
        }
      }
      
      if (isIdentifier) {
        issues.push({
          severity: 'error',
          category: 'reserved_word',
          message: `Reserved word "${word}" used as identifier on line ${i + 1}`,
          fix: `Rename to "${word}_col" or "${word}_table", or quote as "${word}"`,
          line: i + 1
        })
      }
    }
  }
  
  return issues
}

/**
 * Check for dangerous operations
 */
function checkDangerousOperations(sql: string, confirmed: boolean): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const lines = sql.split('\n')
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()
    
    // Skip comments
    if (trimmed.startsWith('--') || trimmed.length === 0) {
      continue
    }
    
    for (const pattern of DANGEROUS_PATTERNS) {
      if (pattern.test(line)) {
        issues.push({
          severity: confirmed ? 'warning' : 'error',
          category: 'dangerous_operation',
          message: `Dangerous operation detected on line ${i + 1}: ${trimmed.substring(0, 50)}...`,
          fix: confirmed 
            ? 'Ensure rollback plan is documented'
            : 'Re-run with --confirm flag and ensure rollback plan exists',
          line: i + 1
        })
      }
    }
  }
  
  return issues
}

/**
 * Check for timestamp conflicts with existing migrations
 */
function checkTimestampConflict(filename: string, migrationsDir: string): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  
  // Extract timestamp prefix (e.g., "20251019_01" from "20251019_01_schema_registry.sql")
  const match = filename.match(/^(\d{8}_\d{2})_/)
  if (!match) return issues
  
  const timestamp = match[1]
  
  // Check for other files with same timestamp
  try {
    const files = fs.readdirSync(migrationsDir)
    const conflicts = files.filter(f => 
      f !== filename && 
      f.startsWith(timestamp) && 
      f.endsWith('.sql')
    )
    
    if (conflicts.length > 0) {
      issues.push({
        severity: 'error',
        category: 'timestamp_conflict',
        message: `Timestamp conflict: Another migration exists with prefix ${timestamp}`,
        fix: `Rename to use next sequence: ${timestamp.replace(/_\d{2}$/, m => '_' + (parseInt(m.substring(1)) + 1).toString().padStart(2, '0'))}_`
      })
    }
  } catch (error) {
    // Directory doesn't exist or not readable, skip check
  }
  
  return issues
}

/**
 * Split SQL into transactional and non-transactional statements
 */
export function splitStatements(sql: string): { transactional: string[], nonTransactional: string[] } {
  const statements = splitSqlStatements(sql)
  const transactional: string[] = []
  const nonTransactional: string[] = []
  
  for (const stmt of statements) {
    const isNonTxn = NON_TRANSACTIONAL_PATTERNS.some(pattern => pattern.test(stmt))
    if (isNonTxn) {
      nonTransactional.push(stmt)
    } else {
      transactional.push(stmt)
    }
  }
  
  return { transactional, nonTransactional }
}

/**
 * Static validation (no database connection needed)
 */
export function validateStatic(
  sql: string,
  filename: string,
  options: { confirmed?: boolean; migrationsDir?: string } = {}
): ValidationResult {
  const issues: ValidationIssue[] = []
  
  // 1. Check reserved words
  issues.push(...checkReservedWords(sql))
  
  // 2. Check dangerous operations
  issues.push(...checkDangerousOperations(sql, options.confirmed || false))
  
  // 3. Check timestamp conflicts
  if (options.migrationsDir) {
    issues.push(...checkTimestampConflict(filename, options.migrationsDir))
  }
  
  const errors = issues.filter(i => i.severity === 'error')
  const warnings = issues.filter(i => i.severity === 'warning')
  
  return {
    valid: errors.length === 0,
    issues,
    errors,
    warnings
  }
}

/**
 * Database validation (dry-run in transaction)
 */
export async function validateAgainstDB(
  sql: string,
  db: Database
): Promise<ValidationResult> {
  const issues: ValidationIssue[] = []
  const { transactional, nonTransactional } = splitStatements(sql)
  
  // Test transactional statements in a transaction that rolls back
  if (transactional.length > 0) {
    try {
      await db.transaction(async (tx) => {
        for (const stmt of transactional) {
          await tx.query(stmt)
        }
        // Force rollback
        throw new Error('__VALIDATION_ROLLBACK__')
      })
    } catch (error: any) {
      if (error.message !== '__VALIDATION_ROLLBACK__') {
        issues.push({
          severity: 'error',
          category: 'syntax_error',
          message: error.message || 'Syntax or dependency error in transactional statements',
          fix: 'Review SQL for syntax errors, missing tables, or incorrect column names'
        })
      }
    }
  }
  
  // Test non-transactional statements with PREPARE (syntax check only)
  for (const stmt of nonTransactional) {
    try {
      await db.query('DEALLOCATE ALL')
      await db.query(`PREPARE _validation_check AS ${stmt}`)
      await db.query('DEALLOCATE _validation_check')
    } catch (error: any) {
      issues.push({
        severity: 'error',
        category: 'syntax_error',
        message: `Syntax error in non-transactional statement: ${error.message}`,
        fix: 'Check SQL syntax for CREATE INDEX CONCURRENTLY, VACUUM, or REINDEX statements'
      })
    }
  }
  
  const errors = issues.filter(i => i.severity === 'error')
  const warnings = issues.filter(i => i.severity === 'warning')
  
  return {
    valid: errors.length === 0,
    issues,
    errors,
    warnings
  }
}

/**
 * Full validation (static + database)
 */
export async function validateMigration(
  filePath: string,
  db: Database,
  options: { confirmed?: boolean } = {}
): Promise<ValidationResult> {
  const sql = fs.readFileSync(filePath, 'utf-8')
  const filename = path.basename(filePath)
  const migrationsDir = path.dirname(filePath)
  
  // Static checks
  const staticResult = validateStatic(sql, filename, {
    confirmed: options.confirmed,
    migrationsDir
  })
  
  // If static checks fail, don't run DB checks
  if (!staticResult.valid) {
    return staticResult
  }
  
  // Database checks
  const dbResult = await validateAgainstDB(sql, db)
  
  // Combine results
  return {
    valid: staticResult.valid && dbResult.valid,
    issues: [...staticResult.issues, ...dbResult.issues],
    errors: [...staticResult.errors, ...dbResult.errors],
    warnings: [...staticResult.warnings, ...dbResult.warnings]
  }
}
