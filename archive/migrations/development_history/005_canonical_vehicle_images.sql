-- Canonical Vehicle Images System
-- Generates and caches studio-style vehicle images with year-range consolidation

-- Vehicle image assets table
CREATE TABLE IF NOT EXISTS vehicle_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_key TEXT NOT NULL UNIQUE, -- "2012-2015|honda|civic|sedan|neutral"
  
  -- Image storage (Supabase Storage)
  storage_url TEXT NOT NULL,
  storage_bucket TEXT DEFAULT 'vehicle-images',
  storage_path TEXT NOT NULL,
  
  -- Multiple angles support
  angles JSONB DEFAULT '{}', -- { "front_3q": "url", "side": "url", "rear_3q": "url", "interior": "url" }
  
  -- Generation metadata
  prompt JSONB NOT NULL, -- Full prompt used for generation
  gen_model TEXT DEFAULT 'dall-e-3', -- AI model used
  gen_seed TEXT, -- Seed for reproducibility (if supported)
  
  -- Quality assurance
  verified BOOLEAN DEFAULT false,
  verification_result JSONB, -- Vision model QA results
  verification_attempts INTEGER DEFAULT 0,
  
  -- Performance metrics
  generation_cost_cents INTEGER, -- Track costs
  generation_time_ms INTEGER,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_vehicle_images_canonical_key ON vehicle_images(canonical_key);
CREATE INDEX IF NOT EXISTS idx_vehicle_images_verified ON vehicle_images(verified);
CREATE INDEX IF NOT EXISTS idx_vehicle_images_created_at ON vehicle_images(created_at);

-- Vehicle generation mapping rules
CREATE TABLE IF NOT EXISTS vehicle_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Vehicle identification
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  body_style TEXT NOT NULL, -- "sedan", "hatchback", "suv", "truck", "coupe", "wagon"
  
  -- Generation grouping
  generation_name TEXT NOT NULL, -- "10th Generation", "Mk7", "F-150 13th Gen"
  year_start INTEGER NOT NULL,
  year_end INTEGER NOT NULL,
  
  -- Regional variants
  region TEXT DEFAULT 'USDM', -- "USDM", "EUDM", "JDM"
  
  -- Canonical key components
  canonical_generation TEXT NOT NULL, -- "2012-2015", "2016-2020"
  
  -- Metadata
  notes TEXT, -- "Major facelift in 2014", "Body style discontinued 2017"
  source TEXT, -- "wikipedia", "edmunds", "manual"
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure no overlapping years for same make/model/body
  UNIQUE (make, model, body_style, year_start, year_end, region)
);

-- Indexes for generation lookup
CREATE INDEX IF NOT EXISTS idx_vehicle_generations_lookup 
  ON vehicle_generations(make, model, body_style, year_start, year_end);
CREATE INDEX IF NOT EXISTS idx_vehicle_generations_canonical 
  ON vehicle_generations(make, model, body_style, canonical_generation);

-- Image generation queue for async processing
CREATE TABLE IF NOT EXISTS image_generation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Generation request
  canonical_key TEXT NOT NULL,
  priority INTEGER DEFAULT 5, -- 1=highest, 10=lowest
  
  -- Request details
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  body_style TEXT NOT NULL,
  generation TEXT NOT NULL,
  color TEXT DEFAULT 'neutral_silver',
  angles TEXT[] DEFAULT ARRAY['front_3q'], -- Which angles to generate
  
  -- Processing state
  status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  
  -- Results
  error_message TEXT,
  processing_started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Metadata
  requested_by UUID REFERENCES users(id),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for queue processing
CREATE INDEX IF NOT EXISTS idx_image_queue_status_priority 
  ON image_generation_queue(status, priority, created_at);
CREATE INDEX IF NOT EXISTS idx_image_queue_canonical_key 
  ON image_generation_queue(canonical_key);

-- RLS policies
ALTER TABLE vehicle_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE image_generation_queue ENABLE ROW LEVEL SECURITY;

-- Vehicle images are globally readable but only admins can create
CREATE POLICY "Vehicle images are globally readable" ON vehicle_images
  FOR SELECT USING (true);

CREATE POLICY "Only admins can manage vehicle images" ON vehicle_images
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM memberships m 
      WHERE m.user_id = auth.uid() 
      AND m.role IN ('owner', 'manager')
    )
  );

-- Generation rules are globally readable
CREATE POLICY "Generation rules are globally readable" ON vehicle_generations
  FOR SELECT USING (true);

-- Queue access by tenant
CREATE POLICY "Users can manage queue items in their tenant" ON image_generation_queue
  FOR ALL USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- Trigger for updated_at
CREATE TRIGGER update_vehicle_images_updated_at 
  BEFORE UPDATE ON vehicle_images 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicle_generations_updated_at 
  BEFORE UPDATE ON vehicle_generations 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_image_generation_queue_updated_at 
  BEFORE UPDATE ON image_generation_queue 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample generation mapping data for common vehicles
INSERT INTO vehicle_generations (make, model, body_style, generation_name, year_start, year_end, canonical_generation, notes) VALUES
-- Honda Civic generations
('honda', 'civic', 'sedan', '9th Generation', 2012, 2015, '2012-2015', 'Major redesign in 2012'),
('honda', 'civic', 'sedan', '10th Generation', 2016, 2020, '2016-2020', 'Completely new platform'),
('honda', 'civic', 'sedan', '11th Generation', 2022, 2024, '2022-2024', 'Current generation'),
('honda', 'civic', 'hatchback', '10th Generation', 2017, 2020, '2017-2020', 'Hatchback returned to US market'),
('honda', 'civic', 'hatchback', '11th Generation', 2022, 2024, '2022-2024', 'Current generation'),

-- Ford F-150 generations  
('ford', 'f-150', 'truck', '12th Generation', 2009, 2014, '2009-2014', 'Pre-aluminum body'),
('ford', 'f-150', 'truck', '13th Generation', 2015, 2020, '2015-2020', 'Aluminum body introduction'),
('ford', 'f-150', 'truck', '14th Generation', 2021, 2024, '2021-2024', 'Current generation'),

-- Toyota Camry generations
('toyota', 'camry', 'sedan', '7th Generation (XV50)', 2012, 2017, '2012-2017', 'Longer wheelbase'),
('toyota', 'camry', 'sedan', '8th Generation (XV70)', 2018, 2024, '2018-2024', 'TNGA platform'),

-- Chevrolet Silverado generations
('chevrolet', 'silverado', 'truck', '3rd Generation', 2014, 2018, '2014-2018', 'GMT K2XX platform'),
('chevrolet', 'silverado', 'truck', '4th Generation', 2019, 2024, '2019-2024', 'T1XX platform'),

-- Tesla Model 3 (minimal changes)
('tesla', 'model 3', 'sedan', '1st Generation', 2017, 2020, '2017-2020', 'Original design'),
('tesla', 'model 3', 'sedan', '1st Generation Refresh', 2021, 2024, '2021-2024', 'Minor interior updates')

ON CONFLICT (make, model, body_style, year_start, year_end, region) DO NOTHING;

-- Comments for documentation
COMMENT ON TABLE vehicle_images IS 'Canonical vehicle images generated by AI, cached and reused across fleet';
COMMENT ON TABLE vehicle_generations IS 'Vehicle generation mapping rules for year-range consolidation';
COMMENT ON TABLE image_generation_queue IS 'Async queue for generating vehicle images on-demand';

COMMENT ON COLUMN vehicle_images.canonical_key IS 'Normalized key: generation|make|model|bodystyle|color';
COMMENT ON COLUMN vehicle_generations.canonical_generation IS 'Year range for grouping (e.g. 2012-2015)';
COMMENT ON COLUMN image_generation_queue.priority IS 'Processing priority: 1=highest, 10=lowest';
