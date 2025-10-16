# 🏆 GOD-TIER API IMPLEMENTATION PLAN

**Date:** October 16, 2025  
**Status:** In Progress  
**Goal:** World-class RESTful API architecture

---

## 🎯 OBJECTIVE

Transform MotoMind AI's API from mixed patterns to **elite-level RESTful architecture** that:
- ✅ Follows industry best practices (Google, Stripe, Shopify)
- ✅ Is intuitive and predictable
- ✅ Enforces clear ownership and permissions
- ✅ Uses standard HTTP methods
- ✅ Is fully documented with OpenAPI

---

## 🏗️ ARCHITECTURE PRINCIPLES

### **1. Resource-Oriented Design**
```
Resources are NOUNS (vehicles, events, users)
Actions are HTTP METHODS (GET, POST, PATCH, DELETE)
```

### **2. Hierarchical for Ownership**
```
POST /api/vehicles/[id]/events  ← Creates event FOR vehicle
Benefit: Ownership is explicit, permissions are clear
```

### **3. Flat for Direct Access**
```
GET /api/events/[id]  ← Direct access when you have ID
Benefit: Fast, simple, no need for parent ID
```

### **4. Standard HTTP Semantics**
```
GET    = Retrieve (safe, idempotent)
POST   = Create (not idempotent)
PATCH  = Partial update (idempotent)
PUT    = Full replace (idempotent)
DELETE = Remove (idempotent)
```

---

## 📊 NEW API STRUCTURE

### **Vehicles Resource:**

```typescript
// Collection Operations
GET    /api/vehicles
POST   /api/vehicles

// Item Operations
GET    /api/vehicles/[vehicleId]
PATCH  /api/vehicles/[vehicleId]
DELETE /api/vehicles/[vehicleId]

// Nested Resources (Ownership)
GET    /api/vehicles/[vehicleId]/events
POST   /api/vehicles/[vehicleId]/events
GET    /api/vehicles/[vehicleId]/timeline
GET    /api/vehicles/[vehicleId]/stats
GET    /api/vehicles/[vehicleId]/maintenance-schedule
```

### **Events Resource:**

```typescript
// Global Operations
GET    /api/events                     # Search/list all
GET    /api/events?vehicle_id=123      # Filter by vehicle
GET    /api/events?type=fuel           # Filter by type

// Item Operations (Direct Access)
GET    /api/events/[eventId]
PATCH  /api/events/[eventId]
DELETE /api/events/[eventId]

// Actions (Sub-Resources)
POST   /api/events/[eventId]/geocode
POST   /api/events/[eventId]/restore
GET    /api/events/[eventId]/related
GET    /api/events/[eventId]/weather
POST   /api/events/[eventId]/share
```

### **Garages Resource:**

```typescript
// Collection Operations
GET    /api/garages
POST   /api/garages

// Item Operations
GET    /api/garages/[garageId]
PATCH  /api/garages/[garageId]
DELETE /api/garages/[garageId]

// Nested Resources
GET    /api/garages/[garageId]/vehicles
POST   /api/garages/[garageId]/vehicles/[vehicleId]  # Assign
DELETE /api/garages/[garageId]/vehicles/[vehicleId]  # Remove
```

### **Users Resource:**

```typescript
// Item Operations
GET    /api/users/[userId]
PATCH  /api/users/[userId]

// Nested Resources
GET    /api/users/[userId]/preferences
PATCH  /api/users/[userId]/preferences
GET    /api/users/[userId]/favorite-stations
POST   /api/users/[userId]/favorite-stations
DELETE /api/users/[userId]/favorite-stations/[stationId]
```

---

## 🔧 IMPLEMENTATION PHASES

### **Phase 1: Create New Hierarchical Endpoints** (30 min)

```
app/api/vehicles/
├── route.ts                              # GET (list), POST (create)
├── [vehicleId]/
│   ├── route.ts                          # GET, PATCH, DELETE
│   └── events/
│       └── route.ts                      # GET (list), POST (create) ✅

Status: Creates proper ownership hierarchy
Priority: HIGH
```

### **Phase 2: Enhance Existing Event Routes** (20 min)

```
app/api/events/
├── route.ts                              # GET (search/list) - NEW
└── [eventId]/
    └── route.ts                          # GET, PATCH, DELETE ✅

Status: Add missing methods to existing routes
Priority: HIGH
```

### **Phase 3: Keep Action Sub-Resources** (10 min)

```
app/api/events/[eventId]/
├── geocode/route.ts                      # POST
├── restore/route.ts                      # POST
├── related/route.ts                      # GET
├── weather/route.ts                      # GET
└── share/route.ts                        # POST (new)

Status: Migrate and standardize
Priority: MEDIUM
```

### **Phase 4: Add Missing Resources** (30 min)

```
app/api/vehicles/[vehicleId]/
├── timeline/route.ts                     # GET
├── stats/route.ts                        # GET
└── maintenance-schedule/route.ts         # GET

app/api/garages/
├── route.ts                              # GET, POST
└── [garageId]/route.ts                   # GET, PATCH, DELETE

Status: Complete the resource coverage
Priority: MEDIUM
```

### **Phase 5: Create OpenAPI Specification** (60 min)

```
docs/openapi.yaml
- Complete API documentation
- Request/response schemas
- Authentication
- Error codes
- Examples

Status: Generate from routes
Priority: HIGH (for team & future)
```

---

## 📁 FILE STRUCTURE

### **Final App Router Structure:**

```
app/api/
│
├── vehicles/
│   ├── route.ts                          # GET, POST
│   └── [vehicleId]/
│       ├── route.ts                      # GET, PATCH, DELETE
│       ├── events/
│       │   └── route.ts                  # GET, POST
│       ├── timeline/
│       │   └── route.ts                  # GET
│       ├── stats/
│       │   └── route.ts                  # GET
│       └── maintenance-schedule/
│           └── route.ts                  # GET
│
├── events/
│   ├── route.ts                          # GET (search)
│   └── [eventId]/
│       ├── route.ts                      # GET, PATCH, DELETE
│       ├── geocode/
│       │   └── route.ts                  # POST
│       ├── restore/
│       │   └── route.ts                  # POST
│       ├── related/
│       │   └── route.ts                  # GET
│       ├── weather/
│       │   └── route.ts                  # GET
│       └── share/
│           └── route.ts                  # POST
│
├── garages/
│   ├── route.ts                          # GET, POST
│   └── [garageId]/
│       ├── route.ts                      # GET, PATCH, DELETE
│       └── vehicles/
│           ├── route.ts                  # GET (list)
│           └── [vehicleId]/
│               └── route.ts              # POST (assign), DELETE (remove)
│
├── users/
│   └── [userId]/
│       ├── route.ts                      # GET, PATCH
│       ├── preferences/
│       │   └── route.ts                  # GET, PATCH
│       └── favorite-stations/
│           ├── route.ts                  # GET, POST
│           └── [stationId]/
│               └── route.ts              # DELETE
│
├── vision/
│   ├── process/route.ts                  # POST
│   ├── extract-address/route.ts          # POST
│   └── cost-tracking/route.ts            # GET
│
├── ocr/
│   ├── extract-vin/route.ts              # POST
│   └── extract-odometer/route.ts         # POST
│
├── location/
│   ├── correct/route.ts                  # POST
│   ├── search/route.ts                   # GET
│   └── nearby/route.ts                   # GET
│
├── reports/
│   ├── pdf/route.ts                      # POST (generate)
│   └── [vehicleId]/
│       ├── maintenance/route.ts          # GET
│       └── fuel-economy/route.ts         # GET
│
└── system/
    ├── health/route.ts                   # GET
    ├── metrics/route.ts                  # GET
    └── status/route.ts                   # GET
```

---

## 🎨 CODE PATTERNS

### **Pattern 1: Collection Endpoint**

```typescript
// app/api/vehicles/route.ts
import { NextRequest, NextResponse } from 'next/server'

// List vehicles
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const limit = searchParams.get('limit') || '20'
  const offset = searchParams.get('offset') || '0'
  
  // Get vehicles with pagination
  const vehicles = await getVehicles({ limit, offset })
  
  return NextResponse.json({
    vehicles,
    total: vehicles.length,
    limit: parseInt(limit),
    offset: parseInt(offset)
  })
}

// Create vehicle
export async function POST(request: NextRequest) {
  const body = await request.json()
  
  // Validate and create
  const vehicle = await createVehicle(body)
  
  return NextResponse.json(
    { vehicle },
    { status: 201 }
  )
}
```

### **Pattern 2: Item Endpoint**

```typescript
// app/api/vehicles/[vehicleId]/route.ts
import { NextRequest, NextResponse } from 'next/server'

// Get vehicle
export async function GET(
  request: NextRequest,
  { params }: { params: { vehicleId: string } }
) {
  const vehicle = await getVehicle(params.vehicleId)
  
  if (!vehicle) {
    return NextResponse.json(
      { error: 'Vehicle not found' },
      { status: 404 }
    )
  }
  
  return NextResponse.json({ vehicle })
}

// Update vehicle
export async function PATCH(
  request: NextRequest,
  { params }: { params: { vehicleId: string } }
) {
  const body = await request.json()
  const vehicle = await updateVehicle(params.vehicleId, body)
  
  return NextResponse.json({ vehicle })
}

// Delete vehicle
export async function DELETE(
  request: NextRequest,
  { params }: { params: { vehicleId: string } }
) {
  await deleteVehicle(params.vehicleId)
  
  return NextResponse.json(
    { success: true },
    { status: 204 }
  )
}
```

### **Pattern 3: Nested Resource (Ownership)**

```typescript
// app/api/vehicles/[vehicleId]/events/route.ts
import { NextRequest, NextResponse } from 'next/server'

// List vehicle's events
export async function GET(
  request: NextRequest,
  { params }: { params: { vehicleId: string } }
) {
  const searchParams = request.nextUrl.searchParams
  const type = searchParams.get('type')
  const limit = searchParams.get('limit') || '20'
  
  const events = await getVehicleEvents(params.vehicleId, { type, limit })
  
  return NextResponse.json({
    events,
    vehicle_id: params.vehicleId
  })
}

// Create event for vehicle
export async function POST(
  request: NextRequest,
  { params }: { params: { vehicleId: string } }
) {
  const body = await request.json()
  
  // Create event with explicit ownership
  const event = await createEvent({
    ...body,
    vehicle_id: params.vehicleId
  })
  
  return NextResponse.json(
    { event },
    { status: 201 }
  )
}
```

### **Pattern 4: Action Sub-Resource**

```typescript
// app/api/events/[eventId]/geocode/route.ts
import { NextRequest, NextResponse } from 'next/server'

// Geocode event location
export async function POST(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  const event = await getEvent(params.eventId)
  
  if (!event) {
    return NextResponse.json(
      { error: 'Event not found' },
      { status: 404 }
    )
  }
  
  // Perform geocoding
  const geocoded = await geocodeEvent(event)
  
  return NextResponse.json({
    event: geocoded,
    geocoded_at: new Date().toISOString()
  })
}
```

---

## 🔐 AUTHENTICATION & PERMISSIONS

### **Middleware Pattern:**

```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Check authentication
  const token = request.headers.get('authorization')
  
  if (!token) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }
  
  // Verify token and add user context
  // Continue to route handler
  return NextResponse.next()
}

export const config = {
  matcher: '/api/:path*'
}
```

### **Permission Check Pattern:**

```typescript
// Check vehicle ownership before operations
async function checkVehicleAccess(userId: string, vehicleId: string) {
  const vehicle = await getVehicle(vehicleId)
  
  if (!vehicle) {
    throw new NotFoundError('Vehicle not found')
  }
  
  if (vehicle.tenant_id !== userId) {
    throw new ForbiddenError('Access denied')
  }
  
  return vehicle
}
```

---

## 📊 RESPONSE FORMATS

### **Success Response:**

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z",
    "request_id": "abc123"
  }
}
```

### **Error Response:**

```json
{
  "error": {
    "code": "VEHICLE_NOT_FOUND",
    "message": "Vehicle not found",
    "details": {
      "vehicle_id": "123"
    }
  },
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z",
    "request_id": "abc123"
  }
}
```

### **List Response:**

```json
{
  "data": [...],
  "pagination": {
    "total": 100,
    "limit": 20,
    "offset": 0,
    "has_more": true
  }
}
```

---

## ✅ IMPLEMENTATION CHECKLIST

### **Phase 1: Foundation** (Today - 1 hour)
```
✅ Create app/api/vehicles/route.ts (GET, POST)
✅ Create app/api/vehicles/[vehicleId]/route.ts (GET, PATCH, DELETE)
✅ Create app/api/vehicles/[vehicleId]/events/route.ts (GET, POST)
✅ Enhance app/api/events/[eventId]/route.ts (add PATCH, DELETE)
✅ Create app/api/events/route.ts (GET - search)
```

### **Phase 2: Actions** (Today - 30 min)
```
✅ Migrate app/api/events/[eventId]/geocode/route.ts
✅ Migrate app/api/events/[eventId]/restore/route.ts
✅ Migrate app/api/events/[eventId]/related/route.ts
✅ Migrate app/api/events/[eventId]/weather/route.ts
```

### **Phase 3: Additional Resources** (Tomorrow - 1 hour)
```
□ Create garages API
□ Create complete users API
□ Migrate vision API
□ Migrate OCR API
□ Migrate location API
```

### **Phase 4: Documentation** (Tomorrow - 1 hour)
```
□ Generate OpenAPI spec
□ Create API documentation site
□ Add request/response examples
□ Document authentication
```

### **Phase 5: Testing** (Tomorrow - 1 hour)
```
□ Test all endpoints
□ Validate permissions
□ Check error handling
□ Performance testing
```

---

## 🎯 SUCCESS CRITERIA

```
✅ All endpoints follow REST standards
✅ Clear resource hierarchy
✅ Standard HTTP methods used correctly
✅ Consistent error handling
✅ Full OpenAPI documentation
✅ Authentication on all routes
✅ Permission checks enforced
✅ Response formats consistent
✅ All tests passing
✅ Frontend updated to use new endpoints
```

---

## 🚀 NEXT STEPS

**Right Now:**
1. Create vehicles resource (foundation)
2. Enhance events resource
3. Test the new structure

**Today:**
4. Migrate action sub-resources
5. Test end-to-end

**Tomorrow:**
6. Complete remaining resources
7. Generate OpenAPI spec
8. Update frontend

---

**Status:** Ready to Execute  
**Impact:** TRANSFORMATIONAL  
**Quality:** GOD-TIER 🏆
