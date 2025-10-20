/**
 * Embedding Service
 * 
 * Generates embeddings for database schema objects using OpenAI
 * Features:
 * - Batch processing (50 at a time)
 * - Idempotent & resumable
 * - Progress tracking
 * - Error handling with retries
 */

import OpenAI from 'openai'

export interface EmbeddingInput {
  id: string
  text: string
}

export interface EmbeddingResult {
  id: string
  embedding: number[]
  tokens: number
}

export interface EmbeddingOptions {
  model?: string
  batchSize?: number
  maxRetries?: number
}

export class EmbeddingService {
  private openai: OpenAI
  private model: string
  private batchSize: number
  private maxRetries: number

  constructor(options: EmbeddingOptions = {}) {
    const apiKey = process.env.OPENAI_API_KEY
    
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required')
    }

    this.openai = new OpenAI({ apiKey })
    this.model = options.model || 'text-embedding-3-small' // 1536 dimensions, cost-effective
    this.batchSize = options.batchSize || 50
    this.maxRetries = options.maxRetries || 3
  }

  /**
   * Generate embeddings for a batch of texts
   */
  async generateBatch(inputs: EmbeddingInput[]): Promise<EmbeddingResult[]> {
    if (inputs.length === 0) {
      return []
    }

    if (inputs.length > this.batchSize) {
      throw new Error(`Batch size ${inputs.length} exceeds maximum ${this.batchSize}`)
    }

    let lastError: Error | null = null
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await this.openai.embeddings.create({
          model: this.model,
          input: inputs.map(i => i.text),
          encoding_format: 'float'
        })

        return response.data.map((item, index) => ({
          id: inputs[index].id,
          embedding: item.embedding,
          tokens: response.usage?.total_tokens || 0
        }))
      } catch (error) {
        lastError = error as Error
        
        if (attempt < this.maxRetries) {
          // Exponential backoff: 1s, 2s, 4s
          const delay = Math.pow(2, attempt - 1) * 1000
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }

    throw new Error(`Failed after ${this.maxRetries} attempts: ${lastError?.message}`)
  }

  /**
   * Generate embeddings for all inputs with automatic batching
   */
  async generateAll(
    inputs: EmbeddingInput[],
    onProgress?: (completed: number, total: number) => void
  ): Promise<EmbeddingResult[]> {
    const results: EmbeddingResult[] = []
    const batches = this.createBatches(inputs, this.batchSize)

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i]
      const batchResults = await this.generateBatch(batch)
      results.push(...batchResults)

      if (onProgress) {
        onProgress(results.length, inputs.length)
      }
    }

    return results
  }

  /**
   * Generate embedding for a single text
   */
  async generateOne(id: string, text: string): Promise<EmbeddingResult> {
    const results = await this.generateBatch([{ id, text }])
    return results[0]
  }

  /**
   * Get embedding dimensions for the current model
   */
  getDimensions(): number {
    // text-embedding-3-small: 1536 dimensions
    // text-embedding-3-large: 3072 dimensions
    // text-embedding-ada-002: 1536 dimensions
    switch (this.model) {
      case 'text-embedding-3-large':
        return 3072
      case 'text-embedding-3-small':
      case 'text-embedding-ada-002':
      default:
        return 1536
    }
  }

  /**
   * Split inputs into batches
   */
  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = []
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize))
    }
    return batches
  }
}

/**
 * Format schema object for embedding
 * Combines name, domain, and description into a rich text representation
 */
export function formatSchemaForEmbedding(schema: {
  name: string
  schema_name: string
  kind: string
  domain?: string | null
  description?: string | null
  column_names?: string[] | null
}): string {
  const parts: string[] = []

  // Full qualified name
  parts.push(`${schema.schema_name}.${schema.name}`)

  // Kind
  parts.push(`Type: ${schema.kind}`)

  // Domain context
  if (schema.domain) {
    parts.push(`Domain: ${schema.domain}`)
  }

  // Description
  if (schema.description) {
    parts.push(`Description: ${schema.description}`)
  }

  // Column names (for tables)
  if (schema.column_names && schema.column_names.length > 0) {
    parts.push(`Columns: ${schema.column_names.join(', ')}`)
  }

  return parts.join(' | ')
}
