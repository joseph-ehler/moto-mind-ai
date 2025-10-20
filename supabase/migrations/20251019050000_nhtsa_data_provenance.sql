/**
 * NHTSA Data Provenance & Refresh System
 * 
 * Tracks every data import to enable:
 * - Incremental updates (skip existing records)
 * - Smart downloads (only if file changed)
 * - Audit trail (when/what/how much)
 * - Monitoring/alerts (detect stale data)
 */

-- ============================================================================
-- PROVENANCE TABLE - Track Every Import
-- ============================================================================

CREATE TABLE IF NOT EXISTS nhtsa_data_provenance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- File identification
  source_type TEXT NOT NULL CHECK (source_type IN ('complaints', 'investigations', 'recalls')),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  
  -- File metadata
  file_size_bytes BIGINT,
  file_hash_sha256 TEXT, -- Detect if file changed
  file_last_modified TIMESTAMPTZ,
  
  -- Import metadata
  import_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  import_completed_at TIMESTAMPTZ,
  import_duration_seconds INT GENERATED ALWAYS AS (
    EXTRACT(EPOCH FROM (import_completed_at - import_started_at))::INT
  ) STORED,
  
  -- Processing stats
  records_processed INT DEFAULT 0,
  records_inserted INT DEFAULT 0,
  records_updated INT DEFAULT 0,
  records_skipped INT DEFAULT 0,
  records_failed INT DEFAULT 0,
  
  -- High-water mark (for incremental processing)
  max_odi_number TEXT, -- Last ODI number processed
  max_date_received TIMESTAMPTZ, -- Last complaint date
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'started' CHECK (status IN ('started', 'processing', 'completed', 'failed')),
  error_message TEXT,
  
  -- Metadata
  import_method TEXT DEFAULT 'manual' CHECK (import_method IN ('manual', 'github_action', 'api', 'cli')),
  import_version TEXT, -- Track script/migration version
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX idx_provenance_source_type ON nhtsa_data_provenance(source_type, status);
CREATE INDEX idx_provenance_completed ON nhtsa_data_provenance(import_completed_at DESC) WHERE status = 'completed';
CREATE INDEX idx_provenance_file_hash ON nhtsa_data_provenance(file_hash_sha256);
CREATE INDEX idx_provenance_status ON nhtsa_data_provenance(status, import_started_at DESC);

-- Partial unique index: prevent duplicate completed imports for same file
CREATE UNIQUE INDEX idx_provenance_unique_completed 
  ON nhtsa_data_provenance(source_type, file_hash_sha256) 
  WHERE status = 'completed';

-- Comments
COMMENT ON TABLE nhtsa_data_provenance IS 'Tracks all NHTSA data imports for incremental updates and monitoring';
COMMENT ON COLUMN nhtsa_data_provenance.file_hash_sha256 IS 'SHA256 hash - detect if file changed without downloading';
COMMENT ON COLUMN nhtsa_data_provenance.max_odi_number IS 'High-water mark for incremental processing';

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function: Get last successful import for source type
CREATE OR REPLACE FUNCTION get_last_import(source TEXT)
RETURNS TABLE (
  import_id UUID,
  file_hash TEXT,
  max_odi TEXT,
  completed_at TIMESTAMPTZ,
  records_inserted INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    id,
    file_hash_sha256,
    max_odi_number,
    import_completed_at,
    records_inserted
  FROM nhtsa_data_provenance
  WHERE source_type = source
    AND status = 'completed'
  ORDER BY import_completed_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_last_import IS 'Get metadata from last successful import for incremental updates';

-- Function: Check if file already imported
CREATE OR REPLACE FUNCTION is_file_imported(hash TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM nhtsa_data_provenance
    WHERE file_hash_sha256 = hash
      AND status = 'completed'
  );
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION is_file_imported IS 'Check if file with this hash was already successfully imported';

-- Function: Get data freshness stats
CREATE OR REPLACE FUNCTION get_data_freshness()
RETURNS TABLE (
  source_type TEXT,
  last_import TIMESTAMPTZ,
  days_since_import INT,
  is_stale BOOLEAN,
  records_in_last_import INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.source_type,
    p.import_completed_at,
    EXTRACT(DAY FROM NOW() - p.import_completed_at)::INT as days_since,
    (NOW() - p.import_completed_at) > INTERVAL '7 days' as stale,
    p.records_inserted
  FROM nhtsa_data_provenance p
  WHERE p.status = 'completed'
    AND p.import_completed_at = (
      SELECT MAX(import_completed_at)
      FROM nhtsa_data_provenance
      WHERE source_type = p.source_type
        AND status = 'completed'
    )
  ORDER BY p.source_type;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_data_freshness IS 'Check how fresh our data is and if refresh needed';

-- Function: Get import history stats
CREATE OR REPLACE FUNCTION get_import_history(days INT DEFAULT 30)
RETURNS TABLE (
  import_date DATE,
  source_type TEXT,
  records_added INT,
  duration_seconds INT,
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    DATE(import_started_at),
    p.source_type,
    p.records_inserted,
    p.import_duration_seconds,
    p.status
  FROM nhtsa_data_provenance p
  WHERE import_started_at > NOW() - (days || ' days')::INTERVAL
  ORDER BY import_started_at DESC;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_import_history IS 'Get import history for monitoring and debugging';

-- ============================================================================
-- MONITORING VIEW
-- ============================================================================

CREATE OR REPLACE VIEW nhtsa_data_health AS
SELECT 
  'complaints' as source_type,
  COUNT(*) as total_records,
  MAX(complaint_date) as most_recent_complaint,
  MIN(complaint_date) as oldest_complaint,
  (SELECT completed_at FROM get_last_import('complaints') LIMIT 1) as last_import,
  (SELECT df.days_since_import FROM get_data_freshness() df WHERE df.source_type = 'complaints') as days_since_import,
  (SELECT df.is_stale FROM get_data_freshness() df WHERE df.source_type = 'complaints') as is_stale
FROM nhtsa_complaints

UNION ALL

SELECT 
  'total_system' as source_type,
  (SELECT COUNT(*) FROM nhtsa_complaints) as total_records,
  (SELECT MAX(import_completed_at) FROM nhtsa_data_provenance WHERE status = 'completed') as most_recent,
  (SELECT MIN(import_completed_at) FROM nhtsa_data_provenance WHERE status = 'completed') as oldest,
  (SELECT MAX(import_completed_at) FROM nhtsa_data_provenance WHERE status = 'completed') as last_import,
  (SELECT MAX(df.days_since_import) FROM get_data_freshness() df) as days_since,
  (SELECT MAX(df.days_since_import) FROM get_data_freshness() df) > 7 as is_stale;

COMMENT ON VIEW nhtsa_data_health IS 'Monitor data freshness and health at a glance';

-- ============================================================================
-- RLS POLICIES (Service role only for now)
-- ============================================================================

ALTER TABLE nhtsa_data_provenance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage provenance"
  ON nhtsa_data_provenance FOR ALL
  USING (true) WITH CHECK (true);

COMMENT ON POLICY "Service role can manage provenance" ON nhtsa_data_provenance IS 
  'Permissive - provenance managed by automation/admin only';

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT ON nhtsa_data_provenance TO anon, authenticated;
GRANT SELECT ON nhtsa_data_health TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_last_import TO anon, authenticated;
GRANT EXECUTE ON FUNCTION is_file_imported TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_data_freshness TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_import_history TO anon, authenticated;
