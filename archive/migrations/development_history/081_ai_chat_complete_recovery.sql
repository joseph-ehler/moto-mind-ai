-- CORRECTED COMPLETE RECOVERY: Data + Display Fields + Edit Functionality

-- Step 1: Restore basic tenant and user data
INSERT INTO public.tenants (id, name, created_at) VALUES 
('550e8400-e29b-41d4-a716-446655440000', 'Demo Tenant', NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, tenant_id, email, full_name, created_at) VALUES 
('123e4567-e89b-12d3-a456-426614174000', '550e8400-e29b-41d4-a716-446655440000', 'demo@example.com', 'Demo User', NOW())
ON CONFLICT (id) DO NOTHING;

-- Step 2: Restore vehicle
INSERT INTO public.vehicles (id, tenant_id, year, make, model, vin, display_name, created_at) VALUES 
('dfa33260-a922-45d9-a649-3050377a7a62', '550e8400-e29b-41d4-a716-446655440000', 2018, 'Honda', 'Civic', '1HGBH41JXMN109186', 'My Honda Civic', NOW())
ON CONFLICT (id) DO NOTHING;

-- Step 3: Add display fields to vehicle_events (safe to run multiple times)
ALTER TABLE public.vehicle_events 
ADD COLUMN IF NOT EXISTS display_vendor TEXT,
ADD COLUMN IF NOT EXISTS display_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS display_summary TEXT,
ADD COLUMN IF NOT EXISTS user_notes TEXT,
ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS edited_by TEXT,
ADD COLUMN IF NOT EXISTS edit_reason TEXT;

-- Step 4: Insert sample events with proper UUID format and complete syntax
INSERT INTO public.vehicle_events (id, tenant_id, vehicle_id, type, date, miles, total_amount, gallons, vendor, payload, created_at) VALUES 
('11111111-1111-1111-1111-111111111111', '550e8400-e29b-41d4-a716-446655440000', 'dfa33260-a922-45d9-a649-3050377a7a62', 'fuel', '2024-01-15', 45000, 52.30, 12.5, 'Shell Station', '{"source": "document", "confidence": 95}'::jsonb, NOW()),
('22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', 'dfa33260-a922-45d9-a649-3050377a7a62', 'service', '2024-01-10', 44800, 125.00, NULL, 'Honda Service', '{"source": "document", "confidence": 88, "services": ["oil_change"]}'::jsonb, NOW()),
('33333333-3333-3333-3333-333333333333', '550e8400-e29b-41d4-a716-446655440000', 'dfa33260-a922-45d9-a649-3050377a7a62', 'odometer', '2024-01-20', 45200, NULL, NULL, NULL, '{"source": "manual", "confidence": 100}'::jsonb, NOW()),
('44444444-4444-4444-4444-444444444444', '550e8400-e29b-41d4-a716-446655440000', 'dfa33260-a922-45d9-a649-3050377a7a62', 'fuel', '2024-01-25', 45400, 48.75, 11.8, 'Costco Gas', '{"source": "document", "confidence": 92}'::jsonb, NOW()),
('55555555-5555-5555-5555-555555555555', '550e8400-e29b-41d4-a716-446655440000', 'dfa33260-a922-45d9-a649-3050377a7a62', 'service', '2024-02-01', 45600, 89.50, NULL, 'Quick Lube', '{"source": "document", "confidence": 85, "services": ["oil_change", "filter_change"]}'::jsonb, NOW())
ON CONFLICT (id, date) DO NOTHING;

-- Step 5: Create audit log table with correct FK reference
CREATE TABLE IF NOT EXISTS public.vehicle_event_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL,
    event_date DATE NOT NULL,
    vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    changes JSONB,
    original_values JSONB,
    confidence_at_edit INTEGER,
    validation_issues TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by TEXT,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    
    -- CORRECT FK: References composite primary key (id, date)
    FOREIGN KEY (event_id, event_date) REFERENCES public.vehicle_events(id, date) ON DELETE CASCADE
);

-- Step 6: Enable RLS on audit log table
ALTER TABLE public.vehicle_event_audit_logs ENABLE ROW LEVEL SECURITY;

-- Step 7: Create RLS policies using the working current_tenant_id() pattern
DROP POLICY IF EXISTS "tenant_audit_logs_select" ON public.vehicle_event_audit_logs;
DROP POLICY IF EXISTS "tenant_audit_logs_insert" ON public.vehicle_event_audit_logs;

CREATE POLICY "tenant_audit_logs_select" ON public.vehicle_event_audit_logs
    FOR SELECT TO authenticated
    USING (tenant_id = (SELECT current_tenant_id()));

CREATE POLICY "tenant_audit_logs_insert" ON public.vehicle_event_audit_logs
    FOR INSERT TO authenticated
    WITH CHECK (tenant_id = (SELECT current_tenant_id()));

-- Step 8: Add utility functions
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

-- Step 9: Add performance indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_id_date ON public.vehicle_event_audit_logs(event_id, event_date);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id ON public.vehicle_event_audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_events_edited_at ON public.vehicle_events(edited_at) WHERE edited_at IS NOT NULL;

-- Step 10: Add constraints with correct PostgreSQL syntax
DO $$
BEGIN
    -- Add display_amount positive constraint
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

    -- Add edit reason constraint
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

-- Step 11: Final verification and success message
DO $$
DECLARE
    event_count INTEGER;
    vehicle_count INTEGER;
    column_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO event_count FROM vehicle_events;
    SELECT COUNT(*) INTO vehicle_count FROM vehicles;
    SELECT COUNT(*) INTO column_count FROM information_schema.columns 
    WHERE table_name = 'vehicle_events' 
    AND column_name IN ('display_vendor', 'display_amount', 'user_notes');
    
    RAISE NOTICE '=== RECOVERY VERIFICATION ===';
    RAISE NOTICE '✅ Events restored: %', event_count;
    RAISE NOTICE '✅ Vehicles restored: %', vehicle_count;
    RAISE NOTICE '✅ Display fields added: %', column_count;
    
    IF event_count > 0 AND vehicle_count > 0 AND column_count = 3 THEN
        RAISE NOTICE '🎉 COMPLETE RECOVERY SUCCESS! Timeline system ready with edit functionality!';
    ELSE
        RAISE WARNING '⚠️ Recovery incomplete - check individual components';
    END IF;
END $$;
