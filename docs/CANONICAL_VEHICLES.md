# 🎯 Canonical Vehicle System

**Status:** ✅ Complete - Foundation Ready  
**Date:** October 18, 2025

---

## 🚀 **OVERVIEW**

The Canonical Vehicle System enables **vehicle continuity across owners** and **household vehicle sharing**. One VIN = One canonical record, shared by all users.

---

## 🏗️ **ARCHITECTURE**

### **4 Core Tables:**

```
canonical_vehicles (One per VIN)
  ↓
  user_vehicles (Per tenant instance)
    ↓
    vehicle_ownership_history (Timeline)
    shared_vehicle_access (Household sharing)
```

### **Key Concepts:**

1. **Canonical Vehicle** - Single source of truth per VIN
2. **User Vehicle Instance** - Tenant-specific customization
3. **Ownership History** - Track vehicle lifecycle
4. **Shared Access** - Household/fleet sharing

---

## 📊 **DATABASE SCHEMA**

### **1. canonical_vehicles**
**Purpose:** One record per VIN (global, shared)

```sql
CREATE TABLE canonical_vehicles (
  id UUID PRIMARY KEY,
  vin TEXT UNIQUE NOT NULL,
  
  -- VIN decode data (shared)
  year INTEGER NOT NULL,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  trim TEXT,
  display_name TEXT NOT NULL,
  
  -- Specs
  body_type TEXT,
  engine TEXT,
  transmission TEXT,
  drive_type TEXT,
  fuel_type TEXT,
  extended_specs JSONB,
  
  -- Aggregated data
  total_owners INTEGER DEFAULT 1,
  first_registered_at TIMESTAMPTZ,
  last_active_at TIMESTAMPTZ,
  avg_annual_cost INTEGER,
  avg_mpg_city DECIMAL,
  avg_mpg_highway DECIMAL,
  common_issues JSONB,
  
  -- Metadata
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### **2. user_vehicles**
**Purpose:** Per-tenant vehicle instances

```sql
CREATE TABLE user_vehicles (
  id UUID PRIMARY KEY,
  canonical_vehicle_id UUID REFERENCES canonical_vehicles(id),
  
  -- Ownership
  tenant_id UUID NOT NULL,
  user_id TEXT NOT NULL, -- NextAuth ID
  
  -- Customization
  nickname TEXT,
  color TEXT,
  license_plate TEXT,
  purchase_date DATE,
  purchase_price INTEGER,
  current_mileage INTEGER,
  
  -- Privacy
  share_maintenance_history BOOLEAN DEFAULT false,
  share_cost_data BOOLEAN DEFAULT false,
  share_usage_patterns BOOLEAN DEFAULT false,
  
  -- Status
  status TEXT DEFAULT 'active',
  ownership_start_date TIMESTAMPTZ,
  ownership_end_date TIMESTAMPTZ,
  
  -- Constraint: One active vehicle per tenant
  UNIQUE(canonical_vehicle_id, tenant_id, status) 
    WHERE status = 'active'
);
```

### **3. vehicle_ownership_history**
**Purpose:** Track ownership timeline

```sql
CREATE TABLE vehicle_ownership_history (
  id UUID PRIMARY KEY,
  canonical_vehicle_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  user_id TEXT NOT NULL,
  
  -- Timeline
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  
  -- Mileage
  starting_mileage INTEGER,
  ending_mileage INTEGER,
  
  -- Transfer details
  transfer_type TEXT, -- purchase, sale, lease_end, etc.
  transfer_price INTEGER,
  transfer_notes TEXT
);
```

### **4. shared_vehicle_access**
**Purpose:** Household/fleet sharing

```sql
CREATE TABLE shared_vehicle_access (
  id UUID PRIMARY KEY,
  user_vehicle_id UUID NOT NULL,
  
  -- Sharing
  shared_with_user_id TEXT NOT NULL,
  shared_by_user_id TEXT NOT NULL,
  access_level TEXT NOT NULL, -- view, edit, full
  
  -- Permissions
  can_view_maintenance BOOLEAN DEFAULT true,
  can_add_maintenance BOOLEAN DEFAULT false,
  can_view_costs BOOLEAN DEFAULT true,
  can_edit_vehicle BOOLEAN DEFAULT false,
  
  -- Status
  status TEXT DEFAULT 'active',
  expires_at TIMESTAMPTZ,
  
  UNIQUE(user_vehicle_id, shared_with_user_id, status)
    WHERE status = 'active'
);
```

---

## 💻 **USAGE**

### **Add Vehicle by VIN**

```typescript
import { addVehicleByVIN } from '@/lib/vehicles'

const result = await addVehicleByVIN({
  vin: '1FTFW1ET5BFC10312',
  tenantId: 'tenant-123',
  userId: 'user-456',
  nickname: 'My Daily Driver',
  currentMileage: 45000,
  shareCostData: true // Opt-in to sharing
})

// Result:
{
  userVehicle: UserVehicle,
  vinData: VINDecodeResult,
  duplicate?: DuplicateVehicleDetection, // If already in garage
  historyPreview?: VehicleHistoryPreview, // If not first owner
  isNewCanonicalVehicle: boolean
}
```

### **Check for Duplicates**

```typescript
import { checkDuplicateVehicle } from '@/lib/vehicles'

const duplicate = await checkDuplicateVehicle(
  canonicalVehicleId,
  tenantId
)

if (duplicate.isDuplicate) {
  // Show: "Vehicle already in garage"
  // Suggest: Request shared access
}
```

### **Get Vehicle History Preview**

```typescript
import { getVehicleHistoryPreview } from '@/lib/vehicles'

const preview = await getVehicleHistoryPreview(canonicalVehicleId)

// Returns:
{
  totalOwners: 2,
  hasSharedHistory: true,
  anonymizedMaintenanceCount: 15,
  avgAnnualCost: 1200,
  avgMpg: { city: 28, highway: 36 },
  commonIssues: [...],
  lastKnownMileage: 85000
}
```

### **Mark Vehicle as Sold**

```typescript
import { updateUserVehicle, closeOwnershipHistory } from '@/lib/vehicles'

// 1. Update status
await updateUserVehicle(vehicleId, {
  status: 'sold',
  ownershipEndDate: new Date()
})

// 2. Close ownership history
await closeOwnershipHistory({
  canonicalVehicleId,
  tenantId,
  endedAt: new Date(),
  endingMileage: 95000,
  transferType: 'sale',
  transferPrice: 15000
})
```

---

## 🎯 **USE CASES**

### **1. Household Sharing**

**Scenario:** Dad and Mom share the family car

```typescript
// Dad adds vehicle
const dadVehicle = await addVehicleByVIN({
  vin: '1HGBH41...',
  tenantId: 'family-tenant',
  userId: 'dad-id',
  nickname: 'Family Car'
})

// Mom tries to add same vehicle
const momResult = await addVehicleByVIN({
  vin: '1HGBH41...',
  tenantId: 'family-tenant', // Same tenant!
  userId: 'mom-id'
})

// Returns:
{
  duplicate: {
    isDuplicate: true,
    existingVehicle: dadVehicle,
    message: "This vehicle is already in your garage",
    suggestedAction: "view_existing"
  }
}

// UI can show: "Request shared access from Dad"
```

### **2. Vehicle Transfer**

**Scenario:** User A sells to User B

```typescript
// User A marks as sold
await updateUserVehicle(userAVehicleId, {
  status: 'sold',
  ownershipEndDate: new Date()
})

await closeOwnershipHistory({
  canonicalVehicleId,
  tenantId: userATenantId,
  endedAt: new Date(),
  endingMileage: 85000,
  transferType: 'sale',
  transferPrice: 18000
})

// User B buys same vehicle
const userBResult = await addVehicleByVIN({
  vin: '1HGBH41...',
  tenantId: userBTenantId,
  userId: userBId
})

// User B sees:
{
  historyPreview: {
    totalOwners: 2, // Including them
    lastKnownMileage: 85000, // From User A
    avgAnnualCost: 1200, // If User A shared data
    commonIssues: [...] // Aggregated
  }
}
```

### **3. Fleet Management**

**Scenario:** Multiple drivers, one vehicle

```typescript
// Driver A (Week 1-2)
const driverAVehicle = await addVehicleByVIN({
  vin: 'FLEET001...',
  tenantId: 'fleet-tenant',
  userId: 'driver-a-id'
})

// Driver B (Week 3-4) - Same tenant
const driverBResult = await addVehicleByVIN({
  vin: 'FLEET001...',
  tenantId: 'fleet-tenant', // Same tenant!
  userId: 'driver-b-id'
})

// Duplicate detected - suggests shared access
// Fleet manager can set up sharing permissions
```

---

## 🔒 **PRIVACY & DATA SHARING**

### **Opt-In Sharing**

Users control what they share:

```typescript
await updateUserVehicle(vehicleId, {
  shareMaintenanceHistory: true,  // Share service records
  shareCostData: true,            // Share expenses
  shareUsagePatterns: false       // Don't share mileage/trips
})
```

### **Anonymization**

When data is shared:
- ✅ Maintenance records (anonymized)
- ✅ Costs (aggregated)
- ✅ Common issues (no personal info)
- ❌ Owner names
- ❌ Exact locations
- ❌ License plates

### **Data Aggregation**

```typescript
// Update aggregated data for canonical vehicle
await updateCanonicalVehicleAggregates(canonicalVehicleId)

// Calculates from users who opted in:
// - avg_annual_cost
// - avg_mpg_city/highway
// - common_issues
```

---

## 📈 **BENEFITS**

### **For Users:**
- ✅ See previous maintenance history when buying used
- ✅ Share vehicles with household members
- ✅ Better estimates from crowdsourced data
- ✅ Vehicle continuity across ownership

### **For Business:**
- ✅ Network effects (more users = better data)
- ✅ Premium feature opportunity (vehicle history reports)
- ✅ B2B opportunity (fleet management)
- ✅ Data product (real-world vehicle insights)

### **Competitive Advantage:**
- ✅ Carfax: One-time report per purchase
- ✅ You: Continuous tracking + community data
- ✅ No competitor does household sharing well

---

## 🚀 **MIGRATION**

### **Existing Data:**

```bash
# Run migration script
npx tsx scripts/migrate-to-canonical-vehicles.ts

# This will:
# 1. Create canonical vehicles from existing vehicles
# 2. Convert to user_vehicles instances
# 3. Create ownership history records
# 4. Handle vehicles without VINs (create placeholders)
```

### **Zero Downtime:**
- ✅ Old `vehicles` table can coexist during migration
- ✅ Create views for backwards compatibility
- ✅ Gradually migrate queries
- ✅ Drop old table when confident

---

## 📊 **METRICS TO TRACK**

### **Canonical Vehicle Metrics:**
```sql
-- Total canonical vehicles
SELECT COUNT(*) FROM canonical_vehicles;

-- Vehicles with multiple owners
SELECT COUNT(*) FROM canonical_vehicles 
WHERE total_owners > 1;

-- Average owners per vehicle
SELECT AVG(total_owners) FROM canonical_vehicles;
```

### **Duplicate Detection:**
```sql
-- How often duplicates are detected
SELECT COUNT(*) FROM user_vehicles uv1
JOIN user_vehicles uv2 
  ON uv1.canonical_vehicle_id = uv2.canonical_vehicle_id
  AND uv1.tenant_id = uv2.tenant_id
  AND uv1.id != uv2.id;
```

### **Data Sharing:**
```sql
-- Users who opt in to sharing
SELECT 
  COUNT(*) FILTER (WHERE share_maintenance_history) as maintenance_sharers,
  COUNT(*) FILTER (WHERE share_cost_data) as cost_sharers,
  COUNT(*) FILTER (WHERE share_usage_patterns) as usage_sharers
FROM user_vehicles;
```

---

## 🎯 **FUTURE ENHANCEMENTS**

### **Phase 2: Sharing UI (Week 3-4)**
- Request shared access button
- Manage sharing screen
- Permission levels
- Invitation system

### **Phase 3: History Reports (Week 5-6)**
- Premium vehicle history ($4.99)
- Anonymized maintenance records
- Common issues report
- Value estimation

### **Phase 4: Fleet Management (Month 2-3)**
- Driver assignment
- Vehicle rotation tracking
- Cost allocation
- Fleet analytics dashboard

---

## ✅ **CHECKLIST**

**Database:**
- [x] Migration created: `20251018_11_canonical_vehicles.sql`
- [x] 4 tables: canonical_vehicles, user_vehicles, ownership_history, shared_access
- [x] Indexes for performance
- [x] RLS policies (permissive)
- [x] Helper functions

**Code:**
- [x] Types: `lib/vehicles/canonical-types.ts`
- [x] Service: `lib/vehicles/canonical-service.ts`
- [x] Add vehicle: `lib/vehicles/add-vehicle.ts`
- [x] Exports: `lib/vehicles/index.ts`

**Migration:**
- [x] Migration script: `scripts/migrate-to-canonical-vehicles.ts`
- [x] Handles existing data
- [x] Handles vehicles without VINs
- [x] Zero downtime strategy

**Documentation:**
- [x] This guide: `docs/CANONICAL_VEHICLES.md`
- [x] Architecture explained
- [x] Usage examples
- [x] Privacy considerations

---

## 🎊 **READY TO DEPLOY**

**Status:** ✅ Foundation Complete

**Next Steps:**
1. Apply database migration
2. Run migration script for existing data
3. Update VIN onboarding to use `addVehicleByVIN()`
4. Test duplicate detection
5. Monitor in production

**Lines of Code:**
- Migration: ~500 lines
- Types: ~350 lines
- Service: ~650 lines
- Add vehicle: ~150 lines
- Migration script: ~400 lines
- **Total: ~2,050 lines**

**Build Time:** ~4 hours

**Value:** 🔥 Foundation for multi-tenant vehicle tracking, household sharing, and premium features.

---

**The right foundation, from day one.** 🚀
