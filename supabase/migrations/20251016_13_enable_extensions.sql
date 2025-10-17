-- ============================================================================
-- ENABLE SUPABASE EXTENSIONS
-- ============================================================================
-- Created: 2025-10-16
-- Purpose: Enable recommended Supabase extensions for production
-- ============================================================================

-- Vector search (for AI/ML features)
CREATE EXTENSION IF NOT EXISTS vector;

-- Geographic/spatial data
CREATE EXTENSION IF NOT EXISTS postgis;

-- Scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Full-text search improvements
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Additional useful extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Verification
DO $$
BEGIN
  RAISE NOTICE '✅ All recommended extensions enabled';
  RAISE NOTICE '📦 vector, postgis, pg_cron, pg_trgm, uuid-ossp, pgcrypto';
END $$;
