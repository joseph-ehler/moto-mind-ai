-- Migration: Auth Magic Links (Final Clean Version)
-- Created: 2025-10-18
-- Purpose: Add magic link authentication support (email + phone)

-- Drop everything safely (using DO blocks for conditional drops)
DO $$ 
BEGIN
  -- Drop policies if they exist
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all operations on auth_magic_links') THEN
    DROP POLICY "Allow all operations on auth_magic_links" ON auth_magic_links;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all operations on rate_limits') THEN
    DROP POLICY "Allow all operations on rate_limits" ON auth_magic_link_rate_limits;
  END IF;
END $$;

-- Drop functions (safe with IF EXISTS)
DROP FUNCTION IF EXISTS cleanup_expired_magic_links();
DROP FUNCTION IF EXISTS check_magic_link_rate_limit(TEXT, TEXT, INTEGER, INTEGER);

-- Drop tables (CASCADE will drop indexes and constraints)
DROP TABLE IF EXISTS auth_magic_links CASCADE;
DROP TABLE IF EXISTS auth_magic_link_rate_limits CASCADE;

-- Create magic links table
CREATE TABLE auth_magic_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash TEXT NOT NULL UNIQUE,
  identifier TEXT NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('email', 'phone')),
  used BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  used_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes
CREATE INDEX idx_magic_links_token_hash ON auth_magic_links(token_hash) WHERE NOT used;
CREATE INDEX idx_magic_links_identifier ON auth_magic_links(identifier);
CREATE INDEX idx_magic_links_expires ON auth_magic_links(expires_at);
CREATE INDEX idx_magic_links_created ON auth_magic_links(created_at DESC);

-- Enable RLS
ALTER TABLE auth_magic_links ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Allow all operations on auth_magic_links"
  ON auth_magic_links FOR ALL
  USING (true) WITH CHECK (true);

-- Add comments
COMMENT ON TABLE auth_magic_links IS 'Magic link tokens for passwordless authentication via email or phone';
COMMENT ON COLUMN auth_magic_links.token_hash IS 'Hashed token for security (never store plain text)';
COMMENT ON COLUMN auth_magic_links.identifier IS 'Email address or phone number (+E.164 format)';
COMMENT ON COLUMN auth_magic_links.method IS 'Authentication method: email or phone';
COMMENT ON COLUMN auth_magic_links.used IS 'One-time use flag';
COMMENT ON COLUMN auth_magic_links.expires_at IS 'Token expiration (15 minutes from creation)';
COMMENT ON COLUMN auth_magic_links.metadata IS 'Additional context: device_id, ip_address, user_agent';

-- Create cleanup function
CREATE FUNCTION cleanup_expired_magic_links()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM auth_magic_links
  WHERE expires_at < NOW() - INTERVAL '1 day';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_expired_magic_links IS 'Cleans up expired magic links older than 1 day';

-- Create rate limiting table
CREATE TABLE auth_magic_link_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('email', 'phone')),
  attempt_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  last_attempt TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(identifier, method)
);

-- Create indexes
CREATE INDEX idx_rate_limits_identifier ON auth_magic_link_rate_limits(identifier, method);
CREATE INDEX idx_rate_limits_window ON auth_magic_link_rate_limits(window_start);

-- Enable RLS
ALTER TABLE auth_magic_link_rate_limits ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Allow all operations on rate_limits"
  ON auth_magic_link_rate_limits FOR ALL
  USING (true) WITH CHECK (true);

COMMENT ON TABLE auth_magic_link_rate_limits IS 'Rate limiting for magic link sends (3 per hour per identifier)';

-- Create rate limit function
CREATE FUNCTION check_magic_link_rate_limit(
  p_identifier TEXT,
  p_method TEXT,
  p_max_attempts INTEGER DEFAULT 3,
  p_window_minutes INTEGER DEFAULT 60
)
RETURNS BOOLEAN AS $$
DECLARE
  v_record RECORD;
BEGIN
  SELECT * INTO v_record
  FROM auth_magic_link_rate_limits
  WHERE identifier = p_identifier AND method = p_method
  FOR UPDATE;
  
  IF NOT FOUND THEN
    INSERT INTO auth_magic_link_rate_limits (identifier, method)
    VALUES (p_identifier, p_method);
    RETURN TRUE;
  END IF;
  
  IF v_record.window_start < NOW() - (p_window_minutes || ' minutes')::INTERVAL THEN
    UPDATE auth_magic_link_rate_limits
    SET attempt_count = 1,
        window_start = NOW(),
        last_attempt = NOW()
    WHERE identifier = p_identifier AND method = p_method;
    RETURN TRUE;
  END IF;
  
  IF v_record.attempt_count < p_max_attempts THEN
    UPDATE auth_magic_link_rate_limits
    SET attempt_count = attempt_count + 1,
        last_attempt = NOW()
    WHERE identifier = p_identifier AND method = p_method;
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION check_magic_link_rate_limit IS 'Returns TRUE if request is allowed, FALSE if rate limited';

-- Grant permissions
GRANT EXECUTE ON FUNCTION check_magic_link_rate_limit TO authenticated, anon;
GRANT EXECUTE ON FUNCTION cleanup_expired_magic_links TO authenticated, anon;

-- Verify everything was created
DO $$ 
DECLARE
  table_count INTEGER;
  function_count INTEGER;
BEGIN
  -- Check tables
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_name IN ('auth_magic_links', 'auth_magic_link_rate_limits');
  
  -- Check functions
  SELECT COUNT(*) INTO function_count
  FROM pg_proc
  WHERE proname IN ('check_magic_link_rate_limit', 'cleanup_expired_magic_links');
  
  IF table_count = 2 AND function_count = 2 THEN
    RAISE NOTICE '✅ Magic links migration completed successfully!';
    RAISE NOTICE '   - Tables created: 2';
    RAISE NOTICE '   - Functions created: 2';
    RAISE NOTICE '   - Ready to use!';
  ELSE
    RAISE WARNING 'Migration incomplete: tables=%, functions=%', table_count, function_count;
  END IF;
END $$;
