/**
 * Schema Context Provider for AI
 * 
 * Generates comprehensive schema context optimized for AI consumption.
 * Used for:
 * - Natural language query generation
 * - Query explanation
 * - Index recommendations
 * - Schema understanding
 */

import { QueryExecutor } from '../core/query-executor'

export interface TableContext {
  name: string
  description?: string
  rowCount?: number
  sizeBytes?: number
  columns: ColumnContext[]
  indexes: IndexContext[]
  foreignKeys: ForeignKeyContext[]
  referencedBy: ReferenceContext[]
}

export interface ColumnContext {
  name: string
  type: string
  nullable: boolean
  default: string | null
  isPrimaryKey: boolean
  isForeignKey: boolean
  isIndexed: boolean
  description?: string
}

export interface IndexContext {
  name: string
  columns: string[]
  unique: boolean
  type: string
  sizeKB?: number
  scans?: number
}

export interface ForeignKeyContext {
  columns: string[]
  referencedTable: string
  referencedColumns: string[]
}

export interface ReferenceContext {
  fromTable: string
  fromColumns: string[]
  toColumns: string[]
}

export interface SchemaContext {
  tables: TableContext[]
  relationships: RelationshipMap[]
  commonQueries: QueryExample[]
  metadata: {
    totalTables: number
    totalSize: string
    lastUpdated: Date
  }
}

export interface RelationshipMap {
  from: string
  to: string
  type: 'one-to-one' | 'one-to-many' | 'many-to-many'
  via: string[]
}

export interface QueryExample {
  description: string
  sql: string
  explanation?: string
}

export class SchemaContextProvider {
  constructor(private queryExecutor: QueryExecutor) {}
  
  /**
   * Generate comprehensive schema context for AI
   */
  async generateContext(options?: {
    tables?: string[]
    includeExamples?: boolean
    includeStats?: boolean
  }): Promise<SchemaContext> {
    const opts = {
      tables: options?.tables,
      includeExamples: options?.includeExamples ?? true,
      includeStats: options?.includeStats ?? true
    }
    
    // Get all tables or specified tables
    const tables = opts.tables || await this.getAllTableNames()
    
    // Build context for each table
    const tableContexts = await Promise.all(
      tables.map(table => this.getTableContext(table, opts.includeStats))
    )
    
    // Map relationships
    const relationships = this.mapRelationships(tableContexts)
    
    // Get common query examples
    const commonQueries = opts.includeExamples ? this.getCommonQueries() : []
    
    // Get metadata
    const metadata = await this.getMetadata()
    
    return {
      tables: tableContexts,
      relationships,
      commonQueries,
      metadata
    }
  }
  
  /**
   * Get all table names
   */
  private async getAllTableNames(): Promise<string[]> {
    const result = await this.queryExecutor.execute<{ tablename: string }>(
      `SELECT tablename 
       FROM pg_tables 
       WHERE schemaname = 'public' 
       ORDER BY tablename`,
      { readOnly: true }
    )
    
    return result.rows.map(r => r.tablename)
  }
  
  /**
   * Get comprehensive context for a single table
   */
  private async getTableContext(
    tableName: string,
    includeStats: boolean
  ): Promise<TableContext> {
    // Get columns
    const columns = await this.getColumns(tableName)
    
    // Get indexes
    const indexes = await this.getIndexes(tableName, includeStats)
    
    // Get foreign keys
    const foreignKeys = await this.getForeignKeys(tableName)
    
    // Get reverse references (tables that reference this table)
    const referencedBy = await this.getReferencedBy(tableName)
    
    // Get table stats (if requested)
    let rowCount: number | undefined
    let sizeBytes: number | undefined
    let description: string | undefined
    
    if (includeStats) {
      const stats = await this.getTableStats(tableName)
      rowCount = stats.rowCount
      sizeBytes = stats.sizeBytes
      description = stats.description
    }
    
    return {
      name: tableName,
      description,
      rowCount,
      sizeBytes,
      columns,
      indexes,
      foreignKeys,
      referencedBy
    }
  }
  
  /**
   * Get columns for a table
   */
  private async getColumns(tableName: string): Promise<ColumnContext[]> {
    const result = await this.queryExecutor.execute<{
      column_name: string
      data_type: string
      is_nullable: string
      column_default: string | null
      is_primary: boolean
      is_foreign: boolean
      is_indexed: boolean
      description: string | null
    }>(
      `SELECT 
        c.column_name,
        c.data_type,
        c.is_nullable,
        c.column_default,
        EXISTS(
          SELECT 1 FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
          WHERE tc.table_name = c.table_name
            AND tc.constraint_type = 'PRIMARY KEY'
            AND kcu.column_name = c.column_name
        ) as is_primary,
        EXISTS(
          SELECT 1 FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
          WHERE tc.table_name = c.table_name
            AND tc.constraint_type = 'FOREIGN KEY'
            AND kcu.column_name = c.column_name
        ) as is_foreign,
        EXISTS(
          SELECT 1 FROM pg_indexes i
          WHERE i.tablename = c.table_name
            AND i.indexdef LIKE '%' || c.column_name || '%'
        ) as is_indexed,
        pgd.description
      FROM information_schema.columns c
      LEFT JOIN pg_catalog.pg_statio_all_tables st 
        ON c.table_name = st.relname
      LEFT JOIN pg_catalog.pg_description pgd 
        ON pgd.objoid = st.relid 
        AND pgd.objsubid = c.ordinal_position
      WHERE c.table_name = $1
        AND c.table_schema = 'public'
      ORDER BY c.ordinal_position`,
      { params: [tableName], readOnly: true }
    )
    
    return result.rows.map(row => ({
      name: row.column_name,
      type: row.data_type,
      nullable: row.is_nullable === 'YES',
      default: row.column_default,
      isPrimaryKey: row.is_primary,
      isForeignKey: row.is_foreign,
      isIndexed: row.is_indexed,
      description: row.description ? row.description : undefined
    }))
  }
  
  /**
   * Get indexes for a table
   */
  private async getIndexes(
    tableName: string,
    includeStats: boolean
  ): Promise<IndexContext[]> {
    const result = await this.queryExecutor.execute<{
      indexname: string
      indexdef: string
    }>(
      `SELECT indexname, indexdef
       FROM pg_indexes
       WHERE tablename = $1
         AND schemaname = 'public'
       ORDER BY indexname`,
      { params: [tableName], readOnly: true }
    )
    
    return result.rows.map(row => {
      // Parse index definition to extract columns
      const match = row.indexdef.match(/\((.*?)\)/)
      const columnsStr = match ? match[1] : ''
      const columns = columnsStr.split(',').map(c => c.trim())
      
      // Detect unique indexes
      const unique = row.indexdef.includes('UNIQUE')
      
      // Detect index type
      const type = row.indexdef.includes('USING btree') ? 'btree' :
                   row.indexdef.includes('USING hash') ? 'hash' :
                   row.indexdef.includes('USING gin') ? 'gin' :
                   row.indexdef.includes('USING gist') ? 'gist' : 'btree'
      
      return {
        name: row.indexname,
        columns,
        unique,
        type
      }
    })
  }
  
  /**
   * Get foreign keys for a table
   */
  private async getForeignKeys(tableName: string): Promise<ForeignKeyContext[]> {
    const result = await this.queryExecutor.execute<{
      columns: string
      referenced_table: string
      referenced_columns: string
    }>(
      `SELECT 
        string_agg(kcu.column_name, ', ') as columns,
        ccu.table_name as referenced_table,
        string_agg(ccu.column_name, ', ') as referenced_columns
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.table_name = $1
        AND tc.constraint_type = 'FOREIGN KEY'
      GROUP BY ccu.table_name`,
      { params: [tableName], readOnly: true }
    )
    
    return result.rows.map(row => ({
      columns: row.columns.split(', '),
      referencedTable: row.referenced_table,
      referencedColumns: row.referenced_columns.split(', ')
    }))
  }
  
  /**
   * Get tables that reference this table
   */
  private async getReferencedBy(tableName: string): Promise<ReferenceContext[]> {
    const result = await this.queryExecutor.execute<{
      from_table: string
      from_columns: string
      to_columns: string
    }>(
      `SELECT 
        tc.table_name as from_table,
        string_agg(kcu.column_name, ', ') as from_columns,
        string_agg(ccu.column_name, ', ') as to_columns
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE ccu.table_name = $1
        AND tc.constraint_type = 'FOREIGN KEY'
      GROUP BY tc.table_name`,
      { params: [tableName], readOnly: true }
    )
    
    return result.rows.map(row => ({
      fromTable: row.from_table,
      fromColumns: row.from_columns.split(', '),
      toColumns: row.to_columns.split(', ')
    }))
  }
  
  /**
   * Get table statistics
   */
  private async getTableStats(tableName: string): Promise<{
    rowCount: number
    sizeBytes: number
    description: string | null
  }> {
    const result = await this.queryExecutor.execute<{
      row_count: number
      size_bytes: number
      description: string | null
    }>(
      `SELECT 
        (SELECT n_live_tup FROM pg_stat_user_tables WHERE relname = $1) as row_count,
        pg_total_relation_size($1::regclass) as size_bytes,
        obj_description($1::regclass) as description`,
      { params: [tableName], readOnly: true }
    )
    
    return {
      rowCount: result.rows[0]?.row_count || 0,
      sizeBytes: result.rows[0]?.size_bytes || 0,
      description: result.rows[0]?.description
    }
  }
  
  /**
   * Map relationships between tables
   */
  private mapRelationships(tables: TableContext[]): RelationshipMap[] {
    const relationships: RelationshipMap[] = []
    
    for (const table of tables) {
      for (const fk of table.foreignKeys) {
        relationships.push({
          from: table.name,
          to: fk.referencedTable,
          type: 'many-to-one',
          via: fk.columns
        })
      }
    }
    
    return relationships
  }
  
  /**
   * Get common query examples
   */
  private getCommonQueries(): QueryExample[] {
    return [
      {
        description: 'Get all vehicles for a user',
        sql: `SELECT * FROM vehicles WHERE user_id = 'USER_ID' ORDER BY created_at DESC`,
        explanation: 'Uses index on user_id for fast lookup'
      },
      {
        description: 'Get trips for a vehicle',
        sql: `SELECT * FROM trips WHERE vehicle_id = 'VEHICLE_ID' AND status = 'finalized' ORDER BY started_at DESC LIMIT 100`,
        explanation: 'Uses composite index on (vehicle_id, started_at) for efficient filtering'
      },
      {
        description: 'Count vehicles by make',
        sql: `SELECT make, COUNT(*) as count FROM vehicles GROUP BY make ORDER BY count DESC`,
        explanation: 'Performs aggregation over all vehicles'
      },
      {
        description: 'Find recent crash events',
        sql: `SELECT e.*, t.vehicle_id FROM trip_events e JOIN trips t ON t.id = e.trip_id WHERE e.type = 'crash_confirmed' AND e.timestamp >= NOW() - INTERVAL '30 days'`,
        explanation: 'Joins trip_events with trips to get vehicle context'
      }
    ]
  }
  
  /**
   * Get database metadata
   */
  private async getMetadata(): Promise<SchemaContext['metadata']> {
    const result = await this.queryExecutor.execute<{
      table_count: number
      total_size: string
    }>(
      `SELECT 
        COUNT(*) as table_count,
        pg_size_pretty(SUM(pg_total_relation_size(quote_ident(tablename)::regclass))) as total_size
      FROM pg_tables
      WHERE schemaname = 'public'`,
      { readOnly: true }
    )
    
    return {
      totalTables: result.rows[0]?.table_count || 0,
      totalSize: result.rows[0]?.total_size || '0 bytes',
      lastUpdated: new Date()
    }
  }
  
  /**
   * Generate markdown documentation from schema context
   */
  generateMarkdown(context: SchemaContext): string {
    const lines: string[] = []
    
    lines.push('# Database Schema Documentation')
    lines.push('')
    lines.push(`**Generated:** ${context.metadata.lastUpdated.toISOString()}`)
    lines.push(`**Total Tables:** ${context.metadata.totalTables}`)
    lines.push(`**Total Size:** ${context.metadata.totalSize}`)
    lines.push('')
    
    // Tables
    lines.push('## Tables')
    lines.push('')
    
    for (const table of context.tables) {
      lines.push(`### ${table.name}`)
      
      if (table.description) {
        lines.push(`*${table.description}*`)
      }
      
      if (table.rowCount !== undefined) {
        lines.push(`**Rows:** ${table.rowCount.toLocaleString()}`)
      }
      
      lines.push('')
      lines.push('**Columns:**')
      lines.push('')
      
      for (const col of table.columns) {
        const badges = []
        if (col.isPrimaryKey) badges.push('PK')
        if (col.isForeignKey) badges.push('FK')
        if (col.isIndexed) badges.push('IDX')
        
        const badgeStr = badges.length > 0 ? ` [${badges.join(', ')}]` : ''
        const nullStr = col.nullable ? '?' : ''
        
        lines.push(`- \`${col.name}\`: ${col.type}${nullStr}${badgeStr}`)
        
        if (col.description) {
          lines.push(`  - ${col.description}`)
        }
      }
      
      lines.push('')
      
      if (table.indexes.length > 0) {
        lines.push('**Indexes:**')
        lines.push('')
        
        for (const idx of table.indexes) {
          const uniqueStr = idx.unique ? ' (UNIQUE)' : ''
          lines.push(`- \`${idx.name}\`: (${idx.columns.join(', ')})${uniqueStr}`)
        }
        
        lines.push('')
      }
      
      if (table.foreignKeys.length > 0) {
        lines.push('**Foreign Keys:**')
        lines.push('')
        
        for (const fk of table.foreignKeys) {
          lines.push(`- ${fk.columns.join(', ')} → ${fk.referencedTable}(${fk.referencedColumns.join(', ')})`)
        }
        
        lines.push('')
      }
      
      if (table.referencedBy.length > 0) {
        lines.push('**Referenced By:**')
        lines.push('')
        
        for (const ref of table.referencedBy) {
          lines.push(`- ${ref.fromTable}(${ref.fromColumns.join(', ')})`)
        }
        
        lines.push('')
      }
    }
    
    // Relationships
    if (context.relationships.length > 0) {
      lines.push('## Relationships')
      lines.push('')
      
      for (const rel of context.relationships) {
        lines.push(`- \`${rel.from}\` → \`${rel.to}\` (${rel.type}) via ${rel.via.join(', ')}`)
      }
      
      lines.push('')
    }
    
    // Common Queries
    if (context.commonQueries.length > 0) {
      lines.push('## Common Queries')
      lines.push('')
      
      for (const query of context.commonQueries) {
        lines.push(`### ${query.description}`)
        lines.push('')
        lines.push('```sql')
        lines.push(query.sql)
        lines.push('```')
        
        if (query.explanation) {
          lines.push('')
          lines.push(`*${query.explanation}*`)
        }
        
        lines.push('')
      }
    }
    
    return lines.join('\n')
  }
  
  /**
   * Generate AI-optimized context string
   */
  generateAIContext(context: SchemaContext): string {
    const lines: string[] = []
    
    lines.push('# Database Schema Context for AI')
    lines.push('')
    lines.push('Use this context to generate accurate SQL queries.')
    lines.push('')
    
    for (const table of context.tables) {
      lines.push(`## Table: ${table.name}`)
      
      if (table.description) {
        lines.push(table.description)
      }
      
      lines.push('')
      lines.push('Columns:')
      
      for (const col of table.columns) {
        const attrs = []
        if (col.isPrimaryKey) attrs.push('PRIMARY KEY')
        if (!col.nullable) attrs.push('NOT NULL')
        if (col.isForeignKey) attrs.push('FOREIGN KEY')
        
        const attrStr = attrs.length > 0 ? ` (${attrs.join(', ')})` : ''
        
        lines.push(`- ${col.name}: ${col.type}${attrStr}`)
        
        if (col.description) {
          lines.push(`  ${col.description}`)
        }
      }
      
      lines.push('')
      
      if (table.foreignKeys.length > 0) {
        lines.push('Relationships:')
        
        for (const fk of table.foreignKeys) {
          lines.push(`- ${table.name}.${fk.columns.join(', ')} → ${fk.referencedTable}.${fk.referencedColumns.join(', ')}`)
        }
        
        lines.push('')
      }
    }
    
    if (context.commonQueries.length > 0) {
      lines.push('## Example Queries')
      lines.push('')
      
      for (const query of context.commonQueries) {
        lines.push(`**${query.description}:**`)
        lines.push('```sql')
        lines.push(query.sql)
        lines.push('```')
        lines.push('')
      }
    }
    
    return lines.join('\n')
  }
}
