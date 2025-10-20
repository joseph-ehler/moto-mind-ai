# 🚀 Apply Phase 5 Migration - Schema Registry

## ✅ MIGRATION FILE READY

**File:** `database/supabase/migrations/20251019_02_schema_registry.sql`

---

## 📋 HOW TO APPLY

### Method 1: Supabase Dashboard (Recommended)

1. **Go to Supabase Dashboard:**
   - https://supabase.com/dashboard/project/ucbbzzoimghnaoihyqbd

2. **Navigate to SQL Editor:**
   - Click "SQL Editor" in left sidebar

3. **Open the migration file:**
   - Copy contents of `database/supabase/migrations/20251019_02_schema_registry.sql`

4. **Paste and Run:**
   - Paste into SQL editor
   - Click "Run" button

5. **Verify Success:**
   - Should see success messages
   - Check for "✅" in output

---

### Method 2: Supabase CLI

```bash
# If you have Supabase CLI installed
supabase db push

# Or apply specific migration
supabase db execute database/supabase/migrations/20251019_02_schema_registry.sql
```

---

### Method 3: Direct psql (If you have connection string)

```bash
# Get connection string from Supabase dashboard
# Settings → Database → Connection string (Direct)

psql "postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres" \
  -f database/supabase/migrations/20251019_02_schema_registry.sql
```

---

## ✅ AFTER APPLYING

Once migration is applied, test with:

```bash
# 1. Sync the registry
npm run db registry:sync

# 2. Check statistics
npm run db registry:stats

# 3. Search for tables
npm run db registry:search "vehicle"
```

---

## 🎯 WHAT IT CREATES

**5 New Tables:**
- `registry.schemas` - All database objects
- `registry.columns` - Column details
- `registry.vector_index` - Similarity search
- `registry.change_history` - Audit log
- `registry.preflight_checks` - AI check logs

**Extensions:**
- `vector` - pgvector for similarity search
- `pg_trgm` - Text search

**Indexes:**
- 10+ indexes for fast queries
- Vector similarity index (IVFFlat)
- Trigram text search

**Functions:**
- `registry.infer_domain()` - Auto domain detection
- `registry.similarity_score()` - Cosine similarity

---

## 🚨 IF ERRORS OCCUR

**Common issues:**
1. **Extension already exists** - Safe to ignore
2. **Schema already exists** - Safe to ignore
3. **Permission denied** - Use service role key

**Rollback if needed:**
```sql
DROP SCHEMA IF EXISTS registry CASCADE;
```

---

## 📊 EXPECTED OUTPUT

When successful, you should see:

```
CREATE EXTENSION
CREATE SCHEMA
CREATE TABLE
CREATE INDEX
...
NOTICE:  ✅ Schema registry created successfully!
NOTICE:  📊 Tables: schemas, columns, vector_index, change_history, preflight_checks
NOTICE:  🔍 Ready for similarity detection and AI preflight checks
NOTICE:  🚀 Next: npm run db registry:sync to populate from existing schema
```

---

## 💡 NEED HELP?

The migration is safe and reversible. It only creates new tables in the `registry` schema - doesn't touch existing data.

Ready to apply? Choose your method above! 🚀
