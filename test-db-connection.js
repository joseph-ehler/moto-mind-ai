// Quick test to see what tables exist in Supabase
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

async function testConnection() {
  console.log('🔍 Testing Supabase connection...')
  
  try {
    // Test basic connection
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .limit(10)
    
    if (error) {
      console.log('❌ Error querying tables:', error.message)
      
      // Try a simpler test
      console.log('🔍 Trying simpler connection test...')
      const { data: simpleTest, error: simpleError } = await supabase
        .rpc('version')
      
      if (simpleError) {
        console.log('❌ Simple test failed:', simpleError.message)
      } else {
        console.log('✅ Basic connection works, but schema may be empty')
      }
    } else {
      console.log('✅ Connection successful!')
      console.log('📋 Available tables:')
      data.forEach(table => console.log(`  - ${table.table_name}`))
    }
  } catch (err) {
    console.log('❌ Connection failed:', err.message)
  }
}

testConnection()
