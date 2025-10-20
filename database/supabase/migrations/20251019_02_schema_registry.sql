-- =====================================================
-- PHASE 5: AI PREFLIGHT SYSTEM - SCHEMA REGISTRY
-- =====================================================
-- Purpose: Create registry tables for schema tracking and similarity detection
-- Author: God-Tier Database Toolkit
-- Date: October 19, 2024
-- Phase: 5 (AI Safety System)

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm; -- For text search

-- Create registry schema
CREATE SCHEMA IF NOT EXISTS registry;

COMMENT ON SCHEMA registry IS 'Schema registry for AI preflight system - tracks all database objects for similarity detection';

-- =====================================================
-- CORE REGISTRY TABLES
-- =====================================================

-- Main schemas table (tables, views, enums, functions)
CREATE TABLE registry.schemas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind TEXT NOT NULL CHECK (kind IN ('table', 'view', 'enum', 'function', 'type')),
  name TEXT NOT NULL,
  schema_name TEXT NOT NULL DEFAULT 'public',
  domain TEXT NOT NULL, -- 'vehicles', 'trips', 'ownership', 'auth', 'general'
  description TEXT,
  owner TEXT, -- github handle or team name
  metadata JSONB DEFAULT '{}',
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(schema_name, kind, name)
);

CREATE INDEX idx_schemas_kind ON registry.schemas(kind);
CREATE INDEX idx_schemas_domain ON registry.schemas(domain);
CREATE INDEX idx_schemas_name_trgm ON registry.schemas USING gin(name gin_trgm_ops);

COMMENT ON TABLE registry.schemas IS 'Registry of all database objects (tables, views, enums, functions)';
COMMENT ON COLUMN registry.schemas.domain IS 'Business domain: vehicles, trips, ownership, auth, general';
COMMENT ON COLUMN registry.schemas.owner IS 'GitHub handle or team responsible for this object';

-- Columns table
CREATE TABLE registry.columns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schema_id UUID NOT NULL REFERENCES registry.schemas(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  ordinal_position INTEGER NOT NULL,
  data_type TEXT NOT NULL,
  is_nullable BOOLEAN NOT NULL DEFAULT true,
  default_expr TEXT,
  character_maximum_length INTEGER,
  references TEXT, -- FK target (e.g., 'vehicles.id')
  description TEXT,
  tags JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(schema_id, name)
);

CREATE INDEX idx_columns_schema_id ON registry.columns(schema_id);
CREATE INDEX idx_columns_name_trgm ON registry.columns USING gin(name gin_trgm_ops);
CREATE INDEX idx_columns_references ON registry.columns(references) WHERE references IS NOT NULL;

COMMENT ON TABLE registry.columns IS 'Columns for each registered table/view';
COMMENT ON COLUMN registry.columns.references IS 'Foreign key target in format schema.table.column';

-- =====================================================
-- VECTOR INDEX FOR SIMILARITY DETECTION
-- =====================================================

-- Vector index table (pgvector for semantic search)
CREATE TABLE registry.vector_index (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  object_id UUID NOT NULL, -- references registry.schemas or registry.columns
  object_type TEXT NOT NULL CHECK (object_type IN ('table', 'column', 'view', 'enum')),
  embedding vector(1536), -- OpenAI text-embedding-ada-002
  text_blob TEXT NOT NULL, -- searchable text (name + domain + description + columns)
  domain TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Vector similarity index (IVFFlat for faster similarity search)
CREATE INDEX idx_vector_cosine ON registry.vector_index 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

CREATE INDEX idx_vector_domain ON registry.vector_index(domain);
CREATE INDEX idx_vector_object_type ON registry.vector_index(object_type);
CREATE INDEX idx_vector_text_trgm ON registry.vector_index USING gin(text_blob gin_trgm_ops);

COMMENT ON TABLE registry.vector_index IS 'Vector embeddings for semantic similarity search';
COMMENT ON COLUMN registry.vector_index.embedding IS 'OpenAI ada-002 embedding (1536 dimensions)';
COMMENT ON COLUMN registry.vector_index.text_blob IS 'Searchable text used to generate embedding';

-- =====================================================
-- CHANGE HISTORY
-- =====================================================

-- Track schema changes over time
CREATE TABLE registry.change_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schema_id UUID REFERENCES registry.schemas(id) ON DELETE SET NULL,
  change_type TEXT NOT NULL CHECK (change_type IN ('created', 'modified', 'deleted')),
  changed_by TEXT, -- github handle
  change_description TEXT,
  ddl_statement TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_change_history_schema_id ON registry.change_history(schema_id);
CREATE INDEX idx_change_history_created_at ON registry.change_history(created_at DESC);

COMMENT ON TABLE registry.change_history IS 'Audit log of schema changes';

-- =====================================================
-- PREFLIGHT CHECKS LOG
-- =====================================================

-- Track all preflight checks
CREATE TABLE registry.preflight_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_name TEXT NOT NULL,
  domain TEXT NOT NULL,
  initiated_by TEXT, -- 'cascade' or github handle
  status TEXT NOT NULL CHECK (status IN ('passed', 'failed', 'needs_review', 'approved', 'rejected')),
  duplicates_found INTEGER DEFAULT 0,
  violations_found INTEGER DEFAULT 0,
  plan JSONB NOT NULL, -- Full ChangePlan JSON
  resolution TEXT, -- What was decided
  resolved_by TEXT, -- Who approved/rejected
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX idx_preflight_checks_status ON registry.preflight_checks(status);
CREATE INDEX idx_preflight_checks_created_at ON registry.preflight_checks(created_at DESC);
CREATE INDEX idx_preflight_checks_domain ON registry.preflight_checks(domain);

COMMENT ON TABLE registry.preflight_checks IS 'Log of all AI preflight checks';
COMMENT ON COLUMN registry.preflight_checks.plan IS 'Complete ChangePlan JSON from preflight analysis';

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to infer domain from table name
CREATE OR REPLACE FUNCTION registry.infer_domain(table_name TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Vehicles domain
  IF table_name ~ '(vehicle|maintenance|service|repair)' THEN
    RETURN 'vehicles';
  END IF;
  
  -- Trips domain
  IF table_name ~ '(trip|journey|route)' THEN
    RETURN 'trips';
  END IF;
  
  -- Ownership domain
  IF table_name ~ '(owner|ownership|transfer)' THEN
    RETURN 'ownership';
  END IF;
  
  -- Auth domain
  IF table_name ~ '(user|profile|auth|session|account)' THEN
    RETURN 'auth';
  END IF;
  
  -- Parking domain
  IF table_name ~ '(park|spot|lot)' THEN
    RETURN 'parking';
  END IF;
  
  -- Tracking domain
  IF table_name ~ '(track|location|position|gps)' THEN
    RETURN 'tracking';
  END IF;
  
  -- Default
  RETURN 'general';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION registry.infer_domain IS 'Infer business domain from table name';

-- Function to calculate similarity score
CREATE OR REPLACE FUNCTION registry.similarity_score(
  embedding1 vector(1536),
  embedding2 vector(1536)
)
RETURNS FLOAT AS $$
BEGIN
  RETURN 1 - (embedding1 <=> embedding2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION registry.similarity_score IS 'Calculate cosine similarity between two embeddings (0-1)';

-- =====================================================
-- UPDATE TRIGGERS
-- =====================================================

-- Auto-update updated_at on schemas
CREATE OR REPLACE FUNCTION registry.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER schemas_updated_at
  BEFORE UPDATE ON registry.schemas
  FOR EACH ROW
  EXECUTE FUNCTION registry.update_updated_at();

CREATE TRIGGER vector_index_updated_at
  BEFORE UPDATE ON registry.vector_index
  FOR EACH ROW
  EXECUTE FUNCTION registry.update_updated_at();

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE registry.schemas ENABLE ROW LEVEL SECURITY;
ALTER TABLE registry.columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE registry.vector_index ENABLE ROW LEVEL SECURITY;
ALTER TABLE registry.change_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE registry.preflight_checks ENABLE ROW LEVEL SECURITY;

-- Allow all operations (service role bypasses RLS)
CREATE POLICY "Allow all operations on schemas"
  ON registry.schemas FOR ALL
  USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on columns"
  ON registry.columns FOR ALL
  USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on vector_index"
  ON registry.vector_index FOR ALL
  USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on change_history"
  ON registry.change_history FOR ALL
  USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on preflight_checks"
  ON registry.preflight_checks FOR ALL
  USING (true) WITH CHECK (true);

-- =====================================================
-- INITIAL DATA
-- =====================================================

-- Add comment about NextAuth
COMMENT ON SCHEMA registry IS 
  'Schema registry for AI preflight system. Auth handled in API via NextAuth, not RLS.';

-- Success message
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Schema registry created successfully!';
  RAISE NOTICE '📊 Tables: schemas, columns, vector_index, change_history, preflight_checks';
  RAISE NOTICE '🔍 Ready for similarity detection and AI preflight checks';
  RAISE NOTICE '🚀 Next: npm run db registry:sync to populate from existing schema';
END $$;
