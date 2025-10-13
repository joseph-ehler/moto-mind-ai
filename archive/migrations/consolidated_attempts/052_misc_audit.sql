-- MotoMind Database Schema Audit
-- Comprehensive analysis of all tables and columns in public schema

-- =============================================================================
-- 1. LIST ALL TABLES WITH ROW COUNTS
-- =============================================================================

SELECT 
  schemaname,
  tablename,
  n_tup_ins as total_inserts,
  n_tup_upd as total_updates,
  n_tup_del as total_deletes,
  n_live_tup as current_rows,
  n_dead_tup as dead_rows
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- =============================================================================
-- 2. DETAILED COLUMN ANALYSIS FOR EACH TABLE
-- =============================================================================

SELECT 
  t.table_name,
  t.table_type,
  c.column_name,
  c.ordinal_position,
  c.data_type,
  c.character_maximum_length,
  c.is_nullable,
  c.column_default,
  CASE 
    WHEN c.column_name = 'id' THEN '🔑 Primary Key'
    WHEN c.column_name LIKE '%_id' THEN '🔗 Foreign Key'
    WHEN c.column_name IN ('created_at', 'updated_at', 'deleted_at') THEN '⏰ Timestamp'
    WHEN c.column_name = 'tenant_id' THEN '🏢 Tenant'
    WHEN c.data_type = 'jsonb' THEN '📄 JSON'
    ELSE ''
  END as field_type
FROM information_schema.tables t
JOIN information_schema.columns c ON t.table_name = c.table_name
WHERE t.table_schema = 'public' 
  AND t.table_type = 'BASE TABLE'
ORDER BY t.table_name, c.ordinal_position;

-- =============================================================================
-- 3. SCHEMA HEALTH CHECK
-- =============================================================================

-- Tables missing standard fields
WITH table_analysis AS (
  SELECT 
    t.table_name,
    COUNT(CASE WHEN c.column_name = 'id' THEN 1 END) > 0 as has_id,
    COUNT(CASE WHEN c.column_name = 'created_at' THEN 1 END) > 0 as has_created_at,
    COUNT(CASE WHEN c.column_name = 'updated_at' THEN 1 END) > 0 as has_updated_at,
    COUNT(CASE WHEN c.column_name = 'deleted_at' THEN 1 END) > 0 as has_deleted_at,
    COUNT(CASE WHEN c.column_name = 'tenant_id' THEN 1 END) > 0 as has_tenant_id,
    COUNT(c.column_name) as total_columns
  FROM information_schema.tables t
  LEFT JOIN information_schema.columns c ON t.table_name = c.table_name AND c.table_schema = 'public'
  WHERE t.table_schema = 'public' 
    AND t.table_type = 'BASE TABLE'
  GROUP BY t.table_name
)
SELECT 
  table_name,
  total_columns,
  CASE WHEN NOT has_id THEN '❌ Missing ID' ELSE '✅ Has ID' END as id_status,
  CASE WHEN NOT has_created_at THEN '⚠️ Missing created_at' ELSE '✅ Has created_at' END as created_status,
  CASE WHEN NOT has_updated_at THEN '⚠️ Missing updated_at' ELSE '✅ Has updated_at' END as updated_status,
  CASE WHEN NOT has_deleted_at THEN '💡 No soft delete' ELSE '✅ Has soft delete' END as delete_status,
  CASE WHEN NOT has_tenant_id AND table_name != 'tenants' THEN '⚠️ Missing tenant_id' ELSE '✅ Has tenant_id' END as tenant_status
FROM table_analysis
ORDER BY table_name;

-- =============================================================================
-- 4. FOREIGN KEY RELATIONSHIPS
-- =============================================================================

SELECT
  tc.table_name as from_table,
  kcu.column_name as from_column,
  ccu.table_name as to_table,
  ccu.column_name as to_column,
  tc.constraint_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- =============================================================================
-- 5. INDEX ANALYSIS
-- =============================================================================

SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- =============================================================================
-- 6. TABLE SIZES AND USAGE
-- =============================================================================

SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as index_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- =============================================================================
-- 7. IDENTIFY UNUSED/EMPTY TABLES
-- =============================================================================

SELECT 
  t.table_name,
  COALESCE(s.n_live_tup, 0) as row_count,
  CASE 
    WHEN COALESCE(s.n_live_tup, 0) = 0 THEN '🚨 EMPTY - Consider removal'
    WHEN COALESCE(s.n_live_tup, 0) < 10 THEN '⚠️ Low usage'
    ELSE '✅ Active'
  END as usage_status
FROM information_schema.tables t
LEFT JOIN pg_stat_user_tables s ON t.table_name = s.relname
WHERE t.table_schema = 'public' 
  AND t.table_type = 'BASE TABLE'
ORDER BY COALESCE(s.n_live_tup, 0) ASC;

-- =============================================================================
-- 8. COLUMN TYPE ANALYSIS
-- =============================================================================

SELECT 
  data_type,
  COUNT(*) as column_count,
  ARRAY_AGG(DISTINCT table_name || '.' || column_name) as examples
FROM information_schema.columns
WHERE table_schema = 'public'
GROUP BY data_type
ORDER BY column_count DESC;

-- =============================================================================
-- 9. JSONB PAYLOAD ANALYSIS (for flexible schemas)
-- =============================================================================

SELECT 
  table_name,
  column_name,
  'JSONB payload - consider structure analysis' as recommendation
FROM information_schema.columns
WHERE table_schema = 'public'
  AND data_type = 'jsonb'
ORDER BY table_name, column_name;

-- =============================================================================
-- 10. RECOMMENDATIONS SUMMARY
-- =============================================================================

-- This query provides actionable recommendations
WITH recommendations AS (
  SELECT 'Add created_at timestamps' as action, COUNT(*) as affected_tables
  FROM information_schema.tables t
  WHERE t.table_schema = 'public' 
    AND t.table_type = 'BASE TABLE'
    AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns c 
      WHERE c.table_name = t.table_name 
        AND c.table_schema = 'public'
        AND c.column_name = 'created_at'
    )
  
  UNION ALL
  
  SELECT 'Add tenant_id for multi-tenancy' as action, COUNT(*) as affected_tables
  FROM information_schema.tables t
  WHERE t.table_schema = 'public' 
    AND t.table_type = 'BASE TABLE'
    AND t.table_name != 'tenants'
    AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns c 
      WHERE c.table_name = t.table_name 
        AND c.table_schema = 'public'
        AND c.column_name = 'tenant_id'
    )
    
  UNION ALL
  
  SELECT 'Review empty tables for removal' as action, COUNT(*) as affected_tables
  FROM information_schema.tables t
  LEFT JOIN pg_stat_user_tables s ON t.table_name = s.relname
  WHERE t.table_schema = 'public' 
    AND t.table_type = 'BASE TABLE'
    AND COALESCE(s.n_live_tup, 0) = 0
)
SELECT * FROM recommendations WHERE affected_tables > 0;
