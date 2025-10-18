/**
 * VIN Decoder Service
 * Decodes VIN using NHTSA API + OpenAI insights
 */

import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import type { VINDecodeResult, NHTSAResponse, NHTSAResult } from './types'
import { isValidVINFormat } from './validator'
import { getSupabase } from '@/lib/supabase/client'
import {
  normalizeManufacturer,
  normalizeCountry,
  normalizeDriveType,
  normalizeBodyType,
  normalizeFuelType,
  normalizeTransmission,
  normalizeDisplacement,
  normalizeHorsepower,
  normalizeDoors,
  normalizeTransmissionSpeeds,
  normalizeSafetyFeature,
  formatLocation
} from './normalizer'

// Lazy initialization to avoid env var issues during module load
let supabase: ReturnType<typeof createClient>
let openai: OpenAI

function getSupabase() {
  if (!supabase) {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required in .env.local')
    }
    supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
  }
  return supabase
}

function getOpenAI() {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY required in .env.local')
    }
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })
  }
  return openai
}

/**
 * Decode VIN and return complete vehicle data
 * Uses cache-first strategy to avoid redundant API calls
 */
export async function decodeVIN(vinInput: string): Promise<VINDecodeResult> {
  // 1. Sanitize and validate
  const vin = sanitizeVIN(vinInput)
  
  if (!isValidVIN(vin)) {
    throw new Error('Invalid VIN format. VIN must be 17 alphanumeric characters.')
  }

  console.log('[VIN/Decoder] Decoding VIN:', vin)

  // 2. Check cache first
  const cached = await checkCache(vin)
  if (cached) {
    console.log('[VIN/Decoder] Cache hit!')
    return cached
  }

  console.log('[VIN/Decoder] Cache miss, calling NHTSA API...')

  // 3. Decode via NHTSA API (FREE!)
  const nhtsaData = await fetchNHTSAData(vin)

  // 4. Parse NHTSA response (Extended endpoint - 180+ variables!)
  const results = nhtsaData.Results
  
  // Basic vehicle info
  const year = parseInt(getValue(results, 'Model Year') || '0')
  const make = getValue(results, 'Make')
  const model = getValue(results, 'Model')
  
  // Trim can be in MANY places - check them all!
  const trim = extractTrim(results)
  
  const bodyType = getValue(results, 'Body Class')
  
  // Engine & drivetrain
  const engine = getValue(results, 'Engine Model') || getValue(results, 'Engine Number of Cylinders')
  const engineCylinders = getValue(results, 'Engine Number of Cylinders')
  const engineDisplacement = getValue(results, 'Displacement (L)')
  const engineHP = getValue(results, 'Engine Brake (hp) From')
  const transmission = getValue(results, 'Transmission Style')
  const transmissionSpeeds = getValue(results, 'Transmission Speeds')
  const driveType = getValue(results, 'Drive Type')
  
  // Fuel & efficiency
  const fuelType = getValue(results, 'Fuel Type - Primary')
  const fuelTypeSecondary = getValue(results, 'Fuel Type - Secondary')
  
  // Safety features (Extended data!)
  const absType = getValue(results, 'ABS')
  const airBagLocations = getValue(results, 'Air Bag Loc (Front)')
  const electronicStabilityControl = getValue(results, 'Electronic Stability Control (ESC)')
  const tractionControl = getValue(results, 'Traction Control')
  const blindSpotWarning = getValue(results, 'Blind Spot Warning (BSW)')
  const forwardCollisionWarning = getValue(results, 'Forward Collision Warning (FCW)')
  const laneDepartureWarning = getValue(results, 'Lane Departure Warning (LDW)')
  const parkAssist = getValue(results, 'Park Assist')
  const rearVisibilitySystem = getValue(results, 'Rear Visibility System')
  
  // Vehicle specs
  const doors = getValue(results, 'Doors')
  const seats = getValue(results, 'Seat Rows')
  const wheelbase = getValue(results, 'Wheelbase (inches)')
  const gvwr = getValue(results, 'Gross Vehicle Weight Rating From')
  
  // Manufacturing
  const plantCountry = getValue(results, 'Plant Country')
  const plantCity = getValue(results, 'Plant City')
  const plantState = getValue(results, 'Plant State')
  const manufacturer = getValue(results, 'Manufacturer Name')

  // Validate we got minimum required data
  if (!year || !make || !model) {
    throw new Error('Could not decode VIN. NHTSA returned incomplete data.')
  }

  console.log('[VIN/Decoder] Decoded:', { year, make, model, trim })

  // 5. Generate display name
  const displayName = buildDisplayName({ year, make, model, trim, bodyType })

  // 6. Generate mock enrichment data (until real databases purchased)
  const mockData = generateMockData(year, make, model)

  // 7. Generate AI insights
  console.log('[VIN/Decoder] Generating AI insights...')
  const aiInsights = await generateAIInsights({
    year,
    make,
    model,
    trim,
    bodyType,
    engine,
    fuelType,
    mockData
  })

  // 8. Build result with normalized data
  const result: VINDecodeResult = {
    vin,
    vehicle: { year, make, model, trim, displayName },
    specs: {
      bodyType: normalizeBodyType(bodyType),
      engine,
      transmission: normalizeTransmission(transmission),
      driveType: normalizeDriveType(driveType),
      fuelType: normalizeFuelType(fuelType)
    },
    extendedSpecs: {
      // Engine details (normalized)
      engineCylinders,
      engineDisplacement: normalizeDisplacement(engineDisplacement),
      engineHP: normalizeHorsepower(engineHP),
      transmissionSpeeds: normalizeTransmissionSpeeds(transmissionSpeeds),
      fuelTypeSecondary: normalizeFuelType(fuelTypeSecondary),
      // Safety features (normalized)
      absType: normalizeSafetyFeature(absType),
      airBagLocations: normalizeSafetyFeature(airBagLocations),
      electronicStabilityControl: normalizeSafetyFeature(electronicStabilityControl),
      tractionControl: normalizeSafetyFeature(tractionControl),
      blindSpotWarning: normalizeSafetyFeature(blindSpotWarning),
      forwardCollisionWarning: normalizeSafetyFeature(forwardCollisionWarning),
      laneDepartureWarning: normalizeSafetyFeature(laneDepartureWarning),
      parkAssist: normalizeSafetyFeature(parkAssist),
      rearVisibilitySystem: normalizeSafetyFeature(rearVisibilitySystem),
      // Vehicle specs
      doors: normalizeDoors(doors),
      seats,
      wheelbase,
      gvwr,
      // Manufacturing (normalized)
      plantCountry: normalizeCountry(plantCountry),
      plantCity: titleCase(plantCity || ''),
      plantState: plantState?.toUpperCase(),
      manufacturer: normalizeManufacturer(manufacturer),
      // Formatted location
      location: formatLocation(plantCity, plantState, plantCountry)
    },
    mockData,
    aiInsights
  }

  // 9. Cache result
  console.log('[VIN/Decoder] Caching result...')
  await cacheResult(vin, result, nhtsaData)

  console.log('[VIN/Decoder] ✅ Decode complete!')
  return result
}

/**
 * Fetch data from NHTSA API (Extended endpoint for maximum data)
 */
async function fetchNHTSAData(vin: string): Promise<NHTSAResponse> {
  // Use DecodeVinExtended for 180+ variables instead of basic 140
  const url = `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinExtended/${vin}?format=json`
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'MotoMind/1.0',
    },
  })

  if (!response.ok) {
    throw new Error(`NHTSA API error: ${response.status} ${response.statusText}`)
  }

  const data: NHTSAResponse = await response.json()
  
  // Check if NHTSA returned any errors
  if (data.Message && data.Message.includes('error')) {
    throw new Error(`NHTSA error: ${data.Message}`)
  }

  return data
}

/**
 * Extract value from NHTSA results by variable name
 */
function getValue(results: NHTSAResult[], variable: string): string {
  const item = results.find(r => r.Variable === variable)
  return item?.Value || ''
}

/**
 * Extract trim from multiple possible NHTSA fields
 * Trim can appear in various places depending on manufacturer
 */
function extractTrim(results: NHTSAResult[]): string | undefined {
  // Check all possible trim fields (ordered by priority)
  const trimFields = [
    'Trim',           // Primary trim level (e.g., "XLT", "Limited", "Sport")
    'Trim2',          // Secondary trim level
    'Series',         // Model series (e.g., "SuperCrew", "King Ranch")
    'Series2',        // Secondary series
    'Cab Type',       // For trucks: "Crew Cab", "Extended Cab", etc.
  ]
  
  // Generic vehicle categories to EXCLUDE (these aren't trim levels)
  const excludeValues = [
    'Not Applicable',
    'TRUCK',
    'PASSENGER CAR',
    'MPV',
    'SUV',
    'SEDAN',
    'COUPE',
    'WAGON',
    'HATCHBACK',
    'VAN',
    'BUS',
    'TRAILER',
    'MOTORCYCLE',
    'INCOMPLETE VEHICLE',
    ''
  ]
  
  const trimParts: string[] = []
  
  for (const field of trimFields) {
    const value = getValue(results, field)
    
    // Only add if:
    // 1. Not empty
    // 2. Not in exclude list
    // 3. Not already added
    if (value && 
        !excludeValues.includes(value.toUpperCase()) && 
        !trimParts.includes(value)) {
      trimParts.push(value)
    }
  }
  
  // Combine trim parts or return undefined if none found
  return trimParts.length > 0 ? trimParts.join(' ') : undefined
}

/**
 * Build human-readable display name
 * Cleans up redundant/generic terms for better presentation
 */
function buildDisplayName(data: {
  year: number
  make: string
  model: string
  trim?: string
  bodyType?: string
}): string {
  const parts = [
    data.year,
    titleCase(data.make),
    data.model
  ]

  // Clean and add trim if present
  if (data.trim) {
    const cleanTrim = data.trim
      .replace(/Not Applicable/gi, '')
      .replace(/Sedan\/Saloon/gi, '')
      .replace(/Hatchback\/Liftback\/Notchback/gi, 'Hatchback')
      .replace(/Sport Utility Vehicle \(SUV\)\/Multi-Purpose Vehicle \(MPV\)/gi, '')
      .trim()
    
    if (cleanTrim) {
      parts.push(cleanTrim)
    }
  }

  // Add body type only if not redundant with trim
  if (data.bodyType && !data.trim?.includes(data.bodyType)) {
    const cleanBodyType = data.bodyType
      .replace(/Hatchback\/Liftback\/Notchback/gi, 'Hatchback')
      .replace(/Sport Utility Vehicle \(SUV\)\/Multi-Purpose Vehicle \(MPV\)/gi, 'SUV/MPV')
    parts.push(cleanBodyType)
  }

  return parts.join(' ')
}

/**
 * Convert string to title case
 */
function titleCase(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Generate mock enrichment data
 * Uses simple heuristics until real databases are purchased
 */
function generateMockData(year: number, make: string, model: string) {
  const makeModel = `${make} ${model}`.toLowerCase()
  
  // Vehicle type detection
  const isTruck = /truck|f-150|silverado|ram|tundra|tacoma/i.test(makeModel)
  const isSUV = /suv|explorer|tahoe|suburban|highlander|pilot/i.test(makeModel)
  const isEV = /tesla|leaf|bolt|i-pace|e-tron|mach-e|model [3sy]/i.test(makeModel)
  const isHybrid = /prius|insight|accord hybrid|camry hybrid/i.test(makeModel)
  const isLuxury = /bmw|mercedes|audi|lexus|porsche|jaguar|cadillac/i.test(make.toLowerCase())
  const isEconomy = /civic|corolla|elantra|sentra|versa|yaris/i.test(model.toLowerCase())
  
  // Determine age
  const currentYear = new Date().getFullYear()
  const age = currentYear - year
  const isNew = age <= 3
  const isOld = age > 10

  // MPG estimates
  let mpgCity: number
  let mpgHighway: number
  
  if (isEV) {
    mpgCity = 0  // EVs don't use gas
    mpgHighway = 0
  } else if (isHybrid) {
    mpgCity = 50
    mpgHighway = 52
  } else if (isTruck) {
    mpgCity = 16
    mpgHighway = 22
  } else if (isSUV) {
    mpgCity = 20
    mpgHighway = 26
  } else if (isEconomy) {
    mpgCity = 30
    mpgHighway = 38
  } else {
    mpgCity = 25
    mpgHighway = 32
  }

  // Maintenance interval (miles between services)
  let maintenanceInterval: number
  if (isEV) {
    maintenanceInterval = 12000 // EVs need less frequent service
  } else if (isNew) {
    maintenanceInterval = 7500
  } else {
    maintenanceInterval = 5000
  }

  // Annual maintenance cost estimate
  let annualCost: number
  if (isEV) {
    annualCost = 400 // EVs are cheaper to maintain
  } else if (isLuxury) {
    annualCost = 1800
  } else if (isTruck || isSUV) {
    annualCost = 1200
  } else if (isOld) {
    annualCost = 1400 // Older cars cost more
  } else if (isEconomy) {
    annualCost = 600
  } else {
    annualCost = 900
  }

  return {
    mpgCity,
    mpgHighway,
    maintenanceInterval,
    annualCost
  }
}

/**
 * Generate AI insights using OpenAI
 */
async function generateAIInsights(data: {
  year: number
  make: string
  model: string
  trim?: string
  bodyType?: string
  engine?: string
  fuelType?: string
  mockData: {
    mpgCity: number
    mpgHighway: number
    maintenanceInterval: number
    annualCost: number
  }
}): Promise<{
  summary: string
  reliabilityScore: number
  maintenanceTip: string
  costTip: string
}> {
  const vehicleName = `${data.year} ${data.make} ${data.model}${data.trim ? ' ' + data.trim : ''}`
  
  const prompt = `You are an automotive expert AI analyzing this vehicle for a maintenance tracking app.

Vehicle: ${vehicleName}
Body Type: ${data.bodyType || 'Unknown'}
Engine: ${data.engine || 'Unknown'}
Fuel Type: ${data.fuelType || 'Unknown'}

Estimated data:
- MPG: ${data.mockData.mpgCity} city / ${data.mockData.mpgHighway} highway
- Service interval: Every ${data.mockData.maintenanceInterval} miles
- Annual maintenance cost: $${data.mockData.annualCost}

Generate a JSON response with:
{
  "summary": "2 concise sentences about this vehicle's reliability and value proposition",
  "reliabilityScore": 0.75,
  "maintenanceTip": "1 specific sentence about maintenance priorities for this vehicle",
  "costTip": "1 specific sentence about how to save money maintaining this vehicle"
}

Guidelines:
- Be positive but realistic
- Reliability score: 0.0 (poor) to 1.0 (excellent)
- Focus on actionable advice
- Keep it concise and helpful`

  try {
    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 400
    })

    const content = response.choices[0].message.content
    if (!content) {
      throw new Error('No content from OpenAI')
    }

    const insights = JSON.parse(content)
    
    // Validate structure
    if (!insights.summary || !insights.maintenanceTip || !insights.costTip) {
      throw new Error('Invalid OpenAI response structure')
    }

    // Ensure reliability score is in valid range
    insights.reliabilityScore = Math.max(0, Math.min(1, insights.reliabilityScore))

    return insights
  } catch (error) {
    console.error('[VIN/Decoder] OpenAI error:', error)
    
    // Fallback to generic insights if OpenAI fails
    return {
      summary: `The ${vehicleName} is a reliable vehicle with estimated annual maintenance costs of $${data.mockData.annualCost}. Following the recommended ${data.mockData.maintenanceInterval}-mile service interval will help maintain its value.`,
      reliabilityScore: 0.75,
      maintenanceTip: `Follow the ${data.mockData.maintenanceInterval}-mile service interval to prevent major issues.`,
      costTip: `Regular maintenance can help you avoid costly repairs and maintain resale value.`
    }
  }
}

/**
 * Check cache for existing VIN data
 */
async function checkCache(vin: string): Promise<VINDecodeResult | null> {
  const { data, error } = await getSupabase()
    .from('vin_decode_cache')
    .select('*')
    .eq('vin', vin)
    .single()

  if (error || !data) {
    return null
  }

  // Reconstruct result from cache (including extended specs if available)
  const rawData = data.raw_data as any
  
  return {
    vin: data.vin,
    vehicle: {
      year: data.year,
      make: data.make,
      model: data.model,
      trim: data.trim || undefined,
      displayName: data.display_name
    },
    specs: {
      bodyType: data.body_type || undefined,
      engine: data.engine || undefined,
      transmission: data.transmission || undefined,
      driveType: data.drive_type || undefined,
      fuelType: data.fuel_type || undefined
    },
    extendedSpecs: rawData ? extractExtendedFromRaw(rawData.Results || []) : undefined,
    mockData: {
      mpgCity: data.mock_mpg_city || 0,
      mpgHighway: data.mock_mpg_highway || 0,
      maintenanceInterval: data.mock_maintenance_interval || 5000,
      annualCost: data.mock_annual_cost || 800
    },
    aiInsights: {
      summary: data.ai_summary || '',
      reliabilityScore: parseFloat(data.ai_reliability_score || '0.75'),
      maintenanceTip: data.ai_maintenance_tip || '',
      costTip: data.ai_cost_tip || ''
    }
  }
}

/**
 * Extract extended specs from raw NHTSA results
 */
function extractExtendedFromRaw(results: NHTSAResult[]) {
  return {
    engineCylinders: getValue(results, 'Engine Number of Cylinders'),
    engineDisplacement: getValue(results, 'Displacement (L)'),
    engineHP: getValue(results, 'Engine Brake (hp) From'),
    transmissionSpeeds: getValue(results, 'Transmission Speeds'),
    fuelTypeSecondary: getValue(results, 'Fuel Type - Secondary'),
    absType: getValue(results, 'ABS'),
    airBagLocations: getValue(results, 'Air Bag Loc (Front)'),
    electronicStabilityControl: getValue(results, 'Electronic Stability Control (ESC)'),
    tractionControl: getValue(results, 'Traction Control'),
    blindSpotWarning: getValue(results, 'Blind Spot Warning (BSW)'),
    forwardCollisionWarning: getValue(results, 'Forward Collision Warning (FCW)'),
    laneDepartureWarning: getValue(results, 'Lane Departure Warning (LDW)'),
    parkAssist: getValue(results, 'Park Assist'),
    rearVisibilitySystem: getValue(results, 'Rear Visibility System'),
    doors: getValue(results, 'Doors'),
    seats: getValue(results, 'Seat Rows'),
    wheelbase: getValue(results, 'Wheelbase (inches)'),
    gvwr: getValue(results, 'Gross Vehicle Weight Rating From'),
    plantCountry: getValue(results, 'Plant Country'),
    plantCity: getValue(results, 'Plant City'),
    plantState: getValue(results, 'Plant State'),
    manufacturer: getValue(results, 'Manufacturer Name')
  }
}

/**
 * Cache decoded VIN result
 */
async function cacheResult(
  vin: string,
  result: VINDecodeResult,
  rawData: NHTSAResponse
): Promise<void> {
  const { error } = await getSupabase().from('vin_decode_cache').insert({
    vin,
    year: result.vehicle.year,
    make: result.vehicle.make,
    model: result.vehicle.model,
    trim: result.vehicle.trim || null,
    body_type: result.specs.bodyType || null,
    engine: result.specs.engine || null,
    transmission: result.specs.transmission || null,
    drive_type: result.specs.driveType || null,
    fuel_type: result.specs.fuelType || null,
    display_name: result.vehicle.displayName,
    mock_mpg_city: result.mockData.mpgCity,
    mock_mpg_highway: result.mockData.mpgHighway,
    mock_maintenance_interval: result.mockData.maintenanceInterval,
    mock_annual_cost: result.mockData.annualCost,
    ai_summary: result.aiInsights.summary,
    ai_reliability_score: result.aiInsights.reliabilityScore,
    ai_maintenance_tip: result.aiInsights.maintenanceTip,
    ai_cost_tip: result.aiInsights.costTip,
    source: 'nhtsa',
    raw_data: rawData
  })

  if (error) {
    console.error('[VIN/Decoder] Failed to cache result:', error)
    // Don't throw - cache failure shouldn't break the decode
  }
}
