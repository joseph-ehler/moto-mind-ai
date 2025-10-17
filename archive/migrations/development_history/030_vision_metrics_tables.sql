-- Vision Metrics Tables Migration
-- Creates tables for production vision processing monitoring

-- Vision processing metrics table
CREATE TABLE IF NOT EXISTS vision_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    document_type TEXT NOT NULL,
    processing_time_ms INTEGER NOT NULL,
    success BOOLEAN NOT NULL DEFAULT false,
    confidence DECIMAL(3,2), -- 0.00 to 1.00
    error_code TEXT,
    retry_attempt INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes for performance
    CONSTRAINT vision_metrics_confidence_check CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1))
);

-- Vision accuracy tracking table
CREATE TABLE IF NOT EXISTS vision_accuracy (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    document_type TEXT NOT NULL,
    field_name TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL,
    predicted_confidence DECIMAL(3,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT vision_accuracy_confidence_check CHECK (predicted_confidence >= 0 AND predicted_confidence <= 1)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_vision_metrics_tenant_created ON vision_metrics(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vision_metrics_document_type ON vision_metrics(document_type);
CREATE INDEX IF NOT EXISTS idx_vision_metrics_success ON vision_metrics(success);
CREATE INDEX IF NOT EXISTS idx_vision_accuracy_tenant_created ON vision_accuracy(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vision_accuracy_field ON vision_accuracy(field_name);
CREATE INDEX IF NOT EXISTS idx_vision_accuracy_document_type ON vision_accuracy(document_type);

-- Row Level Security (RLS)
ALTER TABLE vision_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE vision_accuracy ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vision_metrics
CREATE POLICY "vision_metrics_tenant_isolation" ON vision_metrics
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);

-- RLS Policies for vision_accuracy  
CREATE POLICY "vision_accuracy_tenant_isolation" ON vision_accuracy
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);

-- Grant permissions to service role
GRANT ALL ON vision_metrics TO service_role;
GRANT ALL ON vision_accuracy TO service_role;

-- Comments for documentation
COMMENT ON TABLE vision_metrics IS 'Tracks vision processing requests for monitoring and performance analysis';
COMMENT ON TABLE vision_accuracy IS 'Tracks field-level accuracy measurements for vision processing validation';

COMMENT ON COLUMN vision_metrics.document_type IS 'Type of document processed (dashboard_snapshot, service_invoice, etc.)';
COMMENT ON COLUMN vision_metrics.processing_time_ms IS 'Time taken to process the document in milliseconds';
COMMENT ON COLUMN vision_metrics.confidence IS 'AI confidence score from 0.00 to 1.00';
COMMENT ON COLUMN vision_metrics.error_code IS 'Error code if processing failed (TIMEOUT, PARSE_FAILED, etc.)';

COMMENT ON COLUMN vision_accuracy.field_name IS 'Name of the field being validated (odometer, fuel_level, etc.)';
COMMENT ON COLUMN vision_accuracy.is_correct IS 'Whether the extracted value was correct';
COMMENT ON COLUMN vision_accuracy.predicted_confidence IS 'AI confidence score for this field extraction';
