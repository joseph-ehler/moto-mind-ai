-- MotoMindAI: Smartphone-First Data Ingestion
-- OCR-powered capture without hardware dependencies

-- Raw file uploads (photos, PDFs, CSVs)
CREATE TABLE IF NOT EXISTS uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('odometer_photo','fuel_receipt','maintenance_doc','issue_photo','trip_csv')),
  storage_url TEXT NOT NULL,
  mime_type TEXT,
  bytes INTEGER,
  captured_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on uploads
ALTER TABLE uploads ENABLE ROW LEVEL SECURITY;

-- RLS policies for uploads
CREATE POLICY uploads_tenant_select ON uploads
  FOR SELECT USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY uploads_tenant_insert ON uploads
  FOR INSERT WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY uploads_tenant_update ON uploads
  FOR UPDATE USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
            WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Structured events extracted from uploads or manual entry
CREATE TABLE IF NOT EXISTS manual_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  source_upload_id UUID REFERENCES uploads(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('odometer_reading','fuel_purchase','maintenance','issue_report','trip_batch')),
  payload JSONB NOT NULL,
  confidence INTEGER CHECK (confidence BETWEEN 0 AND 100) DEFAULT 80,
  verified_by_user BOOLEAN DEFAULT false,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on manual_events
ALTER TABLE manual_events ENABLE ROW LEVEL SECURITY;

-- RLS policies for manual_events
CREATE POLICY manual_events_tenant_select ON manual_events
  FOR SELECT USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY manual_events_tenant_insert ON manual_events
  FOR INSERT WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY manual_events_tenant_update ON manual_events
  FOR UPDATE USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
            WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS uploads_tenant_vehicle_kind_idx ON uploads (tenant_id, vehicle_id, kind, created_at DESC);
CREATE INDEX IF NOT EXISTS uploads_tenant_created_idx ON uploads (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS manual_events_tenant_vehicle_type_idx ON manual_events (tenant_id, vehicle_id, event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS manual_events_tenant_created_idx ON manual_events (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS manual_events_upload_idx ON manual_events (source_upload_id) WHERE source_upload_id IS NOT NULL;

-- Add baseline metrics to vehicles for comparison
ALTER TABLE vehicles 
  ADD COLUMN IF NOT EXISTS baseline_fuel_mpg DECIMAL(4,1),
  ADD COLUMN IF NOT EXISTS baseline_service_interval_miles INTEGER DEFAULT 5000,
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Function to compute vehicle metrics from manual events
CREATE OR REPLACE FUNCTION compute_vehicle_metrics(p_tenant_id UUID, p_vehicle_id UUID)
RETURNS TABLE (
  vehicle_id UUID,
  latest_odometer_miles INTEGER,
  fuel_efficiency_mpg DECIMAL(4,1),
  miles_driven_since_service INTEGER,
  days_since_service INTEGER,
  data_completeness_pct INTEGER,
  source_latency_sec INTEGER,
  last_updated TIMESTAMPTZ
) AS $$
DECLARE
  latest_odometer INTEGER;
  prev_odometer INTEGER;
  latest_fuel_gallons DECIMAL;
  baseline_mpg DECIMAL;
  last_service_date DATE;
  last_service_miles INTEGER;
  completeness INTEGER;
BEGIN
  -- Get latest odometer reading
  SELECT (payload->>'miles')::INTEGER INTO latest_odometer
  FROM manual_events 
  WHERE tenant_id = p_tenant_id 
    AND vehicle_id = p_vehicle_id 
    AND event_type = 'odometer_reading'
  ORDER BY created_at DESC 
  LIMIT 1;

  -- Get previous odometer for MPG calculation
  SELECT (payload->>'miles')::INTEGER INTO prev_odometer
  FROM manual_events 
  WHERE tenant_id = p_tenant_id 
    AND vehicle_id = p_vehicle_id 
    AND event_type = 'odometer_reading'
    AND (payload->>'miles')::INTEGER < COALESCE(latest_odometer, 999999)
  ORDER BY created_at DESC 
  LIMIT 1;

  -- Get latest fuel purchase
  SELECT (payload->>'gallons')::DECIMAL INTO latest_fuel_gallons
  FROM manual_events 
  WHERE tenant_id = p_tenant_id 
    AND vehicle_id = p_vehicle_id 
    AND event_type = 'fuel_purchase'
  ORDER BY created_at DESC 
  LIMIT 1;

  -- Get baseline MPG from vehicle
  SELECT baseline_fuel_mpg INTO baseline_mpg
  FROM vehicles 
  WHERE id = p_vehicle_id;

  -- Get last service info
  SELECT 
    (payload->>'date')::DATE,
    (payload->>'odometer_miles')::INTEGER
  INTO last_service_date, last_service_miles
  FROM manual_events 
  WHERE tenant_id = p_tenant_id 
    AND vehicle_id = p_vehicle_id 
    AND event_type = 'maintenance'
  ORDER BY (payload->>'date')::DATE DESC 
  LIMIT 1;

  -- Calculate data completeness
  completeness := 0;
  IF latest_odometer IS NOT NULL THEN completeness := completeness + 25; END IF;
  IF latest_fuel_gallons IS NOT NULL THEN completeness := completeness + 25; END IF;
  IF baseline_mpg IS NOT NULL THEN completeness := completeness + 25; END IF;
  IF last_service_date IS NOT NULL THEN completeness := completeness + 25; END IF;

  RETURN QUERY SELECT
    p_vehicle_id,
    latest_odometer,
    CASE 
      WHEN latest_odometer IS NOT NULL AND prev_odometer IS NOT NULL AND latest_fuel_gallons IS NOT NULL
      THEN ((latest_odometer - prev_odometer)::DECIMAL / latest_fuel_gallons)
      ELSE baseline_mpg
    END,
    CASE 
      WHEN latest_odometer IS NOT NULL AND last_service_miles IS NOT NULL
      THEN latest_odometer - last_service_miles
      ELSE NULL
    END,
    CASE 
      WHEN last_service_date IS NOT NULL
      THEN EXTRACT(days FROM (CURRENT_DATE - last_service_date))::INTEGER
      ELSE NULL
    END,
    completeness,
    EXTRACT(epoch FROM (now() - (
      SELECT MAX(created_at) 
      FROM manual_events 
      WHERE tenant_id = p_tenant_id AND vehicle_id = p_vehicle_id
    )))::INTEGER,
    now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to refresh vehicle_metrics from manual events
CREATE OR REPLACE FUNCTION refresh_vehicle_metrics(p_tenant_id UUID, p_vehicle_id UUID)
RETURNS VOID AS $$
DECLARE
  computed_metrics RECORD;
BEGIN
  -- Get computed metrics
  SELECT * INTO computed_metrics
  FROM compute_vehicle_metrics(p_tenant_id, p_vehicle_id);

  -- Upsert into vehicle_metrics table
  INSERT INTO vehicle_metrics (
    tenant_id, vehicle_id, fuel_efficiency_mpg, miles_driven, 
    data_completeness_pct, source_latency_sec, metric_date, created_at
  )
  VALUES (
    p_tenant_id, 
    p_vehicle_id,
    computed_metrics.fuel_efficiency_mpg,
    computed_metrics.latest_odometer_miles,
    computed_metrics.data_completeness_pct,
    computed_metrics.source_latency_sec,
    CURRENT_DATE,
    now()
  )
  ON CONFLICT (tenant_id, vehicle_id, metric_date)
  DO UPDATE SET
    fuel_efficiency_mpg = EXCLUDED.fuel_efficiency_mpg,
    miles_driven = EXCLUDED.miles_driven,
    data_completeness_pct = EXCLUDED.data_completeness_pct,
    source_latency_sec = EXCLUDED.source_latency_sec,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-refresh metrics when manual events are added
CREATE OR REPLACE FUNCTION trigger_refresh_metrics()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM refresh_vehicle_metrics(NEW.tenant_id, NEW.vehicle_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER manual_events_refresh_metrics
  AFTER INSERT OR UPDATE ON manual_events
  FOR EACH ROW
  EXECUTE FUNCTION trigger_refresh_metrics();

-- Comments for documentation
COMMENT ON TABLE uploads IS 'Raw file uploads from smartphone capture (photos, PDFs, CSVs)';
COMMENT ON TABLE manual_events IS 'Structured events extracted from uploads or manual entry';
COMMENT ON FUNCTION compute_vehicle_metrics IS 'Compute current vehicle metrics from manual events';
COMMENT ON FUNCTION refresh_vehicle_metrics IS 'Refresh vehicle_metrics table from manual events';
