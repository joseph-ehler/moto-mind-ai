/**
 * NHTSA VIN Decoder Client
 * 
 * Official NHTSA vPIC API client for decoding VINs
 * API Docs: https://vpic.nhtsa.dot.gov/api/
 */

export interface NHTSAVehicleData {
  vin: string
  make?: string
  model?: string
  year?: number
  body_style?: string
  engine?: string
  transmission?: string
  drive_type?: string
  fuel_type?: string
  plant_country?: string
  manufacturer?: string
  series?: string
  trim?: string
  vehicle_type?: string
  error?: string
}

interface NHTSAResponse {
  Count: number
  Message: string
  SearchCriteria: string
  Results: Array<{
    Variable: string
    Value: string | null
    ValueId: string | null
    VariableId: number
  }>
}

/**
 * Decode VIN using NHTSA vPIC API
 * Free public API, no auth required
 * 
 * @param vin - 17-character VIN
 * @param modelYear - Optional model year for better accuracy
 */
export async function decodeVIN(vin: string, modelYear?: number): Promise<NHTSAVehicleData> {
  // Validate VIN format
  if (!vin || vin.length !== 17) {
    return {
      vin,
      error: 'Invalid VIN: Must be exactly 17 characters'
    }
  }
  
  try {
    // NHTSA vPIC API endpoint - DecodeVinValues for flat format (faster)
    let url = `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${encodeURIComponent(vin)}?format=json`
    
    // Add model year if provided for better accuracy
    if (modelYear) {
      url += `&modelyear=${modelYear}`
    }
    
    console.log(`[NHTSA] Decoding VIN: ${vin}${modelYear ? ` (Year: ${modelYear})` : ''}`)
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error(`NHTSA API error: ${response.status}`)
    }
    
    const data: NHTSAResponse = await response.json()
    
    // Extract relevant fields from NHTSA response
    const getValue = (variableName: string): string | null => {
      const result = data.Results.find(r => r.Variable === variableName)
      return result?.Value || null
    }
    
    const year = getValue('Model Year')
    
    const vehicleData: NHTSAVehicleData = {
      vin: vin.toUpperCase(),
      make: getValue('Make') || undefined,
      model: getValue('Model') || undefined,
      year: year ? parseInt(year) : undefined,
      body_style: getValue('Body Class') || undefined,
      engine: getValue('Engine Model') || getValue('Engine Number of Cylinders') || undefined,
      transmission: getValue('Transmission Style') || undefined,
      drive_type: getValue('Drive Type') || undefined,
      fuel_type: getValue('Fuel Type - Primary') || undefined,
      plant_country: getValue('Plant Country') || undefined,
      manufacturer: getValue('Manufacturer Name') || undefined,
      series: getValue('Series') || undefined,
      trim: getValue('Trim') || undefined,
      vehicle_type: getValue('Vehicle Type') || undefined
    }
    
    console.log(`[NHTSA] Decoded: ${vehicleData.year} ${vehicleData.make} ${vehicleData.model}`)
    
    // Check if VIN was actually found
    const errorCode = getValue('Error Code')
    if (errorCode && errorCode !== '0') {
      const errorText = getValue('Error Text') || 'VIN not found in NHTSA database'
      console.warn(`[NHTSA] Warning: ${errorText}`)
      vehicleData.error = errorText
    }
    
    return vehicleData
    
  } catch (error) {
    console.error('[NHTSA] Decoding failed:', error)
    return {
      vin,
      error: error instanceof Error ? error.message : 'Failed to decode VIN'
    }
  }
}

/**
 * Validate VIN check digit
 * Returns true if VIN check digit is valid
 */
export function validateVINCheckDigit(vin: string): boolean {
  if (vin.length !== 17) return false
  
  // VIN transliteration table
  const transliteration: Record<string, number> = {
    'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5, 'F': 6, 'G': 7, 'H': 8,
    'J': 1, 'K': 2, 'L': 3, 'M': 4, 'N': 5, 'P': 7, 'R': 9,
    'S': 2, 'T': 3, 'U': 4, 'V': 5, 'W': 6, 'X': 7, 'Y': 8, 'Z': 9
  }
  
  // Weight factors
  const weights = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2]
  
  const vinArray = vin.toUpperCase().split('')
  let sum = 0
  
  for (let i = 0; i < 17; i++) {
    const char = vinArray[i]
    let value: number
    
    if (char >= '0' && char <= '9') {
      value = parseInt(char)
    } else if (char in transliteration) {
      value = transliteration[char]
    } else {
      return false // Invalid character
    }
    
    sum += value * weights[i]
  }
  
  const checkDigit = sum % 11
  const checkChar = vinArray[8]
  
  if (checkDigit === 10) {
    return checkChar === 'X'
  } else {
    return checkChar === checkDigit.toString()
  }
}

/**
 * Batch decode multiple VINs (max 50 per request)
 * More efficient than individual requests
 */
export async function batchDecodeVINs(vins: string[]): Promise<NHTSAVehicleData[]> {
  if (vins.length === 0) {
    return []
  }
  
  if (vins.length > 50) {
    console.warn('[NHTSA] Batch size exceeds 50, splitting into chunks')
    
    // Process in chunks of 50
    const chunks: string[][] = []
    for (let i = 0; i < vins.length; i += 50) {
      chunks.push(vins.slice(i, i + 50))
    }
    
    const results = await Promise.all(
      chunks.map(chunk => batchDecodeVINs(chunk))
    )
    
    return results.flat()
  }
  
  try {
    console.log(`[NHTSA] Batch decoding ${vins.length} VINs...`)
    
    // Format VINs for batch request (semicolon-separated)
    const vinString = vins.join(';')
    
    const response = await fetch('https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVINValuesBatch/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        format: 'json',
        data: vinString
      })
    })
    
    if (!response.ok) {
      throw new Error(`NHTSA Batch API error: ${response.status}`)
    }
    
    const data = await response.json()
    
    console.log(`[NHTSA] Batch decoded ${vins.length} VINs successfully`)
    
    // Parse results (similar to individual decode)
    return vins.map((vin, index) => {
      const result = data.Results?.[index]
      if (!result) {
        return { vin, error: 'No result from NHTSA' }
      }
      
      return {
        vin,
        make: result.Make || undefined,
        model: result.Model || undefined,
        year: result.ModelYear ? parseInt(result.ModelYear) : undefined,
        body_style: result.BodyClass || undefined,
        manufacturer: result.Manufacturer || undefined
        // Add more fields as needed
      }
    })
    
  } catch (error) {
    console.error('[NHTSA] Batch decode failed:', error)
    return vins.map(vin => ({
      vin,
      error: error instanceof Error ? error.message : 'Batch decode failed'
    }))
  }
}

/**
 * Get manufacturer from VIN (WMI - World Manufacturer Identifier)
 * First 3 characters identify the manufacturer
 */
export function getManufacturerFromVIN(vin: string): string | null {
  if (vin.length < 3) return null
  
  const wmi = vin.substring(0, 3).toUpperCase()
  
  // Common WMI codes (partial list)
  const wmiMap: Record<string, string> = {
    '1HG': 'Honda',
    '1G1': 'Chevrolet',
    '1FA': 'Ford',
    '1FT': 'Ford Truck',
    '1GC': 'Chevrolet Truck',
    '1GM': 'Pontiac',
    '1G6': 'Cadillac',
    '2HG': 'Honda',
    '3FA': 'Ford Mexico',
    '4T1': 'Toyota',
    '5YJ': 'Tesla',
    'JM1': 'Mazda',
    'KM8': 'Hyundai',
    'KND': 'Kia',
    'WBA': 'BMW',
    'WDB': 'Mercedes-Benz',
    'WAU': 'Audi',
    'WVW': 'Volkswagen',
    'YV1': 'Volvo'
  }
  
  return wmiMap[wmi] || null
}
