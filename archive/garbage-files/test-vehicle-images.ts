// Test API to debug vehicle_images table
import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    console.log('🧪 Testing vehicle_images table access...')

    // Test 1: Check if table exists and is accessible
    const { data: tableTest, error: tableError } = await supabase
      .from('vehicle_images')
      .select('count(*)')
      .limit(1)

    if (tableError) {
      console.error('❌ Table access error:', tableError)
      return res.status(500).json({ 
        error: 'Table access failed', 
        details: tableError.message,
        code: tableError.code
      })
    }

    console.log('✅ Table accessible, count result:', tableTest)

    // Test 2: Try to select all columns
    const { data: allData, error: allError } = await supabase
      .from('vehicle_images')
      .select('*')
      .limit(5)

    if (allError) {
      console.error('❌ Select all error:', allError)
      return res.status(500).json({ 
        error: 'Select failed', 
        details: allError.message,
        code: allError.code
      })
    }

    console.log('✅ Select all successful, found', allData?.length || 0, 'records')

    // Test 3: Check specific vehicle
    const vehicleId = 'fe9a4877-ac45-42b8-8532-75b018b96253'
    const tenantId = '550e8400-e29b-41d4-a716-446655440000'

    const { data: vehicleImages, error: vehicleError } = await supabase
      .from('vehicle_images')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .eq('tenant_id', tenantId)

    if (vehicleError) {
      console.error('❌ Vehicle images query error:', vehicleError)
      return res.status(500).json({ 
        error: 'Vehicle query failed', 
        details: vehicleError.message,
        code: vehicleError.code
      })
    }

    console.log('✅ Vehicle images query successful, found', vehicleImages?.length || 0, 'images')

    return res.status(200).json({
      success: true,
      tableAccessible: true,
      totalRecords: allData?.length || 0,
      vehicleImages: vehicleImages?.length || 0,
      sampleData: allData?.slice(0, 2) || []
    })

  } catch (error) {
    console.error('❌ Test API error:', error)
    return res.status(500).json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
