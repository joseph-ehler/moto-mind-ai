# 🧪 Onboarding Fixes - Testing Guide

**Date:** October 19, 2025  
**Fixes Applied:** 3 critical onboarding improvements

---

## ✅ FIXES IMPLEMENTED

### Fix 1: Critical Redirect ✅
**File:** `lib/onboarding/check.ts`
**Change:** Routes to `/onboarding/vin` instead of `/onboarding/vehicle`
**Impact:** Users now go to VIN flow (not manual entry)

### Fix 2: Smart Vehicle Checking ✅
**File:** `lib/onboarding/check.ts`
**Enhancements:**
- Checks if user already has vehicles (skip onboarding)
- Handles abandoned sessions (>24h old)
- Provides gentle prompts instead of forcing flow

### Fix 3: Skip Option ✅
**File:** `app/(app)/onboarding/welcome/page.tsx`
**Change:** Added "I'll add a vehicle later" button
**Impact:** Users can explore dashboard before adding vehicle

### Fix 4: Dashboard Prompt ✅
**File:** `app/(app)/dashboard/page.tsx`
**Change:** Shows blue banner when user skips or abandons
**Impact:** Gentle reminder to add vehicle

---

## 🧪 TEST SCENARIOS

### Scenario 1: New User (Happy Path)
**Goal:** Complete onboarding with VIN

**Steps:**
1. Sign up / Sign in (first time)
2. Should see: `/onboarding/welcome`
3. Click "Scan VIN to Get Started"
4. Should navigate to: `/onboarding/vin` ✅ (not `/onboarding/vehicle`)
5. Enter VIN: `1FTFW1ET5BFC10312`
6. Wait for analysis
7. Enter mileage: `45000`
8. Enter nickname: "Test Truck"
9. Click "Add to Garage"
10. Should navigate to: `/onboarding/complete`
11. Auto-redirect to: `/dashboard` (after 3s)

**Expected Result:**
- ✅ VIN flow used (not manual)
- ✅ Vehicle added successfully
- ✅ Dashboard shows vehicle

---

### Scenario 2: User with Existing Vehicle
**Goal:** Skip onboarding if user already has vehicle

**Setup:**
```sql
-- Manually insert a vehicle for user
INSERT INTO user_vehicles (user_id, canonical_vehicle_id, nickname)
VALUES ('test-user-123', 'some-uuid', 'Test Car');
```

**Steps:**
1. Sign in as user with vehicle
2. Should skip onboarding
3. Should navigate directly to: `/dashboard`
4. Should NOT see onboarding prompt

**Expected Result:**
- ✅ Onboarding skipped
- ✅ Goes straight to dashboard
- ✅ No banner shown (user has vehicle)

---

### Scenario 3: Skip Onboarding
**Goal:** User can skip and explore dashboard

**Steps:**
1. Sign in (new user)
2. See welcome screen: `/onboarding/welcome`
3. Click "I'll add a vehicle later" (bottom link)
4. Should navigate to: `/dashboard?skippedOnboarding=true`
5. Should see blue banner: "Ready to add your first vehicle?"
6. Dashboard functional without vehicle

**Expected Result:**
- ✅ Onboarding skipped
- ✅ Dashboard accessible
- ✅ Blue banner shown
- ✅ "Add Vehicle" button in banner works

---

### Scenario 4: Abandoned Session (<24h)
**Goal:** Resume onboarding where user left off

**Setup:**
```sql
-- User started onboarding recently but didn't finish
INSERT INTO user_onboarding (user_id, started_at, vehicle_added)
VALUES ('test-user-123', NOW() - INTERVAL '2 hours', false);
```

**Steps:**
1. Sign in as user
2. Should resume onboarding
3. Should navigate to: `/onboarding/vin` ✅ (VIN flow)

**Expected Result:**
- ✅ Resumes at VIN step
- ✅ Not forced to start over

---

### Scenario 5: Abandoned Session (>24h)
**Goal:** Gentle prompt instead of forced onboarding

**Setup:**
```sql
-- User started onboarding long ago but never finished
INSERT INTO user_onboarding (user_id, started_at, vehicle_added)
VALUES ('test-user-123', NOW() - INTERVAL '48 hours', false);
```

**Steps:**
1. Sign in as user
2. Should NOT force onboarding
3. Should navigate to: `/dashboard?showOnboardingPrompt=true`
4. Should see blue banner: "Ready to add your first vehicle?"

**Expected Result:**
- ✅ Goes to dashboard (not forced back to onboarding)
- ✅ Banner shown as gentle reminder
- ✅ User can dismiss banner or click "Add Vehicle"

---

### Scenario 6: Dismiss Dashboard Prompt
**Goal:** User can dismiss the onboarding prompt

**Steps:**
1. Navigate to: `/dashboard?showOnboardingPrompt=true`
2. See blue banner
3. Click X button (top right of banner)
4. Banner should disappear

**Expected Result:**
- ✅ Banner dismissible
- ✅ User can continue using dashboard

---

### Scenario 7: Manual Entry Fallback
**Goal:** Manual entry still accessible

**Steps:**
1. Go to: `/onboarding/welcome`
2. Click "Or enter details manually"
3. Should navigate to: `/onboarding/vehicle`
4. Manual form should work

**Expected Result:**
- ✅ Manual entry still accessible
- ✅ Not removed, just deprioritized

---

## 📊 TEST MATRIX

| Scenario | Route | Expected | Status |
|----------|-------|----------|--------|
| New user | `/onboarding/welcome` → Click VIN | `/onboarding/vin` | ⬜ Test |
| Has vehicle | Sign in | `/dashboard` | ⬜ Test |
| Skip onboarding | Click "later" | `/dashboard?skippedOnboarding=true` | ⬜ Test |
| Recent abandon | Sign in | `/onboarding/vin` | ⬜ Test |
| Old abandon | Sign in | `/dashboard?showOnboardingPrompt=true` | ⬜ Test |
| Dismiss banner | Click X | Banner hidden | ⬜ Test |
| Manual entry | Click "manually" | `/onboarding/vehicle` | ⬜ Test |

---

## 🚨 REGRESSIONS TO CHECK

### Must Still Work:
- ✅ VIN decode API
- ✅ Duplicate vehicle detection
- ✅ Mileage capture
- ✅ Nickname input
- ✅ Auto-redirect on complete
- ✅ Manual entry flow
- ✅ Database writes

### Should NOT Break:
- ✅ Existing users with vehicles
- ✅ Onboarding completion tracking
- ✅ Dashboard functionality
- ✅ Navigation flows

---

## 🔍 EDGE CASES

### Edge Case 1: Multiple Sign-ins
**Test:** User signs in, skips, signs out, signs in again
**Expected:** Should remember they skipped (show prompt)

### Edge Case 2: Direct URL Access
**Test:** User navigates directly to `/onboarding/vin`
**Expected:** Should work (no auth required if logged in)

### Edge Case 3: Back Button
**Test:** User clicks back during onboarding
**Expected:** Should navigate back properly

### Edge Case 4: Network Error
**Test:** Network fails during VIN decode
**Expected:** Error shown, can retry

---

## ✅ ACCEPTANCE CRITERIA

**Fix 1 - Critical Redirect:**
- [ ] New users route to `/onboarding/vin` (not `/vehicle`)
- [ ] Abandoned sessions resume at `/onboarding/vin`

**Fix 2 - Smart Checking:**
- [ ] Users with vehicles skip onboarding
- [ ] Old abandoned sessions (>24h) go to dashboard with prompt
- [ ] Recent sessions (<24h) resume onboarding

**Fix 3 - Skip Option:**
- [ ] "I'll add later" button visible
- [ ] Clicking skip goes to dashboard
- [ ] Banner shows on dashboard

**Fix 4 - Dashboard Prompt:**
- [ ] Banner shows when `skippedOnboarding=true`
- [ ] Banner shows when `showOnboardingPrompt=true`
- [ ] "Add Vehicle" button works
- [ ] X button dismisses banner

---

## 🎯 SUCCESS METRICS

**Technical:**
- [ ] All test scenarios pass
- [ ] No TypeScript errors
- [ ] No console errors
- [ ] Database writes correct

**UX:**
- [ ] VIN flow is primary
- [ ] Skip option clear but secondary
- [ ] Banner helpful not annoying
- [ ] Flow feels natural

---

## 🐛 KNOWN ISSUES

**None yet - run tests to discover!**

---

## 📝 TESTING NOTES

**Environment:** Local dev (`npm run dev`)  
**Database:** Supabase (staging/dev)  
**Auth:** Supabase Auth  
**Browser:** Chrome (test in multiple)

**Before Testing:**
```bash
# Start dev server
npm run dev

# Clear browser data (test as new user)
# Use incognito mode
```

**After Testing:**
```bash
# Clean up test data
DELETE FROM user_onboarding WHERE user_id LIKE 'test-%';
DELETE FROM user_vehicles WHERE nickname LIKE 'Test%';
```

---

## 🚀 READY TO TEST

**Next Steps:**
1. Run through all 7 scenarios
2. Check test matrix
3. Verify edge cases
4. Document any bugs found
5. Fix bugs
6. Re-test
7. Ship it! 🎉

---

**Status:** ✅ Ready for testing  
**Estimated Time:** 20-30 minutes for full test suite
