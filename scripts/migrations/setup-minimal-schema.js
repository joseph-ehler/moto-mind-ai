// Minimal schema setup for Supabase
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

async function setupMinimalSchema() {
  console.log('🚀 Setting up minimal schema...')
  
  try {
    // Create tenants table first
    console.log('📋 Creating tenants table...')
    const { error: tenantsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS tenants (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    })
    
    if (tenantsError) {
      console.log('❌ Tenants table error:', tenantsError.message)
    } else {
      console.log('✅ Tenants table created')
    }

    // Create garages table
    console.log('📋 Creating garages table...')
    const { error: garagesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS garages (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id UUID NOT NULL,
          name TEXT NOT NULL,
          address TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    })
    
    if (garagesError) {
      console.log('❌ Garages table error:', garagesError.message)
    } else {
      console.log('✅ Garages table created')
    }

    // Create vehicles table
    console.log('📋 Creating vehicles table...')
    const { error: vehiclesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS vehicles (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id UUID NOT NULL,
          garage_id UUID,
          nickname TEXT,
          year INTEGER,
          make TEXT,
          model TEXT,
          vin TEXT,
          license_plate TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    })
    
    if (vehiclesError) {
      console.log('❌ Vehicles table error:', vehiclesError.message)
    } else {
      console.log('✅ Vehicles table created')
    }

    // Insert demo tenant
    console.log('📋 Creating demo tenant...')
    const { error: insertError } = await supabase
      .from('tenants')
      .upsert({
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Demo Tenant'
      }, { onConflict: 'id' })
    
    if (insertError) {
      console.log('❌ Demo tenant error:', insertError.message)
    } else {
      console.log('✅ Demo tenant created')
    }

    console.log('🎉 Minimal schema setup complete!')
    
  } catch (err) {
    console.log('❌ Setup failed:', err.message)
  }
}

setupMinimalSchema()
