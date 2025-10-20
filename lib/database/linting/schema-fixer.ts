/**
 * Schema Fixer
 * 
 * Automatically generates fix migrations for linting violations
 * Supports top 10 most common schema issues
 */

import { LintResult, LintRule } from './schema-linter'
import { Database } from '../core'
import * as fs from 'fs'
import * as path from 'path'

export interface FixMigration {
  sql: string
  description: string
  rule: string
  severity: 'critical' | 'recommended'
}

export interface FixResult {
  success: boolean
  fixes: FixMigration[]
  applied?: boolean
  errors?: string[]
}

export class SchemaFixer {
  constructor(private db: Database) {}
  
  /**
   * Generate fix migrations for linting violations
   */
  async generateFixes(
    tableName: string,
    lintResults: LintResult,
    options: {
      autoApply?: boolean
      dryRun?: boolean
    } = {}
  ): Promise<FixResult> {
    const fixes: FixMigration[] = []
    const errors: string[] = []
    
    // Generate fixes for each violation
    for (const issue of [...lintResults.blockers, ...lintResults.warnings]) {
      try {
        const fix = await this.generateFix(tableName, issue)
        if (fix) fixes.push(fix)
      } catch (error) {
        errors.push(`Failed to generate fix for ${issue.category}: ${error instanceof Error ? error.message : error}`)
      }
    }
    
    // Apply fixes if requested
    if (options.autoApply && !options.dryRun) {
      for (const fix of fixes) {
        try {
          await this.db.query(fix.sql, { transaction: true })
          console.log(`✅ Applied: ${fix.description}`)
        } catch (error) {
          errors.push(`Failed to apply ${fix.description}: ${error instanceof Error ? error.message : error}`)
        }
      }
      
      return { success: errors.length === 0, fixes, applied: true, errors }
    }
    
    return { success: true, fixes, applied: false }
  }
  
  /**
   * Generate fix for a single violation
   */
  private async generateFix(
    tableName: string,
    issue: LintRule
  ): Promise<FixMigration | null> {
    const { category } = issue
    
    // 1. Timestamp fixes
    if (category === 'keys.created_at.missing') {
      return {
        sql: `ALTER TABLE ${tableName} ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();`,
        description: `Add created_at to ${tableName}`,
        rule: category,
        severity: 'recommended'
      }
    }
    
    if (category === 'keys.updated_at.missing') {
      return {
        sql: `ALTER TABLE ${tableName} ADD COLUMN updated_at TIMESTAMPTZ;`,
        description: `Add updated_at to ${tableName}`,
        rule: category,
        severity: 'recommended'
      }
    }
    
    // 2. user_id fixes
    if (category === 'user_id.missing') {
      return {
        sql: `ALTER TABLE ${tableName} ADD COLUMN user_id TEXT NOT NULL;
CREATE INDEX idx_${tableName}_user_id ON ${tableName}(user_id);`,
        description: `Add user_id to ${tableName}`,
        rule: category,
        severity: 'critical'
      }
    }
    
    if (category === 'user_id.wrong_type') {
      // This is tricky - requires data migration
      return {
        sql: `-- WARNING: Manual migration required
-- Cannot auto-convert UUID user_id to TEXT
-- Steps:
-- 1. Add new column: ALTER TABLE ${tableName} ADD COLUMN user_id_new TEXT;
-- 2. Migrate data: UPDATE ${tableName} SET user_id_new = user_id::TEXT;
-- 3. Drop old: ALTER TABLE ${tableName} DROP COLUMN user_id;
-- 4. Rename: ALTER TABLE ${tableName} RENAME COLUMN user_id_new TO user_id;`,
        description: `Fix user_id type in ${tableName} (manual migration needed)`,
        rule: category,
        severity: 'critical'
      }
    }
    
    // 3. RLS fixes
    if (category === 'rls.not_enabled') {
      return {
        sql: `ALTER TABLE ${tableName} ENABLE ROW LEVEL SECURITY;
CREATE POLICY "${tableName}_allow_all" ON ${tableName} 
FOR ALL 
USING (true);

COMMENT ON POLICY "${tableName}_allow_all" ON ${tableName} IS 
  'Permissive policy - handle auth in API layer (NextAuth compatible)';`,
        description: `Enable RLS on ${tableName}`,
        rule: category,
        severity: 'critical'
      }
    }
    
    if (category === 'rls.no_policies') {
      return {
        sql: `CREATE POLICY "${tableName}_allow_all" ON ${tableName} 
FOR ALL 
USING (true);

COMMENT ON POLICY "${tableName}_allow_all" ON ${tableName} IS 
  'Permissive policy - handle auth in API layer (NextAuth compatible)';`,
        description: `Add permissive policy to ${tableName}`,
        rule: category,
        severity: 'critical'
      }
    }
    
    // 4. Primary key fix
    if (category === 'keys.primary_key.missing') {
      return {
        sql: `ALTER TABLE ${tableName} ADD COLUMN id UUID PRIMARY KEY DEFAULT gen_random_uuid();`,
        description: `Add primary key to ${tableName}`,
        rule: category,
        severity: 'critical'
      }
    }
    
    // 5. Reserved word fixes (rename)
    if (category.startsWith('reserved_word')) {
      const oldName = tableName
      const newName = this.fixReservedWordName(oldName)
      return {
        sql: `ALTER TABLE ${oldName} RENAME TO ${newName};`,
        description: `Rename reserved word table ${oldName} → ${newName}`,
        rule: category,
        severity: 'critical'
      }
    }
    
    // 6. Foreign key index
    if (category.startsWith('indexes.')) {
      const columnName = issue.column || this.extractColumnName(issue.message)
      if (columnName) {
        return {
          sql: `CREATE INDEX idx_${tableName}_${columnName} ON ${tableName}(${columnName});`,
          description: `Add index on ${tableName}(${columnName})`,
          rule: category,
          severity: 'recommended'
        }
      }
    }
    
    // 7. Table comment
    if (category === 'documentation.table_comment') {
      return {
        sql: `COMMENT ON TABLE ${tableName} IS 'TODO: Add table description';`,
        description: `Add comment to ${tableName}`,
        rule: category,
        severity: 'recommended'
      }
    }
    
    // 8. auth.uid() policy fix
    if (category === 'anti_patterns.auth_uid') {
      const policyName = this.extractPolicyName(issue.message)
      return {
        sql: `-- WARNING: Manual fix required for policy: ${policyName}
-- Do NOT use auth.uid() with NextAuth - it returns NULL
-- 
-- Replace:
--   CREATE POLICY ${policyName} ON ${tableName} USING (auth.uid() = user_id);
--
-- With:
--   DROP POLICY ${policyName} ON ${tableName};
--   CREATE POLICY ${policyName} ON ${tableName} USING (true);
--   -- Handle auth in API layer`,
        description: `Fix auth.uid() in policy ${policyName} (manual fix required)`,
        rule: category,
        severity: 'critical'
      }
    }
    
    // 9. Naming convention fixes
    if (category.startsWith('naming.tables.')) {
      if (issue.message.includes('plural')) {
        const singular = tableName
        const plural = this.makePlural(singular)
        return {
          sql: `ALTER TABLE ${singular} RENAME TO ${plural};`,
          description: `Make table name plural: ${singular} → ${plural}`,
          rule: category,
          severity: 'recommended'
        }
      }
    }
    
    return null
  }
  
  /**
   * Generate a migration file with fixes
   */
  async generateMigrationFile(
    tableName: string,
    fixes: FixMigration[],
    options: {
      outputDir?: string
    } = {}
  ): Promise<string> {
    const now = new Date()
    const timestamp = now.toISOString().replace(/[-:]/g, '').split('.')[0].replace('T', '_')
    const filename = `${timestamp}_fix_${tableName}_linting.sql`
    
    const criticalFixes = fixes.filter(f => f.severity === 'critical')
    const recommendedFixes = fixes.filter(f => f.severity === 'recommended')
    
    const content = `-- Auto-generated fix migration for ${tableName}
-- Generated: ${now.toISOString()}
-- Fixes ${fixes.length} linting violation(s)

-- ============================================================================
-- CRITICAL FIXES (${criticalFixes.length})
-- ============================================================================

${criticalFixes.map(f => `-- ${f.description}
-- Rule: ${f.rule}
${f.sql}

`).join('\n')}

-- ============================================================================
-- RECOMMENDED FIXES (${recommendedFixes.length})
-- ============================================================================

${recommendedFixes.map(f => `-- ${f.description}
-- Rule: ${f.rule}
${f.sql}

`).join('\n')}
`
    
    const outputDir = options.outputDir || 'database/migrations'
    const fullPath = path.join(process.cwd(), outputDir, filename)
    
    // Ensure directory exists
    const dir = path.dirname(fullPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    
    fs.writeFileSync(fullPath, content)
    
    return fullPath
  }
  
  /**
   * Helper: Fix reserved word in name
   */
  private fixReservedWordName(name: string): string {
    // Simple strategy: add suffix
    return `${name}_table`
  }
  
  /**
   * Helper: Make singular name plural
   */
  private makePlural(singular: string): string {
    if (singular.endsWith('s')) return singular
    if (singular.endsWith('y')) return singular.slice(0, -1) + 'ies'
    if (singular.endsWith('x') || singular.endsWith('ch') || singular.endsWith('sh')) {
      return singular + 'es'
    }
    return singular + 's'
  }
  
  /**
   * Helper: Extract column name from message
   */
  private extractColumnName(message: string): string | null {
    const match = message.match(/column[s]?\s+"([^"]+)"|on\s+([a-z_]+)/i)
    return match ? (match[1] || match[2]) : null
  }
  
  /**
   * Helper: Extract policy name from message
   */
  private extractPolicyName(message: string): string | null {
    const match = message.match(/[Pp]olicy\s+"([^"]+)"/)
    return match ? match[1] : 'policy_name'
  }
}
