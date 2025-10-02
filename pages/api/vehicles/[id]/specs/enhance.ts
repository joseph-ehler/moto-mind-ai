import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

// MVP: NHTSA-only processing (fast enough for synchronous execution)
// Processing takes ~5-10 seconds total (6 NHTSA API calls, no OpenAI)
export const config = {
  maxDuration: 30, // 30 seconds is enough for NHTSA-only
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

const CATEGORIES = ['engine', 'drivetrain', 'dimensions', 'fuel_economy', 'safety', 'features'] as const
type Category = typeof CATEGORIES[number]

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { id: vehicleId } = req.query

  if (!vehicleId || typeof vehicleId !== 'string') {
    return res.status(400).json({ error: 'Vehicle ID required' })
  }

  try {
    // Get vehicle details
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('year, make, model, trim, vin')
      .eq('id', vehicleId)
      .single()

    if (vehicleError || !vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' })
    }

    // Initialize enhancement records for all categories
    const enhancementRecords = CATEGORIES.map(category => ({
      vehicle_id: vehicleId,
      category,
      status: 'pending'
    }))

    const { error: insertError } = await supabase
      .from('vehicle_spec_enhancements')
      .upsert(enhancementRecords, {
        onConflict: 'vehicle_id,category',
        ignoreDuplicates: false
      })

    if (insertError) {
      console.error('❌ Failed to initialize enhancement records:', insertError)
      return res.status(500).json({ error: 'Failed to initialize spec enhancement' })
    }

    // Process SYNCHRONOUSLY - critical for serverless environments
    // The extended maxDuration config prevents timeout
    console.log(`🔄 Processing specs synchronously for vehicle ${vehicleId}`)
    
    // Add timeout protection: kill job after 25 seconds
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Spec enhancement timeout after 25 seconds')), 25000)
    })
    
    await Promise.race([
      processVehicleSpecs(vehicleId, vehicle),
      timeoutPromise
    ])

    // Get final status after processing completes
    const { data: finalStatus } = await supabase
      .from('vehicles')
      .select('specs_enhancement_status, specs_categories_completed')
      .eq('id', vehicleId)
      .single()

    return res.status(200).json({
      success: true,
      message: 'Spec enhancement completed',
      status: finalStatus?.specs_enhancement_status,
      categories_completed: finalStatus?.specs_categories_completed,
      total_categories: CATEGORIES.length
    })
  } catch (error) {
    console.error('❌ Spec enhancement error:', error)
    
    // Mark as failed in database
    await supabase
      .from('vehicles')
      .update({ specs_enhancement_status: 'failed' })
      .eq('id', vehicleId)
    
    return res.status(500).json({ 
      error: 'Failed to enhance specifications',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

// Background processing function
async function processVehicleSpecs(
  vehicleId: string,
  vehicle: { year: number; make: string; model: string; trim?: string; vin?: string }
) {
  console.log(`🚀 Starting spec enhancement for vehicle ${vehicleId}`)

  // Validate minimum required data
  if (!vehicle.year || !vehicle.make || !vehicle.model) {
    console.error('❌ Missing required vehicle data (year/make/model)')
    await markAllCategoriesFailed(vehicleId, 'Missing required vehicle data')
    return
  }

  // Process each category SEQUENTIALLY
  // MVP: NHTSA-only (no delays needed, fast processing)
  for (const category of CATEGORIES) {
    await processCategory(vehicleId, vehicle, category)
  }

  // Update vehicle status once at the end
  await finalizeVehicleStatus(vehicleId)

  console.log(`✅ Spec enhancement completed for vehicle ${vehicleId}`)
}

async function markAllCategoriesFailed(vehicleId: string, error: string) {
  await supabase
    .from('vehicle_spec_enhancements')
    .update({
      status: 'failed',
      error,
      completed_at: new Date().toISOString()
    })
    .eq('vehicle_id', vehicleId)
}

async function finalizeVehicleStatus(vehicleId: string) {
  const { data: categories } = await supabase
    .from('vehicle_spec_enhancements')
    .select('status')
    .eq('vehicle_id', vehicleId)

  const completed = categories?.filter(c => c.status === 'completed').length || 0
  const failed = categories?.filter(c => c.status === 'failed').length || 0
  const total = categories?.length || 0

  let overallStatus = 'completed'
  if (failed === total) overallStatus = 'failed'
  else if (completed < total) overallStatus = 'partial'

  await supabase
    .from('vehicles')
    .update({
      specs_enhancement_status: overallStatus,
      specs_categories_completed: completed,
      specs_last_enhanced: new Date().toISOString()
    })
    .eq('id', vehicleId)
}

async function processCategory(
  vehicleId: string,
  vehicle: { year: number; make: string; model: string; trim?: string; vin?: string },
  category: Category
) {
  try {
    // Mark as processing
    await supabase
      .from('vehicle_spec_enhancements')
      .update({
        status: 'processing',
        processing_started_at: new Date().toISOString()
      })
      .eq('vehicle_id', vehicleId)
      .eq('category', category)

    console.log(`🔄 Processing ${category} for ${vehicle.year} ${vehicle.make} ${vehicle.model}`)

    // MVP: NHTSA-only (no OpenAI calls for fast processing)
    // TODO: Add OpenAI enhancement via Supabase Edge Function for missing fields
    //       This will require async processing with status polling
    const nhtsaData = await fetchNHTSAData(vehicle, category)
    
    // Use NHTSA data as-is (no AI enhancement for MVP)
    const finalData = nhtsaData
    const sources = ['nhtsa']
    const confidence: 'high' | 'medium' | 'low' = nhtsaData ? 'high' : 'low'

    // Mark as completed
    await supabase
      .from('vehicle_spec_enhancements')
      .update({
        status: 'completed',
        data: finalData,
        sources,
        confidence,
        completed_at: new Date().toISOString()
      })
      .eq('vehicle_id', vehicleId)
      .eq('category', category)

    console.log(`✅ Completed ${category} (confidence: ${confidence})`)
  } catch (error) {
    console.error(`❌ Failed to process ${category}:`, error)
    
    await supabase
      .from('vehicle_spec_enhancements')
      .update({
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        completed_at: new Date().toISOString()
      })
      .eq('vehicle_id', vehicleId)
      .eq('category', category)
  }
}

async function fetchNHTSAData(
  vehicle: { year: number; make: string; model: string; vin?: string },
  category: Category
): Promise<any> {
  try {
    let url: string
    let fallbackToManual = false

    // Prefer VIN decode if available (most accurate)
    if (vehicle.vin) {
      url = `https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${vehicle.vin}?format=json`
    } else {
      // Fallback to year/make/model query
      url = `https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMakeYear/make/${encodeURIComponent(vehicle.make)}/modelyear/${vehicle.year}?format=json`
      fallbackToManual = true
    }

    // Add timeout protection (10 seconds)
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'MotoMindAI/1.0 (vehicle management)'
      }
    })

    clearTimeout(timeout)

    if (!response.ok) {
      console.warn(`⚠️ NHTSA API returned ${response.status} for ${url}`)
      return null // Return null to trigger AI-only fallback
    }

    const data = await response.json()
    
    if (!data.Results || data.Results.length === 0) {
      console.warn(`⚠️ NHTSA API returned no results`)
      return null
    }

    return extractCategoryData(data.Results, category)
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('❌ NHTSA API timeout after 10 seconds')
    } else {
      console.error('❌ NHTSA API error:', error)
    }
    // Return null to proceed with AI-only enhancement
    return null
  }
}

function extractCategoryData(nhtsaResults: any[], category: Category): any {
  const getValue = (variableName: string) => {
    const item = nhtsaResults.find((r: any) => r.Variable === variableName)
    return item?.Value || null
  }

  switch (category) {
    case 'engine':
      return {
        displacement: getValue('Displacement (L)'),
        cylinders: parseInt(getValue('Engine Number of Cylinders')) || null,
        configuration: getValue('Engine Configuration'),
        fuel_type: getValue('Fuel Type - Primary'),
        horsepower: parseInt(getValue('Engine Brake Horsepower (BHP)')) || null,
        torque: null // NHTSA doesn't provide this
      }

    case 'drivetrain':
      return {
        drive_type: getValue('Drive Type'),
        transmission_type: getValue('Transmission Style'),
        transmission_speeds: getValue('Transmission Speeds')
      }

    case 'dimensions':
      return {
        wheelbase: getValue('Wheelbase (inches)'),
        length: getValue('Overall Length (inches)'),
        width: getValue('Overall Width (inches)'),
        height: getValue('Overall Height (inches)'),
        curb_weight: getValue('Curb Weight (pounds)'),
        gross_vehicle_weight: getValue('Gross Vehicle Weight Rating (GVWR)')
      }

    case 'fuel_economy':
      return {
        city_mpg: null, // Requires separate EPA API
        highway_mpg: null,
        combined_mpg: null
      }

    case 'safety':
      return {
        airbag_locations: getValue('Air Bag Locations'),
        abs: getValue('ABS'),
        traction_control: getValue('Traction Control'),
        electronic_stability_control: getValue('Electronic Stability Control (ESC)')
      }

    case 'features':
      return {
        body_class: getValue('Body Class'),
        doors: parseInt(getValue('Doors')) || null,
        seats: getValue('Seating Capacity')
      }

    default:
      return {}
  }
}

function hasDataGaps(data: any, category: Category): boolean {
  const values = Object.values(data)
  const nullCount = values.filter(v => v === null || v === '').length
  return nullCount > values.length * 0.3 // More than 30% missing
}

async function enhanceWithAI(
  vehicle: { year: number; make: string; model: string; trim?: string },
  category: Category,
  existingData: any
): Promise<any> {
  const vehicleDesc = `${vehicle.year} ${vehicle.make} ${vehicle.model}${vehicle.trim ? ` ${vehicle.trim}` : ''}`
  
  // Define strict schema per category
  const schemas = {
    engine: {
      displacement: 'number (in liters, e.g., 5.3)',
      cylinders: 'number (e.g., 8)',
      configuration: 'string (e.g., "V8", "Inline-4")',
      fuel_type: 'string (e.g., "Gasoline", "Diesel")',
      horsepower: 'number (HP at RPM, e.g., 355)',
      torque: 'number (lb-ft at RPM, e.g., 383)'
    },
    drivetrain: {
      drive_type: 'string ("FWD", "RWD", "AWD", "4WD")',
      transmission_type: 'string (e.g., "Automatic", "Manual")',
      transmission_speeds: 'string (e.g., "10-Speed Automatic")'
    },
    dimensions: {
      wheelbase: 'number (inches)',
      length: 'number (inches)',
      width: 'number (inches)',
      height: 'number (inches)',
      curb_weight: 'number (pounds)',
      gross_vehicle_weight: 'number (pounds)'
    },
    fuel_economy: {
      city_mpg: 'number (EPA rating)',
      highway_mpg: 'number (EPA rating)',
      combined_mpg: 'number (EPA rating)'
    },
    safety: {
      airbag_locations: 'string (e.g., "Front, Side, Curtain")',
      abs: 'boolean',
      traction_control: 'boolean',
      electronic_stability_control: 'boolean',
      crash_rating_overall: 'number (NHTSA stars, 1-5)'
    },
    features: {
      body_class: 'string (e.g., "SUV", "Sedan")',
      doors: 'number',
      seats: 'number',
      cargo_volume: 'number (cubic feet)'
    }
  }

  const schemaStr = JSON.stringify(schemas[category], null, 2)
  
  const prompt = `You are filling missing vehicle specification data for: ${vehicleDesc}

EXISTING DATA (from NHTSA):
${JSON.stringify(existingData, null, 2)}

YOUR TASK:
Fill in ONLY the fields that are null or missing. Use manufacturer specifications or reliable automotive databases.

OUTPUT FORMAT (strict JSON schema):
${schemaStr}

RULES:
- Use consistent units (see schema)
- Numbers must be numeric types, not strings
- If you cannot find reliable data for a field, omit it entirely
- Do NOT guess or estimate - omit if uncertain
- Return ONLY valid JSON matching the schema above`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a vehicle specification expert. Provide accurate, verified data only from manufacturer specs or reliable automotive databases. Output valid JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1, // Low temperature for factual accuracy
      response_format: { type: 'json_object' }
    })

    const aiResponse = completion.choices[0].message.content || '{}'
    return JSON.parse(aiResponse)
  } catch (error) {
    console.error('❌ OpenAI API error:', error)
    return {} // Return empty object to avoid breaking the flow
  }
}

function mergeData(nhtsaData: any, aiData: any): any {
  // NHTSA data takes precedence, AI fills gaps
  const merged = { ...nhtsaData }
  
  for (const [key, value] of Object.entries(aiData)) {
    if (merged[key] === null || merged[key] === '' || merged[key] === undefined) {
      merged[key] = value
    }
  }
  
  return merged
}

function crossValidate(nhtsaData: any, aiData: any): {
  confidence: 'high' | 'medium' | 'low'
  conflicts: string[]
} {
  const conflicts: string[] = []
  
  for (const [key, nhtsaValue] of Object.entries(nhtsaData)) {
    if (!nhtsaValue || !aiData[key]) continue
    
    // Normalize values before comparison
    const normalizedNHTSA = normalizeValue(nhtsaValue, key)
    const normalizedAI = normalizeValue(aiData[key], key)
    
    // Compare normalized values with tolerance for numeric fields
    if (typeof normalizedNHTSA === 'number' && typeof normalizedAI === 'number') {
      // Allow 5% tolerance for numeric values (handles rounding differences)
      const tolerance = Math.abs(normalizedNHTSA * 0.05)
      if (Math.abs(normalizedNHTSA - normalizedAI) > tolerance) {
        conflicts.push(`${key}: NHTSA=${normalizedNHTSA} vs AI=${normalizedAI}`)
      }
    } else if (normalizedNHTSA !== normalizedAI) {
      // Exact match required for strings/booleans
      conflicts.push(`${key}: NHTSA="${normalizedNHTSA}" vs AI="${normalizedAI}"`)
    }
  }
  
  // Determine confidence based on conflicts
  if (conflicts.length === 0) {
    return { confidence: 'high', conflicts }
  } else if (conflicts.length <= 2) {
    return { confidence: 'medium', conflicts }
  } else {
    return { confidence: 'low', conflicts }
  }
}

function normalizeValue(value: any, key: string): any {
  if (typeof value === 'number') return value
  if (typeof value === 'boolean') return value
  if (typeof value !== 'string') return value

  const str = value.toLowerCase().trim()

  // Normalize displacement (5.3L, 5300cc, 5.3 liter → 5.3)
  if (key.includes('displacement')) {
    const liters = str.match(/(\d+\.?\d*)\s*l/i)
    if (liters) return parseFloat(liters[1])
    const cc = str.match(/(\d+)\s*cc/i)
    if (cc) return parseFloat(cc[1]) / 1000 // Convert cc to liters
  }

  // Normalize drive type (4WD = 4x4 = Four Wheel Drive)
  if (key.includes('drive')) {
    if (str.includes('4wd') || str.includes('4x4') || str.includes('four wheel')) return '4WD'
    if (str.includes('awd') || str.includes('all wheel')) return 'AWD'
    if (str.includes('fwd') || str.includes('front wheel')) return 'FWD'
    if (str.includes('rwd') || str.includes('rear wheel')) return 'RWD'
  }

  // Normalize fuel type
  if (key.includes('fuel')) {
    if (str.includes('gas') || str.includes('petrol')) return 'Gasoline'
    if (str.includes('diesel')) return 'Diesel'
    if (str.includes('electric') || str.includes('ev')) return 'Electric'
    if (str.includes('hybrid')) return 'Hybrid'
  }

  return str
}
