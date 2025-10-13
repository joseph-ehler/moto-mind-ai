-- FINAL CORRECTED MIGRATION: Display fields with proper PostgreSQL syntax
-- Fixes: FK constraints, RLS policies, and Postgres-specific syntax limitations

-- STEP 1: Ensure vehicle_events.id can be referenced (PRIMARY KEY or UNIQUE)
DO $$
BEGIN
    -- Ensure id is NOT NULL
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'vehicle_events' 
        AND column_name = 'id' 
        AND is_nullable = 'YES'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.vehicle_events ALTER COLUMN id SET NOT NULL;
        RAISE NOTICE 'Set vehicle_events.id to NOT NULL';
    END IF;

    -- Add primary key if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'vehicle_events' 
        AND constraint_type = 'PRIMARY KEY'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.vehicle_events ADD CONSTRAINT vehicle_events_pkey PRIMARY KEY (id);
        RAISE NOTICE 'Added PRIMARY KEY constraint to vehicle_events.id';
    ELSE
        RAISE NOTICE 'PRIMARY KEY already exists on vehicle_events';
    END IF;
END $$;

-- STEP 2: Add display fields to vehicle_events
ALTER TABLE public.vehicle_events 
ADD COLUMN IF NOT EXISTS display_vendor TEXT,
ADD COLUMN IF NOT EXISTS display_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS display_summary TEXT,
ADD COLUMN IF NOT EXISTS user_notes TEXT,
ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS edited_by TEXT,
ADD COLUMN IF NOT EXISTS edit_reason TEXT;

-- STEP 3: Create audit log table (now that FK constraint will work)
CREATE TABLE IF NOT EXISTS public.vehicle_event_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.vehicle_events(id) ON DELETE CASCADE,
    vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    changes JSONB,
    original_values JSONB,
    confidence_at_edit INTEGER,
    validation_issues TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by TEXT,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE
);

-- STEP 4: Enable RLS and create policies with CORRECTED casting
ALTER TABLE public.vehicle_event_audit_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view audit logs for their vehicles" ON public.vehicle_event_audit_logs;
DROP POLICY IF EXISTS "System can insert audit logs" ON public.vehicle_event_audit_logs;

-- Create corrected RLS policies
CREATE POLICY "Users can view audit logs for their vehicles" ON public.vehicle_event_audit_logs
    FOR SELECT TO authenticated
    USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    );

CREATE POLICY "System can insert audit logs" ON public.vehicle_event_audit_logs
    FOR INSERT TO authenticated
    WITH CHECK (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    );

-- STEP 5: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_id ON public.vehicle_event_audit_logs(event_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id ON public.vehicle_event_audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_events_edited_at ON public.vehicle_events(edited_at) WHERE edited_at IS NOT NULL;

-- STEP 6: Add constraints using CORRECT PostgreSQL syntax (no IF NOT EXISTS)
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
    ELSE
        RAISE NOTICE 'check_display_amount_positive constraint already exists';
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
    ELSE
        RAISE NOTICE 'check_edit_reason_when_edited constraint already exists';
    END IF;
END $$;

-- STEP 7: Add helpful utility functions
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

-- STEP 8: Add comments for documentation
COMMENT ON COLUMN public.vehicle_events.display_vendor IS 'User-corrected vendor name, overrides extracted vendor';
COMMENT ON COLUMN public.vehicle_events.display_amount IS 'User-corrected amount, overrides extracted total_amount';
COMMENT ON COLUMN public.vehicle_events.display_summary IS 'User-provided custom summary, overrides auto-generated summary';
COMMENT ON COLUMN public.vehicle_events.user_notes IS 'Additional user notes and context';
COMMENT ON COLUMN public.vehicle_events.edited_at IS 'Timestamp when user last edited this event';
COMMENT ON COLUMN public.vehicle_events.edited_by IS 'User ID who last edited this event';
COMMENT ON COLUMN public.vehicle_events.edit_reason IS 'Reason provided by user for the edit';

-- STEP 9: Final verification
DO $$
BEGIN
    RAISE NOTICE '=== MIGRATION COMPLETED SUCCESSFULLY ===';
    
    -- Verify vehicle_events.id constraint
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'vehicle_events' 
        AND kcu.column_name = 'id'
        AND tc.constraint_type IN ('PRIMARY KEY', 'UNIQUE')
        AND tc.table_schema = 'public'
    ) THEN
        RAISE NOTICE '✅ vehicle_events.id has proper UNIQUE/PK constraint';
    ELSE
        RAISE WARNING '❌ vehicle_events.id constraint issue - FK may fail';
    END IF;
    
    -- Verify audit table creation
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'vehicle_event_audit_logs'
        AND table_schema = 'public'
    ) THEN
        RAISE NOTICE '✅ vehicle_event_audit_logs table created';
    ELSE
        RAISE WARNING '❌ vehicle_event_audit_logs table missing';
    END IF;
    
    -- Verify new columns
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
    
    RAISE NOTICE '=== READY FOR PRODUCTION DEPLOYMENT ===';
END $$;
