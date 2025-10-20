/**
 * Embedding Manager
 * 
 * Manages the embedding pipeline for database schema objects:
 * 1. Fetches schema objects from registry.schemas
 * 2. Generates embeddings using EmbeddingService
 * 3. Stores embeddings in registry.vector_index
 * 4. Provides similarity search functionality
 */

import { Database } from '../core'
import { EmbeddingService, formatSchemaForEmbedding, type EmbeddingInput } from './embedding-service'

export interface SchemaObject {
  id: string
  name: string
  schema_name: string
  kind: string
  domain: string | null
  description: string | null
  column_names: string[] | null
  created_at: string
  updated_at: string
}

export interface EmbeddingRecord {
  object_id: string
  embedding_text: string
  embedding: number[]
  dimensions: number
  model: string
  tokens_used: number
}

export interface SimilarityResult {
  id: string
  name: string
  schema_name: string
  kind: string
  domain: string | null
  description: string | null
  similarity: number
  embedding_text: string
}

export interface EmbeddingStats {
  total_objects: number
  embedded: number
  pending: number
  failed: number
  total_tokens: number
  estimated_cost: number
}

export class EmbeddingManager {
  constructor(
    private db: Database,
    private embeddingService: EmbeddingService
  ) {}

  /**
   * Generate and store embeddings for all schema objects
   */
  async embedAll(options: {
    refresh?: boolean  // Re-embed everything
    onProgress?: (completed: number, total: number) => void
  } = {}): Promise<EmbeddingStats> {
    const { refresh = false, onProgress } = options

    // Get all schema objects
    const schemas = await this.getSchemaObjects()
    
    // Filter out already embedded (unless refresh=true)
    const objectsToEmbed = refresh
      ? schemas
      : await this.filterPending(schemas)

    if (objectsToEmbed.length === 0) {
      return this.getStats()
    }

    // Prepare embedding inputs
    const inputs: EmbeddingInput[] = objectsToEmbed.map(schema => ({
      id: schema.id,
      text: formatSchemaForEmbedding(schema)
    }))

    // Generate embeddings with progress
    const results = await this.embeddingService.generateAll(inputs, (completed, total) => {
      if (onProgress) {
        onProgress(completed, total)
      }
    })

    // Store embeddings in database
    await this.storeEmbeddings(results, objectsToEmbed)

    return this.getStats()
  }

  /**
   * Search for similar schema objects
   */
  async findSimilar(
    query: string,
    options: {
      limit?: number
      threshold?: number  // Minimum similarity score (0-1)
      kind?: string       // Filter by kind (table, view, etc.)
      domain?: string     // Filter by domain
    } = {}
  ): Promise<SimilarityResult[]> {
    const { limit = 10, threshold = 0.5, kind, domain } = options

    // Generate embedding for query
    const queryEmbedding = await this.embeddingService.generateOne('query', query)

    // Build SQL query with pgvector similarity search
    let sql = `
      SELECT 
        s.id,
        s.name,
        s.schema_name,
        s.kind,
        s.domain,
        s.description,
        v.text_blob as embedding_text,
        1 - (v.embedding <=> $1::vector) as similarity
      FROM registry.schemas s
      JOIN registry.vector_index v ON s.id = v.object_id
      WHERE 1 = 1
    `

    const params: any[] = [`[${queryEmbedding.embedding.join(',')}]`]
    let paramCount = 1

    if (kind) {
      paramCount++
      sql += ` AND s.kind = $${paramCount}`
      params.push(kind)
    }

    if (domain) {
      paramCount++
      sql += ` AND s.domain = $${paramCount}`
      params.push(domain)
    }

    sql += `
      ORDER BY v.embedding <=> $1::vector
      LIMIT $${paramCount + 1}
    `
    params.push(limit)

    const result = await this.db.query(sql, { params })

    // Filter by threshold
    return result.rows
      .filter((row: any) => row.similarity >= threshold)
      .map((row: any) => ({
        id: row.id,
        name: row.name,
        schema_name: row.schema_name,
        kind: row.kind,
        domain: row.domain,
        description: row.description,
        similarity: parseFloat(row.similarity),
        embedding_text: row.embedding_text
      }))
  }

  /**
   * Get embedding statistics
   */
  async getStats(): Promise<EmbeddingStats> {
    const result = await this.db.query(`
      SELECT 
        COUNT(DISTINCT s.id) as total_objects,
        COUNT(DISTINCT v.object_id) as embedded,
        COALESCE(SUM((v.metadata->>'tokens_used')::integer), 0) as total_tokens
      FROM registry.schemas s
      LEFT JOIN registry.vector_index v ON s.id = v.object_id
      WHERE s.kind IN ('table', 'view')
    `)

    const row = result.rows[0]
    const totalObjects = parseInt(row.total_objects)
    const embedded = parseInt(row.embedded)
    const totalTokens = parseInt(row.total_tokens)

    // Cost estimation: text-embedding-3-small is $0.02 per 1M tokens
    const estimatedCost = (totalTokens / 1_000_000) * 0.02

    return {
      total_objects: totalObjects,
      embedded,
      pending: totalObjects - embedded,
      failed: 0, // TODO: Track failures in database
      total_tokens: totalTokens,
      estimated_cost: estimatedCost
    }
  }

  /**
   * Get all schema objects from registry
   */
  private async getSchemaObjects(): Promise<SchemaObject[]> {
    const result = await this.db.query(`
      SELECT 
        s.id,
        s.name,
        s.schema_name,
        s.kind,
        s.domain,
        s.description,
        ARRAY(
          SELECT c.name
          FROM registry.columns c
          WHERE c.schema_id = s.id
          ORDER BY c.ordinal_position
        ) as column_names,
        s.created_at,
        s.updated_at
      FROM registry.schemas s
      WHERE s.kind IN ('table', 'view')  -- Only embed tables and views for now
      ORDER BY s.schema_name, s.name
    `)

    return result.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      schema_name: row.schema_name,
      kind: row.kind,
      domain: row.domain,
      description: row.description,
      column_names: row.column_names,
      created_at: row.created_at,
      updated_at: row.updated_at
    }))
  }

  /**
   * Filter out schema objects that already have embeddings
   */
  private async filterPending(schemas: SchemaObject[]): Promise<SchemaObject[]> {
    if (schemas.length === 0) {
      return []
    }

    const ids = schemas.map(s => s.id)
    const result = await this.db.query(`
      SELECT object_id
      FROM registry.vector_index
      WHERE object_id = ANY($1)
    `, { params: [ids] })

    const embeddedIds = new Set(result.rows.map((r: any) => r.object_id))
    return schemas.filter(s => !embeddedIds.has(s.id))
  }

  /**
   * Store embeddings in database
   */
  private async storeEmbeddings(
    embeddings: Array<{ id: string; embedding: number[]; tokens: number }>,
    schemas: SchemaObject[]
  ): Promise<void> {
    const schemaMap = new Map(schemas.map(s => [s.id, s]))
    const dimensions = this.embeddingService.getDimensions()
    const model = 'text-embedding-3-small'

    for (const emb of embeddings) {
      const schema = schemaMap.get(emb.id)
      if (!schema) continue

      const textBlob = formatSchemaForEmbedding(schema)
      const embeddingVector = `[${emb.embedding.join(',')}]`
      const metadata = {
        dimensions,
        model,
        tokens_used: emb.tokens,
        generated_at: new Date().toISOString()
      }

      // Delete existing embedding if present
      await this.db.query(`
        DELETE FROM registry.vector_index WHERE object_id = $1
      `, { params: [emb.id] })

      // Insert new embedding
      await this.db.query(`
        INSERT INTO registry.vector_index (
          object_id,
          object_type,
          text_blob,
          embedding,
          domain,
          metadata
        ) VALUES ($1, $2, $3, $4::vector, $5, $6)
      `, {
        params: [
          emb.id,
          schema.kind,
          textBlob,
          embeddingVector,
          schema.domain,
          JSON.stringify(metadata)
        ]
      })
    }
  }
}
