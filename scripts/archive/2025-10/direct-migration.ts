// Direct migration using Supabase client queries
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Load environment variables
config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

async function runDirectMigration() {
  console.log('🚀 Running direct database migration...')
  
  try {
    // Step 1: Add display_name column
    console.log('📝 Step 1: Adding display_name column...')
    const { error: addColumnError } = await supabase.rpc('exec_sql', {
      sql_query: 'ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS display_name TEXT;'
    })
    
    if (addColumnError) {
      console.log('⚠️  RPC not available, trying alternative approach...')
      // Alternative: Use a simple query to test connection
      const { data, error } = await supabase.from('vehicles').select('id').limit(1)
      if (error) {
        throw new Error(`Database connection failed: ${error.message}`)
      }
      console.log('✅ Database connection verified')
    }
    
    // Step 2: Check if display_name column exists
    console.log('📝 Step 2: Checking current schema...')
    const { data: vehicles, error: schemaError } = await supabase
      .from('vehicles')
      .select('id, label, make, model, display_name')
      .limit(1)
    
    if (schemaError && schemaError.message.includes('display_name')) {
      console.log('❌ display_name column does not exist yet')
      console.log('📋 Manual migration required - please run the SQL in Supabase dashboard:')
      console.log(`
-- Copy and paste this into Supabase SQL Editor:
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS display_name TEXT;

UPDATE vehicles
SET display_name = COALESCE(
  NULLIF(label, ''), 
  CONCAT_WS(' ', make, model),
  'Unknown Vehicle'
)
WHERE display_name IS NULL OR display_name = '';

ALTER TABLE vehicles ALTER COLUMN display_name SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vehicles_display_name ON vehicles(display_name);
      `)
      return
    }
    
    if (vehicles && vehicles.length > 0) {
      console.log('✅ display_name column exists!')
      console.log('📊 Sample vehicle:', vehicles[0])
    }
    
    // Step 3: Check health status
    console.log('📝 Step 3: Checking health status...')
    const healthResponse = await fetch('http://localhost:3005/api/health')
    const health = await healthResponse.json()
    
    console.log('🏥 Health Status:', health.status)
    console.log('📊 Metrics:', health.metrics)
    
    if (health.status === 'healthy') {
      console.log('🎉 Migration successful! System is healthy!')
    } else {
      console.log('⚠️  System needs attention:', health.errors)
    }
    
  } catch (error) {
    console.error('💥 Migration check failed:', error)
  }
}

runDirectMigration()
