#!/usr/bin/env npx tsx

/**
 * Run Canonical Vehicle Images Migration
 * 
 * This script creates the database tables needed for the canonical image system.
 */

import { Pool } from 'pg'
import { readFileSync } from 'fs'
import { join } from 'path'
import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in .env.local')
  process.exit(1)
}

async function runMigration() {
  console.log('🗄️ Running canonical vehicle images migration...')
  
  const pool = new Pool({ connectionString: DATABASE_URL })
  const client = await pool.connect()
  
  try {
    // Read the migration file
    const migrationPath = join(process.cwd(), 'migrations', '005_canonical_vehicle_images.sql')
    const migrationSQL = readFileSync(migrationPath, 'utf8')
    
    console.log('📄 Executing migration SQL...')
    
    // Execute the migration
    await client.query(migrationSQL)
    
    console.log('✅ Migration completed successfully!')
    
    // Verify tables were created
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('vehicle_images', 'vehicle_generations', 'image_generation_queue')
      ORDER BY table_name
    `)
    
    console.log('\n📋 Created tables:')
    tablesResult.rows.forEach(row => {
      console.log(`   ✅ ${row.table_name}`)
    })
    
    // Check sample generation data
    const generationsResult = await client.query(`
      SELECT make, model, body_style, canonical_generation, COUNT(*) as count
      FROM vehicle_generations 
      GROUP BY make, model, body_style, canonical_generation
      ORDER BY make, model, canonical_generation
    `)
    
    console.log('\n🚗 Sample vehicle generation mappings:')
    generationsResult.rows.forEach(row => {
      console.log(`   ${row.make} ${row.model} ${row.body_style} → ${row.canonical_generation}`)
    })
    
    console.log('\n🎉 Canonical vehicle images system is ready!')
    console.log('\n📋 You can now:')
    console.log('   1. Generate canonical images via API')
    console.log('   2. Test with: curl -X POST localhost:3005/api/canonical-image')
    console.log('   3. View images in Supabase Storage dashboard')
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

// Run the migration
runMigration()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  })
