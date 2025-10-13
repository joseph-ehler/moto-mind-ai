# MotoMind Routing Audit & Cleanup Plan

## Critical Issue: Dual Routing System

Your app has **BOTH** Next.js routing systems running simultaneously:
- **Pages Router** (`/pages` directory)
- **App Router** (`/app` directory)

This creates conflicts, duplicates, and routing chaos.

---

## Current Routing Conflicts

### 🔴 **DUPLICATE: Vehicle Details**
- ✅ **KEEP:** `/app/(authenticated)/vehicles/[id]/page.tsx` - Modern, working
- ❌ **DELETE:** `/pages/vehicles/[id]/dashboard.tsx`
- ❌ **DELETE:** `/pages/vehicles/[id]/dashboard-clean.tsx`
- ❌ **DELETE:** `/pages/vehicles/[id]/timeline.tsx`
- ❌ **DELETE:** `/pages/vehicles/[id]/costs.tsx`
- ❌ **DELETE:** `/pages/vehicles/[id]/photos.tsx`
- ❌ **DELETE:** `/pages/vehicles/[id]/specifications.tsx`
- ⚠️ **BROKEN BACKUPS:** `/app/(authenticated)/vehicles/[id]/page.tsx.bak`, `.broken`, `.broken2`

### 🔴 **DUPLICATE: Event Details**
- ✅ **KEEP:** `/app/(authenticated)/vehicles/[id]/events/[eventId]/page.tsx`
- ✅ **KEEP:** `/app/(authenticated)/events/[id]/page.tsx` (if standalone events needed)
- ❌ **DELETE:** `/pages/vehicles/[id]/timeline/[eventId].tsx`

### 🔴 **DUPLICATE: Vehicle List**
- ✅ **KEEP:** Use `/app/(authenticated)/garage/page.tsx` OR create new `/app/(authenticated)/vehicles/page.tsx`
- ❌ **DELETE:** `/pages/vehicles/index.tsx`
- ❌ **DELETE:** `/pages/fleet.tsx` (seems like duplicate vehicle list)

### 🔴 **DUPLICATE: Onboarding**
- ✅ **KEEP:** `/app/(authenticated)/vehicles/[id]/capture/[eventType]/page.tsx` (if this is onboarding)
- ❌ **DELETE:** `/pages/onboard-vehicle.tsx`
- ❌ **DELETE:** `/pages/add-vehicle.tsx`
- ❌ **DELETE:** `/pages/vehicles/onboard.tsx`

### 🔴 **DUPLICATE: Garage/Garages**
- ✅ **KEEP:** `/app/(authenticated)/garage/page.tsx` (modern)
- ❌ **DELETE:** `/pages/garages/index.tsx`
- ❌ **DELETE:** `/pages/garages/[id].tsx`
- ❌ **DELETE:** `/pages/garages/new.tsx`

### 🔴 **DUPLICATE: Dashboard**
- ✅ **KEEP:** `/app/(authenticated)/dashboard/page.tsx`
- ❌ **DELETE:** `/pages/index.tsx` (if it's a dashboard)

### 🟡 **Design System Showcase Pages (Keep for Development)**
These are dev/showcase pages - keep for now but consider moving to separate route group:
- `/pages/design-system.tsx`
- `/pages/design-system-index.tsx`
- `/pages/design-rules.tsx`
- `/pages/color-system.tsx`
- `/pages/icons-system.tsx`
- `/pages/layout-system.tsx`
- `/pages/motion-system.tsx`
- `/pages/responsive-system.tsx`
- `/pages/spacing-system.tsx`
- `/pages/surfaces-system.tsx`
- `/pages/typography-system.tsx`
- `/app/(showcase)/calendar-showcase/page.tsx`
- `/app/(showcase)/file-test/page.tsx`
- `/app/(showcase)/vision-showcase/page.tsx`

### 🟡 **Test/Admin Pages (Keep for Development)**
- `/pages/test-integration.tsx`
- `/pages/admin/vehicles.tsx`
- `/pages/monitoring/vision-metrics.tsx`
- `/app/(authenticated)/test/ai-proposal/page.tsx`
- `/app/(authenticated)/test/batch-vision/page.tsx`
- `/app/(authenticated)/test/document-scanner/page.tsx`
- `/app/(authenticated)/test/vision-plugins/page.tsx`
- `/app/test-plugins/page.tsx`

---

## ✅ Clean App Router Structure (What to KEEP)

```
app/
├── (authenticated)/           # Authenticated routes
│   ├── alerts/
│   │   ├── [id]/page.tsx     ✅ Alert detail
│   │   └── page.tsx          ✅ Alerts list
│   ├── assistant/
│   │   └── page.tsx          ✅ AI Assistant
│   ├── capture/
│   │   └── fuel/page.tsx     ✅ Fuel capture
│   ├── dashboard/
│   │   └── page.tsx          ✅ Main dashboard
│   ├── events/
│   │   └── [id]/page.tsx     ✅ Standalone event detail
│   ├── garage/
│   │   └── page.tsx          ✅ Garage/vehicle list
│   ├── insights/
│   │   └── page.tsx          ✅ Insights
│   ├── profile/
│   │   ├── page.tsx          ✅ Profile
│   │   └── settings/page.tsx ✅ Settings
│   └── vehicles/
│       └── [id]/
│           ├── page.tsx                      ✅ Vehicle details (MAIN)
│           ├── capture/
│           │   ├── [eventType]/page.tsx     ✅ Capture by type
│           │   └── quick/page.tsx           ✅ Quick capture
│           ├── chat/page.tsx                ✅ Vehicle chat
│           ├── events/
│           │   └── [eventId]/page.tsx       ✅ Event detail
│           ├── history/
│           │   ├── page.tsx                 ✅ Service history
│           │   └── [serviceId]/page.tsx     ✅ Service detail
│           └── specs/page.tsx               ✅ Specifications
│
├── auth/
│   ├── callback/route.ts     ✅ Auth callback (API)
│   ├── error/page.tsx        ✅ Auth error
│   └── signin/page.tsx       ✅ Sign in
│
└── _app.tsx (pages router) - needed for Pages Router compat
```

---

## 🗑️ Pages to DELETE Immediately

### Duplicate Vehicle Pages
```bash
rm -rf /pages/vehicles/[id]/dashboard.tsx
rm -rf /pages/vehicles/[id]/dashboard-clean.tsx
rm -rf /pages/vehicles/[id]/timeline.tsx
rm -rf /pages/vehicles/[id]/timeline/[eventId].tsx
rm -rf /pages/vehicles/[id]/costs.tsx
rm -rf /pages/vehicles/[id]/photos.tsx
rm -rf /pages/vehicles/[id]/specifications.tsx
rm -rf /pages/vehicles/index.tsx
rm -rf /pages/vehicles/onboard.tsx
```

### Duplicate Onboarding/Add Vehicle
```bash
rm -rf /pages/onboard-vehicle.tsx
rm -rf /pages/add-vehicle.tsx
```

### Duplicate Garage Pages
```bash
rm -rf /pages/garages/
```

### Duplicate Fleet/Dashboard
```bash
rm -rf /pages/fleet.tsx
rm -rf /pages/index.tsx  # if it duplicates /app/dashboard
```

### Broken Backup Files
```bash
rm -rf /app/(authenticated)/vehicles/[id]/page.tsx.bak
rm -rf /app/(authenticated)/vehicles/[id]/page.tsx.broken
rm -rf /app/(authenticated)/vehicles/[id]/page.tsx.broken2
```

---

## 📋 Action Plan

### Phase 1: Fix Immediate Errors ✅
- [x] Fix `/api/vehicles/[id]` endpoint (tenant isolation)
- [x] Fix `/api/vehicles/[id]/events` endpoint (tenant isolation)

### Phase 2: Delete Duplicates (NOW)
1. Delete all `/pages/vehicles/` routes
2. Delete all `/pages/garages/` routes
3. Delete `/pages/onboard-vehicle.tsx`, `/pages/add-vehicle.tsx`
4. Delete `/pages/fleet.tsx`
5. Delete broken backup files in `/app/`

### Phase 3: Consolidate Routing
1. Keep **App Router only** (`/app` directory) for user-facing routes
2. Keep **Pages Router** (`/pages`) ONLY for:
   - `/pages/_app.tsx` (if needed for global providers)
   - `/pages/api/` directory (API routes)
   - Dev/showcase pages (move to `/app/(dev)/` later)

### Phase 4: Update Navigation
1. Audit all `useRouter()`, `<Link>`, and `router.push()` calls
2. Ensure they point to `/app/` routes, not `/pages/` routes
3. Update any hardcoded paths

### Phase 5: Testing
1. Test all core flows:
   - Onboard vehicle
   - View vehicle details
   - Capture event
   - View event details
2. Verify no 404s or routing conflicts

---

## 🎯 Final Clean Structure

**User Routes:** App Router (`/app`)
- `/dashboard` - Main dashboard
- `/garage` - Vehicle list
- `/vehicles/[id]` - Vehicle details
- `/vehicles/[id]/events/[eventId]` - Event details
- `/vehicles/[id]/capture/[type]` - Capture flows
- `/auth/signin` - Sign in

**API Routes:** Pages Router (`/pages/api`)
- All API endpoints stay in `/pages/api/`

**Dev/Showcase:** Move to `/app/(dev)` route group later
- Design system pages
- Test pages
- Admin pages

---

## Immediate Next Steps

1. **Run the deletion commands above**
2. **Test the app after each deletion batch**
3. **Update any broken links in the UI**
4. **Remove unused imports/components**

This will fix your "taxonomically incorrect" repo structure and eliminate routing chaos.
