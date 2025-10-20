# 🔧 Troubleshooting Guide

**Phase 5: Common Issues & Solutions**

---

## 🎯 QUICK DIAGNOSIS

Run diagnostics first:

```bash
# Check overall health
npm run db health

# Check registry status
npm run db registry:stats

# Test embeddings
npm run db registry:similar -- --text "test" --threshold 0.1
```

---

## 🚨 AUTHENTICATION ISSUES

### Issue: "auth.uid() returns NULL"

**Symptoms:**
- RLS policies block all requests
- 500 errors on authenticated endpoints
- Policies work in Supabase dashboard but not in app

**Cause:** Using Supabase Auth functions (`auth.uid()`) with NextAuth

**Solution:**

```sql
-- ❌ DON'T USE (Returns NULL with NextAuth):
CREATE POLICY "user_policy" ON vehicles
  FOR ALL USING (auth.uid() = user_id::uuid);

-- ✅ USE INSTEAD (Permissive + API auth):
CREATE POLICY "Allow all operations" ON vehicles
  FOR ALL USING (true) WITH CHECK (true);

COMMENT ON POLICY "Allow all operations" ON vehicles IS 
  'Permissive - auth handled in API via NextAuth';
```

**Prevention:**
```bash
# Detect auth.uid() usage
npm run db schema:lint --table your_table
# Will show: ❌ Policy uses auth.uid() - returns NULL!
```

---

### Issue: "user_id should be TEXT not UUID"

**Symptoms:**
- Type mismatch errors
- Cannot store NextAuth user IDs
- Foreign key constraints fail

**Cause:** NextAuth uses TEXT IDs ("104135..."), not UUID

**Solution:**

```sql
-- ❌ WRONG:
CREATE TABLE vehicles (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL
);

-- ✅ CORRECT:
CREATE TABLE vehicles (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL
);

CREATE INDEX idx_vehicles_user_id ON vehicles(user_id);
```

**Migration Fix:**
```sql
-- If table already exists
ALTER TABLE vehicles 
  ALTER COLUMN user_id TYPE TEXT;
```

**Prevention:**
```bash
npm run db schema:lint --table vehicles
# Will show: ❌ user_id should be TEXT, not UUID
```

---

## 🔍 VECTOR SEARCH ISSUES

### Issue: "No similar objects found"

**Symptoms:**
- `registry:similar` returns empty results
- Even obvious matches aren't found

**Cause 1:** Threshold too high

**Solution:**
```bash
# Lower threshold (default is 0.5)
npm run db registry:similar \
  --text "vehicle notes" \
  --threshold 0.3

# Similarity ranges:
# 0.8+ = Near identical
# 0.6-0.8 = Very similar
# 0.4-0.6 = Related
# <0.4 = Loosely related
```

**Cause 2:** Embeddings not generated

**Solution:**
```bash
# Check if embeddings exist
npm run db registry:stats
# Look for: "Embedded: 0" → Need to generate

# Generate embeddings (one-time, ~3 min)
npm run db registry:embed
```

**Cause 3:** Search text too specific

**Solution:**
```bash
# ❌ Too specific:
npm run db registry:similar -- --text "vehicle_maintenance_notes_table"

# ✅ Better:
npm run db registry:similar -- --text "vehicle maintenance notes"
```

---

### Issue: "Vector search is slow"

**Symptoms:**
- Takes >2 seconds to search
- Multiple OpenAI API calls

**Cause:** Generating embedding on every search

**Solution:**
```bash
# Embeddings are cached in database
# But initial search needs API call for query embedding

# To speed up:
# 1. Use more specific domain filters
npm run db registry:similar \
  --text "notes" \
  --domain vehicles  # Filters results

# 2. Lower limit
--limit 5  # Instead of default 10
```

---

### Issue: "Embeddings cost too much"

**Symptoms:**
- High OpenAI API costs
- Need to re-embed frequently

**Reality Check:**
- 54 objects = $0.0011 (one-tenth of a cent)
- 1000 objects ≈ $0.02
- Re-embedding is rare (only after major schema changes)

**To Minimize Costs:**
```bash
# Only embed new objects (default behavior)
npm run db registry:embed

# Only re-embed when needed
npm run db registry:embed --refresh  # Rare!
```

---

## 📋 LINTING ISSUES

### Issue: "Too many false positives"

**Symptoms:**
- Valid tables flagged as errors
- Exceptions needed for legitimate cases

**Solution:** Edit `tools/db/schema-lints.yml`

```yaml
naming:
  tables:
    exceptions:
      - 'auth'      # Supabase auth schema
      - 'storage'   # Supabase storage
      - 'metadata'  # Your exception
```

---

### Issue: "Custom rules not working"

**Symptoms:**
- Edited `schema-lints.yml` but rules not applied

**Cause:** Syntax error in YAML

**Solution:**
```bash
# Validate YAML syntax
npm install -g js-yaml
js-yaml tools/db/schema-lints.yml

# Common errors:
# - Missing quotes around strings with special chars
# - Incorrect indentation (use 2 spaces)
# - Mixing tabs and spaces
```

---

### Issue: "Linter says table not found"

**Symptoms:**
```
❌ Table "my_table" not found in schema "public"
```

**Cause 1:** Table doesn't exist yet (migration not applied)

**Solution:**
```bash
# Check if table exists
npm run db query "SELECT * FROM my_table LIMIT 1"

# If not, apply migration first
npm run db migrate:run
```

**Cause 2:** Table in different schema

**Solution:**
```bash
# Specify schema
npm run db schema:lint --table my_table --schema custom_schema
```

---

## 🎯 PREFLIGHT ISSUES

### Issue: "Preflight command hangs"

**Symptoms:**
- Command doesn't return
- No output after "Running preflight checks..."

**Cause:** OpenAI API call timeout or database connection issue

**Solution:**
```bash
# Check database connection
npm run db health

# Check OpenAI API key
echo $OPENAI_API_KEY  # Should be set

# Test embedding service
npm run db registry:similar -- --text "test" --threshold 0.1

# If still hangs, check network:
curl -I https://api.openai.com  # Should return 200
```

---

### Issue: "Change plan JSON is huge"

**Symptoms:**
- `change_plan.json` is many MB
- CI artifacts too large

**Cause:** Including full embedding vectors in output

**Solution:** Already optimized! Vectors not included in change plan.

If still large:
```bash
# Reduce output
npm run db ai:preflight \
  --feature "X" \
  --limit 3  # Fewer duplicates in report
```

---

## 🗄️ REGISTRY ISSUES

### Issue: "Registry sync fails"

**Symptoms:**
```
❌ Failed to sync schema registry
Query failed: permission denied
```

**Cause:** Database user lacks permissions

**Solution:**
```sql
-- Grant required permissions
GRANT USAGE ON SCHEMA information_schema TO your_user;
GRANT SELECT ON ALL TABLES IN SCHEMA information_schema TO your_user;
GRANT SELECT ON ALL TABLES IN SCHEMA pg_catalog TO your_user;
```

---

### Issue: "Registry out of sync"

**Symptoms:**
- Search finds tables that don't exist
- Missing recently added tables

**Solution:**
```bash
# Re-sync registry
npm run db registry:sync

# Verify
npm run db registry:stats
```

**Automation:**
```bash
# Add to post-migration script
npm run db migrate:run && npm run db registry:sync
```

---

## ⚡ PERFORMANCE ISSUES

### Issue: "Commands are slow"

**Symptoms:**
- `schema:lint` takes >30 seconds
- `ai:preflight` takes >1 minute

**Diagnosis:**
```bash
# Check database latency
npm run db health --quick

# Check connection pooler
# Should see latency < 500ms
```

**Solutions:**

1. **Use transaction pooler for reads:**
```typescript
// Already optimized in connection manager
```

2. **Limit lint scope:**
```bash
# Instead of full schema
npm run db schema:lint

# Lint specific table
npm run db schema:lint --table my_table
```

3. **Cache embeddings:**
```bash
# Already done! Embeddings cached in DB
```

---

## 🔐 SECURITY ISSUES

### Issue: "Exposed credentials in logs"

**Symptoms:**
- DATABASE_URL in CI logs
- API keys visible in output

**Prevention:**
```yaml
# GitHub Actions - mask secrets
- name: Setup
  run: |
    echo "::add-mask::${{ secrets.DATABASE_URL }}"
    export DATABASE_URL="${{ secrets.DATABASE_URL }}"
```

**Solution if exposed:**
1. Rotate credentials immediately
2. Update secrets in CI/CD
3. Check for unauthorized access

---

## 🆘 ERROR MESSAGES DECODED

### "Query failed after Xms: column does not exist"

**Meaning:** SQL query references non-existent column

**Solution:**
```bash
# Check table schema
npm run db query "SELECT column_name FROM information_schema.columns WHERE table_name = 'your_table'"
```

---

### "OPENAI_API_KEY is required"

**Meaning:** Environment variable not set

**Solution:**
```bash
# Check if set
echo $OPENAI_API_KEY

# If not, add to .env.local
OPENAI_API_KEY=sk-proj-your-key-here

# Reload environment
source .env.local  # Or restart terminal
```

---

### "Rules file not found"

**Meaning:** `tools/db/schema-lints.yml` missing

**Solution:**
```bash
# Check if file exists
ls tools/db/schema-lints.yml

# If missing, recreate from template
# (File should exist from Phase 5 Day 3)
```

---

## 🔄 MIGRATION ISSUES

### Issue: "Migration creates duplicate"

**Symptoms:**
- Preflight detects >80% similarity
- Blocked with "Very similar table exists"

**Decision Tree:**

**1. Is it truly a duplicate?**
```bash
# Review the similar table
npm run db registry:search "similar_table_name"

# Check columns
npm run db query "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'similar_table'"
```

**2. If YES (reuse existing):**
```sql
-- Add columns to existing table instead
ALTER TABLE existing_table ADD COLUMN new_column TYPE;
```

**3. If NO (create new):**
- Document why it's different in PR
- Proceed with creation
- Update table comment to explain distinction

---

## 📊 DEBUGGING COMMANDS

### Check System Health

```bash
# Overall health
npm run db health

# Registry status
npm run db registry:stats

# Recent errors (if logging enabled)
npm run db query "SELECT * FROM error_log ORDER BY created_at DESC LIMIT 10"
```

### Verbose Mode

```bash
# Add DEBUG flag
DEBUG=* npm run db ai:preflight --feature "test"

# Shows:
# - Connection attempts
# - Query execution
# - API calls
```

### Test Individual Components

```bash
# Test embedding service
npm run db registry:embed --refresh

# Test linter
npm run db schema:lint --table vehicles

# Test similarity search
npm run db registry:similar -- --text "test" --threshold 0.1
```

---

## 💡 BEST PRACTICES

### Preventive Measures

1. **Run health check daily:**
```bash
npm run db health
```

2. **Sync registry after migrations:**
```bash
npm run db migrate:run && npm run db registry:sync
```

3. **Lint before deploying:**
```bash
npm run db schema:lint --table new_table
```

4. **Use preflight in CI:**
See `docs/CI_CD_INTEGRATION.md`

---

## 📞 GETTING HELP

### Debug Checklist

- [ ] Database connection working? (`npm run db health`)
- [ ] Environment variables set? (`echo $DATABASE_URL`)
- [ ] Registry synced? (`npm run db registry:stats`)
- [ ] Embeddings generated? (Check stats output)
- [ ] Latest code? (`git pull`)
- [ ] Dependencies updated? (`npm install`)

### Collect Debug Info

```bash
# System info
node --version
npm --version

# Database info
npm run db health > debug-health.txt

# Registry info
npm run db registry:stats > debug-registry.txt

# Recent queries
npm run db query "SELECT * FROM pg_stat_activity" > debug-activity.txt
```

---

## 📚 RELATED DOCS

- **User Guide:** `docs/PHASE_5_USER_GUIDE.md`
- **CI/CD Integration:** `docs/CI_CD_INTEGRATION.md`
- **Quick Reference:** `docs/QUICK_REFERENCE.md`

---

**Most issues are solved by syncing registry or checking environment variables! 🔧**
