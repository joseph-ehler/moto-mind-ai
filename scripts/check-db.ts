/**
 * Database Introspection Script
 * Tests Supabase connection and lists all tables
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function checkDatabase() {
  console.log('🔍 Connecting to Supabase...\n')
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  try {
    // Test connection with simple query
    const { data: testData, error: testError } = await supabase
      .from('tenants')
      .select('count')
      .limit(1)
    
    if (testError && testError.message.includes('relation') && testError.message.includes('does not exist')) {
      console.log('❌ tenants table does not exist yet\n')
    } else if (testError) {
      console.log('⚠️  Test query error:', testError.message, '\n')
    } else {
      console.log('✅ Connection successful!\n')
    }
    
    // Get all tables in public schema
    const { data: tables, error } = await supabase.rpc('exec_sql', {
      query: `
        SELECT 
          table_name,
          (SELECT COUNT(*) 
           FROM information_schema.columns 
           WHERE columns.table_schema = tables.table_schema 
           AND columns.table_name = tables.table_name) as column_count
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
        ORDER BY table_name;
      `
    })
    
    if (error) {
      // Try alternative method
      console.log('📋 Listing tables (manual query)...\n')
      
      // Check for specific tables we care about
      const tablesToCheck = [
        'tenants',
        'user_tenants',
        'vehicles',
        'tracking_sessions',
        'location_points',
        'profiles',
        'auth_credentials',
        'fleets',
        'invitations'
      ]
      
      for (const tableName of tablesToCheck) {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(0)
        
        if (error) {
          if (error.message.includes('does not exist')) {
            console.log(`❌ ${tableName} - DOES NOT EXIST`)
          } else {
            console.log(`⚠️  ${tableName} - Error: ${error.message}`)
          }
        } else {
          console.log(`✅ ${tableName} - EXISTS`)
        }
      }
    } else {
      console.log('📋 Tables in database:\n')
      tables?.forEach((table: any) => {
        console.log(`  ✅ ${table.table_name} (${table.column_count} columns)`)
      })
    }
    
    // Check for vehicles table specifically and get its schema
    console.log('\n🏍️ Checking vehicles table schema...\n')
    
    const { data: vehicleSchema, error: schemaError } = await supabase
      .from('vehicles')
      .select('*')
      .limit(0)
    
    if (schemaError) {
      console.log('❌ vehicles table does not exist or is inaccessible')
      console.log('Error:', schemaError.message)
    } else {
      console.log('✅ vehicles table exists')
      
      // Try to get column info
      const { data: columns } = await supabase.rpc('exec_sql', {
        query: `
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_name = 'vehicles'
          ORDER BY ordinal_position;
        `
      })
      
      if (columns) {
        console.log('\nColumns:')
        columns.forEach((col: any) => {
          console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : '(nullable)'}`)
        })
      }
    }
    
  } catch (err) {
    console.error('❌ Error:', err)
  }
}

checkDatabase()
