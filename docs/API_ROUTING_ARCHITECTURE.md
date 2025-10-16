# 🏗️ API Routing Architecture: Best Practices & Recommendations

**Date:** October 16, 2025  
**Status:** Analysis & Recommendations  
**Priority:** HIGH - Foundational Design

---

## 🎯 CORE QUESTION

**"Should our API be hierarchical (nested resources) or flat?"**

```
Hierarchical:
/api/vehicles/[vehicleId]/events/[eventId]

Flat:
/api/events/[eventId]

Answer: BOTH (Hybrid Approach) ✅
```

---

## 📊 CURRENT STATE ANALYSIS

### **What We Have Now:**

```
Mixed Approach (Inconsistent):

✅ GOOD:
- /api/vehicles/[id]/timeline/[eventId]  (hierarchical)
- /api/users/[userId]/favorite-stations  (hierarchical)

🟡 INCONSISTENT:
- /api/events/[id]                       (flat - direct access)
- /api/events/save                       (non-RESTful naming)
- /api/events/[id]/delete                (should use DELETE method)
- /api/events/[id]/edit                  (should use PATCH/PUT method)

❌ PROBLEMS:
- Unclear ownership (which vehicle owns this event?)
- Non-standard HTTP methods (using routes instead of methods)
- Hard to enforce permissions (can't easily check vehicle ownership)
- Confusing for developers
```

---

## 🏆 RECOMMENDED ARCHITECTURE

### **REST Best Practices: Resource-Oriented Design**

#### **Principle 1: Use HTTP Methods Properly**

```
❌ BAD (Current):
POST /api/events/save
GET  /api/events/[id]/delete
POST /api/events/[id]/edit

✅ GOOD (RESTful):
POST   /api/events              (create)
GET    /api/events/[id]         (read)
PATCH  /api/events/[id]         (update)
DELETE /api/events/[id]         (delete)
```

#### **Principle 2: Hierarchical for Ownership, Flat for Direct Access**

```
When to use HIERARCHICAL:
✅ Creating (establishing ownership)
✅ Listing (get all events for a vehicle)
✅ Scoped operations (only this vehicle's events)

When to use FLAT:
✅ Direct access (you already have the ID)
✅ Global operations (search across all events)
✅ Updates (event ID is sufficient)
```

---

## 🎯 RECOMMENDED API STRUCTURE

### **Vehicles API:**

```typescript
// List all vehicles (for current user/tenant)
GET    /api/vehicles
Response: { vehicles: [...] }

// Get specific vehicle
GET    /api/vehicles/[vehicleId]
Response: { vehicle: {...} }

// Create vehicle
POST   /api/vehicles
Body: { make, model, year, ... }
Response: { vehicle: {...} }

// Update vehicle
PATCH  /api/vehicles/[vehicleId]
Body: { nickname, ... }
Response: { vehicle: {...} }

// Delete vehicle
DELETE /api/vehicles/[vehicleId]
Response: { success: true }
```

---

### **Events API (Hierarchical - For Creation & Listing):**

```typescript
// List all events for a vehicle
GET    /api/vehicles/[vehicleId]/events
Query: ?type=fuel&limit=20&offset=0
Response: { events: [...], total: 100 }

// Create event for a vehicle
POST   /api/vehicles/[vehicleId]/events
Body: { type, date, miles, payload, ... }
Response: { event: {...} }

// Get vehicle timeline (alias)
GET    /api/vehicles/[vehicleId]/timeline
Response: { events: [...], stats: {...} }
```

**Benefits:**
- ✅ Clear ownership (this event belongs to this vehicle)
- ✅ Easy permission checks (can user access this vehicle?)
- ✅ Logical hierarchy (vehicles contain events)
- ✅ RESTful and intuitive

---

### **Events API (Flat - For Direct Access):**

```typescript
// Get specific event (when you have the ID)
GET    /api/events/[eventId]
Response: { event: {...}, vehicle: {...} }

// Update event
PATCH  /api/events/[eventId]
Body: { miles, notes, ... }
Response: { event: {...} }

// Delete event
DELETE /api/events/[eventId]
Response: { success: true }

// Restore soft-deleted event
POST   /api/events/[eventId]/restore
Response: { event: {...} }

// Geocode event location
POST   /api/events/[eventId]/geocode
Response: { event: {...}, address: "..." }

// Get related events (similar vendor, location, etc.)
GET    /api/events/[eventId]/related
Response: { events: [...] }

// Get weather for event
GET    /api/events/[eventId]/weather
Response: { weather: {...} }
```

**Benefits:**
- ✅ Fast direct access (no need to know vehicle ID)
- ✅ Simple when you already have event ID
- ✅ Standard HTTP methods (GET, PATCH, DELETE)
- ✅ Sub-resources for actions (geocode, restore)

---

### **Global Events API:**

```typescript
// Search all events across all vehicles
GET    /api/events
Query: ?type=fuel&start_date=2024-01-01&limit=50
Response: { events: [...], total: 250 }

// Get recent events (dashboard)
GET    /api/events/recent
Response: { events: [...] }

// Bulk operations
POST   /api/events/bulk-delete
Body: { eventIds: [...] }
Response: { deleted: 5 }
```

---

## 🗺️ COMPLETE API MAP

### **Recommended Structure:**

```
/api/
│
├── vehicles/
│   ├── GET    /                           # List vehicles
│   ├── POST   /                           # Create vehicle
│   ├── GET    /[vehicleId]                # Get vehicle
│   ├── PATCH  /[vehicleId]                # Update vehicle
│   ├── DELETE /[vehicleId]                # Delete vehicle
│   │
│   ├── GET    /[vehicleId]/events         # List events (HIERARCHICAL) ✅
│   ├── POST   /[vehicleId]/events         # Create event (HIERARCHICAL) ✅
│   ├── GET    /[vehicleId]/timeline       # Timeline view
│   ├── GET    /[vehicleId]/stats          # Vehicle stats
│   └── GET    /[vehicleId]/maintenance    # Maintenance schedule
│
├── events/
│   ├── GET    /                           # Search all events (GLOBAL)
│   ├── GET    /recent                     # Recent events
│   ├── GET    /[eventId]                  # Get event (FLAT) ✅
│   ├── PATCH  /[eventId]                  # Update event (FLAT) ✅
│   ├── DELETE /[eventId]                  # Delete event (FLAT) ✅
│   │
│   ├── POST   /[eventId]/restore          # Restore deleted
│   ├── POST   /[eventId]/geocode          # Geocode location
│   ├── GET    /[eventId]/related          # Related events
│   ├── GET    /[eventId]/weather          # Weather data
│   └── POST   /[eventId]/share            # Generate share link
│
├── garages/
│   ├── GET    /                           # List garages
│   ├── POST   /                           # Create garage
│   ├── GET    /[garageId]                 # Get garage
│   ├── PATCH  /[garageId]                 # Update garage
│   ├── DELETE /[garageId]                 # Delete garage
│   │
│   ├── GET    /[garageId]/vehicles        # Vehicles in garage
│   └── POST   /[garageId]/vehicles        # Assign vehicle to garage
│
├── users/
│   ├── GET    /[userId]                   # Get user
│   ├── PATCH  /[userId]                   # Update user
│   │
│   ├── GET    /[userId]/favorite-stations # Favorite gas stations ✅
│   ├── POST   /[userId]/favorite-stations # Add favorite
│   └── GET    /[userId]/preferences       # User preferences
│
├── vision/
│   ├── POST   /process                    # Process image
│   ├── POST   /extract-address            # Extract address
│   ├── GET    /cost-tracking              # Vision API costs
│   └── POST   /analyze-receipt            # Analyze receipt
│
├── ocr/
│   ├── POST   /extract-vin                # Extract VIN
│   └── POST   /extract-odometer           # Extract odometer
│
├── location/
│   ├── POST   /correct                    # Correct location
│   ├── GET    /search                     # Search locations
│   └── GET    /nearby                     # Nearby places
│
├── reports/
│   ├── GET    /[vehicleId]/pdf            # Generate PDF report
│   ├── GET    /[vehicleId]/maintenance    # Maintenance report
│   └── GET    /[vehicleId]/fuel-economy   # Fuel economy report
│
└── system/
    ├── GET    /health                     # Health check
    ├── GET    /metrics                    # System metrics
    └── GET    /status                     # System status
```

---

## 🎨 DESIGN PATTERNS

### **Pattern 1: Collection + Item**

```typescript
// Collection endpoint (plural)
GET  /api/vehicles        // List
POST /api/vehicles        // Create

// Item endpoint (singular with ID)
GET    /api/vehicles/[id]  // Read
PATCH  /api/vehicles/[id]  // Update
DELETE /api/vehicles/[id]  // Delete
```

### **Pattern 2: Nested Resources (Ownership)**

```typescript
// When resource BELONGS TO parent
POST /api/vehicles/[vehicleId]/events  // Event belongs to vehicle
GET  /api/vehicles/[vehicleId]/events  // List vehicle's events
GET  /api/users/[userId]/preferences   // Preferences belong to user
```

### **Pattern 3: Actions as Sub-Resources**

```typescript
// When action is more than simple CRUD
POST /api/events/[id]/geocode    // Action: geocode
POST /api/events/[id]/restore    // Action: restore
POST /api/vehicles/[id]/service  // Action: schedule service
```

### **Pattern 4: Query Parameters for Filtering**

```typescript
// Use query params, not routes
GET /api/events?type=fuel&vehicle_id=123&limit=20

// NOT this:
GET /api/events/fuel
GET /api/events/by-vehicle/123
```

---

## 🔧 MIGRATION PLAN

### **Phase 1: Keep Both (Transition Period)**

```
Current:
✅ /api/events/[id]                    (keep - works fine)
✅ /api/events/[id]/delete             (keep - but deprecate)
✅ /api/events/[id]/edit               (keep - but deprecate)

Add New:
✅ /api/vehicles/[vehicleId]/events    (POST - new way to create)
✅ /api/events (PATCH to [id])         (new way to update)
✅ /api/events (DELETE to [id])        (new way to delete)

Deprecate Old:
⚠️  /api/events/save                   (use POST /api/vehicles/[id]/events)
⚠️  /api/events/[id]/edit              (use PATCH /api/events/[id])
⚠️  /api/events/[id]/delete            (use DELETE /api/events/[id])
```

### **Phase 2: Align with REST Standards**

```typescript
// BEFORE (Non-RESTful):
POST /api/events/save
GET  /api/events/[id]/delete
POST /api/events/[id]/edit

// AFTER (RESTful):
POST   /api/vehicles/[vehicleId]/events  // Create with ownership
PATCH  /api/events/[id]                  // Update
DELETE /api/events/[id]                  // Delete

Benefits:
✅ Standard HTTP methods
✅ Clearer semantics
✅ Tool-friendly (Postman, OpenAPI)
✅ Industry standard
```

---

## 📋 IMPLEMENTATION CHECKLIST

### **Immediate Changes:**

```
1. ✅ Add hierarchical creation:
   POST /api/vehicles/[vehicleId]/events

2. ✅ Support PATCH on existing:
   PATCH /api/events/[id] (instead of /api/events/[id]/edit)

3. ✅ Support DELETE on existing:
   DELETE /api/events/[id] (instead of /api/events/[id]/delete)

4. ✅ Keep legacy endpoints during transition
   (Add deprecation warnings)

5. ✅ Update frontend to use new endpoints
   (One component at a time)

6. ✅ Add routing documentation
   (OpenAPI/Swagger spec)
```

### **Long-term Improvements:**

```
1. Generate OpenAPI spec from routes
2. Auto-generate TypeScript client
3. Add API versioning (/api/v2/)
4. Implement HATEOAS (hypermedia)
5. Add GraphQL (optional)
```

---

## 🎯 RECOMMENDED IMMEDIATE ACTION

### **Create Hybrid System (Best of Both Worlds):**

**For Creation (Hierarchical):**
```typescript
// NEW: Create event with clear ownership
POST /api/vehicles/[vehicleId]/events
{
  type: 'fuel',
  date: '2024-01-15',
  miles: 45000,
  ...
}

Benefits:
✅ Ownership is explicit
✅ Permission check is simple (can user access vehicle?)
✅ RESTful hierarchy
```

**For Updates/Deletes (Flat with HTTP Methods):**
```typescript
// IMPROVE: Use HTTP methods properly
PATCH  /api/events/[eventId]    // Update
DELETE /api/events/[eventId]    // Delete

Benefits:
✅ Standard REST
✅ Simple and direct
✅ Event ID is sufficient
```

**For Listing (Hierarchical OR Global):**
```typescript
// List vehicle's events
GET /api/vehicles/[vehicleId]/events

// Search all events
GET /api/events?vehicle_id=123&type=fuel

Benefits:
✅ Flexible queries
✅ Both approaches available
✅ Use whichever makes sense
```

---

## 💡 KEY PRINCIPLES

### **1. Resources are Nouns, Actions are Verbs**
```
✅ GET  /api/vehicles          (noun - resource)
✅ POST /api/events            (noun - resource)
❌ GET  /api/getVehicles       (verb in URL - bad)
❌ POST /api/createEvent       (verb in URL - bad)
```

### **2. HTTP Methods are the Verbs**
```
GET    = Read/Retrieve
POST   = Create
PATCH  = Partial Update
PUT    = Full Replace
DELETE = Remove
```

### **3. Hierarchy Shows Ownership**
```
/api/vehicles/[id]/events    = Events belong to vehicle
/api/users/[id]/preferences  = Preferences belong to user
/api/garages/[id]/vehicles   = Vehicles belong to garage
```

### **4. Keep URLs Clean and Predictable**
```
✅ /api/vehicles/123/events
✅ /api/events/456
✅ /api/users/789/preferences

❌ /api/getVehicleEvents/123
❌ /api/event-456-details
❌ /api/user_preferences_789
```

---

## 📚 RESOURCES

- [REST API Best Practices](https://restfulapi.net/)
- [Google API Design Guide](https://cloud.google.com/apis/design)
- [Microsoft REST API Guidelines](https://github.com/microsoft/api-guidelines)
- [OpenAPI Specification](https://swagger.io/specification/)

---

## 🎊 SUMMARY & RECOMMENDATIONS

### **Your Current Structure:**
```
Status: 🟡 MIXED (Some good, some inconsistent)

Issues:
- Non-standard HTTP method usage (/save, /delete, /edit as routes)
- Flat events API (no hierarchy for creation)
- Some routes are RESTful, others aren't
```

### **Recommended Structure:**
```
Status: ✅ HYBRID (Best of both worlds)

Approach:
1. Hierarchical for creation (POST /api/vehicles/[id]/events)
2. Flat for direct access (GET /api/events/[id])
3. Standard HTTP methods (PATCH, DELETE)
4. Actions as sub-resources (/geocode, /restore)

Benefits:
✅ RESTful and intuitive
✅ Clear ownership
✅ Easy permissions
✅ Industry standard
✅ Flexible and scalable
```

### **Migration Strategy:**
```
1. Add new endpoints (hierarchical + HTTP methods)
2. Keep old endpoints with deprecation warnings
3. Update frontend gradually
4. Remove old endpoints after 3 months
5. Document everything in OpenAPI spec
```

---

**Status:** Ready for Implementation  
**Impact:** HIGH - Better API design  
**Effort:** MEDIUM - Incremental migration  
**Risk:** LOW - Can run both during transition

---

**Next Step:** Implement hybrid approach during App Router migration! 🚀
