// MotoMindAI: Migration Runner Script
// Runs database migrations in correct order

import { config } from 'dotenv'
import { Pool } from 'pg'
import { promises as fs } from 'fs'
import path from 'path'

// Load environment variables
config()

console.log('🔌 Connecting to database:', process.env.DATABASE_URL?.replace(/:[^:@]*@/, ':****@'))

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/motomind_dev'
})

const migrations = [
  '000_base_schema.sql',
  '001_rls_policies.sql',
  '002_indexes_constraints.sql', 
  '003_usage_tracking.sql',
  '004_smartphone_ingestion.sql',
  '006_vehicle_photos.sql',
  // '007_supabase_storage_policies.sql', // Skip - requires special permissions
  '008_vehicle_onboarding_fields.sql',
  '009_vehicle_images_minimal.sql',
  '010_vehicle_images_policies.sql',
  '011_fix_vehicle_images_table.sql',
  '020_events_stream.sql',
  '021_reminders_dedupe.sql',
  '022_garage_default_column.sql',
  '029_fix_schema_migrations.sql',
  '030_vehicle_display_name.sql'
]

async function runMigrations() {
  const client = await pool.connect()
  
  try {
    console.log('🚀 Starting database migrations...')
    
    // Create migrations tracking table
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `)
    
    // Check which migrations have been applied
    const appliedQuery = await client.query(
      'SELECT version FROM schema_migrations ORDER BY version'
    )
    const appliedMigrations = new Set(appliedQuery.rows.map(row => row.version))
    
    // Run pending migrations
    for (const migration of migrations) {
      if (appliedMigrations.has(migration)) {
        console.log(`⏭️  Skipping ${migration} (already applied)`)
        continue
      }
      
      console.log(`📄 Running migration: ${migration}`)
      
      try {
        // Read migration file
        const migrationPath = path.join(process.cwd(), 'migrations', migration)
        const sql = await fs.readFile(migrationPath, 'utf8')
        
        // Execute migration in transaction
        await client.query('BEGIN')
        await client.query(sql)
        
        // Record successful migration
        await client.query(
          'INSERT INTO schema_migrations (version) VALUES ($1)',
          [migration]
        )
        
        await client.query('COMMIT')
        console.log(`✅ Successfully applied ${migration}`)
        
      } catch (error) {
        await client.query('ROLLBACK')
        console.error(`❌ Failed to apply ${migration}:`, error)
        throw error
      }
    }
    
    console.log('🎉 All migrations completed successfully!')
    
    // Show final schema state
    const tablesQuery = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `)
    
    console.log('\n📊 Database tables:')
    tablesQuery.rows.forEach(row => {
      console.log(`  - ${row.tablename}`)
    })
    
    // Show RLS status
    const rlsQuery = await client.query(`
      SELECT schemaname, tablename, rowsecurity 
      FROM pg_tables 
      WHERE schemaname = 'public' AND rowsecurity = true
      ORDER BY tablename
    `)
    
    console.log('\n🔒 Tables with RLS enabled:')
    rlsQuery.rows.forEach(row => {
      console.log(`  - ${row.tablename}`)
    })
    
  } catch (error) {
    console.error('💥 Migration failed:', error)
    process.exit(1)
  } finally {
    client.release()
  }
}

// Run if called directly
if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('✨ Migration runner complete!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Migration runner failed:', error)
      process.exit(1)
    })
}

export { runMigrations }
