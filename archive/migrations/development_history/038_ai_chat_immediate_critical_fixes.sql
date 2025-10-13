-- IMMEDIATE CRITICAL FIXES: Address Red Team Findings
-- Execute these fixes before any "Gold Standard" claims
-- Roman Principle: Fix problems before celebrating

-- =============================================================================
-- CRITICAL INVESTIGATION 1: AUDIT TABLE INCONSISTENCY
-- =============================================================================

-- Check for audit table confusion
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name LIKE 'audit%' 
  AND table_schema = 'public'
  AND column_name = 'id'
ORDER BY table_name;

-- Check for multiple audit tables
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_name LIKE 'audit%' 
  AND table_schema = 'public';

-- =============================================================================
-- CRITICAL FIX 2: PHOTO FIELD CONSOLIDATION STATUS
-- =============================================================================

-- Check current photo field state
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'vehicles' 
  AND table_schema = 'public'
  AND (column_name LIKE '%photo%' OR column_name LIKE '%image%')
ORDER BY column_name;

-- Check for photo-related indexes
SELECT 
  i.relname as indexname,
  t.relname as tablename
FROM pg_class i
JOIN pg_index ix ON i.oid = ix.indexrelid
JOIN pg_class t ON t.oid = ix.indrelid
JOIN pg_namespace n ON n.oid = t.relnamespace
WHERE n.nspname = 'public'
  AND t.relname = 'vehicles'
  AND i.relname LIKE '%photo%' OR i.relname LIKE '%image%'
ORDER BY i.relname;

-- =============================================================================
-- CRITICAL FIX 3: RLS VERIFICATION
-- =============================================================================

-- Check RLS status on all tenant tables
SELECT 
  t.table_name,
  CASE 
    WHEN c.relrowsecurity THEN '✅ RLS ENABLED'
    ELSE '❌ RLS DISABLED'
  END as security_status
FROM information_schema.tables t
JOIN pg_class c ON c.relname = t.table_name
WHERE t.table_schema = 'public'
  AND t.table_name IN ('vehicles', 'vehicle_events', 'reminders', 'vehicle_images', 'garages', 'audit_log')
ORDER BY t.table_name;

-- Check for RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =============================================================================
-- CRITICAL FIX 4: TENANT_ID NOT NULL VERIFICATION
-- =============================================================================

-- Check tenant_id constraints
SELECT 
  t.table_name,
  c.column_name,
  c.is_nullable,
  CASE 
    WHEN c.is_nullable = 'NO' THEN '✅ NOT NULL ENFORCED'
    ELSE '❌ NULLABLE - SECURITY RISK'
  END as constraint_status
FROM information_schema.tables t
JOIN information_schema.columns c ON t.table_name = c.table_name
WHERE t.table_schema = 'public'
  AND c.table_schema = 'public'
  AND c.column_name = 'tenant_id'
  AND t.table_name IN ('vehicles', 'vehicle_events', 'reminders', 'vehicle_images', 'garages')
ORDER BY t.table_name;

-- =============================================================================
-- CRITICAL FIX 5: INDEX REDUNDANCY ANALYSIS
-- =============================================================================

-- Check reminder table indexes
SELECT 
  indexname,
  indexdef,
  pg_size_pretty(pg_relation_size(indexname::regclass)) as index_size
FROM pg_indexes 
WHERE tablename = 'reminders'
  AND schemaname = 'public'
ORDER BY indexname;

-- Check index usage statistics (if pg_stat_statements is enabled)
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch,
  CASE 
    WHEN idx_scan = 0 THEN '❌ UNUSED'
    WHEN idx_scan < 10 THEN '⚠️ RARELY USED'
    ELSE '✅ ACTIVE'
  END as usage_status
FROM pg_stat_user_indexes
WHERE tablename = 'reminders'
  AND schemaname = 'public'
ORDER BY idx_scan DESC;

-- =============================================================================
-- MATERIALIZED VIEW STATUS CHECK
-- =============================================================================

-- Check if vehicle_health_scores exists and is fresh
SELECT 
  schemaname,
  matviewname,
  hasindexes,
  ispopulated,
  definition
FROM pg_matviews 
WHERE schemaname = 'public'
  AND matviewname = 'vehicle_health_scores';

-- Check health scores data freshness
SELECT 
  COUNT(*) as total_scores,
  MIN(last_updated) as oldest_update,
  MAX(last_updated) as newest_update,
  now() - MAX(last_updated) as staleness
FROM vehicle_health_scores;

-- =============================================================================
-- DATA INTEGRITY VERIFICATION
-- =============================================================================

-- Check for VIN format issues
SELECT 
  COUNT(*) as total_vehicles,
  COUNT(CASE WHEN vin IS NOT NULL THEN 1 END) as vehicles_with_vin,
  COUNT(CASE WHEN vin ~ '^[A-HJ-NPR-Z0-9]{17}$' THEN 1 END) as valid_vin_format,
  COUNT(CASE WHEN vin IS NOT NULL AND NOT (vin ~ '^[A-HJ-NPR-Z0-9]{17}$') THEN 1 END) as invalid_vin_format
FROM vehicles;

-- Check for negative mileage
SELECT 
  COUNT(*) as total_events,
  COUNT(CASE WHEN miles < 0 THEN 1 END) as negative_mileage_events
FROM vehicle_events 
WHERE type = 'odometer';

-- Check for future dates
SELECT 
  COUNT(*) as total_events,
  COUNT(CASE WHEN date > current_date + interval '30 days' THEN 1 END) as future_dated_events
FROM vehicle_events;

-- =============================================================================
-- FINAL ASSESSMENT QUERIES
-- =============================================================================

-- Overall database health check
SELECT 
  'Audit table consistency' as check_name,
  CASE 
    WHEN (SELECT COUNT(DISTINCT table_name) FROM information_schema.tables WHERE table_name LIKE 'audit%' AND table_schema = 'public') = 1 
    THEN '✅ CONSISTENT'
    ELSE '❌ MULTIPLE AUDIT TABLES'
  END as status

UNION ALL

SELECT 
  'Photo field consolidation',
  CASE 
    WHEN (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'vehicles' AND (column_name LIKE '%photo%' OR column_name LIKE '%image%')) <= 1
    THEN '✅ CONSOLIDATED'
    ELSE '❌ STILL DUPLICATED'
  END

UNION ALL

SELECT 
  'RLS enforcement',
  CASE 
    WHEN (SELECT COUNT(*) FROM pg_tables WHERE tablename IN ('vehicles', 'vehicle_events', 'reminders') AND rowsecurity = false) = 0
    THEN '✅ RLS ENABLED'
    ELSE '❌ RLS GAPS'
  END

UNION ALL

SELECT 
  'Tenant isolation',
  CASE 
    WHEN (SELECT COUNT(*) FROM information_schema.columns WHERE column_name = 'tenant_id' AND table_name IN ('vehicles', 'vehicle_events', 'reminders') AND is_nullable = 'YES') = 0
    THEN '✅ ENFORCED'
    ELSE '❌ NULLABLE TENANT_ID'
  END;

-- Red team validation complete message
SELECT 
  'RED TEAM VALIDATION STATUS' as assessment,
  'Critical issues must be resolved before Gold Standard claims' as requirement,
  'Evidence-based approach: measure, fix, verify, then celebrate' as principle;
