-- ============================================================================
-- LOGS TABLE
-- ============================================================================
-- Created: 2025-10-16
-- Purpose: Store application logs with tenant isolation
-- Retention: 30 days (cleanup via scheduled job)
-- ============================================================================

CREATE TABLE IF NOT EXISTS logs (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Tenant Isolation
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- User Context
  user_id TEXT,
  
  -- Log Data
  level TEXT NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error', 'fatal')),
  message TEXT NOT NULL,
  context JSONB DEFAULT '{}',
  error JSONB,
  
  -- Metadata
  source TEXT, -- 'client' or 'server'
  url TEXT,
  user_agent TEXT,
  ip_address INET,
  
  -- Timestamp
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- No soft delete for logs (hard delete after retention period)
  
  -- Indexes inline for performance
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Tenant + timestamp (most common query)
CREATE INDEX idx_logs_tenant_timestamp 
  ON logs(tenant_id, timestamp DESC);

-- Level filtering (error monitoring)
CREATE INDEX idx_logs_level_timestamp 
  ON logs(level, timestamp DESC) 
  WHERE level IN ('error', 'fatal');

-- User activity tracking
CREATE INDEX idx_logs_user_timestamp 
  ON logs(user_id, timestamp DESC) 
  WHERE user_id IS NOT NULL;

-- Context search (GIN index for JSONB)
CREATE INDEX idx_logs_context 
  ON logs USING gin(context);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE logs ENABLE ROW LEVEL SECURITY;

-- Service role full access
CREATE POLICY logs_service_role 
  ON logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Tenant isolation for authenticated users
CREATE POLICY logs_tenant_isolation 
  ON logs
  FOR SELECT
  TO authenticated
  USING (
    tenant_id IS NULL OR 
    tenant_id::TEXT = current_setting('app.current_tenant_id', true)
  );

-- ============================================================================
-- CLEANUP FUNCTION (30-day retention)
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_old_logs()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM logs
  WHERE timestamp < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE logs IS 'Application logs with 30-day retention';
COMMENT ON COLUMN logs.tenant_id IS 'Tenant isolation (nullable for system logs)';
COMMENT ON COLUMN logs.level IS 'Log severity: debug, info, warn, error, fatal';
COMMENT ON COLUMN logs.context IS 'Additional structured context (JSONB)';
COMMENT ON COLUMN logs.error IS 'Error details including stack trace (JSONB)';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'logs'
  ) THEN
    RAISE NOTICE '✅ Logs table created successfully';
    RAISE NOTICE '📊 Retention policy: 30 days';
    RAISE NOTICE '🔒 RLS enabled with tenant isolation';
  ELSE
    RAISE EXCEPTION '❌ Logs table creation failed';
  END IF;
END $$;
