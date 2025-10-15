import React, { useState } from 'react'
import { FuelReceiptData } from './types'

interface FuelReceiptConfirmationProps {
  imageUrl: string
  extractedData: FuelReceiptData
  vehicleId: string
  onConfirm: (data: FuelReceiptData) => void
  onRetake: () => void
  onCancel: () => void
}

export function FuelReceiptConfirmation({
  imageUrl,
  extractedData,
  vehicleId,
  onConfirm,
  onRetake,
  onCancel
}: FuelReceiptConfirmationProps) {
  const [formData, setFormData] = useState(extractedData)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = (field: keyof FuelReceiptData, value: string) => {
    const numValue = parseFloat(value) || 0
    const newData = { ...formData, [field]: numValue }
    
    // Auto-compute missing field when user edits
    if (field === 'gallons' || field === 'total_cost') {
      if (newData.gallons && newData.total_cost) {
        newData.price_per_gallon = Number((newData.total_cost / newData.gallons).toFixed(3))
      }
    } else if (field === 'price_per_gallon') {
      if (newData.gallons && newData.price_per_gallon) {
        newData.total_cost = Number((newData.gallons * newData.price_per_gallon).toFixed(2))
      }
    }
    
    setFormData(newData)
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    
    try {
      // Submit to Supabase database
      const response = await fetch('/api/supabase-save-working', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vehicleId,
          uploadId: `fuel-${Date.now()}`,
          eventType: 'fuel_purchase',
          data: formData,
          verifiedByUser: true
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save data')
      }

      const result = await response.json()
      console.log('✅ Fuel receipt saved:', result)
      
      onConfirm(formData)
    } catch (error) {
      console.error('Failed to save fuel receipt:', error)
      alert('Failed to save fuel receipt. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const confidenceColor = formData.ocr_confidence >= 75 ? 'text-green-600' : 'text-yellow-600'
  const confidenceIcon = formData.ocr_confidence >= 75 ? '✅' : '⚠️'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900">⛽ Confirm Fuel Receipt</h2>
        <p className="text-sm text-gray-600 mt-1">
          {confidenceIcon} <span className={confidenceColor}>
            {formData.ocr_confidence}% confidence
          </span> • Verify and edit if needed
        </p>
      </div>

      {/* Image Preview */}
      <div className="flex justify-center">
        <img 
          src={imageUrl} 
          alt="Captured receipt" 
          className="max-w-xs max-h-48 object-contain border rounded-lg shadow-sm"
        />
      </div>

      {/* Extracted Data Form */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          {/* Gallons */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Gallons
            </label>
            <input
              type="number"
              step="0.001"
              value={formData.gallons || ''}
              onChange={(e) => handleInputChange('gallons', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="15.234"
            />
          </div>

          {/* Total Cost */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Total Cost ($)
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.total_cost || ''}
              onChange={(e) => handleInputChange('total_cost', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="67.89"
            />
          </div>

          {/* Price per Gallon (computed) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price per Gallon ($)
            </label>
            <input
              type="number"
              step="0.001"
              value={formData.price_per_gallon || ''}
              onChange={(e) => handleInputChange('price_per_gallon', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
              placeholder="4.459"
            />
            <p className="text-xs text-gray-500 mt-1">Auto-calculated from gallons and total</p>
          </div>

          {/* Station Name (optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Station Name (optional)
            </label>
            <input
              type="text"
              value={formData.station_name || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, station_name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Shell, Chevron, etc."
            />
          </div>
        </div>

        {/* Low Confidence Warning */}
        {formData.ocr_confidence < 75 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <span className="text-yellow-600">⚠️</span>
              </div>
              <div className="ml-2">
                <p className="text-sm text-yellow-800">
                  <strong>Low confidence extraction.</strong> Please verify all values are correct before saving.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Data Quality Indicator */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-blue-600">📊</span>
              <span className="ml-2 text-sm text-blue-800">
                Adding fuel data improves MPG calculations
              </span>
            </div>
            <span className="text-xs text-blue-600 font-medium">+15% data quality</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-3">
        <button
          onClick={onRetake}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          📷 Retake Photo
        </button>
        
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          Cancel
        </button>
        
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !formData.gallons || !formData.total_cost}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Saving...' : '✅ Confirm & Save'}
        </button>
      </div>
    </div>
  )
}
