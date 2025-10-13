-- Migration: Add Multi-Photo Event Support
-- Description: Junction table to link multiple photos to a single event
-- Priority: P0 - CRITICAL (blocks guided capture flows)

-- ============================================================================
-- 1. EVENT_PHOTOS JUNCTION TABLE
-- ============================================================================
-- Links multiple photos to a single event with sequence and step context
-- NOTE: Run 20250113_fix_vehicle_events_pk.sql FIRST if you get foreign key errors

CREATE TABLE IF NOT EXISTS event_photos (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign Keys
  event_id UUID NOT NULL REFERENCES vehicle_events(id) ON DELETE CASCADE,
  image_id UUID NOT NULL REFERENCES vehicle_images(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Display Order & Type
  sequence INTEGER NOT NULL,           -- 1, 2, 3, 4 (display order)
  step_id VARCHAR(50),                 -- 'receipt', 'odometer', 'gauge', 'additives'
  is_primary BOOLEAN DEFAULT FALSE,    -- Primary/hero photo for event
  
  -- Metadata
  caption TEXT,                        -- User-provided caption
  notes TEXT,                          -- Internal notes
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_event_image UNIQUE(event_id, image_id),     -- Can't link same photo twice
  CONSTRAINT unique_event_step UNIQUE(event_id, step_id),       -- Can't have duplicate steps
  CONSTRAINT positive_sequence CHECK(sequence > 0)
);

-- ============================================================================
-- 2. INDEXES
-- ============================================================================

CREATE INDEX idx_event_photos_event_id ON event_photos(event_id);
CREATE INDEX idx_event_photos_image_id ON event_photos(image_id);
CREATE INDEX idx_event_photos_tenant_id ON event_photos(tenant_id);
CREATE INDEX idx_event_photos_step_id ON event_photos(step_id);
CREATE INDEX idx_event_photos_sequence ON event_photos(event_id, sequence);
CREATE INDEX idx_event_photos_primary ON event_photos(event_id, is_primary) WHERE is_primary = TRUE;

-- ============================================================================
-- 3. COMMENTS
-- ============================================================================

COMMENT ON TABLE event_photos IS 'Junction table linking vehicle events to multiple photos';
COMMENT ON COLUMN event_photos.event_id IS 'The event this photo belongs to';
COMMENT ON COLUMN event_photos.image_id IS 'The photo being linked';
COMMENT ON COLUMN event_photos.sequence IS 'Display order of photos within event (1 = first)';
COMMENT ON COLUMN event_photos.step_id IS 'Capture flow step: receipt, odometer, gauge, additives, etc.';
COMMENT ON COLUMN event_photos.is_primary IS 'Primary/hero photo for event (shows in cards, previews)';

-- ============================================================================
-- 4. TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_event_photos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER event_photos_updated_at
BEFORE UPDATE ON event_photos
FOR EACH ROW
EXECUTE FUNCTION update_event_photos_updated_at();

-- Ensure tenant_id matches event's tenant_id
CREATE OR REPLACE FUNCTION validate_event_photos_tenant()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tenant_id != (SELECT tenant_id FROM vehicle_events WHERE id = NEW.event_id) THEN
    RAISE EXCEPTION 'event_photos.tenant_id must match vehicle_events.tenant_id';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER event_photos_tenant_validation
BEFORE INSERT OR UPDATE ON event_photos
FOR EACH ROW
EXECUTE FUNCTION validate_event_photos_tenant();

-- ============================================================================
-- 5. RLS POLICIES
-- ============================================================================

ALTER TABLE event_photos ENABLE ROW LEVEL SECURITY;

-- Users can only see photos for their tenant
CREATE POLICY event_photos_tenant_isolation ON event_photos
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);

-- ============================================================================
-- 6. GRANTS
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON event_photos TO authenticated;
-- Note: UUID primary keys don't use sequences, so no sequence grant needed

-- ============================================================================
-- 7. HELPER FUNCTIONS
-- ============================================================================

-- Get all photos for an event in sequence order
CREATE OR REPLACE FUNCTION get_event_photos(p_event_id UUID)
RETURNS TABLE (
  photo_id UUID,
  sequence INTEGER,
  step_id VARCHAR(50),
  is_primary BOOLEAN,
  public_url TEXT,
  storage_path TEXT,
  quality_score INTEGER,
  captured_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    vi.id,
    ep.sequence,
    ep.step_id,
    ep.is_primary,
    vi.public_url,
    vi.storage_path,
    pm.quality_score,
    pm.captured_at
  FROM event_photos ep
  JOIN vehicle_images vi ON ep.image_id = vi.id
  LEFT JOIN photo_metadata pm ON vi.id = pm.image_id
  WHERE ep.event_id = p_event_id
  ORDER BY ep.sequence;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_event_photos IS 'Returns all photos for an event in display order';

-- Get primary photo for an event
CREATE OR REPLACE FUNCTION get_event_primary_photo(p_event_id UUID)
RETURNS TABLE (
  photo_id UUID,
  public_url TEXT,
  storage_path TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    vi.id,
    vi.public_url,
    vi.storage_path
  FROM event_photos ep
  JOIN vehicle_images vi ON ep.image_id = vi.id
  WHERE ep.event_id = p_event_id
    AND ep.is_primary = TRUE
  LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_event_primary_photo IS 'Returns the primary/hero photo for an event';
