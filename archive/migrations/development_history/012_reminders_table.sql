-- Migration: Create Reminders Table
-- Created: 2025-09-25
-- Purpose: Enable persistent reminder creation and management

-- Create reminders table with proper constraints and indexes
CREATE TABLE IF NOT EXISTS reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,                              -- Multi-tenant support
  vehicle_id UUID NOT NULL,
  garage_id_at_creation UUID,                  -- Track which garage rules created this
  title TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('registration','inspection','emissions','maintenance','other')) DEFAULT 'other',
  priority TEXT CHECK (priority IN ('low','medium','high')) DEFAULT 'medium',
  due_date DATE,
  due_miles INTEGER,
  status TEXT CHECK (status IN ('open','scheduled','done','dismissed')) DEFAULT 'open',
  source TEXT CHECK (source IN ('jurisdiction','user')) DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Foreign key constraints
  CONSTRAINT fk_reminders_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_reminders_vehicle ON reminders(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_reminders_due_date ON reminders(due_date);
CREATE INDEX IF NOT EXISTS idx_reminders_status ON reminders(status);
CREATE INDEX IF NOT EXISTS idx_reminders_category ON reminders(category);
CREATE INDEX IF NOT EXISTS idx_reminders_source ON reminders(source);
CREATE INDEX IF NOT EXISTS idx_reminders_tenant ON reminders(tenant_id) WHERE tenant_id IS NOT NULL;

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_reminders_vehicle_status ON reminders(vehicle_id, status);
CREATE INDEX IF NOT EXISTS idx_reminders_due_status ON reminders(due_date, status) WHERE status = 'open';

-- Comments for documentation
COMMENT ON TABLE reminders IS 'Vehicle maintenance and compliance reminders';
COMMENT ON COLUMN reminders.garage_id_at_creation IS 'Tracks which garage jurisdiction rules created this reminder';
COMMENT ON COLUMN reminders.source IS 'Source of reminder: jurisdiction (auto-created) or user (manual)';
COMMENT ON COLUMN reminders.category IS 'Type of reminder for filtering and organization';
COMMENT ON COLUMN reminders.due_miles IS 'Mileage-based due date (optional, alternative to due_date)';

-- Sample data for testing (optional)
-- INSERT INTO reminders (vehicle_id, title, description, category, priority, due_date, source) VALUES
-- ('9e412dca-7d8f-4410-a2b1-3d3042369a4d', 'Vehicle Registration Due', 'Annual registration renewal required', 'registration', 'high', '2025-12-01', 'jurisdiction');
