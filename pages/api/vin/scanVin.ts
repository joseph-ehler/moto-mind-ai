// VIN Scanner API - Extract VIN from photos and decode vehicle details
import { NextApiRequest, NextApiResponse } from 'next'
import { withTenantIsolation } from '@/lib/middleware/tenant-context'

import formidable from 'formidable'
import fs from 'fs'
import OpenAI from 'openai'
import { withValidation, validationSchemas } from '../../../lib/utils/api-validation'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export const config = {
  api: {
    bodyParser: false,
  },
}

interface VINDecodeResponse {
  vin: string
  year: number
  make: string
  model: string
  trim?: string
  engine?: string
  transmission?: string
  drivetrain?: string
  fuel_type?: string
  body_style?: string
  confidence: number
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('🔍 VIN Scanner API called:', { method: req.method })
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Validate OpenAI API key
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OpenAI API key not configured')
    return res.status(500).json({ error: 'OpenAI API key not configured' })
  }

  try {
    console.log('📝 Parsing VIN photo...')
    
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024,
      keepExtensions: true,
    })

    const [fields, files] = await form.parse(req)
    
    console.log('📋 Form parsed:', {
      fieldKeys: Object.keys(fields),
      fileKeys: Object.keys(files)
    })

    const imageFile = Array.isArray(files.image) ? files.image[0] : files.image
    if (!imageFile) {
      return res.status(400).json({ error: 'No image provided' })
    }

    console.log('📷 Processing VIN photo:', {
      size: imageFile.size,
      filepath: imageFile.filepath 
    })

    // Read and encode image for OpenAI Vision
    const imageBuffer = fs.readFileSync(imageFile.filepath)
    const base64Image = imageBuffer.toString('base64')
    console.log('📊 Image converted to base64, length:', base64Image.length)

    // Extract VIN using OpenAI Vision
    console.log('🤖 Extracting VIN with OpenAI Vision...')
    const vinResult = await extractVINFromImage(base64Image)
    
    if (!vinResult.vin) {
      return res.status(400).json({ 
        error: 'No VIN detected',
        details: 'Could not find a valid 17-character VIN in the image'
      })
    }

    console.log('✅ VIN extracted:', vinResult.vin)

    // Decode VIN to get vehicle details
    console.log('🔍 Decoding VIN...')
    const vehicleDetails = await decodeVIN(vinResult.vin)

    // Clean up temp file
    fs.unlinkSync(imageFile.filepath)

    return res.status(200).json({
      success: true,
      vin: vinResult.vin,
      confidence: vinResult.confidence,
      vehicle: vehicleDetails
    })

  } catch (error) {
    console.error('❌ Error processing VIN scan:', error)
    return res.status(500).json({ 
      error: 'Failed to process VIN scan',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

async function extractVINFromImage(base64Image: string): Promise<{ vin: string, confidence: number }> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Look for a Vehicle Identification Number (VIN) in this image. A VIN is exactly 17 characters long and contains both letters and numbers (no I, O, or Q).

            Common VIN locations:
            - Dashboard near windshield (visible from outside)
            - Driver's side door jamb sticker
            - Engine bay on a metal plate
            - Registration documents
            - Insurance cards

            Return ONLY the 17-character VIN if found, or "NOT_FOUND" if no valid VIN is visible.
            
            Examples of valid VINs:
            - 1HGBH41JXMN109186
            - JM1BK32F261234567
            - WBAVB13596PT12345

            Response format: Just the VIN characters, nothing else.`
          },
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${base64Image}`
            }
          }
        ]
      }
    ],
    max_tokens: 50
  })

  const content = response.choices[0]?.message?.content?.trim()
  if (!content || content === 'NOT_FOUND') {
    return { vin: '', confidence: 0 }
  }

  // Validate VIN format (17 characters, alphanumeric, no I/O/Q)
  const vinPattern = /^[A-HJ-NPR-Z0-9]{17}$/
  if (!vinPattern.test(content)) {
    console.log('❌ Invalid VIN format:', content)
    return { vin: '', confidence: 0 }
  }

  // Calculate confidence based on VIN validity
  const confidence = isValidVIN(content) ? 95 : 70

  return { vin: content, confidence }
}

async function decodeVIN(vin: string): Promise<VINDecodeResponse> {
  try {
    // Use NHTSA VIN Decoder API (free, no API key required)
    const nhtsa_url = `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/${vin}?format=json`
    
    console.log('🌐 Calling NHTSA VIN decoder:', nhtsa_url)
    const response = await fetch(nhtsa_url)
    
    if (!response.ok) {
      throw new Error(`NHTSA API error: ${response.status}`)
    }

    const data = await response.json()
    
    if (!data.Results || data.Results.length === 0) {
      throw new Error('No results from NHTSA API')
    }

    // Parse NHTSA response
    const results = data.Results
    const getValue = (variableName: string) => {
      const item = results.find((r: any) => r.Variable === variableName)
      return item?.Value || null
    }

    const vehicleDetails: VINDecodeResponse = {
      vin,
      year: parseInt(getValue('Model Year')) || 0,
      make: getValue('Make') || '',
      model: getValue('Model') || '',
      trim: getValue('Trim') || undefined,
      engine: getValue('Engine Model') || getValue('Engine Configuration') || undefined,
      transmission: getValue('Transmission Style') || undefined,
      drivetrain: getValue('Drive Type') || undefined,
      fuel_type: getValue('Fuel Type - Primary') || undefined,
      body_style: getValue('Body Class') || undefined,
      confidence: 90
    }

    console.log('✅ VIN decoded successfully:', {
      year: vehicleDetails.year,
      make: vehicleDetails.make,
      model: vehicleDetails.model
    })

    return vehicleDetails

  } catch (error) {
    console.error('❌ VIN decode error:', error)
    
    // Fallback: return basic info with low confidence
    return {
      vin,
      year: 0,
      make: '',
      model: '',
      confidence: 0
    }
  }
}

function isValidVIN(vin: string): boolean {
  // Basic VIN validation using check digit algorithm
  if (vin.length !== 17) return false
  
  const weights = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2]
  const values: { [key: string]: number } = {
    '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
    'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5, 'F': 6, 'G': 7, 'H': 8,
    'J': 1, 'K': 2, 'L': 3, 'M': 4, 'N': 5, 'P': 7, 'R': 9,
    'S': 2, 'T': 3, 'U': 4, 'V': 5, 'W': 6, 'X': 7, 'Y': 8, 'Z': 9
  }

  let sum = 0
  for (let i = 0; i < 17; i++) {
    if (i === 8) continue // Skip check digit position
    const char = vin[i]
    if (!(char in values)) return false
    sum += values[char] * weights[i]
  }

  const checkDigit = sum % 11
  const expectedCheckDigit = checkDigit === 10 ? 'X' : checkDigit.toString()
  
  return vin[8] === expectedCheckDigit
}


export default withTenantIsolation(handler)
