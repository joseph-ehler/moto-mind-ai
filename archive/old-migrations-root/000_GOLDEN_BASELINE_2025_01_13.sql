-- ============================================================================
-- MOTOMIND GOLDEN BASELINE SCHEMA
-- ============================================================================
-- Created: 2025-01-13
-- Purpose: Production schema baseline after dev iteration (migrations 001-140)
-- 
-- This represents the CURRENT STATE of production after iterative development.
-- All future migrations build on this baseline.
--
-- Database: 18 tables, 4 views, 150+ indexes, ~3.1 MB
-- ============================================================================

-- NOTE: This migration is DOCUMENTATION ONLY for existing production database.
-- It captures the state after all previous migrations have been applied.
--
-- To apply to a fresh database, use the full schema dump from Supabase.
-- This file serves as a reference point for future migrations.

-- ============================================================================
-- SCHEMA SUMMARY
-- ============================================================================

-- Core Tables:
-- - tenants (multi-tenancy)
-- - profiles (user profiles)
-- - garages (garage management with soft deletes)
-- - vehicles (vehicle master data)
-- - vehicle_spec_enhancements (vehicle specs enrichment)

-- Events & Logging:
-- - vehicle_events (main event log: fuel, maintenance, etc.)
-- - vehicle_event_audit_logs (edit history)

-- Images & Photos:
-- - vehicle_images (photos with AI metadata)
-- - photo_metadata (capture-specific metadata)
-- - event_photos (multi-photo support)

-- Capture Flow:
-- - capture_sessions (photo capture flow tracking)

-- AI Chat:
-- - conversation_threads
-- - conversation_messages

-- Location:
-- - location_corrections

-- Preferences:
-- - user_maintenance_preferences

-- Vision AI:
-- - vision_metrics
-- - vision_accuracy

-- System:
-- - schema_migrations

-- Views:
-- - active_garages
-- - capture_session_analytics
-- - capture_abandonment_analysis
-- - location_correction_stats

-- ============================================================================
-- BASELINE MARKER
-- ============================================================================

INSERT INTO schema_migrations (filename, applied_at)
VALUES ('000_GOLDEN_BASELINE_2025_01_13.sql', NOW())
ON CONFLICT (filename) DO NOTHING;

-- ============================================================================
-- END OF BASELINE
-- ============================================================================
-- All future migrations (001+) will reference this baseline
