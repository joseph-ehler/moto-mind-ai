-- ============================================
-- ENABLE SQL EXECUTION FOR AUTONOMOUS MIGRATIONS
-- This must be run ONCE manually to enable the migration runner
-- ============================================

-- Create function to execute arbitrary SQL
CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql;
END;
$$;

-- Grant to service_role
GRANT EXECUTE ON FUNCTION exec_sql(text) TO service_role;

-- Create schema_migrations table if it doesn't exist
CREATE TABLE IF NOT EXISTS schema_migrations (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  applied_at TIMESTAMPTZ DEFAULT NOW()
);

-- Grant access to schema_migrations
GRANT SELECT, INSERT ON schema_migrations TO service_role;
GRANT USAGE ON SEQUENCE schema_migrations_id_seq TO service_role;

-- Verification
DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'SQL EXECUTION ENABLED ✅';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'The migration runner can now apply migrations automatically';
  RAISE NOTICE 'Run: npm run db:migrate';
END $$;
