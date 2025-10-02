-- CORRECTED Migration: Add display fields and edit audit trail to vehicle_events table
-- This fixes the primary key and RLS policy issues

-- STEP 1: Ensure primary keys exist on referenced tables
-- Check and add primary key to vehicle_events if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'vehicle_events' 
        AND constraint_type = 'PRIMARY KEY'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.vehicle_events ADD CONSTRAINT vehicle_events_pkey PRIMARY KEY (id);
        RAISE NOTICE 'Added primary key to vehicle_events.id';
    ELSE
        RAISE NOTICE 'Primary key already exists on vehicle_events.id';
    END IF;
END $$;

-- Check and add primary key to vehicles if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'vehicles' 
        AND constraint_type = 'PRIMARY KEY'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.vehicles ADD CONSTRAINT vehicles_pkey PRIMARY KEY (id);
        RAISE NOTICE 'Added primary key to vehicles.id';
    ELSE
        RAISE NOTICE 'Primary key already exists on vehicles.id';
    END IF;
END $$;

-- Check and add primary key to tenants if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'tenants' 
        AND constraint_type = 'PRIMARY KEY'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.tenants ADD CONSTRAINT tenants_pkey PRIMARY KEY (id);
        RAISE NOTICE 'Added primary key to tenants.id';
    ELSE
        RAISE NOTICE 'Primary key already exists on tenants.id';
    END IF;
END $$;

-- STEP 2: Add display fields for user corrections to vehicle_events
ALTER TABLE public.vehicle_events 
ADD COLUMN IF NOT EXISTS display_vendor TEXT,
ADD COLUMN IF NOT EXISTS display_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS display_summary TEXT,
ADD COLUMN IF NOT EXISTS user_notes TEXT;

-- Add edit audit trail fields
ALTER TABLE public.vehicle_events 
ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS edited_by TEXT,
ADD COLUMN IF NOT EXISTS edit_reason TEXT;

-- STEP 3: Add indexes for performance on vehicle_events
CREATE INDEX IF NOT EXISTS idx_vehicle_events_edited_at ON public.vehicle_events(edited_at) WHERE edited_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vehicle_events_display_vendor ON public.vehicle_events(display_vendor) WHERE display_vendor IS NOT NULL;

-- STEP 4: Add comments for documentation
COMMENT ON COLUMN public.vehicle_events.display_vendor IS 'User-corrected vendor name, overrides extracted vendor';
COMMENT ON COLUMN public.vehicle_events.display_amount IS 'User-corrected amount, overrides extracted total_amount';
COMMENT ON COLUMN public.vehicle_events.display_summary IS 'User-provided custom summary, overrides auto-generated summary';
COMMENT ON COLUMN public.vehicle_events.user_notes IS 'Additional user notes and context';
COMMENT ON COLUMN public.vehicle_events.edited_at IS 'Timestamp when user last edited this event';
COMMENT ON COLUMN public.vehicle_events.edited_by IS 'User ID who last edited this event';
COMMENT ON COLUMN public.vehicle_events.edit_reason IS 'Reason provided by user for the edit';

-- STEP 5: Create audit log table with proper schema qualification and FK references
CREATE TABLE IF NOT EXISTS public.vehicle_event_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.vehicle_events(id) ON DELETE CASCADE,
    vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
    action TEXT NOT NULL, -- 'event_edited', 'event_created', etc.
    changes JSONB, -- What was changed
    original_values JSONB, -- What the values were before
    confidence_at_edit INTEGER, -- Confidence score when edit was made
    validation_issues TEXT[], -- Any validation issues present at time of edit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by TEXT,
    
    -- Add tenant isolation with proper FK
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE
);

-- STEP 6: Add indexes for audit log performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_id ON public.vehicle_event_audit_logs(event_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_vehicle_id ON public.vehicle_event_audit_logs(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.vehicle_event_audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id ON public.vehicle_event_audit_logs(tenant_id);

-- STEP 7: Enable RLS and create CORRECTED policies
ALTER TABLE public.vehicle_event_audit_logs ENABLE ROW LEVEL SECURITY;

-- Fixed RLS policy for SELECT - uses proper JWT extraction and UUID casting
CREATE POLICY "Users can view audit logs for their vehicles" ON public.vehicle_event_audit_logs
    FOR SELECT TO authenticated
    USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    );

-- Fixed RLS policy for INSERT - uses proper JWT extraction and UUID casting
CREATE POLICY "System can insert audit logs" ON public.vehicle_event_audit_logs
    FOR INSERT TO authenticated
    WITH CHECK (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    );

-- STEP 8: Helper functions for getting effective values
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

CREATE OR REPLACE FUNCTION public.is_event_edited(event public.vehicle_events)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN event.edited_at IS NOT NULL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- STEP 9: Trigger to automatically update updated_at when display fields change
CREATE OR REPLACE FUNCTION public.update_event_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update timestamp if display fields or user notes changed
    IF (OLD.display_vendor IS DISTINCT FROM NEW.display_vendor OR
        OLD.display_amount IS DISTINCT FROM NEW.display_amount OR
        OLD.display_summary IS DISTINCT FROM NEW.display_summary OR
        OLD.user_notes IS DISTINCT FROM NEW.user_notes) THEN
        
        NEW.updated_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger (drop first to avoid conflicts)
DROP TRIGGER IF EXISTS trigger_update_event_timestamp ON public.vehicle_events;
CREATE TRIGGER trigger_update_event_timestamp
    BEFORE UPDATE ON public.vehicle_events
    FOR EACH ROW
    EXECUTE FUNCTION public.update_event_timestamp();

-- STEP 10: Add validation constraints
ALTER TABLE public.vehicle_events 
ADD CONSTRAINT check_display_amount_positive 
CHECK (display_amount IS NULL OR display_amount >= 0);

ALTER TABLE public.vehicle_events 
ADD CONSTRAINT check_edit_reason_when_edited 
CHECK (
    (edited_at IS NULL AND edit_reason IS NULL) OR 
    (edited_at IS NOT NULL AND edit_reason IS NOT NULL)
);

-- STEP 11: Verification queries to confirm everything worked
DO $$
BEGIN
    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE 'New columns added to vehicle_events: display_vendor, display_amount, display_summary, user_notes, edited_at, edited_by, edit_reason';
    RAISE NOTICE 'Audit log table created: vehicle_event_audit_logs';
    RAISE NOTICE 'Helper functions created: get_effective_vendor(), get_effective_amount(), is_event_edited()';
    RAISE NOTICE 'RLS policies enabled with proper JWT extraction';
END $$;

-- Optional: Grant permissions (uncomment and adjust based on your role setup)
-- GRANT SELECT, UPDATE ON public.vehicle_events TO authenticated;
-- GRANT SELECT, INSERT ON public.vehicle_event_audit_logs TO authenticated;
