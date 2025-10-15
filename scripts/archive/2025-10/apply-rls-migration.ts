#!/usr/bin/env tsx
/**
 * Apply RLS Migration Directly
 * Applies the secure RLS policies to the database
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'

dotenv.config({ path: path.join(__dirname, '../.env.local') })

const SUPABASE_URL = process.env.SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function applyRLSMigration() {
  console.log('🔒 APPLYING SECURE RLS POLICIES\n')
  
  const sqlFile = path.join(__dirname, '../supabase/migrations/20251015_secure_rls_policies.sql')
  const sql = fs.readFileSync(sqlFile, 'utf-8')
  
  // Split by semicolon and execute each statement
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))
  
  console.log(`📝 Found ${statements.length} SQL statements\n`)
  
  let successCount = 0
  let failCount = 0
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i]
    
    // Skip comments
    if (statement.startsWith('--') || statement.startsWith('/*')) {
      continue
    }
    
    // Extract table name for logging
    const tableMatch = statement.match(/ON\s+(\w+)/i)
    const table = tableMatch ? tableMatch[1] : 'unknown'
    
    process.stdout.write(`[${i + 1}/${statements.length}] ${table.padEnd(20)}... `)
    
    const { error } = await supabase.rpc('exec_sql', { 
      sql_string: statement + ';' 
    })
    
    if (error) {
      // Try direct execution if RPC fails
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({ sql_string: statement + ';' })
      })
      
      if (!response.ok) {
        console.log('❌')
        console.log(`   Error: ${error.message}`)
        failCount++
        continue
      }
    }
    
    console.log('✅')
    successCount++
  }
  
  console.log('\n' + '='.repeat(50))
  console.log(`✅ Success: ${successCount}`)
  console.log(`❌ Failed: ${failCount}`)
  console.log('='.repeat(50))
  
  if (failCount === 0) {
    console.log('\n🎉 RLS policies successfully applied!')
    console.log('\n💡 Next step: Update middleware to set tenant context')
  }
}

applyRLSMigration().catch(console.error)
