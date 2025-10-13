-- Migration: Add Capture Metadata Support
-- Description: Stores comprehensive capture metadata for every photo (GPS, quality, compression, behavior)
-- Priority: P0 - CRITICAL (blocks capture system integration)

-- ============================================================================
-- 1. PHOTO METADATA TABLE
-- ============================================================================
-- Stores all capture metadata that the capture system generates

CREATE TABLE IF NOT EXISTS photo_metadata (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign Keys
  image_id UUID NOT NULL REFERENCES vehicle_images(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Core Capture Info
  captured_at TIMESTAMPTZ NOT NULL,
  capture_method VARCHAR(20) NOT NULL CHECK (capture_method IN ('camera', 'upload')),
  event_type VARCHAR(50),              -- 'fuel' | 'service' | 'damage' | 'parking' | etc.
  step_id VARCHAR(50),                 -- 'receipt' | 'odometer' | 'gauge' | 'additives'
  
  -- GPS Location (captured at time of photo)
  gps_latitude DECIMAL(10,8),          -- -90 to 90
  gps_longitude DECIMAL(11,8),         -- -180 to 180
  gps_accuracy DECIMAL(10,2),          -- Accuracy in meters
  gps_timestamp TIMESTAMPTZ,           -- When GPS was captured
  
  -- Photo Quality (from quality analysis system)
  quality_score INTEGER CHECK (quality_score >= 0 AND quality_score <= 100),
  quality_issues JSONB,                -- ['blur', 'glare', 'too_dark', 'skewed', 'obstructed', 'missing_content']
  
  -- Compression Stats
  original_size_bytes BIGINT,
  compressed_size_bytes BIGINT,
  compression_ratio DECIMAL(5,2),      -- e.g., 5.6 (5.6x compression)
  output_format VARCHAR(20),           -- 'image/jpeg' | 'image/webp'
  
  -- Image Resolution
  width INTEGER,
  height INTEGER,
  aspect_ratio DECIMAL(4,2),           -- e.g., 1.78 (16:9)
  
  -- Camera Settings
  flash_mode VARCHAR(10) CHECK (flash_mode IN ('auto', 'on', 'off')),
  facing_mode VARCHAR(20),             -- 'environment' (back) | 'user' (front)
  
  -- User Behavior Tracking
  retake_count INTEGER DEFAULT 0,      -- How many times user retook this photo
  capture_duration_ms INTEGER,         -- Time from camera open to capture
  quality_warnings_shown TEXT[],       -- Warnings shown before capture
  
  -- Device Info
  platform VARCHAR(20),                -- 'iOS' | 'Android' | 'Web'
  user_agent TEXT,
  
  -- HEIC/HEIF Conversion (if applicable)
  was_heic_converted BOOLEAN DEFAULT FALSE,
  heic_original_size_bytes BIGINT,     -- Size before HEIC→JPEG conversion
  
  -- Photo Editing (if applicable)
  was_edited BOOLEAN DEFAULT FALSE,
  edit_operations JSONB,               -- ['crop', 'rotate', 'brightness', 'blur']
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 2. INDEXES
-- ============================================================================

CREATE INDEX idx_photo_metadata_image_id ON photo_metadata(image_id);
CREATE INDEX idx_photo_metadata_tenant_id ON photo_metadata(tenant_id);
CREATE INDEX idx_photo_metadata_captured_at ON photo_metadata(captured_at);
CREATE INDEX idx_photo_metadata_event_type ON photo_metadata(event_type);
CREATE INDEX idx_photo_metadata_step_id ON photo_metadata(step_id);
CREATE INDEX idx_photo_metadata_quality_score ON photo_metadata(quality_score);
CREATE INDEX idx_photo_metadata_gps_location ON photo_metadata(gps_latitude, gps_longitude) WHERE gps_latitude IS NOT NULL;
CREATE INDEX idx_photo_metadata_capture_method ON photo_metadata(capture_method);

-- ============================================================================
-- 3. COMMENTS
-- ============================================================================

COMMENT ON TABLE photo_metadata IS 'Comprehensive capture metadata for every photo taken through the capture system';
COMMENT ON COLUMN photo_metadata.image_id IS 'Links to vehicle_images table';
COMMENT ON COLUMN photo_metadata.captured_at IS 'Exact timestamp when photo was captured';
COMMENT ON COLUMN photo_metadata.capture_method IS 'How photo was captured: camera (native) or upload (file picker)';
COMMENT ON COLUMN photo_metadata.event_type IS 'Type of event: fuel, service, damage, parking, document, etc.';
COMMENT ON COLUMN photo_metadata.step_id IS 'Capture flow step: receipt, odometer, gauge, additives, etc.';
COMMENT ON COLUMN photo_metadata.gps_latitude IS 'GPS latitude (-90 to 90) at time of capture';
COMMENT ON COLUMN photo_metadata.gps_longitude IS 'GPS longitude (-180 to 180) at time of capture';
COMMENT ON COLUMN photo_metadata.gps_accuracy IS 'GPS accuracy in meters (lower is better)';
COMMENT ON COLUMN photo_metadata.quality_score IS 'Overall quality score 0-100 from 6 detection systems (blur, glare, darkness, skew, obstruction, completeness)';
COMMENT ON COLUMN photo_metadata.quality_issues IS 'Array of detected quality issues from analysis';
COMMENT ON COLUMN photo_metadata.original_size_bytes IS 'Original photo size before compression';
COMMENT ON COLUMN photo_metadata.compressed_size_bytes IS 'Final compressed size (what gets uploaded)';
COMMENT ON COLUMN photo_metadata.compression_ratio IS 'Compression ratio (e.g., 5.6 means 5.6x smaller)';
COMMENT ON COLUMN photo_metadata.output_format IS 'Output format: image/webp (modern browsers) or image/jpeg (fallback)';
COMMENT ON COLUMN photo_metadata.flash_mode IS 'Flash setting used: auto, on, off';
COMMENT ON COLUMN photo_metadata.retake_count IS 'Number of times user retook this photo (0 = captured first try)';
COMMENT ON COLUMN photo_metadata.capture_duration_ms IS 'Time in milliseconds from camera open to capture (measures UX friction)';
COMMENT ON COLUMN photo_metadata.quality_warnings_shown IS 'Array of quality warnings shown to user before capture';
COMMENT ON COLUMN photo_metadata.platform IS 'Device platform: iOS, Android, Web';
COMMENT ON COLUMN photo_metadata.was_heic_converted IS 'Whether photo was converted from HEIC/HEIF to JPEG';
COMMENT ON COLUMN photo_metadata.was_edited IS 'Whether photo was edited (crop, rotate, brightness, blur)';
COMMENT ON COLUMN photo_metadata.edit_operations IS 'Array of edit operations performed on photo';

-- ============================================================================
-- 4. TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_photo_metadata_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER photo_metadata_updated_at
BEFORE UPDATE ON photo_metadata
FOR EACH ROW
EXECUTE FUNCTION update_photo_metadata_updated_at();

-- ============================================================================
-- 5. RLS POLICIES
-- ============================================================================

ALTER TABLE photo_metadata ENABLE ROW LEVEL SECURITY;

-- Users can only see metadata for their tenant
CREATE POLICY photo_metadata_tenant_isolation ON photo_metadata
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);

-- ============================================================================
-- 6. GRANTS
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON photo_metadata TO authenticated;
-- Note: UUID primary keys don't use sequences, so no sequence grant needed
