import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    console.log('🔍 Testing database access...')
    
    // First test: Can we access vehicles table (known to work)?
    console.log('📋 Testing vehicles table access...')
    const { data: vehiclesTest, error: vehiclesError } = await supabase
      .from('vehicles')
      .select('id')
      .limit(1)
    
    if (vehiclesError) {
      console.error('❌ Cannot access vehicles table:', vehiclesError)
      return res.status(500).json({
        success: false,
        error: 'Cannot access vehicles table: ' + vehiclesError.message,
        step: 'vehicles_test'
      })
    }
    
    console.log('✅ Vehicles table accessible')
    
    // Second test: Try to access vehicle_events_2025 partition directly
    console.log('📋 Testing vehicle_events_2025 partition access...')
    const { data: partitionTest, error: partitionError } = await supabase
      .from('vehicle_events_2025')
      .select('*')
      .limit(1)
    
    if (partitionError) {
      console.error('❌ Cannot access vehicle_events_2025 partition:', partitionError)
    } else {
      console.log('✅ vehicle_events_2025 partition accessible')
    }
    
    // Third test: Try to insert into the vehicle_events table
    const testEvent = {
      tenant_id: '550e8400-e29b-41d4-a716-446655440000',
      vehicle_id: 'dfa33260-a922-45d9-a649-3050377a7a62',
      type: 'odometer',
      date: '2025-09-27',
      miles: 125432,
      payload: {},
      notes: 'Test event'
    }
    
    console.log('📊 Attempting to insert test event into main table:', testEvent)
    
    const { data, error } = await supabase
      .from('vehicle_events')
      .insert(testEvent)
      .select('*')
      .single()

    if (error) {
      console.error('❌ Error querying vehicle_events:', error)
      return res.status(500).json({
        success: false,
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      })
    }

    console.log('✅ Successfully inserted into vehicle_events table')
    
    return res.status(200).json({
      success: true,
      message: 'vehicle_events table insert successful',
      insertedData: data
    })

  } catch (error) {
    console.error('❌ Test error:', error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
