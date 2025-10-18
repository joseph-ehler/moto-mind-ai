-- Create users table for NextAuth
-- This app uses NextAuth, NOT Supabase Auth
-- user_id is TEXT (Google user IDs like "104135733357510565203")

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY, -- NextAuth user ID (from Google, email provider, etc.)
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  image TEXT,
  email_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast email lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Permissive policy (auth handled in API via NextAuth)
CREATE POLICY "Allow all operations on users"
  ON users FOR ALL
  USING (true) WITH CHECK (true);

COMMENT ON POLICY "Allow all operations on users" ON users IS 
  'Permissive - auth handled in API via NextAuth';

-- Trigger to update updated_at
CREATE TRIGGER trigger_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
