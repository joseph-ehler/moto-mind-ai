-- ============================================
-- DATABASE INTROSPECTION FUNCTIONS
-- Migration: 20251014_introspection_functions.sql
-- 
-- Purpose: Create functions to expose schema information
-- through Supabase API for introspection tool
-- ============================================

-- Function 1: Get all tables
CREATE OR REPLACE FUNCTION get_all_tables()
RETURNS TABLE (
  table_name text,
  row_count bigint
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.tablename::text,
    0::bigint as row_count  -- Will be calculated separately
  FROM pg_tables t
  WHERE t.schemaname = 'public'
  ORDER BY t.tablename;
END;
$$;

-- Function 2: Get columns for a table
CREATE OR REPLACE FUNCTION get_table_columns(table_name_param text)
RETURNS TABLE (
  column_name text,
  data_type text,
  is_nullable boolean,
  column_default text,
  max_length integer
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.column_name::text,
    c.data_type::text,
    (c.is_nullable = 'YES')::boolean,
    c.column_default::text,
    c.character_maximum_length::integer
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
    AND c.table_name = table_name_param
  ORDER BY c.ordinal_position;
END;
$$;

-- Function 3: Get foreign keys for a table
CREATE OR REPLACE FUNCTION get_table_foreign_keys(table_name_param text)
RETURNS TABLE (
  column_name text,
  foreign_table_name text,
  foreign_column_name text,
  delete_rule text,
  update_rule text
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kcu.column_name::text,
    ccu.table_name::text,
    ccu.column_name::text,
    rc.delete_rule::text,
    rc.update_rule::text
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
  JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
  JOIN information_schema.referential_constraints rc
    ON rc.constraint_name = tc.constraint_name
  WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = table_name_param
    AND tc.table_schema = 'public';
END;
$$;

-- Function 4: Get indexes for a table
CREATE OR REPLACE FUNCTION get_table_indexes(table_name_param text)
RETURNS TABLE (
  index_name text,
  index_definition text
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.indexname::text,
    i.indexdef::text
  FROM pg_indexes i
  WHERE i.tablename = table_name_param
    AND i.schemaname = 'public';
END;
$$;

-- Function 5: Get RLS policies for a table
CREATE OR REPLACE FUNCTION get_table_rls_policies(table_name_param text)
RETURNS TABLE (
  policy_name text,
  permissive text,
  roles text[],
  command text,
  qual text,
  with_check text
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.policyname::text,
    p.permissive::text,
    p.roles::text[],
    p.cmd::text,
    p.qual::text,
    p.with_check::text
  FROM pg_policies p
  WHERE p.tablename = table_name_param
    AND p.schemaname = 'public';
END;
$$;

-- Function 6: Check if RLS is enabled
CREATE OR REPLACE FUNCTION get_table_rls_status(table_name_param text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  rls_enabled boolean;
BEGIN
  SELECT t.rowsecurity INTO rls_enabled
  FROM pg_tables t
  WHERE t.tablename = table_name_param
    AND t.schemaname = 'public';
  
  RETURN COALESCE(rls_enabled, false);
END;
$$;

-- Function 7: Get database summary
CREATE OR REPLACE FUNCTION get_database_summary()
RETURNS TABLE (
  metric text,
  value text
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'Total tables'::text as metric,
    COUNT(*)::text as value
  FROM pg_tables
  WHERE schemaname = 'public'
  UNION ALL
  SELECT 
    'Tables with tenant_id'::text,
    COUNT(DISTINCT table_name)::text
  FROM information_schema.columns
  WHERE table_schema = 'public' AND column_name = 'tenant_id'
  UNION ALL
  SELECT 
    'Tables with RLS enabled'::text,
    COUNT(*)::text
  FROM pg_tables
  WHERE schemaname = 'public' AND rowsecurity = true
  UNION ALL
  SELECT 
    'Total RLS policies'::text,
    COUNT(*)::text
  FROM pg_policies
  WHERE schemaname = 'public'
  UNION ALL
  SELECT 
    'Total indexes'::text,
    COUNT(*)::text
  FROM pg_indexes
  WHERE schemaname = 'public';
END;
$$;

-- Function 8: Get tenant data audit
CREATE OR REPLACE FUNCTION get_tenant_data_audit()
RETURNS TABLE (
  table_name text,
  total_rows bigint,
  rows_with_tenant bigint,
  rows_missing_tenant bigint
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if tables exist and have tenant_id column
  RETURN QUERY
  SELECT 
    'vehicles'::text,
    (SELECT COUNT(*) FROM vehicles)::bigint,
    (SELECT COUNT(*) FROM vehicles WHERE tenant_id IS NOT NULL)::bigint,
    (SELECT COUNT(*) FROM vehicles WHERE tenant_id IS NULL)::bigint
  WHERE EXISTS (SELECT 1 FROM information_schema.columns c WHERE c.table_name = 'vehicles' AND c.column_name = 'tenant_id')
  UNION ALL
  SELECT 
    'vehicle_events'::text,
    (SELECT COUNT(*) FROM vehicle_events)::bigint,
    (SELECT COUNT(*) FROM vehicle_events WHERE tenant_id IS NOT NULL)::bigint,
    (SELECT COUNT(*) FROM vehicle_events WHERE tenant_id IS NULL)::bigint
  WHERE EXISTS (SELECT 1 FROM information_schema.columns c WHERE c.table_name = 'vehicle_events' AND c.column_name = 'tenant_id')
  UNION ALL
  SELECT 
    'vehicle_images'::text,
    (SELECT COUNT(*) FROM vehicle_images)::bigint,
    (SELECT COUNT(*) FROM vehicle_images WHERE tenant_id IS NOT NULL)::bigint,
    (SELECT COUNT(*) FROM vehicle_images WHERE tenant_id IS NULL)::bigint
  WHERE EXISTS (SELECT 1 FROM information_schema.columns c WHERE c.table_name = 'vehicle_images' AND c.column_name = 'tenant_id')
  UNION ALL
  SELECT 
    'photo_metadata'::text,
    (SELECT COUNT(*) FROM photo_metadata)::bigint,
    (SELECT COUNT(*) FROM photo_metadata WHERE tenant_id IS NOT NULL)::bigint,
    (SELECT COUNT(*) FROM photo_metadata WHERE tenant_id IS NULL)::bigint
  WHERE EXISTS (SELECT 1 FROM information_schema.columns c WHERE c.table_name = 'photo_metadata' AND c.column_name = 'tenant_id');
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_all_tables() TO authenticated;
GRANT EXECUTE ON FUNCTION get_table_columns(text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_table_foreign_keys(text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_table_indexes(text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_table_rls_policies(text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_table_rls_status(text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_database_summary() TO authenticated;
GRANT EXECUTE ON FUNCTION get_tenant_data_audit() TO authenticated;

-- Grant to service_role as well (for introspection tool)
GRANT EXECUTE ON FUNCTION get_all_tables() TO service_role;
GRANT EXECUTE ON FUNCTION get_table_columns(text) TO service_role;
GRANT EXECUTE ON FUNCTION get_table_foreign_keys(text) TO service_role;
GRANT EXECUTE ON FUNCTION get_table_indexes(text) TO service_role;
GRANT EXECUTE ON FUNCTION get_table_rls_policies(text) TO service_role;
GRANT EXECUTE ON FUNCTION get_table_rls_status(text) TO service_role;
GRANT EXECUTE ON FUNCTION get_database_summary() TO service_role;
GRANT EXECUTE ON FUNCTION get_tenant_data_audit() TO service_role;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'INTROSPECTION FUNCTIONS CREATED';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Created 8 functions for database introspection:';
  RAISE NOTICE '  - get_all_tables()';
  RAISE NOTICE '  - get_table_columns(table_name)';
  RAISE NOTICE '  - get_table_foreign_keys(table_name)';
  RAISE NOTICE '  - get_table_indexes(table_name)';
  RAISE NOTICE '  - get_table_rls_policies(table_name)';
  RAISE NOTICE '  - get_table_rls_status(table_name)';
  RAISE NOTICE '  - get_database_summary()';
  RAISE NOTICE '  - get_tenant_data_audit()';
  RAISE NOTICE '';
  RAISE NOTICE 'These functions can now be called via Supabase API';
  RAISE NOTICE 'Run: npm run db:introspect';
END $$;
