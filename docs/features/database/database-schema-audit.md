# MotoMind Database Schema Audit

**Generated:** 2025-09-27T07:53:00-04:00  
**Purpose:** Comprehensive analysis of all tables, columns, and relationships

## 📊 Executive Summary

Based on migration analysis, we have **~15-20 tables** in the public schema with varying levels of usage and completeness.

## 🏗️ Core Tables Analysis

### 1. **tenants** (Base Schema)
```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```
- **Status:** ✅ Core table, well-structured
- **Usage:** Multi-tenancy foundation
- **Issues:** None identified

### 2. **users** (Base Schema)
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```
- **Status:** ✅ Core table, well-structured
- **Usage:** User management
- **Issues:** None identified

### 3. **garages** (Base Schema)
```sql
CREATE TABLE garages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  address TEXT,
  lat DECIMAL(10,8),
  lng DECIMAL(11,8),
  timezone TEXT DEFAULT 'America/New_York',
  is_default BOOLEAN DEFAULT false, -- Added in migration 022
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```
- **Status:** ✅ Core table, actively used
- **Usage:** Location management
- **Recent Changes:** Added `is_default` column
- **Issues:** Missing `deleted_at` for soft deletes

### 4. **vehicles** (Base Schema + Extensions)
```sql
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  garage_id UUID REFERENCES garages(id),
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER,
  vin TEXT,
  license_plate TEXT,
  display_name TEXT, -- Added in migration 030
  hero_image_url TEXT,
  baseline_fuel_mpg INTEGER,
  baseline_service_interval_miles INTEGER DEFAULT 5000,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ -- Soft delete support
);
```
- **Status:** ✅ Core table, actively used
- **Usage:** Primary vehicle records
- **Recent Changes:** Added `display_name` field
- **Issues:** None identified

### 5. **vehicle_events** (Unified Events Stream)
```sql
CREATE TABLE vehicle_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id), -- Added in security fix
  vehicle_id UUID NOT NULL REFERENCES vehicles(id),
  type TEXT CHECK (type IN ('odometer','maintenance','fuel','document')),
  date DATE NOT NULL,
  miles INTEGER,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now() -- Added in security fix
);
```
- **Status:** ✅ **ACTIVELY USED** - Core timeline functionality
- **Usage:** Unified event stream for all vehicle activities
- **Recent Changes:** Added `tenant_id` and `updated_at` in security fixes
- **Issues:** None - this is our primary events table

### 6. **vehicle_images** (Photo Management)
```sql
CREATE TABLE vehicle_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id),
  storage_path TEXT NOT NULL,
  image_type TEXT CHECK (image_type IN ('hero','gallery','document')),
  caption TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```
- **Status:** ✅ Supporting table
- **Usage:** Vehicle photo management
- **Issues:** None identified

## 🔍 Legacy/Deprecated Tables Analysis

### **odometer_readings** (Migration 010, 012)
```sql
CREATE TABLE odometer_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id),
  miles INTEGER NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```
- **Status:** 🚨 **DEPRECATED** - Replaced by `vehicle_events`
- **Usage:** Legacy odometer tracking
- **Recommendation:** **REMOVE** - Data should be migrated to `vehicle_events`

### **fuel_logs** (Migration 011)
```sql
CREATE TABLE fuel_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id),
  gallons DECIMAL(5,2),
  total_amount DECIMAL(8,2),
  price_per_gallon DECIMAL(5,2),
  station TEXT,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```
- **Status:** 🚨 **DEPRECATED** - Replaced by `vehicle_events`
- **Usage:** Legacy fuel tracking
- **Recommendation:** **REMOVE** - Data should be migrated to `vehicle_events`

### **service_records** (Migration 013)
```sql
CREATE TABLE service_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id),
  service_type TEXT NOT NULL,
  description TEXT,
  cost DECIMAL(8,2),
  service_date DATE NOT NULL,
  mileage INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);
```
- **Status:** 🚨 **DEPRECATED** - Replaced by `vehicle_events`
- **Usage:** Legacy service tracking
- **Recommendation:** **REMOVE** - Data should be migrated to `vehicle_events`

## 📱 Document Processing Tables

### **uploads** (Migration 004)
```sql
CREATE TABLE uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  user_id UUID REFERENCES users(id),
  storage_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);
```
- **Status:** ⚠️ **REVIEW NEEDED**
- **Usage:** Document upload tracking
- **Issues:** May overlap with simplified capture flow

### **manual_events** (Migration 004)
```sql
CREATE TABLE manual_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id),
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  confidence INTEGER DEFAULT 80,
  verified_by_user BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
```
- **Status:** 🚨 **POTENTIALLY DEPRECATED**
- **Usage:** Manual event entry
- **Recommendation:** **CONSOLIDATE** with `vehicle_events` or remove

## 🔔 Supporting Tables

### **reminders** (Migration 012, 021)
```sql
CREATE TABLE reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id), -- Added in security fix
  vehicle_id UUID REFERENCES vehicles(id),
  garage_id UUID REFERENCES garages(id),
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  due_mileage INTEGER,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```
- **Status:** ✅ Supporting feature
- **Usage:** Maintenance reminders
- **Recent Changes:** Added `tenant_id` in security fixes
- **Issues:** None identified

### **jurisdictions** (Migration 011)
```sql
CREATE TABLE jurisdictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  state_code TEXT,
  country_code TEXT DEFAULT 'US',
  rules JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
```
- **Status:** ✅ Reference data
- **Usage:** Location-based rules
- **Issues:** None identified

## 📈 Usage Analysis & Recommendations

### 🔥 **HIGH PRIORITY ACTIONS**

1. **Remove Deprecated Tables:**
   ```sql
   -- After data migration
   DROP TABLE odometer_readings;
   DROP TABLE fuel_logs; 
   DROP TABLE service_records;
   ```

2. **Consolidate Event Systems:**
   - Migrate any data from `manual_events` to `vehicle_events`
   - Consider removing `manual_events` table

3. **Add Missing Soft Deletes:**
   ```sql
   ALTER TABLE garages ADD COLUMN deleted_at TIMESTAMPTZ;
   ALTER TABLE reminders ADD COLUMN deleted_at TIMESTAMPTZ;
   ```

### ⚠️ **MEDIUM PRIORITY ACTIONS**

1. **Review Upload System:**
   - Determine if `uploads` table is needed with simplified capture
   - Consider consolidation with `vehicle_events`

2. **Add Missing Indexes:**
   ```sql
   CREATE INDEX IF NOT EXISTS idx_vehicle_events_vehicle_date 
     ON vehicle_events(vehicle_id, date DESC);
   CREATE INDEX IF NOT EXISTS idx_vehicle_events_type 
     ON vehicle_events(type);
   ```

### 💡 **LOW PRIORITY ENHANCEMENTS**

1. **Add Audit Trails:**
   - Consider adding `created_by`, `updated_by` fields
   - Add change tracking for critical tables

2. **Performance Optimization:**
   - Review JSONB payload usage in `vehicle_events`
   - Consider partitioning for large event tables

## 🎯 **CURRENT ARCHITECTURE STATUS**

### ✅ **WORKING WELL:**
- **Unified Events Stream:** `vehicle_events` table is the foundation of our timeline
- **Multi-tenancy:** Proper `tenant_id` isolation
- **Core Entities:** `tenants`, `users`, `garages`, `vehicles` are solid

### 🚨 **NEEDS CLEANUP:**
- **Legacy Tables:** 3 deprecated tables need removal
- **Duplicate Systems:** Multiple event tracking approaches
- **Missing Soft Deletes:** Some tables lack `deleted_at`

### 📊 **ESTIMATED TABLE COUNT:**
- **Active Tables:** ~10-12 tables
- **Deprecated Tables:** ~3-4 tables  
- **Total:** ~15-16 tables

## 🔧 **MAINTENANCE SCRIPT**

```sql
-- Run this to clean up deprecated tables (AFTER data migration)
BEGIN;

-- 1. Migrate data from legacy tables to vehicle_events
-- (Add migration scripts here)

-- 2. Remove deprecated tables
DROP TABLE IF EXISTS odometer_readings;
DROP TABLE IF EXISTS fuel_logs;
DROP TABLE IF EXISTS service_records;

-- 3. Add missing soft delete columns
ALTER TABLE garages ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE reminders ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- 4. Add performance indexes
CREATE INDEX IF NOT EXISTS idx_vehicle_events_vehicle_date 
  ON vehicle_events(vehicle_id, date DESC);

COMMIT;
```

---

**Next Steps:** Run the maintenance script and validate the simplified schema supports all current functionality.
