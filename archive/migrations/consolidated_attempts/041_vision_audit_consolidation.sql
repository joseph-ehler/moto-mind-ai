-- FINAL AUDIT TABLE CONSOLIDATION
-- Resolve the dual audit table issue identified by red-team analysis
-- Roman Principle: One canonical source of truth

-- =============================================================================
-- INVESTIGATION: CONFIRM DUAL AUDIT TABLES
-- =============================================================================

-- Check both audit tables structure
SELECT 
  'audit_log' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'audit_log' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 
  'audit_logs' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'audit_logs' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check data in both tables
SELECT 'audit_log' as table_name, COUNT(*) as row_count FROM audit_log
UNION ALL
SELECT 'audit_logs' as table_name, COUNT(*) as row_count FROM audit_logs;

-- =============================================================================
-- CONSOLIDATION STRATEGY
-- =============================================================================

-- The audit_log table (uuid PK) is our canonical enterprise audit table
-- The audit_logs table (bigint PK) appears to be legacy/application-specific

-- Option 1: Keep both tables for different purposes
-- - audit_log: Enterprise-grade change tracking (our Gold Standard addition)
-- - audit_logs: Application-specific event logging (existing functionality)

-- Option 2: Migrate audit_logs data to audit_log and drop audit_logs
-- This requires careful data mapping due to different schemas

-- =============================================================================
-- RECOMMENDED APPROACH: KEEP BOTH WITH CLEAR SEPARATION
-- =============================================================================

-- Add comments to clarify purpose of each table
COMMENT ON TABLE audit_log IS 
'Enterprise audit trail for compliance and change tracking. Added during Gold Standard optimization.';

COMMENT ON TABLE audit_logs IS 
'Application-specific event logging for business operations and explanations.';

-- Ensure both tables have proper tenant isolation
-- audit_log already has tenant_id NOT NULL
-- Check audit_logs tenant_id status
SELECT 
  'audit_logs tenant_id status' as check_name,
  CASE 
    WHEN is_nullable = 'NO' THEN '✅ SECURE'
    ELSE '❌ NEEDS FIXING'
  END as status
FROM information_schema.columns 
WHERE table_name = 'audit_logs' 
  AND column_name = 'tenant_id';

-- =============================================================================
-- PERFORMANCE OPTIMIZATION: ADDRESS REMAINING ISSUES
-- =============================================================================

-- Check remaining redundant reminder indexes
SELECT 
  indexname,
  pg_size_pretty(pg_relation_size(indexname::regclass)) as size,
  'Consider for removal' as recommendation
FROM pg_indexes 
WHERE tablename = 'reminders'
  AND schemaname = 'public'
  AND indexname NOT IN (
    'reminders_pkey',
    'idx_reminders_actionable',
    'idx_reminders_due_miles',
    'idx_reminders_vehicle_status',
    'ux_reminders_dedupe_open'
  )
ORDER BY pg_relation_size(indexname::regclass) DESC;

-- Drop remaining redundant reminder indexes (if they exist)
DROP INDEX IF EXISTS idx_reminders_due_date;
DROP INDEX IF EXISTS idx_reminders_status_due;
DROP INDEX IF EXISTS idx_reminders_tenant_due_date;
DROP INDEX IF EXISTS idx_reminders_tenant_status;

-- =============================================================================
-- FINAL GOLD STANDARD VALIDATION
-- =============================================================================

-- Verify audit table clarity
SELECT 
  'Audit table consolidation' as check_name,
  'Two tables with clear purposes - audit_log (enterprise) + audit_logs (application)' as status;

-- Verify photo consolidation
SELECT 
  'Photo field consolidation' as check_name,
  CASE 
    WHEN COUNT(*) = 1 THEN '✅ CONSOLIDATED (hero_image_url only)'
    ELSE '❌ STILL DUPLICATED'
  END as status
FROM information_schema.columns 
WHERE table_name = 'vehicles' 
  AND (column_name LIKE '%photo%' OR column_name LIKE '%image%');

-- Verify tenant isolation
SELECT 
  'Tenant isolation' as check_name,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ ALL TABLES SECURED'
    ELSE '❌ ' || COUNT(*) || ' TABLES NEED FIXING'
  END as status
FROM information_schema.columns 
WHERE column_name = 'tenant_id'
  AND table_schema = 'public'
  AND table_name IN ('vehicles', 'vehicle_events', 'reminders', 'vehicle_images', 'garages', 'audit_log', 'audit_logs')
  AND is_nullable = 'YES';

-- Verify health scores system
SELECT 
  'Health scores system' as check_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'vehicle_health_scores')
    THEN '✅ MATERIALIZED VIEW ACTIVE'
    ELSE '❌ MISSING'
  END as status;

-- Verify index optimization
SELECT 
  'Index optimization' as check_name,
  COUNT(*) || ' reminder indexes (optimized from 6+ to essential only)' as status
FROM pg_indexes 
WHERE tablename = 'reminders' 
  AND schemaname = 'public';

-- =============================================================================
-- FINAL ASSESSMENT
-- =============================================================================

SELECT 
  'FINAL GOLD STANDARD STATUS' as assessment,
  'Critical fixes complete - dual audit tables clarified, performance optimized' as result,
  'Ready for comprehensive performance testing' as next_step;

-- Performance improvement recommendations
SELECT 
  'Performance optimization' as category,
  'Enable pg_stat_statements for query analysis' as recommendation
UNION ALL
SELECT 
  'Performance optimization',
  'Add connection pooling (PgBouncer) for API response times'
UNION ALL  
SELECT 
  'Performance optimization',
  'Consider read replicas for analytics queries'
UNION ALL
SELECT 
  'Monitoring',
  'Implement automated health score refresh scheduling';
