// MotoMindAI: Seed Data Script
// Creates test tenants, vehicles, and metrics for development

import { Pool } from 'pg'
import { v4 as uuidv4 } from 'uuid'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/motomind_dev'
})

interface SeedTenant {
  id: string
  name: string
  kind: 'solo' | 'org'
  planName: string
}

interface SeedVehicle {
  id: string
  tenantId: string
  label: string
  make: string
  model: string
  vin?: string
}

interface SeedMetrics {
  vehicleId: string
  tenantId: string
  brakeWearPct?: number
  fuelEfficiencyMpg?: number
  harshEvents: number
  idleMinutes: number
  milesDriven?: number
  dataCompletenessPct: number
  sourceLatencySec: number
  lastServiceDate?: Date
}

async function seedDatabase() {
  const client = await pool.connect()
  
  try {
    console.log('🌱 Starting database seed...')
    
    // Create test tenants
    const tenants: SeedTenant[] = [
      {
        id: 'demo-tenant-123',
        name: 'Demo Fleet Operations',
        kind: 'org',
        planName: 'team'
      },
      {
        id: 'solo-tenant-456',
        name: 'John\'s Trucking',
        kind: 'solo',
        planName: 'solo'
      }
    ]
    
    console.log('Creating tenants...')
    for (const tenant of tenants) {
      await client.query(`
        INSERT INTO tenants (id, name, kind, plan_name, created_at, updated_at)
        VALUES ($1, $2, $3, $4, now(), now())
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          kind = EXCLUDED.kind,
          plan_name = EXCLUDED.plan_name,
          updated_at = now()
      `, [tenant.id, tenant.name, tenant.kind, tenant.planName])
    }
    
    // Create test vehicles
    const vehicles: SeedVehicle[] = [
      // Demo Fleet (org) vehicles
      {
        id: 'truck-47',
        tenantId: 'demo-tenant-123',
        label: 'Truck 47',
        make: 'Ford',
        model: 'F-150',
        vin: 'DEMO47VIN123456789'
      },
      {
        id: 'truck-23',
        tenantId: 'demo-tenant-123',
        label: 'Truck 23',
        make: 'Chevrolet',
        model: 'Silverado',
        vin: 'DEMO23VIN987654321'
      },
      {
        id: 'van-12',
        tenantId: 'demo-tenant-123',
        label: 'Van 12',
        make: 'Ford',
        model: 'Transit',
        vin: 'DEMO12VIN456789123'
      },
      {
        id: 'truck-88',
        tenantId: 'demo-tenant-123',
        label: 'Truck 88',
        make: 'Ram',
        model: '1500',
        vin: 'DEMO88VIN789123456'
      },
      // Solo tenant vehicle
      {
        id: 'johns-truck',
        tenantId: 'solo-tenant-456',
        label: 'John\'s Truck',
        make: 'Ford',
        model: 'F-250',
        vin: 'SOLO01VIN123789456'
      }
    ]
    
    console.log('Creating vehicles...')
    for (const vehicle of vehicles) {
      await client.query(`
        INSERT INTO vehicles (id, tenant_id, label, make, model, vin, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, now(), now())
        ON CONFLICT (id) DO UPDATE SET
          label = EXCLUDED.label,
          make = EXCLUDED.make,
          model = EXCLUDED.model,
          vin = EXCLUDED.vin,
          updated_at = now()
      `, [vehicle.id, vehicle.tenantId, vehicle.label, vehicle.make, vehicle.model, vehicle.vin])
    }
    
    // Create vehicle metrics with realistic data that triggers rules
    const metricsData: SeedMetrics[] = [
      // Truck 47 - FLAGGED (brake wear critical + harsh events)
      {
        vehicleId: 'truck-47',
        tenantId: 'demo-tenant-123',
        brakeWearPct: 87, // Critical - exceeds 85% threshold
        fuelEfficiencyMpg: 9.2,
        harshEvents: 5, // Critical - exceeds 3 threshold
        idleMinutes: 45,
        milesDriven: 287,
        dataCompletenessPct: 85,
        sourceLatencySec: 120, // 2 minutes old
        lastServiceDate: new Date(Date.now() - 95 * 24 * 60 * 60 * 1000) // 95 days ago - overdue
      },
      
      // Truck 23 - HEALTHY (all metrics good)
      {
        vehicleId: 'truck-23',
        tenantId: 'demo-tenant-123',
        brakeWearPct: 45,
        fuelEfficiencyMpg: 11.8,
        harshEvents: 1,
        idleMinutes: 25,
        milesDriven: 324,
        dataCompletenessPct: 92,
        sourceLatencySec: 30, // 30 seconds old
        lastServiceDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000) // 45 days ago
      },
      
      // Van 12 - WARNING (fuel efficiency + idle time)
      {
        vehicleId: 'van-12',
        tenantId: 'demo-tenant-123',
        brakeWearPct: 62,
        fuelEfficiencyMpg: 7.3, // Warning - below 8 MPG threshold
        harshEvents: 2,
        idleMinutes: 135, // Warning - exceeds 120 minutes
        milesDriven: 198,
        dataCompletenessPct: 67, // Lower data quality
        sourceLatencySec: 1080, // 18 minutes old - stale
        lastServiceDate: new Date(Date.now() - 78 * 24 * 60 * 60 * 1000) // 78 days ago
      },
      
      // Truck 88 - WARNING (brake wear approaching threshold)
      {
        vehicleId: 'truck-88',
        tenantId: 'demo-tenant-123',
        brakeWearPct: 73, // Warning - exceeds 70% threshold
        fuelEfficiencyMpg: 10.1,
        harshEvents: 0,
        idleMinutes: 18,
        milesDriven: 412,
        dataCompletenessPct: 88,
        sourceLatencySec: 45,
        lastServiceDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
      },
      
      // John's Truck - HEALTHY (solo tenant)
      {
        vehicleId: 'johns-truck',
        tenantId: 'solo-tenant-456',
        brakeWearPct: 38,
        fuelEfficiencyMpg: 12.4,
        harshEvents: 0,
        idleMinutes: 12,
        milesDriven: 156,
        dataCompletenessPct: 95,
        sourceLatencySec: 15,
        lastServiceDate: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000) // 21 days ago
      }
    ]
    
    console.log('Creating vehicle metrics...')
    for (const metrics of metricsData) {
      await client.query(`
        INSERT INTO vehicle_metrics (
          tenant_id, vehicle_id, brake_wear_pct, fuel_efficiency_mpg, 
          harsh_events, idle_minutes, miles_driven, data_completeness_pct, 
          source_latency_sec, last_service_date, metric_date, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, now(), now())
        ON CONFLICT (tenant_id, vehicle_id, metric_date) DO UPDATE SET
          brake_wear_pct = EXCLUDED.brake_wear_pct,
          fuel_efficiency_mpg = EXCLUDED.fuel_efficiency_mpg,
          harsh_events = EXCLUDED.harsh_events,
          idle_minutes = EXCLUDED.idle_minutes,
          miles_driven = EXCLUDED.miles_driven,
          data_completeness_pct = EXCLUDED.data_completeness_pct,
          source_latency_sec = EXCLUDED.source_latency_sec,
          last_service_date = EXCLUDED.last_service_date
      `, [
        metrics.tenantId,
        metrics.vehicleId,
        metrics.brakeWearPct,
        metrics.fuelEfficiencyMpg,
        metrics.harshEvents,
        metrics.idleMinutes,
        metrics.milesDriven,
        metrics.dataCompletenessPct,
        metrics.sourceLatencySec,
        metrics.lastServiceDate
      ])
    }
    
    // Create demo users
    console.log('Creating demo users...')
    const users = [
      {
        id: 'demo-user-456',
        tenantId: 'demo-tenant-123',
        email: 'demo@motomind.ai',
        name: 'Demo Fleet Manager',
        role: 'owner'
      },
      {
        id: 'solo-user-789',
        tenantId: 'solo-tenant-456',
        email: 'john@johnstrucking.com',
        name: 'John Smith',
        role: 'owner'
      }
    ]
    
    for (const user of users) {
      await client.query(`
        INSERT INTO users (id, email, name, created_at, updated_at)
        VALUES ($1, $2, $3, now(), now())
        ON CONFLICT (id) DO UPDATE SET
          email = EXCLUDED.email,
          name = EXCLUDED.name,
          updated_at = now()
      `, [user.id, user.email, user.name])
      
      await client.query(`
        INSERT INTO memberships (tenant_id, user_id, role, created_at)
        VALUES ($1, $2, $3, now())
        ON CONFLICT (tenant_id, user_id) DO UPDATE SET
          role = EXCLUDED.role
      `, [user.tenantId, user.id, user.role])
    }
    
    console.log('✅ Database seeded successfully!')
    console.log('\n📊 Seed Summary:')
    console.log(`- 2 tenants (1 org, 1 solo)`)
    console.log(`- 5 vehicles total`)
    console.log(`- Truck 47: FLAGGED (brake 87%, harsh events 5)`)
    console.log(`- Van 12: WARNING (fuel 7.3 MPG, idle 135 min)`)
    console.log(`- Truck 88: WARNING (brake 73%)`)
    console.log(`- Truck 23 & John's Truck: HEALTHY`)
    console.log(`\n🎯 Ready to test: "Why was Truck 47 flagged?"`)
    
  } catch (error) {
    console.error('❌ Seed failed:', error)
    throw error
  } finally {
    client.release()
  }
}

// Run if called directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('🌱 Seed complete!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Seed failed:', error)
      process.exit(1)
    })
}

export { seedDatabase }
