-- ============================================
-- CLEANUP EMPTY TENANTS (OPTIONAL)
-- Run manually in Supabase SQL Editor
-- ============================================

-- CAUTION: This deletes empty tenants that have no data
-- Review carefully before running

-- 1. Preview tenants that will be deleted
SELECT 
  t.id,
  t.name,
  t.is_active,
  COUNT(DISTINCT v.id) as vehicle_count,
  COUNT(DISTINCT ve.id) as event_count,
  COUNT(DISTINCT vi.id) as image_count,
  COUNT(DISTINCT ut.user_id) as user_count
FROM tenants t
LEFT JOIN vehicles v ON t.id = v.tenant_id
LEFT JOIN vehicle_events ve ON t.id = ve.tenant_id
LEFT JOIN vehicle_images vi ON t.id = vi.tenant_id
LEFT JOIN user_tenants ut ON t.id = ut.tenant_id
GROUP BY t.id, t.name, t.is_active
HAVING 
  COUNT(DISTINCT v.id) = 0 AND
  COUNT(DISTINCT ve.id) = 0 AND
  COUNT(DISTINCT vi.id) = 0 AND
  COUNT(DISTINCT ut.user_id) = 0;

-- 2. Delete empty tenants (UNCOMMENT TO EXECUTE)
-- WARNING: This is permanent! Review the preview first.

-- DELETE FROM tenants
-- WHERE id IN (
--   SELECT t.id
--   FROM tenants t
--   LEFT JOIN vehicles v ON t.id = v.tenant_id
--   LEFT JOIN vehicle_events ve ON t.id = ve.tenant_id
--   LEFT JOIN vehicle_images vi ON t.id = vi.tenant_id
--   LEFT JOIN user_tenants ut ON t.id = ut.tenant_id
--   GROUP BY t.id
--   HAVING 
--     COUNT(DISTINCT v.id) = 0 AND
--     COUNT(DISTINCT ve.id) = 0 AND
--     COUNT(DISTINCT vi.id) = 0 AND
--     COUNT(DISTINCT ut.user_id) = 0
-- );

-- 3. Verify deletion (run after uncommenting above)
-- SELECT 
--   t.id,
--   t.name,
--   COUNT(DISTINCT v.id) as vehicle_count
-- FROM tenants t
-- LEFT JOIN vehicles v ON t.id = v.tenant_id
-- GROUP BY t.id, t.name
-- ORDER BY vehicle_count DESC;

-- NOTES:
-- - Empty tenants: 1608f513-9aba-4df3-8824-dba7956741c6 (My Account)
-- - Empty tenants: 550e8400-e29b-41d4-a716-446655440000 (Demo Tenant)
-- - These were created during development/testing
-- - Safe to delete if they have no data
-- - Your active tenant (b9281da3-16c4-4370-83ad-4672cf928065) will NOT be deleted
