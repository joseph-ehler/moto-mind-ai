// Demo Reset Route - Clean slate for walkthroughs
import type { NextApiRequest, NextApiResponse } from 'next'
import { Pool } from 'pg'
import { config } from 'dotenv'
import { v4 as uuidv4 } from 'uuid'
import { withValidation, validationSchemas } from '../../../lib/utils/api-validation'
import { withAuthAndValidation, ROLES, PERMISSIONS } from '../../../lib/utils/api-auth'

config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Safety check - only allow in development
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Demo reset not allowed in production' })
  }

  const client = await pool.connect()

  try {
    console.log('🔄 Resetting demo data...')

    // Demo UUIDs (consistent for easy testing)
    const demoTenantId = '550e8400-e29b-41d4-a716-446655440000'
    const demoUserId = '550e8400-e29b-41d4-a716-446655440001'
    const demoVehicleId = '550e8400-e29b-41d4-a716-446655440002'

    // Clear existing demo data
    await client.query('DELETE FROM manual_events WHERE tenant_id = $1', [demoTenantId])
    await client.query('DELETE FROM uploads WHERE tenant_id = $1', [demoTenantId])
    await client.query('DELETE FROM vehicle_metrics WHERE tenant_id = $1', [demoTenantId])
    await client.query('DELETE FROM vehicles WHERE tenant_id = $1', [demoTenantId])
    await client.query('DELETE FROM memberships WHERE tenant_id = $1', [demoTenantId])
    await client.query('DELETE FROM users WHERE id = $1', [demoUserId])
    await client.query('DELETE FROM tenants WHERE id = $1', [demoTenantId])

    // Create fresh demo entities
    await client.query(`
      INSERT INTO tenants (id, name, kind, plan_name, created_at, updated_at)
      VALUES ($1, 'Demo Fleet Operations', 'org', 'team', NOW(), NOW())
    `, [demoTenantId])

    await client.query(`
      INSERT INTO users (id, email, name, created_at, updated_at)
      VALUES ($1, 'demo@motomind.ai', 'Demo User', NOW(), NOW())
    `, [demoUserId])

    await client.query(`
      INSERT INTO memberships (tenant_id, user_id, role, created_at)
      VALUES ($1, $2, 'owner', NOW())
    `, [demoTenantId, demoUserId])

    await client.query(`
      INSERT INTO vehicles (id, tenant_id, label, make, model, vin, baseline_fuel_mpg, created_at, updated_at)
      VALUES ($1, $2, 'Demo Truck #47', 'Ford', 'F-150', 'DEMO123456789', 25.0, NOW(), NOW())
    `, [demoVehicleId, demoTenantId])

    // Add some sample historical data for demonstration
    const sampleEvents = [
      {
        id: uuidv4(),
        event_type: 'odometer_reading',
        payload: { miles: 125000, source: 'smartphone_capture' },
        confidence: 95,
        days_ago: 30
      },
      {
        id: uuidv4(),
        event_type: 'fuel_purchase',
        payload: { gallons: 18.5, total_cost: 67.50, price_per_gallon: 3.65, station_name: 'Shell', source: 'smartphone_capture' },
        confidence: 92,
        days_ago: 30
      },
      {
        id: uuidv4(),
        event_type: 'odometer_reading',
        payload: { miles: 125350, source: 'smartphone_capture' },
        confidence: 88,
        days_ago: 15
      },
      {
        id: uuidv4(),
        event_type: 'fuel_purchase',
        payload: { gallons: 16.2, total_cost: 58.32, price_per_gallon: 3.60, station_name: 'Chevron', source: 'smartphone_capture' },
        confidence: 94,
        days_ago: 15
      },
      {
        id: uuidv4(),
        event_type: 'odometer_reading',
        payload: { miles: 125680, source: 'smartphone_capture' },
        confidence: 96,
        days_ago: 7
      }
    ]

    for (const event of sampleEvents) {
      await client.query(`
        INSERT INTO manual_events (
          id, tenant_id, vehicle_id, event_type, payload, confidence, 
          verified_by_user, created_by, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW() - INTERVAL '${event.days_ago} days', NOW())
      `, [
        event.id,
        demoTenantId,
        demoVehicleId,
        event.event_type,
        JSON.stringify(event.payload),
        event.confidence,
        true,
        demoUserId
      ])
    }

    // Generate sample metrics
    await client.query(`
      INSERT INTO vehicle_metrics (
        vehicle_id, tenant_id, metric_date, period_type, 
        fuel_efficiency_mpg, miles_driven, data_completeness_pct, 
        created_at, updated_at
      ) VALUES 
        ($1, $2, CURRENT_DATE - INTERVAL '30 days', 'daily', 18.9, 350, 100, NOW(), NOW()),
        ($1, $2, CURRENT_DATE - INTERVAL '15 days', 'daily', 21.6, 330, 100, NOW(), NOW()),
        ($1, $2, CURRENT_DATE - INTERVAL '7 days', 'daily', 0, 0, 50, NOW(), NOW())
    `, [demoVehicleId, demoTenantId])

    console.log('✅ Demo data reset complete')

    return res.status(200).json({
      success: true,
      message: 'Demo data reset successfully',
      demo_entities: {
        tenant_id: demoTenantId,
        user_id: demoUserId,
        vehicle_id: demoVehicleId
      },
      sample_data: {
        events: sampleEvents.length,
        metrics: 3,
        data_completeness: '75%'
      },
      walkthrough_ready: true
    })

  } catch (error) {
    console.error('Demo reset error:', error)
    return res.status(500).json({
      error: 'Failed to reset demo data',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  } finally {
    client.release()
  }
}
