import React, { useState } from 'react'
import { CameraCapture } from './CameraCapture'
import { FuelReceiptConfirmation } from './FuelReceiptConfirmation'
import { FuelReceiptData } from './types'

interface FuelReceiptCaptureProps {
  vehicleId: string
  onComplete: (data: FuelReceiptData) => void
  onCancel: () => void
}

export function FuelReceiptCapture({ vehicleId, onComplete, onCancel }: FuelReceiptCaptureProps) {
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [extractedData, setExtractedData] = useState<FuelReceiptData | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleImageCapture = async (file: File, extractedData?: any) => {
    // Create a data URL for preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setCapturedImage(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    setIsProcessing(true)
    setError(null)

    try {
      // Create FormData
      const formData = new FormData()
      formData.append('image', file, 'receipt.jpg')
      
      console.log('📄 FormData created, sending to /api/process-receipt')

      // Process with OCR/Vision pipeline
      const ocrResponse = await fetch('/api/process-receipt', {
        method: 'POST',
        body: formData
      })

      if (!ocrResponse.ok) {
        throw new Error('Failed to process receipt')
      }

      const result = await ocrResponse.json()
      
      // Validate and compute missing fields
      const processedData = computeMissingFields(result.data)
      setExtractedData(processedData)

    } catch (err) {
      console.error('Receipt processing error:', err)
      setError('Failed to process receipt. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  // Compute missing field from the other two
  const computeMissingFields = (data: Partial<FuelReceiptData>): FuelReceiptData => {
    const { gallons, total_cost, price_per_gallon } = data

    // If we have 2 of 3 values, compute the third
    if (gallons && total_cost && !price_per_gallon) {
      data.price_per_gallon = Number((total_cost / gallons).toFixed(3))
    } else if (gallons && price_per_gallon && !total_cost) {
      data.total_cost = Number((gallons * price_per_gallon).toFixed(2))
    } else if (total_cost && price_per_gallon && !gallons) {
      data.gallons = Number((total_cost / price_per_gallon).toFixed(3))
    }

    return data as FuelReceiptData
  }

  const handleRetake = () => {
    setCapturedImage(null)
    setExtractedData(null)
    setError(null)
  }

  if (extractedData) {
    return (
      <FuelReceiptConfirmation
        imageUrl={capturedImage!}
        extractedData={extractedData}
        vehicleId={vehicleId}
        onConfirm={onComplete}
        onRetake={handleRetake}
        onCancel={onCancel}
      />
    )
  }

  return (
    <div className="space-y-4">
      {/* Capture Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">📄 Fuel Receipt Tips</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Fill the frame with the receipt</li>
          <li>• Avoid glare and shadows</li>
          <li>• Ensure gallons and total are visible</li>
          <li>• Capture immediately after fueling for best accuracy</li>
        </ul>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      <CameraCapture
        kind="fuel_receipt"
        vehicleId={vehicleId}
        onCapture={handleImageCapture}
        onCancel={onCancel}
      />
    </div>
  )
}
