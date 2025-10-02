-- MotoMindAI: Vehicle Images RLS Policies (Simplified)
-- Add basic RLS policies for vehicle_images table

-- Drop existing policies if they exist (in case of re-run)
DROP POLICY IF EXISTS "Service role can access all vehicle images" ON vehicle_images;
DROP POLICY IF EXISTS "Allow all access to vehicle images" ON vehicle_images;

-- Policy: Allow service role to access all records (for API operations)
CREATE POLICY "Service role can access all vehicle images" ON vehicle_images
  FOR ALL USING (true);

-- Policy: Allow all authenticated access for now (simplified for development)
CREATE POLICY "Allow all access to vehicle images" ON vehicle_images
  FOR ALL USING (true);
