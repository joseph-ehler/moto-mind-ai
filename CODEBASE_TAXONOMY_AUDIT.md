# 🔍 COMPREHENSIVE CODEBASE TAXONOMY AUDIT

Generated: 2025-09-29T00:44:10.987Z

## 📁 /lib/

**Purpose:** Shared libraries and utilities
**Files:** 8 | **Subdirectories:** 19

**💡 Recommendations:**
- Consider splitting large files: canonical-images.ts

**📄 File Analysis:**

*CODE:*
- `canonical-images.ts` (15KB) ⚠️ 1 issues
- `env.ts` (2KB)
- `errors.ts` (3KB)
- `explanation-schema.ts` (3KB)
- `featureFlags.ts` (1KB)
- `vehicle-health.ts` (4KB)

*TYPES:*
- `error-types.ts` (3KB)
- `vehicle-body-types.ts` (4KB)

*SUBDIRECTORIES:*
- 📁 `api/`
- 📁 `clients/`
- 📁 `db/`
- 📁 `domain/`
- 📁 `http/`
- 📁 `infrastructure/`
- 📁 `jurisdiction/`
- 📁 `metrics/`
- 📁 `middleware/`
- 📁 `notifications/`
- 📁 `processing/`
- 📁 `reasoning/`
- 📁 `services/`
- 📁 `storage/`
- 📁 `ui/`
- 📁 `utils/`
- 📁 `validation/`
- 📁 `vision/`
- 📁 `weather/`

---

### 📁 /lib/api/

**Purpose:** API endpoints and handlers
**Files:** 1 | **Subdirectories:** 0

**⚠️ Issues:**
- Contains only one file - consider consolidation

**💡 Recommendations:**
- Consider moving single file to parent directory or merging with related files


### 📁 /lib/db/

**Purpose:** Mixed purpose - needs clarification
**Files:** 1 | **Subdirectories:** 0

**⚠️ Issues:**
- Contains only one file - consider consolidation

**💡 Recommendations:**
- Consider moving single file to parent directory or merging with related files


### 📁 /lib/domain/

**Purpose:** Mixed purpose - needs clarification
**Files:** 1 | **Subdirectories:** 0

**⚠️ Issues:**
- Contains only one file - consider consolidation

**💡 Recommendations:**
- Consider moving single file to parent directory or merging with related files


### 📁 /lib/http/

**Purpose:** Mixed purpose - needs clarification
**Files:** 1 | **Subdirectories:** 0

**⚠️ Issues:**
- Contains only one file - consider consolidation

**💡 Recommendations:**
- Consider moving single file to parent directory or merging with related files


### 📁 /lib/jurisdiction/

**Purpose:** Mixed purpose - needs clarification
**Files:** 1 | **Subdirectories:** 0

**⚠️ Issues:**
- Contains only one file - consider consolidation

**💡 Recommendations:**
- Consider moving single file to parent directory or merging with related files


### 📁 /lib/metrics/

**Purpose:** Mixed purpose - needs clarification
**Files:** 1 | **Subdirectories:** 0

**⚠️ Issues:**
- Contains only one file - consider consolidation

**💡 Recommendations:**
- Consider moving single file to parent directory or merging with related files


### 📁 /lib/middleware/

**Purpose:** Mixed purpose - needs clarification
**Files:** 1 | **Subdirectories:** 0

**⚠️ Issues:**
- Contains only one file - consider consolidation

**💡 Recommendations:**
- Consider moving single file to parent directory or merging with related files


### 📁 /lib/notifications/

**Purpose:** Mixed purpose - needs clarification
**Files:** 1 | **Subdirectories:** 0

**⚠️ Issues:**
- Contains only one file - consider consolidation

**💡 Recommendations:**
- Consider moving single file to parent directory or merging with related files


### 📁 /lib/processing/

**Purpose:** Mixed purpose - needs clarification
**Files:** 1 | **Subdirectories:** 0

**⚠️ Issues:**
- Contains only one file - consider consolidation

**💡 Recommendations:**
- Consider moving single file to parent directory or merging with related files


### 📁 /lib/ui/

**Purpose:** Mixed purpose - needs clarification
**Files:** 1 | **Subdirectories:** 0

**⚠️ Issues:**
- Contains only one file - consider consolidation

**💡 Recommendations:**
- Consider moving single file to parent directory or merging with related files


### 📁 /lib/utils/

**Purpose:** Utility functions
**Files:** 1 | **Subdirectories:** 0

**⚠️ Issues:**
- Contains only one file - consider consolidation

**💡 Recommendations:**
- Consider moving single file to parent directory or merging with related files


### 📁 /lib/vision/

**Purpose:** AI/Vision processing
**Files:** 10 | **Subdirectories:** 0

**💡 Recommendations:**
- Move test files to /tests/ directory
- Consider splitting large files: ab-testing.ts


### 📁 /lib/weather/

**Purpose:** Mixed purpose - needs clarification
**Files:** 1 | **Subdirectories:** 0

**⚠️ Issues:**
- Contains only one file - consider consolidation

**💡 Recommendations:**
- Consider moving single file to parent directory or merging with related files


## 📁 /pages/api/

**Purpose:** API endpoints and handlers
**Files:** 22 | **Subdirectories:** 7

**💡 Recommendations:**
- Consider splitting large files: process-image.ts

**📄 File Analysis:**

*CODE:*
- `canonical-image-simple.ts` (2KB)
- `canonical-image-working.ts` (5KB)
- `canonical-image.ts` (2KB)
- `decode-vin.ts` (9KB)
- `demo-reset.ts` (5KB)
- `demo-seed.ts` (2KB)
- `extract-vin.ts` (5KB)
- `garages.ts` (4KB)
- `generate-pdf-report.ts` (12KB)
- `health-broken.ts` (5KB)
- `health-cached.ts` (6KB)
- `health-optimized.ts` (7KB)
- `health.ts` (7KB)
- `metrics.ts` (6KB)
- `notifications.ts` (839B)
- `process-image.ts` (26KB) ⚠️ 1 issues
- `reminders-simple.ts` (4KB)
- `reminders.ts` (7KB)
- `scan-vin.ts` (7KB)
- `upload-vehicle-photo.ts` (4KB)
- `vehicles-optimized.ts` (4KB)
- `vision-ocr.ts` (6KB)

*SUBDIRECTORIES:*
- 📁 `admin/`
- 📁 `core/`
- 📁 `events/`
- 📁 `garages/`
- 📁 `ocr/`
- 📁 `vehicles/`
- 📁 `vision/`

---

### 📁 /pages/api/admin/

**Purpose:** Mixed purpose - needs clarification
**Files:** 1 | **Subdirectories:** 0

**⚠️ Issues:**
- Contains only one file - consider consolidation

**💡 Recommendations:**
- Consider moving single file to parent directory or merging with related files


### 📁 /pages/api/core/

**Purpose:** Mixed purpose - needs clarification
**Files:** 1 | **Subdirectories:** 0

**⚠️ Issues:**
- Contains only one file - consider consolidation

**💡 Recommendations:**
- Consider moving single file to parent directory or merging with related files


### 📁 /pages/api/events/

**Purpose:** Mixed purpose - needs clarification
**Files:** 1 | **Subdirectories:** 0

**⚠️ Issues:**
- Contains only one file - consider consolidation

**💡 Recommendations:**
- Consider moving single file to parent directory or merging with related files


### 📁 /pages/api/ocr/

**Purpose:** Mixed purpose - needs clarification
**Files:** 1 | **Subdirectories:** 0

**⚠️ Issues:**
- Contains only one file - consider consolidation

**💡 Recommendations:**
- Consider moving single file to parent directory or merging with related files


### 📁 /pages/api/vision/

**Purpose:** AI/Vision processing
**Files:** 2 | **Subdirectories:** 0

**💡 Recommendations:**
- Consider splitting large files: process.ts


## 📁 /components/

**Purpose:** React components
**Files:** 0 | **Subdirectories:** 13

**📄 File Analysis:**

*SUBDIRECTORIES:*
- 📁 `capture/`
- 📁 `explain/`
- 📁 `fleet/`
- 📁 `garage/`
- 📁 `home/`
- 📁 `insights/`
- 📁 `layout/`
- 📁 `onboarding/`
- 📁 `reminders/`
- 📁 `timeline/`
- 📁 `ui/`
- 📁 `vehicle/`
- 📁 `vision/`

---

### 📁 /components/capture/

**Purpose:** Mixed purpose - needs clarification
**Files:** 17 | **Subdirectories:** 0

**💡 Recommendations:**
- Consider splitting large files: DocumentConfirmationUnified.tsx, SimplePhotoModal.tsx


### 📁 /components/explain/

**Purpose:** Mixed purpose - needs clarification
**Files:** 1 | **Subdirectories:** 0

**⚠️ Issues:**
- Contains only one file - consider consolidation

**💡 Recommendations:**
- Consider moving single file to parent directory or merging with related files


### 📁 /components/fleet/

**Purpose:** Mixed purpose - needs clarification
**Files:** 1 | **Subdirectories:** 0

**⚠️ Issues:**
- Contains only one file - consider consolidation

**💡 Recommendations:**
- Consider moving single file to parent directory or merging with related files


### 📁 /components/insights/

**Purpose:** Mixed purpose - needs clarification
**Files:** 1 | **Subdirectories:** 0

**⚠️ Issues:**
- Contains only one file - consider consolidation

**💡 Recommendations:**
- Consider moving single file to parent directory or merging with related files


### 📁 /components/onboarding/

**Purpose:** Mixed purpose - needs clarification
**Files:** 4 | **Subdirectories:** 0

**💡 Recommendations:**
- Consider splitting large files: VehicleOnboarding.tsx, VehicleOnboardingWithImages.tsx


### 📁 /components/reminders/

**Purpose:** Mixed purpose - needs clarification
**Files:** 1 | **Subdirectories:** 0

**⚠️ Issues:**
- Contains only one file - consider consolidation

**💡 Recommendations:**
- Consider moving single file to parent directory or merging with related files


### 📁 /components/timeline/

**Purpose:** Mixed purpose - needs clarification
**Files:** 3 | **Subdirectories:** 0

**💡 Recommendations:**
- Consider splitting large files: EventDetailBlocks.tsx, VehicleTimeline.tsx


### 📁 /components/vision/

**Purpose:** AI/Vision processing
**Files:** 8 | **Subdirectories:** 0

**💡 Recommendations:**
- Consider splitting large files: UnifiedCameraCapture.tsx


## 📁 /hooks/

**Purpose:** React hooks
**Files:** 7 | **Subdirectories:** 0

**📄 File Analysis:**

*CODE:*
- `useGarages.ts` (2KB)
- `useJurisdiction.ts` (3KB)
- `useNotifications.ts` (2KB)
- `useOptimisticActions.ts` (5KB)
- `useReminders.ts` (2KB)
- `useVehicles.ts` (4KB)
- `useWeather.ts` (2KB)

---

## 📁 /tests/

**Purpose:** Test files
**Files:** 0 | **Subdirectories:** 5

**📄 File Analysis:**

*SUBDIRECTORIES:*
- 📁 `api/`
- 📁 `integration/`
- 📁 `isolation/`
- 📁 `security/`
- 📁 `unit/`

---

### 📁 /tests/integration/

**Purpose:** Mixed purpose - needs clarification
**Files:** 0 | **Subdirectories:** 0

**⚠️ Issues:**
- Empty directory

**💡 Recommendations:**
- Remove empty directory or add README explaining future purpose


### 📁 /tests/isolation/

**Purpose:** Test files
**Files:** 1 | **Subdirectories:** 0

**⚠️ Issues:**
- Contains only one file - consider consolidation

**💡 Recommendations:**
- Consider moving single file to parent directory or merging with related files


### 📁 /tests/security/

**Purpose:** Test files
**Files:** 1 | **Subdirectories:** 0

**⚠️ Issues:**
- Contains only one file - consider consolidation

**💡 Recommendations:**
- Consider moving single file to parent directory or merging with related files


### 📁 /tests/unit/

**Purpose:** Test files
**Files:** 1 | **Subdirectories:** 0

**⚠️ Issues:**
- Contains only one file - consider consolidation

**💡 Recommendations:**
- Consider moving single file to parent directory or merging with related files


## 📁 /scripts/

**Purpose:** Build and utility scripts
**Files:** 64 | **Subdirectories:** 0

**⚠️ Issues:**
- Mixed file types - lacks clear purpose

**💡 Recommendations:**
- Split into focused subdirectories by file type/purpose
- Move test files to /tests/ directory
- Consider splitting large files: audit-codebase.js, codebase-taxonomy-audit.ts, gold-standard-optimization.ts, performance-optimization.ts, red-team-fixes.ts, week4-comprehensive-consolidation.ts

**📄 File Analysis:**

*CODE:*
- `add-soft-delete-migration.ts` (1KB)
- `analyze-db-architecture.ts` (11KB)
- `audit-codebase.js` (15KB) ⚠️ 1 issues
- `audit-database-schema.js` (6KB)
- `check-actual-orphans.ts` (2KB)
- `codebase-taxonomy-audit.ts` (16KB) ⚠️ 1 issues
- `comprehensive-validation.ts` (11KB)
- `create-mock-notifications.ts` (4KB)
- `create-sample-reminders.ts` (5KB)
- `debug-naming-conflicts.ts` (5KB)
- `diagnose-performance.ts` (5KB)
- `direct-db-analysis.ts` (13KB)
- `direct-migration.ts` (3KB)
- `evaluate-current-ui.ts` (6KB)
- `execute-consolidation-migration.ts` (7KB)
- `export-import-events.js` (13KB)
- `file-healer.js` (5KB)
- `final-system-assessment.ts` (9KB)
- `fix-orphaned-vehicles.ts` (4KB)
- `gold-standard-optimization.ts` (20KB) ⚠️ 2 issues
- `gold-standard-validation.ts` (8KB) ⚠️ 1 issues
- `investigate-endpoint-failures.ts` (6KB)
- `investigate-slow-endpoints.ts` (6KB)
- `optimize-health-caching.ts` (7KB)
- `optimize-query-structure.ts` (6KB)
- `performance-optimization.ts` (15KB) ⚠️ 1 issues
- `red-team-fixes.ts` (15KB) ⚠️ 1 issues
- `replace-health-endpoint.ts` (8KB)
- `run-canonical-images-migration.ts` (3KB)
- `run-db-migration.ts` (3KB)
- `run-migrations.ts` (4KB)
- `run-security-migration.ts` (8KB)
- `run-vin-migration.ts` (1KB)
- `security-audit-pre-migration.ts` (11KB)
- `seed-smartphone.ts` (11KB)
- `seed-vehicles-simple.ts` (4KB)
- `seed.ts` (9KB)
- `setup-supabase-storage.ts` (5KB)
- `terminology-codemod.js` (6KB)
- `verify-orphan-fix.ts` (3KB)
- `verify-security-migration.ts` (6KB)
- `week2-consolidation-plan.ts` (11KB)
- `week2-naming-analysis.ts` (14KB)
- `week4-comprehensive-consolidation.ts` (15KB) ⚠️ 1 issues
- `windsurf-guardian.js` (3KB)
- `windsurf-protection.js` (4KB)

*DATABASE:*
- `create-consolidated-health-function.sql` (2KB)
- `fix-duplicate-audit-tables.sql` (3KB)
- `fix-orphaned-vehicles.sql` (3KB)
- `fix-reminders-schema.sql` (3KB)
- `schema-audit.sql` (7KB)
- `setup-supabase-storage-simple.sql` (1KB)

*TEST:*
- `extended-endpoint-testing.ts` (8KB) ⚠️ 1 issues
- `final-gold-standard-test.ts` (11KB) ⚠️ 2 issues
- `fix-notifications-test.ts` (4KB) ⚠️ 1 issues
- `introspect-supabase-schema.ts` (14KB) ⚠️ 1 issues
- `systematic-endpoint-testing.ts` (5KB) ⚠️ 1 issues
- `test-canonical-images.ts` (4KB) ⚠️ 1 issues
- `test-db-connection.ts` (1KB) ⚠️ 1 issues
- `test-fixes-systematically.ts` (7KB) ⚠️ 1 issues
- `test-health-caching.ts` (7KB) ⚠️ 1 issues
- `test-tenant-isolation.ts` (5KB) ⚠️ 1 issues
- `test-vehicles-optimization.ts` (6KB) ⚠️ 1 issues

*OTHER:*
- `fix-permissions.sh` (951B)

---

## 📁 /migrations/

**Purpose:** Database migrations
**Files:** 34 | **Subdirectories:** 0

**📄 File Analysis:**

*DATABASE:*
- `000-nuclear-rebuild-elite-complete.sql` (27KB)
- `000_base_schema.sql` (6KB)
- `001-nuclear-rebuild-elite-supabase.sql` (38KB)
- `001_rls_policies.sql` (3KB)
- `001_rls_policies_old.sql` (4KB) ⚠️ 1 issues
- `002_indexes_constraints.sql` (4KB)
- `002_indexes_constraints_old.sql` (5KB) ⚠️ 1 issues
- `003_usage_tracking.sql` (6KB)
- `004_smartphone_ingestion.sql` (8KB)
- `005_canonical_vehicle_images.sql` (8KB)
- `006_vehicle_photos.sql` (749B)
- `007_supabase_storage_policies.sql` (1KB)
- `008_vehicle_onboarding_fields.sql` (3KB)
- `009_vehicle_images_minimal.sql` (404B)
- `009_vehicle_images_simple.sql` (1KB)
- `009_vehicle_images_table.sql` (5KB)
- `010_garage_performance_indexes.sql` (1KB)
- `010_odometer_readings.sql` (6KB)
- `010_vehicle_images_policies.sql` (680B)
- `011_fix_vehicle_images_table.sql` (1KB)
- `011_fuel_logs.sql` (4KB)
- `011_jurisdiction_system.sql` (5KB)
- `012_odometer_readings.sql` (4KB)
- `012_reminders_table.sql` (3KB)
- `013_service_records.sql` (4KB)
- `020_events_stream.sql` (2KB)
- `021_reminders_dedupe.sql` (2KB)
- `022_garage_default_column.sql` (260B)
- `029_fix_schema_migrations.sql` (351B)
- `030_vehicle_display_name.sql` (2KB)
- `031_security_fix_tenant_isolation.sql` (9KB)
- `nuclear-rebuild-enterprise-fixed.sql` (19KB)
- `nuclear-rebuild-enterprise-schema.sql` (18KB)
- `nuclear-rebuild-minimal-schema.sql` (9KB)

---

## 📊 SUMMARY

**Total Directories Analyzed:** 51
**Directories with Issues:** 25
**Total Issues Found:** 25
**Total Recommendations:** 36

**Most Common Issues:**
- Contains only one file - consider consolidation (23 occurrences)
- Empty directory (1 occurrences)
- Mixed file types - lacks clear purpose (1 occurrences)

**📈 Organizational Score:** 0/100

🚨 **Poor organization - significant restructuring needed**
