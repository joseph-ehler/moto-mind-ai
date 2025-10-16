/**
 * Vision API Integration
 * Handles photo upload and processing with OpenAI Vision
 */

export interface VisionResult {
  extractedData: Record<string, any>
  confidence: Record<string, number>
  publicUrl: string
  processingMetadata: {
    model_version?: string
    processing_ms: number
    input_tokens?: number
    output_tokens?: number
  }
}

/**
 * Upload photo to vision API for processing
 */
export async function uploadToVisionAPI(
  photo: File,
  documentType: string = 'fuel_receipt',
  vehicleId?: string
): Promise<VisionResult> {
  const formData = new FormData()
  formData.append('image', photo)
  formData.append('document_type', documentType)
  formData.append('mode', 'production')
  
  // Include vehicle_id so the image gets uploaded to Supabase storage
  if (vehicleId) {
    formData.append('vehicle_id', vehicleId)
  }

  const response = await fetch('/api/vision/process', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(error.error || 'Vision processing failed')
  }

  const data = await response.json()

  // API returns: { success: true, data: { ...result, image_url }, metadata: { ... } }
  return {
    extractedData: data.data || {},
    confidence: data.data?.confidence || {},
    publicUrl: data.data?.image_url || '',
    processingMetadata: {
      model_version: data.metadata?.model_version,
      processing_ms: data.metadata?.processing_ms || 0,
      input_tokens: data.metadata?.input_tokens,
      output_tokens: data.metadata?.output_tokens,
    },
  }
}
