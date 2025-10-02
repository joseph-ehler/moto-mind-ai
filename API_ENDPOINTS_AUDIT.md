# 🔍 API ENDPOINTS ORGANIZATION AUDIT

Generated: 2025-09-29T00:49:00.356Z

## 📊 SUMMARY

**Total Endpoints:** 49
**Endpoints with Issues:** 30
**Total Issues:** 50

## 📁 ENDPOINTS BY CATEGORY

### VEHICLES (15 endpoints)

- **/api/admin/vehicles** (GET) - 2KB 🔒
  - *Purpose:* Administrative functions

- **/api/vehicles/[id]/delete** (DELETE) - 2KB 🔒
  - *Purpose:* Vehicle management

- **/api/vehicles/[id]/events/[eventId]** (PUT, DELETE) - 3KB 🔒
  - *Purpose:* Vehicle management

- **/api/vehicles/[id]/events** (GET, POST) - 6KB 🔒 ✅
  - *Purpose:* Vehicle management

- **/api/vehicles/[id]/fuel** (GET, POST) - 5KB 🔒 ⚠️ 1 issues
  - *Purpose:* Vehicle management
  - ⚠️ POST endpoint without validation

- **/api/vehicles/[id]/images** (GET, POST, DELETE, PATCH) - 11KB 🔒 ✅
  - *Purpose:* Vehicle management

- **/api/vehicles/[id]/move** (PATCH) - 2KB 🔒
  - *Purpose:* Vehicle management

- **/api/vehicles/[id]/odometer** (GET, POST, PUT) - 8KB 🔒 ⚠️ 1 issues
  - *Purpose:* Vehicle management
  - ⚠️ POST endpoint without validation

- **/api/vehicles/[id]/service** (GET, POST) - 6KB 🔒 ⚠️ 1 issues
  - *Purpose:* Vehicle management
  - ⚠️ POST endpoint without validation

- **/api/vehicles/[id]/update** (PUT) - 2KB 🔒
  - *Purpose:* Vehicle management

- **/api/vehicles/[id]** (GET, DELETE, PATCH) - 6KB 🔒 ✅
  - *Purpose:* Vehicle management

- **/api/vehicles** (GET, POST) - 6KB 🔒 ✅
  - *Purpose:* Vehicle management

- **/api/vehicles/onboard** (POST) - 8KB 🔒 ✅
  - *Purpose:* Vehicle management

- **/api/vehicles/upload-photo** (POST) - 3KB 🔒 ⚠️ 2 issues
  - *Purpose:* Vehicle management
  - ⚠️ Uses kebab-case (consider camelCase for consistency)
  - ⚠️ POST endpoint without validation

- **/api/vehicles-optimized** (GET) - 4KB 🔒 ✅ ⚠️ 1 issues
  - *Purpose:* Vehicle management
  - ⚠️ Appears to be duplicate/test endpoint

### IMAGES (3 endpoints)

- **/api/canonical-image-simple** (GET, POST) - 2KB ⚠️ 2 issues
  - *Purpose:* Purpose unclear from URL
  - ⚠️ Appears to be duplicate/test endpoint
  - ⚠️ POST endpoint without validation

- **/api/canonical-image-working** (GET, POST) - 5KB ⚠️ 2 issues
  - *Purpose:* Purpose unclear from URL
  - ⚠️ Appears to be duplicate/test endpoint
  - ⚠️ POST endpoint without validation

- **/api/canonical-image** (POST) - 2KB ⚠️ 2 issues
  - *Purpose:* Purpose unclear from URL
  - ⚠️ Uses kebab-case (consider camelCase for consistency)
  - ⚠️ POST endpoint without validation

### CORE (1 endpoints)

- **/api/core/photo-upload** (POST) - 2KB 🔒 ⚠️ 2 issues
  - *Purpose:* Purpose unclear from URL
  - ⚠️ Uses kebab-case (consider camelCase for consistency)
  - ⚠️ POST endpoint without validation

### VIN (3 endpoints)

- **/api/decode-vin** (POST) - 9KB ⚠️ 2 issues
  - *Purpose:* Purpose unclear from URL
  - ⚠️ Uses kebab-case (consider camelCase for consistency)
  - ⚠️ POST endpoint without validation

- **/api/extract-vin** (POST) - 5KB ⚠️ 2 issues
  - *Purpose:* Purpose unclear from URL
  - ⚠️ Uses kebab-case (consider camelCase for consistency)
  - ⚠️ POST endpoint without validation

- **/api/scan-vin** (POST) - 7KB ⚠️ 2 issues
  - *Purpose:* Purpose unclear from URL
  - ⚠️ Uses kebab-case (consider camelCase for consistency)
  - ⚠️ POST endpoint without validation

### DEMO (2 endpoints)

- **/api/demo-reset** (POST, DELETE) - 5KB 🔒 ⚠️ 2 issues
  - *Purpose:* Demo/testing utilities
  - ⚠️ Uses kebab-case (consider camelCase for consistency)
  - ⚠️ POST endpoint without validation

- **/api/demo-seed** (POST) - 2KB 🔒 ⚠️ 2 issues
  - *Purpose:* Demo/testing utilities
  - ⚠️ Uses kebab-case (consider camelCase for consistency)
  - ⚠️ POST endpoint without validation

### EVENTS (1 endpoints)

- **/api/events/save** (POST) - 5KB 🔒 ✅
  - *Purpose:* Event logging

### GARAGES (9 endpoints)

- **/api/garages/[id]/jurisdiction/apply** (POST) - 1KB ⚠️ 1 issues
  - *Purpose:* Garage management
  - ⚠️ POST endpoint without validation

- **/api/garages/[id]/jurisdiction** (GET) - 2KB
  - *Purpose:* Garage management

- **/api/garages/[id]/jurisdiction-simple** (GET) - 2KB ⚠️ 2 issues
  - *Purpose:* Garage management
  - ⚠️ Uses kebab-case (consider camelCase for consistency)
  - ⚠️ Appears to be duplicate/test endpoint

- **/api/garages/[id]/set-default** (PATCH) - 2KB 🔒 ⚠️ 1 issues
  - *Purpose:* Garage management
  - ⚠️ Uses kebab-case (consider camelCase for consistency)

- **/api/garages/[id]/weather-simple** (GET) - 2KB ⚠️ 2 issues
  - *Purpose:* Garage management
  - ⚠️ Uses kebab-case (consider camelCase for consistency)
  - ⚠️ Appears to be duplicate/test endpoint

- **/api/garages/[id]/weather** (GET) - 3KB 🔒
  - *Purpose:* Garage management

- **/api/garages/[id]** (GET, DELETE, PATCH) - 5KB 🔒
  - *Purpose:* Garage management

- **/api/garages** (GET, POST) - 2KB 🔒 ⚠️ 1 issues
  - *Purpose:* Garage management
  - ⚠️ POST endpoint without validation

- **/api/garages** (GET, POST, PUT, DELETE) - 4KB 🔒 ⚠️ 1 issues
  - *Purpose:* Garage management
  - ⚠️ POST endpoint without validation

### REPORTS (1 endpoints)

- **/api/generate-pdf-report** (POST) - 12KB 🔒 ⚠️ 2 issues
  - *Purpose:* Purpose unclear from URL
  - ⚠️ Uses kebab-case (consider camelCase for consistency)
  - ⚠️ POST endpoint without validation

### HEALTH (4 endpoints)

- **/api/health-broken** (GET) - 5KB 🔒 ✅ ⚠️ 1 issues
  - *Purpose:* Health check endpoint
  - ⚠️ Appears to be duplicate/test endpoint

- **/api/health-cached** (GET) - 6KB 🔒 ✅
  - *Purpose:* Health check endpoint

- **/api/health-optimized** (GET) - 7KB 🔒 ✅ ⚠️ 1 issues
  - *Purpose:* Health check endpoint
  - ⚠️ Appears to be duplicate/test endpoint

- **/api/health** (GET) - 7KB 🔒 ✅
  - *Purpose:* Health check endpoint

### MONITORING (1 endpoints)

- **/api/metrics** (GET) - 6KB 🔒
  - *Purpose:* System metrics

### NOTIFICATIONS (1 endpoints)

- **/api/notifications** (GET) - 847B 🔒
  - *Purpose:* Notification system

### VISION (4 endpoints)

- **/api/ocr/extract-vin** (POST) - 8KB ⚠️ 2 issues
  - *Purpose:* OCR processing
  - ⚠️ Uses kebab-case (consider camelCase for consistency)
  - ⚠️ POST endpoint without validation

- **/api/vision/cost-tracking** (GET, POST) - 7KB ⚠️ 2 issues
  - *Purpose:* AI vision processing
  - ⚠️ Uses kebab-case (consider camelCase for consistency)
  - ⚠️ POST endpoint without validation

- **/api/vision/process** (POST) - 57KB 🔒 ⚠️ 2 issues
  - *Purpose:* AI vision processing
  - ⚠️ Large file (57KB) - consider splitting
  - ⚠️ POST endpoint without validation

- **/api/vision-ocr** (POST) - 6KB ⚠️ 2 issues
  - *Purpose:* AI vision processing
  - ⚠️ Uses kebab-case (consider camelCase for consistency)
  - ⚠️ POST endpoint without validation

### MISC (1 endpoints)

- **/api/process-image** (POST) - 26KB ⚠️ 3 issues
  - *Purpose:* Purpose unclear from URL
  - ⚠️ Uses kebab-case (consider camelCase for consistency)
  - ⚠️ Large file (26KB) - consider splitting
  - ⚠️ POST endpoint without validation

### REMINDERS (2 endpoints)

- **/api/reminders-simple** (GET, POST) - 4KB ✅ ⚠️ 1 issues
  - *Purpose:* Reminder system
  - ⚠️ Appears to be duplicate/test endpoint

- **/api/reminders** (GET, POST) - 7KB 🔒 ✅
  - *Purpose:* Reminder system

### UPLOADS (1 endpoints)

- **/api/upload-vehicle-photo** (POST) - 4KB 🔒 ⚠️ 2 issues
  - *Purpose:* File upload handling
  - ⚠️ Uses kebab-case (consider camelCase for consistency)
  - ⚠️ POST endpoint without validation

## ⚠️ MOST COMMON ISSUES

- **POST endpoint without validation** (23 occurrences)
- **Uses kebab-case (consider camelCase for consistency)** (17 occurrences)
- **Appears to be duplicate/test endpoint** (8 occurrences)
- **Large file (26KB) - consider splitting** (1 occurrences)
- **Large file (57KB) - consider splitting** (1 occurrences)

## 💡 RECOMMENDATIONS

### 🔄 Duplicate/Versioned Endpoints

**vehicles:**
- /api/admin/vehicles (vehicles.ts)
- /api/vehicles-optimized (vehicles-optimized.ts)
*Recommendation:* Consolidate into single endpoint with feature flags

**canonical-image:**
- /api/canonical-image-simple (canonical-image-simple.ts)
- /api/canonical-image-working (canonical-image-working.ts)
- /api/canonical-image (canonical-image.ts)
*Recommendation:* Consolidate into single endpoint with feature flags

**extract-vin:**
- /api/extract-vin (extract-vin.ts)
- /api/ocr/extract-vin (extract-vin.ts)
*Recommendation:* Consolidate into single endpoint with feature flags

**index:**
- /api/garages/[id]/jurisdiction (index.ts)
- /api/garages (index.ts)
- /api/vehicles (index.ts)
*Recommendation:* Consolidate into single endpoint with feature flags

**weather:**
- /api/garages/[id]/weather-simple (weather-simple.ts)
- /api/garages/[id]/weather (weather.ts)
*Recommendation:* Consolidate into single endpoint with feature flags

**[id]:**
- /api/garages/[id] ([id].ts)
- /api/vehicles/[id] ([id].ts)
*Recommendation:* Consolidate into single endpoint with feature flags

**health:**
- /api/health-broken (health-broken.ts)
- /api/health-cached (health-cached.ts)
- /api/health-optimized (health-optimized.ts)
- /api/health (health.ts)
*Recommendation:* Consolidate into single endpoint with feature flags

**reminders:**
- /api/reminders-simple (reminders-simple.ts)
- /api/reminders (reminders.ts)
*Recommendation:* Consolidate into single endpoint with feature flags

### 📄 Large Files to Split

- **/api/process-image** (26KB) - Consider splitting into smaller modules
- **/api/vision/process** (57KB) - Consider splitting into smaller modules

### 🏗️ Structural Improvements

- **Root level clutter:** 24 endpoints in /api/ root
  - Consider grouping related endpoints into subdirectories
- **Missing authentication:** 12 POST endpoints without auth
- **Missing validation:** 23 POST endpoints without validation

## 📈 ORGANIZATION SCORE: 0/100

🚨 **Poor API organization - significant restructuring needed**
