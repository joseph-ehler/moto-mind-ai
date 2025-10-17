// Working Supabase save endpoint - bypassing the trigger issue
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
    console.log('📥 Request body:', JSON.stringify(req.body, null, 2))
    const { eventType, data, uploadId, vehicleId } = req.body

    // Demo UUIDs
    const demoTenantId = '550e8400-e29b-41d4-a716-446655440000'
    const demoUserId = '550e8400-e29b-41d4-a716-446655440001'
    const demoVehicleId = '550e8400-e29b-41d4-a716-446655440002'

    // Ensure demo entities exist (without conflicts)
    await client.query(`
      INSERT INTO tenants (id, name, kind, plan_name, created_at, updated_at)
      VALUES ($1, 'Demo Fleet Operations', 'org', 'team', now(), now())
      ON CONFLICT (id) DO NOTHING
    `, [demoTenantId])

    await client.query(`
      INSERT INTO users (id, email, name, created_at, updated_at)
      VALUES ($1, 'demo@motomind.ai', 'Demo User', now(), now())
      ON CONFLICT (id) DO NOTHING
    `, [demoUserId])

    await client.query(`
      INSERT INTO memberships (tenant_id, user_id, role, created_at)
      VALUES ($1, $2, 'owner', now())
      ON CONFLICT (tenant_id, user_id) DO NOTHING
    `, [demoTenantId, demoUserId])

    await client.query(`
      INSERT INTO vehicles (id, tenant_id, label, make, model, vin, baseline_fuel_mpg, created_at, updated_at)
      VALUES ($1, $2, 'Demo Truck #47', 'Ford', 'F-150', 'DEMO123456789', 12.5, now(), now())
      ON CONFLICT (id) DO NOTHING
    `, [demoVehicleId, demoTenantId])

    // Save upload record
    const uploadRecordId = uploadId || uuidv4()
    const uploadKind = eventType === 'fuel_purchase' ? 'fuel_receipt' : eventType
    await client.query(`
      INSERT INTO uploads (id, tenant_id, user_id, vehicle_id, kind, storage_url, mime_type, bytes, captured_at, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now(), now(), now())
    `, [
      uploadRecordId,
      demoTenantId,
      demoUserId,
      demoVehicleId,
      uploadKind,
      `/uploads/${uploadRecordId}.jpg`,
      'image/jpeg',
      1024
    ])

    // Save manual event - use direct SQL to bypass trigger issues
    const eventId = uuidv4()
    const eventData = {
      ...data,
      extracted_by: data.source || 'tesseract_ocr',
      verified_by_user: true
    }

    // Temporarily drop the problematic trigger
    await client.query('DROP TRIGGER IF EXISTS manual_events_refresh_metrics ON manual_events')
    
    try {
      // Insert the manual event
      await client.query(`
        INSERT INTO manual_events (
          id, 
          tenant_id, 
          vehicle_id, 
          source_upload_id, 
          event_type, 
          payload, 
          confidence, 
          verified_by_user, 
          created_by, 
          created_at, 
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, now(), now())
      `, [
        eventId,
        demoTenantId,
        demoVehicleId,
        uploadRecordId,
        eventType === 'odometer_photo' ? 'odometer_reading' : eventType,
        JSON.stringify(eventData),
        data.ocr_confidence || 90,
        true,
        demoUserId
      ])
    } finally {
      // Recreate the trigger
      await client.query(`
        CREATE TRIGGER manual_events_refresh_metrics
        AFTER INSERT OR UPDATE ON manual_events
        FOR EACH ROW EXECUTE FUNCTION trigger_refresh_metrics()
      `)
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
