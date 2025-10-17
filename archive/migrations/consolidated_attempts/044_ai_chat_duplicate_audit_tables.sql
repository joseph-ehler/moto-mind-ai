-- Fix Duplicate Audit Tables: Actually Remove Duplication
-- No "consolidation" documentation - just fix it

-- =============================================================================
-- STEP 1: IDENTIFY WHAT EXISTS
-- =============================================================================

-- Check what's actually in each audit table
SELECT 'audit_log' as table_name, COUNT(*) as row_count FROM audit_log
UNION ALL
SELECT 'audit_logs' as table_name, COUNT(*) as row_count FROM audit_logs;

-- Check the structure differences
SELECT 
  'audit_log columns' as info,
  string_agg(column_name, ', ' ORDER BY ordinal_position) as columns
FROM information_schema.columns 
WHERE table_name = 'audit_log' AND table_schema = 'public'
UNION ALL
SELECT 
  'audit_logs columns' as info,
  string_agg(column_name, ', ' ORDER BY ordinal_position) as columns
FROM information_schema.columns 
WHERE table_name = 'audit_logs' AND table_schema = 'public';

-- =============================================================================
-- STEP 2: DECIDE WHICH TABLE TO KEEP
-- =============================================================================

-- audit_log: Enterprise audit trail (uuid PK, comprehensive fields)
-- audit_logs: Application event logging (bigint PK, simpler structure)

-- Keep audit_log (the enterprise one), drop audit_logs
-- If you need the data from audit_logs, migrate it first:

-- Optional: Migrate important data from audit_logs to audit_log
-- (Only run this if audit_logs has data you need to preserve)
/*
INSERT INTO audit_log (
  tenant_id,
  table_name,
  record_id,
  action,
  new_values,
  changed_at
)
SELECT 
  tenant_id,
  'application_event' as table_name,
  vehicle_id as record_id,
  event_type as action,
  jsonb_build_object('payload', payload, 'actor_type', actor_type) as new_values,
  created_at as changed_at
FROM audit_logs
WHERE created_at > now() - interval '30 days'; -- Only recent data
*/

-- =============================================================================
-- STEP 3: DROP THE DUPLICATE TABLE
-- =============================================================================

-- Drop audit_logs and all its dependencies
DROP TABLE IF EXISTS audit_logs CASCADE;

-- =============================================================================
-- STEP 4: VERIFY THE FIX
-- =============================================================================

-- Confirm only one audit table exists
SELECT 
  table_name,
  'EXISTS' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'audit%'
ORDER BY table_name;

-- Should only show audit_log

-- Check for any broken dependencies
SELECT 
  schemaname,
  viewname,
  definition
FROM pg_views 
WHERE definition ILIKE '%audit_logs%';

-- Should return no results

-- Success message
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_log')
     AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs')
    THEN '✅ SUCCESS: Duplicate audit table removed, single audit_log remains'
    ELSE '❌ FAILED: Both audit tables still exist'
  END as result;
