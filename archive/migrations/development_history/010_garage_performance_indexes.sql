-- Migration: Add performance indexes for garage system
-- Created: 2025-09-25
-- Purpose: Optimize garage-vehicle relationship queries

-- Index for vehicle garage_id lookups (critical for counts and filtering)
CREATE INDEX IF NOT EXISTS idx_vehicles_garage_id ON vehicles(garage_id);

-- Index for non-deleted vehicles (used in count queries)
CREATE INDEX IF NOT EXISTS idx_vehicles_deleted_at ON vehicles(deleted_at) WHERE deleted_at IS NULL;

-- Composite index for garage_id + deleted_at (optimal for count queries)
CREATE INDEX IF NOT EXISTS idx_vehicles_garage_active ON vehicles(garage_id, deleted_at) WHERE deleted_at IS NULL;

-- Index for garage default lookups
CREATE INDEX IF NOT EXISTS idx_garages_default ON garages(is_default) WHERE is_default = true;

-- Index for garage creation order
CREATE INDEX IF NOT EXISTS idx_garages_created_at ON garages(created_at);

-- Add foreign key constraint for data integrity
-- This ensures vehicles can't reference non-existent garages
ALTER TABLE vehicles 
  ADD CONSTRAINT fk_vehicles_garage 
  FOREIGN KEY (garage_id) REFERENCES garages(id) ON DELETE SET NULL;

-- Add comment for documentation
COMMENT ON INDEX idx_vehicles_garage_id IS 'Optimizes garage vehicle count queries and filtering';
COMMENT ON INDEX idx_vehicles_garage_active IS 'Optimizes active vehicle counts per garage';
COMMENT ON CONSTRAINT fk_vehicles_garage ON vehicles IS 'Ensures referential integrity between vehicles and garages';
