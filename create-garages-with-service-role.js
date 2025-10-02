// Create garages table using service role key with elevated privileges
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// Use service role key for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    db: {
      schema: 'public'
    }
  }
)

async function createGaragesTableWithServiceRole() {
  console.log('🔑 Using service role key to create garages table...')
  
  try {
    // Try using the rpc method with different function names
    const sqlCommands = [
      // Try common SQL execution functions
      'exec',
      'execute',
      'run_sql', 
      'sql_exec',
      'query'
    ]
    
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS garages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        address TEXT DEFAULT '',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `
    
    const insertDemoSQL = `
      INSERT INTO garages (id, tenant_id, name, address) 
      VALUES (
        '550e8400-e29b-41d4-a716-446655440001',
        '550e8400-e29b-41d4-a716-446655440000',
        'My Garage',
        'Home'
      ) ON CONFLICT (id) DO NOTHING;
    `
    
    let success = false
    
    for (const funcName of sqlCommands) {
      try {
        console.log(`🔍 Trying function: ${funcName}`)
        
        const { data, error } = await supabase.rpc(funcName, {
          sql: createTableSQL + insertDemoSQL
        })
        
        if (!error) {
          console.log(`✅ Success with function: ${funcName}`)
          success = true
          break
        } else {
          console.log(`❌ ${funcName} failed:`, error.message)
        }
      } catch (err) {
        console.log(`❌ ${funcName} error:`, err.message)
      }
    }
    
    if (!success) {
      console.log('🔄 Trying alternative: PostgreSQL REST API approach...')
      
      // Try using the PostgreSQL REST API directly
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY
        },
        body: JSON.stringify({
          query: createTableSQL + insertDemoSQL
        })
      })
      
      if (response.ok) {
        console.log('✅ PostgreSQL REST API success!')
        success = true
      } else {
        const errorText = await response.text()
        console.log('❌ PostgreSQL REST API failed:', errorText)
      }
    }
    
    if (!success) {
      console.log('📋 Manual SQL needed (run in Supabase Dashboard):')
      console.log(createTableSQL + insertDemoSQL)
    }
    
    // Test if garages table now exists
    console.log('🔍 Testing garages table...')
    const { data: testData, error: testError } = await supabase
      .from('garages')
      .select('*')
      .limit(1)
    
    if (testError) {
      console.log('❌ Garages table still missing:', testError.message)
    } else {
      console.log('✅ Garages table confirmed working!')
      console.log('📊 Sample data:', testData)
    }
    
  } catch (err) {
    console.log('❌ Service role operation failed:', err.message)
  }
}

createGaragesTableWithServiceRole()
