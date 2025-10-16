# 🚀 Database Quick Reference

**For Daily Development - Post Nuclear Rebuild**

---

## 📋 **THE 7 CORE TABLES**

```sql
tenants          -- Multi-tenancy root
profiles         -- Users (Supabase auth integration)
vehicles         -- Core business entity  
garages          -- Vehicle organization
vehicle_events   -- THE TIMELINE (your product)
vehicle_images   -- Photos
reminders        -- Maintenance scheduling
```

---

## 🎯 **COMMON QUERIES**

### **Get Vehicle Timeline**
```sql
SELECT * FROM vehicle_events 
WHERE vehicle_id = $1 AND tenant_id = public.current_tenant_id()
ORDER BY date DESC, created_at DESC;
```

### **Add Event to Timeline**
```sql
INSERT INTO vehicle_events (tenant_id, vehicle_id, type, date, miles, payload)
VALUES (public.current_tenant_id(), $1, $2, $3, $4, $5);
```

### **Get User's Vehicles**
```sql
SELECT * FROM vehicles 
WHERE tenant_id = public.current_tenant_id() 
AND deleted_at IS NULL
ORDER BY nickname, make, model;
```

### **Health Check**
```sql
SELECT * FROM db_health_stats;
SELECT * FROM partition_coverage;
SELECT * FROM mv_freshness;
```

---

## 🔒 **SECURITY NOTES**

- **RLS is ENABLED** on all tenant tables
- **Always use** `public.current_tenant_id()` for tenant isolation
- **Never bypass** RLS in application code
- **Private schema** is secured - use public views only

---

## ⚡ **PERFORMANCE NOTES**

- **vehicle_events** is partitioned by date (yearly)
- **All queries** should include tenant_id for index efficiency
- **JSONB payload** has GIN indexes for fast search
- **Materialized views** refresh every 5 minutes

---

## 🛠️ **EVENT TYPES**

```sql
-- Supported event types:
'fuel'         -- Gas station visits
'maintenance'  -- Service records  
'odometer'     -- Mileage readings
'document'     -- Insurance, registration, etc.
'reminder'     -- Maintenance reminders
'inspection'   -- State inspections
```

---

## 📊 **MONITORING QUERIES**

### **Table Sizes**
```sql
SELECT * FROM db_health_stats ORDER BY live_rows DESC;
```

### **Partition Status**
```sql
SELECT * FROM partition_coverage ORDER BY tablename;
```

### **Recent Events**
```sql
SELECT type, COUNT(*) 
FROM vehicle_events 
WHERE tenant_id = public.current_tenant_id()
AND date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY type;
```

---

## 🚨 **WHAT NOT TO DO**

- ❌ **Don't query private schema directly**
- ❌ **Don't bypass RLS policies**
- ❌ **Don't UPDATE vehicle_events** (immutable)
- ❌ **Don't forget tenant_id** in queries
- ❌ **Don't hardcode UUIDs** in application code

---

## ✅ **BEST PRACTICES**

- ✅ **Use current_tenant_id()** for all tenant queries
- ✅ **Include deleted_at IS NULL** for active records
- ✅ **Use payload JSONB** for flexible event data
- ✅ **Leverage partitioning** for date-range queries
- ✅ **Monitor health views** regularly

---

**This is your clean, production-ready foundation. Build features, not technical debt!** 🚀
