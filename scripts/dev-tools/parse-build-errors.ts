#!/usr/bin/env tsx
/**
 * Build Error Parser
 * 
 * Extracts actionable errors from Vercel build logs
 * Provides specific file/line numbers and suggestions
 * 
 * Used by: wait-for-vercel.ts, smart-deploy.ts
 */

export interface BuildError {
  type: 'import' | 'type' | 'syntax' | 'runtime' | 'env' | 'dependency'
  message: string
  file?: string
  line?: number
  column?: number
  suggestion?: string
  severity: 'error' | 'warning'
}

export class BuildErrorParser {
  parse(logs: string): BuildError[] {
    const errors: BuildError[] = []
    
    // Parse import errors
    errors.push(...this.parseImportErrors(logs))
    
    // Parse TypeScript errors
    errors.push(...this.parseTypeErrors(logs))
    
    // Parse syntax errors
    errors.push(...this.parseSyntaxErrors(logs))
    
    // Parse environment variable errors
    errors.push(...this.parseEnvErrors(logs))
    
    // Parse dependency errors
    errors.push(...this.parseDependencyErrors(logs))
    
    return errors
  }
  
  private parseImportErrors(logs: string): BuildError[] {
    const errors: BuildError[] = []
    
    // Pattern: Module not found: Can't resolve 'X' in 'Y'
    const regex = /Module not found: (?:Error: )?Can't resolve '([^']+)'(?: in '([^']+)')?/g
    const matches = logs.matchAll(regex)
    
    for (const match of matches) {
      const module = match[1]
      const location = match[2]
      
      errors.push({
        type: 'import',
        severity: 'error',
        message: `Cannot find module: ${module}`,
        file: location,
        suggestion: this.suggestImportFix(module, location)
      })
    }
    
    return errors
  }
  
  private parseTypeErrors(logs: string): BuildError[] {
    const errors: BuildError[] = []
    
    // Pattern: file.ts(line,col): error TS1234: message
    const regex = /(.+\.tsx?)\((\d+),(\d+)\): error (TS\d+): (.+)/g
    const matches = logs.matchAll(regex)
    
    for (const match of matches) {
      errors.push({
        type: 'type',
        severity: 'error',
        message: `${match[4]}: ${match[5]}`,
        file: match[1],
        line: parseInt(match[2]),
        column: parseInt(match[3]),
        suggestion: this.suggestTypeFix(match[5])
      })
    }
    
    return errors
  }
  
  private parseSyntaxErrors(logs: string): BuildError[] {
    const errors: BuildError[] = []
    
    // Pattern: SyntaxError: message
    const regex = /SyntaxError: ([^\n]+)/g
    const matches = logs.matchAll(regex)
    
    for (const match of matches) {
      errors.push({
        type: 'syntax',
        severity: 'error',
        message: match[1],
        suggestion: 'Run: npm run lint to identify syntax issues'
      })
    }
    
    return errors
  }
  
  private parseEnvErrors(logs: string): BuildError[] {
    const errors: BuildError[] = []
    
    // Pattern: references to process.env.MISSING_VAR
    const regex = /process\.env\.([A-Z_]+) is undefined/gi
    const matches = logs.matchAll(regex)
    
    for (const match of matches) {
      errors.push({
        type: 'env',
        severity: 'error',
        message: `Missing environment variable: ${match[1]}`,
        suggestion: `Add ${match[1]} to Vercel environment variables`
      })
    }
    
    return errors
  }
  
  private parseDependencyErrors(logs: string): BuildError[] {
    const errors: BuildError[] = []
    
    // Pattern: Cannot find package 'X'
    const regex = /(?:Cannot find|Could not resolve) (?:package|dependency) '([^']+)'/g
    const matches = logs.matchAll(regex)
    
    for (const match of matches) {
      errors.push({
        type: 'dependency',
        severity: 'error',
        message: `Missing dependency: ${match[1]}`,
        suggestion: `Run: npm install ${match[1]}`
      })
    }
    
    return errors
  }
  
  private suggestImportFix(module: string, location?: string): string {
    // Specific suggestions based on patterns
    if (module.startsWith('@/hooks/')) {
      return `Check if hook moved to @/features/*/hooks/ (Week 1 migration)`
    }
    
    if (module.startsWith('@/lib/')) {
      return `Verify lib/ structure matches architecture`
    }
    
    if (module.includes('../../../')) {
      return `Replace with @/ alias import (e.g., @/features/...)`
    }
    
    if (module.startsWith('./')) {
      return `Verify file exists: ls ${location || ''}/${module}`
    }
    
    if (module.startsWith('@/components/')) {
      return `Check if component is in @/components/design-system or @/features/*/ui`
    }
    
    // Generic suggestion
    const basename = module.split('/').pop()?.replace(/\.[^.]+$/, '')
    return `Search for file: find . -name "${basename}*" -type f`
  }
  
  private suggestTypeFix(message: string): string {
    if (message.includes('Cannot find name')) {
      return `Check imports and type definitions`
    }
    
    if (message.includes('Property') && message.includes('does not exist')) {
      return `Verify object structure matches type definition`
    }
    
    if (message.includes('not assignable to type')) {
      return `Check type compatibility or add type assertion`
    }
    
    if (message.includes('implicitly has an \'any\' type')) {
      return `Add explicit type annotation`
    }
    
    return `Run: npm run type-check for more details`
  }
  
  format(errors: BuildError[]): string {
    if (errors.length === 0) {
      return '\n✅ No specific errors detected in build logs\n'
    }
    
    let output = '\n🔍 DETAILED BUILD ERRORS:\n'
    output += '='.repeat(70) + '\n\n'
    
    // Group by type
    const byType = this.groupByType(errors)
    
    Object.entries(byType).forEach(([type, errs]) => {
      output += `\n📋 ${type.toUpperCase()} ERRORS (${errs.length}):\n\n`
      
      errs.forEach((err, i) => {
        output += `   ${i + 1}. ${err.message}\n`
        
        if (err.file) {
          output += `      📁 ${err.file}`
          if (err.line) output += `:${err.line}`
          if (err.column) output += `:${err.column}`
          output += '\n'
        }
        
        if (err.suggestion) {
          output += `      💡 ${err.suggestion}\n`
        }
        
        output += '\n'
      })
    })
    
    output += '='.repeat(70) + '\n'
    
    return output
  }
  
  private groupByType(errors: BuildError[]): Record<string, BuildError[]> {
    const grouped: Record<string, BuildError[]> = {}
    
    errors.forEach(err => {
      if (!grouped[err.type]) {
        grouped[err.type] = []
      }
      grouped[err.type].push(err)
    })
    
    return grouped
  }
  
  // Quick summary for status file
  summary(errors: BuildError[]): string {
    if (errors.length === 0) return 'Build failed (no specific errors detected)'
    
    const byType = this.groupByType(errors)
    const parts: string[] = []
    
    Object.entries(byType).forEach(([type, errs]) => {
      parts.push(`${errs.length} ${type}`)
    })
    
    return parts.join(', ')
  }
}

// CLI usage
if (require.main === module) {
  const fs = require('fs')
  
  const logsFile = process.argv[2]
  
  if (!logsFile) {
    console.error('Usage: npx tsx parse-build-errors.ts <logs-file>')
    process.exit(1)
  }
  
  const logs = fs.readFileSync(logsFile, 'utf8')
  const parser = new BuildErrorParser()
  const errors = parser.parse(logs)
  
  console.log(parser.format(errors))
  console.log(`\nTotal: ${errors.length} errors found`)
}
