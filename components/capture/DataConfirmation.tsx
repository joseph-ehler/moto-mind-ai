// MotoMindAI: Data Confirmation Component
// User verification and editing of OCR-extracted data

import { useState } from 'react'

interface DataConfirmationProps {
  kind: 'odometer_reading' | 'fuel_purchase' | 'maintenance' | 'issue_report'
  extractedData: any
  vehicleId: string
  uploadId?: string
  onConfirm: (eventData: any) => void
  onCancel: () => void
}

export function DataConfirmation({ 
  kind, 
  extractedData, 
  vehicleId, 
  uploadId,
  onConfirm, 
  onCancel 
}: DataConfirmationProps) {
  const [formData, setFormData] = useState(() => {
    // Initialize form with extracted data
    switch (kind) {
      case 'odometer_reading':
        return {
          miles: extractedData.miles || '',
          ocr_confidence: extractedData.ocr_confidence || 0,
          parsed_digits: extractedData.parsed_digits || ''
        }
      case 'fuel_purchase':
        return {
          gallons: extractedData.gallons || '',
          price_total: extractedData.price_total || '',
          unit_price: extractedData.unit_price || '',
          date: extractedData.date || new Date().toISOString().split('T')[0],
          station: extractedData.station || '',
          ocr_confidence: extractedData.ocr_confidence || 0
        }
      case 'maintenance':
        return {
          service_type: extractedData.service_type || '',
          parts: extractedData.parts || [],
          date: extractedData.date || new Date().toISOString().split('T')[0],
          notes: extractedData.notes || '',
          cost: extractedData.cost || '',
          odometer_miles: extractedData.odometer_miles || ''
        }
      case 'issue_report':
        return {
          category: extractedData.category || 'other',
          severity: extractedData.severity || 'medium',
          note: extractedData.note || '',
          photo_ids: extractedData.photo_ids || []
        }
      default:
        return {}
    }
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    
    try {
      // Submit to manual events API
      const response = await fetch('/api/manual-events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vehicleId,
          sourceUploadId: uploadId,
          eventType: kind,
          payload: formData,
          confidence: formData.ocr_confidence || 80,
          verifiedByUser: true
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save data')
      }

      const result = await response.json()
      onConfirm(result)
    } catch (error) {
      console.error('Failed to save manual event:', error)
      alert('Failed to save data. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getTitle = () => {
    switch (kind) {
      case 'odometer_reading':
        return 'Confirm Odometer Reading'
      case 'fuel_purchase':
        return 'Confirm Fuel Purchase'
      case 'maintenance':
        return 'Confirm Maintenance Record'
      case 'issue_report':
        return 'Confirm Issue Report'
      default:
        return 'Confirm Data'
    }
  }

  const renderForm = () => {
    switch (kind) {
      case 'odometer_reading':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Odometer Reading (miles)
              </label>
              <input
                type="number"
                value={formData.miles}
                onChange={(e) => handleInputChange('miles', parseInt(e.target.value) || 0)}
                className="input"
                placeholder="Enter miles"
                min="0"
                max="999999"
              />
              {formData.ocr_confidence > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  OCR Confidence: {formData.ocr_confidence}%
                </p>
              )}
            </div>
          </div>
        )

      case 'fuel_purchase':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gallons
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.gallons}
                onChange={(e) => handleInputChange('gallons', parseFloat(e.target.value) || 0)}
                className="input"
                placeholder="Enter gallons"
                min="0"
                max="200"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Price ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.price_total}
                onChange={(e) => handleInputChange('price_total', parseFloat(e.target.value) || 0)}
                className="input"
                placeholder="Enter total price"
                min="0"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                className="input"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gas Station (optional)
              </label>
              <input
                type="text"
                value={formData.station}
                onChange={(e) => handleInputChange('station', e.target.value)}
                className="input"
                placeholder="Enter station name"
              />
            </div>
            
            {formData.ocr_confidence > 0 && (
              <p className="text-xs text-gray-500">
                OCR Confidence: {formData.ocr_confidence}%
              </p>
            )}
          </div>
        )

      case 'maintenance':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Service Type
              </label>
              <select
                value={formData.service_type}
                onChange={(e) => handleInputChange('service_type', e.target.value)}
                className="input"
              >
                <option value="">Select service type</option>
                <option value="oil_change">Oil Change</option>
                <option value="brake_service">Brake Service</option>
                <option value="tire_rotation">Tire Rotation</option>
                <option value="inspection">Inspection</option>
                <option value="repair">Repair</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Service Date
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                className="input"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Odometer at Service (optional)
              </label>
              <input
                type="number"
                value={formData.odometer_miles}
                onChange={(e) => handleInputChange('odometer_miles', parseInt(e.target.value) || '')}
                className="input"
                placeholder="Enter odometer reading"
                min="0"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                className="input"
                rows={3}
                placeholder="Enter service notes"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cost (optional)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.cost}
                onChange={(e) => handleInputChange('cost', parseFloat(e.target.value) || '')}
                className="input"
                placeholder="Enter cost"
                min="0"
              />
            </div>
          </div>
        )

      case 'issue_report':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Issue Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="input"
              >
                <option value="brakes">Brakes</option>
                <option value="engine">Engine</option>
                <option value="tires">Tires</option>
                <option value="electrical">Electrical</option>
                <option value="body">Body</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Severity
              </label>
              <select
                value={formData.severity}
                onChange={(e) => handleInputChange('severity', e.target.value)}
                className="input"
              >
                <option value="low">Low - Minor issue</option>
                <option value="medium">Medium - Needs attention</option>
                <option value="high">High - Safety concern</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.note}
                onChange={(e) => handleInputChange('note', e.target.value)}
                className="input"
                rows={4}
                placeholder="Describe the issue..."
                required
              />
            </div>
          </div>
        )

      default:
        return <div>Unknown data type</div>
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {getTitle()}
            </h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            Please review and confirm the extracted data. You can edit any fields before saving.
          </p>

          {renderForm()}

          <div className="flex space-x-3 mt-6">
            <button
              onClick={onCancel}
              className="flex-1 btn-secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <svg className="w-4 h-4 animate-spin mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Saving...
                </div>
              ) : (
                'Save Data'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
