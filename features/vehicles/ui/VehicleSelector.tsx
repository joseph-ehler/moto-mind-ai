// Vehicle Selector - When document can't be auto-associated
import React from 'react'
import { Button } from '@/components/ui/button'
import { 
  Car, 
  Plus, 
  X, 
  AlertTriangle,
  CheckCircle,
  HelpCircle
} from 'lucide-react'
import { VehicleMatch } from '@/lib/utils/vehicleMatching'

interface VehicleSelectorProps {
  isOpen: boolean
  onClose: () => void
  onSelectVehicle: (vehicle: any) => void
  onNewVehicle: () => void
  onSkip: () => void
  matches: VehicleMatch[]
  documentType: string
  documentSummary: string
}

export function VehicleSelector({ 
  isOpen, 
  onClose, 
  onSelectVehicle, 
  onNewVehicle,
  onSkip,
  matches,
  documentType,
  documentSummary
}: VehicleSelectorProps) {
  if (!isOpen) return null

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 60) return <CheckCircle className="w-4 h-4 text-green-600" />
    if (confidence >= 30) return <AlertTriangle className="w-4 h-4 text-yellow-600" />
    return <HelpCircle className="w-4 h-4 text-gray-400" />
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 60) return 'border-green-200 bg-green-50'
    if (confidence >= 30) return 'border-yellow-200 bg-yellow-50'
    return 'border-gray-200 bg-gray-50'
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Which vehicle is this for?
            </h2>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
              <X className="w-5 h-5 text-gray-500" />
            </button>
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

        {/* Vehicle options */}
        <div className="p-6 space-y-3 max-h-96 overflow-y-auto">
          {matches.map((match) => (
            <button
              key={match.vehicle.id}
              onClick={() => onSelectVehicle(match.vehicle)}
              className={`w-full p-4 rounded-xl border-2 text-left hover:shadow-sm transition-all ${getConfidenceColor(match.confidence)}`}
            >
              <div className="flex items-center gap-4">
                {/* Vehicle thumbnail */}
                <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                  {match.vehicle.hero_image_url ? (
                    <img 
                      src={match.vehicle.hero_image_url} 
                      alt={`${match.vehicle.make} ${match.vehicle.model}`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <Car className="w-6 h-6 text-gray-400" />
                  )}
                </div>

                {/* Vehicle info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="font-medium text-gray-900">
                      {match.vehicle.year} {match.vehicle.make} {match.vehicle.model}
                    </div>
                    {getConfidenceIcon(match.confidence)}
                    <span className="text-sm text-gray-600">
                      {match.confidence}%
                    </span>
                  </div>
                  
                  {match.confidence > 0 && (
                    <div className="text-sm text-gray-600">
                      {match.explanation}
                    </div>
                  )}
                  
                  {match.vehicle.license_plate && (
                    <div className="text-xs text-gray-500 mt-1">
                      {match.vehicle.license_plate} • {match.vehicle.current_mileage?.toLocaleString()} miles
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-100 space-y-3">
          {/* New vehicle option */}
          <button
            onClick={onNewVehicle}
            className="w-full p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-colors"
          >
            <div className="flex items-center justify-center gap-3 text-gray-600 hover:text-blue-600">
              <Plus className="w-5 h-5" />
              <span className="font-medium">Add new vehicle</span>
            </div>
          </button>

          {/* Skip option */}
          <Button 
            onClick={onSkip} 
            variant="outline" 
            className="w-full"
            size="sm"
          >
            Save without vehicle association
          </Button>
        </div>

        {/* Help text */}
        <div className="px-6 pb-6">
          <div className="text-xs text-gray-500 text-center">
            💡 For better auto-detection, include VIN or license plate in photos
          </div>
        </div>
      </div>
    </div>
  )
}
