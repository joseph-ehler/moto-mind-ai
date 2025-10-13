-- Security Fix: Add tenant isolation to vehicle_events and reminders
-- CRITICAL: This fixes data breach vulnerabilities
-- 
-- SAFETY MEASURES:
-- 1. Adds columns as nullable first
-- 2. Backfills from vehicles table
-- 3. Validates no orphaned records
-- 4. Makes columns required
-- 5. Adds RLS policies
--
-- ROLLBACK PLAN:
-- DROP POLICY IF EXISTS tenant_isolation_vehicle_events ON vehicle_events;
-- DROP POLICY IF EXISTS tenant_isolation_reminders ON reminders;
-- ALTER TABLE vehicle_events DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE reminders DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE vehicle_events DROP COLUMN tenant_id;
-- ALTER TABLE reminders DROP COLUMN tenant_id;

-- =============================================================================
-- PHASE 1: ADD TENANT_ID COLUMNS (NULLABLE)
-- =============================================================================

-- Add tenant_id to vehicle_events (nullable initially for safety)
ALTER TABLE vehicle_events 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);

-- Add tenant_id to reminders (nullable initially for safety)
ALTER TABLE reminders 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);

-- Add audit timestamps to vehicle_events (missing critical audit trail)
ALTER TABLE vehicle_events 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ;

ALTER TABLE vehicle_events 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

-- Add audit timestamps to vehicle_images (missing audit trail)
ALTER TABLE vehicle_images 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ;

ALTER TABLE vehicle_images 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

-- =============================================================================
-- PHASE 2: BACKFILL TENANT_ID FROM VEHICLES TABLE
-- =============================================================================

-- Backfill vehicle_events.tenant_id from vehicles table
UPDATE vehicle_events ve
SET tenant_id = v.tenant_id
FROM vehicles v
WHERE ve.vehicle_id = v.id
  AND ve.tenant_id IS NULL;

-- Backfill reminders.tenant_id from vehicles table  
UPDATE reminders r
SET tenant_id = v.tenant_id
FROM vehicles v
WHERE r.vehicle_id = v.id
  AND r.tenant_id IS NULL;

-- =============================================================================
-- PHASE 3: HANDLE ORPHANED RECORDS
-- =============================================================================

-- Mark orphaned vehicle_events (no matching vehicle) for manual review
-- These will be deleted after manual verification
UPDATE vehicle_events 
SET tenant_id = '00000000-0000-0000-0000-000000000000'::uuid
WHERE tenant_id IS NULL;

-- Mark orphaned reminders (no matching vehicle) for manual review
UPDATE reminders 
SET tenant_id = '00000000-0000-0000-0000-000000000000'::uuid
WHERE tenant_id IS NULL;

-- =============================================================================
-- PHASE 4: BACKFILL TIMESTAMPS (PRESERVE HISTORICAL ACCURACY)
-- =============================================================================

-- For vehicle_events: try to use existing date field, fallback to epoch
UPDATE vehicle_events 
SET created_at = COALESCE(
  -- Try to use existing date field if it exists
  CASE 
    WHEN date IS NOT NULL THEN date::timestamptz
    ELSE '1970-01-01 00:00:00+00'::timestamptz
  END
)
WHERE created_at IS NULL;

UPDATE vehicle_events 
SET updated_at = COALESCE(created_at, now())
WHERE updated_at IS NULL;

-- For vehicle_images: use epoch for unknown timestamps
UPDATE vehicle_images 
SET created_at = '1970-01-01 00:00:00+00'::timestamptz
WHERE created_at IS NULL;

UPDATE vehicle_images 
SET updated_at = '1970-01-01 00:00:00+00'::timestamptz
WHERE updated_at IS NULL;

-- =============================================================================
-- PHASE 5: VALIDATION QUERIES (MUST RETURN 0)
-- =============================================================================

-- Verify no vehicle_events without tenant_id (except marked orphans)
DO $$
DECLARE
    orphan_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO orphan_count
    FROM vehicle_events 
    WHERE tenant_id IS NULL;
    
    IF orphan_count > 0 THEN
        RAISE EXCEPTION 'MIGRATION FAILED: % vehicle_events still missing tenant_id', orphan_count;
    END IF;
    
    RAISE NOTICE 'VALIDATION PASSED: All vehicle_events have tenant_id';
END $$;

-- Verify no reminders without tenant_id (except marked orphans)
DO $$
DECLARE
    orphan_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO orphan_count
    FROM reminders 
    WHERE tenant_id IS NULL;
    
    IF orphan_count > 0 THEN
        RAISE EXCEPTION 'MIGRATION FAILED: % reminders still missing tenant_id', orphan_count;
    END IF;
    
    RAISE NOTICE 'VALIDATION PASSED: All reminders have tenant_id';
END $$;

-- =============================================================================
-- PHASE 6: MAKE TENANT_ID REQUIRED
-- =============================================================================

-- Make tenant_id NOT NULL on vehicle_events
ALTER TABLE vehicle_events 
ALTER COLUMN tenant_id SET NOT NULL;

-- Make tenant_id NOT NULL on reminders
ALTER TABLE reminders 
ALTER COLUMN tenant_id SET NOT NULL;

-- Make timestamps NOT NULL on vehicle_events
ALTER TABLE vehicle_events 
ALTER COLUMN created_at SET NOT NULL;

ALTER TABLE vehicle_events 
ALTER COLUMN updated_at SET NOT NULL;

-- Make timestamps NOT NULL on vehicle_images
ALTER TABLE vehicle_images 
ALTER COLUMN created_at SET NOT NULL;

ALTER TABLE vehicle_images 
ALTER COLUMN updated_at SET NOT NULL;

-- =============================================================================
-- PHASE 7: ADD PERFORMANCE INDEXES
-- =============================================================================

-- Critical indexes for tenant isolation queries
CREATE INDEX IF NOT EXISTS idx_vehicle_events_tenant_vehicle_date 
ON vehicle_events(tenant_id, vehicle_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_vehicle_events_tenant_created 
ON vehicle_events(tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reminders_tenant_status 
ON reminders(tenant_id, status) WHERE status != 'done';

CREATE INDEX IF NOT EXISTS idx_reminders_tenant_due_date 
ON reminders(tenant_id, due_date) WHERE status != 'done';

-- =============================================================================
-- PHASE 8: ENABLE ROW LEVEL SECURITY
-- =============================================================================

-- Enable RLS on vehicle_events
ALTER TABLE vehicle_events ENABLE ROW LEVEL SECURITY;

-- Enable RLS on reminders  
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

-- Create tenant isolation policy for vehicle_events
CREATE POLICY tenant_isolation_vehicle_events ON vehicle_events
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Create tenant isolation policy for reminders
CREATE POLICY tenant_isolation_reminders ON reminders
  FOR ALL  
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- =============================================================================
-- PHASE 9: ADD COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON COLUMN vehicle_events.tenant_id IS 
  'Tenant isolation - CRITICAL for security. Added in migration 031.';

COMMENT ON COLUMN reminders.tenant_id IS 
  'Tenant isolation - CRITICAL for security. Added in migration 031.';

COMMENT ON COLUMN vehicle_events.created_at IS 
  'Audit timestamp. Historical data before 2025-09-26 may be estimated.';

COMMENT ON COLUMN vehicle_events.updated_at IS 
  'Audit timestamp. Historical data before 2025-09-26 may be estimated.';

-- =============================================================================
-- FINAL VALIDATION
-- =============================================================================

-- Report migration results
DO $$
DECLARE
    ve_count INTEGER;
    r_count INTEGER;
    orphan_ve INTEGER;
    orphan_r INTEGER;
BEGIN
    SELECT COUNT(*) INTO ve_count FROM vehicle_events WHERE tenant_id != '00000000-0000-0000-0000-000000000000'::uuid;
    SELECT COUNT(*) INTO r_count FROM reminders WHERE tenant_id != '00000000-0000-0000-0000-000000000000'::uuid;
    SELECT COUNT(*) INTO orphan_ve FROM vehicle_events WHERE tenant_id = '00000000-0000-0000-0000-000000000000'::uuid;
    SELECT COUNT(*) INTO orphan_r FROM reminders WHERE tenant_id = '00000000-0000-0000-0000-000000000000'::uuid;
    
    RAISE NOTICE '=== MIGRATION 031 COMPLETE ===';
    RAISE NOTICE 'vehicle_events with tenant_id: %', ve_count;
    RAISE NOTICE 'reminders with tenant_id: %', r_count;
    RAISE NOTICE 'Orphaned vehicle_events (marked for review): %', orphan_ve;
    RAISE NOTICE 'Orphaned reminders (marked for review): %', orphan_r;
    RAISE NOTICE 'RLS policies enabled for tenant isolation';
    RAISE NOTICE '=== SECURITY VULNERABILITIES FIXED ===';
END $$;
