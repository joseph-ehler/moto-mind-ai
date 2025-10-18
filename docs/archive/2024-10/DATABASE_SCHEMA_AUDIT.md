# 📊 Database Schema Audit - October 18, 2025

**Status:** ✅ Connection Verified  
**Database:** Supabase (ucbbzzoimghnaoihyqbd.supabase.co)

---

## ✅ **What EXISTS in Database**

### **Core Tables:**

#### **1. `vehicles` Table** ✅
```typescript
{
  id: UUID                                    // Primary key
  tenant_id: UUID                            // Reference to tenant
  year: number                               // Vehicle year
  make: string                               // Manufacturer
  model: string                              // Model name
  vin: string | null                         // VIN (optional)
  trim: string | null                        // Trim level
  license_plate: string | null               // License plate
  nickname: string | null                    // User-friendly name
  display_name: string | null                // Display name
  
  // Mileage tracking
  current_mileage: number                    // Current odometer
  current_mileage_override: number | null    // Manual override
  mileage_last_updated_at: timestamp         // Last update time
  mileage_computed_from: string              // Source: 'event' | 'manual'
  
  // Service/maintenance
  manufacturer_mpg: number | null
  manufacturer_service_interval_miles: number | null
  
  // AI enhancement
  specs_enhancement_status: string           // 'pending' | 'completed'
  specs_last_enhanced: timestamp | null
  specs_categories_completed: number
  
  // Media
  hero_image_url: string | null
  
  // Multi-tenant
  garage_id: UUID | null
  fleet_id: UUID | null
  
  // Timestamps
  created_at: timestamp
}
```

**Sample Data:**
- Existing vehicle: "2023 Tesla Model 3" (nickname: "My Tesla")
- VIN: 5YJ3E1EA0KF000001
- Mileage tracking: Active

#### **2. `tenants` Table** ✅
```typescript
{
  id: UUID
  name: string                     // e.g., "Personal"
  is_active: boolean
  created_at: timestamp
  updated_at: timestamp
}
```

#### **3. `user_tenants` Table** ✅
```typescript
{
  id: UUID
  user_id: TEXT                    // ✅ TEXT for NextAuth (not UUID!)
  tenant_id: UUID
  role: string                     // 'owner' | 'admin' | 'member' | 'viewer'
  email_verified: boolean
  email_verified_at: timestamp | null
  fleet_id: UUID | null            // Optional fleet assignment
  created_at: timestamp
  updated_at: timestamp
}
```

**Important:** `user_id` is TEXT ("joseph.ehler@gmail.com"), not UUID!

#### **4. `tracking_sessions` Table** ✅
```typescript
{
  id: UUID
  session_id: TEXT                 // Client-generated
  user_id: TEXT                    // NextAuth user ID
  vehicle_id: UUID | null          // Reference to vehicle
  
  start_time: timestamp
  end_time: timestamp | null
  status: string                   // 'active' | 'paused' | 'completed' | 'error'
  
  // Statistics
  distance_meters: number
  duration_seconds: number
  max_speed_mps: number
  avg_speed_mps: number
  points_recorded: number
  
  created_at: timestamp
  updated_at: timestamp
}
```

#### **5. `location_points` Table** ✅
```typescript
{
  id: UUID
  session_id: UUID                 // FK to tracking_sessions
  
  latitude: number                 // 8 decimal places
  longitude: number
  altitude: number | null
  accuracy: number                 // meters
  speed: number                    // m/s
  heading: number                  // degrees 0-360
  
  recorded_at: timestamp
  created_at: timestamp
}
```

#### **6. `fleets` Table** ✅
```typescript
{
  id: UUID
  tenant_id: UUID
  name: string
  description: string | null
  manager_ids: TEXT[]              // Array of user IDs
  vehicle_ids: UUID[]              // Array of vehicle IDs
  metadata: jsonb
  created_at: timestamp
  updated_at: timestamp
  deleted_at: timestamp | null
}
```

#### **7. `invitations` Table** ✅
```typescript
{
  id: UUID
  tenant_id: UUID
  fleet_id: UUID | null
  inviter_id: TEXT                 // Manager's user_id
  invitee_email: string | null
  invitee_phone: string | null
  role: string                     // 'admin' | 'member' | 'viewer'
  token: string                    // Unique invite token
  status: string                   // 'pending' | 'accepted' | 'expired' | 'revoked'
  accepted_by_user_id: TEXT | null
  expires_at: timestamp
  accepted_at: timestamp | null
  revoked_at: timestamp | null
  revoked_by_user_id: TEXT | null
  metadata: jsonb
  created_at: timestamp
}
```

#### **8. `profiles` Table** ✅
```typescript
{
  id: UUID
  tenant_id: UUID                  // NOT NULL
  // ... (empty, need to check schema)
  created_at: timestamp
}
```

**Note:** Profiles table is empty, might not be needed if using NextAuth.

---

## ❌ **What's MISSING for Onboarding**

### **Need to Add:**

#### **1. `user_onboarding` Table** (NEW)
```sql
CREATE TABLE user_onboarding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,  -- NextAuth user ID (TEXT!)
  tenant_id UUID REFERENCES tenants(id),
  
  -- Progress tracking
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  current_step TEXT DEFAULT 'welcome',
  
  -- Completion flags
  vehicle_added BOOLEAN DEFAULT false,
  dashboard_visited BOOLEAN DEFAULT false,
  first_ride_tracked BOOLEAN DEFAULT false,
  
  -- Preferences
  skip_onboarding BOOLEAN DEFAULT false,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id)
);

CREATE INDEX idx_user_onboarding_user_id ON user_onboarding(user_id);
CREATE INDEX idx_user_onboarding_tenant_id ON user_onboarding(tenant_id);

ALTER TABLE user_onboarding ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on user_onboarding"
  ON user_onboarding FOR ALL
  USING (true) WITH CHECK (true);

COMMENT ON TABLE user_onboarding IS 'Tracks user onboarding progress';
COMMENT ON POLICY "Allow all operations on user_onboarding" ON user_onboarding IS 
  'Permissive - auth handled in API via NextAuth';
```

---

## ⚠️ **Critical Issues Found**

### **1. RLS Policies Using `auth.uid()`**

**Problem:** Several tables have RLS policies that use `auth.uid()` or `auth.uid()::uuid`

**Files with issue:**
- `tracking_sessions` policies
- `location_points` policies  
- `tracking_events` policies
- `logs` policies
- `favorite_stations` policies

**Why this is broken:**
- This app uses **NextAuth**, not Supabase Auth
- `auth.uid()` returns NULL with NextAuth
- RLS policies block all requests
- Results in 500 errors

**Example of broken policy:**
```sql
-- ❌ BROKEN (tracking_sessions)
CREATE POLICY "Users can view their own tracking sessions"
  ON tracking_sessions FOR SELECT
  USING (user_id = auth.uid());  -- Returns NULL!
```

**Should be:**
```sql
-- ✅ CORRECT (NextAuth pattern)
CREATE POLICY "Allow all operations on tracking_sessions"
  ON tracking_sessions FOR ALL
  USING (true) WITH CHECK (true);

COMMENT ON POLICY "Allow all operations on tracking_sessions" ON tracking_sessions IS 
  'Permissive - auth handled in API via NextAuth';
```

**Authorization must happen in API routes using `requireUserServer()`.**

---

## 📋 **Summary for Onboarding**

### **What We Have:**
✅ `vehicles` table - Ready to use  
✅ `tenants` table - Working  
✅ `user_tenants` table - Working (correct TEXT user_id)  
✅ `tracking_sessions` table - Exists (needs RLS fix)  
✅ `location_points` table - Exists (needs RLS fix)  
✅ Multi-tenant architecture - Complete  
✅ Fleet support - Scaffolded  

### **What We Need:**
❌ `user_onboarding` table - Need to create  
⚠️  Fix RLS policies - Change auth.uid() to permissive policies  

### **For Minimal Onboarding (Week 1):**

**Required:**
1. ✅ `vehicles` table - Already exists!
2. ✅ `tenants` table - Already exists!
3. ✅ `user_tenants` table - Already exists!
4. ❌ `user_onboarding` table - Need to create

**Optional (can add later):**
- User preferences table (for settings page)
- Notification preferences
- Permission tracking

---

## 🎯 **Recommended Next Steps**

### **Step 1: Fix RLS Policies** (Critical)
Create migration to replace all `auth.uid()` policies with permissive policies.

**Files to fix:**
- `20251017_10_vehicle_tracking_tables.sql` (tracking_sessions, location_points, tracking_events)
- `20251016_01_create_missing_tables.sql` (logs, favorite_stations)

### **Step 2: Create Onboarding Table** (Required)
Add `user_onboarding` table to track progress.

### **Step 3: Build Onboarding UI** (Week 1)
Now that we know what exists:
1. Welcome screen
2. Add vehicle form (use existing `vehicles` table structure)
3. Dashboard with vehicle

---

## ✅ **Good News**

**The vehicle table is PERFECT for onboarding!**

It has everything we need:
- ✅ Basic info (make, model, year)
- ✅ Optional VIN
- ✅ Nickname support
- ✅ Mileage tracking built-in
- ✅ Service intervals ready
- ✅ AI enhancement status
- ✅ Multi-tenant support
- ✅ Fleet-ready

**No schema changes needed for vehicles! We can start building onboarding immediately.**

---

## 🚀 **Implementation Plan**

### **Week 1: Minimal Onboarding**

**Day 1:**
- Create `user_onboarding` table migration
- Fix RLS policies migration

**Day 2-3:**
- Build welcome screen
- Build add vehicle form (uses existing `vehicles` table)

**Day 4-5:**
- Build dashboard with vehicle display
- Test complete flow

**Day 6-7:**
- Polish + user testing
- Deploy

**Total time:** 1 week to production onboarding ✅

---

## 📝 **Notes**

- **user_id is TEXT** across all tables (NextAuth pattern) ✅
- **Existing vehicle data** shows the table is being used in production
- **Multi-tenant architecture** is solid and working
- **Fleet support** is already scaffolded (ready when needed)
- **RLS policies need fixing** but this is straightforward

**Status:** Ready to build onboarding! 🎉
