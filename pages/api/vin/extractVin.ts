import type { NextApiRequest, NextApiResponse } from 'next'
import OpenAI from 'openai'
// import { trackOpenAICall } from '../../lib/clients/api-usage-tracker' // Commented out for deployment
import { withValidation, validationSchemas } from '../../../lib/utils/api-validation'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// VIN validation with ISO 3779 checksum
function validateVIN(vin: string): { valid: boolean; corrected?: string } {
  if (!vin || vin.length !== 17) return { valid: false }
  
  const cleanVIN = vin.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, '')
  if (cleanVIN.length !== 17) return { valid: false }
  
  // Character value mapping for checksum
  const values: { [key: string]: number } = {
    'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5, 'F': 6, 'G': 7, 'H': 8,
    'J': 1, 'K': 2, 'L': 3, 'M': 4, 'N': 5, 'P': 7, 'R': 9,
    'S': 2, 'T': 3, 'U': 4, 'V': 5, 'W': 6, 'X': 7, 'Y': 8, 'Z': 9,
    '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9
  }
  
  const weights = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2]
  
  let sum = 0
  for (let i = 0; i < 17; i++) {
    if (i === 8) continue // Skip check digit position
    sum += values[cleanVIN[i]] * weights[i]
  }
  
  const checkDigit = sum % 11
  const expectedCheck = checkDigit === 10 ? 'X' : checkDigit.toString()
  
  if (cleanVIN[8] === expectedCheck) {
    return { valid: true }
  }
  
  // Try common OCR corrections
  const corrections = {
    'I': '1', 'O': '0', 'Q': '0', 'S': '5', 'B': '8'
  }
  
  for (const [wrong, right] of Object.entries(corrections)) {
    const corrected = cleanVIN.replace(new RegExp(wrong, 'g'), right)
    if (corrected !== cleanVIN) {
      const correctedResult = validateVIN(corrected)
      if (correctedResult.valid) {
        return { valid: true, corrected }
      }
    }
  }
  
  return { valid: false }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { image, prompt } = req.body

    if (!image) {
      return res.status(400).json({ error: 'Image data required' })
    }

    console.log('🔍 Extracting VIN with OpenAI Vision...')

    // Extract base64 data if it includes data URL prefix
    const base64Image = image.replace(/^data:image\/[a-z]+;base64,/, '')

    // const response = await trackOpenAICall('vin-extraction', 'gpt-4o', () => 
    const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Extract the VIN (Vehicle Identification Number) from this image. 

                A VIN is exactly 17 characters long and contains:
                - Letters A-H, J-N, P, R-Z (no I, O, Q)
                - Numbers 0-9
                - Common locations: dashboard, door jamb, engine bay, registration documents

                Look for patterns like:
                - "VIN: 1HGBH41JXMN109186"
                - "VEHICLE IDENTIFICATION NUMBER"
                - 17-character alphanumeric codes

                Return ONLY the 17-character VIN code, nothing else.
                If multiple VINs are visible, return the clearest one.
                If no VIN is clearly visible, return "NOT_FOUND".`
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
        max_tokens: 50,
        temperature: 0.1
      })

    const extractedText = response.choices[0]?.message?.content?.trim() || ''
    console.log('🤖 Vision extracted:', extractedText)

    if (extractedText === 'NOT_FOUND' || !extractedText) {
      return res.status(200).json({
        success: false,
        vin: null,
        confidence: 0,
        message: 'No VIN detected in image'
      })
    }

    // Clean and validate the extracted VIN
    const cleanVIN = extractedText.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, '')
    const validation = validateVIN(cleanVIN)

    if (validation.valid) {
      const finalVIN = validation.corrected || cleanVIN
      console.log('✅ Valid VIN extracted:', finalVIN)
      
      return res.status(200).json({
        success: true,
        vin: finalVIN,
        confidence: validation.corrected ? 0.85 : 0.95, // Lower confidence if corrected
        validated: true,
        corrected: !!validation.corrected
      })
    } else {
      console.log('❌ Invalid VIN checksum:', cleanVIN)
      
      return res.status(200).json({
        success: false,
        vin: cleanVIN,
        confidence: 0.5,
        validated: false,
        message: 'VIN format appears incorrect - please verify manually'
      })
    }

  } catch (error) {
    console.error('VIN extraction error:', error)
    return res.status(500).json({
      error: 'Failed to extract VIN',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
