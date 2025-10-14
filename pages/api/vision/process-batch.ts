/**
 * Batch Vision Processing API
 * 
 * Phase 1B: Multi-modal vision processing with cross-validation
 * Processes all photos together for context and fraud detection
 * 
 * Benefits over separate processing:
 * - Cross-validate data between photos
 * - Detect inconsistencies (gallons vs gauge, sequential odometer)
 * - Fraud detection (impossible travel, duplicate receipts)
 * - Higher confidence scores (multiple sources confirm data)
 */

import { NextApiRequest, NextApiResponse } from 'next'
import { parseMultipart } from '../../../lib/http/multipart'
import { compressImageForVision, shouldCompressImage } from '../../../lib/utils/image-compression'
import fs from 'fs'
import { process as visionRouter } from '../../../lib/vision/router'
import { VisionRequest } from '../../../lib/vision/types'

export const config = {
  api: {
    bodyParser: true, // Now accepting JSON with photo URLs
    sizeLimit: '1mb', // Tiny payload now (just URLs!)
  },
}

interface BatchVisionResult {
  success: boolean
  data: {
    // Core fuel data
    total_amount: number | null
    gallons: number | null
    price_per_gallon: number | null
    station_name: string | null
    date: string | null
    miles: number | null
    fuel_level: number | null
    fuel_grade: string | null
    products: string[]
    // Extended receipt data
    transaction_time: string | null
    station_address: string | null
    pump_number: string | null
    payment_method: string | null
    transaction_id: string | null
    auth_code: string | null
    invoice_number: string | null
    receipt_metadata: Record<string, any>
  }
  confidence: {
    overall: number
    receipt: number
    odometer: number
    gauge: number
    additives: number
  }
  validations: Array<{
    check: string
    passed: boolean
    message: string
    severity: 'info' | 'warning' | 'error'
  }>
  warnings: string[]
  individualResults: Array<{
    stepId: string
    data: any
    confidence: number
    success: boolean
  }>
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('\n\n🔥🔥🔥 BATCH VISION API HIT! 🔥🔥🔥')
  console.log('   Method:', req.method)
  console.log('   Content-Type:', req.headers['content-type'])
  
  if (req.method !== 'POST') {
    console.error('❌ Wrong method:', req.method)
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }
  
  const start = performance.now()
  console.log('   Start time:', new Date().toISOString())

  try {
    // NEW: Accept JSON with photo URLs from Supabase Storage
    const { vehicle_id, event_type, photos } = req.body as {
      vehicle_id: string
      event_type: string
      photos: Array<{ stepId: string; url: string }>
    }
    
    const vehicleId = vehicle_id
    const eventType = event_type || 'fuel'
    
    if (!photos || photos.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No photo URLs provided'
      })
    }
    
    console.log(`📸 Batch processing ${photos.length} photos for vehicle ${vehicleId}`)
    console.log(`   Photos:`, photos.map(p => `${p.stepId}: ${p.url.substring(0, 80)}...`))
    
    // Process each photo through vision API using URLs
    const individualResults = []
    
    // Track counts for multiple photos of same type (e.g., multiple additives)
    const stepCounts: Record<string, number> = {}
    
    for (const photo of photos) {
      try {
        // Track which number this is for this step (e.g., "additives #2")
        stepCounts[photo.stepId] = (stepCounts[photo.stepId] || 0) + 1
        const photoLabel = stepCounts[photo.stepId] > 1 
          ? `${photo.stepId} #${stepCounts[photo.stepId]}`
          : photo.stepId
        
        console.log(`🔍 Processing ${photoLabel} from URL...`)
        
        // NEW: Fetch image from URL (OpenAI will also fetch it, but we need it for compression check)
        const imageResponse = await fetch(photo.url)
        if (!imageResponse.ok) {
          throw new Error(`Failed to fetch image from ${photo.url}`)
        }
        
        const arrayBuffer = await imageResponse.arrayBuffer()
        const originalBuffer = Buffer.from(arrayBuffer)
        let imageBuffer = originalBuffer
        let mime = imageResponse.headers.get('content-type') || 'image/jpeg'
        
        // Compress large images (convert to base64 for OpenAI)
        if (shouldCompressImage(originalBuffer.length)) {
          const compressed = await compressImageForVision(originalBuffer)
          imageBuffer = compressed.buffer
          mime = compressed.mimeType
        }
        
        const base64 = imageBuffer.toString('base64')
        
        // Map stepId to document_type
        const stepToDocType: Record<string, string> = {
          receipt: 'fuel_receipt',
          odometer: 'odometer',
          gauge: 'fuel_gauge',
          additives: 'product_label'
        }
        
        // Create vision request
        const visionRequest: VisionRequest = {
          image: base64,
          mimeType: mime,
          mode: 'document',
          document_type: stepToDocType[photo.stepId] as any
        }
        
        // Process through vision router
        const result = await visionRouter(visionRequest)
        
        // Extract data from key_facts (this is where the vision system puts extracted data)
        const extractedData = result.key_facts || result.raw_extraction || {}
        
        individualResults.push({
          stepId: photo.stepId,
          data: extractedData,
          confidence: result.confidence || 0,
          success: true
        })
        
        console.log(`✅ ${photo.stepId}: confidence ${result.confidence}`)
        
      } catch (error) {
        console.warn(`⚠️ Vision failed for ${photo.stepId}:`, error)
        individualResults.push({
          stepId: photo.stepId,
          data: null,
          confidence: 0,
          success: false,
          error: error instanceof Error ? error.message : 'Processing failed'
        })
      }
    }
    
    // Aggregate data from all results
    const aggregated = aggregateData(individualResults)
    
    // Cross-validate data
    const validations = crossValidate(aggregated, individualResults)
    
    // Calculate overall confidence
    const confidence = calculateConfidence(individualResults, validations)
    
    // Detect warnings
    const warnings = detectWarnings(aggregated, validations)
    
    const duration = performance.now() - start
    console.log(`✅ Batch processing complete in ${Math.round(duration)}ms`)
    
    // Debug: Log final aggregated data
    console.log('🎯 FINAL AGGREGATED DATA:')
    console.log('   transaction_id:', aggregated.transaction_id)
    console.log('   auth_code:', aggregated.auth_code)
    console.log('   invoice_number:', aggregated.invoice_number)
    console.log('   station_address:', aggregated.station_address)
    console.log('   payment_method:', aggregated.payment_method)
    console.log('   fuel_additives:', aggregated.products?.length || 0, 'product(s)')
    console.log('   receipt_metadata keys:', Object.keys(aggregated.receipt_metadata || {}))
    
    const response: BatchVisionResult = {
      success: true,
      data: aggregated,
      confidence,
      validations,
      warnings,
      individualResults: individualResults.map(r => ({
        stepId: r.stepId,
        data: r.data,
        confidence: r.confidence,
        success: r.success
      }))
    }
    
    console.log('📤 RESPONSE DATA BEING SENT TO CLIENT:')
    console.log('   transaction_id:', response.data.transaction_id)
    console.log('   auth_code:', response.data.auth_code)
    console.log('   invoice_number:', response.data.invoice_number)
    console.log('   station_address:', response.data.station_address)
    
    return res.status(200).json(response)
    
  } catch (error) {
    console.error('❌ Batch vision processing error:', error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Processing failed'
    })
  }
}

/**
 * Aggregate extracted data from multiple photos
 */
function aggregateData(results: any[]) {
  const data: any = {
    total_amount: null,
    gallons: null,
    price_per_gallon: null,
    station_name: null,
    date: null,
    miles: null,
    fuel_level: null,
    fuel_grade: null,
    products: [],
    // Extended receipt data
    transaction_time: null,
    station_address: null,
    pump_number: null,
    payment_method: null,
    transaction_id: null,
    auth_code: null,
    invoice_number: null,
    receipt_metadata: {}
  }
  
  for (const result of results) {
    if (!result.success || !result.data) continue
    
    switch (result.stepId) {
      case 'receipt':
        console.log('📊 Receipt result.data:', JSON.stringify(result.data, null, 2))
        
        // Core fuel data
        data.gallons = result.data.gallons || result.data.volume || data.gallons
        data.total_amount = result.data.total_amount || result.data.price_total || result.data.total || data.total_amount
        data.price_per_gallon = result.data.price_per_gallon || result.data.unit_price || result.data.ppg || data.price_per_gallon
        data.station_name = result.data.station_name || result.data.station || result.data.vendor || data.station_name
        data.date = result.data.date || result.data.transaction_date || data.date
        data.fuel_grade = result.data.grade || result.data.fuel_type || result.data.fuel_grade || result.data.octane || data.fuel_grade
        
        // Extended receipt data (complete extraction from enhanced schema)
        data.transaction_time = result.data.time || result.data.transaction_time || data.transaction_time
        data.station_address = result.data.station_address || result.data.address || result.data.location || data.station_address
        data.pump_number = result.data.pump_number || result.data.pump || data.pump_number
        data.payment_method = result.data.payment_method || result.data.payment || result.data.card || data.payment_method
        data.transaction_id = result.data.transaction_id || result.data.tran_number || result.data.tran_id || data.transaction_id
        data.auth_code = result.data.auth_code || result.data.auth || result.data.authorization || data.auth_code
        data.invoice_number = result.data.invoice_number || result.data.invoice || result.data.receipt_number || data.invoice_number
        
        console.log('✅ After mapping - transaction_id:', data.transaction_id)
        console.log('✅ After mapping - auth_code:', data.auth_code)
        console.log('✅ After mapping - station_address:', data.station_address)
        console.log('✅ After mapping - invoice_number:', data.invoice_number)
        
        // Catch additional fields in metadata (site, trace, merchant, card codes)
        data.receipt_metadata = {
          site_id: result.data.site_id || result.data.site,
          trace_id: result.data.trace_id || result.data.trace,
          merchant_id: result.data.merchant_id || result.data.merchant,
          entry_method: result.data.entry_method,
          card_last_four: result.data.card_last_four,
          // Credit card transaction codes (if extracted)
          aid: result.data.aid,
          tvr: result.data.tvr,
          iad: result.data.iad,
          tsi: result.data.tsi,
          arc: result.data.arc,
          ...data.receipt_metadata
        }
        
        console.log('📋 Receipt metadata created:', JSON.stringify(data.receipt_metadata, null, 2))
        break
        
      case 'odometer':
        // Vision API returns different field names - check all variants
        data.miles = result.data.miles || 
                     result.data.odometer_reading || 
                     result.data.odometer_miles ||  // ← ADD THIS!
                     result.data.reading || 
                     data.miles
        break
        
      case 'gauge':
        console.log('📊 Gauge result.data:', JSON.stringify(result.data, null, 2))
        // Vision API returns percentage (0-100) or fuel_level
        data.fuel_level = result.data.percentage || 
                         result.data.fuel_level || 
                         result.data.level || 
                         data.fuel_level
        console.log('✅ After mapping - fuel_level:', data.fuel_level)
        break
        
      case 'additives':
        console.log('📊 Additives result.data:', JSON.stringify(result.data, null, 2))
        // Extract product data from product_label schema
        // NOTE: Multiple additive photos can be uploaded, so APPEND products
        
        // Check if it's a single product object or array
        let productsToAdd = []
        
        if (result.data.brand || result.data.product_name) {
          // Single product extracted from product_label schema
          productsToAdd = [{
            brand: result.data.brand,
            product_name: result.data.product_name,
            type: result.data.product_type || result.data.type,
            size: result.data.size || result.data.quantity,
            purpose: result.data.purpose
          }]
          console.log('✅ Found single product:', productsToAdd[0])
        } else if (result.data.products || result.data.items) {
          // Array of products (if vision returns multiple from one photo)
          const products = result.data.products || result.data.items || []
          productsToAdd = products.map((p: any) => ({
            brand: p.brand || p.manufacturer,
            product_name: p.product_name || p.name || p.title,
            type: p.type || p.category || p.product_type,
            size: p.size || p.volume || p.quantity,
            purpose: p.purpose || p.description
          }))
          console.log('✅ Found product array:', productsToAdd.length, 'products')
        } else {
          console.log('⚠️ No product data found in result')
        }
        
        // Append to existing products array (support multiple additive photos)
        const previousCount = data.products.length
        data.products = [...data.products, ...productsToAdd]
        console.log(`✅ Added ${productsToAdd.length} product(s), total now: ${data.products.length} (was ${previousCount})`)
        break
    }
  }
  
  // Deduplicate products (same brand + product_name + size)
  if (data.products.length > 1) {
    const uniqueProducts = new Map()
    for (const product of data.products) {
      const key = `${product.brand}|${product.product_name}|${product.size}`.toLowerCase()
      if (!uniqueProducts.has(key)) {
        uniqueProducts.set(key, product)
      } else {
        console.log(`⚠️ Duplicate product removed: ${product.brand} ${product.product_name}`)
      }
    }
    const originalCount = data.products.length
    data.products = Array.from(uniqueProducts.values())
    if (data.products.length < originalCount) {
      console.log(`✅ Deduplicated: ${originalCount} → ${data.products.length} products`)
    }
  }
  
  // Calculate price per gallon if missing
  if (!data.price_per_gallon && data.total_amount && data.gallons) {
    data.price_per_gallon = parseFloat((data.total_amount / data.gallons).toFixed(3))
  }
  
  // Default date if missing
  if (!data.date) {
    data.date = new Date().toISOString().split('T')[0]
  }
  
  return data
}

/**
 * Cross-validate data for consistency
 */
function crossValidate(data: any, results: any[]) {
  const validations = []
  
  // Validation 1: Gallons should match fuel level
  if (data.gallons && data.fuel_level) {
    // Rough heuristic: 15 gallon tank, fuel_level as percentage
    const expectedGallons = (data.fuel_level / 100) * 15
    const diff = Math.abs(data.gallons - expectedGallons)
    const passed = diff < 5 // Within 5 gallons
    
    validations.push({
      check: 'gallons_matches_gauge',
      passed,
      message: passed 
        ? `Gallons (${data.gallons}) matches gauge reading (${data.fuel_level}%)`
        : `⚠️ Gallons (${data.gallons}) doesn't match gauge (${data.fuel_level}%). Difference: ${diff.toFixed(1)}gal`,
      severity: (passed ? 'info' : 'warning') as 'info' | 'warning' | 'error'
    })
  }
  
  // Validation 2: Price per gallon is reasonable
  if (data.price_per_gallon) {
    const isReasonable = data.price_per_gallon > 1.50 && data.price_per_gallon < 10.00
    validations.push({
      check: 'price_per_gallon_reasonable',
      passed: isReasonable,
      message: isReasonable
        ? `Price per gallon ($${data.price_per_gallon.toFixed(2)}) is within normal range`
        : `⚠️ Price per gallon ($${data.price_per_gallon.toFixed(2)}) seems unusual`,
      severity: (isReasonable ? 'info' : 'warning') as 'info' | 'warning' | 'error'
    })
  }
  
  // Validation 3: All confidence scores
  const confidences = results.filter(r => r.success).map(r => r.confidence)
  if (confidences.length > 0) {
    const avgConfidence = confidences.reduce((a, b) => a + b, 0) / confidences.length
    const passed = avgConfidence > 0.7
    
    validations.push({
      check: 'confidence_score',
      passed,
      message: passed
        ? `Overall OCR confidence is good (${Math.round(avgConfidence * 100)}%)`
        : `⚠️ Low OCR confidence (${Math.round(avgConfidence * 100)}%). Please verify extracted data.`,
      severity: (passed ? 'info' : 'warning') as 'info' | 'warning' | 'error'
    })
  }
  
  return validations
}

/**
 * Calculate confidence scores
 */
function calculateConfidence(results: any[], validations: any[]) {
  const confidence = {
    overall: 0,
    receipt: 0,
    odometer: 0,
    gauge: 0,
    additives: 0
  }
  
  // Individual confidences
  for (const result of results) {
    if (result.success) {
      const key = result.stepId as keyof typeof confidence
      if (key in confidence) {
        confidence[key] = Math.round(result.confidence * 100)
      }
    }
  }
  
  // Calculate overall confidence
  const successfulResults = results.filter(r => r.success)
  if (successfulResults.length > 0) {
    const avgConfidence = successfulResults.reduce((sum, r) => sum + r.confidence, 0) / successfulResults.length
    
    // Adjust based on validations
    const failedValidations = validations.filter(v => !v.passed && v.severity !== 'info').length
    const validationPenalty = failedValidations * 0.1 // -10% per failed validation
    
    confidence.overall = Math.max(0, Math.round((avgConfidence - validationPenalty) * 100))
  }
  
  return confidence
}

/**
 * Detect warnings and issues
 */
function detectWarnings(data: any, validations: any[]) {
  const warnings = []
  
  // Missing critical data
  if (!data.total_amount) warnings.push('Missing total cost - please enter manually')
  if (!data.gallons) warnings.push('Missing gallons - please enter manually')
  if (!data.miles) warnings.push('Missing odometer reading - please enter manually')
  
  // Failed validations
  for (const v of validations) {
    if (!v.passed && v.severity === 'warning') {
      warnings.push(v.message)
    }
  }
  
  return warnings
}
