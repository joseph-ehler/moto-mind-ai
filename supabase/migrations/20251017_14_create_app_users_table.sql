-- Create app_users table for NextAuth
-- This app uses NextAuth, NOT Supabase Auth
-- user_id is TEXT (Google user IDs like "104135733357510565203")

DROP TABLE IF EXISTS app_users CASCADE;

CREATE TABLE app_users (
  id TEXT PRIMARY KEY, -- NextAuth user ID (from Google, email provider, etc.)
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  image TEXT,
  email_verified BOOLEAN DEFAULT true, -- Default true for Google OAuth
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast email lookups
CREATE INDEX idx_app_users_email ON app_users(email);

-- Enable RLS
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;

-- Permissive policy (auth handled in API via NextAuth)
CREATE POLICY "Allow all operations on app_users"
  ON app_users FOR ALL
  USING (true) WITH CHECK (true);

COMMENT ON POLICY "Allow all operations on app_users" ON app_users IS 
  'Permissive - auth handled in API via NextAuth';

COMMENT ON TABLE app_users IS 
  'NextAuth users table. user_id is TEXT for Google/OAuth IDs.';

-- Trigger to update updated_at
CREATE TRIGGER trigger_app_users_updated_at
  BEFORE UPDATE ON app_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
