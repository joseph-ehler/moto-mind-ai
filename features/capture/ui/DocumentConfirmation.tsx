// Document Confirmation Modal - Ro-inspired design with vehicle association
import React from 'react'
import { Button } from '@/components/ui/button'
import { 
  CheckCircle, 
  AlertTriangle, 
  X, 
  Edit3,
  RotateCcw,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { VehicleSelector } from './VehicleSelector'
import { AssociationConfirmation } from './AssociationConfirmation'
import { AssociationNotification } from './AssociationNotification'
import { calculateVehicleMatches, getAssociationStrategy, VehicleMatch } from '@/lib/utils/vehicleMatching'

interface DocumentData {
  type: string
  confidence?: number
  [key: string]: any
}

interface DocumentConfirmationProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (data: DocumentData, vehicle?: any) => void
  onRetry: () => void
  data: DocumentData | null
  vehicles: any[]
}

export function DocumentConfirmation({ 
  isOpen, 
  onClose, 
  onConfirm, 
  onRetry, 
  data,
  vehicles
}: DocumentConfirmationProps) {
  const [showDetails, setShowDetails] = React.useState(false)
  const [currentView, setCurrentView] = React.useState<'document' | 'vehicle_selector' | 'confirmation'>('document')
  const [vehicleMatches, setVehicleMatches] = React.useState<VehicleMatch[]>([])
  const [selectedVehicle, setSelectedVehicle] = React.useState<any>(null)
  const [associationStrategy, setAssociationStrategy] = React.useState<any>(null)

  // Get confidence level and color
  const confidence = data?.confidence || 95
  const getConfidenceColor = () => {
    if (confidence >= 80) return 'text-green-600 bg-green-50'
    if (confidence >= 60) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  const getConfidenceIcon = () => {
    if (confidence >= 80) return <CheckCircle className="w-4 h-4" />
    return <AlertTriangle className="w-4 h-4" />
  }

  // Calculate vehicle matches when data changes
  React.useEffect(() => {
    if (data && vehicles.length > 0) {
      console.log('🔍 Calculating vehicle matches for:', data)
      console.log('🚗 Available vehicles:', vehicles.map(v => `${v.year} ${v.make} ${v.model}`))
      
      const matches = calculateVehicleMatches(data, vehicles)
      console.log('📊 Vehicle match results:', matches.map(m => ({
        vehicle: `${m.vehicle.year} ${m.vehicle.make} ${m.vehicle.model}`,
        confidence: m.confidence,
        reasons: m.reasons
      })))
      
      setVehicleMatches(matches)
      
      const strategy = getAssociationStrategy(matches)
      console.log('🎯 Association strategy:', strategy)
      setAssociationStrategy(strategy)
      
      if (strategy.bestMatch) {
        setSelectedVehicle(strategy.bestMatch.vehicle)
      }
    }
  }, [data, vehicles])

  // Handle the main "Save" button click
  const handleSaveDocument = () => {
    if (!associationStrategy || !data) return

    switch (associationStrategy.strategy) {
      case 'auto':
        // High confidence - auto-associate directly
        onConfirm(data, selectedVehicle)
        break
      case 'confirm':
        // Medium confidence - show confirmation view
        setCurrentView('confirmation')
        break
      case 'select':
        // Low confidence - show vehicle selector
        setCurrentView('vehicle_selector')
        break
      case 'new_vehicle':
        // No vehicles or no matches - show vehicle selector
        setCurrentView('vehicle_selector')
        break
    }
  }

  // Vehicle association handlers
  const handleVehicleSelected = (vehicle: any) => {
    if (!data) return
    setSelectedVehicle(vehicle)
    setCurrentView('document')
    onConfirm(data, vehicle)
  }

  const handleAssociationConfirmed = (vehicle: any) => {
    if (!data) return
    setCurrentView('document')
    onConfirm(data, vehicle)
  }

  const handleChooseDifferentVehicle = () => {
    setCurrentView('vehicle_selector')
  }

  const handleNewVehicle = () => {
    // TODO: Implement new vehicle creation flow
    console.log('New vehicle creation not implemented yet')
    setCurrentView('document')
  }

  const handleSkipAssociation = () => {
    setCurrentView('document')
    if (data) onConfirm(data) // Save without vehicle association
  }

  // Early return after all hooks
  if (!isOpen || !data) return null

  // Document-specific layouts following Ro's "one glance = status" principle
  const renderDocumentSummary = () => {
    switch (data.type) {
      case 'service_invoice':
        return (
          <div className="space-y-2">
            <div className="text-lg font-semibold text-gray-900">
              ${data.total_cost?.toLocaleString()} • {data.shop_name}
            </div>
            <div className="text-sm text-gray-600">
              {data.service_type} • {data.date}
            </div>
            {data.mileage && (
              <div className="text-sm text-gray-500">
                At {data.mileage?.toLocaleString()} miles
              </div>
            )}
          </div>
        )
      
      case 'fuel_receipt':
        return (
          <div className="space-y-2">
            <div className="text-lg font-semibold text-gray-900">
              ${data.total_amount} • {data.station_name}
            </div>
            <div className="text-sm text-gray-600">
              {data.gallons} gal @ ${data.price_per_gallon}/gal • {data.date}
            </div>
          </div>
        )
      
      case 'parking_ticket':
        return (
          <div className="space-y-2">
            <div className="text-lg font-semibold text-gray-900">
              ${data.fine_amount} Fine • {data.violation_type}
            </div>
            <div className="text-sm text-gray-600">
              Due: {data.due_date} • {data.location}
            </div>
          </div>
        )
      
      case 'insurance_document':
        return (
          <div className="space-y-2">
            <div className="text-lg font-semibold text-gray-900">
              {data.insurance_company} • Policy #{data.policy_number}
            </div>
            <div className="text-sm text-gray-600">
              Expires: {data.expiration_date} • {data.coverage_type}
            </div>
          </div>
        )
      
      case 'registration':
        return (
          <div className="space-y-2">
            <div className="text-lg font-semibold text-gray-900">
              {data.state} Registration • {data.license_plate}
            </div>
            <div className="text-sm text-gray-600">
              Expires: {data.expiration_date} • {data.vehicle_year} {data.make} {data.model}
            </div>
          </div>
        )
      
      case 'inspection_certificate':
        return (
          <div className="space-y-2">
            <div className="text-lg font-semibold text-gray-900">
              {data.result?.toUpperCase()} • {data.inspection_type}
            </div>
            <div className="text-sm text-gray-600">
              Expires: {data.expiration_date} • {data.station_name}
            </div>
          </div>
        )
      
      case 'odometer':
        return (
          <div className="space-y-2">
            <div className="text-lg font-semibold text-gray-900">
              {data.current_mileage?.toLocaleString()} miles
            </div>
            <div className="text-sm text-gray-600">
              Odometer reading
            </div>
          </div>
        )
      
      default:
        return (
          <div className="space-y-2">
            <div className="text-lg font-semibold text-gray-900">
              {data.document_description || 'Unknown Document'}
            </div>
            <div className="text-sm text-gray-600">
              {data.extracted_text || 'Document processed'}
            </div>
          </div>
        )
    }
  }

  const getDocumentTypeLabel = () => {
    const labels: { [key: string]: string } = {
      service_invoice: 'Service Invoice',
      fuel_receipt: 'Fuel Receipt',
      parking_ticket: 'Parking Ticket',
      insurance_document: 'Insurance Document',
      registration: 'Registration',
      inspection_certificate: 'Inspection Certificate',
      odometer: 'Odometer Reading',
      unknown_document: 'Unknown Document'
    }
    return labels[data.type] || 'Document'
  }

  const shouldShowConfirmation = confidence >= 60

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {getDocumentTypeLabel()} Detected
            </h2>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          
          {/* Confidence indicator */}
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${getConfidenceColor()}`}>
            {getConfidenceIcon()}
            {confidence}% confidence
          </div>
        </div>

        {/* Document summary */}
        <div className="p-6">
          {renderDocumentSummary()}
          
          {/* Expandable details */}
          {Object.keys(data).length > 4 && (
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-2 mt-4 text-sm text-gray-600 hover:text-gray-900"
            >
              {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {showDetails ? 'Hide details' : 'Show details'}
            </button>
          )}
          
          {showDetails && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="space-y-2 text-sm">
                {Object.entries(data)
                  .filter(([key]) => !['type', 'confidence'].includes(key))
                  .map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-gray-600 capitalize">
                        {key.replace(/_/g, ' ')}:
                      </span>
                      <span className="text-gray-900 font-medium">
                        {Array.isArray(value) ? value.join(', ') : String(value || 'N/A')}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions - Ro's "one click = action" principle */}
        <div className="p-6 border-t border-gray-100 space-y-3">
          {shouldShowConfirmation ? (
            <>
              <Button 
                onClick={handleSaveDocument}
                className="w-full"
                size="lg"
              >
                Save {getDocumentTypeLabel()}
              </Button>
              <div className="flex gap-3">
                <Button 
                  onClick={onRetry} 
                  variant="outline" 
                  className="flex-1"
                  size="sm"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Retake
                </Button>
                <Button 
                  onClick={() => {/* TODO: Edit mode */}} 
                  variant="outline" 
                  className="flex-1"
                  size="sm"
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <div className="text-center text-sm text-gray-600 mb-4">
                Low confidence - please verify or retake photo
              </div>
              <Button 
                onClick={onRetry} 
                className="w-full"
                size="lg"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              <Button 
                onClick={() => onConfirm(data)} 
                variant="outline" 
                className="w-full"
                size="sm"
              >
                Save Anyway
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Vehicle Association Modals */}
      <VehicleSelector
        isOpen={currentView === 'vehicle_selector'}
        onClose={() => setCurrentView('document')}
        onSelectVehicle={handleVehicleSelected}
        onNewVehicle={handleNewVehicle}
        onSkip={handleSkipAssociation}
        matches={vehicleMatches}
        documentType={getDocumentTypeLabel()}
        documentSummary={renderDocumentSummaryText()}
      />

      <AssociationConfirmation
        isOpen={currentView === 'confirmation'}
        onClose={() => setCurrentView('document')}
        onConfirm={handleAssociationConfirmed}
        onChooseDifferent={handleChooseDifferentVehicle}
        bestMatch={vehicleMatches[0]}
        documentType={getDocumentTypeLabel()}
        documentSummary={renderDocumentSummaryText()}
      />

      <AssociationNotification
        isOpen={false}
        onClose={() => setCurrentView('document')}
        onUndo={() => {
          setCurrentView('vehicle_selector')
        }}
        vehicle={selectedVehicle}
        documentType={getDocumentTypeLabel()}
        documentSummary={renderDocumentSummaryText()}
        confidence={vehicleMatches[0]?.confidence || 95}
      />
    </div>
  )

  // Helper function to render document summary as text
  function renderDocumentSummaryText(): string {
    if (!data) return ''
    
    switch (data.type) {
      case 'service_invoice':
        return `$${data.total_cost?.toLocaleString()} • ${data.shop_name}`
      case 'fuel_receipt':
        return `$${data.total_amount} • ${data.station_name}`
      case 'parking_ticket':
        return `$${data.fine_amount} Fine • ${data.violation_type}`
      case 'insurance_document':
        return `${data.insurance_company} • Policy #${data.policy_number}`
      case 'registration':
        return `${data.state} Registration • ${data.license_plate}`
      case 'inspection_certificate':
        return `${data.result?.toUpperCase()} • ${data.inspection_type}`
      case 'odometer':
        return `${data.current_mileage?.toLocaleString()} miles`
      default:
        return data.document_description || 'Document processed'
    }
  }
}
