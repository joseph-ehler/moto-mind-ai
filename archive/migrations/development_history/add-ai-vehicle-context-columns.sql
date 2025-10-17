-- Migration: Add AI Vehicle Context Support
-- Purpose: Enable rich vehicle data context in AI conversations
-- Date: 2025-01-09

BEGIN;

-- ============================================================================
-- Phase 1: Context Tracking (Critical for AI integration)
-- ============================================================================

-- Add context references to track what data AI used
ALTER TABLE conversation_messages
ADD COLUMN IF NOT EXISTS context_references JSONB;

COMMENT ON COLUMN conversation_messages.context_references IS 
'References to data used in AI response: {
  "events": ["uuid1", "uuid2"],
  "event_count": 5,
  "date_range": {"from": "2024-01-01", "to": "2024-12-31"},
  "specs_categories": ["maintenance_intervals", "fluids_capacities"],
  "images": ["uuid1"],
  "summary": {
    "last_service_date": "2024-01-05",
    "last_service_type": "oil_change",
    "total_cost_ytd": 1234.50,
    "upcoming_maintenance": ["tire_rotation"]
  }
}';

-- Add context snapshot to threads (what vehicle data was available)
ALTER TABLE conversation_threads
ADD COLUMN IF NOT EXISTS context_snapshot JSONB;

COMMENT ON COLUMN conversation_threads.context_snapshot IS
'Vehicle data snapshot at conversation start: {
  "current_mileage": 45000,
  "last_service": {"date": "2024-01-05", "type": "oil_change", "miles": 43000},
  "upcoming_maintenance": [...],
  "total_events": 12,
  "total_spent_ytd": 1500.00,
  "vehicle_age_years": 5,
  "avg_annual_mileage": 9000
}';

-- Add model tracking for A/B testing and cost optimization
ALTER TABLE conversation_messages
ADD COLUMN IF NOT EXISTS model_used TEXT,
ADD COLUMN IF NOT EXISTS model_version TEXT;

COMMENT ON COLUMN conversation_messages.model_used IS 
'AI model used: gpt-4-turbo-preview, gpt-4o, claude-3-opus, claude-3-sonnet';

COMMENT ON COLUMN conversation_messages.model_version IS
'Specific model version/date for reproducibility';

-- ============================================================================
-- Phase 2: Performance Indexes (Critical for speed)
-- ============================================================================

-- Fast event lookups for AI context (last N services, cost totals, etc)
CREATE INDEX IF NOT EXISTS idx_vehicle_events_ai_context 
ON vehicle_events(vehicle_id, date DESC, deleted_at)
WHERE deleted_at IS NULL;

-- Include commonly queried columns for index-only scans
CREATE INDEX IF NOT EXISTS idx_vehicle_events_summary
ON vehicle_events(vehicle_id, type, date DESC)
INCLUDE (total_amount, miles, display_summary)
WHERE deleted_at IS NULL;

-- Fast thread retrieval for "previous conversations"
CREATE INDEX IF NOT EXISTS idx_conversation_threads_lookup
ON conversation_threads(vehicle_id, user_id, last_message_at DESC)
WHERE is_archived = FALSE OR is_archived IS NULL;

-- Fast message retrieval within thread
CREATE INDEX IF NOT EXISTS idx_conversation_messages_thread
ON conversation_messages(thread_id, created_at);

-- Fast lookup by role (for building context)
CREATE INDEX IF NOT EXISTS idx_conversation_messages_role
ON conversation_messages(thread_id, role);

-- ============================================================================
-- Phase 3: Analytics & Feedback (Nice to have)
-- ============================================================================

-- Better feedback tracking beyond simple rating
ALTER TABLE conversation_messages
ADD COLUMN IF NOT EXISTS was_helpful BOOLEAN,
ADD COLUMN IF NOT EXISTS resolved_issue BOOLEAN,
ADD COLUMN IF NOT EXISTS follow_up_needed BOOLEAN,
ADD COLUMN IF NOT EXISTS feedback_tags TEXT[];

COMMENT ON COLUMN conversation_messages.was_helpful IS 
'User indicated this response was helpful (thumbs up)';

COMMENT ON COLUMN conversation_messages.resolved_issue IS
'User indicated their question was fully answered';

COMMENT ON COLUMN conversation_messages.follow_up_needed IS
'User or AI indicated follow-up action needed';

COMMENT ON COLUMN conversation_messages.feedback_tags IS
'Structured feedback: accurate, too_vague, missing_context, wrong_data, outdated_info';

-- Thread-level analytics
ALTER TABLE conversation_threads
ADD COLUMN IF NOT EXISTS total_tokens INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS estimated_cost_usd NUMERIC(10,4) DEFAULT 0.00;

-- Trigger to maintain thread-level analytics
CREATE OR REPLACE FUNCTION update_thread_analytics()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversation_threads
  SET 
    total_tokens = (
      SELECT COALESCE(SUM(tokens_used), 0)
      FROM conversation_messages
      WHERE thread_id = NEW.thread_id
    ),
    estimated_cost_usd = (
      SELECT 
        CASE 
          WHEN NEW.model_used LIKE 'gpt-4%' THEN COALESCE(SUM(tokens_used), 0) * 0.00003
          WHEN NEW.model_used LIKE 'gpt-3.5%' THEN COALESCE(SUM(tokens_used), 0) * 0.000002
          WHEN NEW.model_used LIKE 'claude%' THEN COALESCE(SUM(tokens_used), 0) * 0.000015
          ELSE COALESCE(SUM(tokens_used), 0) * 0.00001 -- Default estimate
        END
      FROM conversation_messages
      WHERE thread_id = NEW.thread_id
    ),
    updated_at = NOW()
  WHERE id = NEW.thread_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS maintain_thread_analytics ON conversation_messages;
CREATE TRIGGER maintain_thread_analytics
AFTER INSERT OR UPDATE ON conversation_messages
FOR EACH ROW
EXECUTE FUNCTION update_thread_analytics();

-- ============================================================================
-- Verify migration
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Migration complete! New columns:';
  RAISE NOTICE '  - conversation_messages.context_references';
  RAISE NOTICE '  - conversation_messages.model_used';
  RAISE NOTICE '  - conversation_messages.model_version';
  RAISE NOTICE '  - conversation_messages.was_helpful';
  RAISE NOTICE '  - conversation_messages.resolved_issue';
  RAISE NOTICE '  - conversation_messages.follow_up_needed';
  RAISE NOTICE '  - conversation_messages.feedback_tags';
  RAISE NOTICE '  - conversation_threads.context_snapshot';
  RAISE NOTICE '  - conversation_threads.total_tokens';
  RAISE NOTICE '  - conversation_threads.estimated_cost_usd';
  RAISE NOTICE '';
  RAISE NOTICE 'Performance indexes created for fast AI queries.';
END $$;

COMMIT;
