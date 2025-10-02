-- Migration: Jurisdiction Rules System
-- Created: 2025-09-25
-- Purpose: Location-based vehicle compliance rules and reminders

-- Static jurisdiction rules (seeded via migrations, editable in admin)
CREATE TABLE jurisdiction_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country VARCHAR(2) NOT NULL,           -- 'US'
  state VARCHAR(2),                      -- 'FL', 'CA', 'NY'
  county VARCHAR(100),                   -- optional for county-specific rules
  kind VARCHAR(20) NOT NULL,             -- 'registration', 'inspection', 'emissions'
  cadence VARCHAR(20) NOT NULL,          -- 'annual', 'biannual', 'none'
  due_rule VARCHAR(30),                  -- 'birthMonth', 'fixedMonth', 'monthFromPurchase'
  due_month INTEGER,                     -- 1..12 for fixedMonth rules
  grace_days INTEGER DEFAULT 0,          -- late window
  notes TEXT,                            -- human-readable explanation
  source VARCHAR(20) DEFAULT 'internal', -- provenance tracking
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT chk_country_format CHECK (LENGTH(country) = 2),
  CONSTRAINT chk_state_format CHECK (state IS NULL OR LENGTH(state) = 2),
  CONSTRAINT chk_kind_valid CHECK (kind IN ('registration', 'inspection', 'emissions')),
  CONSTRAINT chk_cadence_valid CHECK (cadence IN ('annual', 'biannual', 'none')),
  CONSTRAINT chk_due_rule_valid CHECK (due_rule IS NULL OR due_rule IN ('birthMonth', 'fixedMonth', 'monthFromPurchase')),
  CONSTRAINT chk_due_month_valid CHECK (due_month IS NULL OR (due_month >= 1 AND due_month <= 12))
);

-- Per-garage computed jurisdiction profile (cache of effective rules)
CREATE TABLE garage_jurisdiction_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  garage_id UUID NOT NULL REFERENCES garages(id) ON DELETE CASCADE,
  country VARCHAR(2) NOT NULL,
  state VARCHAR(2),
  county VARCHAR(100),
  rules_json JSONB NOT NULL DEFAULT '{}',  -- denormalized effective rules for fast reads
  derived_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- One profile per garage
  UNIQUE(garage_id)
);

-- Weather alerts for garages
CREATE TABLE garage_weather_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  garage_id UUID NOT NULL REFERENCES garages(id) ON DELETE CASCADE,
  kind VARCHAR(20) NOT NULL,             -- 'heat', 'freeze', 'storm'
  severity VARCHAR(10) NOT NULL,         -- 'low', 'medium', 'high'
  window_start_iso DATE NOT NULL,
  window_end_iso DATE NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT chk_weather_kind CHECK (kind IN ('heat', 'freeze', 'storm')),
  CONSTRAINT chk_weather_severity CHECK (severity IN ('low', 'medium', 'high')),
  CONSTRAINT chk_weather_window CHECK (window_end_iso >= window_start_iso),
  
  -- Prevent duplicates for same garage/kind/window
  UNIQUE(garage_id, kind, window_start_iso)
);

-- Enhanced reminders table (add garage tracking and source)
ALTER TABLE reminders ADD COLUMN IF NOT EXISTS garage_id_at_creation UUID REFERENCES garages(id);
ALTER TABLE reminders ADD COLUMN IF NOT EXISTS source VARCHAR(20) DEFAULT 'user';
ALTER TABLE reminders ADD COLUMN IF NOT EXISTS rule_hash VARCHAR(64); -- for idempotent updates

-- Performance indexes
CREATE INDEX idx_jurisdiction_rules_location ON jurisdiction_rules(country, state, county);
CREATE INDEX idx_garage_profiles_garage ON garage_jurisdiction_profiles(garage_id);
CREATE INDEX idx_weather_alerts_garage_window ON garage_weather_alerts(garage_id, window_start_iso, window_end_iso);
CREATE INDEX idx_reminders_source ON reminders(source);
CREATE INDEX idx_reminders_garage_creation ON reminders(garage_id_at_creation);

-- Seed initial jurisdiction rules for FL, CA, NY
INSERT INTO jurisdiction_rules (country, state, kind, cadence, due_rule, notes) VALUES
-- Florida
('US', 'FL', 'registration', 'annual', 'birthMonth', 'Annual registration due in birth month. No emissions testing required.'),
('US', 'FL', 'inspection', 'none', NULL, 'No state vehicle inspection required in Florida.'),
('US', 'FL', 'emissions', 'none', NULL, 'No emissions testing required in Florida.'),

-- California  
('US', 'CA', 'registration', 'annual', 'birthMonth', 'Annual registration due in birth month.'),
('US', 'CA', 'inspection', 'none', NULL, 'No state inspection, but smog check required for emissions.'),
('US', 'CA', 'emissions', 'biannual', NULL, 'Smog check required every 2 years for most vehicles.'),

-- New York
('US', 'NY', 'registration', 'biannual', 'birthMonth', 'Registration renewal every 2 years in birth month.'),
('US', 'NY', 'inspection', 'annual', 'fixedMonth', 'Annual safety inspection required.'),
('US', 'NY', 'emissions', 'annual', 'fixedMonth', 'Annual emissions inspection in most counties.');

-- Comments for documentation
COMMENT ON TABLE jurisdiction_rules IS 'Static rules for vehicle compliance by location';
COMMENT ON TABLE garage_jurisdiction_profiles IS 'Computed effective rules cache per garage';
COMMENT ON TABLE garage_weather_alerts IS 'Weather-based vehicle care alerts';
COMMENT ON COLUMN reminders.garage_id_at_creation IS 'Tracks which garage rules created this reminder';
COMMENT ON COLUMN reminders.source IS 'Source of reminder: user, jurisdiction, weather, etc';
COMMENT ON COLUMN reminders.rule_hash IS 'Hash of rule payload for idempotent updates';
