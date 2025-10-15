# Database Introspection Tool

## What It Does

Automatically generates complete database documentation by querying your Supabase database and extracting:

- **Schema**: All tables, columns, data types
- **Relationships**: Foreign keys and references
- **Indexes**: Performance optimization indicators
- **Security**: RLS policies and rules
- **Data Audit**: Row counts and tenant_id coverage
- **Issues**: Missing tenant_ids, orphaned data

## Usage

```bash
# Run introspection
npm run db:introspect
```

**Output:**
- Generates `docs/database-schema.json` with complete schema
- Prints summary to console
- Shows tenant data audit results

## What Gets Generated

```json
{
  "generatedAt": "2025-10-14T12:00:00.000Z",
  "database": "https://your-project.supabase.co",
  "totalTables": 30,
  "tables": [
    {
      "name": "vehicles",
      "columns": [
        {
          "name": "id",
          "dataType": "uuid",
          "isNullable": false,
          "defaultValue": "gen_random_uuid()"
        },
        {
          "name": "tenant_id",
          "dataType": "uuid",
          "isNullable": true
        }
      ],
      "foreignKeys": [
        {
          "columnName": "tenant_id",
          "foreignTableName": "tenants",
          "foreignColumnName": "id",
          "deleteRule": "CASCADE",
          "updateRule": "CASCADE"
        }
      ],
      "indexes": [
        {
          "name": "vehicles_tenant_id_idx",
          "definition": "CREATE INDEX vehicles_tenant_id_idx ON public.vehicles USING btree (tenant_id)"
        }
      ],
      "rowCount": 22,
      "rlsEnabled": true,
      "rlsPolicies": [
        {
          "name": "allow_all_vehicles",
          "permissive": true,
          "roles": ["authenticated"],
          "command": "ALL",
          "using": "true",
          "withCheck": null
        }
      ]
    }
  ],
  "tenantDataAudit": [
    {
      "table": "vehicles",
      "totalRows": 22,
      "rowsWithTenant": 22,
      "rowsMissingTenant": 0
    }
  ]
}
```

## Why This Matters

### Before
- ❌ AI assistant has to ask about every table
- ❌ Manual schema documentation gets stale
- ❌ No way to audit data integrity
- ❌ Can't generate accurate migrations

### After
- ✅ AI assistant knows complete schema
- ✅ Always up-to-date (run anytime)
- ✅ Automatic data integrity audit
- ✅ Can generate perfect migrations

## When to Run

Run this tool whenever:
- Database schema changes
- Adding/removing tables
- Changing column types
- Need to audit tenant_id coverage
- Want AI to understand your database

**Best Practice:** Run before asking AI to:
- Generate migrations
- Fix data issues
- Optimize queries
- Add new features

## Example Session

```bash
$ npm run db:introspect

🔍 DATABASE INTROSPECTION STARTING...

📍 Database: https://your-project.supabase.co

Found 30 tables

📊 Introspecting vehicles...
📊 Introspecting vehicle_events...
📊 Introspecting vehicle_images...
... (all tables)

🔍 Auditing tenant data...
  vehicles: 22/22 rows have tenant_id
  vehicle_events: 145/145 rows have tenant_id
  vehicle_images: 88/92 rows have tenant_id (4 missing!)
  photo_metadata: 120/120 rows have tenant_id

✅ Introspection complete!
📄 Report saved to: docs/database-schema.json

📊 SUMMARY:
  Tables: 30
  Total Rows: 1,234
  Tables with RLS: 15

🔒 TENANT DATA AUDIT:
  vehicles: 100.0% complete (0 missing)
  vehicle_events: 100.0% complete (0 missing)
  vehicle_images: 95.7% complete (4 missing) ⚠️
  photo_metadata: 100.0% complete (0 missing)
```

## Troubleshooting

### Error: "Missing environment variables"
Ensure you have in `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Error: "Permission denied"
The service role key needs full database access. Get it from:
Supabase Dashboard → Settings → API → service_role key

### No data in output
Check that:
- Database has tables
- Service role key is correct
- Network connection is working

## Integration with AI Assistant

After running introspection, the AI can:

1. **Read schema**: `docs/database-schema.json`
2. **Generate migrations** based on actual structure
3. **Audit data** for integrity issues
4. **Suggest optimizations** (indexes, RLS)
5. **Fix tenant issues** automatically

## Next Steps

1. Run introspection: `npm run db:introspect`
2. Review `docs/database-schema.json`
3. Check tenant data audit results
4. Fix any missing tenant_ids
5. Share schema with AI for future work

---

**This tool is your database's source of truth for AI assistance.**
