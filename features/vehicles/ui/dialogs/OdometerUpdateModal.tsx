'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { OdometerReader, OdometerData } from '@/components/vision'
import { 
  Gauge, 
  X, 
  CheckCircle, 
  AlertTriangle, 
  Edit3,
  Camera,
  Loader2,
  TrendingUp,
  Calendar
} from 'lucide-react'

interface OdometerUpdateModalProps {
  isOpen: boolean
  onClose: () => void
  vehicleId: string
  vehicleName: string
  currentMileage?: number
  onMileageUpdated: (newMileage: number) => void
}

type ModalState = 'choice' | 'camera' | 'manual' | 'processing' | 'confirmation'

export function OdometerUpdateModal({
  isOpen,
  onClose,
  vehicleId,
  vehicleName,
  currentMileage,
  onMileageUpdated
}: OdometerUpdateModalProps) {
  const [currentState, setCurrentState] = React.useState<ModalState>('choice')
  const [odometerData, setOdometerData] = React.useState<OdometerData | null>(null)
  const [manualMileage, setManualMileage] = React.useState('')
  const [notes, setNotes] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Reset state when modal opens/closes
  React.useEffect(() => {
    if (isOpen) {
      setCurrentState('choice')
      setOdometerData(null)
      setManualMileage('')
      setNotes('')
      setError(null)
      setIsSubmitting(false)
    }
  }, [isOpen])

  const handleOdometerRead = (data: OdometerData) => {
    console.log('📊 Odometer data received:', data)
    setOdometerData(data)
    setCurrentState('confirmation')
  }

  const handleManualEntry = () => {
    setCurrentState('manual')
  }

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const mileage = parseInt(manualMileage)
    if (!mileage || mileage < 0) {
      setError('Please enter a valid mileage')
      return
    }

    if (currentMileage && mileage < currentMileage) {
      setError(`New mileage (${mileage.toLocaleString()}) cannot be less than current mileage (${currentMileage.toLocaleString()})`)
      return
    }

    // Create manual odometer data
    const manualData: OdometerData = {
      type: 'odometer',
      current_mileage: mileage,
      display_type: 'manual_entry',
      units: 'miles',
      confidence: 100,
      reading_quality: 'manual_entry'
    }

    setOdometerData(manualData)
    setCurrentState('confirmation')
  }

  const handleConfirmUpdate = async () => {
    if (!odometerData) return

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`/api/vehicles/${vehicleId}/odometer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mileage: odometerData.current_mileage,
          source: odometerData.display_type === 'manual_entry' ? 'manual' : 'ocr',
          confidence_score: odometerData.confidence,
          display_type: odometerData.display_type,
          reading_quality: odometerData.reading_quality,
          fuel_level: odometerData.fuel_gauge,
          warning_lights: odometerData.warning_lights,
          notes: notes || undefined,
          ocr_data: odometerData.display_type !== 'manual_entry' ? odometerData : undefined
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update odometer')
      }

      const result = await response.json()
      console.log('✅ Odometer updated:', result)

      // Notify parent component
      onMileageUpdated(odometerData.current_mileage)
      
      // Close modal
      onClose()

    } catch (error) {
      console.error('❌ Error updating odometer:', error)
      setError(error instanceof Error ? error.message : 'Failed to update odometer')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBack = () => {
    switch (currentState) {
      case 'camera':
      case 'manual':
        setCurrentState('choice')
        break
      case 'confirmation':
        setCurrentState(odometerData?.display_type === 'manual_entry' ? 'manual' : 'choice')
        break
    }
    setError(null)
  }

  const getMileageDifference = () => {
    if (!odometerData || !currentMileage) return null
    return odometerData.current_mileage - currentMileage
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-md mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Gauge className="w-6 h-6 text-blue-600" />
            <div>
              <div className="font-semibold text-gray-900">Update Odometer</div>
              <div className="text-sm text-gray-600">{vehicleName}</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Mileage Display */}
        {currentMileage && (
          <div className="px-6 py-3 bg-gray-50 border-b">
            <div className="text-sm text-gray-600">Current Mileage</div>
            <div className="text-lg font-semibold text-gray-900">
              {currentMileage.toLocaleString()} miles
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {/* Content based on state */}
        <div className="p-6">
          {currentState === 'choice' && (
            <ChoiceView 
              onCameraSelected={() => setCurrentState('camera')}
              onManualSelected={handleManualEntry}
            />
          )}

          {currentState === 'camera' && (
            <OdometerReader
              onMileageRead={handleOdometerRead}
              onCancel={handleBack}
              title="Read Odometer"
            />
          )}

          {currentState === 'manual' && (
            <ManualEntryView
              mileage={manualMileage}
              onMileageChange={setManualMileage}
              notes={notes}
              onNotesChange={setNotes}
              onSubmit={handleManualSubmit}
              onBack={handleBack}
              currentMileage={currentMileage}
            />
          )}

          {currentState === 'confirmation' && odometerData && (
            <ConfirmationView
              odometerData={odometerData}
              mileageDifference={getMileageDifference()}
              notes={notes}
              onNotesChange={setNotes}
              onConfirm={handleConfirmUpdate}
              onBack={handleBack}
              isSubmitting={isSubmitting}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// Choice between camera and manual entry
function ChoiceView({ onCameraSelected, onManualSelected }: {
  onCameraSelected: () => void
  onManualSelected: () => void
}) {
  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <div className="text-lg font-medium text-gray-900 mb-2">
          How would you like to update the odometer?
        </div>
        <div className="text-sm text-gray-600">
          Take a photo or enter manually
        </div>
      </div>

      <Button
        onClick={onCameraSelected}
        className="w-full h-12"
        size="lg"
      >
        <Camera className="w-5 h-5 mr-2" />
        Take Photo of Dashboard
      </Button>

      <Button
        onClick={onManualSelected}
        variant="outline"
        className="w-full h-12"
        size="lg"
      >
        <Edit3 className="w-5 h-5 mr-2" />
        Enter Mileage Manually
      </Button>
    </div>
  )
}

// Manual mileage entry form
function ManualEntryView({ 
  mileage, 
  onMileageChange, 
  notes, 
  onNotesChange, 
  onSubmit, 
  onBack,
  currentMileage 
}: {
  mileage: string
  onMileageChange: (value: string) => void
  notes: string
  onNotesChange: (value: string) => void
  onSubmit: (e: React.FormEvent) => void
  onBack: () => void
  currentMileage?: number
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="text-center mb-6">
        <div className="text-lg font-medium text-gray-900 mb-2">
          Enter Current Mileage
        </div>
        <div className="text-sm text-gray-600">
          Enter the exact reading from your odometer
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Current Mileage *
        </label>
        <input
          type="number"
          value={mileage}
          onChange={(e) => onMileageChange(e.target.value)}
          placeholder={currentMileage ? `Greater than ${currentMileage.toLocaleString()}` : "e.g., 45000"}
          className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          min={currentMileage || 0}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Notes (Optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Any additional notes about this reading..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows={3}
        />
      </div>

      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          onClick={onBack}
          variant="outline"
          className="flex-1"
        >
          Back
        </Button>
        <Button
          type="submit"
          className="flex-1"
        >
          Continue
        </Button>
      </div>
    </form>
  )
}

// Confirmation view with odometer data
function ConfirmationView({
  odometerData,
  mileageDifference,
  notes,
  onNotesChange,
  onConfirm,
  onBack,
  isSubmitting
}: {
  odometerData: OdometerData
  mileageDifference: number | null
  notes: string
  onNotesChange: (value: string) => void
  onConfirm: () => void
  onBack: () => void
  isSubmitting: boolean
}) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-600" />
        <div className="text-lg font-medium text-gray-900 mb-2">
          Confirm Odometer Reading
        </div>
        <div className="text-sm text-gray-600">
          Please verify this information is correct
        </div>
      </div>

      {/* Reading Details */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">New Mileage</span>
          <span className="text-lg font-semibold text-gray-900">
            {odometerData.current_mileage.toLocaleString()} miles
          </span>
        </div>

        {mileageDifference !== null && (
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Miles Added</span>
            <span className="text-sm font-medium text-green-600 flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              +{mileageDifference.toLocaleString()} miles
            </span>
          </div>
        )}

        {odometerData.display_type !== 'manual_entry' && (
          <>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Source</span>
              <span className="text-sm text-gray-600 capitalize">
                {odometerData.display_type} Display
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Confidence</span>
              <span className="text-sm text-gray-600">
                {odometerData.confidence}%
              </span>
            </div>
          </>
        )}

        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">Date</span>
          <span className="text-sm text-gray-600 flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {new Date().toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Additional Details */}
      {(odometerData.fuel_gauge || odometerData.warning_lights?.length) && (
        <div className="bg-blue-50 rounded-lg p-4 space-y-2">
          <div className="text-sm font-medium text-blue-900">Additional Information</div>
          {odometerData.fuel_gauge && (
            <div className="text-sm text-blue-800">
              Fuel Level: <span className="capitalize">{odometerData.fuel_gauge}</span>
            </div>
          )}
          {odometerData.warning_lights && odometerData.warning_lights.length > 0 && (
            <div className="text-sm text-blue-800">
              Warning Lights: {odometerData.warning_lights.join(', ')}
            </div>
          )}
        </div>
      )}

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Notes (Optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Any additional notes about this reading..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows={3}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <Button
          onClick={onBack}
          variant="outline"
          className="flex-1"
          disabled={isSubmitting}
        >
          Back
        </Button>
        <Button
          onClick={onConfirm}
          className="flex-1"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Updating...
            </>
          ) : (
            'Update Odometer'
          )}
        </Button>
      </div>
    </div>
  )
}
