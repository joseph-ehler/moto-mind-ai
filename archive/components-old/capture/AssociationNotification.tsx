// Association Notification - Shows auto-association with easy undo
import React, { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Car, 
  CheckCircle,
  X,
  Undo2
} from 'lucide-react'

interface AssociationNotificationProps {
  isOpen: boolean
  onClose: () => void
  onUndo: () => void
  vehicle: any
  documentType: string
  documentSummary: string
  confidence: number
  autoCloseDelay?: number // milliseconds, default 5000
}

export function AssociationNotification({ 
  isOpen, 
  onClose, 
  onUndo,
  vehicle,
  documentType,
  documentSummary,
  confidence,
  autoCloseDelay = 5000
}: AssociationNotificationProps) {
  const [timeLeft, setTimeLeft] = React.useState(autoCloseDelay / 1000)

  useEffect(() => {
    if (!isOpen) return

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          onClose()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isOpen, onClose])

  useEffect(() => {
    if (isOpen) {
      setTimeLeft(autoCloseDelay / 1000)
    }
  }, [isOpen, autoCloseDelay])

  if (!isOpen) return null

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        {/* Success header */}
        <div className="p-4 bg-green-50 border-b border-green-100">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div className="flex-1">
              <div className="font-medium text-green-900">
                Document saved successfully
              </div>
              <div className="text-sm text-green-700">
                {confidence}% confidence match
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="p-1 hover:bg-green-100 rounded"
            >
              <X className="w-4 h-4 text-green-600" />
            </button>
          </div>
        </div>

        {/* Document and vehicle info */}
        <div className="p-4">
          {/* Document summary */}
          <div className="mb-3">
            <div className="text-sm font-medium text-gray-900 mb-1">
              {documentType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </div>
            <div className="text-sm text-gray-600">
              {documentSummary}
            </div>
          </div>

          {/* Associated vehicle */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
              {vehicle.hero_image_url ? (
                <img 
                  src={vehicle.hero_image_url} 
                  alt={`${vehicle.make} ${vehicle.model}`}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <Car className="w-5 h-5 text-gray-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </div>
              {vehicle.license_plate && (
                <div className="text-sm text-gray-600">
                  {vehicle.license_plate}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-gray-100 flex gap-2">
          <Button 
            onClick={onUndo} 
            variant="outline" 
            size="sm"
            className="flex-1"
          >
            <Undo2 className="w-4 h-4 mr-2" />
            Wrong vehicle?
          </Button>
          
          {/* Auto-close countdown */}
          <div className="flex items-center text-xs text-gray-500 px-2">
            {timeLeft}s
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
          <div 
            className="h-full bg-green-500 transition-all duration-1000 ease-linear"
            style={{ 
              width: `${(timeLeft / (autoCloseDelay / 1000)) * 100}%` 
            }}
          />
        </div>
      </div>
    </div>
  )
}
