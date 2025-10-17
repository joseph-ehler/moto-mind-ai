-- ============================================================================
-- AUTH CREDENTIALS TABLE
-- ============================================================================
-- Created: 2025-10-16
-- Purpose: Store credentials for email/password authentication
--          Complements NextAuth's OAuth providers
--
-- Security:
--   - Password hashes stored using bcrypt (12 rounds)
--   - RLS enabled for admin access only
--   - Service role bypasses RLS for auth operations
-- ============================================================================

-- Create credentials table
CREATE TABLE IF NOT EXISTS credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL, -- Email (matches user_tenants.user_id)
  password_hash TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'credentials',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one credential per user per provider
  UNIQUE(user_id, provider)
);

-- Add index for fast lookups
CREATE INDEX IF NOT EXISTS idx_credentials_user_id 
  ON credentials(user_id);

CREATE INDEX IF NOT EXISTS idx_credentials_provider 
  ON credentials(provider);

-- Enable RLS
ALTER TABLE credentials ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Only service role can access credentials
-- (Prevents any user from reading password hashes)
CREATE POLICY "Service role only" ON credentials
  USING (auth.role() = 'service_role');

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_credentials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER credentials_updated_at
  BEFORE UPDATE ON credentials
  FOR EACH ROW
  EXECUTE FUNCTION update_credentials_updated_at();

-- Add comment
COMMENT ON TABLE credentials IS 'Stores password hashes for credentials-based authentication. RLS enforced - service role only.';

-- ============================================================================
-- NEXTAUTH TABLES (Standard NextAuth Schema)
-- ============================================================================
-- These tables are used by NextAuth for session management and OAuth
-- Reference: https://next-auth.js.org/adapters/models

-- Accounts table (OAuth connections)
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL, -- Email
  type TEXT NOT NULL, -- 'oauth', 'email', 'credentials'
  provider TEXT NOT NULL, -- 'google', 'email', 'credentials'
  provider_account_id TEXT NOT NULL, -- Provider's user ID
  refresh_token TEXT,
  access_token TEXT,
  expires_at BIGINT,
  token_type TEXT,
  scope TEXT,
  id_token TEXT,
  session_state TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(provider, provider_account_id)
);

CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);

-- Sessions table (active sessions)
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token TEXT NOT NULL UNIQUE,
  user_id TEXT NOT NULL,
  expires TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token);

-- Verification tokens table (magic links, email verification)
CREATE TABLE IF NOT EXISTS verification_tokens (
  identifier TEXT NOT NULL, -- Email
  token TEXT NOT NULL UNIQUE,
  expires TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  PRIMARY KEY (identifier, token)
);

CREATE INDEX IF NOT EXISTS idx_verification_tokens_token ON verification_tokens(token);

-- Enable RLS on NextAuth tables
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Service role only (NextAuth manages these)
CREATE POLICY "Service role only" ON accounts
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role only" ON sessions
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role only" ON verification_tokens
  USING (auth.role() = 'service_role');

-- Add comments
COMMENT ON TABLE accounts IS 'NextAuth accounts table. Stores OAuth and credentials connections.';
COMMENT ON TABLE sessions IS 'NextAuth sessions table. Stores active user sessions.';
COMMENT ON TABLE verification_tokens IS 'NextAuth verification tokens. Used for magic links and email verification.';

-- ============================================================================
-- CLEANUP OLD SESSIONS (Optional Background Job)
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  -- Delete expired sessions
  DELETE FROM sessions WHERE expires < NOW();
  
  -- Delete expired verification tokens
  DELETE FROM verification_tokens WHERE expires < NOW();
  
  RAISE NOTICE 'Cleaned up expired sessions and tokens';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_expired_sessions IS 'Cleanup function for expired sessions and tokens. Run via cron job.';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
  -- Verify credentials table
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'credentials') THEN
    RAISE NOTICE '✅ credentials table created';
  ELSE
    RAISE EXCEPTION '❌ credentials table creation failed';
  END IF;
  
  -- Verify NextAuth tables
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'accounts') THEN
    RAISE NOTICE '✅ accounts table created';
  ELSE
    RAISE EXCEPTION '❌ accounts table creation failed';
  END IF;
  
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'sessions') THEN
    RAISE NOTICE '✅ sessions table created';
  ELSE
    RAISE EXCEPTION '❌ sessions table creation failed';
  END IF;
  
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'verification_tokens') THEN
    RAISE NOTICE '✅ verification_tokens table created';
  ELSE
    RAISE EXCEPTION '❌ verification_tokens table creation failed';
  END IF;
  
  RAISE NOTICE '✅ All auth tables created successfully';
END $$;
