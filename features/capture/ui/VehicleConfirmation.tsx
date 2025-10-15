// Vehicle Confirmation - Shows decoded VIN details for user confirmation
import React from 'react'
import { Button } from '@/components/ui/button'
import { 
  Car, 
  X, 
  CheckCircle,
  AlertTriangle,
  Edit3,
  ArrowLeft
} from 'lucide-react'

interface VehicleDetails {
  vin: string
  year: number
  make: string
  model: string
  trim?: string
  engine?: string
  transmission?: string
  drivetrain?: string
  fuel_type?: string
  body_style?: string
  confidence: number
}

interface VehicleConfirmationProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (vehicle: VehicleDetails) => void
  onEdit: (vehicle: VehicleDetails) => void
  onBack: () => void
  vehicle: VehicleDetails | null
}

export function VehicleConfirmation({ 
  isOpen, 
  onClose, 
  onConfirm, 
  onEdit,
  onBack,
  vehicle
}: VehicleConfirmationProps) {
  if (!isOpen || !vehicle) return null

  const getConfidenceColor = () => {
    if (vehicle.confidence >= 80) return 'text-green-600 bg-green-50'
    if (vehicle.confidence >= 60) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  const getConfidenceIcon = () => {
    if (vehicle.confidence >= 80) return <CheckCircle className="w-4 h-4" />
    return <AlertTriangle className="w-4 h-4" />
  }

  const hasBasicInfo = vehicle.year && vehicle.make && vehicle.model

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Fixed Header */}
        <div className="p-6 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <button onClick={onBack} className="p-1 hover:bg-gray-100 rounded mr-2">
              <ArrowLeft className="w-5 h-5 text-gray-500" />
            </button>
            <h2 className="text-lg font-semibold text-gray-900 flex-1">
              Confirm Vehicle Details
            </h2>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          
          {/* Confidence indicator */}
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${getConfidenceColor()}`}>
            {getConfidenceIcon()}
            {vehicle.confidence}% confidence
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {hasBasicInfo ? (
            <div className="space-y-6">
              {/* Vehicle summary */}
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Car className="w-8 h-8 text-blue-600" />
                </div>
                
                <div className="text-xl font-semibold text-gray-900 mb-2">
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </div>
                
                {vehicle.trim && (
                  <div className="text-sm text-gray-600 mb-2">
                    {vehicle.trim}
                  </div>
                )}
                
                <div className="text-sm text-gray-500 font-mono">
                  VIN: {vehicle.vin}
                </div>
              </div>

              {/* Additional details */}
              <div className="space-y-3">
                <div className="text-sm font-medium text-gray-700 mb-3">
                  Vehicle Specifications:
                </div>
                
                {vehicle.engine && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Engine:</span>
                    <span className="text-gray-900 font-medium">{vehicle.engine}</span>
                  </div>
                )}
                
                {vehicle.transmission && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Transmission:</span>
                    <span className="text-gray-900 font-medium">{vehicle.transmission}</span>
                  </div>
                )}
                
                {vehicle.drivetrain && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Drivetrain:</span>
                    <span className="text-gray-900 font-medium">{vehicle.drivetrain}</span>
                  </div>
                )}
                
                {vehicle.fuel_type && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Fuel Type:</span>
                    <span className="text-gray-900 font-medium">{vehicle.fuel_type}</span>
                  </div>
                )}
                
                {vehicle.body_style && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Body Style:</span>
                    <span className="text-gray-900 font-medium">{vehicle.body_style}</span>
                  </div>
                )}
              </div>

              {vehicle.confidence < 80 && (
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <div className="text-sm text-yellow-800">
                    <strong>Please verify:</strong> Some details may need correction. 
                    You can edit them before adding the vehicle.
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertTriangle className="w-8 h-8 mx-auto mb-4 text-yellow-600" />
              <div className="text-lg font-medium text-gray-900 mb-2">
                Limited Information
              </div>
              <div className="text-sm text-gray-600 mb-4">
                We could only extract basic details from the VIN. 
                You may need to add additional information manually.
              </div>
              
              <div className="text-left space-y-2 p-4 bg-gray-50 rounded-lg">
                <div className="text-sm">
                  <span className="text-gray-600">VIN:</span>
                  <span className="ml-2 font-mono">{vehicle.vin}</span>
                </div>
                {vehicle.year > 0 && (
                  <div className="text-sm">
                    <span className="text-gray-600">Year:</span>
                    <span className="ml-2">{vehicle.year}</span>
                  </div>
                )}
                {vehicle.make && (
                  <div className="text-sm">
                    <span className="text-gray-600">Make:</span>
                    <span className="ml-2">{vehicle.make}</span>
                  </div>
                )}
                {vehicle.model && (
                  <div className="text-sm">
                    <span className="text-gray-600">Model:</span>
                    <span className="ml-2">{vehicle.model}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Fixed Footer */}
        <div className="p-6 border-t border-gray-100 flex-shrink-0">
          <div className="space-y-3">
            <Button 
              onClick={() => onConfirm(vehicle)}
              className="w-full"
              size="lg"
            >
              Add This Vehicle
            </Button>
            
            <div className="flex gap-3">
              <Button 
                onClick={() => onEdit(vehicle)}
                variant="outline"
                className="flex-1"
                size="sm"
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Edit Details
              </Button>
              
              <Button 
                onClick={onBack}
                variant="outline"
                className="flex-1"
                size="sm"
              >
                Scan Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
