// Quick migration runner - NO DEPENDENCIES
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://ucbbzzoimghnaoihyqbd.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjYmJ6em9pbWdobmFvaWh5cWJkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODY4NDIxMywiZXhwIjoyMDc0MjYwMjEzfQ.Fq9BQHT8rQ2iNpgugdf-JdvdRYMf1vFTU1pvh88xbag'

const supabase = createClient(supabaseUrl, supabaseKey)

async function runMigration() {
  console.log('🚀 Adding geocoding columns...')
  
  try {
    // Check if columns exist first
    const { data: columns, error: checkError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'vehicle_events')
      .eq('column_name', 'geocoded_lat')
    
    if (checkError) {
      console.log('❌ Error checking columns:', checkError)
      return
    }
    
    if (columns && columns.length > 0) {
      console.log('✅ Geocoding columns already exist!')
      return
    }
    
    // Add the columns using raw SQL
    const { error } = await supabase.rpc('exec', {
      sql: `
        ALTER TABLE vehicle_events 
        ADD COLUMN geocoded_lat DECIMAL(10, 8),
        ADD COLUMN geocoded_lng DECIMAL(11, 8),
        ADD COLUMN geocoded_at TIMESTAMPTZ,
        ADD COLUMN geocoded_address TEXT;
        
        CREATE INDEX idx_vehicle_events_geocoded 
        ON vehicle_events(geocoded_lat, geocoded_lng) 
        WHERE geocoded_lat IS NOT NULL AND geocoded_lng IS NOT NULL;
      `
    })
    
    if (error) {
      console.log('❌ Migration error:', error)
    } else {
      console.log('✅ Geocoding columns added successfully!')
    }
    
  } catch (error) {
    console.log('❌ Unexpected error:', error.message)
  }
}

runMigration()
