// Check what columns exist in vehicles table
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

async function checkVehicleColumns() {
  console.log('🔍 Checking vehicles table structure...')
  
  try {
    // Try to select all columns with a limit to see what exists
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .limit(1)
    
    if (error) {
      console.log('❌ Error:', error.message)
    } else {
      console.log('✅ Vehicles table exists')
      if (data && data.length > 0) {
        console.log('📋 Available columns:')
        Object.keys(data[0]).forEach(col => console.log(`  - ${col}`))
        console.log('\n📊 Sample record:')
        console.log(JSON.stringify(data[0], null, 2))
      } else {
        console.log('📋 Table is empty, trying to get column info differently...')
        
        // Try with specific basic columns
        const basicColumns = ['id', 'make', 'model', 'year', 'vin', 'nickname', 'tenant_id', 'garage_id', 'created_at']
        
        for (const col of basicColumns) {
          try {
            const { error: colError } = await supabase
              .from('vehicles')
              .select(col)
              .limit(1)
            
            if (colError) {
              console.log(`❌ ${col}: ${colError.message}`)
            } else {
              console.log(`✅ ${col}: exists`)
            }
          } catch (err) {
            console.log(`❌ ${col}: ${err.message}`)
          }
        }
      }
    }
  } catch (err) {
    console.log('❌ Failed:', err.message)
  }
}

checkVehicleColumns()
