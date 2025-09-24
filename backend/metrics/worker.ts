// MotoMindAI: Metrics Computation Worker
// Transforms manual events into daily vehicle metrics

import { PoolClient } from 'pg'
import { pool } from '../database'

export interface ComputedMetrics {
  tenantId: string
  vehicleId: string
  metricDate: string
  milesDriven?: number
  fuelEfficiencyMpg?: number
  lastServiceDate?: string
  harshEvents: number
  idleMinutes: number
  dataCompletenessPct: number
  sourceLatencySec: number
  sensorPresence: Record<string, boolean>
}

export async function recomputeDailyMetricsForVehicle(
  tenantId: string, 
  vehicleId: string, 
  dayISO?: string
): Promise<ComputedMetrics> {
  const client = await pool.connect()
  
  try {
    await client.query('BEGIN')
    await client.query('SET LOCAL app.tenant_id = $1', [tenantId])
    
    const targetDate = dayISO || new Date().toISOString().split('T')[0]
    
    // Get all manual events for this vehicle and date
    const eventsQuery = await client.query(`
      SELECT event_type, payload, confidence, created_at
      FROM manual_events 
      WHERE tenant_id = $1 AND vehicle_id = $2 
        AND DATE(created_at) = $3
      ORDER BY created_at ASC
    `, [tenantId, vehicleId, targetDate])
    
    const events = eventsQuery.rows
    
    // Get vehicle baseline for comparison
    const vehicleQuery = await client.query(`
      SELECT baseline_fuel_mpg, baseline_service_interval_miles
      FROM vehicles 
      WHERE id = $1 AND tenant_id = $2
    `, [vehicleId, tenantId])
    
    const vehicle = vehicleQuery.rows[0] || {}
    
    // Process events to extract metrics
    const odometerEvents = events.filter(e => e.event_type === 'odometer_reading')
    const fuelEvents = events.filter(e => e.event_type === 'fuel_purchase')
    const maintenanceEvents = events.filter(e => e.event_type === 'maintenance')
    const issueEvents = events.filter(e => e.event_type === 'issue_report')
    
    // Calculate miles driven from odometer readings
    let milesDriven: number | undefined
    if (odometerEvents.length >= 2) {
      const readings = odometerEvents
        .map(e => parseInt(e.payload.miles))
        .filter(m => !isNaN(m))
        .sort((a, b) => a - b)
      
      if (readings.length >= 2) {
        milesDriven = readings[readings.length - 1] - readings[0]
      }
    }
    
    // Get latest odometer reading for service calculations
    let latestOdometer: number | undefined
    if (odometerEvents.length > 0) {
      const readings = odometerEvents
        .map(e => parseInt(e.payload.miles))
        .filter(m => !isNaN(m))
      
      if (readings.length > 0) {
        latestOdometer = Math.max(...readings)
      }
    }
    
    // Calculate fuel efficiency from fuel purchases
    let fuelEfficiencyMpg: number | undefined
    if (milesDriven && fuelEvents.length > 0) {
      const totalGallons = fuelEvents
        .map(e => parseFloat(e.payload.gallons))
        .filter(g => !isNaN(g))
        .reduce((sum, gallons) => sum + gallons, 0)
      
      if (totalGallons > 0) {
        fuelEfficiencyMpg = Math.round((milesDriven / totalGallons) * 100) / 100
      }
    }
    
    // Get most recent service date
    let lastServiceDate: string | undefined
    if (maintenanceEvents.length > 0) {
      const serviceDates = maintenanceEvents
        .map(e => e.payload.date)
        .filter(d => d)
        .sort()
      
      if (serviceDates.length > 0) {
        lastServiceDate = serviceDates[serviceDates.length - 1]
      }
    }
    
    // Calculate harsh events and idle time (from issue reports for now)
    const harshEvents = issueEvents.filter(e => 
      e.payload.category === 'brakes' && e.payload.severity === 'high'
    ).length
    
    const idleMinutes = 0 // Not captured in smartphone mode yet
    
    // Calculate sensor presence and data quality
    const sensorPresence = {
      odometer: odometerEvents.length > 0,
      fuel: fuelEvents.length > 0,
      maintenance: maintenanceEvents.length > 0,
      issues: issueEvents.length > 0
    }
    
    const requiredSensors = ['odometer', 'fuel', 'maintenance']
    const availableSensors = requiredSensors.filter(sensor => sensorPresence[sensor])
    const dataCompletenessPct = Math.round((availableSensors.length / requiredSensors.length) * 100)
    
    // Source latency is minimal for smartphone capture
    const sourceLatencySec = events.length > 0 ? 
      Math.round((Date.now() - new Date(events[events.length - 1].created_at).getTime()) / 1000) : 0
    
    // Upsert into vehicle_metrics table
    await client.query(`
      INSERT INTO vehicle_metrics (
        tenant_id, vehicle_id, metric_date, 
        miles_driven, fuel_efficiency_mpg, last_service_date,
        harsh_events, idle_minutes, data_completeness_pct, 
        source_latency_sec, sensor_presence, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, now())
      ON CONFLICT (tenant_id, vehicle_id, metric_date)
      DO UPDATE SET
        miles_driven = COALESCE(EXCLUDED.miles_driven, vehicle_metrics.miles_driven),
        fuel_efficiency_mpg = COALESCE(EXCLUDED.fuel_efficiency_mpg, vehicle_metrics.fuel_efficiency_mpg),
        last_service_date = COALESCE(EXCLUDED.last_service_date, vehicle_metrics.last_service_date),
        harsh_events = EXCLUDED.harsh_events,
        idle_minutes = EXCLUDED.idle_minutes,
        data_completeness_pct = GREATEST(vehicle_metrics.data_completeness_pct, EXCLUDED.data_completeness_pct),
        source_latency_sec = EXCLUDED.source_latency_sec,
        sensor_presence = EXCLUDED.sensor_presence,
        updated_at = now()
    `, [
      tenantId, vehicleId, targetDate,
      milesDriven, fuelEfficiencyMpg, lastServiceDate,
      harshEvents, idleMinutes, dataCompletenessPct,
      sourceLatencySec, JSON.stringify(sensorPresence)
    ])
    
    await client.query('COMMIT')
    
    const computedMetrics: ComputedMetrics = {
      tenantId,
      vehicleId,
      metricDate: targetDate,
      milesDriven,
      fuelEfficiencyMpg,
      lastServiceDate,
      harshEvents,
      idleMinutes,
      dataCompletenessPct,
      sourceLatencySec,
      sensorPresence
    }
    
    console.log(`✅ Computed metrics for ${vehicleId} on ${targetDate}:`, {
      milesDriven,
      fuelEfficiencyMpg,
      dataCompletenessPct,
      sensorPresence
    })
    
    return computedMetrics
    
  } catch (error) {
    await client.query('ROLLBACK')
    console.error(`❌ Failed to compute metrics for ${vehicleId}:`, error)
    throw error
  } finally {
    client.release()
  }
}

// Helper to recompute metrics for all vehicles in a tenant
export async function recomputeAllVehicleMetrics(tenantId: string, dayISO?: string): Promise<void> {
  const client = await pool.connect()
  
  try {
    await client.query('SET LOCAL app.tenant_id = $1', [tenantId])
    
    const vehiclesQuery = await client.query(`
      SELECT id FROM vehicles WHERE tenant_id = $1
    `, [tenantId])
    
    const vehicles = vehiclesQuery.rows
    
    for (const vehicle of vehicles) {
      try {
        await recomputeDailyMetricsForVehicle(tenantId, vehicle.id, dayISO)
      } catch (error) {
        console.error(`Failed to recompute metrics for vehicle ${vehicle.id}:`, error)
        // Continue with other vehicles
      }
    }
    
    console.log(`✅ Recomputed metrics for ${vehicles.length} vehicles in tenant ${tenantId}`)
    
  } finally {
    client.release()
  }
}

// Background job to recompute metrics (called by cron or after manual events)
export async function scheduleMetricsRecomputation(
  tenantId: string, 
  vehicleId: string, 
  delayMs: number = 5000
): Promise<void> {
  setTimeout(async () => {
    try {
      await recomputeDailyMetricsForVehicle(tenantId, vehicleId)
    } catch (error) {
      console.error('Scheduled metrics recomputation failed:', error)
    }
  }, delayMs)
}
