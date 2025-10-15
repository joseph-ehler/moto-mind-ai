// Association Confirmation - When we have a good guess but want user confirmation
import React from 'react'
import { Button } from '@/components/ui/button'
import { 
  Car, 
  X, 
  CheckCircle,
  AlertTriangle,
  ChevronRight
} from 'lucide-react'
import { VehicleMatch } from '@/utils/vehicleMatching'

interface AssociationConfirmationProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (vehicle: any) => void
  onChooseDifferent: () => void
  bestMatch: VehicleMatch
  documentType: string
  documentSummary: string
}

export function AssociationConfirmation({ 
  isOpen, 
  onClose, 
  onConfirm, 
  onChooseDifferent,
  bestMatch,
  documentType,
  documentSummary
}: AssociationConfirmationProps) {
  if (!isOpen) return null

  const vehicle = bestMatch.vehicle
  const confidence = bestMatch.confidence

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full">
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Confirm vehicle
            </h2>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          
          {/* Confidence indicator */}
          <div className="flex items-center gap-2 mb-4">
            {confidence >= 70 ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
            )}
            <span className="text-sm text-gray-600">
              {confidence}% confidence match
            </span>
          </div>

          {/* Document summary */}
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="text-sm font-medium text-blue-900 mb-1">
              {documentType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </div>
            <div className="text-sm text-blue-700">
              {documentSummary}
            </div>
          </div>
        </div>

        {/* Vehicle match */}
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="text-lg font-medium text-gray-900 mb-2">
              Is this for your
            </div>
            
            {/* Vehicle card */}
            <div className="p-4 border-2 border-blue-200 bg-blue-50 rounded-xl">
              <div className="flex items-center gap-4">
                {/* Vehicle thumbnail */}
                <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                  {vehicle.hero_image_url ? (
                    <img 
                      src={vehicle.hero_image_url} 
                      alt={`${vehicle.make} ${vehicle.model}`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <Car className="w-8 h-8 text-gray-400" />
                  )}
                </div>

                {/* Vehicle details */}
                <div className="flex-1 text-left">
                  <div className="font-semibold text-gray-900 text-lg">
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </div>
                  {vehicle.license_plate && (
                    <div className="text-sm text-gray-600">
                      {vehicle.license_plate}
                    </div>
                  )}
                  {vehicle.current_mileage && (
                    <div className="text-sm text-gray-600">
                      {vehicle.current_mileage.toLocaleString()} miles
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Why we think it's this vehicle */}
          {bestMatch.reasons.length > 0 && (
            <div className="mb-6 p-3 bg-gray-50 rounded-lg">
              <div className="text-sm font-medium text-gray-700 mb-2">
                Why we think it's this vehicle:
              </div>
              <ul className="text-sm text-gray-600 space-y-1">
                {bestMatch.reasons.slice(0, 3).map((reason, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                    {reason}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-100 space-y-3">
          <Button 
            onClick={() => onConfirm(vehicle)} 
            className="w-full"
            size="lg"
          >
            Yes, that's correct
          </Button>
          
          <Button 
            onClick={onChooseDifferent} 
            variant="outline" 
            className="w-full"
            size="sm"
          >
            <span>No, choose different vehicle</span>
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  )
}
