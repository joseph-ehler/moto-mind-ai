#!/usr/bin/env tsx
/**
 * Autonomous Migration Generator
 * 
 * Generates database migrations automatically based on actions
 * Usage: npm run db:generate-migration <action> <table-name> [options]
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing environment variables')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

type MigrationAction = 
  | 'add-tenant-isolation'
  | 'fix-rls-policy'
  | 'add-composite-index'
  | 'add-foreign-key'
  | 'create-table'

interface MigrationParams {
  action: MigrationAction
  tableName: string
  options?: {
    columns?: string[]
    indexName?: string
    referenceTable?: string
  }
}

async function generateMigration(params: MigrationParams) {
  console.log(`\n🔧 Generating migration: ${params.action} on ${params.tableName}\n`)

  // Get current table structure
  const { data: columns } = await supabase.rpc('get_table_columns', {
    table_name_param: params.tableName
  })

  const { data: foreignKeys } = await supabase.rpc('get_table_foreign_keys', {
    table_name_param: params.tableName
  })

  const { data: rlsStatus } = await supabase.rpc('get_table_rls_status', {
    table_name_param: params.tableName
  })

  let migrationSQL = ''
  let rollbackSQL = ''

  switch (params.action) {
    case 'add-tenant-isolation':
      migrationSQL = generateTenantIsolationMigration(params.tableName, columns, rlsStatus, foreignKeys)
      rollbackSQL = generateTenantIsolationRollback(params.tableName)
      break

    case 'fix-rls-policy':
      migrationSQL = generateRLSPolicyFix(params.tableName, rlsStatus)
      rollbackSQL = generateRLSPolicyRollback(params.tableName)
      break

    case 'add-composite-index':
      migrationSQL = generateCompositeIndex(params.tableName, params.options?.columns || [])
      rollbackSQL = generateCompositeIndexRollback(params.tableName, params.options?.indexName || '')
      break

    case 'add-foreign-key':
      migrationSQL = generateForeignKey(params.tableName, params.options?.referenceTable || 'tenants')
      rollbackSQL = generateForeignKeyRollback(params.tableName)
      break

    default:
      console.error(`❌ Unknown action: ${params.action}`)
      process.exit(1)
  }

  // Save migrations
  const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '')
  const migrationName = `${timestamp}_${params.action}_${params.tableName}`.replace(/-/g, '_')

  const migrationsDir = path.join(process.cwd(), 'supabase/migrations')
  if (!fs.existsSync(migrationsDir)) {
    fs.mkdirSync(migrationsDir, { recursive: true })
  }

  const migrationPath = path.join(migrationsDir, `${migrationName}.sql`)
  const rollbackPath = path.join(migrationsDir, `${migrationName}_rollback.sql`)

  fs.writeFileSync(migrationPath, migrationSQL)
  fs.writeFileSync(rollbackPath, rollbackSQL)

  console.log('✅ Generated migration:', path.relative(process.cwd(), migrationPath))
  console.log('✅ Generated rollback:', path.relative(process.cwd(), rollbackPath))
  console.log('\n📝 Next steps:')
  console.log('   1. Review the migration file')
  console.log('   2. Run: npm run db:migrate')
  console.log('   3. Validate: npm run db:validate\n')

  return { migrationPath, rollbackPath }
}

function generateTenantIsolationMigration(
  tableName: string,
  columns: any[],
  rlsStatus: boolean,
  foreignKeys: any[]
): string {
  const hasTenantId = columns?.some(c => c.column_name === 'tenant_id')
  const hasTenantFK = foreignKeys?.some(fk => fk.column_name === 'tenant_id')

  let sql = `-- ============================================\n`
  sql += `-- ADD TENANT ISOLATION: ${tableName}\n`
  sql += `-- Generated: ${new Date().toISOString()}\n`
  sql += `-- ============================================\n\n`

  if (!hasTenantId) {
    sql += `-- Step 1: Add tenant_id column\n`
    sql += `ALTER TABLE ${tableName} ADD COLUMN tenant_id uuid;\n\n`

    sql += `-- Step 2: Add foreign key\n`
    sql += `ALTER TABLE ${tableName}\n`
    sql += `ADD CONSTRAINT ${tableName}_tenant_id_fkey\n`
    sql += `FOREIGN KEY (tenant_id)\n`
    sql += `REFERENCES tenants(id)\n`
    sql += `ON DELETE CASCADE;\n\n`

    sql += `-- Step 3: Populate tenant_id\n`
    sql += `-- TODO: Add table-specific population logic\n`
    sql += `-- Example strategies:\n`
    sql += `--   - From related table: UPDATE ${tableName} t SET tenant_id = (SELECT tenant_id FROM vehicles v WHERE v.id = t.vehicle_id);\n`
    sql += `--   - From user mapping: UPDATE ${tableName} t SET tenant_id = (SELECT tenant_id FROM user_tenants ut WHERE ut.user_id = t.user_id LIMIT 1);\n`
    sql += `--   - Default tenant: UPDATE ${tableName} SET tenant_id = 'YOUR_TENANT_ID' WHERE tenant_id IS NULL;\n\n`

    sql += `-- Step 4: Make NOT NULL (uncomment after population)\n`
    sql += `-- ALTER TABLE ${tableName} ALTER COLUMN tenant_id SET NOT NULL;\n\n`

    sql += `-- Step 5: Add index\n`
    sql += `CREATE INDEX IF NOT EXISTS idx_${tableName}_tenant_id ON ${tableName}(tenant_id);\n\n`
  }

  if (!rlsStatus) {
    sql += `-- Step 6: Enable RLS\n`
    sql += `ALTER TABLE ${tableName} ENABLE ROW LEVEL SECURITY;\n\n`
  }

  sql += `-- Step 7: Drop old policies\n`
  sql += `DO $$\n`
  sql += `BEGIN\n`
  sql += `  DROP POLICY IF EXISTS ${tableName}_tenant_isolation ON ${tableName};\n`
  sql += `EXCEPTION\n`
  sql += `  WHEN undefined_object THEN NULL;\n`
  sql += `END $$;\n\n`

  sql += `-- Step 8: Add tenant isolation policy\n`
  sql += `CREATE POLICY ${tableName}_tenant_isolation\n`
  sql += `ON ${tableName}\n`
  sql += `FOR ALL\n`
  sql += `TO authenticated\n`
  sql += `USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)\n`
  sql += `WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);\n\n`

  sql += `-- Verification\n`
  sql += `DO $$\n`
  sql += `DECLARE\n`
  sql += `  rls_enabled boolean;\n`
  sql += `  policy_count int;\n`
  sql += `BEGIN\n`
  sql += `  SELECT rowsecurity INTO rls_enabled FROM pg_tables WHERE tablename = '${tableName}';\n`
  sql += `  SELECT COUNT(*) INTO policy_count FROM pg_policies WHERE tablename = '${tableName}';\n`
  sql += `  \n`
  sql += `  RAISE NOTICE 'Tenant isolation added to ${tableName}';\n`
  sql += `  RAISE NOTICE 'RLS enabled: %', rls_enabled;\n`
  sql += `  RAISE NOTICE 'Policies: %', policy_count;\n`
  sql += `END $$;\n`

  return sql
}

function generateTenantIsolationRollback(tableName: string): string {
  let sql = `-- ============================================\n`
  sql += `-- ROLLBACK TENANT ISOLATION: ${tableName}\n`
  sql += `-- Generated: ${new Date().toISOString()}\n`
  sql += `-- WARNING: This will remove tenant_id and all isolation!\n`
  sql += `-- ============================================\n\n`

  sql += `-- Remove policy\n`
  sql += `DROP POLICY IF EXISTS ${tableName}_tenant_isolation ON ${tableName};\n\n`

  sql += `-- Disable RLS\n`
  sql += `ALTER TABLE ${tableName} DISABLE ROW LEVEL SECURITY;\n\n`

  sql += `-- Remove index\n`
  sql += `DROP INDEX IF EXISTS idx_${tableName}_tenant_id;\n\n`

  sql += `-- Remove foreign key\n`
  sql += `ALTER TABLE ${tableName} DROP CONSTRAINT IF EXISTS ${tableName}_tenant_id_fkey;\n\n`

  sql += `-- Remove column (WARNING: DELETES DATA)\n`
  sql += `-- ALTER TABLE ${tableName} DROP COLUMN tenant_id;\n\n`

  return sql
}

function generateRLSPolicyFix(tableName: string, rlsStatus: boolean): string {
  let sql = `-- ============================================\n`
  sql += `-- FIX RLS POLICY: ${tableName}\n`
  sql += `-- Generated: ${new Date().toISOString()}\n`
  sql += `-- ============================================\n\n`

  if (!rlsStatus) {
    sql += `-- Enable RLS\n`
    sql += `ALTER TABLE ${tableName} ENABLE ROW LEVEL SECURITY;\n\n`
  }

  sql += `-- Drop weak policies\n`
  sql += `DO $$\n`
  sql += `DECLARE\n`
  sql += `  pol RECORD;\n`
  sql += `BEGIN\n`
  sql += `  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = '${tableName}'\n`
  sql += `  LOOP\n`
  sql += `    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON ${tableName}';\n`
  sql += `  END LOOP;\n`
  sql += `END $$;\n\n`

  sql += `-- Add proper tenant isolation policy\n`
  sql += `CREATE POLICY ${tableName}_tenant_isolation\n`
  sql += `ON ${tableName}\n`
  sql += `FOR ALL\n`
  sql += `TO authenticated\n`
  sql += `USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)\n`
  sql += `WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);\n`

  return sql
}

function generateRLSPolicyRollback(tableName: string): string {
  let sql = `-- ============================================\n`
  sql += `-- ROLLBACK RLS POLICY FIX: ${tableName}\n`
  sql += `-- Generated: ${new Date().toISOString()}\n`
  sql += `-- ============================================\n\n`

  sql += `DROP POLICY IF EXISTS ${tableName}_tenant_isolation ON ${tableName};\n`
  sql += `ALTER TABLE ${tableName} DISABLE ROW LEVEL SECURITY;\n`

  return sql
}

function generateCompositeIndex(tableName: string, columns: string[]): string {
  const indexName = `idx_${tableName}_${columns.join('_')}`

  let sql = `-- ============================================\n`
  sql += `-- ADD COMPOSITE INDEX: ${tableName}\n`
  sql += `-- Columns: ${columns.join(', ')}\n`
  sql += `-- Generated: ${new Date().toISOString()}\n`
  sql += `-- ============================================\n\n`

  sql += `CREATE INDEX IF NOT EXISTS ${indexName}\n`
  sql += `ON ${tableName}(${columns.join(', ')});\n\n`

  sql += `-- Verification\n`
  sql += `DO $$\n`
  sql += `BEGIN\n`
  sql += `  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = '${indexName}') THEN\n`
  sql += `    RAISE NOTICE 'Index ${indexName} created successfully';\n`
  sql += `  ELSE\n`
  sql += `    RAISE WARNING 'Index ${indexName} was not created';\n`
  sql += `  END IF;\n`
  sql += `END $$;\n`

  return sql
}

function generateCompositeIndexRollback(tableName: string, indexName: string): string {
  let sql = `-- ============================================\n`
  sql += `-- ROLLBACK COMPOSITE INDEX: ${tableName}\n`
  sql += `-- Generated: ${new Date().toISOString()}\n`
  sql += `-- ============================================\n\n`

  sql += `DROP INDEX IF EXISTS ${indexName};\n`

  return sql
}

function generateForeignKey(tableName: string, referenceTable: string): string {
  let sql = `-- ============================================\n`
  sql += `-- ADD FOREIGN KEY: ${tableName}\n`
  sql += `-- References: ${referenceTable}\n`
  sql += `-- Generated: ${new Date().toISOString()}\n`
  sql += `-- ============================================\n\n`

  sql += `ALTER TABLE ${tableName}\n`
  sql += `ADD CONSTRAINT ${tableName}_tenant_id_fkey\n`
  sql += `FOREIGN KEY (tenant_id)\n`
  sql += `REFERENCES ${referenceTable}(id)\n`
  sql += `ON DELETE CASCADE;\n`

  return sql
}

function generateForeignKeyRollback(tableName: string): string {
  let sql = `-- ============================================\n`
  sql += `-- ROLLBACK FOREIGN KEY: ${tableName}\n`
  sql += `-- Generated: ${new Date().toISOString()}\n`
  sql += `-- ============================================\n\n`

  sql += `ALTER TABLE ${tableName} DROP CONSTRAINT IF EXISTS ${tableName}_tenant_id_fkey;\n`

  return sql
}

// CLI
const [action, tableName, ...options] = process.argv.slice(2)

if (!action || !tableName) {
  console.error('Usage: npm run db:generate-migration <action> <table-name> [options]')
  console.error('')
  console.error('Actions:')
  console.error('  add-tenant-isolation <table>')
  console.error('  fix-rls-policy <table>')
  console.error('  add-composite-index <table> <col1> <col2> ...')
  console.error('  add-foreign-key <table> [reference-table]')
  console.error('')
  console.error('Examples:')
  console.error('  npm run db:generate-migration add-tenant-isolation conversation_messages')
  console.error('  npm run db:generate-migration fix-rls-policy conversation_threads')
  console.error('  npm run db:generate-migration add-composite-index vehicles tenant_id deleted_at')
  process.exit(1)
}

generateMigration({
  action: action as MigrationAction,
  tableName,
  options: {
    columns: options,
  },
})
