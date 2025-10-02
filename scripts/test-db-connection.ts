import { Pool } from 'pg'
import { config } from 'dotenv'

config()

async function testConnection() {
  console.log('🔌 Testing database connection...')
  console.log('Database URL:', process.env.DATABASE_URL?.replace(/:[^:@]*@/, ':****@'))
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  })

  try {
    const client = await pool.connect()
    console.log('✅ Database connection successful!')
    
    // Check if basic tables exist
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `)
    
    console.log('📊 Existing tables:', result.rows.map(r => r.table_name))
    
    // Check if our specific tables exist
    const ourTables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('vehicles', 'garages', 'tenants')
      ORDER BY table_name
    `)
    
    console.log('🚗 MotoMind tables:', ourTables.rows.map(r => r.table_name))
    
    if (ourTables.rows.length === 0) {
      console.log('⚠️  No MotoMind tables found - migrations need to be run')
    }
    
    client.release()
    
  } catch (error) {
    console.error('❌ Database connection failed:', error)
  } finally {
    await pool.end()
  }
}

testConnection()
