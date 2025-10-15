import type { NextApiRequest, NextApiResponse } from 'next'
import { withTenantIsolation } from '@/features/auth'


async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { vin } = req.body

    if (!vin || typeof vin !== 'string' || vin.length !== 17) {
      return res.status(400).json({ error: 'Valid 17-character VIN required' })
    }

    console.log('🔍 Decoding VIN:', vin)

    // Use NHTSA VIN Decoder API (free, official US government API)
    const nhtsaUrl = `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/${vin}?format=json`
    
    const response = await fetch(nhtsaUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'MotoMind-VIN-Decoder/1.0'
      }
    })

    if (!response.ok) {
      throw new Error(`NHTSA API error: ${response.status}`)
    }

    const nhtsaData = await response.json()
    console.log('🔍 NHTSA response received, results count:', nhtsaData.Results?.length)

    if (!nhtsaData.Results || nhtsaData.Results.length === 0) {
      return res.status(200).json({
        success: false,
        vin,
        year: null,
        make: null,
        model: null,
        trim: null,
        message: 'VIN not found in NHTSA database'
      })
    }

    // Extract key fields from NHTSA response
    const results = nhtsaData.Results
    const getField = (variableId: number) => {
      const field = results.find((r: any) => r.VariableId === variableId)
      return field?.Value || null
    }

    const year = getField(29) // Model Year
    const make = getField(26) // Make
    const model = getField(28) // Model
    
    const trim = getField(38) // Trim - use official field only
    const bodyClass = getField(5) // Body Class
    const vehicleType = getField(39) // Vehicle Type

    console.log('🔍 Extracted data:', { year, make, model, trim, bodyClass, vehicleType })

    // Normalize text to proper case
    const toProperCase = (text: string | null): string | null => {
      if (!text || text === 'Not Applicable') return null
      
      // Handle special cases
      const specialCases: Record<string, string> = {
        'BMW': 'BMW',
        'GMC': 'GMC',
        'MINI': 'MINI',
        'INFINITI': 'INFINITI',
        'ACURA': 'Acura',
        'AUDI': 'Audi',
        'BENTLEY': 'Bentley',
        'BUICK': 'Buick',
        'CADILLAC': 'Cadillac',
        'CHEVROLET': 'Chevrolet',
        'CHRYSLER': 'Chrysler',
        'DODGE': 'Dodge',
        'FERRARI': 'Ferrari',
        'FIAT': 'Fiat',
        'FORD': 'Ford',
        'GENESIS': 'Genesis',
        'HONDA': 'Honda',
        'HYUNDAI': 'Hyundai',
        'JAGUAR': 'Jaguar',
        'JEEP': 'Jeep',
        'KIA': 'Kia',
        'LAMBORGHINI': 'Lamborghini',
        'LAND ROVER': 'Land Rover',
        'LEXUS': 'Lexus',
        'LINCOLN': 'Lincoln',
        'MASERATI': 'Maserati',
        'MAZDA': 'Mazda',
        'MERCEDES-BENZ': 'Mercedes-Benz',
        'MITSUBISHI': 'Mitsubishi',
        'NISSAN': 'Nissan',
        'PORSCHE': 'Porsche',
        'RAM': 'Ram',
        'ROLLS-ROYCE': 'Rolls-Royce',
        'SUBARU': 'Subaru',
        'TESLA': 'Tesla',
        'TOYOTA': 'Toyota',
        'VOLKSWAGEN': 'Volkswagen',
        'VOLVO': 'Volvo'
      }
      
      // Check for exact match first
      if (specialCases[text.toUpperCase()]) {
        return specialCases[text.toUpperCase()]
      }
      
      // Convert to proper case for other text
      let normalized = text.toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
      
      // Handle common model patterns
      normalized = normalized
        .replace(/\bF-(\d+)\b/g, 'F-$1') // F-150, F-250, etc.
        .replace(/\bModel ([A-Z])\b/g, 'Model $1') // Model S, Model 3, etc.
        .replace(/\b(\d+)Series\b/g, '$1 Series') // 3Series -> 3 Series
        .replace(/\bSuv\b/g, 'SUV')
        .replace(/\bMpv\b/g, 'MPV')
        .replace(/\bLtz\b/g, 'LTZ')
        .replace(/\bLt\b/g, 'LT')
        .replace(/\bLs\b/g, 'LS')
        .replace(/\bSe\b/g, 'SE')
        .replace(/\bSl\b/g, 'SL')
        .replace(/\bEx\b/g, 'EX')
        .replace(/\bLx\b/g, 'LX')
        .replace(/\bDx\b/g, 'DX')
      
      return normalized
    }

    // Clean and normalize the data
    const cleanedData = {
      success: true,
      vin,
      year: year && year !== 'Not Applicable' ? parseInt(year) : null,
      make: toProperCase(make),
      model: toProperCase(model),
      trim: toProperCase(trim),
      bodyClass: toProperCase(bodyClass),
      vehicleType: toProperCase(vehicleType)
    }

    console.log('🔍 Returning cleaned data:', cleanedData)

    return res.status(200).json(cleanedData)

  } catch (error) {
    console.error('VIN decode error:', error)
    return res.status(500).json({ 
      success: false,
      error: 'Failed to decode VIN',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}


export default withTenantIsolation(handler)
