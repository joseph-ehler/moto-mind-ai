#!/usr/bin/env tsx
/**
 * Apply RLS Migration - Simple Version
 * Uses pg client to execute SQL directly
 * 
 * ⚠️  DEPRECATED - Use the unified CLI instead:
 *    npm run db rls:enable <table>
 *    npm run db rls:apply-nextauth <table>
 *    npm run db rls:validate
 * 
 * Migration Guide: docs/PHASE_4_MIGRATION_PLAN.md
 * This script will be removed in v4.0.0
 */

console.warn('\n⚠️  DEPRECATED: This script is deprecated!')
console.warn('   Use: npm run db rls:enable <table>')
console.warn('   Or:  npm run db rls:apply-nextauth <table>')
console.warn('   Migration guide: docs/PHASE_4_MIGRATION_PLAN.md')
console.warn('   This script will be removed in v4.0.0\n')

import { Client } from 'pg'
import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'

dotenv.config({ path: path.join(__dirname, '../.env.local') })

const DATABASE_URL = process.env.DATABASE_URL!

async function applyRLSMigration() {
  console.log('🔒 APPLYING SECURE RLS POLICIES\n')
  
  const client = new Client({ connectionString: DATABASE_URL })
  
  try {
    await client.connect()
    console.log('✅ Connected to database\n')
    
    const sqlFile = path.join(__dirname, '../supabase/migrations/20251015_secure_rls_policies.sql')
    const sql = fs.readFileSync(sqlFile, 'utf-8')
    
    console.log('📝 Executing migration...\n')
    
    await client.query(sql)
    
    console.log('✅ Migration applied successfully!\n')
    
    // Verify policies
    const { rows } = await client.query(`
      SELECT 
        schemaname,
        tablename,
        policyname,
        cmd,
        qual
      FROM pg_policies 
      WHERE schemaname = 'public'
      ORDER BY tablename, policyname;
    `)
    
    console.log('🔍 APPLIED POLICIES:\n')
    let currentTable = ''
    rows.forEach((row: any) => {
      if (row.tablename !== currentTable) {
        currentTable = row.tablename
        console.log(`\n📊 ${currentTable}:`)
      }
      console.log(`  ✅ ${row.policyname} (${row.cmd})`)
      if (row.qual && row.qual.includes('current_setting')) {
        console.log(`     🔒 Tenant-isolated`)
      }
    })
    
    console.log('\n' + '='.repeat(50))
    console.log('🎉 RLS POLICIES SUCCESSFULLY APPLIED!')
    console.log('='.repeat(50))
    console.log('\n💡 Next: Update middleware to set tenant context')
    
  } catch (error: any) {
    console.error('❌ Error:', error.message)
    throw error
  } finally {
    await client.end()
  }
}

applyRLSMigration().catch(console.error)
