// Refactored Vision Processing API
// Thin I/O adapter using the new modular vision architecture

import { NextApiRequest, NextApiResponse } from 'next'
import { withTenantIsolation } from '@/lib/middleware/tenant-context'

import { withValidation, validationSchemas } from '@/features/vehicles/data/api-validation'
import { parseMultipart, toBase64, normMode, normDocType } from '../../../lib/http/multipart'
import { compressImageForVision, shouldCompressImage } from '../../../lib/utils/image-compression'
import fs from 'fs'
import { process as visionRouter, mapErrorToCode, mapErrorToMessage } from '../../../lib/vision/router'
import { VisionRequest } from '../../../lib/vision/types'
import { VisionErrorHandler } from '../../../lib/vision/error-handler'
import { visionMetrics } from '../../../lib/monitoring/vision-metrics'
import { createClient } from '@supabase/supabase-js'
import path from 'path'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const config = {
  api: {
    bodyParser: false, // Required for multipart parsing
    sizeLimit: '20mb', // Increase file size limit for images
  },
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed',
      code: 'METHOD_NOT_ALLOWED'
    })
  }

  const start = performance.now()
  let fields: any = {}
  let documentType: string | undefined

  try {
    // Step 1: Parse multipart form data
    const parseResult = await parseMultipart(req)
    fields = parseResult.fields
    const files = parseResult.files
    
    // Step 2: Validate and normalize inputs
    const mode = normMode(fields.mode)
    documentType = normDocType(fields.document_type)
    const engineState = fields.engine_state || null
    
    if (!files.image) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided',
        code: 'NO_FILE'
      })
    }
    
    // Step 3: Read and potentially compress image
    const originalBuffer = fs.readFileSync(files.image.filepath)
    let imageBuffer = originalBuffer
    let mime = files.image.mimetype || 'image/jpeg'
    
    // Compress large images for faster processing
    if (shouldCompressImage(originalBuffer.length)) {
      console.log(`📸 Compressing large image (${Math.round(originalBuffer.length / 1024 / 1024)}MB) for faster processing`)
      const compressed = await compressImageForVision(originalBuffer)
      imageBuffer = compressed.buffer
      mime = compressed.mimeType
    }
    
    // Convert to base64
    const base64 = imageBuffer.toString('base64')
    
    // Step 4: Create vision request
    const visionRequest: VisionRequest = {
      image: base64,
      mimeType: mime,
      mode,
      document_type: documentType as any,
      engine_state: engineState
    }
    
    // Step 5: Process through vision router
    console.log('🔍 About to process vision request:', {
      mode: visionRequest.mode,
      document_type: visionRequest.document_type,
      image_size: visionRequest.image.length
    })
    const result = await visionRouter(visionRequest)
    console.log('✅ Vision processing completed:', {
      confidence: result.confidence,
      type: result.type || 'unknown'
    })
    
    // Step 6: Upload image to Supabase storage (if vehicle_id provided)
    // Everything is an event - no separate vehicle_images table
    let publicUrl: string | null = null
    
    const vehicleId = fields.vehicle_id
    console.log('📸 Vehicle ID from request:', vehicleId)
    
    if (vehicleId) {
      console.log('📸 Starting image upload for vehicle:', vehicleId)
      try {
        const filename = `dashboard_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`
        const filePath = `vehicles/${vehicleId}/${filename}`
        
        // Upload to Supabase storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('vehicle-events')
          .upload(filePath, originalBuffer, {
            contentType: mime,
            upsert: false
          })
        
        if (uploadError) {
          console.error('📸 Storage upload error:', uploadError)
        }
        
        if (!uploadError && uploadData) {
          console.log('📸 Storage upload successful:', uploadData.path)
          
          // Get public URL
          const { data: urlData } = supabase.storage
            .from('vehicle-events')
            .getPublicUrl(filePath)
          
          publicUrl = urlData.publicUrl
          console.log('📸 Image uploaded to storage:', publicUrl)
        }
      } catch (uploadErr) {
        console.error('📸 Image upload failed (non-critical):', uploadErr)
        // Continue processing even if upload fails
      }
    }
    
    // Step 7: Calculate total processing time
    const processing_ms = Math.round(performance.now() - start)
    
    // Step 8: Record metrics for monitoring (temporarily disabled for debugging)
    try {
      visionMetrics.recordRequest({
        document_type: documentType || 'unknown',
        processing_time_ms: processing_ms,
        success: true,
        confidence: result.confidence
      })
    } catch (metricsError) {
      console.log('📊 Metrics recording failed (non-critical):', metricsError)
    }
    
    // Step 9: Return standardized response with image_url
    // Everything is an event - image_url goes into event payload
    return res.status(200).json({
      success: true,
      data: {
        ...result,
        image_url: publicUrl
      },
      metadata: {
        mode,
        document_type: documentType,
        engine_state: engineState,
        processing_ms,
        timestamp: new Date().toISOString()
      }
    })
    
  } catch (error: any) {
    // Step 8: Handle errors with standardized error handler
    const processing_ms = Math.round(performance.now() - start)
    
    // Log the actual error for debugging
    console.error('❌ Vision processing error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    
    // Use document type from scope or fallback
    const errorDocumentType = documentType || 'unknown'
    
    try {
      const visionError = VisionErrorHandler.createVisionError(error, 'vision_api_processing')
      
      // Record error metrics for monitoring (temporarily disabled for debugging)
      try {
        visionMetrics.recordRequest({
          document_type: errorDocumentType,
          processing_time_ms: processing_ms,
          success: false,
          error_code: visionError.code
        })
      } catch (metricsError) {
        console.log('📊 Error metrics recording failed (non-critical):', metricsError)
      }
      
      // Determine HTTP status code
      const statusCode = getHttpStatusCode(visionError.code)
      
      return res.status(statusCode).json({
        success: false,
        error: visionError.userMessage,
        code: visionError.code,
        retryable: visionError.retryable,
        suggestions: VisionErrorHandler.getRecoverySuggestions(visionError),
        metadata: {
          processing_ms,
          timestamp: new Date().toISOString()
        }
      })
    } catch (handlerError) {
      // Fallback if error handler itself fails
      console.error('Error handler failed:', handlerError)
      
      return res.status(500).json({
        success: false,
        error: 'An unexpected error occurred. Please try again.',
        code: 'PROCESSING_ERROR',
        retryable: true,
        metadata: {
          processing_ms,
          timestamp: new Date().toISOString()
        }
      })
    }
  }
}

/**
 * Maps error codes to appropriate HTTP status codes
 */
function getHttpStatusCode(errorCode: string): number {
  const statusMap: Record<string, number> = {
    'NO_FILE': 400,
    'PAYLOAD_TOO_LARGE': 413,
    'VALIDATION_FAILED': 400,
    'MODE_UNSUPPORTED': 400,
    'PARSE_FAILED': 422,
    'UPSTREAM_TIMEOUT': 504,
    'RATE_LIMIT': 429,
    'PROCESSING_ERROR': 500
  }
  
  return statusMap[errorCode] || 500
}

export default withTenantIsolation(handler)
