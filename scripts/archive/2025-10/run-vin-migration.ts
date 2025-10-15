import { Pool } from 'pg'
import { readFileSync } from 'fs'
import { join } from 'path'
import { config } from 'dotenv'

config()

async function runVINMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  })

  const client = await pool.connect()

  try {
    console.log('🔌 Running VIN and Garages migration...')
    
    const migrationSQL = readFileSync(
      join(__dirname, '..', 'database', 'migrations', 'add_vin_and_garages.sql'),
      'utf-8'
    )

    await client.query(migrationSQL)
    
    console.log('✅ VIN and Garages migration completed successfully!')
    
    // Verify tables were created
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('garages', 'vin_cache', 'vehicle_onboarding')
      ORDER BY table_name
    `)
    
    console.log('📊 New tables created:', result.rows.map(r => r.table_name))
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

runVINMigration()
