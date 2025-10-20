/**
 * Migration Generator
 * 
 * Generate database migrations:
 * - From schema diffs
 * - From templates
 * - Auto-create migration files
 * - Validate and format SQL
 */

import { QueryExecutor } from '../core/query-executor'
import { SchemaInspector } from './schema-inspector'
import { promises as fs } from 'fs'
import path from 'path'

export interface MigrationTemplate {
  name: string
  description: string
  template: string
  variables: Record<string, { type: string; description: string; required: boolean }>
}

export interface GeneratedMigration {
  filename: string
  content: string
  path?: string
}

export class MigrationGenerator {
  private schemaInspector: SchemaInspector
  
  constructor(private queryExecutor: QueryExecutor) {
    this.schemaInspector = new SchemaInspector(queryExecutor)
  }
  
  /**
   * Generate a migration filename with timestamp
   */
  generateFilename(name: string): string {
    const now = new Date()
    const timestamp = now.toISOString()
      .replace(/[-:]/g, '')
      .replace('T', '_')
      .split('.')[0]
    
    // Clean the name
    const cleanName = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
    
    return `${timestamp}_${cleanName}.sql`
  }
  
  /**
   * Create a migration file
   */
  async createMigrationFile(
    directory: string,
    name: string,
    content: string
  ): Promise<GeneratedMigration> {
    const filename = this.generateFilename(name)
    const filepath = path.join(directory, filename)
    
    // Ensure directory exists
    await fs.mkdir(directory, { recursive: true })
    
    // Write file
    await fs.writeFile(filepath, content, 'utf-8')
    
    return {
      filename,
      content,
      path: filepath
    }
  }
  
  /**
   * Generate migration from schema diff
   */
  async generateFromDiff(
    schema1: string,
    schema2: string,
    options: {
      name?: string
      includeData?: boolean
    } = {}
  ): Promise<GeneratedMigration> {
    const diff = await this.schemaInspector.compareSchemas(schema1, schema2)
    
    const sqlStatements: string[] = []
    
    // Header comment
    sqlStatements.push(`-- Migration: ${options.name || 'Schema Diff'}`)
    sqlStatements.push(`-- Generated: ${new Date().toISOString()}`)
    sqlStatements.push(`-- From: ${schema1} → To: ${schema2}`)
    sqlStatements.push('')
    
    // New tables
    if (diff.tablesOnlyIn2.length > 0) {
      sqlStatements.push('-- New Tables')
      sqlStatements.push('')
      
      for (const tableName of diff.tablesOnlyIn2) {
        sqlStatements.push(`-- Create table: ${tableName}`)
        sqlStatements.push(`-- TODO: Add CREATE TABLE statement for ${tableName}`)
        sqlStatements.push('')
      }
    }
    
    // Dropped tables
    if (diff.tablesOnlyIn1.length > 0) {
      sqlStatements.push('-- Dropped Tables (commented out for safety)')
      sqlStatements.push('')
      
      for (const tableName of diff.tablesOnlyIn1) {
        sqlStatements.push(`-- DROP TABLE IF EXISTS ${schema1}.${tableName};`)
      }
      sqlStatements.push('')
    }
    
    // Table differences
    if (diff.differences.length > 0) {
      sqlStatements.push('-- Table Modifications')
      sqlStatements.push('')
      
      for (const difference of diff.differences) {
        sqlStatements.push(`-- ${difference.table}: ${difference.type} - ${difference.change}`)
        sqlStatements.push(`-- Details: ${difference.details}`)
        sqlStatements.push(`-- TODO: Add appropriate ALTER TABLE statement`)
        sqlStatements.push('')
      }
    }
    
    const content = sqlStatements.join('\n')
    
    return {
      filename: this.generateFilename(options.name || 'schema_diff'),
      content
    }
  }
  
  /**
   * Generate migration from template
   */
  generateFromTemplate(
    template: MigrationTemplate,
    variables: Record<string, any>
  ): GeneratedMigration {
    // Validate required variables
    for (const [key, config] of Object.entries(template.variables)) {
      if (config.required && !(key in variables)) {
        throw new Error(`Missing required variable: ${key}`)
      }
    }
    
    // Replace variables in template
    let content = template.template
    
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
      content = content.replace(regex, String(value))
    }
    
    return {
      filename: this.generateFilename(template.name),
      content
    }
  }
  
  /**
   * Generate CREATE TABLE migration
   */
  generateCreateTable(options: {
    tableName: string
    columns: Array<{
      name: string
      type: string
      nullable?: boolean
      default?: string
      primaryKey?: boolean
    }>
    indexes?: Array<{
      name: string
      columns: string[]
      unique?: boolean
    }>
    enableRLS?: boolean
  }): GeneratedMigration {
    const statements: string[] = []
    
    // Header
    statements.push(`-- Create table: ${options.tableName}`)
    statements.push(`-- Generated: ${new Date().toISOString()}`)
    statements.push('')
    
    // CREATE TABLE
    statements.push(`CREATE TABLE ${options.tableName} (`)
    
    const columnDefs = options.columns.map(col => {
      let def = `  ${col.name} ${col.type}`
      
      if (col.primaryKey) {
        def += ' PRIMARY KEY'
      }
      
      if (!col.nullable && !col.primaryKey) {
        def += ' NOT NULL'
      }
      
      if (col.default) {
        def += ` DEFAULT ${col.default}`
      }
      
      return def
    })
    
    statements.push(columnDefs.join(',\n'))
    statements.push(');')
    statements.push('')
    
    // Indexes
    if (options.indexes && options.indexes.length > 0) {
      statements.push('-- Indexes')
      
      for (const index of options.indexes) {
        const unique = index.unique ? 'UNIQUE ' : ''
        statements.push(
          `CREATE ${unique}INDEX ${index.name} ON ${options.tableName} (${index.columns.join(', ')});`
        )
      }
      
      statements.push('')
    }
    
    // RLS
    if (options.enableRLS) {
      statements.push('-- Enable RLS')
      statements.push(`ALTER TABLE ${options.tableName} ENABLE ROW LEVEL SECURITY;`)
      statements.push('')
      statements.push('-- Permissive policy (auth handled in API)')
      statements.push(
        `CREATE POLICY "Allow all operations on ${options.tableName}"\n` +
        `  ON ${options.tableName} FOR ALL\n` +
        `  USING (true) WITH CHECK (true);`
      )
      statements.push('')
      statements.push(
        `COMMENT ON POLICY "Allow all operations on ${options.tableName}" ON ${options.tableName} IS\n` +
        `  'Permissive - auth handled in API via NextAuth';`
      )
    }
    
    return {
      filename: this.generateFilename(`create_${options.tableName}`),
      content: statements.join('\n')
    }
  }
  
  /**
   * Generate ADD COLUMN migration
   */
  generateAddColumn(
    tableName: string,
    column: {
      name: string
      type: string
      nullable?: boolean
      default?: string
    }
  ): GeneratedMigration {
    const statements: string[] = []
    
    statements.push(`-- Add column: ${column.name} to ${tableName}`)
    statements.push(`-- Generated: ${new Date().toISOString()}`)
    statements.push('')
    
    let sql = `ALTER TABLE ${tableName} ADD COLUMN ${column.name} ${column.type}`
    
    if (!column.nullable) {
      sql += ' NOT NULL'
    }
    
    if (column.default) {
      sql += ` DEFAULT ${column.default}`
    }
    
    statements.push(sql + ';')
    
    return {
      filename: this.generateFilename(`add_${column.name}_to_${tableName}`),
      content: statements.join('\n')
    }
  }
  
  /**
   * Generate CREATE INDEX migration
   */
  generateCreateIndex(
    tableName: string,
    index: {
      name: string
      columns: string[]
      unique?: boolean
    }
  ): GeneratedMigration {
    const statements: string[] = []
    
    statements.push(`-- Create index: ${index.name}`)
    statements.push(`-- Generated: ${new Date().toISOString()}`)
    statements.push('')
    
    const unique = index.unique ? 'UNIQUE ' : ''
    statements.push(
      `CREATE ${unique}INDEX ${index.name} ON ${tableName} (${index.columns.join(', ')});`
    )
    
    return {
      filename: this.generateFilename(`create_index_${index.name}`),
      content: statements.join('\n')
    }
  }
  
  /**
   * Get built-in templates
   */
  getBuiltInTemplates(): MigrationTemplate[] {
    return [
      {
        name: 'create_table',
        description: 'Create a new table with RLS',
        template: `-- Create table: {{table_name}}
-- Generated: ${new Date().toISOString()}

CREATE TABLE {{table_name}} (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  {{columns}}
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
{{indexes}}

-- Enable RLS
ALTER TABLE {{table_name}} ENABLE ROW LEVEL SECURITY;

-- Permissive policy (auth handled in API)
CREATE POLICY "Allow all operations on {{table_name}}"
  ON {{table_name}} FOR ALL
  USING (true) WITH CHECK (true);

COMMENT ON POLICY "Allow all operations on {{table_name}}" ON {{table_name}} IS
  'Permissive - auth handled in API via NextAuth';
`,
        variables: {
          table_name: { type: 'string', description: 'Table name', required: true },
          columns: { type: 'string', description: 'Column definitions', required: true },
          indexes: { type: 'string', description: 'Index definitions', required: false }
        }
      },
      {
        name: 'add_column',
        description: 'Add a column to existing table',
        template: `-- Add column: {{column_name}} to {{table_name}}
-- Generated: ${new Date().toISOString()}

ALTER TABLE {{table_name}} ADD COLUMN {{column_name}} {{column_type}}{{nullable}}{{default}};
`,
        variables: {
          table_name: { type: 'string', description: 'Table name', required: true },
          column_name: { type: 'string', description: 'Column name', required: true },
          column_type: { type: 'string', description: 'Column type', required: true },
          nullable: { type: 'string', description: 'NOT NULL or empty', required: false },
          default: { type: 'string', description: 'DEFAULT value', required: false }
        }
      },
      {
        name: 'create_index',
        description: 'Create an index',
        template: `-- Create index: {{index_name}}
-- Generated: ${new Date().toISOString()}

CREATE {{unique}}INDEX {{index_name}} ON {{table_name}} ({{columns}});
`,
        variables: {
          table_name: { type: 'string', description: 'Table name', required: true },
          index_name: { type: 'string', description: 'Index name', required: true },
          columns: { type: 'string', description: 'Column list', required: true },
          unique: { type: 'string', description: 'UNIQUE or empty', required: false }
        }
      }
    ]
  }
  
  /**
   * List templates
   */
  listTemplates(): string[] {
    return this.getBuiltInTemplates().map(t => t.name)
  }
  
  /**
   * Get template by name
   */
  getTemplate(name: string): MigrationTemplate | null {
    return this.getBuiltInTemplates().find(t => t.name === name) || null
  }
}
