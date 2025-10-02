# Dashboard Snapshot - Acceptance Test Plan

## Manual Test Matrix (10 minutes)

### Test 1: Digital Cluster (Clear Photo)
**Setup:** Modern vehicle with digital dashboard, good lighting
**Expected:** 
- Odometer: Exact reading extracted
- Fuel: Percentage or digital display read accurately
- Warning lights: None (all dark) → `warning_lights: null`
- **Result:** `rollup: "ok"`, confidence >90%

### Test 2: Analog Fuel Gauge (Needle Position)
**Setup:** Vehicle with analog fuel needle at approximately half tank
**Expected:**
- Odometer: Digital reading extracted
- Fuel: `fuel_level_eighths: 4` (nearest eighth to ½)
- **Result:** `rollup: "ok"` if odometer clear

### Test 3: Warning Lights Active
**Setup:** Vehicle with TPMS and Check Engine lights illuminated
**Expected:**
- Warning lights: `["tpms", "check_engine"]` in array
- Other lights (dark/unlit): Ignored
- **Result:** Both lights detected and canonicalized

### Test 4: Glare/Blur Conditions
**Setup:** Dashboard photo with glare or motion blur
**Expected:**
- Fuel: `null` (unclear analog needle)
- Warning lights: `null` (ambiguous due to glare)
- Odometer: May be readable if digital is clear
- **Result:** `rollup: "needs_review"`, confidence <70%

### Test 5: Night Shot (Inverted Display)
**Setup:** Dashboard photo taken at night with inverted colors
**Expected:**
- Warning lights: Still detected if illuminated
- Fuel: May be `null` due to poor visibility
- **Result:** `rollup: "needs_review"` if fuel unclear

### Test 6: Electric Vehicle (No Fuel)
**Setup:** EV dashboard with no fuel gauge
**Expected:**
- Odometer: Extracted normally
- Fuel: `null` (no fuel gauge present)
- Warning lights: Detected normally
- **Result:** `rollup: "ok"` with partial data (fuel null is expected)

## Programmatic Assertions

### API Response Validation
```bash
# Test POST request creates proper event
curl -X POST /api/vision/process \
  -F "image=@dashboard-test.jpg" \
  -F "document_type=dashboard_snapshot"

# Verify response structure
{
  "success": true,
  "data": {
    "type": "dashboard_snapshot",
    "summary": "Odometer 52,205 mi • Fuel ~¾ • Lamps: TPMS",
    "key_facts": {
      "odometer_miles": 52205,
      "fuel_level_eighths": 6,
      "warning_lights": ["tpms"],
      "oil_life_percent": null,
      "service_message": null
    },
    "validation": {
      "rollup": "ok",
      "odometer_conf": 0.96,
      "fuel_conf": 0.82,
      "lights_conf": 0.88
    }
  }
}
```

### Database Storage Validation
```sql
-- Verify event saved with proper structure
SELECT 
  id, type, 
  payload->>'summary' as summary,
  payload->'key_facts'->>'odometer_miles' as odometer,
  payload->'key_facts'->>'fuel_level_eighths' as fuel,
  payload->'validation'->>'rollup' as validation_status
FROM vehicle_events 
WHERE type = 'dashboard_snapshot' 
ORDER BY created_at DESC LIMIT 1;
```

### Timeline Display Validation
- **Summary appears in timeline row** (no "Not specified")
- **Needs review chip** shows for `rollup: "needs_review"`
- **View photo link** works (opens `doc_url`)
- **Soft delete** hides row but preserves file

## Confidence Threshold Validation

### Odometer Confidence
- `odometer_conf < 0.8` → `odometer_miles: null`
- `odometer_conf >= 0.8` → Value preserved

### Fuel Confidence  
- `fuel_conf < 0.7` → `fuel_level_eighths: null`
- `fuel_conf >= 0.7` → Value preserved

### Warning Lights Confidence
- `lights_conf < 0.75` → `warning_lights: null`
- `lights_conf >= 0.75` → Array preserved

## Success Criteria

### High Confidence Targets
- ✅ **≥95% odometer read rate** on digital clusters
- ✅ **≥80% correct fuel bucket** on non-glare photos  
- ✅ **Warning lamps precision over recall** (fewer false positives)
- ✅ **<10s capture→save** for majority of uploads

### User Experience Validation
- ✅ **Safety warnings** displayed before capture
- ✅ **Summary format** readable and informative
- ✅ **Graceful degradation** when partial data available
- ✅ **No "Not specified" spam** in timeline rows

## Edge Cases to Test

### Units Detection
- If "km" detected anywhere → store `units: 'km'` and display "km"
- Default to miles if no unit indicators

### Rate Limiting
- Maximum 1 snapshot per minute per vehicle
- Feature flag: `NEXT_PUBLIC_DASHBOARD_SNAPSHOT=true`

### Error Handling
- Invalid JSON from Vision API → graceful degradation
- Network timeout → retry with backoff
- File upload failure → clear error message

## Rollout Checklist

### Phase 1: Behind Feature Flag
- [ ] Database migration applied
- [ ] Feature flag enabled: `NEXT_PUBLIC_DASHBOARD_SNAPSHOT=true`
- [ ] Expose only on `/vehicles/[id]` (not onboarding)

### Phase 2: Success Rate Validation
- [ ] Monitor success rates: ≥85% odometer, ≥75% fuel/lamps
- [ ] Track telemetry: `has_odo`, `has_fuel_eighths`, `lamps_count`, `needs_review`
- [ ] Median capture→save latency <10s

### Phase 3: Integration
- [ ] If success rates good → integrate into onboarding as optional step
- [ ] Add to main vehicle timeline as primary capture method
- [ ] Consider replacing simple odometer reader

## Test Data Examples

### Expected Summaries
- `"Odometer 52,205 mi • Fuel ~¾ • Lamps: TPMS, Check engine"`
- `"Odometer 89,432 mi • Fuel ~½"`  
- `"Odometer 156,789 mi"` (EV, no fuel)
- `"Dashboard snapshot needs review"` (low confidence)

### Warning Light Canonical IDs
- `check_engine`, `oil_pressure`, `tpms`, `battery`
- `abs`, `airbag`, `brake`, `coolant_temp`, `other`

This test plan ensures the Dashboard Snapshot MVP ships with confidence and provides clear success metrics for iteration.
