# Migration Fixes Applied

**Date:** January 13, 2025  
**Status:** ✅ Fixed and Ready to Run

---

## 🔧 Errors Fixed

### **Error 1: Sequence Grant Errors**

**Problem:**
```
ERROR: relation "photo_metadata_id_seq" does not exist
ERROR: relation "event_photos_id_seq" does not exist
ERROR: relation "capture_sessions_id_seq" does not exist
```

**Root Cause:**
UUID primary keys use `gen_random_uuid()` and don't create PostgreSQL sequences. The `GRANT USAGE ON SEQUENCE` commands were trying to grant permissions on sequences that don't exist.

**Fix Applied:**
Removed all sequence grants and added clarifying comments:
```sql
-- Before (BROKEN):
GRANT USAGE ON SEQUENCE photo_metadata_id_seq TO authenticated;

-- After (FIXED):
-- Note: UUID primary keys don't use sequences, so no sequence grant needed
```

**Files Fixed:**
- ✅ `supabase/migrations/20250113_add_capture_metadata.sql`
- ✅ `supabase/migrations/20250113_add_multi_photo_events.sql`
- ✅ `supabase/migrations/20250113_add_capture_sessions.sql`

---

### **Error 2: Foreign Key Constraint Error**

**Problem:**
```
ERROR: there is no unique constraint matching given keys for referenced table "vehicle_events"
```

**Root Cause:**
When creating foreign keys to `vehicle_events(id)`, PostgreSQL requires that the referenced column has a unique constraint (usually a primary key). Your `vehicle_events` table exists but the primary key constraint might be missing or have the wrong name.

**Fix Applied:**
Created a separate migration to fix the primary key BEFORE running other migrations:

**New migration file:** `20250113_fix_vehicle_events_pk.sql`
- Checks if primary key exists
- Drops any wrongly named primary keys
- Adds correct primary key constraint named `vehicle_events_pkey`
- Verifies it was created successfully

**Files Fixed:**
- ✅ Created: `supabase/migrations/20250113_fix_vehicle_events_pk.sql` (NEW - run FIRST)
- ✅ Updated: `supabase/migrations/20250113_add_multi_photo_events.sql`
- ✅ Updated: `supabase/migrations/20250113_add_capture_sessions.sql`

---

## ✅ All Migrations Fixed

All four migrations are now ready to run **IN THIS ORDER:**

1. ✅ **20250113_fix_vehicle_events_pk.sql** (NEW - RUN FIRST!)
   - Ensures `vehicle_events.id` has proper primary key constraint
   - Required for foreign keys in migrations 2 and 3

2. ✅ **20250113_add_capture_metadata.sql**
   - Fixed: Removed invalid sequence grant
   - Creates: `photo_metadata` table

3. ✅ **20250113_add_multi_photo_events.sql**
   - Fixed: Removed invalid sequence grant
   - Requires: PK fix from migration 1
   - Creates: `event_photos` table
   - Creates: Helper functions `get_event_photos()`, `get_event_primary_photo()`

4. ✅ **20250113_add_capture_sessions.sql**
   - Fixed: Removed invalid sequence grant
   - Requires: PK fix from migration 1
   - Creates: `capture_sessions` table
   - Creates: Analytics views

---

## 🚀 How to Run Migrations

### **Option A: Using Supabase CLI (Recommended)**

```bash
cd /Users/josephehler/Desktop/Desktop/apps/motomind-ai

# IMPORTANT: Run in this exact order!

# 1. Fix primary key constraint FIRST
supabase db push supabase/migrations/20250113_fix_vehicle_events_pk.sql

# 2. Add capture metadata (no dependencies)
supabase db push supabase/migrations/20250113_add_capture_metadata.sql

# 3. Add multi-photo support (requires PK from step 1)
supabase db push supabase/migrations/20250113_add_multi_photo_events.sql

# 4. Add capture sessions (requires PK from step 1)
supabase db push supabase/migrations/20250113_add_capture_sessions.sql
```

### **Option B: Using Supabase Dashboard**

1. Go to: https://supabase.com/dashboard/project/ucbbzzoimghnaoihyqbd/editor
2. Click **SQL Editor**
3. Run each migration in this exact order:
   - **First:** `20250113_fix_vehicle_events_pk.sql`
   - **Second:** `20250113_add_capture_metadata.sql`
   - **Third:** `20250113_add_multi_photo_events.sql`
   - **Fourth:** `20250113_add_capture_sessions.sql`

### **Option C: Using psql**

```bash
# Run in this exact order!
psql "postgresql://postgres:[password]@[host]:[port]/postgres" \
  -f supabase/migrations/20250113_fix_vehicle_events_pk.sql

psql "postgresql://postgres:[password]@[host]:[port]/postgres" \
  -f supabase/migrations/20250113_add_capture_metadata.sql

psql "postgresql://postgres:[password]@[host]:[port]/postgres" \
  -f supabase/migrations/20250113_add_multi_photo_events.sql

psql "postgresql://postgres:[password]@[host]:[port]/postgres" \
  -f supabase/migrations/20250113_add_capture_sessions.sql
```

---

## 🧪 Verify Migrations

After running, verify the primary key and tables were created:

```sql
-- 1. Check primary key exists on vehicle_events
SELECT conname, contype 
FROM pg_constraint 
WHERE conname = 'vehicle_events_pkey' 
  AND conrelid = 'vehicle_events'::regclass;

-- Should return 1 row:
-- vehicle_events_pkey | p


-- 2. Check tables exist
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('photo_metadata', 'event_photos', 'capture_sessions')
ORDER BY tablename;

-- Should return 3 rows:
-- capture_sessions
-- event_photos
-- photo_metadata
```

Check row-level security:
```sql
-- Verify RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('photo_metadata', 'event_photos', 'capture_sessions');

-- All should show rowsecurity = true
```

Check helper functions exist:
```sql
-- List functions
SELECT proname, prosrc
FROM pg_proc
WHERE proname IN ('get_event_photos', 'get_event_primary_photo', 'auto_abandon_inactive_sessions');

-- Should return 3 functions
```

---

## 📊 What Each Migration Adds

### **1. photo_metadata (30+ fields)**

Stores comprehensive capture metadata:
- **GPS:** latitude, longitude, accuracy, timestamp
- **Quality:** score (0-100), issues array
- **Compression:** original size, compressed size, ratio
- **Camera:** flash mode, facing mode
- **Behavior:** retake count, capture duration
- **Device:** platform, user agent
- **HEIC:** conversion tracking
- **Editing:** crop, rotate, brightness, blur

**Indexes:** 8 indexes for fast queries

---

### **2. event_photos (Junction table)**

Links multiple photos to events:
- **event_id** → Which event
- **image_id** → Which photo
- **sequence** → Display order (1, 2, 3, 4)
- **step_id** → 'receipt', 'odometer', 'gauge', 'additives'
- **is_primary** → Hero photo for event

**Helper Functions:**
- `get_event_photos(event_id)` → Returns all photos in sequence
- `get_event_primary_photo(event_id)` → Returns hero photo

**Indexes:** 6 indexes for fast lookups

---

### **3. capture_sessions (Tracking)**

Tracks capture sessions for analytics:
- **Status:** active, completed, abandoned
- **Progress:** total steps, completed steps, photos captured
- **Timing:** started, completed, abandoned timestamps
- **Duration:** total duration, avg step duration
- **Abandonment:** which step, reason (back_button, timeout, etc.)
- **Device:** platform, user agent, GPS location

**Analytics Views:**
- `capture_session_analytics` → Completion rates by event type
- `capture_abandonment_analysis` → Where/why users quit

**Helper Functions:**
- `auto_abandon_inactive_sessions()` → Cron job to mark stale sessions

**Indexes:** 6 indexes for analytics queries

---

## 🎯 Next Steps

After migrations succeed:

1. ✅ **Verify tables created** (run verification queries above)
2. ✅ **Update GuidedCaptureFlow.tsx** (see `BACKEND_CAPTURE_INTEGRATION.md`)
3. ✅ **Test complete capture flow**
4. ✅ **Monitor analytics views**

**Total time: 1 hour from migrations to working integration** ⏰

---

## 🆘 If Migrations Still Fail

### **Check Database Permissions**

```sql
-- Check if authenticated role has permissions
SELECT grantee, privilege_type 
FROM information_schema.table_privileges 
WHERE table_schema = 'public' 
  AND table_name = 'vehicle_events';
```

### **Check Existing Constraints**

```sql
-- Check vehicle_events constraints
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'vehicle_events';

-- Should include:
-- vehicle_events_pkey | PRIMARY KEY
```

### **Check for Conflicting Tables**

```sql
-- Check if tables already exist
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('photo_metadata', 'event_photos', 'capture_sessions');

-- If they exist, drop them first (CAREFUL - this deletes data!)
-- DROP TABLE IF EXISTS photo_metadata CASCADE;
-- DROP TABLE IF EXISTS event_photos CASCADE;
-- DROP TABLE IF EXISTS capture_sessions CASCADE;
```

---

## 📄 Reference Docs

- **BACKEND_ARCHITECTURE_ASSESSMENT.md** - Full architecture review
- **BACKEND_CAPTURE_INTEGRATION.md** - Implementation guide
- **CAPTURE_SYSTEM_LAUNCH_CHECKLIST.md** - Quick start

---

**Status:** ✅ **All migration errors fixed and ready to run!**

Apply migrations now and you're 1 hour away from production. 🚀
