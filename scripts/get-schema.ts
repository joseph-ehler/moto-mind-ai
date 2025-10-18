/**
 * Get detailed schema for key tables
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function getSchema() {
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  const tables = ['vehicles', 'tenants', 'user_tenants', 'profiles']
  
  for (const tableName of tables) {
    console.log(`\n${'='.repeat(60)}`)
    console.log(`📋 ${tableName.toUpperCase()} TABLE`)
    console.log('='.repeat(60))
    
    // Get one row to see structure
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1)
    
    if (error) {
      console.log(`❌ Error: ${error.message}`)
      continue
    }
    
    if (data && data.length > 0) {
      console.log('\nColumns (from data):')
      Object.keys(data[0]).forEach(key => {
        const value = data[0][key]
        const type = typeof value
        console.log(`  ${key}: ${type} = ${JSON.stringify(value)}`)
      })
      console.log(`\nSample count: ${data.length} row(s)`)
    } else {
      console.log('\n❌ No data found (table might be empty)')
      
      // Try to get structure by inserting invalid data
      const { error: insertError } = await supabase
        .from(tableName)
        .insert({})
        .select()
      
      if (insertError) {
        console.log('Table structure hint from error:', insertError.message)
      }
    }
  }
}

getSchema()
