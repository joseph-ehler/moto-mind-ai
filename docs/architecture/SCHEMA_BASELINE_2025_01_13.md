# 🎯 MotoMind Schema Baseline (2025-01-13)

**Status:** ✅ Production schema reconciled and documented  
**Purpose:** Clean baseline for Phase 2-6 development  
**Migration:** `000_GOLDEN_BASELINE_2025_01_13.sql`

---

## **📊 CURRENT PRODUCTION SCHEMA**

### **Overview**
- **Total Tables:** 18
- **Views:** 4 (analytics)
- **Indexes:** 150+
- **Database Size:** ~3.1 MB
- **Largest Table:** `vehicle_events` (856 KB)

### **Core Business Tables**

#### **Multi-tenancy & Users**
- `tenants` - Tenant isolation
- `profiles` - User profiles

#### **Garage & Vehicle Management**
- `garages` - Garage management (soft delete support)
- `vehicles` - Vehicle master data
- `vehicle_spec_enhancements` - Vehicle specs enrichment

#### **Events & Logging**
- `vehicle_events` - Main event log (fuel, maintenance, damage, etc.)
  - 856 KB (largest table)
  - Comprehensive indexing for timeline, search, analytics
  - Full audit trail support
- `vehicle_event_audit_logs` - Edit history tracking

#### **Images & Photos**
- `vehicle_images` - Photos with AI metadata (280 KB)
  - AI-powered categorization
  - Damage detection
  - Parts identification
- `photo_metadata` - Capture-specific metadata (176 KB)
  - GPS data
  - Quality scores
  - Device information
- `event_photos` - Multi-photo event support (176 KB)

#### **Capture Flow Tracking**
- `capture_sessions` - Photo capture flow analytics (208 KB)
  - Completion tracking
  - Abandonment analysis
  - Performance metrics

#### **AI Chat System**
- `conversation_threads` - Chat threads (128 KB)
  - Context snapshots
  - Token tracking
  - Cost estimation
- `conversation_messages` - Messages (312 KB)
  - Action detection
  - Feedback tracking
  - Model versioning

#### **Location Intelligence**
- `location_corrections` - Location correction history (48 KB)
  - Extraction method tracking
  - Distance calculations

#### **User Preferences**
- `user_maintenance_preferences` - Custom maintenance schedules (80 KB)

#### **Vision AI Metrics**
- `vision_metrics` - Processing metrics (80 KB)
- `vision_accuracy` - Accuracy tracking (40 KB)

#### **System**
- `schema_migrations` - Migration tracker (48 KB)

### **Analytics Views**
- `active_garages` - Non-deleted garages
- `capture_session_analytics` - Session completion rates
- `capture_abandonment_analysis` - Abandonment patterns
- `location_correction_stats` - Location accuracy metrics

---

## **🔑 KEY FEATURES IMPLEMENTED**

### **✅ Phase 1: Foundation (Current)**
- ✅ Multi-tenancy with RLS (Row Level Security)
- ✅ Garage & vehicle management
- ✅ Event logging (fuel, maintenance, damage)
- ✅ AI-powered photo capture
- ✅ Vision API integration (OCR for receipts, gauges)
- ✅ AI chat assistant
- ✅ Location intelligence
- ✅ Audit trails & edit history
- ✅ Soft delete support
- ✅ Comprehensive indexing

### **🚧 Phase 2: Intelligence Layer (Next)**
Ready to add:
- Multi-model vision (Claude, Gemini fallbacks)
- Auto-enrichment (weather, geocoding, POI)
- Pattern recognition
- Anomaly detection

### **📋 Phase 3-6: Future**
Foundation is ready for:
- Analytics & insights
- Enterprise features (exports, notifications)
- Premium features (voice, price intelligence)
- Scale optimizations

---

## **📈 INDEX SUMMARY**

**Performance-optimized indexes:**
- **Timeline queries:** `idx_events_timeline`, `idx_events_tenant_vehicle_date_id`
- **Search:** Full-text search on notes (`idx_events_notes_fts`)
- **Location:** GiST index for GPS queries (`idx_photo_gps_location`)
- **Soft deletes:** Filtered indexes for active records
- **AI context:** Optimized for conversation context loading

**Total index count:** 150+ (well-optimized!)

---

## **🗂️ SCHEMA STRENGTHS**

### **✅ What's Great**
1. **Comprehensive audit trail** - Every edit tracked
2. **Soft delete support** - No data loss
3. **Multi-photo events** - Flexible capture flow
4. **AI metadata everywhere** - Vision results stored with images
5. **Performance indexing** - Timeline queries < 100ms
6. **Location intelligence** - GPS + geocoding + corrections
7. **Capture flow tracking** - Understand user behavior
8. **Cost tracking** - AI usage monitored

### **✅ Well-Designed**
- Foreign keys properly enforced
- Timestamps on all tables
- JSONB for flexible metadata
- Arrays for tags/lists
- Numeric for precise calculations (prices, coordinates)
- Proper use of views for analytics

---

## **🎯 MIGRATION HISTORY**

### **Development Iterations (2024-2025)**
The current schema evolved through ~140 migrations during development:
- Initial schema setup
- Vision API integration
- AI chat system
- Capture flow tracking
- Multiple "nuclear rebuilds" to fix issues
- Location intelligence
- Audit system
- Soft deletes

### **Baseline Reconciliation (2025-01-13)**
All previous iterations consolidated into `000_GOLDEN_BASELINE_2025_01_13.sql`

This baseline represents **production reality** - not migration theory.

---

## **📝 FUTURE MIGRATION GUIDELINES**

### **Starting from 001 (Phase 2+)**

All new migrations must:
1. **Be incremental** - Small, focused changes
2. **Have rollback scripts** - `migrations/rollback/NNN_rollback.sql`
3. **Be tested** - On staging before production
4. **Be documented** - Clear comments explaining the change
5. **Update tracker** - `migrations/applied/production.txt`

### **Example: Phase 2 Enrichment**
```sql
-- migrations/001_phase2_enrichment_tables.sql
-- Purpose: Add enrichment tracking for weather/geocoding
-- Phase: 2 (Intelligence Layer)
-- Rollback: migrations/rollback/001_rollback.sql

CREATE TABLE event_enrichments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES vehicle_events(id),
    enrichment_type TEXT NOT NULL, -- 'weather', 'geocoding', 'poi'
    status TEXT NOT NULL DEFAULT 'pending',
    data JSONB,
    fetched_at TIMESTAMPTZ,
    error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_enrichments_event ON event_enrichments(event_id);
CREATE INDEX idx_enrichments_pending ON event_enrichments(status) 
    WHERE status = 'pending';
```

---

## **🚨 WHAT WE'RE ARCHIVING**

### **Nuclear Rebuild Migrations (Chaotic Dev History)**
These migrations are being moved to `archive/nuclear_rebuilds/`:
- `nuclear-rebuild-minimal-schema.sql`
- `nuclear-rebuild-enterprise-schema.sql`
- `nuclear-rebuild-enterprise-fixed.sql`
- `000-nuclear-rebuild-elite-complete.sql`
- `001-nuclear-rebuild-elite-supabase.sql`
- All `CRITICAL-*`, `CORRECTED-*`, `WORKING-*`, `FIX-*` migrations

**Why archive?**
- They represent iterative fixes during development
- Many duplicate/override each other
- The result is captured in the baseline
- They're historical reference only

**Should we delete them?**
No! Keep in `archive/` for:
- Understanding how we got here
- Reference if we need to debug historical issues
- Learning what NOT to do in future

---

## **✅ CLEAN SLATE FOR PHASE 2**

You now have:
- ✅ **Production schema documented** - This file
- ✅ **Baseline migration** - `000_GOLDEN_BASELINE_2025_01_13.sql`
- ✅ **Clean migration tracker** - `migrations/applied/production.txt`
- ✅ **18-month roadmap ready** - Foundation is solid

**Next:** Build Phase 2 (Intelligence Layer) with clean, incremental migrations! 🚀

---

## **📞 SUPPORT**

If you need to:
- **Recreate database from scratch:** Use Supabase schema dump
- **Understand a table:** Reference this document
- **Add a migration:** Follow guidelines above
- **Debug production:** Check `vehicle_event_audit_logs` for history

---

**Last Updated:** 2025-01-13  
**Maintainer:** Development Team  
**Status:** ✅ Production-ready baseline
