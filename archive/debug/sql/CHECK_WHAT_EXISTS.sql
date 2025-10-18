-- Check what magic link objects already exist in the database

-- Tables
SELECT 'TABLES:' as type;
SELECT tablename 
FROM pg_tables 
WHERE tablename LIKE '%magic%' OR tablename LIKE '%rate%'
ORDER BY tablename;

-- Indexes  
SELECT 'INDEXES:' as type;
SELECT indexname, tablename
FROM pg_indexes 
WHERE indexname LIKE '%magic%' OR indexname LIKE '%rate%'
ORDER BY indexname;

-- Functions
SELECT 'FUNCTIONS:' as type;
SELECT proname, pg_get_functiondef(oid) as definition
FROM pg_proc 
WHERE proname LIKE '%magic%'
ORDER BY proname;

-- Policies
SELECT 'POLICIES:' as type;
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE policyname LIKE '%magic%' OR policyname LIKE '%rate%';
