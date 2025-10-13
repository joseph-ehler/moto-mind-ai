-- COMPLETE DATABASE FOUNDATION: Create all tables + data + display fields
-- This creates everything from scratch after database reset

-- Step 1: Create tenants table
CREATE TABLE IF NOT EXISTS public.tenants (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Step 2: Create profiles linked to auth.users and tenants
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    email text,
    full_name text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_profiles_tenant_id ON public.profiles(tenant_id);

-- Step 3: Create vehicles table
CREATE TABLE IF NOT EXISTS public.vehicles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    year int,
    make text,
    model text,
    vin text,
    display_name text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_vehicles_tenant_id ON public.vehicles(tenant_id);

-- Step 4: Create vehicle_events table with all needed columns
CREATE TABLE IF NOT EXISTS public.vehicle_events (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
    type text NOT NULL,
    date timestamp with time zone NOT NULL DEFAULT now(),
    miles int,
    total_amount numeric(10,2),
    gallons numeric(10,2),
    vendor text,
    payload jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    
    -- Display fields for edit functionality
    display_vendor text,
    display_amount numeric(10,2),
    display_summary text,
    user_notes text,
    edited_at timestamp with time zone,
    edited_by text,
    edit_reason text
);
ALTER TABLE public.vehicle_events ENABLE ROW LEVEL SECURITY;

-- Step 5: Add composite primary key (id, date) for partitioning support
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_schema = 'public'
        AND table_name = 'vehicle_events'
        AND constraint_type = 'PRIMARY KEY'
    ) THEN
        ALTER TABLE public.vehicle_events ADD CONSTRAINT vehicle_events_pkey PRIMARY KEY (id, date);
        RAISE NOTICE 'Added PRIMARY KEY (id, date) to vehicle_events';
    END IF;
END $$;

-- Step 6: Create current_tenant_id function for RLS
CREATE OR REPLACE FUNCTION public.current_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
    SELECT (auth.jwt() ->> 'tenant_id')::uuid
$$;

-- Step 7: Create basic RLS policies for all tables
-- Tenants policies
DROP POLICY IF EXISTS "tenant_isolation_select" ON public.tenants;
DROP POLICY IF EXISTS "tenant_isolation_insert" ON public.tenants;
CREATE POLICY "tenant_isolation_select" ON public.tenants
    FOR SELECT TO authenticated
    USING (id = (SELECT public.current_tenant_id()));
CREATE POLICY "tenant_isolation_insert" ON public.tenants
    FOR INSERT TO authenticated
    WITH CHECK (id = (SELECT public.current_tenant_id()));

-- Profiles policies
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles
    FOR SELECT TO authenticated
    USING (tenant_id = (SELECT public.current_tenant_id()));
CREATE POLICY "profiles_insert" ON public.profiles
    FOR INSERT TO authenticated
    WITH CHECK (tenant_id = (SELECT public.current_tenant_id()));

-- Vehicles policies
DROP POLICY IF EXISTS "vehicles_select" ON public.vehicles;
DROP POLICY IF EXISTS "vehicles_insert" ON public.vehicles;
CREATE POLICY "vehicles_select" ON public.vehicles
    FOR SELECT TO authenticated
    USING (tenant_id = (SELECT public.current_tenant_id()));
CREATE POLICY "vehicles_insert" ON public.vehicles
    FOR INSERT TO authenticated
    WITH CHECK (tenant_id = (SELECT public.current_tenant_id()));

-- Vehicle events policies
DROP POLICY IF EXISTS "vehicle_events_select" ON public.vehicle_events;
DROP POLICY IF EXISTS "vehicle_events_insert" ON public.vehicle_events;
CREATE POLICY "vehicle_events_select" ON public.vehicle_events
    FOR SELECT TO authenticated
    USING (tenant_id = (SELECT public.current_tenant_id()));
CREATE POLICY "vehicle_events_insert" ON public.vehicle_events
    FOR INSERT TO authenticated
    WITH CHECK (tenant_id = (SELECT public.current_tenant_id()));

-- Step 8: Insert seed data
INSERT INTO public.tenants (id, name, created_at) VALUES 
('550e8400-e29b-41d4-a716-446655440000', 'Demo Tenant', NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, tenant_id, email, full_name, created_at) VALUES 
('123e4567-e89b-12d3-a456-426614174000', '550e8400-e29b-41d4-a716-446655440000', 'demo@example.com', 'Demo User', NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.vehicles (id, tenant_id, year, make, model, vin, display_name, created_at) VALUES 
('dfa33260-a922-45d9-a649-3050377a7a62', '550e8400-e29b-41d4-a716-446655440000', 2018, 'Honda', 'Civic', '1HGBH41JXMN109186', 'My Honda Civic', NOW())
ON CONFLICT (id) DO NOTHING;

-- Step 9: Insert sample events with proper timestamptz casting
INSERT INTO public.vehicle_events (id, tenant_id, vehicle_id, type, date, miles, total_amount, gallons, vendor, payload, created_at) VALUES 
('11111111-1111-1111-1111-111111111111', '550e8400-e29b-41d4-a716-446655440000', 'dfa33260-a922-45d9-a649-3050377a7a62', 'fuel', '2024-01-15'::timestamptz, 45000, 52.30, 12.5, 'Shell Station', '{"source":"document","confidence":95}'::jsonb, NOW()),
('22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', 'dfa33260-a922-45d9-a649-3050377a7a62', 'service', '2024-01-10'::timestamptz, 44800, 125.00, NULL, 'Honda Service', '{"source":"document","confidence":88,"services":["oil_change"]}'::jsonb, NOW()),
('33333333-3333-3333-3333-333333333333', '550e8400-e29b-41d4-a716-446655440000', 'dfa33260-a922-45d9-a649-3050377a7a62', 'odometer', '2024-01-20'::timestamptz, 45200, NULL, NULL, NULL, '{"source":"manual","confidence":100}'::jsonb, NOW()),
('44444444-4444-4444-4444-444444444444', '550e8400-e29b-41d4-a716-446655440000', 'dfa33260-a922-45d9-a649-3050377a7a62', 'fuel', '2024-01-25'::timestamptz, 45400, 48.75, 11.8, 'Costco Gas', '{"source":"document","confidence":92}'::jsonb, NOW()),
('55555555-5555-5555-5555-555555555555', '550e8400-e29b-41d4-a716-446655440000', 'dfa33260-a922-45d9-a649-3050377a7a62', 'service', '2024-02-01'::timestamptz, 45600, 89.50, NULL, 'Quick Lube', '{"source":"document","confidence":85,"services":["oil_change","filter_change"]}'::jsonb, NOW())
ON CONFLICT (id, date) DO NOTHING;

-- Step 10: Create audit log table with correct FK reference
CREATE TABLE IF NOT EXISTS public.vehicle_event_audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id uuid NOT NULL,
    event_date timestamp with time zone NOT NULL,
    vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
    action text NOT NULL,
    changes jsonb,
    original_values jsonb,
    confidence_at_edit integer,
    validation_issues text[],
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by text,
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    
    -- FK references composite primary key (id, date)
    FOREIGN KEY (event_id, event_date) REFERENCES public.vehicle_events(id, date) ON DELETE CASCADE
);
ALTER TABLE public.vehicle_event_audit_logs ENABLE ROW LEVEL SECURITY;

-- Step 11: Audit log RLS policies
DROP POLICY IF EXISTS "tenant_audit_logs_select" ON public.vehicle_event_audit_logs;
DROP POLICY IF EXISTS "tenant_audit_logs_insert" ON public.vehicle_event_audit_logs;
CREATE POLICY "tenant_audit_logs_select" ON public.vehicle_event_audit_logs
    FOR SELECT TO authenticated
    USING (tenant_id = (SELECT public.current_tenant_id()));
CREATE POLICY "tenant_audit_logs_insert" ON public.vehicle_event_audit_logs
    FOR INSERT TO authenticated
    WITH CHECK (tenant_id = (SELECT public.current_tenant_id()));

-- Step 12: Add performance indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_id_date ON public.vehicle_event_audit_logs(event_id, event_date);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id ON public.vehicle_event_audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_events_edited_at ON public.vehicle_events(edited_at) WHERE edited_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vehicle_events_tenant_id ON public.vehicle_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_events_vehicle_id ON public.vehicle_events(vehicle_id);

-- Step 13: Add validation constraints
DO $$
BEGIN
    -- Display amount positive constraint
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_class t ON t.oid = c.conrelid
        JOIN pg_namespace n ON n.oid = t.relnamespace
        WHERE c.conname = 'check_display_amount_positive'
        AND n.nspname = 'public'
        AND t.relname = 'vehicle_events'
    ) THEN
        ALTER TABLE public.vehicle_events 
        ADD CONSTRAINT check_display_amount_positive 
        CHECK (display_amount IS NULL OR display_amount >= 0);
        RAISE NOTICE 'Added check_display_amount_positive constraint';
    END IF;

    -- Edit reason constraint
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_class t ON t.oid = c.conrelid
        JOIN pg_namespace n ON n.oid = t.relnamespace
        WHERE c.conname = 'check_edit_reason_when_edited'
        AND n.nspname = 'public'
        AND t.relname = 'vehicle_events'
    ) THEN
        ALTER TABLE public.vehicle_events 
        ADD CONSTRAINT check_edit_reason_when_edited 
        CHECK (
            (edited_at IS NULL AND edit_reason IS NULL) OR 
            (edited_at IS NOT NULL AND edit_reason IS NOT NULL)
        );
        RAISE NOTICE 'Added check_edit_reason_when_edited constraint';
    END IF;
END $$;

-- Step 14: Create utility functions
CREATE OR REPLACE FUNCTION public.get_effective_vendor(event public.vehicle_events)
RETURNS TEXT AS $$
BEGIN
    RETURN COALESCE(event.display_vendor, event.vendor, 'Unknown Vendor');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION public.get_effective_amount(event public.vehicle_events)
RETURNS DECIMAL(10,2) AS $$
BEGIN
    RETURN COALESCE(event.display_amount, event.total_amount);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Step 15: Final verification
DO $$
DECLARE
    tenant_count INTEGER;
    vehicle_count INTEGER;
    event_count INTEGER;
    audit_table_exists BOOLEAN;
BEGIN
    SELECT COUNT(*) INTO tenant_count FROM tenants;
    SELECT COUNT(*) INTO vehicle_count FROM vehicles;
    SELECT COUNT(*) INTO event_count FROM vehicle_events;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'vehicle_event_audit_logs'
        AND table_schema = 'public'
    ) INTO audit_table_exists;
    
    RAISE NOTICE '=== COMPLETE DATABASE FOUNDATION CREATED ===';
    RAISE NOTICE '✅ Tenants: %', tenant_count;
    RAISE NOTICE '✅ Vehicles: %', vehicle_count;
    RAISE NOTICE '✅ Events: %', event_count;
    RAISE NOTICE '✅ Audit table: %', CASE WHEN audit_table_exists THEN 'Created' ELSE 'Missing' END;
    RAISE NOTICE '✅ Display fields: Added to vehicle_events';
    RAISE NOTICE '✅ Edit functionality: Ready';
    
    IF tenant_count > 0 AND vehicle_count > 0 AND event_count > 0 AND audit_table_exists THEN
        RAISE NOTICE '🎉 COMPLETE SUCCESS! Timeline system fully restored with edit capabilities!';
    ELSE
        RAISE WARNING '⚠️ Some components missing - check individual tables';
    END IF;
END $$;
