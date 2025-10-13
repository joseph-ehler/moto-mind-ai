-- MotoMindAI: Row-Level Security Policies
-- Prevents cross-tenant data access and writes

-- Enable RLS on all tenant-scoped tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE explanations ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_integrations ENABLE ROW LEVEL SECURITY;

-- Tenants policies
CREATE POLICY tenants_self_access ON tenants
  FOR ALL USING (id = current_setting('app.tenant_id', true)::uuid);

-- Vehicles policies (READ + WRITE protection)
CREATE POLICY vehicles_tenant_select ON vehicles
  FOR SELECT USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY vehicles_tenant_insert ON vehicles
  FOR INSERT WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY vehicles_tenant_update ON vehicles
  FOR UPDATE USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
            WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY vehicles_tenant_delete ON vehicles
  FOR DELETE USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Vehicle metrics policies
CREATE POLICY vehicle_metrics_tenant_select ON vehicle_metrics
  FOR SELECT USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY vehicle_metrics_tenant_insert ON vehicle_metrics
  FOR INSERT WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY vehicle_metrics_tenant_update ON vehicle_metrics
  FOR UPDATE USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
            WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Explanations policies
CREATE POLICY explanations_tenant_select ON explanations
  FOR SELECT USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY explanations_tenant_insert ON explanations
  FOR INSERT WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY explanations_tenant_update ON explanations
  FOR UPDATE USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
            WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Audit logs policies (append-only for compliance)
CREATE POLICY audit_logs_tenant_select ON audit_logs
  FOR SELECT USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY audit_logs_tenant_insert ON audit_logs
  FOR INSERT WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Provider integrations policies
CREATE POLICY provider_integrations_tenant_select ON provider_integrations
  FOR SELECT USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY provider_integrations_tenant_insert ON provider_integrations
  FOR INSERT WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY provider_integrations_tenant_update ON provider_integrations
  FOR UPDATE USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
            WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Usage counters policies
CREATE POLICY usage_counters_tenant_select ON usage_counters
  FOR SELECT USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY usage_counters_tenant_insert ON usage_counters
  FOR INSERT WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY usage_counters_tenant_update ON usage_counters
  FOR UPDATE USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
            WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Enable RLS on usage_counters
ALTER TABLE usage_counters ENABLE ROW LEVEL SECURITY;
