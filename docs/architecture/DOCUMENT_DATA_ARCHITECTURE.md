# Document Data Architecture

## Overview

This document defines the canonical data architecture for vehicle event documents. All vision extraction data is normalized to consistent schemas before storage, and display components read from a single source of truth.

## Design Principles

1. **Single Source of Truth** - All document data lives in `event.payload.data`
2. **Consistent Schemas** - Each document type has a defined TypeScript interface
3. **No Duplication** - Top-level database columns only for universal fields (odometer, date)
4. **Type Safety** - Discriminated unions based on `event.type`
5. **Extensibility** - Add new document types without database migrations

## Database Schema

```sql
CREATE TABLE vehicle_events (
  id UUID PRIMARY KEY,
  vehicle_id UUID NOT NULL,
  type TEXT NOT NULL,  -- 'dashboard_snapshot', 'fuel_receipt', 'service_invoice'
  date TIMESTAMPTZ NOT NULL,
  
  -- Only universal fields at top level
  miles INTEGER,  -- For chronological queries/validation
  
  -- All document-specific data
  payload JSONB NOT NULL,  -- Contains: type, data, raw_extraction, metadata
  
  -- System fields
  created_at TIMESTAMPTZ,
  edited_at TIMESTAMPTZ
);
```

## Payload Structure

### Canonical Format

```typescript
{
  type: 'fuel_receipt' | 'dashboard_snapshot' | 'service_invoice',
  data: {
    // Type-specific fields with consistent naming
  },
  raw_extraction: {
    // Original Vision API response for debugging
  },
  metadata: {
    confidence: number,
    processing_ms: number,
    model_version: string,
    prompt_hash: string
  }
}
```

### Fuel Receipt Schema

```typescript
interface FuelReceiptData {
  station_name: string
  total_amount: number
  gallons: number
  price_per_gallon: number
  fuel_type: string | null
  payment_method: string | null
  pump_number: string | null
  date: string // YYYY-MM-DD from receipt
  time: string | null
}
```

**Example:**
```json
{
  "type": "fuel_receipt",
  "data": {
    "station_name": "Fuel Depot",
    "total_amount": 98.55,
    "gallons": 33.182,
    "price_per_gallon": 2.97,
    "fuel_type": "Regular",
    "payment_method": "VISA DEBIT",
    "pump_number": "8",
    "date": "2020-07-10",
    "time": "10:40"
  },
  "raw_extraction": { /* Vision API response */ },
  "metadata": {
    "confidence": 0.98,
    "processing_ms": 4235,
    "model_version": "gpt-4o-2024-08-06",
    "prompt_hash": "auto_fuel_receipt_v1"
  }
}
```

### Dashboard Snapshot Schema

```typescript
interface DashboardSnapshotData {
  odometer_miles: number
  odometer_unit: 'km' | 'mi'
  fuel_eighths: number | null
  coolant_temp: 'cold' | 'normal' | 'hot' | null
  outside_temp_value: number | null
  outside_temp_unit: 'F' | 'C' | null
  warning_lights: string[]
  oil_life_percent: number | null
}
```

### Service Invoice Schema

```typescript
interface ServiceInvoiceData {
  vendor_name: string
  total_amount: number
  service_description: string | null
  date: string
  line_items: Array<{
    description: string
    amount: number
    category: 'labor' | 'parts' | 'fluids' | 'other'
  }>
  odometer_reading: number | null
}
```

## Data Flow

### 1. Vision API Extraction
```
User uploads image
  ↓
Vision API processes
  ↓
Returns structured data
```

### 2. Normalization
```typescript
// lib/domain/document-normalizer.ts
const normalized = normalizeDocumentData(visionResponse)
// Output: { type, data, raw_extraction, metadata }
```

### 3. Storage
```typescript
const payload = {
  type: normalized.type,
  date: normalized.data.date,
  miles: extractOdometer(normalized),  // Top-level for queries
  payload: normalized  // Canonical structure
}

await supabase.from('vehicle_events').insert(payload)
```

### 4. Display
```typescript
// components/timeline/UnifiedEventDetail.tsx
const data = event.payload.data

switch(event.type) {
  case 'fuel':
    return (
      <>
        <Field label="Station" value={data.station_name} />
        <Field label="Gallons" value={data.gallons} />
        <Field label="Total" value={data.total_amount} />
      </>
    )
}
```

## Migration from Old Structure

### Old Events (Before Refactor)
```json
{
  "vendor": null,
  "total_amount": null,
  "gallons": null,
  "payload": {
    "raw_extraction": {
      "key_facts": {
        "station_name": "Fuel Depot",
        "total_amount": 98.55,
        "gallons": 33.182
      }
    }
  }
}
```

### New Events (After Refactor)
```json
{
  "vendor": null,  // Legacy, ignored
  "total_amount": null,  // Legacy, ignored
  "gallons": null,  // Legacy, ignored
  "miles": 306,  // Inferred from last event
  "payload": {
    "type": "fuel_receipt",
    "data": {
      "station_name": "Fuel Depot",
      "total_amount": 98.55,
      "gallons": 33.182,
      "price_per_gallon": 2.97
    }
  }
}
```

### Display Compatibility
Display component has fallback for old events:
```typescript
const data = event.payload?.data || event.payload?.raw_extraction?.key_facts || {}
```

## Adding New Document Types

1. **Define Schema** in `lib/domain/document-schemas.ts`
2. **Add Normalizer** in `lib/domain/document-normalizer.ts`
3. **Update Display** in `components/timeline/UnifiedEventDetail.tsx`
4. **No database migration required!**

Example:
```typescript
// 1. Schema
interface InsuranceCardData {
  insurance_company: string
  policy_number: string
  effective_date: string
  expiration_date: string
}

// 2. Normalizer
function normalizeInsuranceCard(visionData: any): EventPayload<InsuranceCardData> {
  return {
    type: 'insurance_card',
    data: {
      insurance_company: visionData.insurance_company,
      policy_number: visionData.policy_number,
      effective_date: visionData.effective_date,
      expiration_date: visionData.expiration_date
    },
    raw_extraction: visionData
  }
}

// 3. Display
case 'insurance_card':
  return <InsuranceFields data={event.payload.data} />
```

## Benefits

✅ **No Data Duplication** - Single location for each field  
✅ **Type Safety** - TypeScript interfaces prevent errors  
✅ **Scalability** - Add document types without migrations  
✅ **Clean Code** - No fallback chains, one source of truth  
✅ **Extensibility** - Easy to add new fields per type  
✅ **Debugging** - Original extraction preserved in `raw_extraction`

## Anti-Patterns to Avoid

❌ **Don't** duplicate data in top-level columns and payload  
❌ **Don't** use different field names across layers  
❌ **Don't** create fragile fallback chains  
❌ **Don't** store document fields in top-level database columns  
❌ **Don't** make the display component do normalization

## Status

- ✅ Schemas defined (`lib/domain/document-schemas.ts`)
- ✅ Normalizer implemented (`lib/domain/document-normalizer.ts`)
- ✅ Save handler updated (`pages/vehicles/[id]/index.tsx`)
- ✅ Display component refactored (`components/timeline/UnifiedEventDetail.tsx`)
- ⏳ Future: Remove unused top-level columns (vendor, total_amount, gallons)
- ⏳ Future: Add service invoice support to DocumentScannerModal
