#!/usr/bin/env ts-node

// Apply Dashboard Snapshot Migration
// Adds generated columns and indexes for dashboard snapshot events

import { Pool } from 'pg'
import * as fs from 'fs'
import * as path from 'path'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false
})

async function applyMigration() {
  const client = await pool.connect()
  
  try {
    console.log('🔄 Applying dashboard snapshot migration...')
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '../migrations/add-dashboard-snapshot-columns.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    
    // Execute the migration
    await client.query(migrationSQL)
    
    console.log('✅ Dashboard snapshot migration applied successfully!')
    
    // Verify the columns were created
    const result = await client.query(`
      SELECT column_name, data_type, is_generated 
      FROM information_schema.columns 
      WHERE table_name = 'vehicle_events' 
      AND column_name IN ('event_summary', 'odometer_miles', 'fuel_eighths')
      ORDER BY column_name
    `)
    
    console.log('📊 Generated columns created:')
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (generated: ${row.is_generated})`)
    })
    
    // Verify indexes were created
    const indexResult = await client.query(`
      SELECT indexname, tablename 
      FROM pg_indexes 
      WHERE tablename = 'vehicle_events' 
      AND indexname LIKE '%dashboard%' OR indexname LIKE '%odometer%' OR indexname LIKE '%summary%'
      ORDER BY indexname
    `)
    
    console.log('🔍 Indexes created:')
    indexResult.rows.forEach(row => {
      console.log(`  - ${row.indexname}`)
    })
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

// Run the migration
applyMigration().catch(error => {
  console.error('Migration script failed:', error)
  process.exit(1)
})
