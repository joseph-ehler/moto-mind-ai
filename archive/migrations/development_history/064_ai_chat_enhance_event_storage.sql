-- ENHANCE EVENT STORAGE: Production-grade extraction system
-- Transforms "blob storage" into "useful, trustworthy, queryable records"

-- 1. Add computed columns for efficient querying (tenant-aware)
ALTER TABLE public.vehicle_events 
ADD COLUMN IF NOT EXISTS vendor TEXT 
  GENERATED ALWAYS AS (payload->>'vendor') STORED;

ALTER TABLE public.vehicle_events 
ADD COLUMN IF NOT EXISTS service_type TEXT 
  GENERATED ALWAYS AS (payload->>'kind') STORED;

ALTER TABLE public.vehicle_events 
ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10,2) 
  GENERATED ALWAYS AS (CASE 
    WHEN payload->>'total_amount' ~ '^[0-9]+\.?[0-9]*$' 
    THEN (payload->>'total_amount')::DECIMAL(10,2) 
    ELSE NULL 
  END) STORED;

ALTER TABLE public.vehicle_events 
ADD COLUMN IF NOT EXISTS extraction_confidence INTEGER 
  GENERATED ALWAYS AS (CASE 
    WHEN payload->>'confidence' ~ '^[0-9]+$' 
    THEN (payload->>'confidence')::INTEGER 
    ELSE NULL 
  END) STORED;

-- LLM-ready fields
ALTER TABLE public.vehicle_events 
ADD COLUMN IF NOT EXISTS event_summary TEXT 
  GENERATED ALWAYS AS (payload->>'summary') STORED;

ALTER TABLE public.vehicle_events 
ADD COLUMN IF NOT EXISTS event_category TEXT 
  GENERATED ALWAYS AS (payload->'key_facts'->>'category') STORED;

-- 2. Add validation flags
ALTER TABLE public.vehicle_events 
ADD COLUMN IF NOT EXISTS validation_flags JSONB;

-- 3. Add quality tracking
ALTER TABLE public.vehicle_events 
ADD COLUMN IF NOT EXISTS quality_score DECIMAL(3,2);

ALTER TABLE public.vehicle_events 
ADD COLUMN IF NOT EXISTS user_verified BOOLEAN DEFAULT FALSE;

ALTER TABLE public.vehicle_events 
ADD COLUMN IF NOT EXISTS edit_count INTEGER DEFAULT 0;

-- 4. Create tenant-aware indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_events_tenant_vendor
  ON public.vehicle_events (tenant_id, vendor) WHERE vendor IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_events_tenant_service
  ON public.vehicle_events (tenant_id, service_type) WHERE service_type IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_events_tenant_amount
  ON public.vehicle_events (tenant_id, total_amount) WHERE total_amount IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_events_tenant_category
  ON public.vehicle_events (tenant_id, event_category) WHERE event_category IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_events_tenant_confidence
  ON public.vehicle_events (tenant_id, extraction_confidence) WHERE extraction_confidence IS NOT NULL;

-- 5. Create GIN index for JSON searching
CREATE INDEX IF NOT EXISTS idx_vehicle_events_payload_gin ON public.vehicle_events 
USING GIN (payload);

-- 6. Create index for validation flags
CREATE INDEX IF NOT EXISTS idx_vehicle_events_validation_gin ON public.vehicle_events 
USING GIN (validation_flags);

-- 7. Add comments for documentation
COMMENT ON COLUMN public.vehicle_events.vendor IS 'Extracted vendor/business name for efficient querying';
COMMENT ON COLUMN public.vehicle_events.service_type IS 'Extracted service type (oil_change, tire_rotation, etc.)';
COMMENT ON COLUMN public.vehicle_events.total_amount IS 'Extracted total cost for aggregation queries';
COMMENT ON COLUMN public.vehicle_events.extraction_confidence IS 'AI confidence score (0-100)';
COMMENT ON COLUMN public.vehicle_events.validation_flags IS 'Quality validation results (amount_makes_sense, date_is_recent, etc.)';
COMMENT ON COLUMN public.vehicle_events.quality_score IS 'Overall extraction quality score (0.0-1.0)';
COMMENT ON COLUMN public.vehicle_events.user_verified IS 'Whether user has verified this extraction';
COMMENT ON COLUMN public.vehicle_events.edit_count IS 'Number of times user has edited this event';

-- Example queries now possible (tenant-aware and efficient):

-- "Total spent at Jiffy Lube"
-- SELECT SUM(total_amount) FROM vehicle_events 
-- WHERE tenant_id = $1 AND vendor = 'Jiffy Lube';

-- "All oil changes"
-- SELECT * FROM vehicle_events 
-- WHERE tenant_id = $1 AND event_category = 'oil_change' 
-- ORDER BY date DESC;

-- "Last tire rotation date"
-- SELECT date FROM vehicle_events 
-- WHERE tenant_id = $1 AND event_category = 'tire_service' 
-- ORDER BY date DESC LIMIT 1;

-- "Low confidence extractions needing review"
-- SELECT event_summary, extraction_confidence FROM vehicle_events 
-- WHERE tenant_id = $1 AND extraction_confidence < 80;

-- "Events with validation issues"
-- SELECT event_summary, validation_flags FROM vehicle_events 
-- WHERE tenant_id = $1 AND validation_flags->>'amount_makes_sense' = 'false';

-- "LLM chat context (compact summaries)"
-- SELECT event_summary, key_facts FROM vehicle_events 
-- WHERE tenant_id = $1 AND vehicle_id = $2 
-- ORDER BY date DESC LIMIT 10;
