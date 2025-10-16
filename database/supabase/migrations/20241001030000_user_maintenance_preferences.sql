-- User-defined maintenance interval preferences
-- Allows users to set custom service intervals for their vehicles
-- Foundation for future reminder/automation system

CREATE TABLE IF NOT EXISTS user_maintenance_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  
  -- Interval type identifier
  interval_type TEXT NOT NULL CHECK (interval_type IN (
    'oil_change',
    'tire_rotation',
    'air_filter',
    'cabin_filter',
    'spark_plugs',
    'transmission_service',
    'brake_fluid_flush',
    'coolant_flush',
    'differential_service',
    'brake_inspection',
    'serpentine_belt',
    'timing_belt'
  )),
  
  -- User's chosen interval
  interval_value INTEGER NOT NULL CHECK (interval_value > 0),
  interval_unit TEXT NOT NULL CHECK (interval_unit IN ('miles', 'months', 'years')) DEFAULT 'miles',
  
  -- Optional notes from user
  notes TEXT,
  
  -- Source/rationale
  source TEXT, -- e.g., "My mechanic's recommendation", "Severe driving conditions"
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- One preference per interval type per vehicle
  UNIQUE(vehicle_id, interval_type)
);

-- Index for fast lookups
CREATE INDEX idx_user_maintenance_prefs_vehicle ON user_maintenance_preferences(vehicle_id);
CREATE INDEX idx_user_maintenance_prefs_user ON user_maintenance_preferences(user_id);

-- RLS Policies
ALTER TABLE user_maintenance_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own maintenance preferences"
  ON user_maintenance_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own maintenance preferences"
  ON user_maintenance_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own maintenance preferences"
  ON user_maintenance_preferences
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own maintenance preferences"
  ON user_maintenance_preferences
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_maintenance_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_maintenance_preferences_updated_at
  BEFORE UPDATE ON user_maintenance_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_user_maintenance_preferences_updated_at();

-- Comment
COMMENT ON TABLE user_maintenance_preferences IS 'User-defined custom maintenance intervals for their vehicles. Foundation for future reminder automation system.';
