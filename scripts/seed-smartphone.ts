// MotoMindAI: Smartphone Data Seed Script
// Creates realistic manual events and uploads for testing

import { Pool } from 'pg'
import { v4 as uuidv4 } from 'uuid'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/motomind_dev'
})

async function seedSmartphoneData() {
  const client = await pool.connect()
  
  try {
    console.log('🌱 Seeding smartphone capture data...')
    
    // Create sample uploads
    const uploads = [
      {
        id: uuidv4(),
        tenantId: 'demo-tenant-123',
        userId: 'demo-user-456',
        vehicleId: 'truck-47',
        kind: 'odometer_photo',
        storageUrl: '/uploads/odometer-truck47-001.jpg',
        mimeType: 'image/jpeg',
        bytes: 245760
      },
      {
        id: uuidv4(),
        tenantId: 'demo-tenant-123',
        userId: 'demo-user-456',
        vehicleId: 'truck-47',
        kind: 'fuel_receipt',
        storageUrl: '/uploads/receipt-truck47-001.jpg',
        mimeType: 'image/jpeg',
        bytes: 189432
      },
      {
        id: uuidv4(),
        tenantId: 'demo-tenant-123',
        userId: 'demo-user-456',
        vehicleId: 'truck-47',
        kind: 'maintenance_doc',
        storageUrl: '/uploads/maintenance-truck47-001.jpg',
        mimeType: 'image/jpeg',
        bytes: 312456
      }
    ]
    
    console.log('Creating uploads...')
    for (const upload of uploads) {
      await client.query(`
        INSERT INTO uploads (id, tenant_id, user_id, vehicle_id, kind, storage_url, mime_type, bytes, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now() - interval '2 days')
        ON CONFLICT (id) DO UPDATE SET
          storage_url = EXCLUDED.storage_url,
          mime_type = EXCLUDED.mime_type,
          bytes = EXCLUDED.bytes
      `, [upload.id, upload.tenantId, upload.userId, upload.vehicleId, upload.kind, upload.storageUrl, upload.mimeType, upload.bytes])
    }
    
    // Create manual events that tell a story
    const manualEvents = [
      // Truck 47 - Progressive deterioration story
      {
        tenantId: 'demo-tenant-123',
        vehicleId: 'truck-47',
        sourceUploadId: uploads[0].id,
        eventType: 'odometer_reading',
        payload: {
          miles: 73450,
          ocr_confidence: 92,
          parsed_digits: '073450'
        },
        confidence: 92,
        createdAt: 'now() - interval \'30 days\''
      },
      {
        tenantId: 'demo-tenant-123',
        vehicleId: 'truck-47',
        sourceUploadId: uploads[1].id,
        eventType: 'fuel_purchase',
        payload: {
          gallons: 18.5,
          price_total: 81.23,
          unit_price: 4.39,
          date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          station: 'Shell Station',
          ocr_confidence: 88
        },
        confidence: 88,
        createdAt: 'now() - interval \'30 days\''
      },
      {
        tenantId: 'demo-tenant-123',
        vehicleId: 'truck-47',
        sourceUploadId: null,
        eventType: 'odometer_reading',
        payload: {
          miles: 73650,
          ocr_confidence: 95,
          parsed_digits: '073650'
        },
        confidence: 95,
        createdAt: 'now() - interval \'15 days\''
      },
      {
        tenantId: 'demo-tenant-123',
        vehicleId: 'truck-47',
        sourceUploadId: null,
        eventType: 'fuel_purchase',
        payload: {
          gallons: 19.2,
          price_total: 84.67,
          unit_price: 4.41,
          date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          station: 'Exxon',
          ocr_confidence: 91
        },
        confidence: 91,
        createdAt: 'now() - interval \'15 days\''
      },
      {
        tenantId: 'demo-tenant-123',
        vehicleId: 'truck-47',
        sourceUploadId: uploads[2].id,
        eventType: 'maintenance',
        payload: {
          service_type: 'oil_change',
          parts: ['oil_filter', '5w30_oil'],
          date: new Date(Date.now() - 95 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          notes: 'Regular oil change service',
          cost: 89.99,
          odometer_miles: 68500
        },
        confidence: 85,
        createdAt: 'now() - interval \'95 days\''
      },
      {
        tenantId: 'demo-tenant-123',
        vehicleId: 'truck-47',
        sourceUploadId: null,
        eventType: 'issue_report',
        payload: {
          category: 'brakes',
          severity: 'high',
          note: 'Brake pads making squealing noise when stopping. Noticed increased stopping distance.',
          photo_ids: []
        },
        confidence: 100,
        createdAt: 'now() - interval \'3 days\''
      },
      {
        tenantId: 'demo-tenant-123',
        vehicleId: 'truck-47',
        sourceUploadId: null,
        eventType: 'odometer_reading',
        payload: {
          miles: 73854,
          ocr_confidence: 89,
          parsed_digits: '073854'
        },
        confidence: 89,
        createdAt: 'now() - interval \'1 day\''
      },
      
      // Truck 23 - Healthy vehicle with regular maintenance
      {
        tenantId: 'demo-tenant-123',
        vehicleId: 'truck-23',
        sourceUploadId: null,
        eventType: 'odometer_reading',
        payload: {
          miles: 45200,
          ocr_confidence: 94,
          parsed_digits: '045200'
        },
        confidence: 94,
        createdAt: 'now() - interval \'20 days\''
      },
      {
        tenantId: 'demo-tenant-123',
        vehicleId: 'truck-23',
        sourceUploadId: null,
        eventType: 'fuel_purchase',
        payload: {
          gallons: 16.8,
          price_total: 73.92,
          unit_price: 4.40,
          date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          station: 'BP',
          ocr_confidence: 93
        },
        confidence: 93,
        createdAt: 'now() - interval \'20 days\''
      },
      {
        tenantId: 'demo-tenant-123',
        vehicleId: 'truck-23',
        sourceUploadId: null,
        eventType: 'maintenance',
        payload: {
          service_type: 'inspection',
          parts: [],
          date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          notes: 'Annual safety inspection - passed',
          cost: 25.00,
          odometer_miles: 44800
        },
        confidence: 100,
        createdAt: 'now() - interval \'45 days\''
      },
      {
        tenantId: 'demo-tenant-123',
        vehicleId: 'truck-23',
        sourceUploadId: null,
        eventType: 'odometer_reading',
        payload: {
          miles: 45324,
          ocr_confidence: 96,
          parsed_digits: '045324'
        },
        confidence: 96,
        createdAt: 'now() - interval \'2 days\''
      },
      
      // Solo tenant - John's Truck
      {
        tenantId: 'solo-tenant-456',
        vehicleId: 'johns-truck',
        sourceUploadId: null,
        eventType: 'odometer_reading',
        payload: {
          miles: 89650,
          ocr_confidence: 87,
          parsed_digits: '089650'
        },
        confidence: 87,
        createdAt: 'now() - interval \'10 days\''
      },
      {
        tenantId: 'solo-tenant-456',
        vehicleId: 'johns-truck',
        sourceUploadId: null,
        eventType: 'fuel_purchase',
        payload: {
          gallons: 22.1,
          price_total: 97.24,
          unit_price: 4.40,
          date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          station: 'Chevron',
          ocr_confidence: 90
        },
        confidence: 90,
        createdAt: 'now() - interval \'10 days\''
      },
      {
        tenantId: 'solo-tenant-456',
        vehicleId: 'johns-truck',
        sourceUploadId: null,
        eventType: 'odometer_reading',
        payload: {
          miles: 89756,
          ocr_confidence: 91,
          parsed_digits: '089756'
        },
        confidence: 91,
        createdAt: 'now() - interval \'1 day\''
      }
    ]
    
    console.log('Creating manual events...')
    for (const event of manualEvents) {
      await client.query(`
        INSERT INTO manual_events (
          tenant_id, vehicle_id, source_upload_id, event_type, 
          payload, confidence, verified_by_user, created_by, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, true, $7, ${event.createdAt})
      `, [
        event.tenantId,
        event.vehicleId,
        event.sourceUploadId,
        event.eventType,
        JSON.stringify(event.payload),
        event.confidence,
        'demo-user-456'
      ])
    }
    
    // Set baseline fuel efficiency for vehicles
    console.log('Setting vehicle baselines...')
    await client.query(`
      UPDATE vehicles 
      SET baseline_fuel_mpg = 12.5, baseline_service_interval_miles = 5000
      WHERE id = 'truck-47'
    `)
    
    await client.query(`
      UPDATE vehicles 
      SET baseline_fuel_mpg = 14.2, baseline_service_interval_miles = 5000
      WHERE id = 'truck-23'
    `)
    
    await client.query(`
      UPDATE vehicles 
      SET baseline_fuel_mpg = 11.8, baseline_service_interval_miles = 7500
      WHERE id = 'johns-truck'
    `)
    
    // Refresh computed metrics for all vehicles
    console.log('Computing vehicle metrics...')
    const vehicles = ['truck-47', 'truck-23', 'johns-truck']
    const tenants = {
      'truck-47': 'demo-tenant-123',
      'truck-23': 'demo-tenant-123',
      'johns-truck': 'solo-tenant-456'
    }
    
    for (const vehicleId of vehicles) {
      const tenantId = tenants[vehicleId as keyof typeof tenants]
      await client.query('SELECT refresh_vehicle_metrics($1, $2)', [tenantId, vehicleId])
    }
    
    console.log('✅ Smartphone data seeded successfully!')
    console.log('\n📊 Seed Summary:')
    console.log(`- 3 file uploads (photos/documents)`)
    console.log(`- ${manualEvents.length} manual events`)
    console.log(`- Truck 47: Deteriorating (brake issues, overdue maintenance)`)
    console.log(`- Truck 23: Healthy (regular maintenance, good efficiency)`)
    console.log(`- John's Truck: Solo user with basic tracking`)
    console.log(`\n🎯 Ready to test: Capture new data or ask "Why is Truck 47 flagged?"`)
    
  } catch (error) {
    console.error('❌ Smartphone seed failed:', error)
    throw error
  } finally {
    client.release()
  }
}

// Run if called directly
if (require.main === module) {
  seedSmartphoneData()
    .then(() => {
      console.log('🌱 Smartphone seed complete!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Smartphone seed failed:', error)
      process.exit(1)
    })
}

export { seedSmartphoneData }
