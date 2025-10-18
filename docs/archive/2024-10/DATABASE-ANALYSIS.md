# Database Schema Analysis
**Generated:** October 14, 2025  
**Database:** MotoMind AI Production  
**Total Tables:** 19 | **Total Rows:** 336 | **RLS Enabled:** 14/19 (74%)

---

## 🎯 Executive Summary

### ✅ What's Working Well
- **Strong tenant isolation** on core tables (vehicles, events, images)
- **Good indexing strategy** (127 indexes total)
- **Foreign key constraints** properly implemented
- **100% data integrity** on tenant-critical tables
- **Soft delete pattern** implemented (deleted_at columns)

### ⚠️ Critical Issues Found
1. **5 tables without RLS** - Security gap
2. **conversation_* tables have no tenant isolation** - Data leakage risk
3. **vehicle_spec_enhancements (111 rows) has no RLS or tenant_id** - Major issue
4. **Missing foreign keys** on some tenant_id columns
5. **Inconsistent naming** (some use tenant_id, some don't)

### 💡 Opportunities
1. Add 15+ composite indexes for common queries
2. Implement tenant isolation on conversation system
3. Add full-text search capabilities
4. Create materialized views for analytics
5. Add database-level audit logging

---

## 📊 Detailed Table Analysis

### 1. **capture_sessions** (0 rows)
**Purpose:** Track photo capture workflows  
**Status:** ✅ Good - Has tenant_id, RLS enabled, proper indexes  
**Columns:** 17 | **FKs:** 2 (tenant_id → tenants, event_id → vehicle_events)

**Recommendations:**
- ✅ Well structured
- Consider adding `user_id` to track who initiated capture
- Add index on `(tenant_id, status)` for filtering active sessions

---

### 2. **conversation_messages** (100 rows) ⚠️ CRITICAL
**Purpose:** Chat/conversation messages  
**Status:** 🔴 **NO TENANT ISOLATION**  
**Columns:** 7 | **RLS:** Disabled | **tenant_id:** ❌ Missing

**CRITICAL ISSUES:**
```
❌ No tenant_id column
❌ RLS disabled (policy: qual='true')
❌ Any authenticated user can read ALL messages
❌ Cross-tenant data leakage possible
```

**Immediate Action Required:**
```sql
-- Add tenant_id
ALTER TABLE conversation_messages ADD COLUMN tenant_id uuid REFERENCES tenants(id);

-- Populate from threads
UPDATE conversation_messages cm
SET tenant_id = ct.tenant_id
FROM conversation_threads ct
WHERE cm.thread_id = ct.id;

-- Make NOT NULL
ALTER TABLE conversation_messages ALTER COLUMN tenant_id SET NOT NULL;

-- Add index
CREATE INDEX idx_conversation_messages_tenant_id ON conversation_messages(tenant_id);

-- Fix RLS policy
DROP POLICY conversation_messages_all_policy ON conversation_messages;
CREATE POLICY conversation_messages_tenant_isolation 
ON conversation_messages FOR ALL TO authenticated
USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
```

---

### 3. **conversation_threads** (16 rows) ⚠️ ISSUE
**Purpose:** Chat conversation threads  
**Status:** 🟡 **Has tenant_id but weak RLS**  
**Columns:** 7 | **RLS:** Enabled but qual='true' (allows all)

**Issues:**
- Has tenant_id ✅
- But RLS policy allows access to ALL threads ❌
- Should enforce tenant isolation

**Fix:**
```sql
DROP POLICY conversation_threads_all_policy ON conversation_threads;
CREATE POLICY conversation_threads_tenant_isolation 
ON conversation_threads FOR ALL TO authenticated
USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
```

---

### 4. **event_photos** (0 rows)
**Purpose:** Photos attached to events  
**Status:** ✅ Good - Has tenant_id, RLS enabled  
**Columns:** 9 | **FKs:** 2

**Optimization:**
```sql
-- Add composite index for common query
CREATE INDEX idx_event_photos_tenant_event 
ON event_photos(tenant_id, event_id);
```

---

### 5. **garages** (0 rows)
**Purpose:** Vehicle storage locations  
**Status:** ✅ Excellent - Best structured table  
**Columns:** 9 | **Indexes:** 7 (including unique constraint on default garage)

**Highlights:**
```sql
-- Ensures only ONE default garage per tenant
CREATE UNIQUE INDEX idx_garages_one_default_per_tenant 
ON garages(tenant_id) 
WHERE is_default = true AND deleted_at IS NULL;
```

**This is a great pattern!** Consider using this for other "one per tenant" scenarios.

---

### 6. **location_corrections** (0 rows)
**Purpose:** User corrections to geocoded locations  
**Status:** ✅ Good - Has tenant_id, RLS enabled  
**Columns:** 8

**Note:** Currently has `user_id` for per-user isolation. Consider if this needs to be tenant-wide or user-specific.

---

### 7. **photo_metadata** (5 rows)
**Purpose:** EXIF and metadata from photos  
**Status:** ✅ Excellent - Proper isolation  
**Columns:** 23 | **NOT NULL tenant_id:** ✅

**Data:**
- 5 photos with full metadata
- 100% tenant isolation
- Proper indexes

---

### 8. **profiles** (0 rows)
**Purpose:** User profiles  
**Status:** 🟡 **Needs tenant_id**  
**RLS:** Enabled but qual='true'

**Issue:** Should profiles be tenant-specific or user-specific?
- If multi-tenant: Add tenant_id
- If user-specific: Keep as-is but fix RLS to use user_id

---

### 9. **schema_migrations** (3 rows)
**Purpose:** Migration tracking  
**Status:** ✅ Correct - System table, no RLS needed

---

### 10. **tenants** (1 row)
**Purpose:** Root tenant table  
**Status:** ✅ Good  
**Data:** 1 active tenant (your Personal account)

---

### 11. **user_maintenance_preferences** (1 row)
**Purpose:** User settings for maintenance reminders  
**Status:** ✅ Good - Has tenant_id, proper isolation

**Current schema:**
```json
{
  "vehicle_id": "uuid",
  "user_id": "text",
  "tenant_id": "uuid",
  "maintenance_type": "varchar(50)",
  "reminder_enabled": "boolean",
  "reminder_threshold_miles": "integer",
  "reminder_threshold_months": "integer"
}
```

**Recommendation:** Add composite index:
```sql
CREATE INDEX idx_user_maintenance_prefs_lookup
ON user_maintenance_preferences(tenant_id, vehicle_id, user_id);
```

---

### 12. **user_tenants** (1 row)
**Purpose:** User-to-tenant mapping (critical!)  
**Status:** ✅ Excellent  
**Data:** joseph.ehler@gmail.com → Personal tenant (owner)

**Has unique constraint:** `(user_id, tenant_id)` - Perfect!

---

### 13. **vehicle_event_audit_logs** (0 rows)
**Purpose:** Audit trail for event changes  
**Status:** ✅ Good - Has tenant_id, RLS enabled

**Recommendation:** Consider adding:
```sql
ALTER TABLE vehicle_event_audit_logs 
ADD COLUMN changed_by text; -- Track which user made changes
```

---

### 14. **vehicle_events** (0 rows) ⚠️ CONCERNING
**Purpose:** Core events table (fuel, maintenance, etc.)  
**Status:** 🟡 **Zero events but you have 22 vehicles**  
**Columns:** 25 | **NOT NULL tenant_id:** ✅

**Issue:** Why no events?
- Is event creation broken?
- Are events going to a different table?
- Old data not migrated?

**Schema is excellent:**
- Has tenant_id (NOT NULL) ✅
- Proper indexes ✅
- RLS enabled ✅
- Soft deletes ✅

**Action:** Test event creation to see why no data exists.

---

### 15. **vehicle_images** (25 rows)
**Purpose:** Photos of vehicles  
**Status:** ✅ Excellent  
**Columns:** 13 | **NOT NULL tenant_id:** ✅

**Data:** 25 images across 22 vehicles (good coverage)

---

### 16. **vehicle_spec_enhancements** (111 rows) 🔴 CRITICAL ISSUE
**Purpose:** VIN decoder enhancements  
**Status:** 🔴 **NO TENANT ISOLATION AT ALL**

**CRITICAL ISSUES:**
```
❌ No tenant_id column
❌ No RLS enabled
❌ 111 rows of data accessible by anyone
❌ Contains vehicle specs (could be sensitive)
```

**Schema:**
```json
{
  "id": "uuid",
  "vin": "varchar(17)",
  "year": "integer",
  "make": "varchar(100)",
  "model": "varchar(100)",
  "trim": "varchar(100)",
  "body_type": "varchar(50)",
  "engine": "varchar(200)",
  "transmission": "varchar(100)",
  // ... more specs
}
```

**Immediate Fix Required:**
```sql
-- Add tenant_id
ALTER TABLE vehicle_spec_enhancements 
ADD COLUMN tenant_id uuid REFERENCES tenants(id);

-- Populate from vehicles table using VIN
UPDATE vehicle_spec_enhancements vse
SET tenant_id = v.tenant_id
FROM vehicles v
WHERE vse.vin = v.vin;

-- For any orphaned specs, assign to your tenant
UPDATE vehicle_spec_enhancements
SET tenant_id = 'b9281da3-16c4-4370-83ad-4672cf928065'
WHERE tenant_id IS NULL;

-- Make NOT NULL
ALTER TABLE vehicle_spec_enhancements ALTER COLUMN tenant_id SET NOT NULL;

-- Add index
CREATE INDEX idx_vehicle_spec_enhancements_tenant_id 
ON vehicle_spec_enhancements(tenant_id);

-- Enable RLS
ALTER TABLE vehicle_spec_enhancements ENABLE ROW LEVEL SECURITY;

-- Add policy
CREATE POLICY vehicle_spec_enhancements_tenant_isolation 
ON vehicle_spec_enhancements FOR ALL TO authenticated
USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
```

---

### 17. **vehicles** (22 rows)
**Purpose:** Core vehicle table  
**Status:** ✅ Excellent  
**Columns:** 28 | **NOT NULL tenant_id:** ✅

**Data:** 22 vehicles, 100% tenant isolation

**Recommendation:** Consider adding:
```sql
-- Index for filtering by status
CREATE INDEX idx_vehicles_tenant_status 
ON vehicles(tenant_id, deleted_at) 
WHERE deleted_at IS NULL;

-- Index for searching
CREATE INDEX idx_vehicles_search 
ON vehicles USING gin(to_tsvector('english', 
  coalesce(nickname, '') || ' ' || 
  coalesce(make, '') || ' ' || 
  coalesce(model, '')
));
```

---

### 18. **vision_accuracy** (0 rows)
**Purpose:** Track AI vision extraction accuracy  
**Status:** ✅ Good - Has tenant_id, RLS enabled

---

### 19. **vision_metrics** (51 rows)
**Purpose:** AI vision performance metrics  
**Status:** ✅ Good - Has tenant_id, RLS enabled  
**Data:** 51 metric records

---

## 🔥 Priority Action Items

### 🔴 CRITICAL (Do Immediately)
1. **Fix vehicle_spec_enhancements** - Add tenant_id, enable RLS
2. **Fix conversation_messages** - Add tenant_id
3. **Investigate vehicle_events** - Why zero events with 22 vehicles?

### 🟡 HIGH (Do This Week)
4. **Fix conversation_threads RLS** - Enforce tenant isolation
5. **Add missing foreign keys** - vehicle_spec_enhancements.tenant_id
6. **Add composite indexes** - 15+ optimization opportunities

### 🟢 MEDIUM (Do This Month)
7. **Add full-text search** - On vehicles, conversations
8. **Create materialized views** - For analytics/reporting
9. **Add database audit logging** - Track all changes

---

## 📈 Performance Optimization Opportunities

### 1. Composite Indexes (Recommended)
```sql
-- For vehicle queries (most common)
CREATE INDEX idx_vehicles_tenant_active 
ON vehicles(tenant_id, deleted_at, id) 
WHERE deleted_at IS NULL;

-- For event queries
CREATE INDEX idx_vehicle_events_tenant_vehicle_date 
ON vehicle_events(tenant_id, vehicle_id, date DESC) 
WHERE deleted_at IS NULL;

-- For image queries
CREATE INDEX idx_vehicle_images_tenant_vehicle 
ON vehicle_images(tenant_id, vehicle_id, is_primary);

-- For conversation queries
CREATE INDEX idx_conversation_messages_thread_created 
ON conversation_messages(thread_id, created_at DESC);

-- For garage queries
CREATE INDEX idx_garages_tenant_active 
ON garages(tenant_id, is_default) 
WHERE deleted_at IS NULL;
```

### 2. Full-Text Search
```sql
-- Add tsvector column for fast search
ALTER TABLE vehicles 
ADD COLUMN search_vector tsvector 
GENERATED ALWAYS AS (
  to_tsvector('english', 
    coalesce(nickname, '') || ' ' || 
    coalesce(make, '') || ' ' || 
    coalesce(model, '') || ' ' ||
    coalesce(trim, '') || ' ' ||
    coalesce(vin, '')
  )
) STORED;

CREATE INDEX idx_vehicles_search 
ON vehicles USING GIN(search_vector);
```

### 3. Materialized Views for Analytics
```sql
-- Vehicle summary by tenant
CREATE MATERIALIZED VIEW mv_tenant_vehicle_summary AS
SELECT 
  t.id as tenant_id,
  t.name as tenant_name,
  COUNT(DISTINCT v.id) as vehicle_count,
  COUNT(DISTINCT ve.id) as event_count,
  COUNT(DISTINCT vi.id) as image_count,
  MAX(ve.date) as last_event_date
FROM tenants t
LEFT JOIN vehicles v ON t.id = v.tenant_id AND v.deleted_at IS NULL
LEFT JOIN vehicle_events ve ON v.id = ve.vehicle_id AND ve.deleted_at IS NULL
LEFT JOIN vehicle_images vi ON v.id = vi.vehicle_id
GROUP BY t.id, t.name;

CREATE UNIQUE INDEX ON mv_tenant_vehicle_summary(tenant_id);

-- Refresh periodically
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_tenant_vehicle_summary;
```

---

## 🏗️ Feature Extension Opportunities

### 1. Multi-User Collaboration
**Current:** Single user per tenant  
**Opportunity:** Add user roles and permissions

```sql
-- Extend user_tenants with more roles
ALTER TABLE user_tenants 
ADD COLUMN permissions jsonb DEFAULT '{}';

-- Example permissions:
{
  "vehicles": ["read", "write", "delete"],
  "events": ["read", "write"],
  "settings": ["read"]
}
```

### 2. Vehicle Sharing
**Opportunity:** Allow vehicles to be shared across tenants

```sql
CREATE TABLE vehicle_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES vehicles(id),
  owner_tenant_id uuid NOT NULL REFERENCES tenants(id),
  shared_with_tenant_id uuid NOT NULL REFERENCES tenants(id),
  permission_level text NOT NULL CHECK (permission_level IN ('view', 'edit')),
  shared_by text NOT NULL,
  shared_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  revoked_at timestamptz,
  UNIQUE(vehicle_id, shared_with_tenant_id)
);
```

### 3. Scheduled Maintenance Reminders
**Current:** Basic preferences table  
**Opportunity:** Full reminder system

```sql
CREATE TABLE maintenance_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  vehicle_id uuid NOT NULL REFERENCES vehicles(id),
  reminder_type text NOT NULL,
  due_at_miles integer,
  due_at_date date,
  sent_at timestamptz,
  completed_at timestamptz,
  status text DEFAULT 'pending'
);
```

### 4. Document Storage
**Opportunity:** Store insurance, registration, etc.

```sql
CREATE TABLE vehicle_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  vehicle_id uuid NOT NULL REFERENCES vehicles(id),
  document_type text NOT NULL,
  file_url text NOT NULL,
  expires_at date,
  uploaded_at timestamptz DEFAULT now(),
  uploaded_by text
);
```

### 5. Cost Tracking
**Opportunity:** Track total cost of ownership

```sql
CREATE TABLE vehicle_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  vehicle_id uuid NOT NULL REFERENCES vehicles(id),
  cost_type text NOT NULL,
  amount numeric(10,2) NOT NULL,
  date date NOT NULL,
  notes text,
  event_id uuid REFERENCES vehicle_events(id)
);
```

---

## 🔍 Data Integrity Issues

### 1. Orphaned Records
**Check for:** Records with invalid foreign keys
```sql
-- Check for orphaned images
SELECT COUNT(*) FROM vehicle_images vi
LEFT JOIN vehicles v ON vi.vehicle_id = v.id
WHERE v.id IS NULL;

-- Check for orphaned events
SELECT COUNT(*) FROM vehicle_events ve
LEFT JOIN vehicles v ON ve.vehicle_id = v.id
WHERE v.id IS NULL;
```

### 2. Inconsistent Timestamps
**Issue:** Some tables use `created_at`, some use `started_at`

**Recommendation:** Standardize on:
- `created_at` - When record was created
- `updated_at` - Last modification
- `deleted_at` - Soft delete (if applicable)

---

## 📝 Summary & Next Steps

### Immediate Actions (Today)
1. ✅ Run introspection tool (DONE)
2. 🔴 Fix `vehicle_spec_enhancements` tenant isolation
3. 🔴 Fix `conversation_messages` tenant isolation
4. 🔴 Investigate why `vehicle_events` has zero rows

### This Week
5. Add 15+ composite indexes for performance
6. Fix RLS policies on conversation tables
7. Add full-text search on vehicles

### This Month
8. Implement feature extensions (document storage, cost tracking)
9. Create materialized views for analytics
10. Add database-level audit logging

---

**Your database is 80% excellent. The 20% that needs fixing is critical but straightforward.**

**Estimated time to fix critical issues: 2-3 hours**
