// Unified Vision Processing API
// Consolidates OCR and document processing into single endpoint with modes

import { NextApiRequest, NextApiResponse } from 'next'
import formidable from 'formidable'
import fs from 'fs'
import OpenAI from 'openai'
import { withValidation, validationSchemas } from '../../../lib/utils/api-validation'

// Import our modular vision processing functions
import { 
  extractServices, 
  categorizeService, 
  calculateNextService,
  tagServicesV1 
} from '../../../lib/vision/service-processor'

import {
  extractVendorWithPrecedence,
  extractMileageWithPatterns,
  parseOpenAIResponse
} from '../../../lib/vision/data-extractor'

import {
  rollupValidation,
  validateOdometerReading,
  classifyDocument,
  validateAndSanitizeAmounts
} from '../../../lib/vision/document-validator'

import {
  makeHumanSummary,
  generateDriverFocusedSummary
} from '../../../lib/vision/response-formatter'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Processing modes for unified endpoint
type ProcessingMode = 'ocr' | 'document' | 'auto'

interface VisionRequest {
  image: string
  mode: ProcessingMode
  document_type?: string
}

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('🔍 Unified vision processing request received')
    
    // Parse the uploaded file
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10MB limit
      keepExtensions: true,
    })

    const [fields, files] = await form.parse(req)
    
    // Extract processing parameters
    const mode = (Array.isArray(fields.mode) ? fields.mode[0] : fields.mode || 'auto') as ProcessingMode
    const documentType = Array.isArray(fields.document_type) ? fields.document_type[0] : fields.document_type
    
    console.log('📋 Processing mode:', mode, 'Document type:', documentType)

    // Handle file upload
    const file = Array.isArray(files.image) ? files.image[0] : files.image
    if (!file) {
      return res.status(400).json({ error: 'No image file provided' })
    }

    // Read and encode the image
    const imageBuffer = await fs.promises.readFile(file.filepath)
    const base64Image = imageBuffer.toString('base64')
    const mimeType = file.mimetype || 'image/jpeg'
    
    console.log(`📸 Image processed: ${Math.round(imageBuffer.length / 1024)}KB, type: ${mimeType}`)

    // Process based on mode
    const result = await processWithMode(base64Image, mimeType, mode, documentType)
    
    console.log('✅ Vision processing completed successfully')
    
    return res.status(200).json({
      success: true,
      data: result,
      metadata: {
        mode,
        document_type: documentType,
        processing_time: Date.now(),
        confidence: result.confidence || 0.8
      }
    })

  } catch (error) {
    console.error('❌ Vision processing error:', error)
    
    return res.status(500).json({
      success: false,
      error: 'Vision processing failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

async function processWithMode(
  base64Image: string, 
  mimeType: string, 
  mode: ProcessingMode,
  documentType?: string
) {
  switch (mode) {
    case 'ocr':
      return await processOCRMode(base64Image, mimeType, documentType)
    
    case 'document':
      return await processDocumentMode(base64Image, mimeType, documentType)
    
    case 'auto':
      // Try document mode first, fall back to OCR if needed
      try {
        return await processDocumentMode(base64Image, mimeType, documentType)
      } catch (error) {
        console.warn('Document mode failed, falling back to OCR:', error)
        return await processOCRMode(base64Image, mimeType, documentType)
      }
    
    default:
      throw new Error(`Unknown processing mode: ${mode}`)
  }
}

async function processOCRMode(base64Image: string, mimeType: string, documentType?: string) {
  console.log('🔤 Processing in OCR mode')
  
  const prompt = generateOCRPrompt(documentType)
  
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini", // Use cheaper model for simple OCR
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          {
            type: "image_url",
            image_url: { url: `data:${mimeType};base64,${base64Image}` }
          }
        ]
      }
    ],
    max_tokens: 500, // Limit tokens for OCR
    temperature: 0.1
  })

  const content = response.choices[0]?.message?.content
  if (!content) {
    throw new Error('No response from OpenAI Vision API')
  }

  // For OCR mode, return simple extracted text
  return {
    mode: 'ocr',
    extracted_text: content,
    confidence: 0.8,
    processing_type: 'text_extraction'
  }
}

async function processDocumentMode(base64Image: string, mimeType: string, documentType?: string) {
  console.log('📄 Processing in document mode')
  
  const prompt = generateDocumentPrompt(documentType)
  
  const response = await openai.chat.completions.create({
    model: "gpt-4o", // Use full model for document understanding
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          {
            type: "image_url",
            image_url: { url: `data:${mimeType};base64,${base64Image}` }
          }
        ]
      }
    ],
    max_tokens: 2000,
    temperature: 0.1
  })

  const content = response.choices[0]?.message?.content
  if (!content) {
    throw new Error('No response from OpenAI Vision API')
  }

  const visionResult = parseOpenAIResponse(content)
  
  // Apply full modular processing pipeline with error boundaries
  return await processWithErrorBoundaries(visionResult, documentType)
}

async function processWithErrorBoundaries(visionResult: any, documentType?: string) {
  const result = { ...visionResult }
  const warnings = []
  
  try {
    // Step 1: Validate and sanitize (critical)
    Object.assign(result, validateAndSanitizeAmounts(visionResult))
  } catch (error) {
    throw new Error(`Critical validation failed: ${error.message}`)
  }
  
  try {
    // Step 2: Extract vendor (non-critical)
    const vendor = extractVendorWithPrecedence(result)
    result.vendor_name = vendor
  } catch (error) {
    warnings.push(`Vendor extraction failed: ${error.message}`)
    result.vendor_name = 'Unknown Vendor'
  }
  
  try {
    // Step 3: Extract mileage (non-critical)
    const mileage = extractMileageWithPatterns(result)
    if (mileage) {
      const validatedOdometer = validateOdometerReading({ odometer_reading: mileage })
      result.odometer_reading = validatedOdometer?.value || mileage
      result.odometer_confidence = validatedOdometer?.confidence || 0.5
    }
  } catch (error) {
    warnings.push(`Mileage extraction failed: ${error.message}`)
  }
  
  try {
    // Step 4: Process services (non-critical, service documents only)
    if (documentType === 'service_invoice' || result.service_description) {
      const services = tagServicesV1(result)
      result.services = services
      result.service_category = categorizeService(services, result.service_description || '')
      
      if (result.odometer_reading) {
        result.next_service_mileage = calculateNextService(
          services, 
          result.odometer_reading, 
          result.service_category
        )
      }
    }
  } catch (error) {
    warnings.push(`Service processing failed: ${error.message}`)
  }
  
  try {
    // Step 5: Generate summary (non-critical)
    result.summary = makeHumanSummary(
      result,
      result.vendor_name,
      result.services || [],
      result.odometer_reading
    )
    
    result.display = generateDriverFocusedSummary(result)
  } catch (error) {
    warnings.push(`Summary generation failed: ${error.message}`)
    result.summary = 'Document processed'
  }
  
  // Add validation rollup
  try {
    const validation = rollupValidation(result.validation || {})
    result.validation_status = validation.rollup
    result.confidence = calculateOverallConfidence(result, warnings)
  } catch (error) {
    warnings.push(`Validation rollup failed: ${error.message}`)
    result.confidence = 0.5
  }
  
  // Include warnings for debugging
  if (warnings.length > 0) {
    result.processing_warnings = warnings
  }
  
  return result
}

function generateOCRPrompt(documentType?: string): string {
  const basePrompt = "Extract all visible text from this image. Return the text as clearly as possible, preserving structure where relevant."
  
  switch (documentType) {
    case 'odometer':
      return "Extract the mileage reading from this odometer display. Return only the numeric value."
    
    case 'license_plate':
      return "Extract the license plate number from this image. Return only the plate number."
    
    case 'vin':
      return "Extract the VIN (Vehicle Identification Number) from this image. Return only the 17-character VIN."
    
    default:
      return basePrompt
  }
}

function generateDocumentPrompt(documentType?: string): string {
  const basePrompt = `Analyze this document and extract key information. Return a JSON object with relevant fields.`
  
  switch (documentType) {
    case 'service_invoice':
      return `${basePrompt}
Focus on: vendor_name, service_description, total_amount, date, odometer_reading, line_items.
Return structured JSON with these fields.`

    case 'fuel_receipt':
      return `${basePrompt}
Focus on: station_name, total_amount, gallons, price_per_gallon, date, odometer_reading.
Return structured JSON with these fields.`

    case 'insurance_card':
      return `${basePrompt}
Focus on: insurance_company, policy_number, effective_date, expiration_date, coverage_limits.
Return structured JSON with these fields.`

    default:
      return `${basePrompt}
Extract the most relevant information and return as structured JSON.`
  }
}

function calculateOverallConfidence(result: any, warnings: string[]): number {
  let confidence = 0.9
  
  // Reduce confidence for each warning
  confidence -= warnings.length * 0.1
  
  // Boost confidence for successful extractions
  if (result.vendor_name && result.vendor_name !== 'Unknown Vendor') confidence += 0.05
  if (result.total_amount && typeof result.total_amount === 'number') confidence += 0.05
  if (result.odometer_reading) confidence += 0.05
  if (result.date) confidence += 0.05
  
  return Math.max(0.1, Math.min(1.0, confidence))
}
