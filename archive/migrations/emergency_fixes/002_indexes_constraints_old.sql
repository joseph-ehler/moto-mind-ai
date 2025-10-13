-- MotoMindAI: Performance Indexes & Data Constraints
-- Essential for production performance and data integrity

-- Performance indexes for tenant-scoped queries
CREATE INDEX IF NOT EXISTS vehicles_tenant_created_idx ON vehicles (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS vehicles_tenant_label_idx ON vehicles (tenant_id, label);

CREATE INDEX IF NOT EXISTS vehicle_metrics_tenant_vehicle_date_idx ON vehicle_metrics (tenant_id, vehicle_id, metric_date DESC);
CREATE INDEX IF NOT EXISTS vehicle_metrics_tenant_date_idx ON vehicle_metrics (tenant_id, metric_date DESC);

CREATE INDEX IF NOT EXISTS explanations_tenant_vehicle_created_idx ON explanations (tenant_id, vehicle_id, created_at DESC);
CREATE INDEX IF NOT EXISTS explanations_tenant_created_idx ON explanations (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS explanations_confidence_idx ON explanations (confidence);

CREATE INDEX IF NOT EXISTS audit_logs_tenant_created_idx ON audit_logs (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_explanation_idx ON audit_logs (explanation_id) WHERE explanation_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS audit_logs_vehicle_idx ON audit_logs (vehicle_id) WHERE vehicle_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS provider_integrations_tenant_provider_idx ON provider_integrations (tenant_id, provider);
CREATE INDEX IF NOT EXISTS provider_integrations_active_idx ON provider_integrations (tenant_id, is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS usage_counters_tenant_day_idx ON usage_counters (tenant_id, day DESC);

-- Data validation constraints
ALTER TABLE vehicle_metrics
  ADD CONSTRAINT IF NOT EXISTS brake_wear_pct_range 
    CHECK (brake_wear_pct BETWEEN 0 AND 100 OR brake_wear_pct IS NULL),
  ADD CONSTRAINT IF NOT EXISTS data_completeness_pct_range 
    CHECK (data_completeness_pct BETWEEN 0 AND 100),
  ADD CONSTRAINT IF NOT EXISTS fuel_efficiency_positive 
    CHECK (fuel_efficiency_mpg > 0 OR fuel_efficiency_mpg IS NULL),
  ADD CONSTRAINT IF NOT EXISTS harsh_events_non_negative 
    CHECK (harsh_events >= 0),
  ADD CONSTRAINT IF NOT EXISTS idle_minutes_non_negative 
    CHECK (idle_minutes >= 0),
  ADD CONSTRAINT IF NOT EXISTS miles_driven_non_negative 
    CHECK (miles_driven >= 0 OR miles_driven IS NULL);

ALTER TABLE explanations
  ADD CONSTRAINT IF NOT EXISTS confidence_enum 
    CHECK (confidence IN ('high','medium','low')),
  ADD CONSTRAINT IF NOT EXISTS data_quality_score_range 
    CHECK (data_quality_score BETWEEN 0 AND 100 OR data_quality_score IS NULL);

ALTER TABLE usage_counters
  ADD CONSTRAINT IF NOT EXISTS explanations_count_non_negative 
    CHECK (explanations_count >= 0),
  ADD CONSTRAINT IF NOT EXISTS pdf_exports_count_non_negative 
    CHECK (pdf_exports_count >= 0),
  ADD CONSTRAINT IF NOT EXISTS tokens_in_non_negative 
    CHECK (tokens_in >= 0),
  ADD CONSTRAINT IF NOT EXISTS tokens_out_non_negative 
    CHECK (tokens_out >= 0);

-- Tenant name constraints
ALTER TABLE tenants
  ADD CONSTRAINT IF NOT EXISTS tenant_name_not_empty 
    CHECK (length(trim(name)) > 0),
  ADD CONSTRAINT IF NOT EXISTS tenant_kind_enum 
    CHECK (kind IN ('solo', 'org'));

-- Vehicle label constraints
ALTER TABLE vehicles
  ADD CONSTRAINT IF NOT EXISTS vehicle_label_not_empty 
    CHECK (length(trim(label)) > 0);

-- Membership role constraints
ALTER TABLE memberships
  ADD CONSTRAINT IF NOT EXISTS membership_role_enum 
    CHECK (role IN ('owner', 'manager', 'viewer'));

-- Provider integration constraints
ALTER TABLE provider_integrations
  ADD CONSTRAINT IF NOT EXISTS provider_name_enum 
    CHECK (provider IN ('samsara', 'geotab', 'fleet_complete'));

-- Create partial indexes for common query patterns
CREATE INDEX IF NOT EXISTS vehicles_active_idx ON vehicles (tenant_id, created_at DESC) 
  WHERE updated_at > (now() - interval '30 days');

CREATE INDEX IF NOT EXISTS explanations_recent_idx ON explanations (tenant_id, created_at DESC) 
  WHERE created_at > (now() - interval '7 days');

CREATE INDEX IF NOT EXISTS audit_logs_recent_idx ON audit_logs (tenant_id, created_at DESC) 
  WHERE created_at > (now() - interval '24 hours');

-- Add comments for documentation
COMMENT ON INDEX vehicles_tenant_created_idx IS 'Primary index for vehicle listing by tenant';
COMMENT ON INDEX vehicle_metrics_tenant_vehicle_date_idx IS 'Time-series queries for vehicle metrics';
COMMENT ON INDEX explanations_tenant_created_idx IS 'Recent explanations by tenant';
COMMENT ON INDEX audit_logs_tenant_created_idx IS 'Audit trail queries by tenant';
COMMENT ON INDEX usage_counters_tenant_day_idx IS 'Billing and usage analytics';
