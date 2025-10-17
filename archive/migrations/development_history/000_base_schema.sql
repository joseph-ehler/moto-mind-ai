-- MotoMindAI: Base Database Schema
-- Core tables for multi-tenant fleet intelligence

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tenants table (root of tenant isolation)
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('solo', 'org')),
  plan_name TEXT DEFAULT 'solo',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'past_due', 'canceled', 'unpaid')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tenant memberships
CREATE TABLE IF NOT EXISTS memberships (
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'manager', 'viewer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, user_id)
);

-- Vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  make TEXT,
  model TEXT,
  vin TEXT,
  baseline_fuel_mpg DECIMAL(4,1),
  baseline_service_interval_miles INTEGER DEFAULT 5000,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Vehicle metrics (computed from manual events or telematics)
CREATE TABLE IF NOT EXISTS vehicle_metrics (
  id BIGSERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  metric_date DATE NOT NULL,
  period_type TEXT DEFAULT 'daily' CHECK (period_type IN ('daily', 'weekly', 'monthly')),
  
  -- Core metrics
  brake_wear_pct DECIMAL(5,2),
  fuel_efficiency_mpg DECIMAL(5,2),
  harsh_events INTEGER DEFAULT 0,
  idle_minutes INTEGER DEFAULT 0,
  miles_driven INTEGER,
  last_service_date DATE,
  
  -- Data quality indicators
  data_completeness_pct INTEGER NOT NULL DEFAULT 0,
  source_latency_sec INTEGER DEFAULT 0,
  sensor_presence JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE (tenant_id, vehicle_id, metric_date, period_type)
);

-- Explanations table (LLM-generated insights)
CREATE TABLE IF NOT EXISTS explanations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  reasoning JSONB NOT NULL,
  confidence TEXT NOT NULL CHECK (confidence IN ('high', 'medium', 'low')),
  flag_types JSONB DEFAULT '[]',
  data_quality_score INTEGER,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Audit logs table (compliance and debugging)
CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  explanation_id UUID REFERENCES explanations(id) ON DELETE SET NULL,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  actor_type TEXT NOT NULL CHECK (actor_type IN ('user', 'system', 'api')),
  actor_id UUID,
  payload JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Provider integrations (Samsara, Geotab, etc.)
CREATE TABLE IF NOT EXISTS provider_integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('samsara', 'geotab', 'fleet_complete')),
  api_key_encrypted TEXT,
  config JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, provider)
);

-- Add updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vehicle_metrics_updated_at BEFORE UPDATE ON vehicle_metrics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_provider_integrations_updated_at BEFORE UPDATE ON provider_integrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Basic indexes for performance
CREATE INDEX IF NOT EXISTS tenants_created_at_idx ON tenants (created_at DESC);
CREATE INDEX IF NOT EXISTS vehicles_tenant_id_idx ON vehicles (tenant_id);
CREATE INDEX IF NOT EXISTS vehicle_metrics_tenant_vehicle_date_idx ON vehicle_metrics (tenant_id, vehicle_id, metric_date DESC);
CREATE INDEX IF NOT EXISTS explanations_tenant_created_idx ON explanations (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_tenant_created_idx ON audit_logs (tenant_id, created_at DESC);
