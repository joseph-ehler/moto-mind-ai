'use client'

/**
 * Onboarding: Vehicle Confirmation Screen
 * Shows decoded VIN data with AI insights
 * User confirms and adds vehicle
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Stack, Heading, Text } from '@/components/design-system'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  CheckCircle2, XCircle, AlertCircle, Sparkles, 
  Gauge, Fuel, Wrench, DollarSign, Shield, Factory,
  Edit, Loader2, Share2, Check, Car
} from 'lucide-react'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { addVehicleByVIN } from '@/lib/vehicles'
import { DuplicateVehicleDialog } from '@/components/vehicle/DuplicateVehicleDialog'
import type { VINDecodeResult } from '@/lib/vin/types'
import type { DuplicateVehicleDetection } from '@/lib/vehicles/canonical-types'

export default function ConfirmPage() {
  const router = useRouter()
  const { user, isLoading: isAuthLoading } = useCurrentUser()
  const [vehicleData, setVehicleData] = useState<VINDecodeResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  
  // New: Mileage and nickname
  const [currentMileage, setCurrentMileage] = useState('')
  const [nickname, setNickname] = useState('')
  
  // New: Duplicate detection
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false)
  const [duplicateData, setDuplicateData] = useState<DuplicateVehicleDetection | null>(null)
  
  // Error handling
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Load vehicle data from session storage
    const dataStr = sessionStorage.getItem('onboarding_vehicle_data')
    
    if (!dataStr) {
      router.push('/onboarding/vin')
      return
    }

    try {
      const data = JSON.parse(dataStr)
      setVehicleData(data)
      // Set default nickname
      setNickname(data.vehicle.displayName)
    } catch (err) {
      console.error('[Onboarding/Confirm] Failed to parse vehicle data:', err)
      router.push('/onboarding/vin')
    }
  }, [router])

  const handleConfirm = async () => {
    if (!vehicleData || !user) return
    
    // Validate mileage
    const mileageNum = parseInt(currentMileage)
    if (!currentMileage || isNaN(mileageNum) || mileageNum < 0) {
      setError('Please enter a valid current mileage')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      console.log('[Onboarding/Confirm] Adding vehicle via canonical system...')
      
      // Use canonical vehicle system
      const result = await addVehicleByVIN({
        vin: vehicleData.vin,
        tenantId: user.tenantId,
        userId: user.id,
        nickname: nickname || vehicleData.vehicle.displayName,
        currentMileage: mileageNum
      })
      
      // Handle duplicate detection
      if (result.duplicate?.isDuplicate) {
        console.log('[Onboarding/Confirm] Duplicate vehicle detected')
        setDuplicateData(result.duplicate)
        setShowDuplicateDialog(true)
        setIsLoading(false)
        return
      }
      
      // Show history preview if previous owners (optional enhancement)
      if (result.historyPreview && result.historyPreview.totalOwners > 1) {
        console.log('[Onboarding/Confirm] Vehicle has previous owners:', result.historyPreview.totalOwners)
        // TODO: Show history preview UI in future enhancement
      }

      console.log('[Onboarding/Confirm] ✅ Vehicle added successfully!')
      
      // Clear session storage
      sessionStorage.removeItem('onboarding_vin')
      sessionStorage.removeItem('onboarding_vehicle_data')

      // Go to completion screen
      router.push('/onboarding/complete')

    } catch (error: any) {
      console.error('[Onboarding/Confirm] Failed to add vehicle:', error)
      setError(error.message || 'Failed to add vehicle. Please try again.')
      setIsLoading(false)
    }
  }
  
  const handleDuplicateRequestAccess = () => {
    // TODO: Implement in Week 3 - shared vehicle access
    console.log('[Onboarding/Confirm] Request access clicked')
    setShowDuplicateDialog(false)
    router.push('/dashboard')
  }
  
  const handleDuplicateViewExisting = () => {
    setShowDuplicateDialog(false)
    router.push('/dashboard')
  }

  const handleEdit = () => {
    router.push('/onboarding/vehicle')
  }

  const handleShare = async () => {
    if (!vehicleData) return

    const shareText = `Check out my ${vehicleData.vehicle.displayName}!\n\n` +
      `🤖 AI Reliability Score: ${(vehicleData.aiInsights.reliabilityScore * 100).toFixed(0)}%\n` +
      `⛽ Fuel Economy: ${vehicleData.mockData.mpgCity}/${vehicleData.mockData.mpgHighway} MPG\n` +
      `💰 Est. Annual Cost: $${vehicleData.mockData.annualCost}/year\n\n` +
      `Get your FREE VIN report at motomind.ai`

    try {
      // Try native share API first (mobile)
      if (navigator.share) {
        await navigator.share({
          title: `My ${vehicleData.vehicle.displayName}`,
          text: shareText
        })
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(shareText)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch (err) {
      // Silently fail if user cancels
      console.log('[Share] User cancelled or error:', err)
    }
  }

  if (!vehicleData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  const { vehicle, specs, extendedSpecs, mockData, aiInsights } = vehicleData

  return (
    <Stack spacing="xl" className="py-12 max-w-3xl mx-auto px-4">
      {/* Hero - Vehicle Name */}
      <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0">
        <CardContent className="pt-8 pb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <Heading level="hero" className="text-white mb-2">
            {vehicle.displayName}
          </Heading>
          <Text className="text-blue-100">
            VIN: {vehicleData.vin}
          </Text>
        </CardContent>
      </Card>

      {/* AI Reliability Score */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-green-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Text className="font-semibold text-green-900">
                  AI Reliability Score
                </Text>
                <Badge className="bg-green-600">
                  {(aiInsights.reliabilityScore * 100).toFixed(0)}%
                </Badge>
              </div>
              <Text className="text-sm text-green-700">
                {aiInsights.summary}
              </Text>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Specs Grid */}
      <Card>
        <CardHeader>
          <Heading level="title">Vehicle Specifications</Heading>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {/* Year */}
            <div>
              <Text className="text-sm text-gray-600 mb-1">Year</Text>
              <Text className="font-semibold">{vehicle.year}</Text>
            </div>
            
            {/* Make */}
            <div>
              <Text className="text-sm text-gray-600 mb-1">Make</Text>
              <Text className="font-semibold">{vehicle.make}</Text>
            </div>

            {/* Model */}
            <div>
              <Text className="text-sm text-gray-600 mb-1">Model</Text>
              <Text className="font-semibold">{vehicle.model}</Text>
            </div>

            {/* Trim */}
            {vehicle.trim && (
              <div>
                <Text className="text-sm text-gray-600 mb-1">Trim</Text>
                <Text className="font-semibold">{vehicle.trim}</Text>
              </div>
            )}

            {/* Body Type */}
            {specs.bodyType && (
              <div>
                <Text className="text-sm text-gray-600 mb-1">Body Type</Text>
                <Text className="font-semibold">{specs.bodyType}</Text>
              </div>
            )}

            {/* Drive Type */}
            {specs.driveType && (
              <div>
                <Text className="text-sm text-gray-600 mb-1">Drive Type</Text>
                <Text className="font-semibold">{specs.driveType}</Text>
              </div>
            )}

            {/* Engine */}
            {extendedSpecs?.engineCylinders && (
              <div>
                <Text className="text-sm text-gray-600 mb-1">Engine</Text>
                <Text className="font-semibold">
                  {extendedSpecs.engineDisplacement}L {extendedSpecs.engineCylinders}-Cyl
                </Text>
              </div>
            )}

            {/* Fuel Type */}
            {specs.fuelType && (
              <div>
                <Text className="text-sm text-gray-600 mb-1">Fuel Type</Text>
                <Text className="font-semibold">{specs.fuelType}</Text>
              </div>
            )}

            {/* Doors */}
            {extendedSpecs?.doors && (
              <div>
                <Text className="text-sm text-gray-600 mb-1">Doors</Text>
                <Text className="font-semibold">{extendedSpecs.doors} Doors</Text>
              </div>
            )}

            {/* Manufacturer */}
            {extendedSpecs?.manufacturer && (
              <div className="col-span-2">
                <Text className="text-sm text-gray-600 mb-1">
                  <Factory className="w-4 h-4 inline mr-1" />
                  Built by
                </Text>
                <Text className="font-semibold">
                  {extendedSpecs.manufacturer}
                  {extendedSpecs.plantCity && (
                    <span className="text-gray-600 font-normal">
                      {' '}in {extendedSpecs.plantCity}, {extendedSpecs.plantState}
                    </span>
                  )}
                </Text>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Safety Features */}
      {extendedSpecs && (
        <Card>
          <CardHeader>
            <Heading level="title">
              <Shield className="w-5 h-5 inline mr-2" />
              Safety Features
            </Heading>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {renderSafetyFeature('ABS', extendedSpecs.absType)}
              {renderSafetyFeature('Electronic Stability Control', extendedSpecs.electronicStabilityControl)}
              {renderSafetyFeature('Traction Control', extendedSpecs.tractionControl)}
              {renderSafetyFeature('Airbags', extendedSpecs.airBagLocations)}
              {renderSafetyFeature('Blind Spot Warning', extendedSpecs.blindSpotWarning)}
              {renderSafetyFeature('Forward Collision Warning', extendedSpecs.forwardCollisionWarning)}
              {renderSafetyFeature('Lane Departure Warning', extendedSpecs.laneDepartureWarning)}
              {renderSafetyFeature('Backup Camera', extendedSpecs.rearVisibilitySystem)}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Maintenance Estimates */}
      <Card>
        <CardHeader>
          <Heading level="title">
            <Wrench className="w-5 h-5 inline mr-2" />
            Estimated Maintenance
          </Heading>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* MPG */}
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Fuel className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <Text className="text-sm text-gray-600 mb-1">Fuel Economy</Text>
                <Text className="font-semibold">
                  {mockData.mpgCity > 0 
                    ? `${mockData.mpgCity}/${mockData.mpgHighway} MPG`
                    : 'Electric'
                  }
                </Text>
              </div>
            </div>

            {/* Service Interval */}
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <Gauge className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <Text className="text-sm text-gray-600 mb-1">Service Interval</Text>
                <Text className="font-semibold">
                  Every {mockData.maintenanceInterval.toLocaleString()} mi
                </Text>
              </div>
            </div>

            {/* Annual Cost */}
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <Text className="text-sm text-gray-600 mb-1">Annual Cost</Text>
                <Text className="font-semibold">
                  ${mockData.annualCost.toLocaleString()}/year
                </Text>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Tips */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Maintenance Tip */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Wrench className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <Text className="font-semibold text-blue-900 mb-2">
                  Maintenance Tip
                </Text>
                <Text className="text-sm text-blue-700">
                  {aiInsights.maintenanceTip}
                </Text>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cost Tip */}
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <DollarSign className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <Text className="font-semibold text-green-900 mb-2">
                  Money-Saving Tip
                </Text>
                <Text className="text-sm text-green-700">
                  {aiInsights.costTip}
                </Text>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vehicle Details Input */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Car className="w-5 h-5" />
            <Heading level="title">Your Vehicle Details</Heading>
          </div>
          <Text className="text-sm text-gray-600">
            Help us track your maintenance schedule
          </Text>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Current Mileage */}
            <div>
              <Label htmlFor="mileage" className="flex items-center gap-1">
                Current Mileage <span className="text-red-500">*</span>
              </Label>
              <Input
                id="mileage"
                type="number"
                placeholder="45000"
                value={currentMileage}
                onChange={(e) => {
                  setCurrentMileage(e.target.value)
                  setError(null)
                }}
                min="0"
                max="999999"
                required
                className="mt-1"
              />
              <p className="mt-1 text-xs text-gray-500">
                💡 This helps us calculate your next service date
              </p>
            </div>
            
            {/* Nickname */}
            <div>
              <Label htmlFor="nickname">
                Nickname <span className="text-gray-500">(optional)</span>
              </Label>
              <Input
                id="nickname"
                type="text"
                placeholder="My Daily Driver"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="mt-1"
              />
              <p className="mt-1 text-xs text-gray-500">
                Give your vehicle a friendly name
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <Text className="text-red-900">{error}</Text>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            size="lg"
            className="flex-1"
            onClick={handleConfirm}
            disabled={isLoading || isAuthLoading || !user}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Adding Vehicle...
              </>
            ) : isAuthLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                Add to Garage
                <CheckCircle2 className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
          
          <Button
            size="lg"
            variant="outline"
            onClick={handleEdit}
            disabled={isLoading}
          >
            <Edit className="w-5 h-5 mr-2" />
            Edit Details
          </Button>
        </div>

        {/* Share Button */}
        <Button
          size="lg"
          variant="secondary"
          onClick={handleShare}
          disabled={isLoading}
          className="w-full"
        >
          {copied ? (
            <>
              <Check className="w-5 h-5 mr-2" />
              Copied to Clipboard!
            </>
          ) : (
            <>
              <Share2 className="w-5 h-5 mr-2" />
              Share This Report
            </>
          )}
        </Button>
      </div>

      {/* Progress Indicator */}
      <div className="flex justify-center gap-2">
        <div className="w-2 h-2 rounded-full bg-blue-600"></div>
        <div className="w-2 h-2 rounded-full bg-blue-600"></div>
        <div className="w-2 h-2 rounded-full bg-blue-600"></div>
      </div>
      <Text className="text-center text-sm text-gray-500">
        Step 3 of 3
      </Text>

      {/* Duplicate Vehicle Dialog */}
      {duplicateData && (
        <DuplicateVehicleDialog
          open={showDuplicateDialog}
          onClose={() => setShowDuplicateDialog(false)}
          duplicate={duplicateData}
          onRequestAccess={handleDuplicateRequestAccess}
          onViewExisting={handleDuplicateViewExisting}
        />
      )}
    </Stack>
  )
}

// Helper to render safety features
function renderSafetyFeature(label: string, value?: string) {
  const hasFeature = value && value !== 'Not Applicable' && value !== ''
  
  return (
    <div className="flex items-center gap-2">
      {hasFeature ? (
        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
      ) : (
        <XCircle className="w-5 h-5 text-gray-300 flex-shrink-0" />
      )}
      <div className="flex items-center gap-1.5 flex-wrap">
        <Text className={hasFeature ? 'text-gray-900' : 'text-gray-400'}>
          {label}
        </Text>
        {hasFeature ? (
          value !== 'Standard' && value !== 'Yes' && (
            <span className="text-xs text-gray-500">({value})</span>
          )
        ) : (
          <span className="text-xs text-gray-400">(not equipped)</span>
        )}
      </div>
    </div>
  )
}
