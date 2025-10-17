-- MotoMind Architecture Cleanup - Single DB Console Paste
-- Run this entire block in Supabase SQL Editor (safe, additive, reversible)

-- =============================================================================
-- STEP 1: Add display_name column and backfill (additive; no drops)
-- =============================================================================

-- 1) Add column (idempotent)
ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS display_name TEXT;

-- 2) Backfill conservatively:
-- prefer existing label/nickname; fall back to structured identity
UPDATE vehicles
SET display_name = COALESCE(
  NULLIF(display_name, ''), 
  NULLIF(label, ''), 
  NULLIF(nickname, ''), 
  NULLIF(CONCAT_WS(' ',
    NULLIF(year::text, ''),
    NULLIF(make, ''),
    NULLIF(model, ''),
    NULLIF(trim, '')
  ), ''),
  'Unknown Vehicle'
)
WHERE display_name IS NULL OR display_name = '';

-- 3) Make display_name required after backfill
ALTER TABLE vehicles 
ALTER COLUMN display_name SET NOT NULL;

-- 4) Add performance index
CREATE INDEX IF NOT EXISTS idx_vehicles_display_name ON vehicles(display_name);

-- =============================================================================
-- STEP 2: Fix schema_migrations table (removes health endpoint warning)
-- =============================================================================

ALTER TABLE IF EXISTS schema_migrations
  ADD COLUMN IF NOT EXISTS filename TEXT;

-- =============================================================================
-- STEP 3: Resolve orphaned vehicles (removes health endpoint error)
-- =============================================================================

-- Create "Unassigned" garage for orphaned vehicles
INSERT INTO garages (id, tenant_id, name, address, is_default)
VALUES (
  gen_random_uuid(), 
  '550e8400-e29b-41d4-a716-446655440000',  -- Demo tenant ID
  'Unassigned', 
  'Temporary holding for vehicles without garages', 
  false
)
ON CONFLICT (tenant_id, name) DO NOTHING;

-- Reassign orphaned vehicles to "Unassigned" garage
WITH unassigned_garage AS (
  SELECT id FROM garages 
  WHERE name = 'Unassigned' 
  AND tenant_id = '550e8400-e29b-41d4-a716-446655440000'
  LIMIT 1
)
UPDATE vehicles v
SET garage_id = (SELECT id FROM unassigned_garage)
WHERE v.garage_id IS NULL 
   OR NOT EXISTS (
     SELECT 1 FROM garages g WHERE g.id = v.garage_id
   );

-- =============================================================================
-- VALIDATION QUERIES (run these to verify success)
-- =============================================================================

-- Should be 0:
SELECT COUNT(*) AS vehicles_missing_display_name
FROM vehicles WHERE display_name IS NULL OR display_name = '';

-- Should be 0:
SELECT COUNT(*) AS orphaned_vehicles FROM vehicles v
LEFT JOIN garages g ON g.id = v.garage_id
WHERE v.garage_id IS NOT NULL AND g.id IS NULL;

-- Sample of backfilled names (should look reasonable):
SELECT id, display_name, label, make, model, year 
FROM vehicles 
ORDER BY created_at DESC 
LIMIT 10;

-- Success message
SELECT 'MotoMind architecture cleanup: Database migration complete! ✅' AS status;
