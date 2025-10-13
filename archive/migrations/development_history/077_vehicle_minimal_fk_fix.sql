-- MINIMAL FIX: Ensure vehicle_events.id can be referenced by foreign keys
-- This addresses the specific error: "there is no unique constraint matching given keys"

-- STEP 1: Check current state of vehicle_events.id
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'vehicle_events' 
AND column_name = 'id'
AND table_schema = 'public';

-- STEP 2: Check existing constraints on vehicle_events
SELECT 
    constraint_name,
    constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'vehicle_events' 
AND table_schema = 'public';

-- STEP 3: OPTION 1 - Make vehicle_events.id the primary key (RECOMMENDED)
-- Only run this if no primary key exists on vehicle_events
DO $$
BEGIN
    -- First ensure id is NOT NULL
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

    -- Then add primary key if it doesn't exist
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

-- STEP 4: ALTERNATIVE OPTION 2 - Add UNIQUE constraint if PK exists elsewhere
-- Only use this if you cannot make id the primary key
/*
DO $$
BEGIN
    -- Ensure id is NOT NULL
    ALTER TABLE public.vehicle_events ALTER COLUMN id SET NOT NULL;
    
    -- Add UNIQUE constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'vehicle_events' 
        AND constraint_name = 'vehicle_events_id_key'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.vehicle_events ADD CONSTRAINT vehicle_events_id_key UNIQUE (id);
        RAISE NOTICE 'Added UNIQUE constraint to vehicle_events.id';
    END IF;
END $$;
*/

-- STEP 5: Now add the display fields (safe to run multiple times)
ALTER TABLE public.vehicle_events 
ADD COLUMN IF NOT EXISTS display_vendor TEXT,
ADD COLUMN IF NOT EXISTS display_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS display_summary TEXT,
ADD COLUMN IF NOT EXISTS user_notes TEXT,
ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS edited_by TEXT,
ADD COLUMN IF NOT EXISTS edit_reason TEXT;

-- STEP 6: Create audit table with proper FK (now that vehicle_events.id is UNIQUE/PK)
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

-- STEP 7: CORRECTED RLS policies with proper casting
ALTER TABLE public.vehicle_event_audit_logs ENABLE ROW LEVEL SECURITY;

-- Fixed RLS policy - proper JWT claim extraction and UUID casting
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

-- STEP 8: Add essential indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_id ON public.vehicle_event_audit_logs(event_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id ON public.vehicle_event_audit_logs(tenant_id);

-- STEP 9: Add basic constraints (idempotent pattern for Postgres)
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

-- STEP 10: Verification
DO $$
BEGIN
    RAISE NOTICE 'Checking final state...';
    
    -- Check if vehicle_events.id now has a constraint
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'vehicle_events' 
        AND kcu.column_name = 'id'
        AND tc.constraint_type IN ('PRIMARY KEY', 'UNIQUE')
        AND tc.table_schema = 'public'
    ) THEN
        RAISE NOTICE '✅ vehicle_events.id now has UNIQUE/PK constraint';
    ELSE
        RAISE WARNING '❌ vehicle_events.id still lacks UNIQUE/PK constraint';
    END IF;
    
    -- Check if audit table was created
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'vehicle_event_audit_logs'
        AND table_schema = 'public'
    ) THEN
        RAISE NOTICE '✅ vehicle_event_audit_logs table created successfully';
    ELSE
        RAISE WARNING '❌ vehicle_event_audit_logs table creation failed';
    END IF;
END $$;
