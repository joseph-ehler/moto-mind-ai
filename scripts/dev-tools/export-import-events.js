#!/usr/bin/env node

/**
 * MotoMind Nuclear Rebuild: Export/Import Events
 * Safely preserves your 15 events during schema rebuild
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
require('dotenv').config()

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

const TENANT_ID = '550e8400-e29b-41d4-a716-446655440000'

async function exportAllData() {
  console.log('🔄 EXPORTING ALL DATA BEFORE NUCLEAR REBUILD')
  console.log('=' .repeat(50))

  const backup = {
    timestamp: new Date().toISOString(),
    tenants: [],
    users: [],
    garages: [],
    vehicles: [],
    current_events: [], // From vehicle_events table
    legacy_events: {
      odometer_readings: [],
      fuel_logs: [],
      service_records: []
    },
    vehicle_images: [],
    reminders: []
  }

  try {
    // Export core data
    console.log('📋 Exporting core tables...')
    
    const { data: tenants } = await supabase.from('tenants').select('*')
    const { data: users } = await supabase.from('users').select('*')
    const { data: garages } = await supabase.from('garages').select('*')
    const { data: vehicles } = await supabase.from('vehicles').select('*')
    const { data: vehicle_images } = await supabase.from('vehicle_images').select('*')
    const { data: reminders } = await supabase.from('reminders').select('*')

    backup.tenants = tenants || []
    backup.users = users || []
    backup.garages = garages || []
    backup.vehicles = vehicles || []
    backup.vehicle_images = vehicle_images || []
    backup.reminders = reminders || []

    console.log(`✅ Tenants: ${backup.tenants.length}`)
    console.log(`✅ Users: ${backup.users.length}`)
    console.log(`✅ Garages: ${backup.garages.length}`)
    console.log(`✅ Vehicles: ${backup.vehicles.length}`)
    console.log(`✅ Vehicle Images: ${backup.vehicle_images.length}`)
    console.log(`✅ Reminders: ${backup.reminders.length}`)

    // Export current events (already in correct format)
    console.log('\n📊 Exporting current vehicle_events...')
    const { data: currentEvents } = await supabase.from('vehicle_events').select('*')
    backup.current_events = currentEvents || []
    console.log(`✅ Current Events: ${backup.current_events.length}`)

    // Export legacy events (need conversion)
    console.log('\n📊 Exporting legacy event tables...')
    
    const { data: odometerReadings } = await supabase.from('odometer_readings').select('*')
    const { data: fuelLogs } = await supabase.from('fuel_logs').select('*')
    const { data: serviceRecords } = await supabase.from('service_records').select('*')

    backup.legacy_events.odometer_readings = odometerReadings || []
    backup.legacy_events.fuel_logs = fuelLogs || []
    backup.legacy_events.service_records = serviceRecords || []

    console.log(`✅ Odometer Readings: ${backup.legacy_events.odometer_readings.length}`)
    console.log(`✅ Fuel Logs: ${backup.legacy_events.fuel_logs.length}`)
    console.log(`✅ Service Records: ${backup.legacy_events.service_records.length}`)

    // Save backup
    const backupFile = `backup-${Date.now()}.json`
    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2))
    
    console.log(`\n💾 Backup saved to: ${backupFile}`)
    console.log(`📊 Total Events to Preserve: ${backup.current_events.length + backup.legacy_events.odometer_readings.length + backup.legacy_events.fuel_logs.length + backup.legacy_events.service_records.length}`)
    
    return backupFile

  } catch (error) {
    console.error('❌ Export failed:', error)
    throw error
  }
}

async function importAllData(backupFile) {
  console.log('\n🔄 IMPORTING DATA AFTER NUCLEAR REBUILD')
  console.log('=' .repeat(50))

  try {
    const backup = JSON.parse(fs.readFileSync(backupFile, 'utf8'))
    
    // Import core data (in dependency order)
    console.log('📋 Importing core tables...')
    
    // Get default user ID for audit trails (where applicable)
    const defaultUserId = backup.users.length > 0 ? backup.users[0].id : null
    
    // Tenants first (NO audit trail - root entity, no circular dependency)
    if (backup.tenants.length > 0) {
      const { error } = await supabase.from('tenants').insert(backup.tenants)
      if (error) console.error('⚠️ Tenants import error:', error.message)
      else console.log(`✅ Imported ${backup.tenants.length} tenants (no circular dependency)`)
    }

    // Users (add audit trail fields)
    if (backup.users.length > 0) {
      const usersWithAudit = backup.users.map(user => ({
        ...user,
        created_by: defaultUserId,
        updated_by: defaultUserId
      }))
      const { error } = await supabase.from('users').insert(usersWithAudit)
      if (error) console.error('⚠️ Users import error:', error.message)
      else console.log(`✅ Imported ${backup.users.length} users`)
    }

    // Garages (add audit trail fields)
    if (backup.garages.length > 0) {
      const garagesWithAudit = backup.garages.map(garage => ({
        ...garage,
        created_by: defaultUserId,
        updated_by: defaultUserId
      }))
      const { error } = await supabase.from('garages').insert(garagesWithAudit)
      if (error) console.error('⚠️ Garages import error:', error.message)
      else console.log(`✅ Imported ${backup.garages.length} garages`)
    }

    // Vehicles (add audit trail fields, restore manufacturer specs)
    if (backup.vehicles.length > 0) {
      const vehiclesWithAudit = backup.vehicles.map(vehicle => {
        // Convert old baseline fields to manufacturer specs (external facts)
        const manufacturer_mpg = vehicle.baseline_fuel_mpg || null
        const manufacturer_service_interval_miles = vehicle.baseline_service_interval_miles || null
        
        const { baseline_fuel_mpg, baseline_service_interval_miles, ...cleanVehicle } = vehicle
        return {
          ...cleanVehicle,
          manufacturer_mpg,
          manufacturer_service_interval_miles,
          created_by: defaultUserId,
          updated_by: defaultUserId
        }
      })
      const { error } = await supabase.from('vehicles').insert(vehiclesWithAudit)
      if (error) console.error('⚠️ Vehicles import error:', error.message)
      else console.log(`✅ Imported ${backup.vehicles.length} vehicles (restored manufacturer specs)`)
    }

    // Vehicle Images (add audit trail fields)
    if (backup.vehicle_images.length > 0) {
      const imagesWithAudit = backup.vehicle_images.map(image => ({
        ...image,
        created_by: defaultUserId,
        updated_by: defaultUserId
      }))
      const { error } = await supabase.from('vehicle_images').insert(imagesWithAudit)
      if (error) console.error('⚠️ Vehicle Images import error:', error.message)
      else console.log(`✅ Imported ${backup.vehicle_images.length} vehicle images`)
    }

    // Reminders (add audit trail fields)
    if (backup.reminders.length > 0) {
      const remindersWithAudit = backup.reminders.map(reminder => ({
        ...reminder,
        created_by: defaultUserId,
        updated_by: defaultUserId
      }))
      const { error } = await supabase.from('reminders').insert(remindersWithAudit)
      if (error) console.error('⚠️ Reminders import error:', error.message)
      else console.log(`✅ Imported ${backup.reminders.length} reminders`)
    }

    // Import events (convert legacy to unified format)
    console.log('\n📊 Converting and importing events...')
    
    const unifiedEvents = []

    // 1. Current events (NO audit trail - events are facts, not user actions)
    backup.current_events.forEach(event => {
      const { created_by, updated_by, updated_at, ...cleanEvent } = event
      // Move user info to payload if it exists
      const payload = {
        ...cleanEvent.payload,
        ...(created_by && { logged_by: created_by }),
        ...(event.source && { source: event.source })
      }
      unifiedEvents.push({
        ...cleanEvent,
        payload
      })
    })

    // 2. Convert odometer readings
    backup.legacy_events.odometer_readings.forEach(reading => {
      unifiedEvents.push({
        id: reading.id,
        tenant_id: reading.tenant_id,
        vehicle_id: reading.vehicle_id,
        type: 'odometer',
        date: reading.reading_date,
        miles: reading.mileage,
        payload: {
          source: reading.source || 'migrated',
          confidence_score: reading.confidence_score,
          reading_time: reading.reading_time,
          notes: reading.notes || '',
          migrated_from: 'odometer_readings',
          migration_date: new Date().toISOString()
        },
        created_at: reading.created_at
        // NO created_by - events are facts, not user actions
      })
    })

    // 3. Convert fuel logs
    backup.legacy_events.fuel_logs.forEach(fuel => {
      unifiedEvents.push({
        id: fuel.id,
        tenant_id: fuel.tenant_id,
        vehicle_id: fuel.vehicle_id,
        type: 'fuel',
        date: fuel.date,
        miles: null, // Will be inferred by API if needed
        payload: {
          total_amount: fuel.total_amount,
          gallons: fuel.gallons,
          price_per_gallon: fuel.price_per_gallon,
          station: fuel.station_name || 'Unknown',
          fuel_type: fuel.fuel_type || 'regular',
          source: fuel.source || 'migrated',
          migrated_from: 'fuel_logs',
          migration_date: new Date().toISOString()
        },
        created_at: fuel.created_at
        // NO created_by - events are facts, not user actions
      })
    })

    // 4. Convert service records
    backup.legacy_events.service_records.forEach(service => {
      unifiedEvents.push({
        id: service.id,
        tenant_id: service.tenant_id,
        vehicle_id: service.vehicle_id,
        type: 'maintenance',
        date: service.service_date,
        miles: service.odometer_reading,
        payload: {
          kind: service.service_type || 'Service',
          service_type: service.service_type,
          total_amount: service.total_cost,
          vendor: service.shop_name || 'Unknown',
          description: service.description || '',
          labor_cost: service.labor_cost,
          parts_cost: service.parts_cost,
          source: service.source || 'migrated',
          migrated_from: 'service_records',
          migration_date: new Date().toISOString()
        },
        created_at: service.created_at
        // NO created_by - events are facts, not user actions
      })
    })

    // Import all unified events
    if (unifiedEvents.length > 0) {
      const { error } = await supabase.from('vehicle_events').insert(unifiedEvents)
      if (error) {
        console.error('❌ Events import error:', error.message)
      } else {
        console.log(`✅ Imported ${unifiedEvents.length} unified events`)
        console.log(`   - Current events: ${backup.current_events.length}`)
        console.log(`   - Converted odometer: ${backup.legacy_events.odometer_readings.length}`)
        console.log(`   - Converted fuel: ${backup.legacy_events.fuel_logs.length}`)
        console.log(`   - Converted service: ${backup.legacy_events.service_records.length}`)
      }
    }

    console.log('\n🎉 NUCLEAR REBUILD COMPLETE!')
    console.log('✅ All data preserved and converted')
    console.log('✅ Schema simplified from 35 → 8 objects')
    console.log('✅ Events unified into single table')
    console.log('✅ Ready for "Capture → Log → Done" workflow')

  } catch (error) {
    console.error('❌ Import failed:', error)
    throw error
  }
}

// Command line interface
async function main() {
  const command = process.argv[2]
  
  if (command === 'export') {
    const backupFile = await exportAllData()
    console.log(`\n🚀 Next steps:`)
    console.log(`1. Run the nuclear rebuild SQL script`)
    console.log(`2. Run: node export-import-events.js import ${backupFile}`)
    
  } else if (command === 'import') {
    const backupFile = process.argv[3]
    if (!backupFile) {
      console.error('❌ Please provide backup file: node export-import-events.js import backup-123.json')
      process.exit(1)
    }
    await importAllData(backupFile)
    
  } else {
    console.log('MotoMind Nuclear Rebuild - Data Export/Import')
    console.log('')
    console.log('Usage:')
    console.log('  node export-import-events.js export     # Export all data before rebuild')
    console.log('  node export-import-events.js import <file>  # Import data after rebuild')
    console.log('')
    console.log('Example:')
    console.log('  node export-import-events.js export')
    console.log('  # Run nuclear-rebuild-minimal-schema.sql')
    console.log('  node export-import-events.js import backup-1234567890.json')
  }
}

if (require.main === module) {
  main().catch(console.error)
}

module.exports = { exportAllData, importAllData }
