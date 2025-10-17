-- ============================================================================
-- EMAIL VERIFICATION
-- ============================================================================
-- Created: 2025-10-16
-- Purpose: Add email verification support to user_tenants table
--
-- Changes:
--   - Add email_verified column (boolean, default false)
--   - Add email_verified_at timestamp
--   - Add index for faster lookups
-- ============================================================================

-- Add email_verified column
ALTER TABLE user_tenants 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;

-- Add index for verification queries
CREATE INDEX IF NOT EXISTS idx_user_tenants_email_verified 
  ON user_tenants(email_verified);

-- Add comment
COMMENT ON COLUMN user_tenants.email_verified IS 'Whether the user has verified their email address';
COMMENT ON COLUMN user_tenants.email_verified_at IS 'Timestamp when email was verified';

-- Create function to set verification timestamp
CREATE OR REPLACE FUNCTION set_email_verified_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email_verified = true AND OLD.email_verified = false THEN
    NEW.email_verified_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_set_email_verified_at ON user_tenants;
CREATE TRIGGER trigger_set_email_verified_at
  BEFORE UPDATE ON user_tenants
  FOR EACH ROW
  EXECUTE FUNCTION set_email_verified_at();

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
  -- Verify columns exist
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'user_tenants' 
    AND column_name = 'email_verified'
  ) THEN
    RAISE NOTICE '✅ email_verified column added';
  ELSE
    RAISE EXCEPTION '❌ email_verified column creation failed';
  END IF;
  
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'user_tenants' 
    AND column_name = 'email_verified_at'
  ) THEN
    RAISE NOTICE '✅ email_verified_at column added';
  ELSE
    RAISE EXCEPTION '❌ email_verified_at column creation failed';
  END IF;
  
  RAISE NOTICE '✅ Email verification setup complete';
END $$;
