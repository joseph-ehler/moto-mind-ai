# 🔍 API-DATABASE ALIGNMENT AUDIT REPORT

**Generated:** 2025-10-16T17:11:49.554Z

---

## 📊 EXECUTIVE SUMMARY

```
Existing Tables:       21
Expected Tables:       7
Missing Tables:        1 ❌ CRITICAL
Missing Indexes:       8 ⚠️  ACTION NEEDED
RLS Issues:            6 🚨 SECURITY RISK
Performance Warnings:  9 🟡 OPTIMIZATION NEEDED
```

**🚨 STATUS: NOT PRODUCTION READY (12 critical issues)**

---

## ❌ MISSING TABLES (CRITICAL)

These tables are referenced by API routes but do not exist in the database:

### `users`

**Description:** Used by API routes

**Used by:**
- `app/api/users/[userId]/preferences/route.ts`

**Expected columns:** preferences

---

## 🔒 RLS SECURITY ISSUES

### 🚨 CRITICAL (Action Required)

- **`favorite_stations`**: User data table without RLS protection
- **`garages`**: User data table without RLS protection
- **`profiles`**: User data table without RLS protection
- **`user_maintenance_preferences`**: User data table without RLS protection
- **`vehicle_events`**: User data table without RLS protection
- **`vehicles`**: User data table without RLS protection

---

## 📈 RECOMMENDED INDEXES

### 🚨 CRITICAL (Add Immediately)

#### `vehicles` → `(tenant_id)`
**Reason:** Tenant isolation - critical for RLS performance

```sql
CREATE INDEX idx_vehicles_tenant_id
ON vehicles (tenant_id);
```

#### `vehicle_events` → `(tenant_id)`
**Reason:** Tenant isolation - critical for RLS performance

```sql
CREATE INDEX idx_vehicle_events_tenant_id
ON vehicle_events (tenant_id);
```

#### `garages` → `(tenant_id)`
**Reason:** Tenant isolation - critical for RLS performance

```sql
CREATE INDEX idx_garages_tenant_id
ON garages (tenant_id);
```

#### `favorite_stations` → `(tenant_id)`
**Reason:** Tenant isolation - critical for RLS performance

```sql
CREATE INDEX idx_favorite_stations_tenant_id
ON favorite_stations (tenant_id);
```

#### `favorite_stations` → `(user_id)`
**Reason:** User data filtering

```sql
CREATE INDEX idx_favorite_stations_user_id
ON favorite_stations (user_id);
```

### ⚠️  HIGH PRIORITY

- **`vehicle_events`** → `(vehicle_id)`: Foreign key lookups

### 🟡 MEDIUM PRIORITY

- **`vehicle_events`** → `(tenant_id, date)`: Date range queries with tenant isolation
- **`vehicles`** → `(tenant_id, date)`: Date range queries with tenant isolation

---

## ⚡ PERFORMANCE WARNINGS

### `vehicle_events`
**Warning:** Geospatial queries without PostGIS indexes

**Impact:** Slow location-based searches - recommend adding geography column with GIST index

### `multiple`
**Warning:** Potential N+1 query pattern detected

**Impact:** Multiple sequential database calls - consider JOIN or batch queries

### `favorite_stations`
**Warning:** Geospatial queries without PostGIS indexes

**Impact:** Slow location-based searches - recommend adding geography column with GIST index

### `vehicle_events`
**Warning:** Geospatial queries without PostGIS indexes

**Impact:** Slow location-based searches - recommend adding geography column with GIST index

### `vehicle_events`
**Warning:** Geospatial queries without PostGIS indexes

**Impact:** Slow location-based searches - recommend adding geography column with GIST index

### `vehicle_events`
**Warning:** Geospatial queries without PostGIS indexes

**Impact:** Slow location-based searches - recommend adding geography column with GIST index

### `vehicle_events`
**Warning:** Geospatial queries without PostGIS indexes

**Impact:** Slow location-based searches - recommend adding geography column with GIST index

### `vehicle_events`
**Warning:** Geospatial queries without PostGIS indexes

**Impact:** Slow location-based searches - recommend adding geography column with GIST index

### `vehicle_events`
**Warning:** Geospatial queries without PostGIS indexes

**Impact:** Slow location-based searches - recommend adding geography column with GIST index

---

## 📋 ALL EXPECTED TABLES

### ✅ `vehicles`
**Status:** Exists

**Used by 13 route(s):**
- `app/api/vehicles/route.ts`
- `app/api/vehicles/[vehicleId]/route.ts`
- `app/api/garages/[garageId]/route.ts`
- ... and 10 more

### ✅ `vehicle_events`
**Status:** Exists

**Used by 24 route(s):**
- `app/api/stations/route.ts`
- `app/api/search/route.ts`
- `app/api/events/route.ts`
- ... and 21 more

### ✅ `logs`
**Status:** Exists

**Used by 1 route(s):**
- `app/api/logs/route.ts`

### ✅ `garages`
**Status:** Exists

**Used by 4 route(s):**
- `app/api/garages/route.ts`
- `app/api/garages/[garageId]/route.ts`
- `app/api/garages/[garageId]/vehicles/route.ts`
- ... and 1 more

### ✅ `favorite_stations`
**Status:** Exists

**Used by 2 route(s):**
- `app/api/stations/favorites/route.ts`
- `app/api/stations/[stationId]/favorite/route.ts`

### ✅ `vehicle_images`
**Status:** Exists

**Used by 1 route(s):**
- `app/api/events/[id]/route.ts`

### ❌ `users`
**Status:** MISSING

**Used by 1 route(s):**
- `app/api/users/[userId]/preferences/route.ts`

---

**End of Report**
