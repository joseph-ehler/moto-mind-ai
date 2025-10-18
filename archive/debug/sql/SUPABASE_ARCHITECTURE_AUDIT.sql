-- ========================================
-- SUPABASE ARCHITECTURE AUDIT
-- Run these queries to understand current database structure
-- ========================================

-- ========================================
-- 1. ALL TABLES (with row counts)
-- ========================================
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
  (SELECT COUNT(*) FROM information_schema.columns 
   WHERE table_schema = pt.schemaname AND table_name = pt.tablename) as column_count
FROM pg_tables pt
WHERE schemaname = 'public'
ORDER BY tablename;

-- ========================================
-- 2. TABLE STRUCTURES (all columns with types)
-- ========================================
SELECT 
  table_name,
  column_name,
  data_type,
  character_maximum_length,
  column_default,
  is_nullable,
  CASE 
    WHEN column_name LIKE '%_id' THEN '← FK likely'
    WHEN column_name = 'id' THEN '← PK likely'
    ELSE ''
  END as notes
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- ========================================
-- 3. FOREIGN KEY RELATIONSHIPS
-- ========================================
SELECT
  tc.table_name as from_table,
  kcu.column_name as from_column,
  ccu.table_name AS to_table,
  ccu.column_name AS to_column,
  tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- ========================================
-- 4. INDEXES (with details)
-- ========================================
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- ========================================
-- 5. RLS POLICIES (security rules)
-- ========================================
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ========================================
-- 6. FUNCTIONS/PROCEDURES (custom logic)
-- ========================================
SELECT
  n.nspname as schema,
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments,
  pg_get_function_result(p.oid) as return_type,
  l.lanname as language,
  CASE 
    WHEN p.provolatile = 'i' THEN 'IMMUTABLE'
    WHEN p.provolatile = 's' THEN 'STABLE'
    WHEN p.provolatile = 'v' THEN 'VOLATILE'
  END as volatility
FROM pg_proc p
LEFT JOIN pg_namespace n ON p.pronamespace = n.oid
LEFT JOIN pg_language l ON p.prolang = l.oid
WHERE n.nspname = 'public'
ORDER BY p.proname;

-- ========================================
-- 7. USER-RELATED TABLES (check for existing user setup)
-- ========================================
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (
    table_name ILIKE '%user%' 
    OR table_name ILIKE '%auth%'
    OR table_name ILIKE '%tenant%'
    OR table_name ILIKE '%org%'
    OR column_name ILIKE '%user_id%'
    OR column_name ILIKE '%owner%'
  )
ORDER BY table_name, ordinal_position;

-- ========================================
-- 8. EXISTING DATA VOLUME (sample counts)
-- ========================================
DO $$
DECLARE
  r RECORD;
  query TEXT;
  row_count BIGINT;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'TABLE ROW COUNTS:';
  RAISE NOTICE '========================================';
  
  FOR r IN 
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public'
    ORDER BY tablename
  LOOP
    query := 'SELECT COUNT(*) FROM public.' || quote_ident(r.tablename);
    EXECUTE query INTO row_count;
    RAISE NOTICE '% : % rows', RPAD(r.tablename, 40, '.'), row_count;
  END LOOP;
  
  RAISE NOTICE '========================================';
END $$;

-- ========================================
-- 9. UNIQUE CONSTRAINTS (important for data integrity)
-- ========================================
SELECT
  tc.table_name,
  tc.constraint_name,
  STRING_AGG(kcu.column_name, ', ') as columns
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'UNIQUE'
  AND tc.table_schema = 'public'
GROUP BY tc.table_name, tc.constraint_name
ORDER BY tc.table_name;

-- ========================================
-- 10. CHECK CONSTRAINTS (business rules)
-- ========================================
SELECT
  tc.table_name,
  tc.constraint_name,
  cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc
  ON tc.constraint_name = cc.constraint_name
WHERE tc.constraint_type = 'CHECK'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- ========================================
-- 11. ENUM TYPES (if any)
-- ========================================
SELECT 
  t.typname as enum_name,
  STRING_AGG(e.enumlabel, ', ' ORDER BY e.enumsortorder) as values
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
JOIN pg_namespace n ON t.typnamespace = n.oid
WHERE n.nspname = 'public'
GROUP BY t.typname
ORDER BY t.typname;

-- ========================================
-- 12. TRIGGERS (automated actions)
-- ========================================
SELECT
  event_object_table as table_name,
  trigger_name,
  event_manipulation as event,
  action_timing as timing,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- ========================================
-- SUMMARY INSIGHTS
-- ========================================
SELECT 
  '========================================' as info;
SELECT 'ARCHITECTURE SUMMARY:' as info;
SELECT '========================================' as info;

-- Table count
SELECT 
  'Total Tables: ' || COUNT(*) as info
FROM pg_tables 
WHERE schemaname = 'public';

-- Column count
SELECT 
  'Total Columns: ' || COUNT(*) as info
FROM information_schema.columns
WHERE table_schema = 'public';

-- Function count
SELECT 
  'Total Functions: ' || COUNT(*) as info
FROM pg_proc p
LEFT JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public';

-- FK relationships
SELECT 
  'Total Foreign Keys: ' || COUNT(*) as info
FROM information_schema.table_constraints
WHERE constraint_type = 'FOREIGN KEY' 
  AND table_schema = 'public';

-- RLS enabled tables
SELECT 
  'Tables with RLS: ' || COUNT(DISTINCT tablename) as info
FROM pg_policies
WHERE schemaname = 'public';

SELECT '========================================' as info;
