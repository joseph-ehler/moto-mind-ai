#!/bin/bash
# Run a single migration file via Supabase CLI
#
# Usage: ./scripts/database-suite/run-single-migration.sh 20251016_14_fix_security_issues.sql

MIGRATION_FILE="$1"

if [ -z "$MIGRATION_FILE" ]; then
  echo "❌ Usage: $0 <migration-file.sql>"
  exit 1
fi

MIGRATION_PATH="supabase/migrations/$MIGRATION_FILE"

if [ ! -f "$MIGRATION_PATH" ]; then
  echo "❌ Migration file not found: $MIGRATION_PATH"
  exit 1
fi

echo "🔄 Running migration: $MIGRATION_FILE"
echo ""

# Execute the SQL file by loading into local temp and pushing
# First, create a temp migration
TEMP_MIG_DIR="./.supabase-temp-migrations"
mkdir -p "$TEMP_MIG_DIR"
cp "$MIGRATION_PATH" "$TEMP_MIG_DIR/"

cd "$TEMP_MIG_DIR"

# Initialize supabase in temp dir
cat > config.toml << EOL
project_id = "ucbbzzoimghnaoihyqbd"

[db]
port = 54322
EOL

# Execute via psql through the linked project
cd ..
cat "$MIGRATION_PATH" | psql "$DATABASE_URL"

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Migration applied successfully!"
  
  # Record in schema_migrations table
  echo "INSERT INTO schema_migrations (filename) VALUES ('$MIGRATION_FILE') ON CONFLICT (filename) DO NOTHING;" | psql "$DATABASE_URL"
  
  echo "✅ Migration recorded in schema_migrations"
  
  # Cleanup
  rm -rf "$TEMP_MIG_DIR"
else
  echo ""
  echo "❌ Migration failed!"
  rm -rf "$TEMP_MIG_DIR"
  exit 1
fi
