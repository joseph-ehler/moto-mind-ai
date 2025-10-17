-- Migration: Add Database Introspection Functions
-- Generated: 2025-10-16
-- Purpose: Add functions for comprehensive database introspection including materialized views

-- ============================================================================
-- FUNCTION: Get Materialized Views
-- ============================================================================

CREATE OR REPLACE FUNCTION get_materialized_views()
RETURNS TABLE (
  schemaname TEXT,
  matviewname TEXT,
  matviewowner TEXT,
  tablespace TEXT,
  hasindexes BOOLEAN,
  ispopulated BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mv.schemaname::TEXT,
    mv.matviewname::TEXT,
    mv.matviewowner::TEXT,
    mv.tablespace::TEXT,
    mv.hasindexes,
    mv.ispopulated
  FROM pg_matviews mv
  WHERE mv.schemaname = 'public'
  ORDER BY mv.matviewname;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_materialized_views() IS 
  'Returns list of materialized views in public schema';

-- ============================================================================
-- FUNCTION: Get Materialized View Info
-- ============================================================================

CREATE OR REPLACE FUNCTION get_matview_info(view_name_param TEXT)
RETURNS TABLE (
  definition TEXT,
  last_refresh TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pg_get_viewdef(c.oid)::TEXT as definition,
    NULL::TIMESTAMP WITH TIME ZONE as last_refresh -- PostgreSQL doesn't track this by default
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE c.relkind = 'm' -- materialized view
    AND n.nspname = 'public'
    AND c.relname = view_name_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_matview_info(TEXT) IS 
  'Returns definition and metadata for a specific materialized view';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  matview_count INTEGER;
  matview_record RECORD;
BEGIN
  SELECT COUNT(*) INTO matview_count
  FROM pg_matviews
  WHERE schemaname = 'public';
  
  RAISE NOTICE '';
  RAISE NOTICE '✅ Introspection functions created!';
  RAISE NOTICE '';
  RAISE NOTICE '📊 MATERIALIZED VIEWS FOUND: %', matview_count;
  
  IF matview_count > 0 THEN
    RAISE NOTICE '';
    RAISE NOTICE 'Materialized views in public schema:';
    FOR matview_record IN 
      SELECT matviewname 
      FROM pg_matviews 
      WHERE schemaname = 'public'
      ORDER BY matviewname
    LOOP
      RAISE NOTICE '  - %', matview_record.matviewname;
    END LOOP;
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '🔧 FUNCTIONS AVAILABLE:';
  RAISE NOTICE '  - get_materialized_views()';
  RAISE NOTICE '  - get_matview_info(view_name)';
  RAISE NOTICE '';
  RAISE NOTICE 'Run: npm run db:introspect';
  RAISE NOTICE '';
END $$;
