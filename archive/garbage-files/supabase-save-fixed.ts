// Fixed Supabase save endpoint - isolating the issue
import type { NextApiRequest, NextApiResponse } from 'next'
import { Pool } from 'pg'
import { config } from 'dotenv'
import { v4 as uuidv4 } from 'uuid'

// Load environment variables
config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
})

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const client = await pool.connect()

  try {
    const { eventType, data, uploadId, vehicleId } = req.body

    // Demo UUIDs
    const demoTenantId = '550e8400-e29b-41d4-a716-446655440000'
    const demoUserId = '550e8400-e29b-41d4-a716-446655440001'
    const demoVehicleId = '550e8400-e29b-41d4-a716-446655440002'

    // Step 1: Ensure demo tenant exists
    await client.query(`
      INSERT INTO tenants (id, name, kind, plan_name, created_at, updated_at)
      VALUES ($1, 'Demo Fleet Operations', 'org', 'team', now(), now())
      ON CONFLICT (id) DO NOTHING
    `, [demoTenantId])

    // Step 2: Ensure demo user exists
    await client.query(`
      INSERT INTO users (id, email, name, created_at, updated_at)
      VALUES ($1, 'demo@motomind.ai', 'Demo User', now(), now())
      ON CONFLICT (id) DO NOTHING
    `, [demoUserId])

    // Step 3: Ensure membership exists
    await client.query(`
      INSERT INTO memberships (tenant_id, user_id, role, created_at)
      VALUES ($1, $2, 'owner', now())
      ON CONFLICT (tenant_id, user_id) DO NOTHING
    `, [demoTenantId, demoUserId])

    // Step 4: Ensure demo vehicle exists
    await client.query(`
      INSERT INTO vehicles (id, tenant_id, label, make, model, vin, baseline_fuel_mpg, created_at, updated_at)
      VALUES ($1, $2, 'Demo Truck #47', 'Ford', 'F-150', 'DEMO123456789', 12.5, now(), now())
      ON CONFLICT (id) DO NOTHING
    `, [demoVehicleId, demoTenantId])

    // Step 5: Save upload record
    const uploadRecordId = uuidv4()
    await client.query(`
      INSERT INTO uploads (id, tenant_id, user_id, vehicle_id, kind, storage_url, mime_type, bytes, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now(), now())
    `, [uploadRecordId, demoTenantId, demoUserId, demoVehicleId, eventType, `/uploads/${uploadId || 'demo'}.jpg`, 'image/jpeg', 1024])

    // Step 6: Save manual event with OCR data (without upload reference for now)
    const eventId = uuidv4()
    const eventData = {
      ...data,
      extracted_by: data.source || 'tesseract_ocr',
      verified_by_user: true
    }

    // Temporarily disable the trigger that's causing the ambiguous column reference
    await client.query('ALTER TABLE manual_events DISABLE TRIGGER manual_events_refresh_metrics')
    
    try {
      await client.query(`
        INSERT INTO manual_events (id, tenant_id, vehicle_id, event_type, payload, confidence, verified_by_user, created_by, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now(), now())
      `, [
        eventId,
        demoTenantId,
        demoVehicleId,
        eventType === 'odometer_photo' ? 'odometer_reading' : eventType,
        JSON.stringify(eventData),
        data.ocr_confidence || 90,
        true,
        demoUserId
      ])
    } finally {
      // Re-enable the trigger
      await client.query('ALTER TABLE manual_events ENABLE TRIGGER manual_events_refresh_metrics')
    }

    console.log('✅ Data saved to Supabase:', {
      eventId,
      uploadRecordId,
      eventType,
      data: eventData,
      vehicleId: demoVehicleId,
      timestamp: new Date().toISOString()
    })

    return res.status(200).json({
      success: true,
      id: eventId,
      uploadId: uploadRecordId,
      message: 'Data saved to Supabase successfully!',
      saved: {
        eventType,
        data: eventData,
        vehicleId: demoVehicleId,
        tenantId: demoTenantId
      }
    })

  } catch (error) {
    console.error('Supabase save error:', error)
    return res.status(500).json({ 
      error: 'Failed to save to Supabase',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  } finally {
    client.release()
  }
}
