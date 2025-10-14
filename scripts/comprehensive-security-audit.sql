-- ============================================
-- COMPREHENSIVE DATABASE SECURITY AUDIT
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. CHECK: Tables with RLS DISABLED (Security Risk!)
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  'CRITICAL: RLS disabled on this table!' as issue
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = false
ORDER BY tablename;

-- 2. CHECK: Tables with tenant_id but WEAK RLS policies
SELECT 
  t.table_name,
  CASE 
    WHEN COUNT(p.policyname) = 0 THEN 'NO RLS POLICIES'
    WHEN MAX(CASE WHEN p.qual = 'true' THEN 1 ELSE 0 END) = 1 THEN 'WEAK: Allows all reads (qual=true)'
    WHEN MAX(CASE WHEN p.with_check = 'true' THEN 1 ELSE 0 END) = 1 THEN 'WEAK: Allows all writes (with_check=true)'
    ELSE 'OK'
  END as rls_status,
  COUNT(p.policyname) as policy_count
FROM information_schema.columns c
LEFT JOIN information_schema.tables t 
  ON c.table_name = t.table_name AND c.table_schema = t.table_schema
LEFT JOIN pg_policies p 
  ON t.table_name = p.tablename AND p.schemaname = 'public'
WHERE c.table_schema = 'public'
  AND c.column_name = 'tenant_id'
  AND t.table_type = 'BASE TABLE'
GROUP BY t.table_name
HAVING MAX(CASE WHEN p.qual = 'true' THEN 1 ELSE 0 END) = 1 
   OR MAX(CASE WHEN p.with_check = 'true' THEN 1 ELSE 0 END) = 1
   OR COUNT(p.policyname) = 0
ORDER BY policy_count, t.table_name;

-- 3. CHECK: Tables WITHOUT tenant_id that might need it
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns c2 
   WHERE c2.table_name = t.table_name AND c2.table_schema = 'public') as column_count,
  'Consider: Does this need tenant isolation?' as suggestion
FROM information_schema.tables t
WHERE t.table_schema = 'public'
  AND t.table_type = 'BASE TABLE'
  AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns c
    WHERE c.table_name = t.table_name 
      AND c.table_schema = 'public'
      AND c.column_name = 'tenant_id'
  )
  AND t.table_name NOT IN (
    'tenants',           -- Root table
    'user_tenants',      -- Mapping table
    'spatial_ref_sys',   -- PostGIS system table
    'migrations'         -- Migration tracking
  )
ORDER BY table_name;

-- 4. CHECK: Missing foreign keys on tenant_id
SELECT 
  t.table_name,
  c.column_name,
  'MISSING: Foreign key constraint to tenants(id)' as issue
FROM information_schema.columns c
JOIN information_schema.tables t 
  ON c.table_name = t.table_name AND c.table_schema = t.table_schema
WHERE c.table_schema = 'public'
  AND c.column_name = 'tenant_id'
  AND c.data_type = 'uuid'
  AND t.table_type = 'BASE TABLE'
  AND NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu 
      ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name = t.table_name
      AND kcu.column_name = 'tenant_id'
      AND ccu.table_name = 'tenants'
  )
ORDER BY t.table_name;

-- 5. CHECK: Missing indexes on tenant_id (Performance)
SELECT 
  t.table_name,
  c.column_name,
  'PERFORMANCE: Missing index on tenant_id' as issue,
  'CREATE INDEX idx_' || t.table_name || '_tenant_id ON ' || t.table_name || '(tenant_id);' as suggested_fix
FROM information_schema.columns c
JOIN information_schema.tables t 
  ON c.table_name = t.table_name AND c.table_schema = t.table_schema
WHERE c.table_schema = 'public'
  AND c.column_name = 'tenant_id'
  AND t.table_type = 'BASE TABLE'
  AND NOT EXISTS (
    SELECT 1 
    FROM pg_indexes i
    WHERE i.tablename = t.table_name
      AND i.schemaname = 'public'
      AND i.indexdef LIKE '%tenant_id%'
  )
ORDER BY t.table_name;

-- 6. CHECK: Nullable tenant_id columns (should be NOT NULL)
SELECT 
  table_name,
  column_name,
  is_nullable,
  'SECURITY: tenant_id should be NOT NULL' as issue,
  'ALTER TABLE ' || table_name || ' ALTER COLUMN tenant_id SET NOT NULL;' as suggested_fix
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name = 'tenant_id'
  AND is_nullable = 'YES'
ORDER BY table_name;

-- 7. CHECK: Tables with deleted_at but no index (Soft delete performance)
SELECT 
  t.table_name,
  'PERFORMANCE: Missing index on deleted_at for soft deletes' as issue,
  'CREATE INDEX idx_' || t.table_name || '_deleted_at ON ' || t.table_name || '(deleted_at) WHERE deleted_at IS NULL;' as suggested_fix
FROM information_schema.columns c
JOIN information_schema.tables t 
  ON c.table_name = t.table_name AND c.table_schema = t.table_schema
WHERE c.table_schema = 'public'
  AND c.column_name = 'deleted_at'
  AND t.table_type = 'BASE TABLE'
  AND NOT EXISTS (
    SELECT 1 
    FROM pg_indexes i
    WHERE i.tablename = t.table_name
      AND i.schemaname = 'public'
      AND i.indexdef LIKE '%deleted_at%'
  )
ORDER BY t.table_name;

-- 8. CHECK: RLS policies using auth.uid() (incompatible with NextAuth)
SELECT 
  schemaname,
  tablename,
  policyname,
  qual,
  with_check,
  'WARNING: Uses auth.uid() which only works with Supabase Auth, not NextAuth' as issue
FROM pg_policies
WHERE schemaname = 'public'
  AND (qual LIKE '%auth.uid()%' OR with_check LIKE '%auth.uid()%')
ORDER BY tablename, policyname;

-- 9. CHECK: Data without tenant_id (Data integrity)
SELECT 
  'vehicles' as table_name,
  COUNT(*) as rows_without_tenant
FROM vehicles 
WHERE tenant_id IS NULL
UNION ALL
SELECT 'vehicle_events', COUNT(*)
FROM vehicle_events 
WHERE tenant_id IS NULL
UNION ALL
SELECT 'vehicle_images', COUNT(*)
FROM vehicle_images 
WHERE tenant_id IS NULL
UNION ALL
SELECT 'photo_metadata', COUNT(*)
FROM photo_metadata 
WHERE tenant_id IS NULL
UNION ALL
SELECT 'garages', COUNT(*)
FROM garages 
WHERE tenant_id IS NULL;

-- 10. CHECK: Cross-tenant data leaks (vehicles referencing wrong tenant's garages)
SELECT 
  v.id as vehicle_id,
  v.tenant_id as vehicle_tenant,
  v.garage_id,
  g.tenant_id as garage_tenant,
  'DATA INTEGRITY: Vehicle references garage from different tenant!' as issue
FROM vehicles v
JOIN garages g ON v.garage_id = g.id
WHERE v.tenant_id != g.tenant_id;

-- 11. SUMMARY: Overall database health
SELECT 
  'Total tables' as metric,
  COUNT(*)::text as value
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
UNION ALL
SELECT 
  'Tables with tenant_id',
  COUNT(DISTINCT table_name)::text
FROM information_schema.columns
WHERE table_schema = 'public' AND column_name = 'tenant_id'
UNION ALL
SELECT 
  'Tables with RLS enabled',
  COUNT(*)::text
FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = true
UNION ALL
SELECT 
  'Total RLS policies',
  COUNT(*)::text
FROM pg_policies
WHERE schemaname = 'public'
UNION ALL
SELECT 
  'Total indexes',
  COUNT(*)::text
FROM pg_indexes
WHERE schemaname = 'public';
