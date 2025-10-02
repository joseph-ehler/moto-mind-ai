// Simulate Vision Metrics - For Testing Dashboard
// Generates realistic metrics data to test monitoring dashboard

import { NextApiRequest, NextApiResponse } from 'next'
import { visionMetrics } from '../../../lib/monitoring/vision-metrics'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    })
  }

  try {
    const { count = 50, dashboard_request = false } = req.body

    // Simulate realistic vision processing requests
    for (let i = 0; i < count; i++) {
      const documentTypes = dashboard_request 
        ? ['dashboard_snapshot'] 
        : ['service_invoice', 'dashboard_snapshot', 'fuel_receipt', 'insurance_card']
      const documentType = documentTypes[Math.floor(Math.random() * documentTypes.length)]
      
      // Simulate realistic success rates (slightly lower than 95% to be realistic)
      const isSuccess = Math.random() > 0.08 // ~92% success rate
      
      // Simulate realistic processing times
      const processingTime = Math.random() * 8000 + 2000 // 2-10 seconds
      
      // Simulate realistic confidence scores
      const confidence = isSuccess ? Math.random() * 0.3 + 0.7 : Math.random() * 0.5 // 0.7-1.0 for success, 0-0.5 for failure
      
      // Simulate error codes for failures
      const errorCodes = ['PARSE_FAILED', 'UPSTREAM_TIMEOUT', 'VALIDATION_FAILED', 'RATE_LIMIT']
      const errorCode = !isSuccess ? errorCodes[Math.floor(Math.random() * errorCodes.length)] : undefined

      visionMetrics.recordRequest({
        document_type: documentType,
        processing_time_ms: processingTime,
        success: isSuccess,
        confidence: isSuccess ? confidence : undefined,
        error_code: errorCode
      })

      // Simulate some accuracy data (for successful requests)
      if (isSuccess && Math.random() > 0.7) { // 30% of successful requests have accuracy data
        const fieldAccuracies: any = {}
        
        // Simulate field-specific accuracy based on document type
        if (documentType === 'service_invoice') {
          fieldAccuracies.vendor_name = Math.random() > 0.15 // 85% accuracy
          fieldAccuracies.service_description = Math.random() > 0.20 // 80% accuracy
          fieldAccuracies.total_amount = Math.random() > 0.10 // 90% accuracy
        } else if (documentType === 'dashboard_snapshot') {
          fieldAccuracies.odometer = Math.random() > 0.05 // 95% accuracy (matches our test claim)
          fieldAccuracies.fuel_level = Math.random() > 0.03 // 97% accuracy
          fieldAccuracies.warning_lights = Math.random() > 0.25 // 75% accuracy
        } else if (documentType === 'fuel_receipt') {
          fieldAccuracies.total_amount = Math.random() > 0.08 // 92% accuracy
          fieldAccuracies.vendor_name = Math.random() > 0.12 // 88% accuracy
        }

        visionMetrics.recordAccuracy({
          document_type: documentType,
          field_accuracies: fieldAccuracies,
          predicted_confidence: confidence
        })
      }
    }

    const currentMetrics = visionMetrics.getMetrics()

    return res.status(200).json({
      success: true,
      message: `Simulated ${count} vision processing requests`,
      current_metrics: {
        total_requests: currentMetrics.total_requests,
        success_rate: currentMetrics.success_rate,
        overall_accuracy: currentMetrics.overall_accuracy,
        avg_processing_time_ms: currentMetrics.avg_processing_time_ms
      }
    })

  } catch (error) {
    console.error('Failed to simulate metrics:', error)
    
    return res.status(500).json({
      success: false,
      error: 'Failed to simulate metrics'
    })
  }
}
