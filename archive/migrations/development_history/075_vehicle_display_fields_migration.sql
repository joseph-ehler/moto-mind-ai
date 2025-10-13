-- Migration: Add display fields and edit audit trail to vehicle_events table
-- This enables the hybrid edit model while preserving original extractions

-- Add display fields for user corrections
ALTER TABLE vehicle_events 
ADD COLUMN IF NOT EXISTS display_vendor TEXT,
ADD COLUMN IF NOT EXISTS display_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS display_summary TEXT,
ADD COLUMN IF NOT EXISTS user_notes TEXT;

-- Add edit audit trail fields
ALTER TABLE vehicle_events 
ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS edited_by TEXT,
ADD COLUMN IF NOT EXISTS edit_reason TEXT;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_vehicle_events_edited_at ON vehicle_events(edited_at) WHERE edited_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vehicle_events_display_vendor ON vehicle_events(display_vendor) WHERE display_vendor IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN vehicle_events.display_vendor IS 'User-corrected vendor name, overrides extracted vendor';
COMMENT ON COLUMN vehicle_events.display_amount IS 'User-corrected amount, overrides extracted total_amount';
COMMENT ON COLUMN vehicle_events.display_summary IS 'User-provided custom summary, overrides auto-generated summary';
COMMENT ON COLUMN vehicle_events.user_notes IS 'Additional user notes and context';
COMMENT ON COLUMN vehicle_events.edited_at IS 'Timestamp when user last edited this event';
COMMENT ON COLUMN vehicle_events.edited_by IS 'User ID who last edited this event';
COMMENT ON COLUMN vehicle_events.edit_reason IS 'Reason provided by user for the edit';

-- Optional: Create audit log table for detailed edit history
CREATE TABLE IF NOT EXISTS vehicle_event_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES vehicle_events(id) ON DELETE CASCADE,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    action TEXT NOT NULL, -- 'event_edited', 'event_created', etc.
    changes JSONB, -- What was changed
    original_values JSONB, -- What the values were before
    confidence_at_edit INTEGER, -- Confidence score when edit was made
    validation_issues TEXT[], -- Any validation issues present at time of edit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by TEXT,
    
    -- Add tenant isolation
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE
);

-- Indexes for audit log
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_id ON vehicle_event_audit_logs(event_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_vehicle_id ON vehicle_event_audit_logs(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON vehicle_event_audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id ON vehicle_event_audit_logs(tenant_id);

-- RLS policies for audit log
ALTER TABLE vehicle_event_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view audit logs for their vehicles" ON vehicle_event_audit_logs
    FOR SELECT USING (
        vehicle_id IN (
            SELECT v.id FROM vehicles v 
            WHERE v.tenant_id = auth.jwt() ->> 'tenant_id'::text
        )
    );

CREATE POLICY "System can insert audit logs" ON vehicle_event_audit_logs
    FOR INSERT WITH CHECK (
        vehicle_id IN (
            SELECT v.id FROM vehicles v 
            WHERE v.tenant_id = auth.jwt() ->> 'tenant_id'::text
        )
    );

-- Update the vehicle_events RLS policies to include display fields
-- (This assumes your existing RLS policies need to be updated)

-- Function to get effective vendor (display_vendor or fallback to vendor)
CREATE OR REPLACE FUNCTION get_effective_vendor(event vehicle_events)
RETURNS TEXT AS $$
BEGIN
    RETURN COALESCE(event.display_vendor, event.vendor, 'Unknown Vendor');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to get effective amount (display_amount or fallback to total_amount)
CREATE OR REPLACE FUNCTION get_effective_amount(event vehicle_events)
RETURNS DECIMAL(10,2) AS $$
BEGIN
    RETURN COALESCE(event.display_amount, event.total_amount);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to check if event has been edited
CREATE OR REPLACE FUNCTION is_event_edited(event vehicle_events)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN event.edited_at IS NOT NULL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger to automatically update updated_at when display fields change
CREATE OR REPLACE FUNCTION update_event_timestamp()
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

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_event_timestamp ON vehicle_events;
CREATE TRIGGER trigger_update_event_timestamp
    BEFORE UPDATE ON vehicle_events
    FOR EACH ROW
    EXECUTE FUNCTION update_event_timestamp();

-- Add validation constraints
ALTER TABLE vehicle_events 
ADD CONSTRAINT check_display_amount_positive 
CHECK (display_amount IS NULL OR display_amount >= 0);

ALTER TABLE vehicle_events 
ADD CONSTRAINT check_edit_reason_when_edited 
CHECK (
    (edited_at IS NULL AND edit_reason IS NULL) OR 
    (edited_at IS NOT NULL AND edit_reason IS NOT NULL)
);

-- Grant permissions (adjust based on your role setup)
-- GRANT SELECT, UPDATE ON vehicle_events TO authenticated;
-- GRANT SELECT, INSERT ON vehicle_event_audit_logs TO authenticated;
