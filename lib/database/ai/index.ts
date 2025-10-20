/**
 * AI Services for Database Operations
 * 
 * Embedding generation and similarity search for schema objects
 */

export { EmbeddingService, formatSchemaForEmbedding } from './embedding-service'
export type { EmbeddingInput, EmbeddingResult, EmbeddingOptions } from './embedding-service'

/**
 * AI-Powered Features
 * 
 * Embedding, semantic search, and DDL generation capabilities
 */

export { EmbeddingManager } from './embedding-manager'
export { DDLGenerator } from './ddl-generator'
export type { TableIntent, GeneratedDDL } from './ddl-generator'
export type {
  SchemaObject,
  EmbeddingRecord,
  SimilarityResult,
  EmbeddingStats
} from './embedding-manager'
