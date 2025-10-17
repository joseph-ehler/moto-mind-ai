-- DIAGNOSE: Check if vehicle_events is partitioned and get partition details
-- This will tell us exactly what we're dealing with

-- Step 1: Check if vehicle_events is partitioned
SELECT 
    schemaname,
    tablename,
    partitioned,
    CASE 
        WHEN partitioned THEN 'PARTITIONED TABLE'
        ELSE 'REGULAR TABLE'
    END as table_type
FROM pg_tables 
WHERE tablename = 'vehicle_events' 
AND schemaname = 'public';

-- Step 2: If partitioned, get partition strategy and key columns
SELECT 
    schemaname,
    tablename,
    partitionstrategy,
    partitionkey
FROM pg_partitioned_table pt
JOIN pg_class c ON pt.partrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE c.relname = 'vehicle_events'
AND n.nspname = 'public';

-- Step 3: Check existing constraints on vehicle_events
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    CASE contype
        WHEN 'p' THEN 'PRIMARY KEY'
        WHEN 'u' THEN 'UNIQUE'
        WHEN 'f' THEN 'FOREIGN KEY'
        WHEN 'c' THEN 'CHECK'
        ELSE contype::text
    END as constraint_description,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.vehicle_events'::regclass
ORDER BY contype;

-- Step 4: Check if id column exists and its properties
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'vehicle_events' 
AND column_name = 'id'
AND table_schema = 'public';

-- Step 5: List all partitions if table is partitioned
SELECT 
    schemaname,
    tablename,
    CASE 
        WHEN pg_get_expr(c.relpartbound, c.oid) IS NOT NULL 
        THEN pg_get_expr(c.relpartbound, c.oid)
        ELSE 'PARENT TABLE'
    END as partition_bounds
FROM pg_class c
JOIN pg_namespace n ON c.relnamespace = n.oid
JOIN pg_inherits i ON c.oid = i.inhrelid OR c.oid = i.inhparent
WHERE (c.relname = 'vehicle_events' OR i.inhparent = 'public.vehicle_events'::regclass)
AND n.nspname = 'public'
ORDER BY partition_bounds;

-- Step 6: Check what indexes exist on vehicle_events
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'vehicle_events' 
AND schemaname = 'public'
ORDER BY indexname;
