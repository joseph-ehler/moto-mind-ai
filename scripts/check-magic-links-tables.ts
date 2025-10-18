/**
 * Check Magic Links Tables Status
 * 
 * Introspect database to see what magic link objects already exist
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkMagicLinksObjects() {
  console.log('🔍 Checking Magic Links Database Objects...\n')

  // Check tables
  const { data: tables, error: tablesError } = await supabase.rpc('exec_sql', {
    query: `
      SELECT tablename 
      FROM pg_tables 
      WHERE tablename LIKE '%magic%' OR tablename LIKE '%rate_limit%'
      ORDER BY tablename;
    `
  })

  console.log('📊 Tables with "magic" or "rate_limit":')
  if (tablesError) {
    console.log('  Query error:', tablesError.message)
    console.log('  Trying alternative method...')
    
    // Try direct query
    const { data: tableData, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .or('table_name.ilike.%magic%,table_name.ilike.%rate%')

    if (!tableError && tableData) {
      tableData.forEach((t: any) => console.log(`  - ${t.table_name}`))
    } else {
      console.log('  ❌ Could not query tables')
    }
  } else if (tables && tables.length > 0) {
    tables.forEach((t: any) => console.log(`  - ${t.tablename}`))
  } else {
    console.log('  ✅ No magic link tables found')
  }

  console.log('\n📍 Indexes with "magic" or "rate":')
  
  // Check indexes
  const { data: indexes } = await supabase.rpc('exec_sql', {
    query: `
      SELECT indexname, tablename
      FROM pg_indexes 
      WHERE indexname LIKE '%magic%' OR indexname LIKE '%rate%'
      ORDER BY indexname;
    `
  })

  if (indexes && indexes.length > 0) {
    indexes.forEach((i: any) => console.log(`  - ${i.indexname} (on ${i.tablename})`))
  } else {
    // Try alternative
    try {
      const { data } = await supabase.rpc('pg_indexes_query')
      console.log('  Trying alternative...')
    } catch (e) {
      console.log('  ⚠️  Cannot query indexes - may need to check manually')
    }
  }

  console.log('\n🔧 Functions with "magic":')
  
  // Check functions
  const { data: functions } = await supabase.rpc('exec_sql', {
    query: `
      SELECT proname 
      FROM pg_proc 
      WHERE proname LIKE '%magic%'
      ORDER BY proname;
    `
  })

  if (functions && functions.length > 0) {
    functions.forEach((f: any) => console.log(`  - ${f.proname}()`))
  } else {
    console.log('  ✅ No magic link functions found')
  }

  console.log('\n' + '='.repeat(60))
  console.log('Summary:')
  console.log('  Tables: ' + (tables?.length || 0))
  console.log('  Indexes: ' + (indexes?.length || 0))
  console.log('  Functions: ' + (functions?.length || 0))
  console.log('='.repeat(60))
}

checkMagicLinksObjects().catch(console.error)
