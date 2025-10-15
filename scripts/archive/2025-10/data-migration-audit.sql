-- ============================================
-- DATA MIGRATION AUDIT & CLEANUP
-- Run in Supabase SQL Editor
-- ============================================

-- 1. Check vehicle_events in detail
SELECT 
  tenant_id,
  COUNT(*) as event_count,
  MIN(date) as earliest_event,
  MAX(date) as latest_event
FROM vehicle_events
GROUP BY tenant_id
ORDER BY event_count DESC;

-- 2. Check vehicle_images in detail
SELECT 
  tenant_id,
  COUNT(*) as image_count
FROM vehicle_images
GROUP BY tenant_id
ORDER BY image_count DESC;

-- 3. Find any NULL tenant_ids (should be 0)
SELECT 'vehicles' as table_name, COUNT(*) as null_count
FROM vehicles WHERE tenant_id IS NULL
UNION ALL
SELECT 'vehicle_events', COUNT(*)
FROM vehicle_events WHERE tenant_id IS NULL
UNION ALL
SELECT 'vehicle_images', COUNT(*)
FROM vehicle_images WHERE tenant_id IS NULL
UNION ALL
SELECT 'photo_metadata', COUNT(*)
FROM photo_metadata WHERE tenant_id IS NULL;

-- 4. Check for orphaned data (tenant_id doesn't exist in tenants)
SELECT 
  'vehicles' as table_name,
  v.id,
  v.tenant_id,
  'No matching tenant' as issue
FROM vehicles v
LEFT JOIN tenants t ON v.tenant_id = t.id
WHERE v.tenant_id IS NOT NULL AND t.id IS NULL
UNION ALL
SELECT 
  'vehicle_events',
  ve.id,
  ve.tenant_id,
  'No matching tenant'
FROM vehicle_events ve
LEFT JOIN tenants t ON ve.tenant_id = t.id
WHERE ve.tenant_id IS NOT NULL AND t.id IS NULL
UNION ALL
SELECT 
  'vehicle_images',
  vi.id,
  vi.tenant_id,
  'No matching tenant'
FROM vehicle_images vi
LEFT JOIN tenants t ON vi.tenant_id = t.id
WHERE vi.tenant_id IS NOT NULL AND t.id IS NULL;

-- 5. Verify RLS is enabled on critical tables
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('vehicles', 'vehicle_events', 'vehicle_images', 'photo_metadata', 'tenants', 'user_tenants')
ORDER BY tablename;

-- 6. Check for tenant_id indexes (performance)
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexdef LIKE '%tenant_id%'
ORDER BY tablename;
