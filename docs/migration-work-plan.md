# MotoMind Architecture Cleanup - Work Plan

## 🎯 Overview
Production-safe migration to clean up terminology, standardize APIs, and improve architecture consistency while preserving the Roman-inspired UX.

**Timeline:** 1-2 weeks with daily safe merges  
**Risk Level:** Low (each phase is independently deployable and reversible)

---

## 📋 Phase 1: Database & Infrastructure (Days 1-2)

### ✅ Task 1.1: Database Migration
**Owner:** Backend  
**Estimate:** 2 hours  
**Files:**
- `migrations/030_vehicle_display_name.sql` ✅ Created
- Update `scripts/run-migrations.ts` to include new migration

**Acceptance Criteria:**
- [ ] Migration runs successfully in staging
- [ ] All vehicles have `display_name` populated
- [ ] Health check shows 0 vehicles with missing display_name
- [ ] Rollback script tested and documented

**Validation Queries:**
```sql
-- Should return 0
SELECT COUNT(*) FROM vehicles WHERE display_name IS NULL;
-- Should return reasonable results
SELECT id, display_name, make, model FROM vehicles LIMIT 10;
```

### ✅ Task 1.2: Route Redirects
**Owner:** Frontend  
**Estimate:** 30 minutes  
**Files:**
- `next.config.js` ✅ Updated

**Acceptance Criteria:**
- [ ] `/fleet` redirects to `/vehicles` (permanent)
- [ ] `/onboard-vehicle` redirects to `/vehicles/onboard` (permanent)
- [ ] Redirects work for both direct URL access and client-side navigation
- [ ] No broken links in application

### ✅ Task 1.3: Health Check Endpoint
**Owner:** Backend  
**Estimate:** 1 hour  
**Files:**
- `pages/api/health.ts` ✅ Created

**Acceptance Criteria:**
- [ ] `/api/health` returns data integrity metrics
- [ ] Monitors vehicles missing display_name
- [ ] Checks for orphaned vehicles
- [ ] Returns appropriate HTTP status codes (200/503)

---

## 📋 Phase 2: API Standardization (Days 2-4)

### Task 2.1: Domain Types
**Owner:** Backend  
**Estimate:** 1 hour  
**Files:**
- `lib/domain/types.ts` ✅ Created
- `lib/http/envelope.ts` ✅ Created

**Acceptance Criteria:**
- [ ] All domain types defined with clear interfaces
- [ ] Discriminated union for VehicleEvent types
- [ ] Utility functions for vehicle display names
- [ ] API envelope helpers with dual format support

### Task 2.2: Update Vehicles API
**Owner:** Backend  
**Estimate:** 2 hours  
**Files:**
- `pages/api/vehicles/index.ts` (update to use new envelope)
- `pages/api/vehicles/[id].ts` (update to use display_name)

**Acceptance Criteria:**
- [ ] Supports both old and new envelope formats via feature flag
- [ ] Uses `display_name` field consistently
- [ ] Maintains backward compatibility
- [ ] Includes envelope usage metrics

**Feature Flag:**
```bash
# In .env.local
NEW_API_ENVELOPE=false  # Start with false, flip to true after frontend ready
```

### Task 2.3: Update Events API
**Owner:** Backend  
**Estimate:** 2 hours  
**Files:**
- `pages/api/vehicles/[id]/events.ts` (update validation)
- `lib/validation/events.ts` ✅ Created

**Acceptance Criteria:**
- [ ] Uses discriminated union validation
- [ ] Maintains mileage monotonic guard
- [ ] Supports all event types (odometer/maintenance/fuel/document)
- [ ] Proper error messages for validation failures

### Task 2.4: Update Garages API
**Owner:** Backend  
**Estimate:** 1 hour  
**Files:**
- `pages/api/garages/[id].ts` (update delete with transaction)
- `lib/db/transaction.ts` ✅ Created

**Acceptance Criteria:**
- [ ] DELETE supports reassignment via query parameter
- [ ] Uses transaction helper for atomic operations
- [ ] Returns detailed error messages for constraint violations
- [ ] Maintains tenant isolation

---

## 📋 Phase 3: Frontend Updates (Days 3-5)

### Task 3.1: Update Vehicle Components
**Owner:** Frontend  
**Estimate:** 3 hours  
**Files:**
- `components/vehicle/VehicleRow.tsx` (use display_name)
- `hooks/useVehicles.ts` (use new API envelope)
- `hooks/useNotifications.ts` (update for display_name)

**Acceptance Criteria:**
- [ ] All components use `getVehicleDisplayName()` utility
- [ ] API calls use envelope normalizers
- [ ] No references to deprecated `label` or `nickname` fields
- [ ] Optimistic UI still works correctly

### Task 3.2: Update Navigation
**Owner:** Frontend  
**Estimate:** 1 hour  
**Files:**
- `components/layout/AppNavigation.tsx` (update links)
- Search for any remaining `/fleet` references

**Acceptance Criteria:**
- [ ] All navigation uses `/vehicles` instead of `/fleet`
- [ ] Breadcrumbs and page titles updated
- [ ] No hardcoded legacy routes

### Task 3.3: Update Forms and Modals
**Owner:** Frontend  
**Estimate:** 2 hours  
**Files:**
- Vehicle editing forms
- Garage management modals
- Event creation forms

**Acceptance Criteria:**
- [ ] Forms use `display_name` field
- [ ] Validation matches backend schemas
- [ ] Error handling for new API responses
- [ ] User can customize vehicle display name

---

## 📋 Phase 4: Testing & Validation (Days 5-7)

### Task 4.1: API Contract Tests
**Owner:** Backend  
**Estimate:** 2 hours  
**Files:**
- `tests/api/vehicles.test.ts`
- `tests/api/garages.test.ts`
- `tests/api/events.test.ts`

**Acceptance Criteria:**
- [ ] Tests for both old and new envelope formats
- [ ] Validation tests for discriminated union events
- [ ] Transaction tests for garage deletion
- [ ] Error handling tests

### Task 4.2: Integration Tests
**Owner:** Full Stack  
**Estimate:** 3 hours  

**Test Scenarios:**
- [ ] Create vehicle with custom display_name
- [ ] Move vehicle between garages
- [ ] Delete garage with vehicle reassignment
- [ ] Create events of all types
- [ ] Navigation from old URLs (redirects)

### Task 4.3: Data Migration Validation
**Owner:** Backend  
**Estimate:** 1 hour  

**Validation Steps:**
- [ ] Run health check in staging - all green
- [ ] Spot check vehicle display names
- [ ] Verify no orphaned data
- [ ] Test rollback procedure

---

## 📋 Phase 5: Deployment & Monitoring (Days 7-14)

### Task 5.1: Staged Rollout
**Owner:** DevOps  
**Estimate:** 1 hour per stage  

**Rollout Stages:**
1. [ ] Deploy with `NEW_API_ENVELOPE=false` (backward compatible)
2. [ ] Monitor health checks for 24 hours
3. [ ] Flip `NEW_API_ENVELOPE=true` in staging
4. [ ] Test frontend with new envelope format
5. [ ] Deploy to production with new envelope
6. [ ] Monitor for 48 hours

### Task 5.2: Metrics & Monitoring
**Owner:** DevOps  
**Estimate:** 1 hour  

**Monitoring Setup:**
- [ ] Health check alerts for data integrity issues
- [ ] API response time monitoring
- [ ] Error rate tracking by endpoint
- [ ] Envelope usage metrics (old vs new format)

### Task 5.3: Legacy Cleanup
**Owner:** Full Stack  
**Estimate:** 2 hours  
**Wait Period:** 7-14 days of clean metrics

**Cleanup Tasks:**
- [ ] Remove `NEW_API_ENVELOPE` feature flag
- [ ] Delete old envelope format code
- [ ] Remove deprecated `label`/`nickname` references
- [ ] Clean up unused imports and files
- [ ] Update documentation

---

## 🚨 Rollback Plans

### Database Rollback
```sql
-- If needed (test in staging first)
ALTER TABLE vehicles DROP COLUMN IF EXISTS display_name;
ALTER TABLE vehicles DROP COLUMN IF EXISTS year;
```

### API Rollback
- Set `NEW_API_ENVELOPE=false`
- Redeploy previous version
- Monitor health checks

### Frontend Rollback
- Revert to previous component versions
- Use old API envelope format
- Test critical user flows

---

## 📊 Success Metrics

### Technical Metrics
- [ ] Health check shows 100% data integrity
- [ ] API response times < 200ms p95
- [ ] Zero 5xx errors related to migration
- [ ] All automated tests passing

### User Experience Metrics
- [ ] No user-reported issues with vehicle names
- [ ] Navigation works seamlessly
- [ ] All CRUD operations functional
- [ ] Roman UX principles maintained

### Business Metrics
- [ ] No impact on user engagement
- [ ] Feature development velocity maintained
- [ ] Developer satisfaction with cleaner codebase

---

## 🎯 Definition of Done

**Phase Complete When:**
- [ ] All tasks in phase completed
- [ ] Tests passing
- [ ] Code reviewed and approved
- [ ] Deployed to staging successfully
- [ ] Health checks green for 24 hours
- [ ] Ready for next phase

**Migration Complete When:**
- [ ] All legacy terminology removed
- [ ] APIs use consistent envelopes
- [ ] Database schema clean
- [ ] Documentation updated
- [ ] Team trained on new patterns
- [ ] Monitoring shows stable metrics

---

*This work plan ensures a safe, incremental migration that preserves the excellent Roman-inspired UX while cleaning up technical debt.*
