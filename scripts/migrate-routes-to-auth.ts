#!/usr/bin/env tsx
/**
 * Elite-Tier Route Migration Tool
 * 
 * Automatically migrates API routes to use authentication middleware.
 * Analyzes route files and applies auth patterns while preserving business logic.
 * 
 * Usage: npm run migrate:routes
 */

import * as fs from 'fs'
import * as path from 'path'
import { glob } from 'glob'

// ============================================================================
// Configuration
// ============================================================================

const DRY_RUN = process.argv.includes('--dry-run')
const VERBOSE = process.argv.includes('--verbose')
const TARGET_DIR = 'app/api'

// Routes to skip (already migrated or special cases)
const SKIP_ROUTES = [
  'app/api/auth/[...nextauth]/route.ts', // NextAuth, doesn't need migration
  'app/api/vehicles/route.ts', // Already migrated
  'app/api/vehicles/[vehicleId]/route.ts', // Already migrated
]

// ============================================================================
// Types
// ============================================================================

interface MigrationResult {
  file: string
  success: boolean
  changes: string[]
  errors: string[]
  skipped?: boolean
  reason?: string
}

interface HandlerInfo {
  method: string
  startLine: number
  endLine: number
  hasParams: boolean
  originalCode: string
}

// ============================================================================
// Utilities
// ============================================================================

function log(message: string, level: 'info' | 'success' | 'warning' | 'error' = 'info') {
  const icons = {
    info: '📝',
    success: '✅',
    warning: '⚠️',
    error: '❌',
  }
  console.log(`${icons[level]} ${message}`)
}

function verbose(message: string) {
  if (VERBOSE) {
    console.log(`   ${message}`)
  }
}

// ============================================================================
// Route Analysis
// ============================================================================

/**
 * Detect HTTP handlers in a route file
 */
function detectHandlers(content: string): HandlerInfo[] {
  const handlers: HandlerInfo[] = []
  const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
  
  for (const method of methods) {
    // Match: export async function METHOD or export const METHOD = 
    const patterns = [
      new RegExp(`export\\s+async\\s+function\\s+${method}\\s*\\(`, 'g'),
      new RegExp(`export\\s+const\\s+${method}\\s*=\\s*async`, 'g'),
    ]
    
    for (const pattern of patterns) {
      const matches = content.matchAll(pattern)
      
      for (const match of matches) {
        if (!match.index) continue
        
        // Find the full function body
        const startIndex = match.index
        const startLine = content.substring(0, startIndex).split('\n').length
        
        // Find matching closing brace
        let depth = 0
        let inFunction = false
        let endIndex = startIndex
        
        for (let i = startIndex; i < content.length; i++) {
          if (content[i] === '{') {
            depth++
            inFunction = true
          } else if (content[i] === '}') {
            depth--
            if (inFunction && depth === 0) {
              endIndex = i + 1
              break
            }
          }
        }
        
        const endLine = content.substring(0, endIndex).split('\n').length
        const originalCode = content.substring(startIndex, endIndex)
        
        // Check if handler has params
        const hasParams = originalCode.includes('{ params }') || originalCode.includes('params:')
        
        handlers.push({
          method,
          startLine,
          endLine,
          hasParams,
          originalCode,
        })
      }
    }
  }
  
  return handlers
}

/**
 * Check if file already uses withAuth
 */
function isAlreadyMigrated(content: string): boolean {
  return content.includes('withAuth') || content.includes('@/lib/middleware')
}

/**
 * Check if file has Supabase client creation
 */
function usesSupabase(content: string): boolean {
  return content.includes('createClient') && content.includes('supabase')
}

// ============================================================================
// Code Transformation
// ============================================================================

/**
 * Update imports to use auth middleware
 */
function transformImports(content: string): string {
  let transformed = content
  
  // Check if already has the import
  if (transformed.includes('@/lib/middleware')) {
    verbose('Imports already updated')
    return transformed
  }
  
  // Add auth middleware import after NextResponse import
  const importPattern = /import\s+{[^}]+}\s+from\s+['"]next\/server['"]/
  const match = importPattern.exec(transformed)
  
  if (match) {
    const authImport = `\nimport { withAuth, createTenantClient, type AuthContext } from '@/lib/middleware'`
    transformed = transformed.replace(match[0], match[0] + authImport)
  }
  
  // Remove Supabase createClient import if present
  transformed = transformed.replace(
    /import\s+{\s*createClient\s*}\s+from\s+['"]@supabase\/supabase-js['"]\s*\n?/g,
    ''
  )
  
  return transformed
}

/**
 * Transform a single handler to use withAuth
 */
function transformHandler(handler: HandlerInfo, domainName: string): string {
  const { method, hasParams, originalCode } = handler
  
  // Build the new handler signature
  let transformed = originalCode
  
  // Replace function signature
  if (transformed.includes('export async function')) {
    // Old: export async function GET(request: NextRequest, { params }: ...)
    // New: export const GET = withAuth(async (request: NextRequest, { user, tenant, token }: AuthContext, params?: Record<string, string>) => {
    
    if (hasParams) {
      transformed = transformed.replace(
        /export\s+async\s+function\s+(\w+)\s*\(\s*request:\s*NextRequest\s*,\s*{\s*params\s*}[^)]*\)\s*{/,
        `export const $1 = withAuth(async (\n  request: NextRequest,\n  { user, tenant, token }: AuthContext,\n  params?: Record<string, string>\n) => {`
      )
    } else {
      transformed = transformed.replace(
        /export\s+async\s+function\s+(\w+)\s*\(\s*request:\s*NextRequest\s*\)\s*{/,
        `export const $1 = withAuth(async (\n  request: NextRequest,\n  { user, tenant, token }: AuthContext\n) => {`
      )
    }
  } else if (transformed.includes('export const')) {
    // Already using const, just wrap with withAuth
    transformed = transformed.replace(
      /export\s+const\s+(\w+)\s*=\s*async/,
      `export const $1 = withAuth(async`
    )
  }
  
  // Replace createClient calls with createTenantClient
  transformed = transformed.replace(
    /const\s+supabase\s*=\s*createClient\s*\(\s*process\.env\.[^,]+,\s*process\.env\.[^)]+\)/g,
    'const supabase = createTenantClient(token, tenant.tenantId)'
  )
  
  // Add structured error responses
  transformed = transformErrors(transformed, domainName)
  
  // Add logging
  transformed = transformLogging(transformed, domainName)
  
  // Change closing brace to closing paren
  const lastBrace = transformed.lastIndexOf('}')
  if (lastBrace !== -1) {
    transformed = transformed.substring(0, lastBrace) + '})'
  }
  
  return transformed
}

/**
 * Transform error responses to structured format
 */
function transformErrors(code: string, domain: string): string {
  let transformed = code
  
  // Pattern: { error: 'message' } -> { ok: false, error: { code: ..., message: ... }}
  const errorPattern = /return\s+NextResponse\.json\s*\(\s*{\s*error:\s*['"]([^'"]+)['"]\s*}/g
  
  transformed = transformed.replace(errorPattern, (match, message) => {
    const errorCode = message.toUpperCase().replace(/\s+/g, '_')
    return `return NextResponse.json(\n      { \n        ok: false,\n        error: {\n          code: '${domain.toUpperCase()}_${errorCode}',\n          message: '${message}'\n        }\n      }`
  })
  
  // Pattern: { success: true, data } -> { ok: true, data: { ... }}
  transformed = transformed.replace(
    /return\s+NextResponse\.json\s*\(\s*{\s*([^}]+)\s*}/g,
    (match, content) => {
      if (content.includes('error') || content.includes('ok:')) {
        return match // Already structured
      }
      return `return NextResponse.json({\n      ok: true,\n      data: { ${content} }\n    }`
    }
  )
  
  return transformed
}

/**
 * Transform console.error to structured logging
 */
function transformLogging(code: string, domain: string): string {
  let transformed = code
  
  // Add context to error logs
  transformed = transformed.replace(
    /console\.error\s*\(\s*['"]([^'"]+)['"]\s*,\s*error\s*\)/g,
    `console.error('[${domain.toUpperCase()}] $1', {\n      tenantId: tenant.tenantId,\n      userId: user.id,\n      error,\n    })`
  )
  
  return transformed
}

/**
 * Extract params from handler if present
 */
function extractParamsCode(handler: HandlerInfo): string | null {
  const match = /const\s+{\s*([^}]+)\s*}\s*=\s*params/.exec(handler.originalCode)
  if (match) {
    const paramNames = match[1].split(',').map(p => p.trim())
    return paramNames.map(name => 
      `  const ${name} = params?.${name}\n  \n  if (!${name}) {\n    return NextResponse.json(\n      { \n        ok: false,\n        error: {\n          code: 'MISSING_PARAM',\n          message: '${name} is required'\n        }\n      },\n      { status: 400 }\n    )\n  }`
    ).join('\n\n')
  }
  return null
}

// ============================================================================
// File Migration
// ============================================================================

/**
 * Migrate a single route file
 */
function migrateRouteFile(filePath: string): MigrationResult {
  const result: MigrationResult = {
    file: filePath,
    success: false,
    changes: [],
    errors: [],
  }
  
  try {
    // Read file
    const content = fs.readFileSync(filePath, 'utf-8')
    
    // Check if should skip
    if (SKIP_ROUTES.includes(filePath)) {
      result.skipped = true
      result.reason = 'Explicitly skipped'
      return result
    }
    
    // Check if already migrated
    if (isAlreadyMigrated(content)) {
      result.skipped = true
      result.reason = 'Already uses withAuth'
      result.changes.push('File already migrated')
      return result
    }
    
    // Check if uses Supabase
    if (!usesSupabase(content)) {
      result.skipped = true
      result.reason = 'Does not use Supabase client'
      return result
    }
    
    // Detect handlers
    const handlers = detectHandlers(content)
    
    if (handlers.length === 0) {
      result.skipped = true
      result.reason = 'No handlers found'
      return result
    }
    
    verbose(`Found ${handlers.length} handlers: ${handlers.map(h => h.method).join(', ')}`)
    
    // Extract domain name from file path
    const domainMatch = /api\/([^\/]+)/.exec(filePath)
    const domainName = domainMatch ? domainMatch[1] : 'api'
    
    // Transform content
    let transformed = content
    
    // 1. Transform imports
    transformed = transformImports(transformed)
    result.changes.push('Updated imports')
    
    // 2. Transform each handler
    for (const handler of handlers) {
      const newHandler = transformHandler(handler, domainName)
      transformed = transformed.replace(handler.originalCode, newHandler)
      result.changes.push(`Transformed ${handler.method} handler`)
    }
    
    // Write file if not dry run
    if (!DRY_RUN) {
      fs.writeFileSync(filePath, transformed, 'utf-8')
      result.changes.push('File written')
    } else {
      result.changes.push('(Dry run - file not written)')
    }
    
    result.success = true
    
  } catch (error) {
    result.errors.push((error as Error).message)
  }
  
  return result
}

// ============================================================================
// Main Migration
// ============================================================================

async function main() {
  log('🚀 ELITE-TIER ROUTE MIGRATION TOOL\n', 'info')
  
  if (DRY_RUN) {
    log('Running in DRY RUN mode (no files will be modified)', 'warning')
  }
  
  // Find all route files
  const routeFiles = glob.sync(`${TARGET_DIR}/**/route.ts`)
  log(`Found ${routeFiles.length} route files\n`)
  
  // Migrate each file
  const results: MigrationResult[] = []
  let successCount = 0
  let skippedCount = 0
  let errorCount = 0
  
  for (const file of routeFiles) {
    verbose(`\nProcessing: ${file}`)
    const result = migrateRouteFile(file)
    results.push(result)
    
    if (result.skipped) {
      log(`⏭️  Skipped: ${file} (${result.reason})`, 'info')
      skippedCount++
    } else if (result.success) {
      log(`✅ Migrated: ${file}`, 'success')
      verbose(`   Changes: ${result.changes.join(', ')}`)
      successCount++
    } else {
      log(`❌ Failed: ${file}`, 'error')
      verbose(`   Errors: ${result.errors.join(', ')}`)
      errorCount++
    }
  }
  
  // Summary
  log('\n' + '='.repeat(60))
  log('📊 MIGRATION SUMMARY', 'success')
  log('='.repeat(60))
  log(`Total files: ${routeFiles.length}`)
  log(`✅ Migrated: ${successCount}`, 'success')
  log(`⏭️  Skipped: ${skippedCount}`, 'info')
  log(`❌ Failed: ${errorCount}`, errorCount > 0 ? 'error' : 'success')
  
  if (DRY_RUN) {
    log('\n💡 Run without --dry-run to apply changes', 'info')
  } else {
    log('\n🎉 Migration complete!', 'success')
    log('Next steps:')
    log('  1. Review the changes: git diff')
    log('  2. Test the routes')
    log('  3. Commit: git add -A && git commit -m "feat: Migrate all routes to auth middleware"')
  }
}

// Run migration
main().catch(console.error)
