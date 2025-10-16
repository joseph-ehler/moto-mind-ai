#!/usr/bin/env tsx

/**
 * Migration: Add soft delete support to vehicles table
 * Adds deleted_at column for soft delete functionality
 */

import { Pool } from 'pg'

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error('❌ DATABASE_URL environment variable is required')
  process.exit(1)
}

const pool = new Pool({ connectionString })

async function runMigration() {
  const client = await pool.connect()
  
  try {
    console.log('🚀 Adding soft delete support to vehicles table...')
    
    // Add deleted_at column for soft delete
    await client.query(`
      ALTER TABLE vehicles 
      ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;
    `)
    
    // Add index for performance when filtering deleted vehicles
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_vehicles_deleted_at 
      ON vehicles (deleted_at) 
      WHERE deleted_at IS NULL;
    `)
    
    console.log('✅ Soft delete migration completed successfully!')
    console.log('   - Added deleted_at column to vehicles table')
    console.log('   - Added performance index for active vehicles')
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

runMigration().catch((error) => {
  console.error('Migration runner failed:', error)
  process.exit(1)
})
