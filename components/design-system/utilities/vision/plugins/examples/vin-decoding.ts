/**
 * VIN Decoding Plugin
 * 
 * Decodes Vehicle Identification Numbers to extract vehicle information
 * 
 * Features:
 * - World Manufacturer Identifier (WMI) decoding
 * - Model year extraction
 * - Vehicle type identification
 * - Manufacturing location
 * - API integration (NHTSA, custom APIs)
 * - Result enrichment
 * - Caching support
 * 
 * @example
 * ```tsx
 * <VINScanner
 *   plugins={[
 *     vinDecoding({
 *       apiProvider: 'nhtsa',
 *       cacheResults: true,
 *       enrichResult: true,
 *       onDecode: (vehicleInfo) => {
 *         console.log('Vehicle:', vehicleInfo)
 *       }
 */

import type { VisionPlugin, VisionPluginFactory, VisionPluginContext } from '../types'
import type { CaptureResult } from '../../types'

// VIN decoding configuration
export interface VINDecodingOptions {
  /** API provider for VIN decoding */
  apiProvider?: 'nhtsa' | 'custom' | 'mock'
  
  /** Custom API endpoint */
  customApiUrl?: string
  
  /** API key (if required) */
  apiKey?: string
  
  /** Cache decoded results */
  cacheResults?: boolean
  
  /** Cache duration (ms) */
  cacheDuration?: number
  
  /** Automatically enrich result with decoded data */
  enrichResult?: boolean
  
  /** Fields to extract */
  extractFields?: (keyof DecodedVehicleInfo)[]
  
  /** Callback for decoded vehicle info */
  onDecode?: (info: DecodedVehicleInfo) => void
  
  /** Callback for decode error */
  onDecodeError?: (error: string) => void
  
  /** Timeout for API requests (ms) */
  timeout?: number
}

// Decoded vehicle information
export interface DecodedVehicleInfo {
  vin: string
  make?: string
  model?: string
  year?: number
  trim?: string
  bodyType?: string
  engineType?: string
  transmission?: string
  driveType?: string
  fuelType?: string
  manufacturer?: string
  plantCity?: string
  plantCountry?: string
  vehicleType?: string
  series?: string
  doors?: number
  cylinders?: number
  displacement?: string
  horsepower?: number
  weight?: string
  [key: string]: any
}

// Model year codes (position 10)
const MODEL_YEAR_CODES: Record<string, number> = {
  // 2001-2009
  '1': 2001, '2': 2002, '3': 2003, '4': 2004, '5': 2005,
  '6': 2006, '7': 2007, '8': 2008, '9': 2009,
  // 2010-2030
  'A': 2010, 'B': 2011, 'C': 2012, 'D': 2013, 'E': 2014,
  'F': 2015, 'G': 2016, 'H': 2017, 'J': 2018, 'K': 2019,
  'L': 2020, 'M': 2021, 'N': 2022, 'P': 2023, 'R': 2024,
  'S': 2025, 'T': 2026, 'V': 2027, 'W': 2028, 'X': 2029,
  'Y': 2030
}

// World Manufacturer Identifier (WMI) database (sample)
const WMI_DATABASE: Record<string, { manufacturer: string; country: string; region: string }> = {
  // United States
  '1G1': { manufacturer: 'General Motors (Chevrolet)', country: 'USA', region: 'North America' },
  '1FA': { manufacturer: 'Ford Motor Company', country: 'USA', region: 'North America' },
  '1FT': { manufacturer: 'Ford Trucks', country: 'USA', region: 'North America' },
  '1HG': { manufacturer: 'Honda', country: 'USA', region: 'North America' },
  '1N4': { manufacturer: 'Nissan', country: 'USA', region: 'North America' },
  '2HG': { manufacturer: 'Honda (Canada)', country: 'Canada', region: 'North America' },
  '2T1': { manufacturer: 'Toyota', country: 'Canada', region: 'North America' },
  '3VW': { manufacturer: 'Volkswagen', country: 'Mexico', region: 'North America' },
  '4T1': { manufacturer: 'Toyota', country: 'USA', region: 'North America' },
  '5YJ': { manufacturer: 'Tesla', country: 'USA', region: 'North America' },
  
  // Japan
  'JHM': { manufacturer: 'Honda', country: 'Japan', region: 'Asia' },
  'JN1': { manufacturer: 'Nissan', country: 'Japan', region: 'Asia' },
  'JT2': { manufacturer: 'Toyota', country: 'Japan', region: 'Asia' },
  'JF1': { manufacturer: 'Subaru', country: 'Japan', region: 'Asia' },
  
  // Germany
  'WAU': { manufacturer: 'Audi', country: 'Germany', region: 'Europe' },
  'WBA': { manufacturer: 'BMW', country: 'Germany', region: 'Europe' },
  'WDB': { manufacturer: 'Mercedes-Benz', country: 'Germany', region: 'Europe' },
  'WVW': { manufacturer: 'Volkswagen', country: 'Germany', region: 'Europe' },
  'WP0': { manufacturer: 'Porsche', country: 'Germany', region: 'Europe' },
  
  // Korea
  'KM8': { manufacturer: 'Hyundai', country: 'South Korea', region: 'Asia' },
  'KNA': { manufacturer: 'Kia', country: 'South Korea', region: 'Asia' },
  
  // Italy
  'ZAR': { manufacturer: 'Alfa Romeo', country: 'Italy', region: 'Europe' },
  'ZFF': { manufacturer: 'Ferrari', country: 'Italy', region: 'Europe' },
  'ZLA': { manufacturer: 'Lamborghini', country: 'Italy', region: 'Europe' }
}

/**
 * Simple result cache
 */
class VINCache {
  private cache = new Map<string, { data: DecodedVehicleInfo; timestamp: number }>()
  
  set(vin: string, data: DecodedVehicleInfo, duration: number): void {
    this.cache.set(vin, {
      data,
      timestamp: Date.now() + duration
    })
  }
  
  get(vin: string): DecodedVehicleInfo | null {
    const cached = this.cache.get(vin)
    if (!cached) return null
    
    // Check expiration
    if (Date.now() > cached.timestamp) {
      this.cache.delete(vin)
      return null
    }
    
    return cached.data
  }
  
  clear(): void {
    this.cache.clear()
  }
}

const vinCache = new VINCache()

/**
 * Extract model year from VIN
 */
function extractModelYear(vin: string): number | undefined {
  const yearCode = vin[9]
  return MODEL_YEAR_CODES[yearCode]
}

/**
 * Extract manufacturer from WMI
 */
function extractManufacturer(vin: string): {
  manufacturer?: string
  country?: string
  region?: string
} {
  const wmi = vin.substring(0, 3)
  return WMI_DATABASE[wmi] || {}
}

/**
 * Decode VIN using NHTSA API
 * 
 * NHTSA provides free VIN decoding API
 * https://vpic.nhtsa.dot.gov/api/
 */
async function decodeVINNHTSA(
  vin: string,
  options: VINDecodingOptions
): Promise<DecodedVehicleInfo> {
  const url = `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/${vin}?format=json`
  
  console.log('🔍 Decoding VIN via NHTSA API:', vin)
  
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), options.timeout ?? 10000)
  
  try {
    const response = await fetch(url, {
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    
    if (!response.ok) {
      throw new Error(`NHTSA API error: ${response.status}`)
    }
    
    const data = await response.json()
    
    if (!data.Results || data.Results.length === 0) {
      throw new Error('No results from NHTSA API')
    }
    
    // Parse NHTSA response
    const results = data.Results.reduce((acc: any, item: any) => {
      if (item.Value && item.Value !== 'Not Applicable' && item.Value !== '') {
        acc[item.Variable] = item.Value
      }
      return acc
    }, {})
    
    // Map to our structure with defensive parsing
    const year = results.ModelYear ? parseInt(results.ModelYear) : undefined
    const doors = results.Doors ? parseInt(results.Doors) : undefined
    const cylinders = results.EngineCylinders ? parseInt(results.EngineCylinders) : undefined
    
    const decoded: DecodedVehicleInfo = {
      vin,
      make: results.Make || undefined,
      model: results.Model || undefined,
      year: (year && !isNaN(year)) ? year : undefined,
      trim: results.Trim || undefined,
      bodyType: results.BodyClass || undefined,
      engineType: results.EngineModel || results.EngineConfiguration || undefined,
      transmission: results.TransmissionStyle || undefined,
      driveType: results.DriveType || undefined,
      fuelType: results.FuelTypePrimary || undefined,
      manufacturer: results.Manufacturer || undefined,
      plantCity: results.PlantCity || undefined,
      plantCountry: results.PlantCountry || undefined,
      vehicleType: results.VehicleType || undefined,
      series: results.Series || undefined,
      doors: (doors && !isNaN(doors)) ? doors : undefined,
      cylinders: (cylinders && !isNaN(cylinders)) ? cylinders : undefined,
      displacement: results.DisplacementL || undefined,
      ...results
    }
    
    console.log('✅ VIN decoded successfully:', {
      make: decoded.make,
      model: decoded.model,
      year: decoded.year
    })
    
    console.log('📋 Full NHTSA response fields:', Object.keys(results))
    
    return decoded
  } catch (err) {
    clearTimeout(timeoutId)
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('VIN decoding timeout')
    }
    throw err
  }
}

/**
 * Mock VIN decoder (for development/testing)
 */
async function decodeVINMock(vin: string): Promise<DecodedVehicleInfo> {
  console.log('🎭 Decoding VIN (MOCK):', vin)
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500))
  
  const year = extractModelYear(vin)
  const manufacturerInfo = extractManufacturer(vin)
  
  return {
    vin,
    make: manufacturerInfo.manufacturer?.split('(')[0].trim() || 'Unknown Make',
    model: 'Model X',
    year,
    trim: 'Premium',
    bodyType: 'Sedan',
    engineType: 'V6',
    transmission: 'Automatic',
    driveType: 'FWD',
    fuelType: 'Gasoline',
    manufacturer: manufacturerInfo.manufacturer,
    plantCountry: manufacturerInfo.country,
    vehicleType: 'Passenger Car',
    doors: 4,
    cylinders: 6,
    displacement: '3.5L'
  }
}

/**
 * Decode VIN using custom API
 */
async function decodeVINCustom(
  vin: string,
  options: VINDecodingOptions
): Promise<DecodedVehicleInfo> {
  if (!options.customApiUrl) {
    throw new Error('Custom API URL not provided')
  }
  
  console.log('🔍 Decoding VIN via custom API:', vin)
  
  const url = options.customApiUrl.replace('{vin}', vin)
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), options.timeout ?? 10000)
  
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    }
    
    if (options.apiKey) {
      headers['Authorization'] = `Bearer ${options.apiKey}`
    }
    
    const response = await fetch(url, {
      signal: controller.signal,
      headers
    })
    
    clearTimeout(timeoutId)
    
    if (!response.ok) {
      throw new Error(`Custom API error: ${response.status}`)
    }
    
    const data = await response.json()
    return { vin, ...data }
    
  } catch (err) {
    clearTimeout(timeoutId)
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('VIN decoding timeout')
    }
    throw err
  }
}

/**
 * Main VIN decoding function
 */
async function decodeVIN(
  vin: string,
  options: VINDecodingOptions
): Promise<DecodedVehicleInfo> {
  // Check cache first
  if (options.cacheResults) {
    const cached = vinCache.get(vin)
    if (cached) {
      console.log('✅ VIN found in cache:', vin)
      return cached
    }
  }
  
  // Decode based on provider
  let decoded: DecodedVehicleInfo
  
  switch (options.apiProvider) {
    case 'nhtsa':
      decoded = await decodeVINNHTSA(vin, options)
      break
    case 'custom':
      decoded = await decodeVINCustom(vin, options)
      break
    case 'mock':
    default:
      decoded = await decodeVINMock(vin)
      break
  }
  
  // Cache result
  if (options.cacheResults) {
    vinCache.set(vin, decoded, options.cacheDuration ?? 3600000) // 1 hour default
  }
  
  return decoded
}

/**
 * VIN Decoding Plugin Factory
 * 
 * Creates a plugin that decodes VINs and enriches results
 */
export const vinDecoding: VisionPluginFactory<VINDecodingOptions> = (
  options = {}
) => {
  const plugin: VisionPlugin = {
    id: '@motomind/vin-decoding',
    version: '1.0.0',
    type: 'decoder',
    name: 'VIN Decoding',
    
    hooks: {
      /**
       * Enrich result with decoded vehicle information
       */
      'enrich-result': async (result: CaptureResult) => {
        console.log('🚗 VIN Decoding: Enriching result with vehicle info...')
        
        const vin = result.data?.vin as string
        
        if (!vin) {
          console.warn('⚠️  VIN Decoding: No VIN in result')
          return result
        }
        
        try {
          // Decode VIN
          const vehicleInfo = await decodeVIN(vin, options)
          
          console.log('✅ VIN decoded:', {
            make: vehicleInfo.make,
            model: vehicleInfo.model,
            year: vehicleInfo.year
          })
          
          // Callback
          options.onDecode?.(vehicleInfo)
          
          // Enrich result
          if (options.enrichResult !== false) {
            // Extract requested fields or all
            const fields = options.extractFields ?? Object.keys(vehicleInfo) as (keyof DecodedVehicleInfo)[]
            
            fields.forEach(field => {
              if (vehicleInfo[field] !== undefined) {
                result.data[field] = vehicleInfo[field]
              }
            })
          }
          
          // Add metadata
          result.metadata = {
            ...result.metadata,
            vinDecoding: {
              decoded: true,
              provider: options.apiProvider ?? 'mock',
              vehicleInfo,
              timestamp: Date.now()
            }
          }
          
          return result
          
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'VIN decoding failed'
          console.error('❌ VIN Decoding error:', errorMessage)
          
          options.onDecodeError?.(errorMessage)
          
          // Add error to metadata (don't fail the whole capture)
          result.metadata = {
            ...result.metadata,
            vinDecoding: {
              decoded: false,
              error: errorMessage
            }
          }
          
          return result
        }
      }
    }
  }
  
  return plugin
}

// Export utilities for standalone use
export {
  decodeVIN,
  extractModelYear,
  extractManufacturer,
  decodeVINNHTSA,
  decodeVINMock,
  VINCache,
  MODEL_YEAR_CODES,
  WMI_DATABASE
}
