// Refactored Vision Processing API
// Modular, maintainable vision processing with focused responsibilities

import { NextApiRequest, NextApiResponse } from 'next'
import formidable from 'formidable'
import fs from 'fs'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'

// Import our modular vision processing functions
import { 
  extractServices, 
  categorizeService, 
  calculateNextService,
  normalizeServices,
  tagServicesV1 
} from '../../../lib/vision/service-processor'

import {
  extractVendorWithPrecedence,
  normalizeVendorName,
  extractMileageWithPatterns,
  parseOpenAIResponse,
  normalizeFuelStation
} from '../../../lib/vision/data-extractor'

import {
  rollupValidation,
  validateOdometerReading,
  classifyDocument,
  validateAndSanitizeAmounts
} from '../../../lib/vision/document-validator'

import {
  makeHumanSummary,
  generateDriverFocusedSummary,
  generateEnhancedFields
} from '../../../lib/vision/response-formatter'

// Import tier1 processors
import { processRepair, processInsurance, processAccident } from '../../../lib/vision/tier1-processors'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

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
    console.log('🔍 Vision processing request received')
    
    // Parse the uploaded file
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10MB limit
      keepExtensions: true,
    })

    const [fields, files] = await form.parse(req)
    const captureType = Array.isArray(fields.captureType) ? fields.captureType[0] : fields.captureType || 'service_invoice'
    
    console.log('📋 Capture type:', captureType)

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

    // Process with OpenAI Vision API
    const visionResult = await processWithVisionAPI(base64Image, mimeType, captureType)
    
    // Apply modular processing
    const processedResult = await applyModularProcessing(visionResult, captureType)
    
    // Generate driver-focused response
    const driverResponse = generateDriverResponse(processedResult, captureType)
    
    console.log('✅ Vision processing completed successfully')
    
    return res.status(200).json({
      success: true,
      data: driverResponse,
      metadata: {
        captureType,
        processingTime: Date.now(),
        confidence: processedResult.validation?.confidence || 0.8
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

async function processWithVisionAPI(base64Image: string, mimeType: string, captureType: string) {
  const prompt = generatePromptForCaptureType(captureType)
  
  console.log('🤖 Calling OpenAI Vision API...')
  
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: prompt
          },
          {
            type: "image_url",
            image_url: {
              url: `data:${mimeType};base64,${base64Image}`
            }
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

  return parseOpenAIResponse(content)
}

function generatePromptForCaptureType(captureType: string): string {
  const basePrompt = `Analyze this document and extract key information. Return a JSON object with the following structure:`
  
  switch (captureType) {
    case 'service_invoice':
      return `${basePrompt}
{
  "vendor_name": "Business name",
  "service_description": "What work was performed",
  "total_amount": 123.45,
  "date": "YYYY-MM-DD",
  "odometer_reading": 50000,
  "line_items": [{"description": "Service item", "amount": 50.00}],
  "work_performed": "Detailed work description"
}

Focus on extracting accurate service details, vendor information, and mileage readings.`

    case 'fuel_receipt':
      return `${basePrompt}
{
  "station_name": "Gas station name",
  "total_amount": 45.67,
  "gallons": 12.5,
  "price_per_gallon": 3.65,
  "date": "YYYY-MM-DD",
  "odometer_reading": 50000,
  "fuel_type": "Regular/Premium/Diesel"
}

Focus on fuel purchase details and mileage if visible.`

    case 'odometer_reading':
      return `${basePrompt}
{
  "odometer_reading": 50000,
  "date": "YYYY-MM-DD",
  "notes": "Any additional context"
}

Focus specifically on extracting the mileage reading from the odometer display.`

    default:
      return `${basePrompt}
{
  "document_type": "Type of document",
  "vendor_name": "Business name if applicable",
  "total_amount": 123.45,
  "date": "YYYY-MM-DD",
  "key_details": "Important information extracted"
}

Extract the most relevant information from this document.`
  }
}

async function applyModularProcessing(visionResult: any, captureType: string) {
  console.log('🔧 Applying modular processing...')
  
  // Step 1: Validate and sanitize amounts
  const sanitized = validateAndSanitizeAmounts(visionResult)
  
  // Step 2: Extract and normalize vendor information
  const vendor = extractVendorWithPrecedence(sanitized)
  const normalizedVendor = normalizeVendorName(vendor)
  
  // Step 3: Extract mileage with advanced patterns
  const mileage = extractMileageWithPatterns(sanitized)
  const validatedOdometer = mileage ? validateOdometerReading({ odometer_reading: mileage }) : null
  
  // Step 4: Process services (for service invoices)
  let services = []
  let serviceCategory = null
  let nextServiceMileage = null
  
  if (captureType === 'service_invoice') {
    services = tagServicesV1(sanitized)
    serviceCategory = categorizeService(services, sanitized.service_description || '')
    nextServiceMileage = mileage ? calculateNextService(services, mileage, serviceCategory) : null
  }
  
  // Step 5: Classify document and validate
  const classification = classifyDocument(sanitized)
  const validation = rollupValidation(sanitized.validation || {})
  
  // Step 6: Generate enhanced fields
  const enhanced = generateEnhancedFields(sanitized, captureType)
  
  return {
    ...sanitized,
    vendor_name: normalizedVendor,
    odometer_reading: validatedOdometer?.value || mileage,
    services,
    service_category: serviceCategory,
    next_service_mileage: nextServiceMileage,
    document_classification: classification,
    validation: {
      ...validation,
      odometer: validatedOdometer
    },
    enhanced
  }
}

function generateDriverResponse(processedResult: any, captureType: string) {
  console.log('📋 Generating driver-focused response...')
  
  // Generate human-readable summary
  const summary = makeHumanSummary(
    processedResult,
    processedResult.vendor_name,
    processedResult.services || [],
    processedResult.odometer_reading
  )
  
  // Generate driver-focused display data
  const driverSummary = generateDriverFocusedSummary(processedResult)
  
  // Create clean response structure
  const response = {
    // Primary display information
    summary,
    display: driverSummary,
    
    // Key extracted data
    vendor: processedResult.vendor_name,
    amount: processedResult.total_amount,
    date: processedResult.date,
    mileage: processedResult.odometer_reading,
    
    // Service-specific data
    ...(captureType === 'service_invoice' && {
      services: processedResult.services,
      service_category: processedResult.service_category,
      next_service_due: processedResult.next_service_mileage
    }),
    
    // Fuel-specific data
    ...(captureType === 'fuel_receipt' && {
      gallons: processedResult.gallons,
      price_per_gallon: processedResult.price_per_gallon,
      station: processedResult.station_name || processedResult.vendor_name
    }),
    
    // Validation and confidence
    confidence: processedResult.validation?.confidence || 0.8,
    validation_status: processedResult.validation?.rollup || 'ok',
    
    // Full data for debugging (admin only)
    _raw: process.env.NODE_ENV === 'development' ? processedResult : undefined
  }
  
  return response
}
