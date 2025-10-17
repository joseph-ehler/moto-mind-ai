-- WORKING DISPLAY FIELDS MIGRATION
-- Now that we know vehicle_events has PRIMARY KEY (id, date), we can proceed

-- Step 1: Add display fields to vehicle_events (safe to run multiple times)
ALTER TABLE public.vehicle_events 
ADD COLUMN IF NOT EXISTS display_vendor TEXT,
ADD COLUMN IF NOT EXISTS display_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS display_summary TEXT,
ADD COLUMN IF NOT EXISTS user_notes TEXT,
ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS edited_by TEXT,
ADD COLUMN IF NOT EXISTS edit_reason TEXT;

-- Step 2: Create audit log table with CORRECT FK reference
-- Since vehicle_events has PRIMARY KEY (id, date), we need both columns for FK
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

-- Step 3: Enable RLS on audit log table
ALTER TABLE public.vehicle_event_audit_logs ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS policies using the WORKING current_tenant_id() pattern
CREATE POLICY "tenant_audit_logs_select" ON public.vehicle_event_audit_logs
    FOR SELECT TO authenticated
    USING (tenant_id = (SELECT current_tenant_id()));

CREATE POLICY "tenant_audit_logs_insert" ON public.vehicle_event_audit_logs
    FOR INSERT TO authenticated
    WITH CHECK (tenant_id = (SELECT current_tenant_id()));

-- Step 5: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_id_date ON public.vehicle_event_audit_logs(event_id, event_date);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id ON public.vehicle_event_audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_events_edited_at ON public.vehicle_events(edited_at) WHERE edited_at IS NOT NULL;

-- Step 6: Add constraints using correct PostgreSQL syntax
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

-- Step 7: Add utility functions
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

-- Step 8: Add comments for documentation
COMMENT ON COLUMN public.vehicle_events.display_vendor IS 'User-corrected vendor name, overrides extracted vendor';
COMMENT ON COLUMN public.vehicle_events.display_amount IS 'User-corrected amount, overrides extracted total_amount';
COMMENT ON COLUMN public.vehicle_events.display_summary IS 'User-provided custom summary, overrides auto-generated summary';
COMMENT ON COLUMN public.vehicle_events.user_notes IS 'Additional user notes and context';
COMMENT ON COLUMN public.vehicle_events.edited_at IS 'Timestamp when user last edited this event';
COMMENT ON COLUMN public.vehicle_events.edited_by IS 'User ID who last edited this event';
COMMENT ON COLUMN public.vehicle_events.edit_reason IS 'Reason provided by user for the edit';

-- Step 9: Verification
DO $$
BEGIN
    RAISE NOTICE '=== DISPLAY FIELDS MIGRATION COMPLETED ===';
    
    -- Check display fields were added
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'vehicle_events' 
        AND column_name = 'display_vendor'
        AND table_schema = 'public'
    ) THEN
        RAISE NOTICE '✅ Display fields added to vehicle_events';
    ELSE
        RAISE WARNING '❌ Display fields missing from vehicle_events';
    END IF;
    
    -- Check audit table was created
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'vehicle_event_audit_logs'
        AND table_schema = 'public'
    ) THEN
        RAISE NOTICE '✅ Audit log table created with correct FK';
    ELSE
        RAISE WARNING '❌ Audit log table missing';
    END IF;
    
    RAISE NOTICE '=== READY FOR EDIT FUNCTIONALITY ===';
END $$;
