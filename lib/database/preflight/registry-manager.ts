/**
 * Schema Registry Manager
 * 
 * Manages the schema registry - syncs from information_schema,
 * tracks changes, and provides query interface.
 * 
 * Part of Phase 5: AI Preflight System
 */

import type { Database } from '../core'

export interface SchemaObject {
  id?: string
  kind: 'table' | 'view' | 'enum' | 'function' | 'type'
  name: string
  schemaName: string
  domain: string
  description?: string
  owner?: string
  metadata?: Record<string, unknown>
}

export interface ColumnInfo {
  id?: string
  schemaId: string
  name: string
  ordinalPosition: number
  dataType: string
  isNullable: boolean
  defaultExpr?: string
  characterMaximumLength?: number
  references?: string
  description?: string
  tags?: string[]
}

export interface SyncResult {
  synced: number
  skipped: number
  errors: number
  details: {
    tables: number
    views: number
    enums: number
    columns: number
  }
}

export interface SearchOptions {
  query: string
  domain?: string
  kind?: SchemaObject['kind']
  limit?: number
}

export class RegistryManager {
  constructor(private db: Database) {}

  /**
   * Sync registry from information_schema
   */
  async syncFromSchema(schemaName = 'public'): Promise<SyncResult> {
    const result: SyncResult = {
      synced: 0,
      skipped: 0,
      errors: 0,
      details: { tables: 0, views: 0, enums: 0, columns: 0 }
    }

    try {
      // 1. Sync tables
      const tables = await this.getTables(schemaName)
      for (const table of tables) {
        try {
          const schemaId = await this.upsertSchema({
            kind: 'table',
            name: table.table_name,
            schemaName: table.table_schema,
            domain: this.inferDomain(table.table_name),
            description: table.comment,
            owner: this.lookupOwner(table.table_name)
          })

          // Sync columns for this table
          const columns = await this.getColumns(schemaName, table.table_name)
          for (const column of columns) {
            await this.upsertColumn({
              schemaId,
              name: column.column_name,
              ordinalPosition: column.ordinal_position,
              dataType: column.data_type,
              isNullable: column.is_nullable === 'YES',
              defaultExpr: column.column_default,
              characterMaximumLength: column.character_maximum_length,
              references: await this.getForeignKeyTarget(
                schemaName,
                table.table_name,
                column.column_name
              ),
              description: column.comment
            })
            result.details.columns++
          }

          result.synced++
          result.details.tables++
        } catch (error) {
          console.error(`Error syncing table ${table.table_name}:`, error)
          result.errors++
        }
      }

      // 2. Sync views
      const views = await this.getViews(schemaName)
      for (const view of views) {
        try {
          await this.upsertSchema({
            kind: 'view',
            name: view.table_name,
            schemaName: view.table_schema,
            domain: this.inferDomain(view.table_name),
            description: view.comment,
            owner: this.lookupOwner(view.table_name)
          })
          result.synced++
          result.details.views++
        } catch (error) {
          console.error(`Error syncing view ${view.table_name}:`, error)
          result.errors++
        }
      }

      // 3. Sync enums
      const enums = await this.getEnums(schemaName)
      for (const enumType of enums) {
        try {
          await this.upsertSchema({
            kind: 'enum',
            name: enumType.type_name,
            schemaName: enumType.schema_name,
            domain: this.inferDomain(enumType.type_name),
            metadata: { values: enumType.enum_values },
            owner: this.lookupOwner(enumType.type_name)
          })
          result.synced++
          result.details.enums++
        } catch (error) {
          console.error(`Error syncing enum ${enumType.type_name}:`, error)
          result.errors++
        }
      }

      return result
    } catch (error) {
      throw new Error(`Failed to sync schema registry: ${error}`)
    }
  }

  /**
   * Upsert a schema object
   */
  private async upsertSchema(schema: SchemaObject): Promise<string> {
    const query = `
      INSERT INTO registry.schemas (
        kind, name, schema_name, domain, description, owner, metadata, synced_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, NOW()
      )
      ON CONFLICT (schema_name, kind, name) 
      DO UPDATE SET
        domain = EXCLUDED.domain,
        description = EXCLUDED.description,
        owner = EXCLUDED.owner,
        metadata = EXCLUDED.metadata,
        synced_at = NOW(),
        updated_at = NOW()
      RETURNING id
    `

    const result = await this.db.query(query, {
      params: [
        schema.kind,
        schema.name,
        schema.schemaName,
        schema.domain,
        schema.description,
        schema.owner,
        JSON.stringify(schema.metadata || {})
      ]
    })

    return result.rows[0].id
  }

  /**
   * Upsert a column
   */
  private async upsertColumn(column: ColumnInfo): Promise<void> {
    const query = `
      INSERT INTO registry.columns (
        schema_id, name, ordinal_position, data_type, is_nullable,
        default_expr, character_maximum_length, references, description, tags
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
      )
      ON CONFLICT (schema_id, name)
      DO UPDATE SET
        ordinal_position = EXCLUDED.ordinal_position,
        data_type = EXCLUDED.data_type,
        is_nullable = EXCLUDED.is_nullable,
        default_expr = EXCLUDED.default_expr,
        character_maximum_length = EXCLUDED.character_maximum_length,
        references = EXCLUDED.references,
        description = EXCLUDED.description,
        tags = EXCLUDED.tags
    `

    await this.db.query(query, {
      params: [
        column.schemaId,
        column.name,
        column.ordinalPosition,
        column.dataType,
        column.isNullable,
        column.defaultExpr,
        column.characterMaximumLength,
        column.references,
        column.description,
        JSON.stringify(column.tags || [])
      ]
    })
  }

  /**
   * Search registry
   */
  async search(options: SearchOptions): Promise<SchemaObject[]> {
    let query = `
      SELECT 
        id, kind, name, schema_name, domain, description, owner, metadata
      FROM registry.schemas
      WHERE 1=1
    `
    const params: unknown[] = []
    let paramIndex = 1

    // Add filters
    if (options.query) {
      query += ` AND (
        name ILIKE $${paramIndex} 
        OR description ILIKE $${paramIndex}
      )`
      params.push(`%${options.query}%`)
      paramIndex++
    }

    if (options.domain) {
      query += ` AND domain = $${paramIndex}`
      params.push(options.domain)
      paramIndex++
    }

    if (options.kind) {
      query += ` AND kind = $${paramIndex}`
      params.push(options.kind)
      paramIndex++
    }

    query += ` ORDER BY name LIMIT ${options.limit || 50}`

    const result = await this.db.query(query, { params })

    return result.rows.map(row => ({
      id: row.id,
      kind: row.kind,
      name: row.name,
      schemaName: row.schema_name,
      domain: row.domain,
      description: row.description,
      owner: row.owner,
      metadata: row.metadata
    }))
  }

  /**
   * Get registry stats
   */
  async getStats() {
    const query = `
      SELECT 
        COUNT(*) FILTER (WHERE kind = 'table') as tables,
        COUNT(*) FILTER (WHERE kind = 'view') as views,
        COUNT(*) FILTER (WHERE kind = 'enum') as enums,
        COUNT(*) FILTER (WHERE kind = 'function') as functions,
        (SELECT COUNT(*) FROM registry.columns) as columns,
        (SELECT COUNT(*) FROM registry.vector_index) as embeddings,
        MAX(synced_at) as last_sync
      FROM registry.schemas
    `

    const result = await this.db.query(query)
    return result.rows[0]
  }

  /**
   * Helper: Get tables from information_schema
   */
  private async getTables(schemaName: string) {
    const query = `
      SELECT 
        t.table_schema,
        t.table_name,
        obj_description((quote_ident(t.table_schema)||'.'||quote_ident(t.table_name))::regclass) as comment
      FROM information_schema.tables t
      WHERE t.table_schema = $1
        AND t.table_type = 'BASE TABLE'
      ORDER BY t.table_name
    `

    const result = await this.db.query(query, { params: [schemaName] })
    return result.rows
  }

  /**
   * Helper: Get columns from information_schema
   */
  private async getColumns(schemaName: string, tableName: string) {
    const query = `
      SELECT 
        c.column_name,
        c.ordinal_position,
        c.data_type,
        c.is_nullable,
        c.column_default,
        c.character_maximum_length,
        col_description((quote_ident(c.table_schema)||'.'||quote_ident(c.table_name))::regclass, c.ordinal_position) as comment
      FROM information_schema.columns c
      WHERE c.table_schema = $1
        AND c.table_name = $2
      ORDER BY c.ordinal_position
    `

    const result = await this.db.query(query, { params: [schemaName, tableName] })
    return result.rows
  }

  /**
   * Helper: Get views from information_schema
   */
  private async getViews(schemaName: string) {
    const query = `
      SELECT 
        t.table_schema,
        t.table_name,
        obj_description((quote_ident(t.table_schema)||'.'||quote_ident(t.table_name))::regclass) as comment
      FROM information_schema.tables t
      WHERE t.table_schema = $1
        AND t.table_type = 'VIEW'
      ORDER BY t.table_name
    `

    const result = await this.db.query(query, { params: [schemaName] })
    return result.rows
  }

  /**
   * Helper: Get enums from pg_type
   */
  private async getEnums(schemaName: string) {
    const query = `
      SELECT 
        n.nspname as schema_name,
        t.typname as type_name,
        array_agg(e.enumlabel ORDER BY e.enumsortorder) as enum_values
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = $1
      GROUP BY n.nspname, t.typname
      ORDER BY t.typname
    `

    const result = await this.db.query(query, { params: [schemaName] })
    return result.rows
  }

  /**
   * Helper: Get foreign key target
   */
  private async getForeignKeyTarget(
    schemaName: string,
    tableName: string,
    columnName: string
  ): Promise<string | undefined> {
    const query = `
      SELECT
        ccu.table_schema || '.' || ccu.table_name || '.' || ccu.column_name as target
      FROM information_schema.key_column_usage kcu
      JOIN information_schema.constraint_column_usage ccu
        ON kcu.constraint_name = ccu.constraint_name
      WHERE kcu.table_schema = $1
        AND kcu.table_name = $2
        AND kcu.column_name = $3
        AND EXISTS (
          SELECT 1 FROM information_schema.table_constraints tc
          WHERE tc.constraint_name = kcu.constraint_name
            AND tc.constraint_type = 'FOREIGN KEY'
        )
    `

    const result = await this.db.query(query, {
      params: [schemaName, tableName, columnName]
    })

    return result.rows[0]?.target
  }

  /**
   * Helper: Infer domain from table name
   */
  private inferDomain(tableName: string): string {
    const name = tableName.toLowerCase()

    // Vehicles domain
    if (
      name.includes('vehicle') ||
      name.includes('maintenance') ||
      name.includes('service') ||
      name.includes('repair')
    ) {
      return 'vehicles'
    }

    // Trips domain
    if (name.includes('trip') || name.includes('journey') || name.includes('route')) {
      return 'trips'
    }

    // Ownership domain
    if (name.includes('owner') || name.includes('ownership') || name.includes('transfer')) {
      return 'ownership'
    }

    // Auth domain
    if (
      name.includes('user') ||
      name.includes('profile') ||
      name.includes('auth') ||
      name.includes('session') ||
      name.includes('account')
    ) {
      return 'auth'
    }

    // Parking domain
    if (name.includes('park') || name.includes('spot') || name.includes('lot')) {
      return 'parking'
    }

    // Tracking domain
    if (
      name.includes('track') ||
      name.includes('location') ||
      name.includes('position') ||
      name.includes('gps')
    ) {
      return 'tracking'
    }

    // Default
    return 'general'
  }

  /**
   * Helper: Lookup owner (placeholder - can be enhanced)
   */
  private lookupOwner(tableName: string): string {
    // TODO: Read from configuration file or database
    // For now, infer from domain
    const domain = this.inferDomain(tableName)
    return `${domain}-team`
  }
}
