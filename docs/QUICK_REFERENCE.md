# ⚡ Quick Reference - Phase 5

**One-page cheat sheet for database toolkit**

---

## 🚀 MOST USED COMMANDS

```bash
# Before creating a table
npm run db ai:preflight --feature "table purpose" --domain vehicles

# After schema changes
npm run db types:generate

# Lint schema
npm run db schema:lint --table my_table

# Find duplicates
npm run db registry:similar -- --text "search query"

# Sync registry
npm run db registry:sync
```

---

## 📋 ALL PHASE 5 COMMANDS

### Registry
| Command | Description |
|---------|-------------|
| `registry:sync` | Sync from information_schema |
| `registry:search <query>` | Search tables/views/enums |
| `registry:stats` | Show statistics |
| `registry:embed` | Generate embeddings |
| `registry:embed --refresh` | Re-embed all objects |
| `registry:similar -- --text "X"` | Find similar objects |

### Linting
| Command | Description |
|---------|-------------|
| `schema:lint` | Lint all tables |
| `schema:lint --table X` | Lint specific table |
| `schema:lint --show-all` | Show suggestions too |

### Preflight (All-in-One)
| Command | Description |
|---------|-------------|
| `ai:preflight --feature "X"` | Complete validation |
| `ai:preflight --table X` | Check existing table |
| `ai:preflight --domain X` | Filter by domain |

### Type Generation
| Command | Description |
|---------|-------------|
| `types:generate` | Generate TypeScript types |
| `types:generate --helpers` | Also generate helper types |
| `types:validate` | Validate types up-to-date |
| `types:watch` | Watch & regenerate on changes |

---

## 🎯 COMMON OPTIONS

### registry:similar Options
```bash
--text "query"           # Search text (required)
--threshold 0.5          # Min similarity (0-1)
--limit 10               # Max results
--kind table             # Filter: table|view
--domain vehicles        # Filter by domain
```

### schema:lint Options
```bash
--table vehicles         # Lint specific table
--schema public          # Schema name
--show-all               # Include suggestions
```

### ai:preflight Options
```bash
--feature "description"  # Feature name
--domain vehicles        # Domain filter
--table my_table         # Table to validate
--output plan.json       # Output file
```

---

## 🎨 RISK INDICATORS

| Icon | Similarity | Action |
|------|------------|--------|
| 🔴 | ≥80% | HIGH - Reuse existing! |
| 🟡 | 60-79% | MEDIUM - Review carefully |
| 🟢 | 40-59% | LOW - Consider reusing |
| ⚪ | <40% | WEAK - Probably OK |

---

## 🏷️ SEVERITY LEVELS

| Level | Meaning | Required Action |
|-------|---------|-----------------|
| **Error** | Blocks deploy | ❌ Must fix |
| **Warning** | Review needed | ⚠️  Should fix |
| **Info** | Suggestion | 💡 Optional |

---

## 🎯 PREFLIGHT STATUSES

| Status | Meaning | Action |
|--------|---------|--------|
| **PASSED** | All clear | ✅ Safe to proceed |
| **NEEDS_REVIEW** | Duplicates found | ⚠️  Review similar tables |
| **BLOCKED** | Critical issues | ❌ Fix blockers first |

---

## 🛠️ COMMON FIXES

### Add user_id (NextAuth)
```sql
ALTER TABLE my_table ADD COLUMN user_id TEXT NOT NULL;
CREATE INDEX idx_my_table_user_id ON my_table(user_id);
```

### Add timestamps
```sql
ALTER TABLE my_table 
  ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN updated_at TIMESTAMPTZ;
```

### Enable RLS (NextAuth)
```sql
ALTER TABLE my_table ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations" ON my_table
  FOR ALL USING (true) WITH CHECK (true);

COMMENT ON POLICY "Allow all operations" ON my_table IS 
  'Permissive - auth handled in API via NextAuth';
```

### Fix auth.uid() Policy
```sql
-- ❌ Remove this:
DROP POLICY "old_policy" ON my_table;

-- ✅ Create this:
CREATE POLICY "Allow all operations" ON my_table
  FOR ALL USING (true) WITH CHECK (true);
```

---

## 🚨 ANTI-PATTERNS (Never Do!)

```sql
-- ❌ NEVER: auth.uid() with NextAuth
CREATE POLICY ... USING (auth.uid() = user_id);

-- ❌ NEVER: UUID user_id with NextAuth
user_id UUID REFERENCES auth.users(id);

-- ❌ NEVER: DELETE/UPDATE without WHERE
DELETE FROM vehicles;  -- Dangerous!

-- ❌ NEVER: SQL injection
query(`SELECT * FROM vehicles WHERE vin = '${userInput}'`);
```

---

## ✅ BEST PRACTICES (Always Do!)

```sql
-- ✅ TEXT user_id for NextAuth
user_id TEXT NOT NULL;

-- ✅ Permissive RLS
USING (true) WITH CHECK (true);

-- ✅ Required columns
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
updated_at TIMESTAMPTZ;

-- ✅ Indexes on foreign keys
CREATE INDEX idx_table_user_id ON table(user_id);

-- ✅ Table comments
COMMENT ON TABLE my_table IS 'Purpose of this table';
```

---

## 🔄 TYPICAL WORKFLOWS

### Before Creating Table
```bash
# 1. Check for duplicates
npm run db ai:preflight --feature "vehicle notes" --domain vehicles

# 2. If duplicate found, reuse existing table

# 3. If creating new, run preflight again
npm run db ai:preflight --table new_table

# 4. Fix any blockers
npm run db schema:lint --table new_table

# 5. Deploy
```

### After Migration
```bash
# 1. Sync registry
npm run db registry:sync

# 2. Verify
npm run db registry:stats

# 3. Re-embed if major changes
npm run db registry:embed
```

### In CI/CD
```bash
# Run preflight
npm run db ai:preflight --feature "$PR_TITLE" --output result.json

# Check status
if [ "$(jq -r '.status' result.json)" = "blocked" ]; then
  exit 1
fi
```

---

## 📊 UNDERSTANDING SCORES

### Similarity Scores
- **90-100%** - Virtually identical (definitely reuse!)
- **75-89%** - Very similar (strongly consider reusing)
- **60-74%** - Similar (review carefully)
- **40-59%** - Related (might share domain)
- **<40%** - Weakly related

### Lint Pass Rates
- **100%** - Perfect! No issues
- **90-99%** - Good (minor warnings)
- **75-89%** - OK (some improvements needed)
- **<75%** - Needs work (multiple issues)

---

## 🎓 CHEAT CODES

### Reset Everything
```bash
# Danger! Only in development
npm run db registry:sync  # Re-sync from scratch
npm run db registry:embed --refresh  # Re-generate all embeddings
```

### Quick Debug
```bash
npm run db health           # Check database
npm run db registry:stats   # Check registry
echo $OPENAI_API_KEY        # Check API key
```

### Batch Operations
```bash
# Lint multiple tables
for table in vehicles trips expenses; do
  npm run db schema:lint --table $table
done

# Search multiple queries
for query in "vehicle" "trip" "expense"; do
  npm run db registry:similar -- --text "$query"
done
```

---

## 🔗 QUICK LINKS

| Document | Purpose |
|----------|---------|
| [User Guide](PHASE_5_USER_GUIDE.md) | Complete feature docs |
| [CI/CD](CI_CD_INTEGRATION.md) | Automation setup |
| [Troubleshooting](TROUBLESHOOTING.md) | Fix common issues |
| [Migration Rules](DATABASE_MIGRATION_RULES.md) | NextAuth patterns |

---

## 💡 PRO TIPS

1. **Run preflight before every new table** - Catches duplicates early
2. **Sync registry after migrations** - Keeps search up-to-date
3. **Lower threshold for exploration** - Use 0.3-0.4 to discover related tables
4. **Commit change_plan.json** - Creates audit trail
5. **Use --show-all for full picture** - See all suggestions

---

## 🆘 EMERGENCY COMMANDS

```bash
# Database down?
npm run db health

# Registry broken?
npm run db registry:sync

# Embeddings missing?
npm run db registry:embed

# Everything broken?
# 1. Check environment variables
# 2. Restart database connection
# 3. Re-sync registry
# 4. Regenerate embeddings
```

---

## 📱 ONE-LINERS

```bash
# Complete validation
npm run db ai:preflight --feature "my feature" --domain vehicles

# Quick duplicate check
npm run db registry:similar -- --text "my table" --threshold 0.4

# Fast lint
npm run db schema:lint --table my_table

# Update everything
npm run db registry:sync && npm run db registry:embed
```

---

**Print this page and keep it handy! 📄**

**Most common command:** `npm run db ai:preflight --feature "X" --domain Y`

**Most useful option:** `--threshold 0.4` (for similarity search)

**Most important rule:** Always check for duplicates first! 🔍
