/**
 * Schema Linter
 * 
 * Validates database schema against defined rules from schema-lints.yml
 * Features:
 * - Naming conventions (tables, columns, enums)
 * - Required keys (id, created_at, updated_at)
 * - RLS validation (NextAuth-specific)
 * - Index recommendations
 * - Anti-pattern detection
 */

import * as yaml from 'js-yaml'
import * as fs from 'fs'
import * as path from 'path'
import { Database } from '../core'

export interface LintRule {
  category: string
  table?: string
  column?: string
  severity: 'error' | 'warning' | 'info'
  message: string
  fix?: string
}

export interface LintResult {
  passed: boolean
  total_tables: number
  passing_tables: number
  blockers: LintRule[]   // severity: error (must fix)
  warnings: LintRule[]   // severity: warning (should review)
  info: LintRule[]       // severity: info (suggestions)
}

interface SchemaRules {
  naming?: any
  keys?: any
  rls?: any
  user_id?: any
  indexes?: any
  documentation?: any
  domains?: any
  reserved_words?: any
  anti_patterns?: any
}

export class SchemaLinter {
  private rules: SchemaRules
  private db: Database

  constructor(db: Database, rulesPath?: string) {
    this.db = db
    const defaultPath = path.join(process.cwd(), 'tools/db/schema-lints.yml')
    const filePath = rulesPath || defaultPath
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`Rules file not found: ${filePath}`)
    }
    
    this.rules = yaml.load(fs.readFileSync(filePath, 'utf-8')) as SchemaRules
  }

  /**
   * Lint entire schema
   */
  async lintSchema(schemaName = 'public'): Promise<LintResult> {
    const issues: LintRule[] = []

    // Get all tables
    const result = await this.db.query(`
      SELECT 
        t.table_name,
        t.table_type,
        obj_description((t.table_schema || '.' || t.table_name)::regclass) as table_comment,
        (
          SELECT COUNT(*)
          FROM pg_policies p
          WHERE p.schemaname = t.table_schema
          AND p.tablename = t.table_name
        ) as policy_count,
        (
          SELECT relrowsecurity
          FROM pg_class c
          JOIN pg_namespace n ON c.relnamespace = n.oid
          WHERE n.nspname = t.table_schema
          AND c.relname = t.table_name
        ) as rls_enabled
      FROM information_schema.tables t
      WHERE t.table_schema = $1
      AND t.table_type = 'BASE TABLE'
      ORDER BY t.table_name
    `, { params: [schemaName] })

    for (const table of result.rows) {
      issues.push(...await this.lintTable(table.table_name, schemaName))
    }

    return this.categorizeIssues(issues, result.rows.length)
  }

  /**
   * Lint specific table
   */
  async lintTable(tableName: string, schemaName = 'public'): Promise<LintRule[]> {
    const issues: LintRule[] = []

    // Get table info
    const tableInfo = await this.getTableInfo(tableName, schemaName)
    
    if (!tableInfo) {
      return [{
        category: 'table.not_found',
        table: tableName,
        severity: 'error',
        message: `Table "${tableName}" not found in schema "${schemaName}"`
      }]
    }

    // Check naming rules
    issues.push(...this.checkNaming(tableInfo))

    // Check key requirements
    issues.push(...this.checkKeys(tableInfo))

    // Check RLS rules
    issues.push(...this.checkRLS(tableInfo))

    // Check user_id requirements
    issues.push(...this.checkUserId(tableInfo))

    // Check indexes
    issues.push(...this.checkIndexes(tableInfo))

    // Check documentation
    issues.push(...this.checkDocumentation(tableInfo))

    // Check anti-patterns
    issues.push(...await this.checkAntiPatterns(tableInfo))

    return issues
  }

  private async getTableInfo(tableName: string, schemaName: string) {
    // Get columns
    const columnsResult = await this.db.query(`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default,
        udt_name
      FROM information_schema.columns
      WHERE table_schema = $1
      AND table_name = $2
      ORDER BY ordinal_position
    `, { params: [schemaName, tableName] })

    // Get RLS info
    const rlsResult = await this.db.query(`
      SELECT 
        relrowsecurity as rls_enabled,
        obj_description(c.oid) as table_comment
      FROM pg_class c
      JOIN pg_namespace n ON c.relnamespace = n.oid
      WHERE n.nspname = $1
      AND c.relname = $2
    `, { params: [schemaName, tableName] })

    // Get policies
    const policiesResult = await this.db.query(`
      SELECT 
        policyname,
        cmd,
        qual,
        with_check
      FROM pg_policies
      WHERE schemaname = $1
      AND tablename = $2
    `, { params: [schemaName, tableName] })

    // Get indexes
    const indexesResult = await this.db.query(`
      SELECT 
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = $1
      AND tablename = $2
    `, { params: [schemaName, tableName] })

    if (columnsResult.rows.length === 0) {
      return null
    }

    return {
      name: tableName,
      schema: schemaName,
      columns: columnsResult.rows,
      rls_enabled: rlsResult.rows[0]?.rls_enabled || false,
      table_comment: rlsResult.rows[0]?.table_comment,
      policies: policiesResult.rows,
      indexes: indexesResult.rows
    }
  }

  private checkNaming(table: any): LintRule[] {
    const issues: LintRule[] = []

    // Check table naming
    if (this.rules.naming?.tables) {
      const rule = this.rules.naming.tables
      const exceptions = rule.exceptions || []

      if (!exceptions.includes(table.name)) {
        // Check pattern
        if (rule.pattern && !new RegExp(rule.pattern).test(table.name)) {
          issues.push({
            category: 'naming.tables.pattern',
            table: table.name,
            severity: rule.severity || 'error',
            message: `Table "${table.name}" violates naming pattern: ${rule.message}`
          })
        }

        // Check plural
        if (rule.plural && !table.name.endsWith('s') && !table.name.includes('_')) {
          issues.push({
            category: 'naming.tables.plural',
            table: table.name,
            severity: rule.severity || 'error',
            message: `Table "${table.name}" should be plural: ${rule.message}`,
            fix: `Rename to "${table.name}s"`
          })
        }
      }
    }

    // Check reserved words
    if (this.rules.reserved_words?.avoid) {
      const reserved = this.rules.reserved_words.avoid
      if (reserved.includes(table.name)) {
        issues.push({
          category: 'reserved_words',
          table: table.name,
          severity: this.rules.reserved_words.severity || 'error',
          message: `Table "${table.name}" is a reserved word: ${this.rules.reserved_words.message}`,
          fix: `Rename to "${table.name}s" or use a different name`
        })
      }
    }

    // Check column naming
    if (this.rules.naming?.columns) {
      const rule = this.rules.naming.columns
      const exceptions = rule.exceptions || []

      for (const column of table.columns) {
        if (!exceptions.includes(column.column_name)) {
          if (rule.pattern && !new RegExp(rule.pattern).test(column.column_name)) {
            issues.push({
              category: 'naming.columns.pattern',
              table: table.name,
              column: column.column_name,
              severity: rule.severity || 'warning',
              message: `Column "${table.name}.${column.column_name}" violates naming pattern: ${rule.message}`
            })
          }
        }
      }
    }

    return issues
  }

  private checkKeys(table: any): LintRule[] {
    const issues: LintRule[] = []

    // Check primary key
    if (this.rules.keys?.primary_key?.required) {
      const rule = this.rules.keys.primary_key
      const idColumn = table.columns.find((c: any) => c.column_name === rule.name)

      if (!idColumn) {
        issues.push({
          category: 'keys.primary_key.missing',
          table: table.name,
          severity: rule.severity || 'error',
          message: `Table "${table.name}" missing ${rule.name} column: ${rule.message}`,
          fix: `ALTER TABLE ${table.name} ADD COLUMN ${rule.name} ${rule.type} PRIMARY KEY DEFAULT ${rule.default}()`
        })
      } else if (idColumn.udt_name !== rule.type) {
        issues.push({
          category: 'keys.primary_key.wrong_type',
          table: table.name,
          column: rule.name,
          severity: rule.severity || 'error',
          message: `Column "${table.name}.${rule.name}" should be ${rule.type}, not ${idColumn.udt_name}`,
          fix: `ALTER TABLE ${table.name} ALTER COLUMN ${rule.name} TYPE ${rule.type}`
        })
      }
    }

    // Check created_at
    if (this.rules.keys?.created_at?.required) {
      const rule = this.rules.keys.created_at
      const createdAtColumn = table.columns.find((c: any) => c.column_name === 'created_at')

      if (!createdAtColumn) {
        issues.push({
          category: 'keys.created_at.missing',
          table: table.name,
          severity: rule.severity || 'warning',
          message: `Table "${table.name}" missing created_at column: ${rule.message}`,
          fix: `ALTER TABLE ${table.name} ADD COLUMN created_at ${rule.type} NOT NULL DEFAULT ${rule.default}()`
        })
      }
    }

    // Check updated_at (recommended)
    if (this.rules.keys?.updated_at?.recommended) {
      const rule = this.rules.keys.updated_at
      const updatedAtColumn = table.columns.find((c: any) => c.column_name === 'updated_at')

      if (!updatedAtColumn) {
        issues.push({
          category: 'keys.updated_at.missing',
          table: table.name,
          severity: rule.severity || 'info',
          message: `Table "${table.name}" missing updated_at column: ${rule.message}`,
          fix: `ALTER TABLE ${table.name} ADD COLUMN updated_at timestamptz`
        })
      }
    }

    return issues
  }

  private checkRLS(table: any): LintRule[] {
    const issues: LintRule[] = []
    const domain = this.inferDomain(table.name)

    // Check if RLS should be enabled
    if (this.rules.rls?.enabled?.required_for_domains) {
      const requiredDomains = this.rules.rls.enabled.required_for_domains
      
      if (requiredDomains.includes(domain)) {
        if (!table.rls_enabled) {
          issues.push({
            category: 'rls.not_enabled',
            table: table.name,
            severity: this.rules.rls.enabled.severity || 'error',
            message: `Table "${table.name}" in domain "${domain}" must have RLS enabled: ${this.rules.rls.enabled.message}`,
            fix: `npm run db rls:enable ${table.name}`
          })
        }
      }
    }

    // Check if policies exist
    if (table.rls_enabled && this.rules.rls?.policies?.required) {
      if (table.policies.length === 0) {
        issues.push({
          category: 'rls.no_policies',
          table: table.name,
          severity: this.rules.rls.policies.severity || 'error',
          message: `Table "${table.name}" has RLS enabled but no policies: ${this.rules.rls.policies.message}`,
          fix: `npm run db rls:apply-nextauth ${table.name}`
        })
      }
    }

    // TODO: Check policy comments (requires more complex query)
    // Skipping for now to simplify implementation

    return issues
  }

  private checkUserId(table: any): LintRule[] {
    const issues: LintRule[] = []
    const domain = this.inferDomain(table.name)

    // Check user_id requirements
    if (this.rules.user_id?.required_for_domains) {
      const requiredDomains = this.rules.user_id.required_for_domains
      
      if (requiredDomains.includes(domain)) {
        const userIdColumn = table.columns.find((c: any) => c.column_name === 'user_id')

        if (!userIdColumn) {
          issues.push({
            category: 'user_id.missing',
            table: table.name,
            severity: this.rules.user_id.severity || 'error',
            message: `Table "${table.name}" in domain "${domain}" missing user_id: ${this.rules.user_id.message}`,
            fix: `ALTER TABLE ${table.name} ADD COLUMN user_id ${this.rules.user_id.type} NOT NULL`
          })
        } else if (userIdColumn.udt_name !== this.rules.user_id.type) {
          issues.push({
            category: 'user_id.wrong_type',
            table: table.name,
            column: 'user_id',
            severity: this.rules.user_id.severity || 'error',
            message: `Column "${table.name}.user_id" should be ${this.rules.user_id.type}, not ${userIdColumn.udt_name}. ${this.rules.user_id.message}`,
            fix: `ALTER TABLE ${table.name} ALTER COLUMN user_id TYPE ${this.rules.user_id.type}`
          })
        }
      }
    }

    return issues
  }

  private checkIndexes(table: any): LintRule[] {
    const issues: LintRule[] = []

    // Check user_id index
    if (this.rules.indexes?.user_id?.required) {
      const userIdColumn = table.columns.find((c: any) => c.column_name === 'user_id')
      
      if (userIdColumn) {
        const hasIndex = table.indexes.some((idx: any) => 
          idx.indexdef.includes('user_id')
        )

        if (!hasIndex) {
          issues.push({
            category: 'indexes.user_id',
            table: table.name,
            column: 'user_id',
            severity: this.rules.indexes.user_id.severity || 'warning',
            message: `Column "${table.name}.user_id" missing index: ${this.rules.indexes.user_id.message}`,
            fix: `CREATE INDEX idx_${table.name}_user_id ON ${table.name}(user_id)`
          })
        }
      }
    }

    return issues
  }

  private checkDocumentation(table: any): LintRule[] {
    const issues: LintRule[] = []

    // Check table comment
    if (this.rules.documentation?.table_comments?.recommended) {
      if (!table.table_comment) {
        issues.push({
          category: 'documentation.table_comment',
          table: table.name,
          severity: this.rules.documentation.table_comments.severity || 'info',
          message: `Table "${table.name}" missing COMMENT: ${this.rules.documentation.table_comments.message}`,
          fix: `COMMENT ON TABLE ${table.name} IS 'Description of purpose'`
        })
      }
    }

    return issues
  }

  private async checkAntiPatterns(table: any): Promise<LintRule[]> {
    const issues: LintRule[] = []

    // Check for auth.uid() in policies
    if (this.rules.anti_patterns?.auth_uid_in_policies) {
      const rule = this.rules.anti_patterns.auth_uid_in_policies
      
      for (const policy of table.policies) {
        if (policy.qual?.includes('auth.uid()') || policy.with_check?.includes('auth.uid()')) {
          issues.push({
            category: 'anti_patterns.auth_uid',
            table: table.name,
            severity: rule.severity || 'error',
            message: `Policy "${policy.policyname}" on "${table.name}" uses auth.uid(): ${rule.message}`,
            fix: `Update policy to use USING (true) and handle auth in API`
          })
        }
      }
    }

    // Check UUID user_id anti-pattern
    if (this.rules.anti_patterns?.uuid_user_id) {
      const rule = this.rules.anti_patterns.uuid_user_id
      const checkTables = rule.check_tables || []
      
      if (checkTables.includes(table.name)) {
        const userIdColumn = table.columns.find((c: any) => c.column_name === 'user_id')
        
        if (userIdColumn && userIdColumn.udt_name === 'uuid') {
          issues.push({
            category: 'anti_patterns.uuid_user_id',
            table: table.name,
            column: 'user_id',
            severity: rule.severity || 'error',
            message: `Table "${table.name}" uses UUID for user_id: ${rule.message}`,
            fix: `ALTER TABLE ${table.name} ALTER COLUMN user_id TYPE text`
          })
        }
      }
    }

    return issues
  }

  private inferDomain(tableName: string): string {
    // Infer domain from table name
    if (tableName.includes('vehicle')) return 'vehicles'
    if (tableName.includes('trip')) return 'trips'
    if (tableName.includes('maintenance')) return 'maintenance'
    if (tableName.includes('expense')) return 'expenses'
    if (tableName.includes('tracking')) return 'tracking'
    return 'unknown'
  }

  private categorizeIssues(issues: LintRule[], totalTables: number): LintResult {
    const blockers = issues.filter(i => i.severity === 'error')
    const warnings = issues.filter(i => i.severity === 'warning')
    const info = issues.filter(i => i.severity === 'info')

    // Count unique tables with issues
    const tablesWithBlockers = new Set(blockers.map(i => i.table).filter(Boolean))
    const passingTables = totalTables - tablesWithBlockers.size

    return {
      passed: blockers.length === 0,
      total_tables: totalTables,
      passing_tables: passingTables,
      blockers,
      warnings,
      info
    }
  }
}
