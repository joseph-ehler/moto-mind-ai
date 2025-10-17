-- Fix Orphaned Vehicles: Actual Data Repair
-- No elaborate migrations - just fix the broken data

-- =============================================================================
-- STEP 1: IDENTIFY THE ACTUAL PROBLEM
-- =============================================================================

-- Find vehicles that reference deleted garages
SELECT 
  v.id,
  v.display_name,
  v.garage_id,
  g.id as garage_exists,
  CASE 
    WHEN g.id IS NULL THEN 'ORPHANED - garage deleted'
    ELSE 'OK'
  END as status
FROM vehicles v
LEFT JOIN garages g ON v.garage_id = g.id
WHERE v.garage_id IS NOT NULL 
  AND g.id IS NULL;

-- Count the problem
SELECT 
  COUNT(*) as orphaned_vehicles,
  'vehicles reference deleted garages' as problem
FROM vehicles v
LEFT JOIN garages g ON v.garage_id = g.id
WHERE v.garage_id IS NOT NULL 
  AND g.id IS NULL;

-- =============================================================================
-- STEP 2: FIX THE ORPHANED VEHICLES
-- =============================================================================

-- Option A: Assign orphaned vehicles to the default garage
UPDATE vehicles 
SET garage_id = (
  SELECT id 
  FROM garages 
  WHERE is_default = true 
  LIMIT 1
)
WHERE garage_id IS NOT NULL 
  AND garage_id NOT IN (SELECT id FROM garages);

-- Option B: If no default garage exists, create one first
INSERT INTO garages (id, tenant_id, name, is_default, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  t.id as tenant_id,
  'Default Garage',
  true,
  now(),
  now()
FROM tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM garages g WHERE g.tenant_id = t.id AND g.is_default = true
);

-- Then assign orphaned vehicles to their tenant's default garage
UPDATE vehicles 
SET garage_id = (
  SELECT g.id 
  FROM garages g 
  WHERE g.tenant_id = vehicles.tenant_id 
    AND g.is_default = true 
  LIMIT 1
)
WHERE garage_id IS NOT NULL 
  AND garage_id NOT IN (SELECT id FROM garages);

-- =============================================================================
-- STEP 3: VERIFY THE FIX
-- =============================================================================

-- Confirm no orphaned vehicles remain
SELECT 
  COUNT(*) as remaining_orphaned_vehicles
FROM vehicles v
LEFT JOIN garages g ON v.garage_id = g.id
WHERE v.garage_id IS NOT NULL 
  AND g.id IS NULL;

-- This should return 0 if the fix worked

-- =============================================================================
-- STEP 4: TEST HEALTH CHECK
-- =============================================================================

-- The health check should now pass
-- Run: curl http://localhost:3005/api/health
-- Should return: "status": "healthy", "data_integrity": true

-- Success message
SELECT 
  CASE 
    WHEN (
      SELECT COUNT(*) 
      FROM vehicles v
      LEFT JOIN garages g ON v.garage_id = g.id
      WHERE v.garage_id IS NOT NULL AND g.id IS NULL
    ) = 0 
    THEN '✅ SUCCESS: All orphaned vehicles fixed'
    ELSE '❌ FAILED: Orphaned vehicles still exist'
  END as result;
