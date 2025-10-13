-- CRITICAL SECURITY FIX: Manual Migration for Supabase SQL Editor
-- Copy and paste this entire block into Supabase SQL Editor
-- 
-- FIXES: Tenant isolation vulnerabilities in vehicle_events and reminders
-- RISK: Without this fix, users can access other tenants' data

-- =============================================================================
-- STEP 1: Add tenant_id columns (nullable initially for safety)
-- =============================================================================

ALTER TABLE vehicle_events 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);

ALTER TABLE reminders 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);

-- Add missing audit timestamps
ALTER TABLE vehicle_events 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ;

ALTER TABLE vehicle_events 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

ALTER TABLE vehicle_images 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ;

ALTER TABLE vehicle_images 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

-- =============================================================================
-- STEP 2: Backfill tenant_id from vehicles table
-- =============================================================================

-- Fix vehicle_events
UPDATE vehicle_events ve
SET tenant_id = v.tenant_id
FROM vehicles v
WHERE ve.vehicle_id = v.id
  AND ve.tenant_id IS NULL;

-- Fix reminders
UPDATE reminders r
SET tenant_id = v.tenant_id
FROM vehicles v
WHERE r.vehicle_id = v.id
  AND r.tenant_id IS NULL;

-- =============================================================================
-- STEP 3: Handle orphaned records (mark for manual review)
-- =============================================================================

-- Mark orphaned vehicle_events with special UUID for manual review
UPDATE vehicle_events 
SET tenant_id = '00000000-0000-0000-0000-000000000000'::uuid
WHERE tenant_id IS NULL;

-- Mark orphaned reminders with special UUID for manual review
UPDATE reminders 
SET tenant_id = '00000000-0000-0000-0000-000000000000'::uuid
WHERE tenant_id IS NULL;

-- =============================================================================
-- STEP 4: Backfill timestamps (preserve historical accuracy)
-- =============================================================================

-- For vehicle_events: use existing date field if available
UPDATE vehicle_events 
SET created_at = COALESCE(
  CASE 
    WHEN date IS NOT NULL THEN date::timestamptz
    ELSE '1970-01-01 00:00:00+00'::timestamptz
  END
)
WHERE created_at IS NULL;

UPDATE vehicle_events 
SET updated_at = COALESCE(created_at, now())
WHERE updated_at IS NULL;

-- For vehicle_images: mark historical data
UPDATE vehicle_images 
SET created_at = '1970-01-01 00:00:00+00'::timestamptz
WHERE created_at IS NULL;

UPDATE vehicle_images 
SET updated_at = '1970-01-01 00:00:00+00'::timestamptz
WHERE updated_at IS NULL;

-- =============================================================================
-- STEP 5: Make columns required
-- =============================================================================

ALTER TABLE vehicle_events 
ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE reminders 
ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE vehicle_events 
ALTER COLUMN created_at SET NOT NULL;

ALTER TABLE vehicle_events 
ALTER COLUMN updated_at SET NOT NULL;

ALTER TABLE vehicle_images 
ALTER COLUMN created_at SET NOT NULL;

ALTER TABLE vehicle_images 
ALTER COLUMN updated_at SET NOT NULL;

-- =============================================================================
-- STEP 6: Add critical indexes for performance
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_vehicle_events_tenant_vehicle_date 
ON vehicle_events(tenant_id, vehicle_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_vehicle_events_tenant_created 
ON vehicle_events(tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reminders_tenant_status 
ON reminders(tenant_id, status) WHERE status != 'done';

CREATE INDEX IF NOT EXISTS idx_reminders_tenant_due_date 
ON reminders(tenant_id, due_date) WHERE status != 'done';

-- =============================================================================
-- STEP 7: Enable Row Level Security (CRITICAL)
-- =============================================================================

-- Enable RLS on vehicle_events
ALTER TABLE vehicle_events ENABLE ROW LEVEL SECURITY;

-- Enable RLS on reminders
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

-- Create tenant isolation policies
CREATE POLICY tenant_isolation_vehicle_events ON vehicle_events
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_reminders ON reminders
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- =============================================================================
-- STEP 8: Validation queries (run these to verify success)
-- =============================================================================

-- Should return 0 (except for marked orphans):
SELECT COUNT(*) as vehicle_events_missing_tenant_id
FROM vehicle_events 
WHERE tenant_id IS NULL;

-- Should return 0 (except for marked orphans):
SELECT COUNT(*) as reminders_missing_tenant_id
FROM reminders 
WHERE tenant_id IS NULL;

-- Check tenant distribution:
SELECT 
  tenant_id,
  COUNT(*) as vehicle_events_count
FROM vehicle_events 
GROUP BY tenant_id;

SELECT 
  tenant_id,
  COUNT(*) as reminders_count
FROM reminders 
GROUP BY tenant_id;

-- Success message
SELECT 'SECURITY MIGRATION COMPLETE: Tenant isolation vulnerabilities fixed!' as status;
