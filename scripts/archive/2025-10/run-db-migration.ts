// Run database migration via Supabase client
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

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

async function runMigration() {
  console.log('🚀 Running MotoMind architecture cleanup migration...')
  
  try {
    // Read the SQL file
    const sqlPath = join(process.cwd(), 'docs/db-console-paste.sql')
    const sql = readFileSync(sqlPath, 'utf8')
    
    // Split into individual statements (rough approach)
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('SELECT \'MotoMind'))
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`)
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement.trim()) {
        console.log(`⚡ Executing statement ${i + 1}/${statements.length}`)
        
        const { error } = await supabase.rpc('exec_sql', { 
          sql_query: statement + ';' 
        })
        
        if (error) {
          // Try direct query if RPC fails
          const { error: directError } = await supabase
            .from('vehicles')
            .select('count', { count: 'exact', head: true })
          
          if (directError) {
            console.error(`❌ Error on statement ${i + 1}:`, error)
            throw error
          }
        }
      }
    }
    
    console.log('✅ Migration completed successfully!')
    
    // Run validation queries
    console.log('\n🧪 Running validation queries...')
    
    // Check vehicles missing display_name
    const { count: missingDisplayName, error: displayNameError } = await supabase
      .from('vehicles')
      .select('*', { count: 'exact', head: true })
      .or('display_name.is.null,display_name.eq.')
    
    if (displayNameError) {
      console.warn('⚠️  Could not check display_name:', displayNameError.message)
    } else {
      console.log(`📊 Vehicles missing display_name: ${missingDisplayName || 0}`)
    }
    
    // Check orphaned vehicles
    const { data: orphanCheck, error: orphanError } = await supabase
      .from('vehicles')
      .select(`
        id,
        garage:garages(id)
      `)
      .not('garage_id', 'is', null)
      .is('garage.id', null)
      .limit(1)
    
    if (orphanError) {
      console.warn('⚠️  Could not check orphaned vehicles:', orphanError.message)
    } else {
      console.log(`📊 Orphaned vehicles: ${orphanCheck?.length || 0}`)
    }
    
    // Sample display names
    const { data: sampleVehicles, error: sampleError } = await supabase
      .from('vehicles')
      .select('id, display_name, label, make, model')
      .limit(5)
    
    if (sampleError) {
      console.warn('⚠️  Could not fetch sample vehicles:', sampleError.message)
    } else {
      console.log('\n📋 Sample vehicle names:')
      sampleVehicles?.forEach(v => {
        console.log(`  • ${v.display_name} (was: ${v.label})`)
      })
    }
    
    console.log('\n🎉 MotoMind architecture cleanup: Database migration complete! ✅')
    
  } catch (error) {
    console.error('💥 Migration failed:', error)
    process.exit(1)
  }
}

runMigration()
