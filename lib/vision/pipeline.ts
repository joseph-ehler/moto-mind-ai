// Vision Processing Pipeline
// Orchestrates the complete vision processing workflow

import { VisionRequest, VisionResult, ProcessingContext, DocumentType } from './types'
import { openaiVisionClient } from './clients/openai'
import { parseOpenAIResponse, sanitizeExtractedData } from './parsers/openai-json'
import { generateOCRPrompt, generateDocumentPrompt } from './prompts'
import { processDashboardSnapshot } from './processors/dashboard'
import { processServiceInvoice } from './processors/service'
import { processFuelReceipt } from './processors/fuel'
import { processInsuranceCard } from './processors/insurance'
import { makeHumanSummary } from './formatters/summary'
import { calculateOverallConfidence } from './formatters/confidence'

/**
 * Main processing pipeline that orchestrates the complete workflow
 */
export async function processDocument(request: VisionRequest): Promise<VisionResult> {
  const startTime = performance.now()
  
  try {
    // Step 1: Generate appropriate prompt
    const prompt = generatePrompt(request.mode, request.document_type)
    
    // Runtime verification and debugging - LOG FOR ALL TYPES NOW
    console.log(`🔍 ${request.document_type} prompt preview:`, prompt.substring(0, 500))
    
    if (request.document_type === 'fuel_receipt') {
      console.log('✅ Contains transaction_id field:', prompt.includes('transaction_id'))
      console.log('✅ Contains auth_code field:', prompt.includes('auth_code'))
      console.log('✅ Contains station_address field:', prompt.includes('station_address'))
      console.log('✅ Contains invoice_number field:', prompt.includes('invoice_number'))
      
      // Log full prompt for fuel receipts
      console.log('📋 FULL FUEL_RECEIPT PROMPT SENT TO GPT-4O:')
      console.log('=' .repeat(80))
      console.log(prompt)
      console.log('=' .repeat(80))
    }
    
    if (request.document_type === 'dashboard_snapshot') {
      console.log('✅ Contains few-shot examples:', prompt.includes('FEW-SHOT EXAMPLES'))
      console.log('✅ Contains km conversion example:', prompt.includes('499 km'))
      console.log('✅ Contains temperature disambiguation:', prompt.includes('72°F'))
      
      // Log full prompt for analysis
      console.log('📋 FULL PROMPT SENT TO GPT-4O:')
      console.log('=' .repeat(80))
      console.log(prompt)
      console.log('=' .repeat(80))
    }
    
    // Step 2: Call OpenAI Vision API (GPT-4o working, GPT-5 ready when SDK supports it)
    const visionResponse = await openaiVisionClient.vision({
      prompt,
      image: request.image,
      mimeType: request.mimeType,
      model: 'gpt-4o', // Back to working GPT-4o
      maxTokens: 1500,
      temperature: 0
    })
    
    // Step 3: Log raw response for analysis
    if (request.document_type === 'fuel_receipt' || request.document_type === 'dashboard_snapshot') {
      console.log(`\n🤖 RAW GPT-4O RESPONSE for ${request.document_type}:`)
      console.log('=' .repeat(80))
      console.log(visionResponse.content)
      console.log('=' .repeat(80))
      console.log('📊 Response metadata:', {
        model: visionResponse.model,
        inputTokens: visionResponse.inputTokens,
        outputTokens: visionResponse.outputTokens,
        processingMs: visionResponse.processingMs
      })
    }
    
    if (request.document_type === 'dashboard_snapshot') {
      
      // Save raw response to file for analysis
      const fs = require('fs')
      const path = require('path')
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const debugPath = path.join(process.cwd(), 'training-data', 'dashboards', 'debug-responses')
      
      if (!fs.existsSync(debugPath)) {
        fs.mkdirSync(debugPath, { recursive: true })
      }
      
      const debugFile = path.join(debugPath, `raw-response-${timestamp}.txt`)
      fs.writeFileSync(debugFile, `PROMPT SENT:\n${prompt}\n\nRAW RESPONSE:\n${visionResponse.content}\n\nMETADATA:\n${JSON.stringify({
        model: visionResponse.model,
        inputTokens: visionResponse.inputTokens,
        outputTokens: visionResponse.outputTokens,
        processingMs: visionResponse.processingMs
      }, null, 2)}`)
      
      console.log(`💾 Debug response saved to: ${debugFile}`)
    }
    
    // Step 4: Parse and sanitize response
    const parsedResponse = parseOpenAIResponse(visionResponse.content)
    const sanitizedData = sanitizeExtractedData(parsedResponse.data)
    
    if (request.document_type === 'dashboard_snapshot') {
      console.log('🔧 PARSED DATA:')
      console.log(JSON.stringify(sanitizedData, null, 2))
    }
    
    // Step 4: Enrich and validate based on document type
    const enrichedResult = await enrichAndValidate(sanitizedData, request.document_type)
    
    // Step 5: Generate final summary and confidence
    const summary = enrichedResult.summary || makeHumanSummary(sanitizedData, request.document_type)
    const confidence = enrichedResult.confidence || calculateOverallConfidence(sanitizedData)
    
    // Step 6: Build final result
    const processingMs = Math.round(performance.now() - startTime)
    
    return {
      type: request.document_type || inferDocumentType(sanitizedData),
      summary,
      key_facts: enrichedResult.key_facts || extractKeyFacts(sanitizedData),
      validation: enrichedResult.validation || { rollup: 'ok' },
      confidence,
      processing_metadata: {
        model_version: visionResponse.model,
        prompt_hash: generatePromptHash(request.mode, request.document_type),
        processing_ms: processingMs,
        input_tokens: visionResponse.inputTokens,
        output_tokens: visionResponse.outputTokens
      },
      raw_extraction: sanitizedData
    }
    
  } catch (error) {
    throw new Error(`Pipeline processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Generates appropriate prompt based on mode and document type
 */
function generatePrompt(mode: string, documentType?: DocumentType): string {
  if (mode === 'ocr') {
    return generateOCRPrompt(documentType)
  }
  
  if (mode === 'document' && documentType) {
    return generateDocumentPrompt(documentType)
  }
  
  // Auto mode - use document prompt if type is known, otherwise OCR
  if (documentType) {
    return generateDocumentPrompt(documentType)
  }
  
  return generateOCRPrompt()
}

/**
 * Enriches and validates data based on document type
 */
async function enrichAndValidate(data: any, documentType?: DocumentType): Promise<{
  key_facts: any
  summary: string
  validation: any
  confidence: number
}> {
  if (!documentType) {
    // Generic processing for unknown document types
    return {
      key_facts: extractKeyFacts(data),
      summary: makeHumanSummary(data),
      validation: { rollup: 'ok' },
      confidence: 0.7
    }
  }
  
  switch (documentType) {
    case 'dashboard_snapshot':
      const dashboardResult = processDashboardSnapshot(data)
      return {
        key_facts: dashboardResult.enrichedData.key_facts,
        summary: dashboardResult.enrichedData.summary,
        validation: dashboardResult.enrichedData.validation,
        confidence: dashboardResult.confidence
      }
    
    case 'service_invoice':
      const serviceResult = processServiceInvoice(data)
      return {
        key_facts: serviceResult.enrichedData.key_facts,
        summary: serviceResult.enrichedData.summary,
        validation: serviceResult.enrichedData.validation,
        confidence: serviceResult.confidence
      }
    
    case 'fuel_receipt':
      const fuelResult = processFuelReceipt(data)
      return {
        key_facts: fuelResult.enrichedData.key_facts,
        summary: fuelResult.enrichedData.summary,
        validation: fuelResult.enrichedData.validation,
        confidence: fuelResult.confidence
      }
    
    case 'insurance_card':
      const insuranceResult = processInsuranceCard(data)
      return {
        key_facts: insuranceResult.enrichedData.key_facts,
        summary: insuranceResult.enrichedData.summary,
        validation: insuranceResult.enrichedData.validation,
        confidence: insuranceResult.confidence
      }
    
    default:
      return {
        key_facts: extractKeyFacts(data),
        summary: makeHumanSummary(data, documentType),
        validation: { rollup: 'ok' },
        confidence: 0.7
      }
  }
}

/**
 * Infers document type from extracted data
 */
function inferDocumentType(data: any): DocumentType {
  // Dashboard snapshot indicators
  if (data.odometer_miles && (data.fuel_level || data.warning_lights)) {
    return 'dashboard_snapshot'
  }
  
  // Fuel receipt indicators - ENHANCED to check extracted text
  const extractedText = data.extracted_text || ''
  const hasFuelKeywords = extractedText.toUpperCase().includes('FUEL') || 
                         extractedText.toUpperCase().includes('GALLON') ||
                         extractedText.toUpperCase().includes('GAL ')
  
  if (data.gallons || data.price_per_gallon || data.station_name || hasFuelKeywords) {
    return 'fuel_receipt'
  }
  
  // Service invoice indicators
  if (data.service_description || data.line_items || 
      (data.vendor_name && data.total_amount && !data.gallons)) {
    return 'service_invoice'
  }
  
  // Insurance card indicators
  if (data.policy_number || data.insurance_company) {
    return 'insurance_card'
  }
  
  // Odometer reading
  if (data.odometer_miles && !data.fuel_level && !data.warning_lights) {
    return 'odometer'
  }
  
  return 'service_invoice' // Default fallback
}

/**
 * Extracts key facts for display
 */
function extractKeyFacts(data: any): Record<string, any> {
  const keyFacts: Record<string, any> = {}
  
  // Common fields that are always interesting
  const importantFields = [
    'vendor_name', 'business_name', 'station_name',
    'total_amount', 'amount', 'cost',
    'date', 'service_date',
    'odometer_miles', 'mileage',
    'gallons', 'fuel_type', 'price_per_gallon',
    'service_description', 'description',
    'policy_number', 'insurance_company',
    // RICH FUEL RECEIPT DATA
    'station_address', 'address', 'location',
    'transaction_id', 'tran_number', 'tran_id',
    'invoice_number', 'invoice', 'receipt_number',
    'auth_code', 'auth', 'authorization',
    'transaction_time', 'time',
    'pump_number', 'pump',
    'payment_method', 'payment', 'card',
    'card_last_four',
    'entry_method',
    'site_id', 'site',
    'trace_id', 'trace',
    'merchant_id', 'merchant',
    // EMV CODES
    'aid', 'tvr', 'iad', 'tsi', 'arc',
    // FUEL GAUGE DATA
    'fuel_level', 'percentage', 'level',
    'indicator_position', 'low_fuel_warning',
    'bars_filled', 'total_bars',
    // PRODUCT LABEL DATA
    'brand', 'product_name', 'product_type',
    'size', 'quantity', 'purpose',
    'ingredients', 'warnings'
  ]
  
  for (const field of importantFields) {
    if (data[field] !== null && data[field] !== undefined && data[field] !== '') {
      keyFacts[field] = data[field]
    }
  }
  
  // Include nested extracted_data fields
  if (data.extracted_data && typeof data.extracted_data === 'object') {
    for (const field of importantFields) {
      if (data.extracted_data[field] !== null && 
          data.extracted_data[field] !== undefined && 
          data.extracted_data[field] !== '') {
        keyFacts[field] = data.extracted_data[field]
      }
    }
  }
  
  return keyFacts
}

/**
 * Generates a hash for the prompt to track changes
 */
function generatePromptHash(mode: string, documentType?: DocumentType): string {
  const identifier = `${mode}_${documentType || 'generic'}_v1`
  return identifier
}

/**
 * Simple OCR processing for basic text extraction
 */
export async function processOCR(request: VisionRequest): Promise<{
  extracted_text: string
  confidence: number
  processing_ms: number
}> {
  const startTime = performance.now()
  
  const prompt = generateOCRPrompt(request.document_type)
  
  const visionResponse = await openaiVisionClient.vision({
    prompt,
    image: request.image,
    mimeType: request.mimeType,
    model: 'gpt-4o',
    maxTokens: 1000,
    temperature: 0
  })
  
  const parsedResponse = parseOpenAIResponse(visionResponse.content)
  const processingMs = Math.round(performance.now() - startTime)
  
  return {
    extracted_text: parsedResponse.data.extracted_text || visionResponse.content,
    confidence: parsedResponse.confidence,
    processing_ms: processingMs
  }
}
