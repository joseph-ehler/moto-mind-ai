/**
 * DDL Generator
 * 
 * Generates SQL DDL from natural language prompts using GPT-4
 * Integrates with Phase 5 (vector search, linting) and Phase 6 (auto-fixes)
 */

import { EmbeddingManager } from './embedding-manager'
import { SchemaLinter } from '../linting/schema-linter'
import { Database } from '../core'
import OpenAI from 'openai'

export interface TableIntent {
  tableName: string
  description: string
  columns: ColumnIntent[]
  indexes: IndexIntent[]
  foreignKeys: ForeignKeyIntent[]
  constraints: ConstraintIntent[]
  rlsEnabled: boolean
  policies: PolicyIntent[]
}

export interface ColumnIntent {
  name: string
  type: string
  nullable: boolean
  default?: string
  description?: string
}

export interface IndexIntent {
  columns: string[]
  unique: boolean
}

export interface ForeignKeyIntent {
  column: string
  references: {
    table: string
    column: string
  }
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT'
}

export interface ConstraintIntent {
  type: 'check' | 'unique'
  expression: string
}

export interface PolicyIntent {
  name: string
  operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'ALL'
  using: string
}

export interface GeneratedDDL {
  sql: string
  tableName: string
  intent: TableIntent
  duplicateCheck: {
    found: boolean
    matches: Array<{ name: string; similarity: number; reason: string }>
  }
  lintResults?: {
    passed: boolean
    issues: any[]
  }
  recommendation: 'PROCEED' | 'REUSE_EXISTING' | 'REVIEW_SIMILAR'
  warnings: string[]
}

export class DDLGenerator {
  private openai: OpenAI
  
  constructor(
    private db: Database,
    private embeddingManager: EmbeddingManager,
    private linter: SchemaLinter
  ) {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required')
    }
    this.openai = new OpenAI({ apiKey })
  }
  
  /**
   * Generate DDL from natural language prompt
   */
  async generateFromPrompt(
    prompt: string,
    options: {
      domain?: string
      dryRun?: boolean
    } = {}
  ): Promise<GeneratedDDL> {
    const warnings: string[] = []
    
    // 1. Parse intent with GPT-4
    console.log('🤖 Parsing intent with AI...')
    const intent = await this.parseIntent(prompt, options.domain)
    
    // 2. Check for duplicates using Phase 5 vector search
    console.log('🔎 Checking for similar tables...')
    const duplicateCheck = await this.checkDuplicates(intent, options.domain)
    
    // High similarity = strong recommendation to reuse
    if (duplicateCheck.found && duplicateCheck.matches[0].similarity > 0.7) {
      warnings.push(`Very similar table exists: ${duplicateCheck.matches[0].name} (${(duplicateCheck.matches[0].similarity * 100).toFixed(1)}%)`)
      return {
        sql: '',
        tableName: intent.tableName,
        intent,
        duplicateCheck,
        lintResults: { passed: true, issues: [] },
        recommendation: 'REUSE_EXISTING',
        warnings
      }
    }
    
    // Medium similarity = review recommended
    if (duplicateCheck.found && duplicateCheck.matches[0].similarity > 0.5) {
      warnings.push(`Similar table(s) found - review before creating`)
    }
    
    // 3. Generate SQL with best practices
    console.log('✨ Generating SQL...')
    const sql = this.generateSQL(intent)
    
    // 4. Validate with Phase 5 linting (conceptually - would need temp table)
    console.log('📋 Validating generated schema...')
    const lintResults = this.validateIntent(intent)
    
    if (!lintResults.passed) {
      warnings.push(`Generated schema has ${lintResults.issues.length} issue(s)`)
    }
    
    const recommendation = duplicateCheck.found && duplicateCheck.matches[0].similarity > 0.5
      ? 'REVIEW_SIMILAR'
      : lintResults.passed
      ? 'PROCEED'
      : 'PROCEED' // Still allow with warnings
    
    return {
      sql,
      tableName: intent.tableName,
      intent,
      duplicateCheck,
      lintResults,
      recommendation,
      warnings
    }
  }
  
  /**
   * Parse natural language into structured intent using GPT-4
   */
  private async parseIntent(prompt: string, domain?: string): Promise<TableIntent> {
    const systemPrompt = `You are a PostgreSQL schema designer for a NextAuth-based application.

CRITICAL RULES (Never violate these):
1. user_id is ALWAYS TEXT (NextAuth uses TEXT IDs like "104135...", not UUID)
2. NEVER use auth.uid() in RLS policies (returns NULL with NextAuth)
3. ALWAYS add created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
4. ALWAYS add updated_at TIMESTAMPTZ (nullable, for tracking updates)
5. Use gen_random_uuid() for id columns (not uuid_generate_v4())
6. Add indexes on ALL foreign keys automatically
7. Add index on user_id (very important for multi-tenant queries)
8. Use snake_case naming (never camelCase)
9. Tables MUST be plural (e.g., "vehicle_notes" not "vehicle_note")
10. Enable RLS on ALL user-facing tables
11. Use permissive RLS policies (USING (true)) - we handle auth in API layer
12. Always include table and policy comments explaining purpose

${domain ? `Domain: ${domain} (add relevant indexes for this domain)` : ''}

Parse the user's intent and return a JSON schema definition.
Be smart about inferring relationships (e.g., "vehicle notes" clearly references vehicles table).

Return ONLY valid JSON matching this structure (no markdown, no extra text):
{
  "tableName": "vehicle_notes",
  "description": "User notes for vehicles",
  "columns": [
    {
      "name": "id",
      "type": "UUID",
      "nullable": false,
      "default": "gen_random_uuid()",
      "description": "Primary key"
    },
    {
      "name": "vehicle_id",
      "type": "UUID",
      "nullable": false,
      "description": "Reference to vehicles table"
    },
    {
      "name": "user_id",
      "type": "TEXT",
      "nullable": false,
      "description": "NextAuth user ID (TEXT type)"
    },
    {
      "name": "note",
      "type": "TEXT",
      "nullable": false,
      "description": "User's note content"
    },
    {
      "name": "created_at",
      "type": "TIMESTAMPTZ",
      "nullable": false,
      "default": "NOW()"
    },
    {
      "name": "updated_at",
      "type": "TIMESTAMPTZ",
      "nullable": true
    }
  ],
  "indexes": [
    { "columns": ["vehicle_id"], "unique": false },
    { "columns": ["user_id"], "unique": false }
  ],
  "foreignKeys": [
    {
      "column": "vehicle_id",
      "references": { "table": "vehicles", "column": "id" },
      "onDelete": "CASCADE"
    }
  ],
  "constraints": [],
  "rlsEnabled": true,
  "policies": [
    {
      "name": "allow_all",
      "operation": "ALL",
      "using": "true"
    }
  ]
}`

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3
    })
    
    const content = response.choices[0].message.content
    if (!content) {
      throw new Error('No response from AI')
    }
    
    const parsed = JSON.parse(content) as TableIntent
    
    // Validate that required columns are present
    this.validateRequiredColumns(parsed)
    
    return parsed
  }
  
  /**
   * Validate that intent has required columns
   */
  private validateRequiredColumns(intent: TableIntent): void {
    const columnNames = intent.columns.map(c => c.name)
    
    // Check for required columns
    if (!columnNames.includes('id')) {
      intent.columns.unshift({
        name: 'id',
        type: 'UUID',
        nullable: false,
        default: 'gen_random_uuid()',
        description: 'Primary key'
      })
    }
    
    if (!columnNames.includes('created_at')) {
      intent.columns.push({
        name: 'created_at',
        type: 'TIMESTAMPTZ',
        nullable: false,
        default: 'NOW()'
      })
    }
    
    if (!columnNames.includes('updated_at')) {
      intent.columns.push({
        name: 'updated_at',
        type: 'TIMESTAMPTZ',
        nullable: true
      })
    }
    
    // Check user_id is TEXT if present
    const userIdCol = intent.columns.find(c => c.name === 'user_id')
    if (userIdCol && userIdCol.type === 'UUID') {
      userIdCol.type = 'TEXT'
      userIdCol.description = 'NextAuth user ID (TEXT type, not UUID)'
    }
  }
  
  /**
   * Check for similar existing tables using Phase 5 vector search
   */
  private async checkDuplicates(
    intent: TableIntent,
    domain?: string
  ): Promise<{ found: boolean; matches: Array<{ name: string; similarity: number; reason: string }> }> {
    const searchText = `${intent.tableName} ${intent.description} ${intent.columns.map(c => c.name).join(' ')}`
    
    try {
      const results = await this.embeddingManager.findSimilar(searchText, {
        domain: domain || undefined,
        threshold: 0.4,
        limit: 5
      })
      
      return {
        found: results.length > 0,
        matches: results.map(r => ({
          name: `${r.schema_name}.${r.name}`,
          similarity: r.similarity,
          reason: r.description || 'Similar table structure detected'
        }))
      }
    } catch (error) {
      // If vector search fails, continue without duplicate check
      console.warn('Vector search failed:', error)
      return { found: false, matches: [] }
    }
  }
  
  /**
   * Validate intent against linting rules
   */
  private validateIntent(intent: TableIntent): { passed: boolean; issues: any[] } {
    const issues: any[] = []
    
    // Check naming
    if (!intent.tableName.match(/^[a-z][a-z0-9_]*s$/)) {
      issues.push({
        severity: 'warning',
        message: `Table name "${intent.tableName}" should be plural and snake_case`
      })
    }
    
    // Check for user_id on user-facing tables
    const hasUserId = intent.columns.some(c => c.name === 'user_id')
    if (!hasUserId && intent.rlsEnabled) {
      issues.push({
        severity: 'warning',
        message: 'User-facing table should have user_id column'
      })
    }
    
    // Check user_id type
    const userIdCol = intent.columns.find(c => c.name === 'user_id')
    if (userIdCol && userIdCol.type !== 'TEXT') {
      issues.push({
        severity: 'error',
        message: 'user_id must be TEXT for NextAuth compatibility'
      })
    }
    
    // Check for auth.uid() in policies
    for (const policy of intent.policies) {
      if (policy.using.includes('auth.uid()')) {
        issues.push({
          severity: 'error',
          message: 'Policy uses auth.uid() which returns NULL with NextAuth'
        })
      }
    }
    
    return {
      passed: issues.filter(i => i.severity === 'error').length === 0,
      issues
    }
  }
  
  /**
   * Generate SQL from intent
   */
  private generateSQL(intent: TableIntent): string {
    const parts: string[] = []
    
    // Header comment
    parts.push('-- Auto-generated by AI DDL Generator')
    parts.push(`-- Description: ${intent.description}`)
    parts.push(`-- Generated: ${new Date().toISOString()}`)
    parts.push('')
    
    // CREATE TABLE
    parts.push(`CREATE TABLE ${intent.tableName} (`)
    
    const columnDefs = intent.columns.map((col, idx) => {
      let def = `  ${col.name} ${col.type}`
      if (!col.nullable) def += ' NOT NULL'
      if (col.default) {
        // Handle different default types
        if (col.default.includes('(')) {
          def += ` DEFAULT ${col.default}` // Function call
        } else {
          def += ` DEFAULT ${col.default}` // Literal
        }
      }
      if (idx < intent.columns.length - 1) def += ','
      return def
    })
    
    parts.push(columnDefs.join('\n'))
    parts.push(');')
    parts.push('')
    
    // PRIMARY KEY (if not already in column def)
    if (intent.columns.some(c => c.name === 'id')) {
      parts.push(`ALTER TABLE ${intent.tableName} ADD PRIMARY KEY (id);`)
      parts.push('')
    }
    
    // INDEXES
    for (const index of intent.indexes) {
      const indexName = `idx_${intent.tableName}_${index.columns.join('_')}`
      const unique = index.unique ? 'UNIQUE ' : ''
      parts.push(`CREATE ${unique}INDEX ${indexName} ON ${intent.tableName}(${index.columns.join(', ')});`)
    }
    
    if (intent.indexes.length > 0) parts.push('')
    
    // FOREIGN KEYS
    for (const fk of intent.foreignKeys) {
      const constraintName = `fk_${intent.tableName}_${fk.column}`
      const onDelete = fk.onDelete ? ` ON DELETE ${fk.onDelete}` : ''
      parts.push(`ALTER TABLE ${intent.tableName}`)
      parts.push(`  ADD CONSTRAINT ${constraintName}`)
      parts.push(`  FOREIGN KEY (${fk.column})`)
      parts.push(`  REFERENCES ${fk.references.table}(${fk.references.column})${onDelete};`)
      parts.push('')
    }
    
    // CONSTRAINTS
    for (const constraint of intent.constraints) {
      if (constraint.type === 'check') {
        parts.push(`ALTER TABLE ${intent.tableName} ADD CHECK (${constraint.expression});`)
      } else if (constraint.type === 'unique') {
        parts.push(`ALTER TABLE ${intent.tableName} ADD UNIQUE (${constraint.expression});`)
      }
    }
    
    if (intent.constraints.length > 0) parts.push('')
    
    // RLS
    if (intent.rlsEnabled) {
      parts.push(`-- Enable Row Level Security`)
      parts.push(`ALTER TABLE ${intent.tableName} ENABLE ROW LEVEL SECURITY;`)
      parts.push('')
      
      for (const policy of intent.policies) {
        const policyName = `${intent.tableName}_${policy.name}`
        parts.push(`CREATE POLICY "${policyName}"`)
        parts.push(`  ON ${intent.tableName}`)
        parts.push(`  FOR ${policy.operation}`)
        parts.push(`  USING (${policy.using});`)
        parts.push('')
        
        // Add comment explaining permissive policy
        if (policy.using === 'true') {
          parts.push(`COMMENT ON POLICY "${policyName}" ON ${intent.tableName} IS`)
          parts.push(`  'Permissive policy - authorization handled in API layer (NextAuth compatible)';`)
          parts.push('')
        }
      }
    }
    
    // TABLE COMMENT
    parts.push(`COMMENT ON TABLE ${intent.tableName} IS '${intent.description}';`)
    
    return parts.join('\n')
  }
  
  /**
   * Save generated DDL as migration file
   */
  async saveMigration(ddl: GeneratedDDL, filename?: string): Promise<string> {
    const fs = await import('fs')
    const path = await import('path')
    
    const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0].replace('T', '_')
    const name = filename || ddl.tableName
    const migrationName = `${timestamp}_create_${name}.sql`
    const migrationPath = path.join(process.cwd(), 'database/migrations', migrationName)
    
    // Ensure directory exists
    const dir = path.dirname(migrationPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    
    fs.writeFileSync(migrationPath, ddl.sql)
    
    return migrationPath
  }
}
