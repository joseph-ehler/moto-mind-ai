# 🚨 Known Issues & Required Fixes

**Post-Nuclear Rebuild Technical Debt**  
**Date:** September 27, 2025  
**Status:** Issues identified, fixes available but not yet deployed  

---

## 🎯 **HONEST ASSESSMENT**

**What We Accomplished:**
- ✅ Eliminated 23 cruft tables → Clean 7-table foundation
- ✅ Security hardening (search_path, RLS, private schema)
- ✅ Supabase integration patterns
- ✅ Partitioning strategy for future scale

**What We Oversold:**
- ❌ Called it "production-ready" (it's a prototype foundation)
- ❌ Claimed "enterprise-grade" (it's 2-person MVP grade)
- ❌ Ignored architectural issues in excitement about cleanup

---

## 🚨 **CRITICAL ISSUES IDENTIFIED**

### **1. COMPOSITE PRIMARY KEY TRAP**
**Problem:** `PRIMARY KEY (id, date)` on `vehicle_events` makes foreign key references impossible/awkward

```sql
-- CURRENT (PROBLEMATIC):
PRIMARY KEY (id, date)  

-- If you ever need event_attachments table:
event_id UUID,
event_date DATE,
FOREIGN KEY (event_id, event_date) REFERENCES vehicle_events(id, date)  -- Clunky!
```

**Impact:** Any future table that needs to reference a specific event requires both `event_id` AND `event_date`

**Fix Available:** `CRITICAL-SCHEMA-FIXES.sql` - Changes to `PRIMARY KEY (id), UNIQUE (id, date)`

### **2. DATE vs TIMESTAMPTZ INCONSISTENCY**
**Problem:** Mixing date types causes timezone bugs

```sql
-- INCONSISTENT:
date DATE NOT NULL          -- vehicle_events
due_date DATE              -- reminders  
created_at TIMESTAMPTZ     -- everywhere else
```

**Impact:** 
- Service appointment at "2024-03-10" is ambiguous (9am EST or PST?)
- DST transitions cause bugs
- Client-side timezone conversion issues

**Fix Available:** `CRITICAL-SCHEMA-FIXES.sql` - Standardizes on TIMESTAMPTZ

### **3. SOFT DELETE VISIBILITY BUG**
**Problem:** RLS policies don't filter `deleted_at IS NULL`

```sql
-- CURRENT (BROKEN):
USING (tenant_id = public.current_tenant_id())

-- Users can see deleted records unless app explicitly filters
```

**Impact:**
- Deleted vehicles show up in lists
- Deleted events appear in timelines  
- Deleted garages are still selectable

**Fix Available:** `CRITICAL-SCHEMA-FIXES.sql` - Adds `deleted_at IS NULL` to all RLS policies

### **4. IMMUTABILITY RELIES ONLY ON TRIGGER**
**Problem:** `vehicle_events` has UPDATE trigger but no RLS UPDATE policy

**Impact:** If trigger is bypassed somehow, events could be updated (breaking immutability)

**Fix Available:** `CRITICAL-SCHEMA-FIXES.sql` - Removes UPDATE policy entirely (absence blocks operation)

### **5. FRAGILE MATERIALIZED VIEW REFRESH TRACKING**
**Problem:** Using `last_vacuum` as proxy for materialized view refresh time

```sql
-- HACKY:
stats.last_vacuum AS last_refresh  -- Could update for other reasons
```

**Impact:** Refresh tracking could be inaccurate

**Fix Available:** Use PostgreSQL's actual refresh timestamp (when available)

### **6. MISSING AUDIT COLUMN INDEXES**
**Problem:** `created_by`, `updated_by`, `deleted_by` have no indexes

**Impact:** Queries like "what did user X create?" are table scans

**Decision Needed:** Add indexes only if you plan to query by these columns

---

## 🔧 **DEPLOYMENT STRATEGY**

### **Option 1: Fix Now (Recommended for Prototype)**
```bash
# Deploy the fixes while you have no real data
psql your_db -f CRITICAL-SCHEMA-FIXES.sql
```

**Pros:** Clean foundation from the start  
**Cons:** Requires recreating `vehicle_events` table (loses any test data)

### **Option 2: Fix Later (When Issues Bite)**
- Keep current schema
- Build features and find what actually matters
- Fix issues when they become real problems

**Pros:** Don't over-engineer for problems you don't have  
**Cons:** Harder to fix with real data in tables

### **Option 3: Hybrid Approach**
- Fix the easy ones now (soft delete RLS, immutability policy)
- Leave the hard ones (composite PK) until needed
- Document the technical debt

---

## 📊 **IMPACT ASSESSMENT**

### **High Impact (Fix Soon)**
1. **Soft Delete Visibility** - Users seeing deleted records is a bug
2. **Immutability Gap** - Defense in depth missing
3. **DATE/TIMESTAMPTZ** - Will cause timezone bugs

### **Medium Impact (Fix When Needed)**
1. **Composite PK** - Only matters if you need to reference events from other tables
2. **Audit Indexes** - Only matters if you query by created_by/updated_by

### **Low Impact (Nice to Have)**
1. **MV Refresh Tracking** - Current approach works, just not perfect

---

## 🎯 **RECOMMENDED NEXT STEPS**

### **Immediate (This Week)**
1. **Deploy soft delete fixes** - Easy win, prevents user confusion
2. **Remove UPDATE policy** on vehicle_events - Belt and suspenders security
3. **Update documentation** - Remove "production-ready" claims

### **Short Term (Next Sprint)**
1. **Test partitioning** - Insert 1000 events across years, verify queries work
2. **Decide on date types** - Pick DATE or TIMESTAMPTZ and stick to it
3. **Build features** - Find out what actually matters to users

### **Long Term (When Needed)**
1. **Fix composite PK** - When you need to reference events from other tables
2. **Add audit indexes** - When you need to query by created_by/updated_by
3. **Optimize MV refresh** - When current tracking becomes problematic

---

## 💡 **KEY LESSONS LEARNED**

### **What Went Right**
- **Nuclear rebuild was correct** - 30→7 tables eliminated real technical debt
- **Security patterns are solid** - RLS, function hardening, schema security
- **Architecture is sound** - Timeline-first, event-driven, multi-tenant

### **What Went Wrong**
- **Oversold the maturity** - Called prototype foundation "production-ready"
- **Missed architectural issues** - Excitement about cleanup blinded us to real problems
- **Documentation inflation** - "Enterprise-grade" claims were premature

### **Going Forward**
- **Build features first** - Find out what users actually need
- **Fix issues when they bite** - Don't over-engineer for theoretical problems
- **Honest assessment always** - Good foundation ≠ battle-tested system

---

## 🔍 **VERIFICATION CHECKLIST**

After deploying fixes, verify:

```sql
-- 1. Check PK structure
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'vehicle_events' AND constraint_type = 'PRIMARY KEY';

-- 2. Verify RLS policies include deleted_at filter
SELECT tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('profiles', 'vehicles', 'garages', 'vehicle_images', 'reminders')
AND qual LIKE '%deleted_at IS NULL%';

-- 3. Confirm no UPDATE policy on vehicle_events
SELECT policyname FROM pg_policies 
WHERE tablename = 'vehicle_events' AND cmd = 'UPDATE';
-- Should return 0 rows

-- 4. Test partitioning works
INSERT INTO vehicle_events (tenant_id, vehicle_id, type, date, miles) 
VALUES ('550e8400-e29b-41d4-a716-446655440000', gen_random_uuid(), 'odometer', '2025-06-15', 50000);
```

---

**Bottom Line:** We have a solid prototype foundation with known issues. Fix the critical ones, build features, and iterate based on real user needs. Don't let perfect be the enemy of good, but also don't ship known bugs to users.**
