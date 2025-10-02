// Refactored Vision Processing API
// Thin I/O adapter using the new modular vision architecture

import { NextApiRequest, NextApiResponse } from 'next'
import { withValidation, validationSchemas } from '../../../lib/utils/api-validation'
import { parseMultipart, toBase64, normMode, normDocType } from '../../../lib/http/multipart'
import { process as visionRouter, mapErrorToCode, mapErrorToMessage } from '../../../lib/vision/router'
import { VisionRequest } from '../../../lib/vision/types'

export const config = {
  api: {
    bodyParser: false, // Required for multipart parsing
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

  try {
    // Step 1: Parse multipart form data
    const { fields, files } = await parseMultipart(req)
    
    // Step 2: Validate and normalize inputs
    const mode = normMode(fields.mode)
    const documentType = normDocType(fields.document_type)
    
    if (!files.image) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided',
        code: 'NO_FILE'
      })
    }
    
    // Step 3: Convert image to base64
    const { base64, mime } = await toBase64(files.image)
    
    // Step 4: Create vision request
    const visionRequest: VisionRequest = {
      image: base64,
      mimeType: mime,
      mode,
      document_type: documentType as any
    }
    
    // Step 5: Process through vision router
    const result = await visionRouter(visionRequest)
    
    // Step 6: Calculate total processing time
    const processing_ms = Math.round(performance.now() - start)
    
    // Step 7: Return standardized response
    return res.status(200).json({
      success: true,
      data: result,
      metadata: {
        mode,
        document_type: documentType,
        processing_ms,
        timestamp: new Date().toISOString()
      }
    })
    
  } catch (error: any) {
    // Step 8: Handle errors with stable codes
    const code = mapErrorToCode(error)
    const message = mapErrorToMessage(code)
    const processing_ms = Math.round(performance.now() - start)
    
    // Log error for debugging (without sensitive data)
    console.error('Vision processing error:', {
      code,
      message: error.message,
      processing_ms,
      timestamp: new Date().toISOString()
    })
    
    // Determine HTTP status code
    const statusCode = getHttpStatusCode(code)
    
    return res.status(statusCode).json({
      success: false,
      error: message,
      code,
      metadata: {
        processing_ms,
        timestamp: new Date().toISOString()
      }
    })
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

export default withValidation(handler, validationSchemas.vision)
