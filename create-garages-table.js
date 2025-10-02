// Create garages table directly
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

async function createGaragesTable() {
  console.log('🏗️ Creating garages table...')
  
  try {
    // Try using the SQL query method
    const { data, error } = await supabase.rpc('sql', {
      query: `
        CREATE TABLE IF NOT EXISTS garages (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          address TEXT DEFAULT '',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        -- Create default garage for demo tenant
        INSERT INTO garages (id, tenant_id, name, address) 
        VALUES (
          '550e8400-e29b-41d4-a716-446655440001',
          '550e8400-e29b-41d4-a716-446655440000',
          'My Garage',
          'Home'
        ) ON CONFLICT (id) DO NOTHING;
      `
    })
    
    if (error) {
      console.log('❌ SQL method failed:', error.message)
      
      // Try alternative approach - create via REST API simulation
      console.log('🔄 Trying alternative approach...')
      
      // Since we can't create tables via REST API, let's document the issue
      console.log('📋 Manual action required:')
      console.log('1. Go to Supabase Dashboard → SQL Editor')
      console.log('2. Run this SQL:')
      console.log(`
CREATE TABLE IF NOT EXISTS garages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO garages (id, tenant_id, name, address) 
VALUES (
  '550e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440000',
  'My Garage',
  'Home'
) ON CONFLICT (id) DO NOTHING;
      `)
      
    } else {
      console.log('✅ Garages table created successfully!')
    }
    
  } catch (err) {
    console.log('❌ Failed:', err.message)
  }
}

createGaragesTable()
