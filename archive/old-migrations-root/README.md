# 🗄️ MotoMind Database Migrations

**Status:** ✅ Clean baseline established (2025-01-13)  
**Current Migration:** 000 (Golden Baseline)  
**Next Migration:** 001 (Phase 2+)

---

## 🎯 **CURRENT STATE**

We've reconciled the chaotic development history (140+ migrations) into a single golden baseline.

**Active Migration:**
- `000_GOLDEN_BASELINE_2025_01_13.sql` - Production schema baseline

**Archived Migrations:** 102 files moved to `archive/migrations/`
- Nuclear rebuilds: 5 files
- Emergency fixes: 3 files
- Consolidations: 8 files
- Development history: 86 files

---

## Directory Structure

```
migrations/
├── 000_GOLDEN_BASELINE_2025_01_13.sql  # ← Current production schema
│
├── applied/                             # Track applied migrations
│   ├── production.txt                   # Production tracker (baseline marked)
│   └── staging.txt                      # Staging tracker
│
├── rollback/                            # Rollback scripts (for future migrations)
│   └── (empty - ready for Phase 2)
│
└── seeds/                               # Test data seeds
    └── (ready for Phase 2 data)

archive/migrations/                      # Development history (reference only)
├── README.md                            # Archive documentation
├── nuclear_rebuilds/                    # 5 complete schema rebuilds
├── emergency_fixes/                     # 3 emergency patches
├── consolidated_attempts/               # 8 consolidation attempts
└── development_history/                 # 86 iterative migrations
```

## Usage

### Apply migrations

```bash
# Run all pending migrations
npm run db:migrate

# Apply specific migration
psql $DATABASE_URL -f migrations/001_schema_initial.sql
```

### Track applied migrations

After applying a migration to production, add an entry to `applied/production.txt`:

```
001 | 2025-01-13 | admin | Initial schema
002 | 2025-01-15 | admin | Added fuel level tracking
```

### Rollback

```bash
# Run rollback script
psql $DATABASE_URL -f migrations/rollback/002_rollback.sql

# Update tracker
# Remove the entry from applied/production.txt
```

## Creating New Migrations

1. **Find the highest number**
   ```bash
   ls migrations/*.sql | tail -1
   # 027_feature_analytics.sql
   ```

2. **Create next migration**
   ```bash
   touch migrations/028_feature_notifications.sql
   ```

3. **Write SQL**
   ```sql
   -- Migration: Add notifications system
   -- Created: 2025-01-15
   -- Author: admin
   
   CREATE TABLE notifications (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES users(id),
     type TEXT NOT NULL,
     message TEXT NOT NULL,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```

4. **Create rollback script** (optional)
   ```sql
   -- migrations/rollback/028_rollback.sql
   DROP TABLE IF EXISTS notifications;
   ```

5. **Test locally**
   ```bash
   npm run db:migrate
   ```

6. **Deploy to staging**
   ```bash
   # Apply to staging DB
   psql $STAGING_DATABASE_URL -f migrations/028_feature_notifications.sql
   
   # Track in staging
   echo "028 | $(date +%Y-%m-%d) | admin | Notifications system" >> migrations/applied/staging.txt
   ```

7. **Deploy to production**
   ```bash
   # Apply to production DB
   psql $PRODUCTION_DATABASE_URL -f migrations/028_feature_notifications.sql
   
   # Track in production
   echo "028 | $(date +%Y-%m-%d) | admin | Notifications system" >> migrations/applied/production.txt
   ```

## ⚠️ **CRITICAL: Phase 2+ Migration Guidelines**

**Starting from migration 001, all new migrations MUST follow these rules:**

### **✅ DO:**
1. **Be incremental** - One logical change per migration
2. **Test on staging first** - NEVER apply untested to production
3. **Write rollback scripts** - `rollback/NNN_rollback.sql` for every migration
4. **Document clearly** - Explain WHY, not just WHAT
5. **Track applied migrations** - Update `applied/production.txt` immediately
6. **Use semantic naming** - `001_add_weather_enrichment.sql` not `001_fix.sql`

### **❌ DON'T:**
1. **NEVER modify existing migrations** - Create a new one instead
2. **NO "nuclear rebuilds"** - Incremental only
3. **NO emergency prefixes** - CRITICAL, FINAL, FIX indicate panic
4. **NO duplicate numbers** - Check existing migrations first
5. **NO "just try it" deployments** - Test thoroughly first

### **📝 Migration Template:**
```sql
-- migrations/001_add_weather_enrichment.sql
-- Purpose: Add weather enrichment tracking for events
-- Phase: 2 (Intelligence Layer)
-- Author: Dev Team
-- Date: 2025-01-XX
-- Rollback: migrations/rollback/001_rollback.sql
-- Estimated time: < 5 seconds

-- Add enrichment tracking
CREATE TABLE IF NOT EXISTS event_enrichments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES vehicle_events(id),
    enrichment_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    data JSONB,
    fetched_at TIMESTAMPTZ,
    error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_enrichments_event ON event_enrichments(event_id);
CREATE INDEX idx_enrichments_pending ON event_enrichments(status) 
    WHERE status = 'pending';

-- Update tracker after applying:
-- echo "001 | $(date +%Y-%m-%d) | admin | Weather enrichment tracking" >> applied/production.txt
```

---

## Best Practices

1. **Never modify existing migrations** - Always create a new one
2. **Test on staging first** - Never apply untested migrations to production
3. **Keep migrations small** - One logical change per migration
4. **Write rollback scripts** - For ALL migrations
5. **Document everything** - Add comments explaining WHY
6. **Track applied migrations** - Update `applied/*.txt` after each deploy
7. **Review the baseline** - Read `docs/architecture/SCHEMA_BASELINE_2025_01_13.md` first

## Troubleshooting

### Migration failed midway

```bash
# Check what was applied
psql $DATABASE_URL -c "\dt"

# Fix the issue
# Re-run the migration or run rollback
```

### Migrations out of order

```bash
# Check applied migrations
cat migrations/applied/production.txt

# Re-run missing migrations in order
```
