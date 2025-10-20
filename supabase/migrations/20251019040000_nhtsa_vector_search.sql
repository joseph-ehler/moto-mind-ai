/**
 * NHTSA Vector Search + RAG System
 * 
 * Enables semantic search over complaints:
 * - "Ask My Car" feature
 * - Find similar problems
 * - Citation-based answers
 * 
 * Uses pgvector + OpenAI embeddings (1536 dimensions)
 */

-- ============================================================================
-- ENABLE PGVECTOR EXTENSION
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================================
-- ADD VECTOR COLUMNS
-- ============================================================================

-- Add embedding column to complaints
ALTER TABLE nhtsa_complaints 
ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Add metadata for embedding generation
ALTER TABLE nhtsa_complaints
ADD COLUMN IF NOT EXISTS embedding_generated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS embedding_model TEXT DEFAULT 'text-embedding-3-small';

COMMENT ON COLUMN nhtsa_complaints.embedding IS 'OpenAI embedding vector for semantic search';
COMMENT ON COLUMN nhtsa_complaints.embedding_generated_at IS 'When embedding was last generated';
COMMENT ON COLUMN nhtsa_complaints.embedding_model IS 'OpenAI model used (text-embedding-3-small or text-embedding-ada-002)';

-- ============================================================================
-- CREATE HNSW INDEX (Fast similarity search)
-- ============================================================================

-- HNSW index for cosine similarity (best for OpenAI embeddings)
CREATE INDEX IF NOT EXISTS idx_complaints_embedding_hnsw
  ON nhtsa_complaints
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Index for finding records that need embeddings
CREATE INDEX IF NOT EXISTS idx_complaints_no_embedding
  ON nhtsa_complaints (id)
  WHERE embedding IS NULL;

COMMENT ON INDEX idx_complaints_embedding_hnsw IS 'HNSW index for fast vector similarity search';

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

/**
 * Find similar complaints using vector search
 * 
 * @param query_embedding - Vector to search for
 * @param match_threshold - Similarity threshold (0-1)
 * @param match_count - Max results to return
 * @param vehicle_year - Optional: filter by year
 * @param vehicle_make - Optional: filter by make
 * @param vehicle_model - Optional: filter by model
 */
CREATE OR REPLACE FUNCTION search_similar_complaints(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10,
  vehicle_year text DEFAULT NULL,
  vehicle_make text DEFAULT NULL,
  vehicle_model text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  odi_number text,
  year text,
  make text,
  model text,
  component text,
  summary text,
  description text,
  complaint_date timestamptz,
  crash boolean,
  fire boolean,
  injured integer,
  deaths integer,
  mileage integer,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    c.id,
    c.odi_number,
    c.year,
    c.make,
    c.model,
    c.component,
    c.summary,
    c.description,
    c.complaint_date,
    c.crash,
    c.fire,
    c.injured,
    c.deaths,
    c.mileage,
    1 - (c.embedding <=> query_embedding) as similarity
  FROM nhtsa_complaints c
  WHERE 
    c.embedding IS NOT NULL
    AND 1 - (c.embedding <=> query_embedding) > match_threshold
    AND (vehicle_year IS NULL OR c.year = vehicle_year)
    AND (vehicle_make IS NULL OR c.make = vehicle_make)
    AND (vehicle_model IS NULL OR c.model = vehicle_model)
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
$$;

COMMENT ON FUNCTION search_similar_complaints IS 'Semantic search for similar complaints using vector similarity';

/**
 * Get embedding generation stats
 */
CREATE OR REPLACE FUNCTION get_embedding_stats()
RETURNS TABLE (
  total_complaints bigint,
  with_embeddings bigint,
  without_embeddings bigint,
  percentage_complete numeric,
  oldest_embedding timestamptz,
  newest_embedding timestamptz
)
LANGUAGE sql STABLE
AS $$
  SELECT
    COUNT(*) as total_complaints,
    COUNT(embedding) as with_embeddings,
    COUNT(*) - COUNT(embedding) as without_embeddings,
    ROUND((COUNT(embedding)::numeric / COUNT(*)::numeric) * 100, 2) as percentage_complete,
    MIN(embedding_generated_at) as oldest_embedding,
    MAX(embedding_generated_at) as newest_embedding
  FROM nhtsa_complaints;
$$;

COMMENT ON FUNCTION get_embedding_stats IS 'Get statistics about embedding generation progress';

-- ============================================================================
-- EMBEDDING GENERATION QUEUE
-- ============================================================================

/**
 * Track embedding generation progress
 */
CREATE TABLE IF NOT EXISTS embedding_generation_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id uuid NOT NULL REFERENCES nhtsa_complaints(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  attempts integer NOT NULL DEFAULT 0,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  processed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_embedding_queue_status ON embedding_generation_queue(status);
CREATE INDEX IF NOT EXISTS idx_embedding_queue_complaint ON embedding_generation_queue(complaint_id);

COMMENT ON TABLE embedding_generation_queue IS 'Queue for batch embedding generation';

/**
 * Add records to embedding queue
 */
CREATE OR REPLACE FUNCTION queue_embeddings_for_generation(batch_size int DEFAULT 1000)
RETURNS int
LANGUAGE plpgsql
AS $$
DECLARE
  records_queued int;
BEGIN
  -- Insert complaints without embeddings into queue
  INSERT INTO embedding_generation_queue (complaint_id)
  SELECT id
  FROM nhtsa_complaints
  WHERE embedding IS NULL
    AND id NOT IN (SELECT complaint_id FROM embedding_generation_queue)
  LIMIT batch_size;
  
  GET DIAGNOSTICS records_queued = ROW_COUNT;
  
  RETURN records_queued;
END;
$$;

COMMENT ON FUNCTION queue_embeddings_for_generation IS 'Add complaints to embedding generation queue';

-- ============================================================================
-- MATERIALIZED VIEW: Complaint Clusters
-- ============================================================================

/**
 * Pre-computed complaint clusters for faster "related problems" queries
 * This will be populated after embeddings are generated
 */
CREATE MATERIALIZED VIEW IF NOT EXISTS complaint_clusters AS
SELECT
  year,
  make,
  model,
  component,
  COUNT(*) as complaint_count,
  AVG(1 - (embedding <=> (SELECT embedding FROM nhtsa_complaints WHERE component = c.component LIMIT 1))) as avg_similarity,
  ARRAY_AGG(id ORDER BY complaint_date DESC LIMIT 5) as sample_complaint_ids
FROM nhtsa_complaints c
WHERE embedding IS NOT NULL
GROUP BY year, make, model, component
HAVING COUNT(*) >= 3;

CREATE INDEX IF NOT EXISTS idx_complaint_clusters_vehicle
  ON complaint_clusters(year, make, model);

COMMENT ON MATERIALIZED VIEW complaint_clusters IS 'Pre-computed clusters of similar complaints';

-- ============================================================================
-- HELPER VIEW: Complaints Ready for RAG
-- ============================================================================

CREATE OR REPLACE VIEW complaints_with_embeddings AS
SELECT
  id,
  odi_number,
  year,
  make,
  model,
  component,
  summary,
  description,
  complaint_date,
  crash,
  fire,
  injured,
  deaths,
  mileage,
  embedding,
  embedding_generated_at,
  embedding_model
FROM nhtsa_complaints
WHERE embedding IS NOT NULL;

COMMENT ON VIEW complaints_with_embeddings IS 'Complaints ready for RAG/semantic search';

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant access to service role
GRANT SELECT ON nhtsa_complaints TO anon, authenticated;
GRANT SELECT ON complaints_with_embeddings TO anon, authenticated;
GRANT SELECT ON complaint_clusters TO anon, authenticated;
GRANT EXECUTE ON FUNCTION search_similar_complaints TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_embedding_stats TO anon, authenticated;
