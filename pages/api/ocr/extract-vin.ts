// MotoMindAI: VIN Extraction API
// Combines Tesseract OCR and OpenAI Vision for reliable VIN detection

import { NextApiRequest, NextApiResponse } from 'next'
import formidable from 'formidable'
import fs from 'fs'
import Tesseract from 'tesseract.js'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Disable default body parser to handle multipart/form-data
export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
    externalResolver: true,
  },
  maxDuration: 60, // Vercel: Allow up to 60 seconds
}

// VIN validation regex (17 characters, no I, O, Q)
const VIN_REGEX = /^[A-HJ-NPR-Z0-9]{17}$/

function validateVIN(vin: string): boolean {
  const cleanVIN = vin.toUpperCase().replace(/[^A-Z0-9]/g, '')
  
  // Basic format check
  if (!VIN_REGEX.test(cleanVIN)) {
    return false
  }
  
  // Additional validation: VIN should not be all the same character
  const uniqueChars = new Set(cleanVIN.split(''))
  if (uniqueChars.size < 5) {
    console.log('❌ VIN rejected: too few unique characters')
    return false
  }
  
  // VIN should not be sequential numbers/letters
  const isSequential = cleanVIN.split('').every((char, i) => {
    if (i === 0) return true
    const prevChar = cleanVIN[i - 1]
    const currentCode = char.charCodeAt(0)
    const prevCode = prevChar.charCodeAt(0)
    return Math.abs(currentCode - prevCode) <= 1
  })
  
  if (isSequential) {
    console.log('❌ VIN rejected: appears to be sequential')
    return false
  }
  
  return true
}

function extractVINFromText(text: string): string | null {
  // Remove common OCR errors and clean text
  const cleanText = text
    .toUpperCase()
    .replace(/[IL1]/g, '1')  // Common OCR confusion
    .replace(/[O0]/g, '0')   // Common OCR confusion
    .replace(/[^A-Z0-9\s]/g, '') // Remove special characters
  
  // Look for 17-character sequences
  const words = cleanText.split(/\s+/)
  
  for (const word of words) {
    if (word.length === 17 && validateVIN(word)) {
      return word
    }
  }
  
  // Try to find VIN in continuous text
  const matches = cleanText.match(/[A-HJ-NPR-Z0-9]{17}/g)
  if (matches) {
    for (const match of matches) {
      if (validateVIN(match)) {
        return match
      }
    }
  }
  
  return null
}

async function extractVINWithTesseract(imagePath: string): Promise<{ vin: string | null, confidence: number }> {
  try {
    const { data: { text, confidence } } = await Tesseract.recognize(imagePath, 'eng', {
      logger: () => {}, // Disable logging
    })
    
    const vin = extractVINFromText(text)
    return { vin, confidence: vin ? confidence : 0 }
  } catch (error) {
    console.error('Tesseract error:', error)
    return { vin: null, confidence: 0 }
  }
}

async function extractVINWithOpenAI(imagePath: string): Promise<{ vin: string | null, confidence: number }> {
  try {
    // Convert image to base64
    const imageBuffer = fs.readFileSync(imagePath)
    const base64Image = imageBuffer.toString('base64')
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `CRITICAL: You are analyzing a photo to find a Vehicle Identification Number (VIN). You must be EXTREMELY STRICT and ONLY return a VIN if you can clearly see actual text/numbers in the image.

STRICT REQUIREMENTS:
- VIN must be EXACTLY 17 characters
- Must contain only: A-Z (except I, O, Q) and 0-9
- Must be CLEARLY VISIBLE text in the image
- NO GUESSING or MAKING UP numbers
- If you cannot see clear, readable text that forms a 17-character VIN, return "NOT_FOUND"

DO NOT:
- Generate fictional VINs
- Guess based on partial text
- Return anything if the image is blurry, dark, or unclear
- Make up numbers when you can't see them clearly

ONLY return a VIN if you can see ALL 17 characters clearly printed/etched in the image.

If you find a valid VIN that you can actually READ in the image, return ONLY the 17 characters.
If you cannot clearly see a complete 17-character VIN in the image, return "NOT_FOUND".

No explanations, just the VIN or "NOT_FOUND".`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
                detail: "high"
              }
            }
          ]
        }
      ],
      max_tokens: 50,
      temperature: 0.1,
    })

    const extractedText = response.choices[0]?.message?.content?.trim()
    
    if (!extractedText || extractedText === 'NOT_FOUND') {
      return { vin: null, confidence: 0 }
    }
    
    const cleanVIN = extractedText.toUpperCase().replace(/[^A-Z0-9]/g, '')
    
    if (validateVIN(cleanVIN)) {
      return { vin: cleanVIN, confidence: 95 }
    }
    
    return { vin: null, confidence: 0 }
  } catch (error) {
    console.error('OpenAI Vision error:', error)
    return { vin: null, confidence: 0 }
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  console.log('🔍 VIN extraction API called')
  console.log('Content-Type:', req.headers['content-type'])

  try {
    // Parse multipart form data
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10MB limit
      keepExtensions: true,
    })

    console.log('📝 Parsing form data...')
    const [fields, files] = await form.parse(req)
    console.log('📁 Files received:', Object.keys(files))
    console.log('📋 Fields received:', Object.keys(fields))
    
    const imageFile = Array.isArray(files.image) ? files.image[0] : files.image

    if (!imageFile) {
      console.log('❌ No image file found in request')
      return res.status(400).json({ 
        error: 'No image file provided',
        debug: {
          filesReceived: Object.keys(files),
          fieldsReceived: Object.keys(fields)
        }
      })
    }

    console.log('✅ Image file found:', imageFile.originalFilename, 'Size:', imageFile.size)

    const imagePath = imageFile.filepath

    // Try Tesseract first (faster)
    console.log('🔍 Extracting VIN with Tesseract...')
    const tesseractResult = await extractVINWithTesseract(imagePath)
    
    if (tesseractResult.vin && tesseractResult.confidence > 70) {
      // Clean up temp file
      fs.unlinkSync(imagePath)
      
      return res.status(200).json({
        success: true,
        vin: tesseractResult.vin,
        confidence: tesseractResult.confidence / 100, // Convert to 0-1 scale
        source: 'tesseract',
        message: 'VIN extracted successfully'
      })
    }

    // Fallback to OpenAI Vision if Tesseract fails or has low confidence
    console.log('🔍 Fallback to OpenAI Vision...')
    const openaiResult = await extractVINWithOpenAI(imagePath)
    
    // Clean up temp file
    fs.unlinkSync(imagePath)
    
    if (openaiResult.vin) {
      return res.status(200).json({
        success: true,
        vin: openaiResult.vin,
        confidence: openaiResult.confidence / 100, // Convert to 0-1 scale
        source: 'openai_vision',
        message: 'VIN extracted successfully'
      })
    }

    // No VIN found with either method
    return res.status(400).json({
      success: false,
      error: 'Could not extract VIN from image',
      message: 'Please ensure the VIN is clearly visible and try again',
      suggestions: [
        'Make sure the VIN plate is well-lit',
        'Hold the camera steady and get close',
        'Remove any glare or shadows',
        'Try a different angle'
      ]
    })

  } catch (error) {
    console.error('VIN extraction error:', error)
    
    return res.status(500).json({
      success: false,
      error: 'Failed to process image',
      message: 'An error occurred while processing your image. Please try again.',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
