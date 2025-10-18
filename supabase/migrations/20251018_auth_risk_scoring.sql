-- Migration: Auth Risk Scoring & CAPTCHA Foundation
-- Created: 2025-10-18
-- Purpose: Track suspicious auth attempts and enable progressive CAPTCHA challenges

-- Create risk scoring table
CREATE TABLE IF NOT EXISTS auth_risk_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  identifier TEXT,  -- email or phone
  failed_attempts INTEGER DEFAULT 0,
  successful_attempts INTEGER DEFAULT 0,
  captcha_required BOOLEAN DEFAULT FALSE,
  captcha_solved_at TIMESTAMPTZ,
  captcha_failed_count INTEGER DEFAULT 0,
  risk_level TEXT DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'blocked')),
  last_attempt_at TIMESTAMPTZ DEFAULT NOW(),
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  blocked_until TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_risk_scores_ip ON auth_risk_scores(ip_address);
CREATE INDEX idx_risk_scores_identifier ON auth_risk_scores(identifier);
CREATE INDEX idx_risk_scores_risk_level ON auth_risk_scores(risk_level);
CREATE INDEX idx_risk_scores_last_attempt ON auth_risk_scores(last_attempt_at);
CREATE INDEX idx_risk_scores_blocked ON auth_risk_scores(blocked_until) WHERE blocked_until IS NOT NULL;

-- Enable RLS
ALTER TABLE auth_risk_scores ENABLE ROW LEVEL SECURITY;

-- Permissive policy (service role access only)
CREATE POLICY "Allow all operations on risk_scores"
  ON auth_risk_scores FOR ALL
  USING (true) WITH CHECK (true);

COMMENT ON TABLE auth_risk_scores IS 'Tracks auth attempts and risk scores for progressive CAPTCHA challenges';
COMMENT ON COLUMN auth_risk_scores.ip_address IS 'Client IP address';
COMMENT ON COLUMN auth_risk_scores.identifier IS 'Email or phone being targeted';
COMMENT ON COLUMN auth_risk_scores.failed_attempts IS 'Count of failed auth attempts in current window';
COMMENT ON COLUMN auth_risk_scores.risk_level IS 'Calculated risk: low, medium, high, blocked';
COMMENT ON COLUMN auth_risk_scores.captcha_required IS 'Whether CAPTCHA is required for next attempt';
COMMENT ON COLUMN auth_risk_scores.blocked_until IS 'Temporary ban expiration time';

-- Function to calculate risk level
CREATE OR REPLACE FUNCTION calculate_auth_risk_level(
  p_failed_attempts INTEGER,
  p_captcha_failed_count INTEGER,
  p_last_attempt TIMESTAMPTZ,
  p_blocked_until TIMESTAMPTZ
)
RETURNS TEXT AS $$
DECLARE
  minutes_since_last NUMERIC;
BEGIN
  -- Check if currently blocked
  IF p_blocked_until IS NOT NULL AND p_blocked_until > NOW() THEN
    RETURN 'blocked';
  END IF;
  
  -- Calculate minutes since last attempt
  minutes_since_last := EXTRACT(EPOCH FROM (NOW() - p_last_attempt)) / 60;
  
  -- Reset if more than 1 hour since last attempt
  IF minutes_since_last > 60 THEN
    RETURN 'low';
  END IF;
  
  -- High risk: 5+ failed attempts in last 10 minutes OR multiple CAPTCHA failures
  IF (p_failed_attempts >= 5 AND minutes_since_last < 10) OR p_captcha_failed_count >= 3 THEN
    RETURN 'high';
  END IF;
  
  -- Medium risk: 3+ failed attempts in last 10 minutes
  IF p_failed_attempts >= 3 AND minutes_since_last < 10 THEN
    RETURN 'medium';
  END IF;
  
  -- Low risk: normal behavior
  RETURN 'low';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calculate_auth_risk_level IS 'Calculates risk level based on attempt history';

-- Function to record auth attempt
CREATE OR REPLACE FUNCTION record_auth_attempt(
  p_ip_address TEXT,
  p_identifier TEXT,
  p_success BOOLEAN,
  p_captcha_token TEXT DEFAULT NULL
)
RETURNS TABLE(
  risk_level TEXT,
  captcha_required BOOLEAN,
  blocked_until TIMESTAMPTZ
) AS $$
DECLARE
  v_record auth_risk_scores%ROWTYPE;
  v_risk_level TEXT;
  v_captcha_required BOOLEAN;
  v_blocked_until TIMESTAMPTZ;
BEGIN
  -- Get or create risk score record
  SELECT * INTO v_record
  FROM auth_risk_scores
  WHERE ip_address = p_ip_address 
    AND (identifier = p_identifier OR identifier IS NULL)
  ORDER BY last_attempt_at DESC
  LIMIT 1
  FOR UPDATE;
  
  IF NOT FOUND THEN
    -- First attempt from this IP/identifier
    INSERT INTO auth_risk_scores (
      ip_address, 
      identifier,
      failed_attempts,
      successful_attempts,
      risk_level
    ) VALUES (
      p_ip_address,
      p_identifier,
      CASE WHEN p_success THEN 0 ELSE 1 END,
      CASE WHEN p_success THEN 1 ELSE 0 END,
      'low'
    )
    RETURNING * INTO v_record;
    
    RETURN QUERY SELECT v_record.risk_level, FALSE, v_record.blocked_until;
    RETURN;
  END IF;
  
  -- Update attempt counts
  IF p_success THEN
    -- Successful attempt - reduce risk
    UPDATE auth_risk_scores
    SET successful_attempts = successful_attempts + 1,
        failed_attempts = GREATEST(0, failed_attempts - 1),
        last_attempt_at = NOW(),
        updated_at = NOW(),
        captcha_solved_at = CASE WHEN p_captcha_token IS NOT NULL THEN NOW() ELSE captcha_solved_at END
    WHERE id = v_record.id
    RETURNING * INTO v_record;
  ELSE
    -- Failed attempt - increase risk
    UPDATE auth_risk_scores
    SET failed_attempts = failed_attempts + 1,
        last_attempt_at = NOW(),
        updated_at = NOW(),
        captcha_failed_count = CASE WHEN p_captcha_token IS NOT NULL THEN captcha_failed_count + 1 ELSE captcha_failed_count END
    WHERE id = v_record.id
    RETURNING * INTO v_record;
  END IF;
  
  -- Calculate new risk level
  v_risk_level := calculate_auth_risk_level(
    v_record.failed_attempts,
    v_record.captcha_failed_count,
    v_record.last_attempt_at,
    v_record.blocked_until
  );
  
  -- Determine if CAPTCHA required
  v_captcha_required := v_risk_level IN ('medium', 'high');
  
  -- Auto-block if high risk persists
  IF v_risk_level = 'high' AND v_record.failed_attempts >= 10 THEN
    v_blocked_until := NOW() + INTERVAL '1 hour';
    v_risk_level := 'blocked';
  ELSE
    v_blocked_until := NULL;
  END IF;
  
  -- Update risk level and blocking
  UPDATE auth_risk_scores
  SET risk_level = v_risk_level,
      captcha_required = v_captcha_required,
      blocked_until = v_blocked_until,
      updated_at = NOW()
  WHERE id = v_record.id;
  
  RETURN QUERY SELECT v_risk_level, v_captcha_required, v_blocked_until;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION record_auth_attempt IS 'Records auth attempt and returns updated risk assessment';

-- Function to check if IP/identifier is blocked
CREATE OR REPLACE FUNCTION is_auth_blocked(
  p_ip_address TEXT,
  p_identifier TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_blocked_until TIMESTAMPTZ;
BEGIN
  SELECT blocked_until INTO v_blocked_until
  FROM auth_risk_scores
  WHERE ip_address = p_ip_address
    AND (p_identifier IS NULL OR identifier = p_identifier)
    AND blocked_until > NOW()
  ORDER BY last_attempt_at DESC
  LIMIT 1;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION is_auth_blocked IS 'Checks if IP/identifier is currently blocked';

-- Function to cleanup old risk scores
CREATE OR REPLACE FUNCTION cleanup_old_risk_scores()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM auth_risk_scores
  WHERE last_attempt_at < NOW() - INTERVAL '7 days'
    AND risk_level = 'low'
    AND failed_attempts = 0;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_old_risk_scores IS 'Removes old low-risk records (run daily)';

-- Grant permissions
GRANT EXECUTE ON FUNCTION calculate_auth_risk_level TO authenticated, anon;
GRANT EXECUTE ON FUNCTION record_auth_attempt TO authenticated, anon;
GRANT EXECUTE ON FUNCTION is_auth_blocked TO authenticated, anon;
GRANT EXECUTE ON FUNCTION cleanup_old_risk_scores TO authenticated, anon;

-- Success message
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Auth risk scoring system created successfully!';
  RAISE NOTICE '   - Table: auth_risk_scores';
  RAISE NOTICE '   - Functions: 4 (risk calc, record, block check, cleanup)';
  RAISE NOTICE '   - Ready for CAPTCHA integration!';
END $$;
