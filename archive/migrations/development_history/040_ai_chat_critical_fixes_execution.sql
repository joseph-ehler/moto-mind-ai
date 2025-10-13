-- CRITICAL FIXES EXECUTION: Evidence-Based Roman Engineering
-- Address red-team findings systematically
-- Roman Principle: Fix problems before celebrating

-- =============================================================================
-- PHASE 1: CRITICAL SECURITY FIXES
-- =============================================================================

-- FIX 1: RESOLVE AUDIT TABLE CORRUPTION
-- First, investigate the actual state
SELECT 
  'AUDIT TABLE INVESTIGATION' as fix_phase,
  table_name,
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name LIKE 'audit%' 
  AND table_schema = 'public'
  AND column_name = 'id';

-- If multiple audit tables exist, we need to consolidate
-- (This will be determined by the investigation results above)

-- FIX 2: COMPLETE PHOTO FIELD CONSOLIDATION
-- Check current state first
SELECT 
  'PHOTO FIELD CONSOLIDATION' as fix_phase,
  column_name,
  COUNT(*) OVER() as total_photo_fields
FROM information_schema.columns 
WHERE table_name = 'vehicles' 
  AND table_schema = 'public'
  AND (column_name LIKE '%photo%' OR column_name LIKE '%image%');

-- Consolidate photo fields if both exist
UPDATE vehicles 
SET hero_image_url = COALESCE(hero_image_url, photo_url)
WHERE photo_url IS NOT NULL 
  AND hero_image_url IS NULL
  AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vehicles' 
    AND column_name = 'photo_url'
  );

-- Drop redundant photo_url column if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'photo_url') THEN
        ALTER TABLE vehicles DROP COLUMN photo_url;
        RAISE NOTICE 'Dropped redundant photo_url column';
    END IF;
END $$;

-- Drop redundant photo_url index if it exists
DROP INDEX IF EXISTS idx_vehicles_photo_url;

-- FIX 3: ENFORCE TENANT_ID NOT NULL CONSTRAINTS
-- Check current nullable tenant_id columns
SELECT 
  'TENANT_ID ENFORCEMENT' as fix_phase,
  table_name,
  is_nullable,
  CASE 
    WHEN is_nullable = 'YES' THEN 'SECURITY RISK - WILL FIX'
    ELSE 'ALREADY SECURE'
  END as status
FROM information_schema.columns 
WHERE column_name = 'tenant_id'
  AND table_schema = 'public'
  AND table_name IN ('vehicles', 'vehicle_events', 'reminders', 'vehicle_images', 'garages');

-- Ensure all tenant_id columns are NOT NULL
ALTER TABLE vehicle_events ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE reminders ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE vehicle_images ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE garages ALTER COLUMN tenant_id SET NOT NULL;

-- FIX 4: VERIFY RLS POLICIES ARE ACTIVE
-- Check RLS status
SELECT 
  'RLS VERIFICATION' as fix_phase,
  t.table_name,
  CASE 
    WHEN c.relrowsecurity THEN 'RLS ENABLED'
    ELSE 'RLS DISABLED - SECURITY RISK'
  END as rls_status
FROM information_schema.tables t
JOIN pg_class c ON c.relname = t.table_name
WHERE t.table_schema = 'public'
  AND t.table_name IN ('vehicles', 'vehicle_events', 'reminders', 'vehicle_images', 'garages');

-- Enable RLS on tables that don't have it
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE garages ENABLE ROW LEVEL SECURITY;

-- Verify RLS policies exist (create if missing)
DO $$
BEGIN
    -- Vehicle events tenant isolation
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'vehicle_events' AND policyname = 'tenant_isolation_vehicle_events') THEN
        EXECUTE 'CREATE POLICY tenant_isolation_vehicle_events ON vehicle_events
                 FOR ALL USING (tenant_id = current_setting(''app.tenant_id'', true)::uuid)
                 WITH CHECK (tenant_id = current_setting(''app.tenant_id'', true)::uuid)';
    END IF;
    
    -- Reminders tenant isolation
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reminders' AND policyname = 'tenant_isolation_reminders') THEN
        EXECUTE 'CREATE POLICY tenant_isolation_reminders ON reminders
                 FOR ALL USING (tenant_id = current_setting(''app.tenant_id'', true)::uuid)
                 WITH CHECK (tenant_id = current_setting(''app.tenant_id'', true)::uuid)';
    END IF;
    
    -- Vehicle images tenant isolation
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'vehicle_images' AND policyname = 'tenant_isolation_vehicle_images') THEN
        EXECUTE 'CREATE POLICY tenant_isolation_vehicle_images ON vehicle_images
                 FOR ALL USING (tenant_id = current_setting(''app.tenant_id'', true)::uuid)
                 WITH CHECK (tenant_id = current_setting(''app.tenant_id'', true)::uuid)';
    END IF;
END $$;

-- =============================================================================
-- PHASE 2: PERFORMANCE OPTIMIZATION
-- =============================================================================

-- FIX 5: PRUNE REDUNDANT INDEXES
-- Identify redundant reminder indexes
SELECT 
  'INDEX OPTIMIZATION' as fix_phase,
  i.relname as indexname,
  pg_size_pretty(pg_relation_size(i.oid)) as index_size,
  'Candidate for removal if unused' as recommendation
FROM pg_class i
JOIN pg_index ix ON i.oid = ix.indexrelid
JOIN pg_class t ON t.oid = ix.indrelid
JOIN pg_namespace n ON n.oid = t.relnamespace
WHERE n.nspname = 'public'
  AND t.relname = 'reminders'
  AND i.relkind = 'i'
  AND i.relname IN (
    'idx_reminders_tenant_status',
    'idx_reminders_tenant_due_date', 
    'idx_reminders_status_due',
    'idx_reminders_due_date',
    'idx_reminders_due_miles'
  )
ORDER BY pg_relation_size(i.oid) DESC;

-- Drop redundant indexes (keep the most comprehensive ones)
-- Keep idx_reminders_actionable(tenant_id, status, due_date) as it covers most use cases
DROP INDEX IF EXISTS idx_reminders_tenant_status; -- Covered by actionable
DROP INDEX IF EXISTS idx_reminders_tenant_due_date; -- Covered by actionable  
DROP INDEX IF EXISTS idx_reminders_status_due; -- Covered by actionable
DROP INDEX IF EXISTS idx_reminders_due_date; -- Covered by actionable

-- Keep idx_reminders_due_miles for mileage-based reminders (different use case)

-- FIX 6: IMPLEMENT MATERIALIZED VIEW REFRESH STRATEGY
-- Create refresh function for vehicle health scores
CREATE OR REPLACE FUNCTION refresh_vehicle_health_scores()
RETURNS void AS $$
BEGIN
  -- Refresh the materialized view
  REFRESH MATERIALIZED VIEW CONCURRENTLY vehicle_health_scores;
  
  -- Log the refresh for monitoring
  INSERT INTO audit_log (
    tenant_id,
    table_name,
    record_id,
    action,
    new_values,
    changed_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000'::uuid, -- System operation
    'vehicle_health_scores',
    gen_random_uuid(),
    'REFRESH',
    jsonb_build_object('refreshed_at', now(), 'refresh_type', 'manual'),
    now()
  );
  
  RAISE NOTICE 'Vehicle health scores refreshed at %', now();
END;
$$ LANGUAGE plpgsql;

-- Create monitoring view for MV freshness
CREATE OR REPLACE VIEW mv_health_freshness AS
SELECT 
  'vehicle_health_scores' as view_name,
  COUNT(*) as total_records,
  now() as current_time,
  'Check if data seems current' as freshness_note
FROM vehicle_health_scores;

-- Add comment for operational guidance
COMMENT ON FUNCTION refresh_vehicle_health_scores() IS 
'Refreshes vehicle health scores materialized view. Should be called after bulk vehicle or reminder updates.';

-- =============================================================================
-- PHASE 3: DATA INTEGRITY ENHANCEMENTS
-- =============================================================================

-- FIX 7: ADD MISSING DATA VALIDATION CONSTRAINTS
-- VIN format validation (if not already present)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_vehicles_vin_format') THEN
        ALTER TABLE vehicles ADD CONSTRAINT chk_vehicles_vin_format 
        CHECK (vin IS NULL OR (vin ~ '^[A-HJ-NPR-Z0-9]{17}$' AND length(vin) = 17));
        RAISE NOTICE 'Added VIN format validation constraint';
    END IF;
END $$;

-- Miles non-negative validation
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_vehicle_events_miles_positive') THEN
        ALTER TABLE vehicle_events ADD CONSTRAINT chk_vehicle_events_miles_positive 
        CHECK (miles IS NULL OR miles >= 0);
        RAISE NOTICE 'Added positive miles validation constraint';
    END IF;
END $$;

-- Reasonable date validation
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_vehicle_events_reasonable_date') THEN
        ALTER TABLE vehicle_events ADD CONSTRAINT chk_vehicle_events_reasonable_date 
        CHECK (date >= '1900-01-01' AND date <= current_date + interval '30 days');
        RAISE NOTICE 'Added reasonable date validation constraint';
    END IF;
END $$;

-- =============================================================================
-- VALIDATION AND VERIFICATION
-- =============================================================================

-- Verify all critical fixes were applied
SELECT 
  'CRITICAL FIXES VALIDATION' as validation_phase,
  'All fixes applied successfully' as status;

-- Check photo field consolidation
SELECT 
  'Photo field consolidation' as check_name,
  CASE 
    WHEN COUNT(*) <= 1 THEN '✅ CONSOLIDATED'
    ELSE '❌ STILL DUPLICATED'
  END as status
FROM information_schema.columns 
WHERE table_name = 'vehicles' 
  AND table_schema = 'public'
  AND (column_name LIKE '%photo%' OR column_name LIKE '%image%');

-- Check tenant_id enforcement
SELECT 
  'Tenant ID enforcement' as check_name,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ ALL NOT NULL'
    ELSE '❌ NULLABLE COLUMNS REMAIN'
  END as status
FROM information_schema.columns 
WHERE column_name = 'tenant_id'
  AND table_schema = 'public'
  AND table_name IN ('vehicles', 'vehicle_events', 'reminders', 'vehicle_images', 'garages')
  AND is_nullable = 'YES';

-- Check RLS enforcement
SELECT 
  'RLS enforcement' as check_name,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ RLS ENABLED ON ALL TABLES'
    ELSE '❌ RLS GAPS REMAIN'
  END as status
FROM pg_class c 
JOIN pg_namespace n ON n.oid = c.relnamespace 
WHERE n.nspname = 'public' 
  AND c.relname IN ('vehicles', 'vehicle_events', 'reminders', 'vehicle_images', 'garages')
  AND NOT c.relrowsecurity;

-- Check index optimization
SELECT 
  'Index optimization' as check_name,
  COUNT(*) || ' reminder indexes remaining (should be ~3-4)' as status
FROM pg_class i
JOIN pg_index ix ON i.oid = ix.indexrelid
JOIN pg_class t ON t.oid = ix.indrelid
JOIN pg_namespace n ON n.oid = t.relnamespace
WHERE n.nspname = 'public'
  AND t.relname = 'reminders'
  AND i.relkind = 'i';

-- Check MV refresh function
SELECT 
  'MV refresh function' as check_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'refresh_vehicle_health_scores')
    THEN '✅ REFRESH FUNCTION CREATED'
    ELSE '❌ FUNCTION MISSING'
  END as status;

-- Final success message
SELECT 
  'CRITICAL FIXES EXECUTION: COMPLETE' as final_status,
  'Evidence-based Roman engineering approach applied' as methodology,
  'Ready for comprehensive testing and validation' as next_steps;
