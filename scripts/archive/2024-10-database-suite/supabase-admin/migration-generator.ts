/**
 * Migration Generator Module
 * Auto-generate SQL migrations from commands
 */

export interface MigrationCommand {
  action: 'add-column' | 'drop-column' | 'add-index' | 'add-policy'
  table: string
  column?: string
  type?: string
  options?: string[]
}

export function generateMigration(
  commands: MigrationCommand[],
  secure: boolean = true
): { up: string; down: string } {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '').slice(0, 15)
  const migrationName = commands.map(c => `${c.action}_${c.table}`).join('_')
  
  let up = `-- Migration: ${timestamp}_${migrationName}.sql\n`
  up += `-- Generated: ${new Date().toISOString()}\n\n`
  
  let down = `-- Rollback for: ${timestamp}_${migrationName}.sql\n\n`
  
  for (const cmd of commands) {
    switch (cmd.action) {
      case 'add-column':
        up += generateAddColumn(cmd, secure)
        down += generateDropColumn(cmd)
        break
      case 'drop-column':
        up += generateDropColumn(cmd)
        // Rollback for drop is complex, add comment
        down += `-- TODO: Add column back with correct type and constraints\n`
        break
      case 'add-index':
        up += generateAddIndex(cmd)
        down += generateDropIndex(cmd)
        break
      case 'add-policy':
        up += generateAddPolicy(cmd, secure)
        down += generateDropPolicy(cmd)
        break
    }
    
    up += '\n'
    down += '\n'
  }
  
  return { up, down }
}

function generateAddColumn(cmd: MigrationCommand, secure: boolean): string {
  const { table, column, type, options = [] } = cmd
  
  let sql = `-- Add column ${column} to ${table}\n`
  sql += `ALTER TABLE ${table}\n`
  sql += `ADD COLUMN ${column} ${type}`
  
  if (options.includes('not-null')) {
    sql += ' NOT NULL'
  }
  
  if (options.includes('default')) {
    // Add default value logic
    if (type?.includes('uuid')) {
      sql += ' DEFAULT gen_random_uuid()'
    }
  }
  
  sql += ';\n'
  
  // Add RLS policy update if secure
  if (secure && column === 'tenant_id') {
    sql += `\n-- Add RLS policies for tenant isolation\n`
    sql += generateTenantRLSPolicies(table)
  }
  
  return sql
}

function generateDropColumn(cmd: MigrationCommand): string {
  return `ALTER TABLE ${cmd.table} DROP COLUMN IF EXISTS ${cmd.column};\n`
}

function generateAddIndex(cmd: MigrationCommand): string {
  const { table, column } = cmd
  const indexName = `idx_${table}_${column}`
  
  return `CREATE INDEX IF NOT EXISTS ${indexName} ON ${table}(${column});\n`
}

function generateDropIndex(cmd: MigrationCommand): string {
  const { table, column } = cmd
  const indexName = `idx_${table}_${column}`
  
  return `DROP INDEX IF EXISTS ${indexName};\n`
}

function generateAddPolicy(cmd: MigrationCommand, secure: boolean): string {
  const { table } = cmd
  
  if (secure) {
    return generateTenantRLSPolicies(table)
  }
  
  return `-- TODO: Add custom RLS policy for ${table}\n`
}

function generateDropPolicy(cmd: MigrationCommand): string {
  const { table } = cmd
  
  return `DROP POLICY IF EXISTS "${table}_select" ON ${table};
DROP POLICY IF EXISTS "${table}_insert" ON ${table};
DROP POLICY IF EXISTS "${table}_update" ON ${table};
DROP POLICY IF EXISTS "${table}_delete" ON ${table};\n`
}

function generateTenantRLSPolicies(table: string): string {
  return `
CREATE POLICY "${table}_select" 
ON ${table} FOR SELECT TO authenticated
USING (tenant_id::text = current_setting('app.current_tenant_id', true));

CREATE POLICY "${table}_insert" 
ON ${table} FOR INSERT TO authenticated
WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true));

CREATE POLICY "${table}_update" 
ON ${table} FOR UPDATE TO authenticated
USING (tenant_id::text = current_setting('app.current_tenant_id', true))
WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true));

CREATE POLICY "${table}_delete" 
ON ${table} FOR DELETE TO authenticated
USING (tenant_id::text = current_setting('app.current_tenant_id', true));
`
}

export function saveMigration(
  up: string,
  down: string,
  migrationPath: string
): void {
  const fs = require('fs')
  const path = require('path')
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '').slice(0, 15)
  
  // Save up migration
  const upFile = path.join(migrationPath, `${timestamp}_migration.sql`)
  fs.writeFileSync(upFile, up, 'utf-8')
  
  // Save down migration
  const downFile = path.join(migrationPath, `${timestamp}_migration_rollback.sql`)
  fs.writeFileSync(downFile, down, 'utf-8')
  
  console.log(`\n✅ Migration saved:`)
  console.log(`   Up:   ${upFile}`)
  console.log(`   Down: ${downFile}`)
}
