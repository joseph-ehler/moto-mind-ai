/**
 * VIN Decoder Service
 * Decodes VIN using NHTSA API + OpenAI insights
 */

import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import type { VINDecodeResult, NHTSAResponse, NHTSAResult } from './types'
import { isValidVINFormat, isValidVIN, sanitizeVIN } from './validator'
import { getSupabaseClient } from '@/lib/supabase/client'
import { getFuelEconomy } from '@/lib/epa/fuel-economy'
import { checkRecalls } from '@/lib/recalls/nhtsa-recalls'
import {
  normalizeManufacturer,
  normalizeCountry,
  normalizeDriveType,
  normalizeBodyType,
  normalizeFuelType,
  normalizeTransmission,
  normalizeEngine,
  normalizeDisplacement,
  normalizeHorsepower,
  normalizeDoors,
  normalizeTransmissionSpeeds,
  normalizeSafetyFeature,
  formatLocation
} from './normalizer'
import { ResilientFetch } from '../utils/resilient-fetch'
import { VINCache } from '../cache/vin-cache'
import { validateNHTSAResponse } from './schemas'

// Lazy initialization for OpenAI only
let openai: OpenAI

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

  // 4. Parse NHTSA response (Flat format - direct property access!)
  // Now nhtsaData has all 144 fields as properties!
  
  // Basic vehicle info
  const year = parseInt(nhtsaData.ModelYear || '0')
  const make = nhtsaData.Make || ''
  const model = nhtsaData.Model || ''
  const trim = nhtsaData.Trim || ''
  const trim2 = nhtsaData.Trim2 || ''
  const series = nhtsaData.Series || ''
  const series2 = nhtsaData.Series2 || ''
  const bodyType = nhtsaData.BodyClass || ''
  
  // Engine & drivetrain
  const engine = nhtsaData.EngineModel || nhtsaData.EngineCylinders || ''
  const engineCylinders = nhtsaData.EngineCylinders || ''
  const engineDisplacement = nhtsaData.DisplacementL || ''
  const engineDisplacementCC = nhtsaData.DisplacementCC || ''
  const engineDisplacementCI = nhtsaData.DisplacementCI || ''
  const engineHP = nhtsaData.EngineHP || ''
  const engineHPTo = nhtsaData.EngineHP_to || ''
  const engineKW = nhtsaData.EngineKW || ''
  const engineConfig = nhtsaData.EngineConfiguration || ''
  const valveTrain = nhtsaData.ValveTrainDesign || ''
  const coolingType = nhtsaData.CoolingType || ''
  const fuelInjectionType = nhtsaData.FuelInjectionType || ''
  const turbo = nhtsaData.Turbo || ''
  const topSpeed = nhtsaData.TopSpeedMPH || ''
  const engineManufacturer = nhtsaData.EngineManufacturer || ''
  const transmission = nhtsaData.TransmissionStyle || ''
  const transmissionSpeeds = nhtsaData.TransmissionSpeeds || ''
  const driveType = nhtsaData.DriveType || ''
  
  // Fuel & efficiency
  const fuelType = nhtsaData.FuelTypePrimary || ''
  const fuelTypeSecondary = nhtsaData.FuelTypeSecondary || ''
  const electrificationLevel = nhtsaData.ElectrificationLevel || ''
  
  // Safety features (ALL safety fields!)
  const absType = nhtsaData.ABS || ''
  const airBagLocFront = nhtsaData.AirBagLocFront || ''
  const airBagLocSide = nhtsaData.AirBagLocSide || ''
  const airBagLocCurtain = nhtsaData.AirBagLocCurtain || ''
  const airBagLocKnee = nhtsaData.AirBagLocKnee || ''
  const electronicStabilityControl = nhtsaData.ESC || ''
  const tractionControl = nhtsaData.TractionControl || ''
  const blindSpotWarning = nhtsaData.BlindSpotMon || ''
  const forwardCollisionWarning = nhtsaData.ForwardCollisionWarning || ''
  const laneDepartureWarning = nhtsaData.LaneDepartureWarning || ''
  const parkAssist = nhtsaData.ParkAssist || ''
  const backupCamera = nhtsaData.BackupCamera || ''
  const adaptiveCruiseControl = nhtsaData.AdaptiveCruiseControl || ''
  const brakeSystemType = nhtsaData.BrakeSystemType || ''
  const tpmsType = nhtsaData.TPMS || ''
  const autoReverseSystem = nhtsaData.AutoReverseSystem || ''
  const keylessIgnition = nhtsaData.KeylessIgnition || ''
  const laneCenteringAssistance = nhtsaData.LaneCenteringAssistance || ''
  const blindSpotIntervention = nhtsaData.BlindSpotIntervention || ''
  const rearCrossTrafficAlert = nhtsaData.RearCrossTrafficAlert || ''
  const pedestrianAEB = nhtsaData.PedestrianAutomaticEmergencyBraking || ''
  const dynamicBrakeSupport = nhtsaData.DynamicBrakeSupport || ''
  const crashImminentBraking = nhtsaData.CIB || ''
  const laneKeepingAssist = nhtsaData.LaneKeepSystem || ''
  const rearAutoEmergencyBraking = nhtsaData.RearAutomaticEmergencyBraking || ''
  const eventDataRecorder = nhtsaData.EDR || ''
  const saeAutomationLevel = nhtsaData.SAEAutomationLevel || ''
  const automaticCrashNotification = nhtsaData.CAN_AACN || ''
  const daytimeRunningLight = nhtsaData.DaytimeRunningLight || ''
  const headlampLightSource = nhtsaData.LowerBeamHeadlampLightSource || ''
  const adaptiveDrivingBeam = nhtsaData.AdaptiveDrivingBeam || ''
  const pretensioner = nhtsaData.Pretensioner || ''
  const seatBeltType = nhtsaData.SeatBeltsAll || ''
  
  // Convenience features
  const entertainmentSystem = nhtsaData.EntertainmentSystem || ''
  const steeringLocation = nhtsaData.SteeringLocation || ''
  
  // Dimensions & Weight
  const doors = nhtsaData.Doors || ''
  const windows = nhtsaData.Windows || ''
  const seats = nhtsaData.Seats || ''
  const seatRows = nhtsaData.SeatRows || ''
  const wheelbase = nhtsaData.WheelBaseShort || nhtsaData.WheelBaseLong || ''
  const wheelbaseType = nhtsaData.WheelBaseType || ''
  const trackWidth = nhtsaData.TrackWidth || ''
  const gvwr = nhtsaData.GVWR || ''
  const gvwrTo = nhtsaData.GVWR_to || ''
  const gcwr = nhtsaData.GCWR || ''
  const curbWeight = nhtsaData.CurbWeightLB || ''
  const wheelSizeFront = nhtsaData.WheelSizeFront || ''
  const wheelSizeRear = nhtsaData.WheelSizeRear || ''
  const numberOfWheels = nhtsaData.Wheels || ''
  
  // Manufacturing
  const plantCountry = nhtsaData.PlantCountry || ''
  const plantCity = nhtsaData.PlantCity || ''
  const plantState = nhtsaData.PlantState || ''
  const plantCompanyName = nhtsaData.PlantCompanyName || ''
  const manufacturer = nhtsaData.Manufacturer || ''
  const basePrice = nhtsaData.BasePrice || ''
  
  // EV/Hybrid specific (conditional)
  const batteryType = nhtsaData.BatteryType || ''
  const batteryKWh = nhtsaData.BatteryKWh || ''
  const batteryKWhTo = nhtsaData.BatteryKWh_to || ''
  const batteryV = nhtsaData.BatteryV || ''
  const batteryVTo = nhtsaData.BatteryV_to || ''
  const batteryA = nhtsaData.BatteryA || ''
  const batteryATo = nhtsaData.BatteryA_to || ''
  const chargerLevel = nhtsaData.ChargerLevel || ''
  const chargerPowerKW = nhtsaData.ChargerPowerKW || ''
  const evDriveUnit = nhtsaData.EVDriveUnit || ''
  const batteryModules = nhtsaData.BatteryModules || ''
  const batteryPacks = nhtsaData.BatteryPacks || ''
  
  // Truck specific (conditional)
  const bedType = nhtsaData.BedType || ''
  const bedLength = nhtsaData.BedLengthIN || ''
  const cabType = nhtsaData.BodyCabType || ''
  const axles = nhtsaData.Axles || ''
  const axleConfiguration = nhtsaData.AxleConfiguration || ''

  // Validate we got minimum required data
  if (!year || !make || !model) {
    throw new Error('Could not decode VIN. NHTSA returned incomplete data.')
  }

  console.log('[VIN/Decoder] Decoded:', { year, make, model, trim })

  // 5. Clean and normalize basic fields
  const cleanedTrim = cleanTrim(trim)
  const normalizedMake = titleCase(make)
  const normalizedEngine = normalizeEngine(engine)

  // 6. Generate display name
  const displayName = buildDisplayName({ year, make, model, trim, bodyType })

  // 7. Fetch REAL data from external APIs (in parallel for speed)
  console.log('[VIN/Decoder] Fetching real data from EPA...')
  const [epaResult] = await Promise.all([
    getFuelEconomy(vin).catch(err => {
      console.warn('[VIN/Decoder] EPA fetch failed:', err.message)
      return null
    }),
    // Recalls API disabled - timing out (10+ seconds)
    // TODO: Re-enable when we find a working endpoint or buy database
    // checkRecalls(vin).catch(err => {
    //   console.warn('[VIN/Decoder] Recalls fetch failed:', err.message)
    //   return null
    // })
  ])
  const recallsResult = null // Disabled for now

  // 8. Build enrichment data (use real EPA data when available)
  const mockData = epaResult?.success && epaResult.fuelEconomy
    ? {
        // REAL EPA data!
        mpgCity: epaResult.fuelEconomy.cityMPG,
        mpgHighway: epaResult.fuelEconomy.highwayMPG,
        maintenanceInterval: estimateMaintenanceInterval(year, make, fuelType),
        annualCost: estimateMaintenanceCost(year, make, bodyType)
      }
    : generateMockData(year, make, model) // Fallback to heuristics if EPA fails
  
  // Add EPA-specific data if available (for display)
  const epaData = epaResult?.success && epaResult.fuelEconomy ? {
    isRealData: true as const,
    annualFuelCost: epaResult.fuelEconomy.annualFuelCost,
    combinedMPG: epaResult.fuelEconomy.combinedMPG,
    co2Emissions: epaResult.fuelEconomy.co2Emissions
  } : null

  // 9. Generate AI insights with REAL data!
  console.log('[VIN/Decoder] Generating AI insights...')
  const aiInsights = await generateAIInsights({
    year,
    make,
    model,
    trim,
    bodyType,
    engine,
    fuelType,
    mockData,
    epaData,  // Pass real EPA data!
    recalls: recallsResult?.recalls || null  // Pass real recalls!
  })

  // 10. Extract COMPLETE NHTSA data (GOD TIER 100%!)
  const nhtsaComplete: Record<string, string> = {}
  const allNHTSAFields = Object.keys(nhtsaData)
  const fieldsWithData: string[] = []
  
  for (const [key, value] of Object.entries(nhtsaData)) {
    if (value && typeof value === 'string' && value.trim() !== '') {
      nhtsaComplete[key] = value.trim()
      fieldsWithData.push(key)
    }
  }
  
  // 11. Calculate extraction metadata
  const structuredFields = [
    // Basic fields
    'ModelYear', 'Make', 'Model', 'Trim', 'Series', 'BodyClass',
    // Engine fields  
    'EngineCylinders', 'DisplacementL', 'EngineHP', 'EngineModel',
    // And all others we extract...
  ]
  
  const extractedFields = structuredFields.filter(f => nhtsaData[f])
  const missingFields = fieldsWithData.filter(f => !structuredFields.includes(f))
  
  const extractionMetadata = {
    totalFields: allNHTSAFields.length,
    fieldsWithData: fieldsWithData.length,
    fieldsExtracted: extractedFields.length,
    extractionRate: Math.round((extractedFields.length / Math.max(fieldsWithData.length, 1)) * 100),
    missingFields: missingFields.slice(0, 20) // Limit to first 20
  }
  
  console.log(`[VIN/Decoder] Extraction: ${extractionMetadata.extractionRate}% (${extractionMetadata.fieldsExtracted}/${extractionMetadata.fieldsWithData} fields)`)

  // 12. Normalize data (GOD TIER: Clean, typed, queryable!)
  const { VehicleDataNormalizer } = await import('./normalizer')
  const normalized = VehicleDataNormalizer.normalize(nhtsaComplete)
  console.log(`[VIN/Decoder] Normalized: ${normalized.normalization.dataQuality.completeness}% complete, ${normalized.normalization.dataQuality.safetyFeaturesPopulated} safety features`)

  // 13. Build result with normalized data
  const result: VINDecodeResult = {
    vin,
    vehicle: { 
      year, 
      make: normalizedMake, 
      model, 
      trim: cleanedTrim, 
      displayName 
    },
    specs: {
      bodyType: normalizeBodyType(bodyType),
      engine: normalizedEngine,
      transmission: normalizeTransmission(transmission),
      driveType: normalizeDriveType(driveType),
      fuelType: normalizeFuelType(fuelType)
    },
    // GOD TIER: Complete NHTSA data!
    nhtsaComplete,
    extractionMetadata,
    // GOD TIER: Normalized data (clean, typed, queryable!)
    normalized,
    extendedSpecs: {
      // Engine details
      engineCylinders,
      engineDisplacement: normalizeDisplacement(engineDisplacement),
      engineDisplacementCC,
      engineDisplacementCI,
      engineHP: normalizeHorsepower(engineHP),
      engineHPTo,
      engineKW,
      engineConfig,
      valveTrain,
      coolingType,
      fuelInjectionType,
      turbo,
      topSpeed,
      engineManufacturer,
      transmissionSpeeds: normalizeTransmissionSpeeds(transmissionSpeeds),
      fuelTypeSecondary: normalizeFuelType(fuelTypeSecondary),
      electrificationLevel,
      // Safety features
      absType: normalizeSafetyFeature(absType),
      airBagLocFront: normalizeSafetyFeature(airBagLocFront),
      airBagLocSide: normalizeSafetyFeature(airBagLocSide),
      airBagLocCurtain: normalizeSafetyFeature(airBagLocCurtain),
      airBagLocKnee: normalizeSafetyFeature(airBagLocKnee),
      electronicStabilityControl: normalizeSafetyFeature(electronicStabilityControl),
      tractionControl: normalizeSafetyFeature(tractionControl),
      blindSpotWarning: normalizeSafetyFeature(blindSpotWarning),
      forwardCollisionWarning: normalizeSafetyFeature(forwardCollisionWarning),
      laneDepartureWarning: normalizeSafetyFeature(laneDepartureWarning),
      parkAssist: normalizeSafetyFeature(parkAssist),
      backupCamera: normalizeSafetyFeature(backupCamera),
      adaptiveCruiseControl: normalizeSafetyFeature(adaptiveCruiseControl),
      brakeSystemType: normalizeSafetyFeature(brakeSystemType),
      tpmsType: normalizeSafetyFeature(tpmsType),
      autoReverseSystem: normalizeSafetyFeature(autoReverseSystem),
      keylessIgnition: normalizeSafetyFeature(keylessIgnition),
      laneCenteringAssistance: normalizeSafetyFeature(laneCenteringAssistance),
      blindSpotIntervention: normalizeSafetyFeature(blindSpotIntervention),
      rearCrossTrafficAlert: normalizeSafetyFeature(rearCrossTrafficAlert),
      pedestrianAEB: normalizeSafetyFeature(pedestrianAEB),
      dynamicBrakeSupport: normalizeSafetyFeature(dynamicBrakeSupport),
      crashImminentBraking: normalizeSafetyFeature(crashImminentBraking),
      laneKeepingAssist: normalizeSafetyFeature(laneKeepingAssist),
      rearAutoEmergencyBraking: normalizeSafetyFeature(rearAutoEmergencyBraking),
      eventDataRecorder: normalizeSafetyFeature(eventDataRecorder),
      saeAutomationLevel,
      automaticCrashNotification: normalizeSafetyFeature(automaticCrashNotification),
      daytimeRunningLight: normalizeSafetyFeature(daytimeRunningLight),
      headlampLightSource,
      adaptiveDrivingBeam: normalizeSafetyFeature(adaptiveDrivingBeam),
      pretensioner: normalizeSafetyFeature(pretensioner),
      seatBeltType,
      // Convenience features
      entertainmentSystem: normalizeSafetyFeature(entertainmentSystem),
      steeringLocation,
      // Dimensions & Weight
      doors: normalizeDoors(doors),
      windows,
      seats,
      seatRows,
      wheelbase,
      wheelbaseType,
      trackWidth,
      gvwr,
      gvwrTo,
      gcwr,
      curbWeight,
      wheelSizeFront,
      wheelSizeRear,
      numberOfWheels,
      // Manufacturing
      plantCountry: normalizeCountry(plantCountry),
      plantCity: titleCase(plantCity || ''),
      plantState: plantState?.toUpperCase(),
      plantCompanyName,
      manufacturer: normalizeManufacturer(manufacturer),
      basePrice,
      location: formatLocation(plantCity, plantState, plantCountry),
      // EV/Hybrid (conditional - only if present)
      ...(electrificationLevel && {
        ev: {
          level: electrificationLevel,
          batteryType,
          batteryKWh,
          batteryKWhTo,
          batteryV,
          batteryVTo,
          batteryA,
          batteryATo,
          chargerLevel,
          chargerPowerKW,
          evDriveUnit,
          batteryModules,
          batteryPacks
        }
      }),
      // Truck (conditional - only if pickup/truck)
      ...(bedType || bedLength || cabType) && {
        truck: {
          bedType,
          bedLength,
          cabType,
          axles,
          axleConfiguration
        }
      }
    },
    mockData,
    epaData, // Real EPA data if available!
    recalls: recallsResult?.recalls || null, // Real NHTSA recalls!
    aiInsights
  }

  // 9. Cache result
  console.log('[VIN/Decoder] Caching result...')
  await cacheResult(vin, result, nhtsaData)

  console.log('[VIN/Decoder] ✅ Decode complete!')
  return result
}

/**
 * Fetch data from NHTSA API (Flat format for easy extraction)
 */
async function fetchNHTSAData(vin: string): Promise<any> {
  // Use DecodeVinValuesExtended for flat format (144 fields as properties!)
  const url = `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValuesExtended/${vin}?format=json`
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'MotoMind/1.0',
    },
  })

  if (!response.ok) {
    throw new Error(`NHTSA API error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  
  // Check if NHTSA returned any errors
  if (data.Message && data.Message.includes('error')) {
    throw new Error(`NHTSA error: ${data.Message}`)
  }

  // Flat format returns data in Results[0]
  return data.Results && data.Results[0] ? data.Results[0] : {}
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

  // DON'T add body type to display name - it's redundant
  // User doesn't want "SUV/MPV" or "Sedan" in title

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
 * Clean trim field (remove "Not Applicable", etc.)
 */
function cleanTrim(trim?: string): string | undefined {
  if (!trim) return undefined
  
  const cleaned = trim
    .replace(/Not Applicable/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
  
  return cleaned || undefined
}

/**
 * Estimate maintenance interval (fallback when EPA fails)
 */
function estimateMaintenanceInterval(year: number, make: string, fuelType?: string): number {
  const currentYear = new Date().getFullYear()
  const age = currentYear - year
  const isEV = fuelType?.toLowerCase().includes('electric')
  
  if (isEV) return 12000 // EVs need less frequent service
  if (age <= 3) return 7500 // New cars
  return 5000 // Older cars
}

/**
 * Estimate annual maintenance cost (fallback when EPA fails)
 */
function estimateMaintenanceCost(year: number, make: string, bodyType?: string): number {
  const currentYear = new Date().getFullYear()
  const age = currentYear - year
  const isLuxury = /bmw|mercedes|audi|lexus|porsche|jaguar|cadillac/i.test(make)
  const isTruckSUV = bodyType?.toLowerCase().includes('truck') || bodyType?.toLowerCase().includes('suv')
  
  if (isLuxury) return 1800
  if (isTruckSUV) return 1200
  if (age > 10) return 1400
  return 900
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
  epaData?: {
    isRealData: true
    annualFuelCost: number
    combinedMPG: number
    co2Emissions: number
  } | null
  recalls?: Array<{
    Component: string
    Summary: string
  }> | null
}): Promise<{
  summary: string
  reliabilityScore: number
  maintenanceTip: string
  costTip: string
}> {
  const vehicleName = `${data.year} ${data.make} ${data.model}${data.trim ? ' ' + data.trim : ''}`
  const currentYear = new Date().getFullYear()
  const age = currentYear - data.year
  
  // Build context with REAL data
  let dataContext = `Vehicle: ${vehicleName}
Age: ${age} years old
Body Type: ${data.bodyType || 'Unknown'}
Engine: ${data.engine || 'Unknown'}
Fuel Type: ${data.fuelType || 'Unknown'}

`
  
  // Add EPA data if available
  if (data.epaData?.isRealData) {
    dataContext += `REAL EPA DATA:
- Combined MPG: ${data.epaData.combinedMPG}
- City/Highway: ${data.mockData.mpgCity}/${data.mockData.mpgHighway} MPG
- Annual Fuel Cost: $${data.epaData.annualFuelCost}
- CO2 Emissions: ${data.epaData.co2Emissions} g/mi

`
  } else {
    dataContext += `Estimated MPG: ${data.mockData.mpgCity} city / ${data.mockData.mpgHighway} highway

`
  }
  
  // Add recalls if any
  if (data.recalls && data.recalls.length > 0) {
    dataContext += `🚨 OPEN RECALLS (${data.recalls.length}):
`
    data.recalls.forEach(r => {
      dataContext += `- ${r.Component}: ${r.Summary}
`
    })
    dataContext += `
`
  }
  
  dataContext += `Estimated service interval: Every ${data.mockData.maintenanceInterval} miles
Estimated annual cost: $${data.mockData.annualCost}
`
  
  const prompt = `You are an automotive expert AI. Analyze this SPECIFIC vehicle with REAL data:

${dataContext}

Generate SPECIFIC, DATA-DRIVEN insights in JSON format:

Return a JSON object with:
{
  "summary": "2 sentences using REAL numbers from the data above",
  "reliabilityScore": 0.75,
  "maintenanceTip": "1 SPECIFIC tip based on age, recalls, or actual specs - NO generic 'regular oil changes' advice",
  "costTip": "1 SPECIFIC money-saving tip using the actual annual cost or EPA data - NO generic 'use aftermarket parts' advice"
}

RULES:
- MUST reference actual numbers (MPG, cost, age, recalls)
- If recalls exist, mention them!
- If EPA data, compare to class average
- NO boilerplate like 'regular oil changes' or 'aftermarket parts'
- Be specific to THIS vehicle's age and data
- Return valid JSON only`

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
    console.error('[VIN/Decoder] Check OPENAI_API_KEY in .env.local')
    
    // Fallback with REAL data if OpenAI fails
    const hasRecalls = data.recalls && data.recalls.length > 0
    const hasEPA = data.epaData?.isRealData
    
    return {
      summary: `The ${vehicleName} is ${age} years old${hasEPA && data.epaData ? ` with EPA-certified ${data.epaData.combinedMPG} MPG combined` : ''}. ${hasRecalls ? `⚠️ ${data.recalls!.length} open recall(s) need attention.` : 'Annual maintenance estimated at $' + data.mockData.annualCost + '.'}`,
      reliabilityScore: age < 5 ? 0.85 : age < 10 ? 0.75 : 0.65,
      maintenanceTip: hasRecalls 
        ? `Address ${data.recalls![0].Component} recall immediately at any dealer (free repair).`
        : `At ${age} years old, focus on preventive maintenance every ${data.mockData.maintenanceInterval} miles.`,
      costTip: hasEPA && data.epaData
        ? `Budget $${data.epaData.annualFuelCost}/year for fuel based on EPA data, plus $${data.mockData.annualCost} maintenance.`
        : `Estimated $${data.mockData.annualCost}/year maintenance for a ${age}-year-old ${data.bodyType || 'vehicle'}.`
    }
  }
}

/**
 * Check cache for existing VIN data
 */
async function checkCache(vin: string): Promise<VINDecodeResult | null> {
  const { data, error } = await getSupabaseClient()
    .from('vin_decode_cache')
    .select('*')
    .eq('vin', vin)
    .single()

  if (error || !data) {
    return null
  }

  // Type cast to handle database schema
  const cachedData = data as any
  const rawData = cachedData.raw_data as any
  
  return {
    vin: cachedData.vin,
    vehicle: {
      year: cachedData.year,
      make: cachedData.make,
      model: cachedData.model,
      trim: cachedData.trim || undefined,
      displayName: cachedData.display_name
    },
    specs: {
      bodyType: cachedData.body_type || undefined,
      engine: cachedData.engine || undefined,
      transmission: cachedData.transmission || undefined,
      driveType: cachedData.drive_type || undefined,
      fuelType: cachedData.fuel_type || undefined
    },
    extendedSpecs: rawData ? extractExtendedFromRaw(rawData.Results || []) : undefined,
    mockData: {
      mpgCity: cachedData.mock_mpg_city || 0,
      mpgHighway: cachedData.mock_mpg_highway || 0,
      maintenanceInterval: cachedData.mock_maintenance_interval || 5000,
      annualCost: cachedData.mock_annual_cost || 800
    },
    aiInsights: {
      summary: cachedData.ai_summary || '',
      reliabilityScore: parseFloat(cachedData.ai_reliability_score || '0.75'),
      maintenanceTip: cachedData.ai_maintenance_tip || '',
      costTip: cachedData.ai_cost_tip || ''
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
  // Type cast to bypass stale database types
  const { error } = await getSupabaseClient().from('vin_decode_cache').insert({
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
  } as any)

  if (error) {
    console.error('[VIN/Decoder] Failed to cache result:', error)
    // Don't throw - cache failure shouldn't break the decode
  }
}
