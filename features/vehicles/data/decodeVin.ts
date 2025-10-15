import type { NextApiRequest, NextApiResponse } from 'next'
import { withTenantIsolation } from '@/features/auth'

import { Pool } from 'pg'
import { config } from 'dotenv'
import { withValidation, validationSchemas } from '../../../lib/utils/api-validation'

config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
})

interface NHTSADecodeResult {
  Variable: string
  Value: string
  ValueId: string
}

interface VehicleSpecs {
  vin: string
  year: number
  make: string
  model: string
  trim?: string
  body_class: string
  engine: {
    model?: string
    cylinders?: number
    horsepower?: number
    fuel_type: string
  }
  drivetrain: string
  transmission: string
  manufactured: {
    country: string
    state?: string
  }
  recalls: any[]
  epa_mpg?: {
    city?: number
    highway?: number
    combined?: number
  }
  decoded_at: string
  source: 'nhtsa'
}

// Cache decoded VINs to avoid repeated API calls
async function getCachedVINData(vin: string): Promise<VehicleSpecs | null> {
  const client = await pool.connect()
  try {
    const result = await client.query(
      'SELECT * FROM vin_cache WHERE vin = $1 AND created_at > NOW() - INTERVAL \'7 days\'',
      [vin]
    )
    return result.rows[0]?.data || null
  } finally {
    client.release()
  }
}

async function cacheVINData(vin: string, data: VehicleSpecs): Promise<void> {
  const client = await pool.connect()
  try {
    await client.query(`
      INSERT INTO vin_cache (vin, data, created_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (vin) DO UPDATE SET
        data = EXCLUDED.data,
        created_at = EXCLUDED.created_at
    `, [vin, JSON.stringify(data)])
  } finally {
    client.release()
  }
}

// Decode VIN using NHTSA API
async function decodeVINWithNHTSA(vin: string): Promise<VehicleSpecs> {
  console.log('🔍 Decoding VIN with NHTSA:', vin)
  
  const url = `https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${vin}?format=json`
  console.log('📡 NHTSA API URL:', url)
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'MotoMindAI/1.0 (vehicle management)'
    }
  })

  console.log('📊 NHTSA API Response Status:', response.status, response.statusText)

  if (!response.ok) {
    const errorText = await response.text()
    console.log('❌ NHTSA API Error Response:', errorText)
    throw new Error(`NHTSA API error: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  console.log('📋 NHTSA API Response Data Keys:', Object.keys(data))
  console.log('📋 NHTSA Results Count:', data.Results?.length || 0)
  
  const results = data.Results as NHTSADecodeResult[]
  
  if (!results || results.length === 0) {
    console.log('❌ No results from NHTSA API')
    throw new Error('No vehicle data found for this VIN')
  }

  // Extract key fields from NHTSA response
  const getValue = (variableName: string): string => {
    const item = results.find(r => r.Variable === variableName)
    return item?.Value || ''
  }

  const year = parseInt(getValue('Model Year')) || 0
  const make = getValue('Make') || 'Unknown'
  const model = getValue('Model') || 'Unknown'

  // Get recalls for this vehicle
  const recalls = await getRecalls(make, model, year)

  const specs: VehicleSpecs = {
    vin,
    year,
    make,
    model,
    trim: getValue('Trim') || undefined,
    body_class: getValue('Body Class'),
    engine: {
      model: getValue('Engine Model') || undefined,
      cylinders: parseInt(getValue('Engine Number of Cylinders')) || undefined,
      horsepower: parseInt(getValue('Engine Brake Horsepower (BHP)')) || undefined,
      fuel_type: getValue('Fuel Type - Primary') || 'Unknown'
    },
    drivetrain: getValue('Drive Type') || 'Unknown',
    transmission: getValue('Transmission Style') || 'Unknown',
    manufactured: {
      country: getValue('Plant Country'),
      state: getValue('Plant State') || undefined
    },
    recalls,
    decoded_at: new Date().toISOString(),
    source: 'nhtsa'
  }

  // Try to get EPA fuel economy data
  try {
    const mpgData = await getEPAFuelEconomy(make, model, year)
    if (mpgData) {
      specs.epa_mpg = mpgData
    }
  } catch (error) {
    console.log('EPA data not available for this vehicle')
  }

  return specs
}

// Get recalls from NHTSA
async function getRecalls(make: string, model: string, year: number): Promise<any[]> {
  try {
    const response = await fetch(
      `https://api.nhtsa.dot.gov/recalls/recallsByVehicle?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&modelYear=${year}`,
      {
        headers: {
          'User-Agent': 'MotoMindAI/1.0 (vehicle management)'
        }
      }
    )

    if (!response.ok) return []

    const data = await response.json()
    return data.results?.slice(0, 10) || [] // Limit to 10 most recent recalls
  } catch (error) {
    console.error('Recalls fetch error:', error)
    return []
  }
}

// Get EPA fuel economy (simplified - would need EPA API key for full data)
async function getEPAFuelEconomy(make: string, model: string, year: number): Promise<any> {
  // This would integrate with EPA's fuel economy API
  // For now, return null - can be enhanced later
  return null
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Use validation middleware
  return withValidation(req, res, validationSchemas.vin.decodeVin, async (validatedData) => {
    const { vin } = validatedData
    console.log('🚗 VIN decode request received:', { vin, length: vin?.length })

    // Check cache first
    let specs = null
    try {
      specs = await getCachedVINData(vin)
      if (specs) {
        console.log('✅ Using cached VIN data for:', vin)
      }
    } catch (cacheError) {
      console.log('⚠️ Cache lookup failed, proceeding with API:', cacheError)
    }
    
    if (!specs) {
      console.log('🔍 No cached data found, calling NHTSA API for:', vin)
      // Decode with NHTSA
      specs = await decodeVINWithNHTSA(vin)
      
      // Try to cache the result (don't fail if caching fails)
      try {
        await cacheVINData(vin, specs)
        console.log('💾 Successfully cached VIN data for:', vin)
      } catch (cacheError) {
        console.log('⚠️ Failed to cache VIN data (continuing anyway):', cacheError)
      }
    }

    // Generate smart defaults based on decoded data
    const smartDefaults = generateSmartDefaults(specs)

    return res.status(200).json({
      success: true,
      specs,
      smart_defaults: smartDefaults,
      cached: !!specs
    })
  }) // Close withValidation
}

// Generate smart defaults based on vehicle specs
function generateSmartDefaults(specs: VehicleSpecs) {
  const defaults: any = {
    service_intervals: {
      oil_change_miles: 5000,
      tire_rotation_miles: 7500,
      brake_inspection_miles: 10000
    },
    baseline_mpg: null,
    maintenance_schedule: []
  }

  // Adjust service intervals based on vehicle type
  if (specs.body_class?.toLowerCase().includes('truck') || 
      specs.body_class?.toLowerCase().includes('pickup')) {
    defaults.service_intervals.oil_change_miles = 7500 // Trucks often have longer intervals
  }

  // Set baseline MPG from EPA data or estimate
  if (specs.epa_mpg?.combined) {
    defaults.baseline_mpg = specs.epa_mpg.combined
  } else {
    // Rough estimates based on vehicle type and engine
    if (specs.engine.cylinders) {
      if (specs.engine.cylinders <= 4) {
        defaults.baseline_mpg = 28
      } else if (specs.engine.cylinders <= 6) {
        defaults.baseline_mpg = 22
      } else {
        defaults.baseline_mpg = 18
      }
    }
  }

  // Generate maintenance schedule based on age
  const currentYear = new Date().getFullYear()
  const vehicleAge = currentYear - specs.year

  if (vehicleAge > 10) {
    defaults.maintenance_schedule.push(
      { type: 'timing_belt', due_miles: 100000, priority: 'high' },
      { type: 'coolant_flush', due_miles: 60000, priority: 'medium' }
    )
  }

  if (vehicleAge > 5) {
    defaults.maintenance_schedule.push(
      { type: 'transmission_service', due_miles: 60000, priority: 'medium' },
      { type: 'brake_fluid', due_miles: 30000, priority: 'medium' }
    )
  }

  return defaults
}


export default withTenantIsolation(handler)
