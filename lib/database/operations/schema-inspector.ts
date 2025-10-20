/**
 * Schema Inspector
 * 
 * Deep introspection of database schema:
 * - Tables, columns, constraints
 * - Indexes and foreign keys
 * - Data types and defaults
 * - Dependencies and references
 */

import { QueryExecutor } from '../core/query-executor'

export interface TableInfo {
  schema: string
  name: string
  type: 'table' | 'view' | 'materialized_view'
  owner: string
  rowCount: number | null
  sizeBytes: number | null
  description: string | null
  createdAt: Date | null
  lastModified: Date | null
}

export interface ColumnInfo {
  name: string
  dataType: string
  isNullable: boolean
  defaultValue: string | null
  isPrimaryKey: boolean
  isForeignKey: boolean
  isUnique: boolean
  maxLength: number | null
  numericPrecision: number | null
  numericScale: number | null
  description: string | null
  ordinalPosition: number
}

export interface ConstraintInfo {
  name: string
  type: 'PRIMARY KEY' | 'FOREIGN KEY' | 'UNIQUE' | 'CHECK'
  columns: string[]
  definition: string
  isValid: boolean
  referencedTable?: string
  referencedColumns?: string[]
  onUpdate?: string
  onDelete?: string
}

export interface IndexInfo {
  name: string
  columns: string[]
  isUnique: boolean
  isPrimary: boolean
  type: string
  sizeBytes: number | null
  scans: number | null
  definition: string
}

export interface DependencyInfo {
  type: 'table' | 'view' | 'function' | 'sequence'
  schema: string
  name: string
  dependsOn: Array<{
    type: string
    schema: string
    name: string
  }>
}

export interface SchemaInspectionResult {
  tables: TableInfo[]
  columns: Map<string, ColumnInfo[]>
  constraints: Map<string, ConstraintInfo[]>
  indexes: Map<string, IndexInfo[]>
  dependencies: DependencyInfo[]
  summary: {
    totalTables: number
    totalColumns: number
    totalIndexes: number
    totalConstraints: number
    totalSize: number
  }
}

export class SchemaInspector {
  constructor(private queryExecutor: QueryExecutor) {}
  
  /**
   * Get all tables in the database
   */
  async getTables(schemaName: string = 'public'): Promise<TableInfo[]> {
    const result = await this.queryExecutor.execute<{
      schema_name: string
      table_name: string
      table_type: string
      table_owner: string
      row_count: number | null
      table_size: number | null
      description: string | null
    }>(
      `SELECT 
        schemaname as schema_name,
        tablename as table_name,
        'table' as table_type,
        tableowner as table_owner,
        NULL as row_count,
        pg_total_relation_size(quote_ident(schemaname) || '.' || quote_ident(tablename))::bigint as table_size,
        obj_description((quote_ident(schemaname) || '.' || quote_ident(tablename))::regclass) as description
      FROM pg_tables
      WHERE schemaname = $1
      ORDER BY tablename`,
      { params: [schemaName], readOnly: true }
    )
    
    // Get row counts for each table
    const tables: TableInfo[] = []
    
    for (const row of result.rows) {
      let rowCount: number | null = null
      
      try {
        const countResult = await this.queryExecutor.execute<{ count: number }>(
          `SELECT COUNT(*) as count FROM ${row.schema_name}.${row.table_name}`,
          { readOnly: true, timeout: 5000 }
        )
        rowCount = countResult.rows[0]?.count || 0
      } catch (error) {
        // Ignore count errors (table might be large or inaccessible)
      }
      
      tables.push({
        schema: row.schema_name,
        name: row.table_name,
        type: row.table_type as 'table',
        owner: row.table_owner,
        rowCount,
        sizeBytes: row.table_size,
        description: row.description,
        createdAt: null, // PostgreSQL doesn't track creation time by default
        lastModified: null
      })
    }
    
    return tables
  }
  
  /**
   * Get columns for a specific table
   */
  async getColumns(tableName: string, schemaName: string = 'public'): Promise<ColumnInfo[]> {
    const result = await this.queryExecutor.execute<{
      column_name: string
      data_type: string
      is_nullable: string
      column_default: string | null
      character_maximum_length: number | null
      numeric_precision: number | null
      numeric_scale: number | null
      ordinal_position: number
      is_primary: boolean
      is_foreign: boolean
      is_unique: boolean
      description: string | null
    }>(
      `SELECT 
        c.column_name,
        c.data_type,
        c.is_nullable,
        c.column_default,
        c.character_maximum_length,
        c.numeric_precision,
        c.numeric_scale,
        c.ordinal_position,
        EXISTS(
          SELECT 1 FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
          WHERE tc.table_schema = c.table_schema
            AND tc.table_name = c.table_name
            AND kcu.column_name = c.column_name
            AND tc.constraint_type = 'PRIMARY KEY'
        ) as is_primary,
        EXISTS(
          SELECT 1 FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
          WHERE tc.table_schema = c.table_schema
            AND tc.table_name = c.table_name
            AND kcu.column_name = c.column_name
            AND tc.constraint_type = 'FOREIGN KEY'
        ) as is_foreign,
        EXISTS(
          SELECT 1 FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
          WHERE tc.table_schema = c.table_schema
            AND tc.table_name = c.table_name
            AND kcu.column_name = c.column_name
            AND tc.constraint_type = 'UNIQUE'
        ) as is_unique,
        col_description((c.table_schema || '.' || c.table_name)::regclass, c.ordinal_position) as description
      FROM information_schema.columns c
      WHERE c.table_schema = $1
        AND c.table_name = $2
      ORDER BY c.ordinal_position`,
      { params: [schemaName, tableName], readOnly: true }
    )
    
    return result.rows.map(row => ({
      name: row.column_name,
      dataType: row.data_type,
      isNullable: row.is_nullable === 'YES',
      defaultValue: row.column_default,
      isPrimaryKey: row.is_primary,
      isForeignKey: row.is_foreign,
      isUnique: row.is_unique,
      maxLength: row.character_maximum_length,
      numericPrecision: row.numeric_precision,
      numericScale: row.numeric_scale,
      description: row.description,
      ordinalPosition: row.ordinal_position
    }))
  }
  
  /**
   * Get constraints for a specific table
   */
  async getConstraints(tableName: string, schemaName: string = 'public'): Promise<ConstraintInfo[]> {
    const result = await this.queryExecutor.execute<{
      constraint_name: string
      constraint_type: string
      columns: string[]
      definition: string
      is_valid: boolean
      referenced_table: string | null
      referenced_columns: string[] | null
      update_rule: string | null
      delete_rule: string | null
    }>(
      `SELECT 
        tc.constraint_name,
        tc.constraint_type,
        ARRAY_AGG(DISTINCT kcu.column_name ORDER BY kcu.column_name) as columns,
        pg_get_constraintdef((tc.table_schema || '.' || tc.table_name || '.' || tc.constraint_name)::regclass::oid) as definition,
        true as is_valid,
        ccu.table_name as referenced_table,
        ARRAY_AGG(DISTINCT ccu.column_name) FILTER (WHERE ccu.column_name IS NOT NULL) as referenced_columns,
        rc.update_rule,
        rc.delete_rule
      FROM information_schema.table_constraints tc
      LEFT JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      LEFT JOIN information_schema.constraint_column_usage ccu
        ON tc.constraint_name = ccu.constraint_name
        AND tc.table_schema = ccu.table_schema
      LEFT JOIN information_schema.referential_constraints rc
        ON tc.constraint_name = rc.constraint_name
        AND tc.table_schema = rc.constraint_schema
      WHERE tc.table_schema = $1
        AND tc.table_name = $2
      GROUP BY 
        tc.constraint_name,
        tc.constraint_type,
        ccu.table_name,
        rc.update_rule,
        rc.delete_rule,
        tc.table_schema,
        tc.table_name`,
      { params: [schemaName, tableName], readOnly: true }
    )
    
    return result.rows.map(row => ({
      name: row.constraint_name,
      type: row.constraint_type as ConstraintInfo['type'],
      columns: row.columns,
      definition: row.definition,
      isValid: row.is_valid,
      referencedTable: row.referenced_table || undefined,
      referencedColumns: row.referenced_columns || undefined,
      onUpdate: row.update_rule || undefined,
      onDelete: row.delete_rule || undefined
    }))
  }
  
  /**
   * Get indexes for a specific table
   */
  async getIndexes(tableName: string, schemaName: string = 'public'): Promise<IndexInfo[]> {
    const result = await this.queryExecutor.execute<{
      index_name: string
      columns: string[]
      is_unique: boolean
      is_primary: boolean
      index_type: string
      index_size: number | null
      index_scans: number | null
      index_definition: string
    }>(
      `SELECT 
        i.relname as index_name,
        ARRAY_AGG(a.attname ORDER BY k.ordinality) as columns,
        ix.indisunique as is_unique,
        ix.indisprimary as is_primary,
        am.amname as index_type,
        pg_relation_size(i.oid) as index_size,
        s.idx_scan as index_scans,
        pg_get_indexdef(i.oid) as index_definition
      FROM pg_class t
      JOIN pg_index ix ON t.oid = ix.indrelid
      JOIN pg_class i ON i.oid = ix.indexrelid
      JOIN pg_am am ON i.relam = am.oid
      JOIN pg_namespace n ON t.relnamespace = n.oid
      LEFT JOIN pg_stat_user_indexes s ON i.oid = s.indexrelid
      CROSS JOIN LATERAL unnest(ix.indkey) WITH ORDINALITY AS k(attnum, ordinality)
      JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = k.attnum
      WHERE n.nspname = $1
        AND t.relname = $2
      GROUP BY 
        i.relname,
        ix.indisunique,
        ix.indisprimary,
        am.amname,
        i.oid,
        s.idx_scan`,
      { params: [schemaName, tableName], readOnly: true }
    )
    
    return result.rows.map(row => ({
      name: row.index_name,
      columns: row.columns,
      isUnique: row.is_unique,
      isPrimary: row.is_primary,
      type: row.index_type,
      sizeBytes: row.index_size,
      scans: row.index_scans,
      definition: row.index_definition
    }))
  }
  
  /**
   * Get table dependencies
   */
  async getDependencies(tableName: string, schemaName: string = 'public'): Promise<DependencyInfo> {
    const result = await this.queryExecutor.execute<{
      dep_type: string
      dep_schema: string
      dep_name: string
    }>(
      `SELECT DISTINCT
        CASE 
          WHEN c.relkind = 'r' THEN 'table'
          WHEN c.relkind = 'v' THEN 'view'
          WHEN c.relkind = 'm' THEN 'materialized_view'
          WHEN c.relkind = 'f' THEN 'foreign_table'
          ELSE 'other'
        END as dep_type,
        n.nspname as dep_schema,
        c.relname as dep_name
      FROM pg_depend d
      JOIN pg_class c ON d.refobjid = c.oid
      JOIN pg_namespace n ON c.relnamespace = n.oid
      WHERE d.objid = (
        SELECT oid FROM pg_class 
        WHERE relname = $1 
          AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = $2)
      )
        AND d.deptype = 'n'
        AND c.relkind IN ('r', 'v', 'm', 'f')`,
      { params: [tableName, schemaName], readOnly: true }
    )
    
    return {
      type: 'table',
      schema: schemaName,
      name: tableName,
      dependsOn: result.rows.map(row => ({
        type: row.dep_type,
        schema: row.dep_schema,
        name: row.dep_name
      }))
    }
  }
  
  /**
   * Perform complete schema introspection
   */
  async inspect(schemaName: string = 'public'): Promise<SchemaInspectionResult> {
    const tables = await this.getTables(schemaName)
    
    const columns = new Map<string, ColumnInfo[]>()
    const constraints = new Map<string, ConstraintInfo[]>()
    const indexes = new Map<string, IndexInfo[]>()
    const dependencies: DependencyInfo[] = []
    
    for (const table of tables) {
      const tableCols = await this.getColumns(table.name, schemaName)
      const tableConstraints = await this.getConstraints(table.name, schemaName)
      const tableIndexes = await this.getIndexes(table.name, schemaName)
      const tableDeps = await this.getDependencies(table.name, schemaName)
      
      columns.set(table.name, tableCols)
      constraints.set(table.name, tableConstraints)
      indexes.set(table.name, tableIndexes)
      dependencies.push(tableDeps)
    }
    
    const totalColumns = Array.from(columns.values()).reduce((sum, cols) => sum + cols.length, 0)
    const totalIndexes = Array.from(indexes.values()).reduce((sum, idxs) => sum + idxs.length, 0)
    const totalConstraints = Array.from(constraints.values()).reduce((sum, cons) => sum + cons.length, 0)
    const totalSize = tables.reduce((sum, t) => sum + (t.sizeBytes || 0), 0)
    
    return {
      tables,
      columns,
      constraints,
      indexes,
      dependencies,
      summary: {
        totalTables: tables.length,
        totalColumns,
        totalIndexes,
        totalConstraints,
        totalSize
      }
    }
  }
  
  /**
   * Compare two schemas (for drift detection)
   */
  async compareSchemas(
    schema1: string,
    schema2: string
  ): Promise<{
    tablesOnlyIn1: string[]
    tablesOnlyIn2: string[]
    commonTables: string[]
    differences: Array<{
      table: string
      type: 'column' | 'constraint' | 'index'
      change: 'added' | 'removed' | 'modified'
      details: string
    }>
  }> {
    const [inspection1, inspection2] = await Promise.all([
      this.inspect(schema1),
      this.inspect(schema2)
    ])
    
    const tables1 = new Set(inspection1.tables.map(t => t.name))
    const tables2 = new Set(inspection2.tables.map(t => t.name))
    
    const tablesOnlyIn1 = Array.from(tables1).filter(t => !tables2.has(t))
    const tablesOnlyIn2 = Array.from(tables2).filter(t => !tables1.has(t))
    const commonTables = Array.from(tables1).filter(t => tables2.has(t))
    
    const differences: Array<{
      table: string
      type: 'column' | 'constraint' | 'index'
      change: 'added' | 'removed' | 'modified'
      details: string
    }> = []
    
    // Compare columns for common tables
    for (const tableName of commonTables) {
      const cols1 = inspection1.columns.get(tableName) || []
      const cols2 = inspection2.columns.get(tableName) || []
      
      const colNames1 = new Set(cols1.map(c => c.name))
      const colNames2 = new Set(cols2.map(c => c.name))
      
      for (const col of cols1) {
        if (!colNames2.has(col.name)) {
          differences.push({
            table: tableName,
            type: 'column',
            change: 'removed',
            details: `Column ${col.name} exists in ${schema1} but not in ${schema2}`
          })
        }
      }
      
      for (const col of cols2) {
        if (!colNames1.has(col.name)) {
          differences.push({
            table: tableName,
            type: 'column',
            change: 'added',
            details: `Column ${col.name} exists in ${schema2} but not in ${schema1}`
          })
        }
      }
    }
    
    return {
      tablesOnlyIn1,
      tablesOnlyIn2,
      commonTables,
      differences
    }
  }
}
