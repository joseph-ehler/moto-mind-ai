# MotoMind Supabase Schema Introspection Report

**Generated:** 2025-09-26T00:02:54.035Z
**Database:** postgres
**Schema:** public

## Summary Statistics

- **Tables:** 10
- **Columns:** 75
- **Relationships:** 10
- **Total Records:** 30

## Table Details


### vehicles

**Rows:** 5  
**Columns:** 20

#### Column Schema
| Column | Type | Nullable | PK | FK | Foreign Reference |
|--------|------|----------|----|----|-------------------|
| id | uuid | ❌ | 🔑 |  |  |
| tenant_id | uuid | ❌ |  | 🔗 | tenants.id |
| label | text | ❌ |  |  |  |
| make | text | ❌ |  |  |  |
| model | text | ❌ |  |  |  |
| vin | text | ❌ |  |  |  |
| baseline_fuel_mpg | integer | ✅ |  |  |  |
| baseline_service_interval_miles | integer | ❌ |  |  |  |
| notes | text | ✅ |  |  |  |
| created_at | text | ❌ |  |  |  |
| updated_at | text | ❌ |  |  |  |
| nickname | text | ✅ |  |  |  |
| garage_id | uuid | ❌ |  | 🔗 | garages.id |
| enrichment | jsonb | ❌ |  |  |  |
| service_intervals | jsonb | ❌ |  |  |  |
| smart_defaults | jsonb | ❌ |  |  |  |
| deleted_at | unknown | ✅ |  |  |  |
| photo_url | unknown | ✅ |  |  |  |
| hero_image_url | text | ✅ |  |  |  |
| display_name | text | ❌ |  |  |  |

#### Sample Data
```json
[
  {
    "id": "fb7832b3-2218-4bb0-8696-8e27b8a172bc",
    "tenant_id": "550e8400-e29b-41d4-a716-446655440000",
    "label": "2022 CHRYSLER 300",
    "make": "CHRYSLER",
    "model": "300",
    "vin": "2C3CCADG7NH116370",
    "baseline_fuel_mpg": null,
    "baseline_service_interval_miles": 5000,
    "notes": null,
    "created_at": "2025-09-25T12:36:55.827678+00:00",
    "updated_at": "2025-09-25T23:49:25.541453+00:00",
    "nickname": "2022 CHRYSLER 300",
    "garage_id": "0687b6ef-193c-44a1-abaa-436a96ba7fe5",
    "enrichment": {
      "year": 2022,
      "engine": {
        "cylinders": 6,
        "fuel_type": "Gasoline"
      },
      "body_class": "Sedan/Saloon",
      "drivetrain": "RWD/Rear-Wheel Drive",
      "manufactured": {
        "state": "ONTARIO",
        "country": "CANADA"
      },
      "transmission": "Automatic"
    },
    "service_intervals": {},
    "smart_defaults": {
      "baseline_mpg": 22,
      "service_intervals": {
        "oil_change_miles": 5000,
        "tire_rotation_miles": 7500,
        "brake_inspection_miles": 10000
      },
      "maintenance_schedule": []
    },
    "deleted_at": null,
    "photo_url": null,
    "hero_image_url": null,
    "display_name": "2022 CHRYSLER 300"
  },
  {
    "id": "9e412dca-7d8f-4410-a2b1-3d3042369a4d",
    "tenant_id": "550e8400-e29b-41d4-a716-446655440000",
    "label": "2013 CHEVROLET Captiva Sport",
    "make": "CHEVROLET",
    "model": "Captiva Sport",
    "vin": "3GNAL4EK7DS559435",
    "baseline_fuel_mpg": null,
    "baseline_service_interval_miles": 5000,
    "notes": null,
    "created_at": "2025-09-25T06:48:12.496001+00:00",
    "updated_at": "2025-09-25T23:44:00.144623+00:00",
    "nickname": "2013 CHEVROLET Captiva Sport",
    "garage_id": "709a1a50-1409-4224-b8ad-0f3b004bd365",
    "enrichment": {
      "trim": "LTZ",
      "year": 2013,
      "engine": {
        "model": "LEA - Flex Fuel (Gas/Alc), Aluminum, High Output",
        "cylinders": 4,
        "fuel_type": "Gasoline"
      },
      "body_class": "Sport Utility Vehicle (SUV)/Multi-Purpose Vehicle (MPV)",
      "drivetrain": "FWD/Front-Wheel Drive",
      "manufactured": {
        "state": "COAHUILA",
        "country": "MEXICO"
      },
      "transmission": "Unknown"
    },
    "service_intervals": {},
    "smart_defaults": {
      "baseline_mpg": 28,
      "service_intervals": {
        "oil_change_miles": 5000,
        "tire_rotation_miles": 7500,
        "brake_inspection_miles": 10000
      },
      "maintenance_schedule": [
        {
          "type": "timing_belt",
          "priority": "high",
          "due_miles": 100000
        },
        {
          "type": "coolant_flush",
          "priority": "medium",
          "due_miles": 60000
        },
        {
          "type": "transmission_service",
          "priority": "medium",
          "due_miles": 60000
        },
        {
          "type": "brake_fluid",
          "priority": "medium",
          "due_miles": 30000
        }
      ]
    },
    "deleted_at": null,
    "photo_url": null,
    "hero_image_url": "https://ucbbzzoimghnaoihyqbd.supabase.co/storage/v1/object/public/vehicle-images/vehicle-photos/3GNAL4EK7DS559435-1758782882841.png",
    "display_name": "2013 CHEVROLET Captiva Sport"
  }
]
```


### garages

**Rows:** 4  
**Columns:** 11

#### Column Schema
| Column | Type | Nullable | PK | FK | Foreign Reference |
|--------|------|----------|----|----|-------------------|
| id | uuid | ❌ | 🔑 |  |  |
| tenant_id | uuid | ❌ |  | 🔗 | tenants.id |
| name | text | ❌ |  |  |  |
| address | text | ❌ |  |  |  |
| lat | numeric | ❌ |  |  |  |
| lng | numeric | ❌ |  |  |  |
| timezone | text | ❌ |  |  |  |
| meta | jsonb | ❌ |  |  |  |
| created_at | text | ❌ |  |  |  |
| updated_at | text | ❌ |  |  |  |
| is_default | boolean | ❌ |  |  |  |

#### Sample Data
```json
[
  {
    "id": "709a1a50-1409-4224-b8ad-0f3b004bd365",
    "tenant_id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Garage at Starke",
    "address": "Starke, Florida, US",
    "lat": 29.9447560659028,
    "lng": -82.1200978000748,
    "timezone": "America/New_York",
    "meta": {},
    "created_at": "2025-09-24T05:37:27.489063+00:00",
    "updated_at": "2025-09-24T05:37:27.489063+00:00",
    "is_default": false
  },
  {
    "id": "2719e991-f936-4c24-8a52-a4774dceef5f",
    "tenant_id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "My Garage",
    "address": "123 Main St, Anytown, FL 32000",
    "lat": 29.6516,
    "lng": -82.3248,
    "timezone": "America/New_York",
    "meta": {},
    "created_at": "2025-09-25T19:54:41.503427+00:00",
    "updated_at": "2025-09-25T19:54:41.503427+00:00",
    "is_default": true
  }
]
```


### vehicle_events

**Rows:** 1  
**Columns:** 7

#### Column Schema
| Column | Type | Nullable | PK | FK | Foreign Reference |
|--------|------|----------|----|----|-------------------|
| id | uuid | ❌ | 🔑 |  |  |
| vehicle_id | uuid | ❌ |  | 🔗 | vehicles.id |
| type | text | ❌ |  |  |  |
| date | text | ❌ |  |  |  |
| miles | integer | ❌ |  |  |  |
| payload | jsonb | ❌ |  |  |  |
| created_at | text | ❌ |  |  |  |

#### Sample Data
```json
[
  {
    "id": "cebf0766-78fa-40d0-8d92-d96d33057cec",
    "vehicle_id": "cf1e58a5-d456-4a17-ae82-273ef0e65f9d",
    "type": "odometer",
    "date": "2025-06-17",
    "miles": 52000,
    "payload": {
      "note": "Old odometer reading for testing stale notification"
    },
    "created_at": "2025-09-25T20:15:52.745372+00:00"
  }
]
```


### reminders

**Rows:** 4  
**Columns:** 13

#### Column Schema
| Column | Type | Nullable | PK | FK | Foreign Reference |
|--------|------|----------|----|----|-------------------|
| id | uuid | ❌ | 🔑 |  |  |
| vehicle_id | uuid | ❌ |  | 🔗 | vehicles.id |
| title | text | ❌ |  |  |  |
| description | text | ❌ |  |  |  |
| category | text | ❌ |  |  |  |
| priority | text | ❌ |  |  |  |
| due_date | text | ✅ |  |  |  |
| due_miles | integer | ✅ |  |  |  |
| status | text | ❌ |  |  |  |
| source | text | ❌ |  |  |  |
| dedupe_key | text | ❌ |  |  |  |
| created_at | text | ❌ |  |  |  |
| updated_at | text | ❌ |  |  |  |

#### Sample Data
```json
[
  {
    "id": "5cc0d7a1-cf57-46ef-bf65-1c8b44bfec43",
    "vehicle_id": "cf1e58a5-d456-4a17-ae82-273ef0e65f9d",
    "title": "Oil change overdue",
    "description": "Last oil change was 6 months ago. Engine damage risk.",
    "category": "maintenance",
    "priority": "high",
    "due_date": "2024-08-15",
    "due_miles": null,
    "status": "open",
    "source": "user",
    "dedupe_key": "25602eccce4e96115e24adff45697871",
    "created_at": "2025-09-25T20:15:43.898018+00:00",
    "updated_at": "2025-09-25T20:15:43.898018+00:00"
  },
  {
    "id": "6c705b79-27ed-4b9e-8056-913e212afa66",
    "vehicle_id": "cf1e58a5-d456-4a17-ae82-273ef0e65f9d",
    "title": "Registration renewal",
    "description": "Vehicle registration expires in 12 days.",
    "category": "registration",
    "priority": "medium",
    "due_date": "2025-10-07",
    "due_miles": null,
    "status": "open",
    "source": "user",
    "dedupe_key": "1afec7e66c0f0035c71f90d6ea733a99",
    "created_at": "2025-09-25T20:15:51.221624+00:00",
    "updated_at": "2025-09-25T20:15:51.221624+00:00"
  }
]
```


### vehicle_images

**Rows:** 1  
**Columns:** 9

#### Column Schema
| Column | Type | Nullable | PK | FK | Foreign Reference |
|--------|------|----------|----|----|-------------------|
| id | uuid | ❌ | 🔑 |  |  |
| tenant_id | uuid | ❌ |  | 🔗 | tenants.id |
| vehicle_id | uuid | ❌ |  | 🔗 | vehicles.id |
| storage_path | text | ❌ |  |  |  |
| public_url | text | ❌ |  |  |  |
| filename | text | ❌ |  |  |  |
| image_type | text | ❌ |  |  |  |
| is_primary | boolean | ❌ |  |  |  |
| created_at | text | ❌ |  |  |  |

#### Sample Data
```json
[
  {
    "id": "c937ee09-6c4c-4eec-b4a1-e1867d709205",
    "tenant_id": "550e8400-e29b-41d4-a716-446655440000",
    "vehicle_id": "9e412dca-7d8f-4410-a2b1-3d3042369a4d",
    "storage_path": "3GNAL4EK7DS559435-1758782882841.png",
    "public_url": "https://ucbbzzoimghnaoihyqbd.supabase.co/storage/v1/object/public/vehicle-images/vehicle-photos/3GNAL4EK7DS559435-1758782882841.png",
    "filename": "3GNAL4EK7DS559435-1758782882841.png",
    "image_type": "hero",
    "is_primary": true,
    "created_at": "2025-09-25T06:48:12.620276+00:00"
  }
]
```


### schema_migrations

**Rows:** 13  
**Columns:** 2

#### Column Schema
| Column | Type | Nullable | PK | FK | Foreign Reference |
|--------|------|----------|----|----|-------------------|
| version | text | ❌ |  |  |  |
| applied_at | text | ❌ |  |  |  |

#### Sample Data
```json
[
  {
    "version": "000_base_schema.sql",
    "applied_at": "2025-09-24T03:30:58.160322+00:00"
  },
  {
    "version": "001_rls_policies.sql",
    "applied_at": "2025-09-24T03:32:17.201026+00:00"
  }
]
```


### tenants

**Rows:** 1  
**Columns:** 9

#### Column Schema
| Column | Type | Nullable | PK | FK | Foreign Reference |
|--------|------|----------|----|----|-------------------|
| id | uuid | ❌ | 🔑 |  |  |
| name | text | ❌ |  |  |  |
| kind | text | ❌ |  |  |  |
| plan_name | text | ❌ |  |  |  |
| stripe_customer_id | unknown | ✅ |  | 🔗 | stripe_customers.id |
| stripe_subscription_id | unknown | ✅ |  | 🔗 | stripe_subscriptions.id |
| subscription_status | text | ❌ |  |  |  |
| created_at | text | ❌ |  |  |  |
| updated_at | text | ❌ |  |  |  |

#### Sample Data
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Demo Fleet Operations",
    "kind": "org",
    "plan_name": "team",
    "stripe_customer_id": null,
    "stripe_subscription_id": null,
    "subscription_status": "active",
    "created_at": "2025-09-24T03:47:27.65654+00:00",
    "updated_at": "2025-09-24T03:47:27.65654+00:00"
  }
]
```


### notifications

**Rows:** 0  
**Columns:** 0

#### Column Schema
| Column | Type | Nullable | PK | FK | Foreign Reference |
|--------|------|----------|----|----|-------------------|


#### Sample Data
```json
[]
```


### usage_tracking

**Rows:** 0  
**Columns:** 0

#### Column Schema
| Column | Type | Nullable | PK | FK | Foreign Reference |
|--------|------|----------|----|----|-------------------|


#### Sample Data
```json
[]
```


### vehicle_current_mileage

**Rows:** 1  
**Columns:** 4

#### Column Schema
| Column | Type | Nullable | PK | FK | Foreign Reference |
|--------|------|----------|----|----|-------------------|
| vehicle_id | uuid | ❌ |  | 🔗 | vehicles.id |
| miles | integer | ❌ |  |  |  |
| date | text | ❌ |  |  |  |
| created_at | text | ❌ |  |  |  |

#### Sample Data
```json
[
  {
    "vehicle_id": "cf1e58a5-d456-4a17-ae82-273ef0e65f9d",
    "miles": 52000,
    "date": "2025-06-17",
    "created_at": "2025-09-25T20:15:52.745372+00:00"
  }
]
```


## Relationships

- **vehicles.tenant_id** → **tenants.id**
- **vehicles.garage_id** → **garages.id**
- **garages.tenant_id** → **tenants.id**
- **vehicle_events.vehicle_id** → **vehicles.id**
- **reminders.vehicle_id** → **vehicles.id**
- **vehicle_images.tenant_id** → **tenants.id**
- **vehicle_images.vehicle_id** → **vehicles.id**
- **tenants.stripe_customer_id** → **stripe_customers.id**
- **tenants.stripe_subscription_id** → **stripe_subscriptions.id**
- **vehicle_current_mileage.vehicle_id** → **vehicles.id**

## Schema Analysis

### Primary Keys
- **vehicles**: id
- **garages**: id
- **vehicle_events**: id
- **reminders**: id
- **vehicle_images**: id
- **tenants**: id

### Foreign Keys
- **vehicles**: tenant_id → tenants, garage_id → garages
- **garages**: tenant_id → tenants
- **vehicle_events**: vehicle_id → vehicles
- **reminders**: vehicle_id → vehicles
- **vehicle_images**: tenant_id → tenants, vehicle_id → vehicles
- **tenants**: stripe_customer_id → stripe_customers, stripe_subscription_id → stripe_subscriptions
- **vehicle_current_mileage**: vehicle_id → vehicles

### Data Types Distribution
- **text**: 43 columns
- **uuid**: 14 columns
- **integer**: 5 columns
- **jsonb**: 5 columns
- **unknown**: 4 columns
- **numeric**: 2 columns
- **boolean**: 2 columns

---

*Generated by MotoMind Schema Introspection Tool*
