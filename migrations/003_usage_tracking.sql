-- MotoMindAI: Usage Tracking & Billing Infrastructure
-- Batched usage counters with billing integration

-- Usage counters for billing and quota enforcement
CREATE TABLE IF NOT EXISTS usage_counters (
  id BIGSERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  day DATE NOT NULL,
  explanations_count INTEGER DEFAULT 0,
  pdf_exports_count INTEGER DEFAULT 0,
  tokens_in INTEGER DEFAULT 0,
  tokens_out INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, day)
);

-- Enable RLS on usage_counters
ALTER TABLE usage_counters ENABLE ROW LEVEL SECURITY;

-- Usage counters policies
CREATE POLICY usage_counters_tenant_select ON usage_counters
  FOR SELECT USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY usage_counters_tenant_insert ON usage_counters
  FOR INSERT WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY usage_counters_tenant_update ON usage_counters
  FOR UPDATE USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
            WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Indexes for usage queries
CREATE INDEX IF NOT EXISTS usage_counters_tenant_day_idx ON usage_counters (tenant_id, day DESC);
CREATE INDEX IF NOT EXISTS usage_counters_day_idx ON usage_counters (day DESC);

-- Plan limits table for quota enforcement
CREATE TABLE IF NOT EXISTS plan_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_name TEXT NOT NULL UNIQUE,
  max_vehicles INTEGER NOT NULL,
  max_explanations_per_month INTEGER NOT NULL,
  max_pdf_exports_per_month INTEGER NOT NULL,
  max_members INTEGER DEFAULT 1,
  price_cents INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default plans
INSERT INTO plan_limits (plan_name, max_vehicles, max_explanations_per_month, max_pdf_exports_per_month, max_members, price_cents)
VALUES 
  ('solo', 1, 50, 10, 1, 2900),
  ('team', 25, 500, 100, 5, 29900),
  ('enterprise', 1000, 5000, 1000, 50, 99900)
ON CONFLICT (plan_name) DO NOTHING;

-- Add subscription info to tenants
ALTER TABLE tenants 
  ADD COLUMN IF NOT EXISTS plan_name TEXT DEFAULT 'solo' REFERENCES plan_limits(plan_name),
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'past_due', 'canceled', 'unpaid'));

-- Function to check usage limits
CREATE OR REPLACE FUNCTION check_usage_limit(
  p_tenant_id UUID,
  p_usage_type TEXT,
  p_requested_count INTEGER DEFAULT 1
) RETURNS BOOLEAN AS $$
DECLARE
  current_usage INTEGER;
  monthly_limit INTEGER;
  current_month DATE;
BEGIN
  -- Get current month
  current_month := date_trunc('month', CURRENT_DATE)::date;
  
  -- Get current usage for this month
  SELECT 
    CASE 
      WHEN p_usage_type = 'explanations' THEN COALESCE(SUM(explanations_count), 0)
      WHEN p_usage_type = 'pdf_exports' THEN COALESCE(SUM(pdf_exports_count), 0)
      ELSE 0
    END
  INTO current_usage
  FROM usage_counters 
  WHERE tenant_id = p_tenant_id 
    AND day >= current_month
    AND day < current_month + interval '1 month';
  
  -- Get the limit for this tenant's plan
  SELECT 
    CASE 
      WHEN p_usage_type = 'explanations' THEN pl.max_explanations_per_month
      WHEN p_usage_type = 'pdf_exports' THEN pl.max_pdf_exports_per_month
      ELSE 999999
    END
  INTO monthly_limit
  FROM tenants t
  JOIN plan_limits pl ON t.plan_name = pl.plan_name
  WHERE t.id = p_tenant_id;
  
  -- Check if adding the requested count would exceed the limit
  RETURN (current_usage + p_requested_count) <= monthly_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get usage summary for a tenant
CREATE OR REPLACE FUNCTION get_usage_summary(p_tenant_id UUID)
RETURNS TABLE (
  current_month_explanations INTEGER,
  current_month_pdf_exports INTEGER,
  current_month_tokens_in INTEGER,
  current_month_tokens_out INTEGER,
  plan_name TEXT,
  max_explanations INTEGER,
  max_pdf_exports INTEGER,
  explanations_remaining INTEGER,
  pdf_exports_remaining INTEGER
) AS $$
DECLARE
  current_month DATE;
BEGIN
  current_month := date_trunc('month', CURRENT_DATE)::date;
  
  RETURN QUERY
  SELECT 
    COALESCE(SUM(uc.explanations_count), 0)::INTEGER as current_month_explanations,
    COALESCE(SUM(uc.pdf_exports_count), 0)::INTEGER as current_month_pdf_exports,
    COALESCE(SUM(uc.tokens_in), 0)::INTEGER as current_month_tokens_in,
    COALESCE(SUM(uc.tokens_out), 0)::INTEGER as current_month_tokens_out,
    pl.plan_name,
    pl.max_explanations_per_month as max_explanations,
    pl.max_pdf_exports_per_month as max_pdf_exports,
    GREATEST(0, pl.max_explanations_per_month - COALESCE(SUM(uc.explanations_count), 0))::INTEGER as explanations_remaining,
    GREATEST(0, pl.max_pdf_exports_per_month - COALESCE(SUM(uc.pdf_exports_count), 0))::INTEGER as pdf_exports_remaining
  FROM tenants t
  JOIN plan_limits pl ON t.plan_name = pl.plan_name
  LEFT JOIN usage_counters uc ON t.id = uc.tenant_id 
    AND uc.day >= current_month
    AND uc.day < current_month + interval '1 month'
  WHERE t.id = p_tenant_id
  GROUP BY t.id, pl.plan_name, pl.max_explanations_per_month, pl.max_pdf_exports_per_month;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add updated_at trigger for usage_counters
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_usage_counters_updated_at 
  BEFORE UPDATE ON usage_counters 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE usage_counters IS 'Batched usage tracking for billing and quota enforcement';
COMMENT ON TABLE plan_limits IS 'Subscription plan definitions with usage limits';
COMMENT ON FUNCTION check_usage_limit IS 'Check if tenant can perform action within plan limits';
COMMENT ON FUNCTION get_usage_summary IS 'Get current usage and remaining quota for tenant';
