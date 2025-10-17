-- User Notification Preferences Table
-- Stores user preferences for email and security notifications

CREATE TABLE IF NOT EXISTS user_notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  preferences JSONB NOT NULL DEFAULT '{
    "emailNotifications": true,
    "securityAlerts": true,
    "newDeviceLogin": true,
    "unusualActivity": true,
    "passwordChanged": true,
    "sessionExpired": false
  }'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_notification_prefs_user_id 
  ON user_notification_preferences(user_id);

-- RLS Policies
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;

-- Users can read their own preferences
CREATE POLICY "Users can read own notification preferences"
  ON user_notification_preferences
  FOR SELECT
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Users can update their own preferences
CREATE POLICY "Users can update own notification preferences"
  ON user_notification_preferences
  FOR UPDATE
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Users can insert their own preferences
CREATE POLICY "Users can insert own notification preferences"
  ON user_notification_preferences
  FOR INSERT
  WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_notification_prefs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_notification_prefs_updated_at_trigger
  BEFORE UPDATE ON user_notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_prefs_updated_at();

COMMENT ON TABLE user_notification_preferences IS 'Stores user notification preferences for email and security alerts';
