/**
 * Vision Processing API - JSON Endpoint
 * 
 * Real vision processing with OpenAI Vision API
 * Accepts JSON with base64 images (already preprocessed by client)
 */

import { NextApiRequest, NextApiResponse } from 'next'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    })
  }

  const start = performance.now()

  try {
    const { image, type, vehicleId, metadata, customPrompt } = req.body
    
    // Validate request
    if (!image || !type) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: image and type'
      })
    }
    
    // Validate image format
    if (!image.startsWith('data:image/')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid image format: must be base64 data URL'
      })
    }
    
    console.log(`[Vision API] Processing ${type} image...`)
    
    // Call OpenAI Vision API for OCR
    // Use custom prompt if provided, otherwise use default for type
    const prompt = customPrompt || getPromptForType(type)
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt
            },
            {
              type: 'image_url',
              image_url: {
                url: image,
                detail: 'high'
              }
            }
          ]
        }
      ],
      max_tokens: 500,
      temperature: 0.2
    })
    
    const extractedText = response.choices[0]?.message?.content || ''
    console.log(`[Vision API] Raw OCR text:`, extractedText)
    
    // Parse extracted data based on type
    const data = parseExtractedData(type, extractedText)
    console.log(`[Vision API] Parsed data:`, data)
    
    const processingTime = Math.round(performance.now() - start)
    
    // Calculate confidence based on response
    const confidence = calculateConfidence(extractedText, type)
    
    return res.status(200).json({
      success: true,
      data,
      confidence,
      raw_text: extractedText,
      processed_at: new Date().toISOString(),
      processing_time_ms: processingTime
    })
    
  } catch (error) {
    console.error('[Vision API] Error:', error)
    
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Processing failed'
    })
  }
}

/**
 * Get appropriate prompt for vision type
 */
function getPromptForType(type: string): string {
  const prompts: Record<string, string> = {
    'vin': `You are a VIN extraction expert. Extract the Vehicle Identification Number (VIN) from this image.

IMPORTANT RULES:
- A VIN is EXACTLY 17 characters long
- Valid characters: Numbers 0-9 and capital letters A-H, J-N, P, R-Z (excludes I, O, Q)
- Common VIN locations: dashboard plate, door jamb sticker, windshield
- VINs often appear in sections like: 1HGBH41JXMN109186 or split across lines

INSTRUCTIONS:
1. Carefully scan the entire image for any 17-character alphanumeric sequence
2. If you find multiple candidates, choose the one that looks most like a VIN plate
3. Return ONLY the 17 characters with no spaces, dashes, or other formatting
4. If you cannot find a valid 17-character VIN, return "NOT_FOUND"

Examples of valid VINs:
- 1HGBH41JXMN109186
- 5YJSA1E26HF199542
- 3GNAL4EK7DS559435

Your response should be ONLY the VIN or "NOT_FOUND".`,
    
    'license-plate': `Extract the license plate number and state from this image.
Return in format: "PLATE_NUMBER|STATE" (e.g., "ABC1234|CA").
If not visible, return "NOT_FOUND".`,
    
    'odometer': `Extract the odometer reading from this image.
Return only the numeric value in miles or kilometers.
If not visible, return "NOT_FOUND".`
  }
  
  return prompts[type] || 'Extract all visible text from this image.'
}

/**
 * Parse extracted text into structured data
 */
function parseExtractedData(type: string, text: string): any {
  if (text === 'NOT_FOUND' || !text.trim()) {
    return { error: 'No data could be extracted from image' }
  }
  
  switch (type) {
    case 'vin':
      // Remove all whitespace and special characters for better matching
      const cleanText = text.replace(/[\s\-_]/g, '')
      
      // Extract 17-character VIN (excluding I, O, Q)
      const vinMatch = cleanText.match(/[A-HJ-NPR-Z0-9]{17}/i)
      if (vinMatch) {
        const extractedVIN = vinMatch[0].toUpperCase()
        console.log(`[VIN Parser] Found VIN: ${extractedVIN}`)
        return {
          vin: extractedVIN,
          location: 'detected',
          character_quality: 'good'
        }
      }
      
      // Fallback: try to extract any alphanumeric sequence close to 17 chars
      const possibleVIN = cleanText.match(/[A-HJ-NPR-Z0-9]{15,19}/i)
      if (possibleVIN) {
        console.warn(`[VIN Parser] Found possible VIN (non-standard length): ${possibleVIN[0]}`)
        return {
          vin: possibleVIN[0].toUpperCase().substring(0, 17),
          location: 'detected',
          character_quality: 'fair'
        }
      }
      
      console.error(`[VIN Parser] No VIN found in text: "${text}"`)
      return { error: 'No valid VIN found in image' }
      
    case 'license-plate':
      const parts = text.split('|')
      return {
        plate: parts[0] || text,
        state: parts[1] || 'UNKNOWN',
        location: 'detected'
      }
      
    case 'odometer':
      const numberMatch = text.match(/[\d,]+/)
      if (numberMatch) {
        const reading = parseInt(numberMatch[0].replace(/,/g, ''))
        return {
          reading,
          unit: 'miles',
          location: 'dashboard'
        }
      }
      return { error: 'No odometer reading found' }
      
    default:
      return { text }
  }
}

/**
 * Calculate confidence score
 */
function calculateConfidence(text: string, type: string): number {
  if (text === 'NOT_FOUND' || !text.trim()) {
    return 0
  }
  
  // Base confidence
  let confidence = 0.85
  
  // Type-specific adjustments
  if (type === 'vin') {
    // VINs have strict format - high confidence if matched
    if (/[A-HJ-NPR-Z0-9]{17}/i.test(text)) {
      confidence = 0.95
    } else {
      confidence = 0.6
    }
  }
  
  return Math.min(confidence, 0.99)
}
