// VIN Scanner Component - Camera capture and VIN extraction
import React from 'react'
import { Button } from '@/components/ui/button'
import { 
  Camera, 
  X, 
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Loader2
} from 'lucide-react'

interface VINScanResult {
  vin: string
  confidence: number
  vehicle: {
    year: number
    make: string
    model: string
    trim?: string
    engine?: string
    transmission?: string
    drivetrain?: string
    fuel_type?: string
    body_style?: string
  }
}

interface VINScannerProps {
  isOpen: boolean
  onClose: () => void
  onVINDetected: (result: VINScanResult) => void
  onManualEntry: () => void
}

export function VINScanner({ 
  isOpen, 
  onClose, 
  onVINDetected,
  onManualEntry
}: VINScannerProps) {
  const [isScanning, setIsScanning] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    await processVINImage(file)
  }

  const handleCameraCapture = () => {
    fileInputRef.current?.click()
  }

  const processVINImage = async (file: File) => {
    setIsScanning(true)
    setError(null)

    try {
      console.log('📷 Processing VIN image:', { name: file.name, size: file.size })

      const formData = new FormData()
      formData.append('image', file)

      const response = await fetch('/api/scan-vin', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || `API error: ${response.status}`)
      }

      const result = await response.json()
      console.log('✅ VIN scan result:', result)

      if (result.success && result.vin) {
        onVINDetected({
          vin: result.vin,
          confidence: result.confidence,
          vehicle: result.vehicle
        })
      } else {
        setError('No VIN detected in image. Please try again or enter manually.')
      }

    } catch (error) {
      console.error('❌ VIN scan error:', error)
      setError(error instanceof Error ? error.message : 'Failed to scan VIN')
    } finally {
      setIsScanning(false)
    }
  }

  const handleRetry = () => {
    setError(null)
    handleCameraCapture()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full">
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Scan VIN
            </h2>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          
          <div className="text-sm text-gray-600">
            Take a photo of your vehicle's VIN to automatically fill in details
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {!isScanning && !error && (
            <div className="text-center">
              {/* VIN location guide */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <div className="text-sm font-medium text-blue-900 mb-2">
                  Where to find your VIN:
                </div>
                <ul className="text-sm text-blue-700 space-y-1 text-left">
                  <li>• Dashboard near windshield (visible from outside)</li>
                  <li>• Driver's side door jamb sticker</li>
                  <li>• Engine bay on metal plate</li>
                  <li>• Registration or insurance documents</li>
                </ul>
              </div>

              {/* Camera button */}
              <Button 
                onClick={handleCameraCapture}
                className="w-full mb-4"
                size="lg"
              >
                <Camera className="w-5 h-5 mr-2" />
                Take Photo of VIN
              </Button>

              {/* Manual entry option */}
              <Button 
                onClick={onManualEntry}
                variant="outline"
                className="w-full"
                size="sm"
              >
                Enter vehicle details manually
              </Button>
            </div>
          )}

          {isScanning && (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
              <div className="text-lg font-medium text-gray-900 mb-2">
                Scanning VIN...
              </div>
              <div className="text-sm text-gray-600">
                Extracting vehicle details from your photo
              </div>
            </div>
          )}

          {error && (
            <div className="text-center">
              <AlertTriangle className="w-8 h-8 mx-auto mb-4 text-red-600" />
              <div className="text-lg font-medium text-gray-900 mb-2">
                Scan Failed
              </div>
              <div className="text-sm text-gray-600 mb-6">
                {error}
              </div>
              
              <div className="space-y-3">
                <Button 
                  onClick={handleRetry}
                  className="w-full"
                  size="lg"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                
                <Button 
                  onClick={onManualEntry}
                  variant="outline"
                  className="w-full"
                  size="sm"
                >
                  Enter details manually instead
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Hidden file input for camera */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    </div>
  )
}
