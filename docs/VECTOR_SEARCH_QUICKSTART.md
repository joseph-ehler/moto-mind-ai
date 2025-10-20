# Vector Search - Quick Reference

## 🎯 What Is This?

Semantic search for database schema objects. Find tables/views by **meaning**, not just keywords.

**Example:** Search "vehicle maintenance" → finds `user_maintenance_preferences` (41.5% match)

---

## 🚀 Commands

### 1. Generate Embeddings (First Time)

```bash
npm run db registry:embed
```

**What it does:**
- Reads all tables/views from `registry.schemas`
- Generates embeddings via OpenAI
- Stores in `registry.vector_index`

**Cost:** ~$0.0011 for 54 objects  
**Time:** ~3 minutes

### 2. Search Similar Objects

```bash
npm run db registry:similar -- --text "your search query"
```

**Options:**
- `--text <query>` - Search text (REQUIRED)
- `--threshold <n>` - Min similarity 0-1 (default: 0.7)
- `--limit <n>` - Max results (default: 10)
- `--kind <type>` - Filter: table or view
- `--domain <name>` - Filter by domain

---

## 📖 Examples

### Find Vehicle Tables
```bash
npm run db registry:similar -- --text "vehicle" --threshold 0.3 --limit 5
```

**Results:**
```
1. user_vehicles           (41.4% match)
2. vehicles                (40.5% match)
3. vehicle_spec_enhancements (39.2% match)
```

### Find Maintenance/Service Tables
```bash
npm run db registry:similar -- --text "service maintenance notes" --threshold 0.3
```

**Results:**
```
1. user_maintenance_preferences (41.5% match)
2. vehicle_spec_enhancements    (32.9% match)
```

### Filter by Domain
```bash
npm run db registry:similar -- --text "expenses" --domain vehicles
```

---

## 🔧 When to Use

### ✅ Use When:
- Planning new tables (check for duplicates)
- Finding related objects
- Understanding schema structure
- AI preflight checks

### ❌ Don't Use When:
- Looking for exact name matches → use `registry:search`
- Querying data → use `query`
- Simple keyword search → use grep

---

## 💡 Pro Tips

### 1. Lower Threshold for Exploration
Default 0.7 is conservative. Try 0.3-0.5 for discovery:
```bash
--threshold 0.3
```

### 2. Describe What You Want
Better:  "track vehicle service history with notes"  
Worse:   "service table"

### 3. Re-embed After Schema Changes
```bash
npm run db registry:embed --refresh
```

### 4. Check Similarity Scores
- **>70%** - Very similar (potential duplicate)
- **50-70%** - Related concepts
- **30-50%** - Loosely related
- **<30%** - Weak connection

---

## 🎓 How It Works

1. **Embedding Generation:**
   - Combines: table name + domain + description + columns
   - Example: `public.vehicles | Type: table | Domain: vehicles | Columns: id, user_id, vin...`
   - Sent to OpenAI `text-embedding-3-small` → 1536-dim vector

2. **Similarity Search:**
   - Query text → embedding vector
   - pgvector `<=>` (cosine distance)
   - Returns closest matches

3. **Cost:**
   - Model: `text-embedding-3-small`
   - Price: $0.02 per 1M tokens
   - Typical: 1000 tokens per table
   - 50 tables ≈ $0.001

---

## 🚨 Troubleshooting

### "No similar objects found"
- Lower `--threshold` to 0.3 or 0.2
- Make query more descriptive
- Check embeddings exist: `npm run db registry:stats`

### "OPENAI_API_KEY is required"
- Add to `.env.local`:
  ```
  OPENAI_API_KEY=sk-proj-your-key-here
  ```

### Re-generate Embeddings
```bash
npm run db registry:embed --refresh
```

---

## 📊 Integration with Preflight

**Future Day 4:** AI Preflight will automatically:
1. Parse migration DDL
2. Extract table/column intent
3. Search similar objects
4. Flag potential duplicates

**Example:**
```
⚠️  SIMILAR TABLE FOUND
New: vehicle_service_logs
Existing: user_maintenance_preferences (72% match)
Recommendation: Reuse existing table
```

---

**Built with:** OpenAI + pgvector  
**Cost:** <$0.01 per 1000 objects  
**Speed:** Sub-second search
