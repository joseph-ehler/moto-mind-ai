/**
 * SteppedOnboarding Component
 * 
 * Main orchestrator for stepped onboarding flow
 * Manages state, navigation, and data collection
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { StepProgress } from './StepProgress'
import { InsightReveal, type Insight } from './InsightReveal'
import {
  VinCaptureStep,
  VehicleConfirmStep,
  MileageStep,
  OwnershipStep,
  NicknameStep,
  ServiceHistoryStep,
  FinalRevealStep
} from './steps'
import type { VINDecodeResult } from '@/lib/vin/types'
import { Loader2 } from 'lucide-react'

type Step = 
  | 'vin-capture'
  | 'vehicle-confirm'
  | 'mileage'
  | 'mileage-insight'
  | 'ownership'
  | 'ownership-insight'
  | 'nickname'
  | 'service'
  | 'service-insight'
  | 'final-reveal'

interface OnboardingData {
  vin?: string
  vehicleData?: VINDecodeResult
  mileage?: number
  ownershipType?: string
  nickname?: string
  serviceTiming?: string
  aiMileageInsights?: Insight[]
  aiOwnershipInsights?: Insight[]
  aiServiceInsights?: Insight[]
}

export function SteppedOnboarding() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<Step>('vin-capture')
  const [data, setData] = useState<OnboardingData>({})
  const [isDecoding, setIsDecoding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Calculate current step number for progress
  const getStepNumber = (): number => {
    const stepMap: Record<Step, number> = {
      'vin-capture': 0,
      'vehicle-confirm': 0,
      'mileage': 1,
      'mileage-insight': 1,
      'ownership': 2,
      'ownership-insight': 2,
      'nickname': 3,
      'service': 4,
      'service-insight': 4,
      'final-reveal': 5
    }
    return stepMap[currentStep]
  }

  // VIN Capture Handler
  const handleVinCapture = async (vin: string) => {
    setData({ ...data, vin })
    setIsDecoding(true)
    setError(null)

    try {
      // Decode VIN
      const response = await fetch('/api/vin/decode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vin })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to decode VIN')
      }

      const apiResponse = await response.json()
      
      // Handle wrapped response structure {success: true, data: {...}}
      const vehicleData: VINDecodeResult = apiResponse.success ? apiResponse.data : apiResponse
      
      setData(prev => ({ ...prev, vehicleData }))
      setError(null)
      setCurrentStep('vehicle-confirm')
    } catch (error) {
      console.error('[Onboarding] VIN decode error:', error)
      setError(error instanceof Error ? error.message : 'Failed to decode VIN. Please check the VIN and try again.')
      setIsDecoding(false)
      // Stay on vin-capture step to show error
      return
    } finally {
      setIsDecoding(false)
    }
  }

  // Vehicle Confirm Handler
  const handleVehicleConfirm = () => {
    setCurrentStep('mileage')
  }

  const handleTryAgain = () => {
    setData({})
    setCurrentStep('vin-capture')
  }

  // Mileage Handler
  const handleMileage = async (mileage: number) => {
    setData({ ...data, mileage })
    
    // Try to get AI insights first
    const aiInsights = await getAIInsights('mileage')
    
    // Store insights in state if we got them
    if (aiInsights.length > 0) {
      setData(prev => ({ ...prev, mileage, aiMileageInsights: aiInsights }))
    } else {
      setData(prev => ({ ...prev, mileage }))
    }
    
    setCurrentStep('mileage-insight')
  }

  // Ownership Handler
  const handleOwnership = async (ownershipType: string) => {
    setData({ ...data, ownershipType })
    
    // Try to get AI insights
    const aiInsights = await getAIInsights('ownership')
    
    if (aiInsights.length > 0) {
      setData(prev => ({ ...prev, ownershipType, aiOwnershipInsights: aiInsights }))
    } else {
      setData(prev => ({ ...prev, ownershipType }))
    }
    
    setCurrentStep('ownership-insight')
  }

  // Nickname Handler
  const handleNickname = (nickname: string) => {
    setData({ ...data, nickname })
    setCurrentStep('service')
  }

  // Service Handler
  const handleService = async (serviceTiming: string) => {
    setData({ ...data, serviceTiming })
    
    // Try to get AI insights
    const aiInsights = await getAIInsights('service')
    
    if (aiInsights.length > 0) {
      setData(prev => ({ ...prev, serviceTiming, aiServiceInsights: aiInsights }))
    } else {
      setData(prev => ({ ...prev, serviceTiming }))
    }
    
    setCurrentStep('service-insight')
  }

  // Final actions
  const handleAddToGarage = async () => {
    // TODO: Wire up actual vehicle creation
    console.log('[Onboarding] Adding to garage:', data)
    router.push('/garage')
  }

  const handleViewReport = () => {
    // TODO: Navigate to full vehicle detail page
    console.log('[Onboarding] View report:', data)
  }

  // Call AI API for insights
  const getAIInsights = async (type: 'mileage' | 'ownership' | 'service'): Promise<Insight[]> => {
    try {
      const response = await fetch('/api/ai/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          data: {
            vehicleData: data.vehicleData,
            mileage: data.mileage,
            ownership: data.ownershipType,
            serviceTiming: data.serviceTiming,
            nickname: data.nickname
          }
        })
      })

      const result = await response.json()
      
      // If AI succeeded, return AI insights
      if (result.success && result.insights && result.insights.length > 0) {
        console.log(`[Onboarding] Using AI ${type} insights`)
        return result.insights
      }
      
      // Otherwise fall back to rule-based
      console.log(`[Onboarding] Falling back to rule-based ${type} insights`)
      return []
    } catch (error) {
      console.error(`[Onboarding] AI ${type} insights error:`, error)
      return [] // Will use fallback
    }
  }

  // Generate insights based on collected data (Rule-Based Fallback)
  const getMileageInsights = (): Insight[] => {
    const insights: Insight[] = []
    
    if (!data.mileage) return insights
    
    const mileage = data.mileage
    const maintenanceInterval = data.vehicleData?.mockData?.maintenanceInterval || 7500
    
    // Calculate next service based on maintenance interval
    const lastService = Math.floor(mileage / maintenanceInterval) * maintenanceInterval
    const nextService = lastService + maintenanceInterval
    const milesUntilService = nextService - mileage
    
    // Only show oil change insight if it's relevant
    if (milesUntilService <= maintenanceInterval) {
      if (milesUntilService <= 1000) {
        insights.push({
          type: 'warning',
          title: 'Service Coming Up',
          message: `Due at ${nextService.toLocaleString()} miles (in ${milesUntilService.toLocaleString()} miles)`
        })
      } else if (milesUntilService <= maintenanceInterval / 2) {
        insights.push({
          type: 'info',
          title: 'Service Upcoming',
          message: `Next service recommended at ${nextService.toLocaleString()} miles (${milesUntilService.toLocaleString()} miles away)`
        })
      }
    }
    
    // Mileage-specific insights
    if (mileage < 10000) {
      insights.push({
        type: 'success',
        title: 'Low Mileage!',
        message: 'Your vehicle is still in the break-in period. Avoid aggressive driving and follow the initial service schedule closely.'
      })
    } else if (mileage > 100000) {
      insights.push({
        type: 'info',
        title: 'High Mileage Veteran',
        message: 'Consider inspecting belts, hoses, and suspension components more frequently at this mileage.'
      })
    } else if (mileage >= 60000 && mileage <= 75000) {
      insights.push({
        type: 'warning',
        title: 'Major Service Due',
        message: 'Most vehicles need transmission fluid, coolant flush, and spark plugs around 60k-75k miles.'
      })
    }

    return insights
  }

  const getOwnershipInsights = (): Insight[] => {
    const insights: Insight[] = []

    if (data.ownershipType === 'just-bought') {
      insights.push({
        type: 'success',
        title: 'New Owner Checklist',
        message: 'Check for open recalls, review service history, and consider a pre-purchase inspection if you haven\'t already.'
      })
      
      if (data.vehicleData?.recalls && data.vehicleData.recalls.length > 0) {
        insights.push({
          type: 'warning',
          title: 'Open Recalls Found',
          message: `${data.vehicleData.recalls.length} recall(s) found. Visit a dealer for free repairs.`
        })
      }
    } else if (data.ownershipType === 'owned-while') {
      if (data.mileage && data.mileage < 75000) {
        insights.push({
          type: 'success',
          title: 'Reliable Years Ahead',
          message: `At ${data.mileage.toLocaleString()} miles, your vehicle is well-maintained and has plenty of life left.`
        })
      } else if (data.mileage && data.mileage >= 75000) {
        insights.push({
          type: 'info',
          title: 'Maintenance Matters',
          message: 'Keep up with scheduled maintenance to maximize longevity and avoid costly repairs.'
        })
      }
    } else if (data.ownershipType === 'not-original') {
      insights.push({
        type: 'info',
        title: 'Know Your History',
        message: 'Request service records from the previous owner and check for any deferred maintenance.'
      })
    }

    return insights
  }

  const getServiceInsights = (): Insight[] => {
    const insights: Insight[] = []

    if (data.serviceTiming === 'recent') {
      insights.push({
        type: 'success',
        title: 'Well Maintained',
        message: 'Regular maintenance extends vehicle life by 20-40%. Keep it up!'
      })
      
      if (data.mileage && data.mileage >= 60000) {
        insights.push({
          type: 'info',
          title: 'Check Major Items',
          message: 'Ask your mechanic about transmission fluid, coolant, and brake fluid at your next service.'
        })
      }
    } else if (data.serviceTiming === 'overdue') {
      insights.push({
        type: 'warning',
        title: 'Service Overdue',
        message: 'Schedule an oil change, tire rotation, and multi-point inspection soon to prevent issues.'
      })
      
      if (data.mileage && data.mileage > 50000) {
        insights.push({
          type: 'warning',
          title: 'Higher Mileage Attention',
          message: 'Deferred maintenance at this mileage can lead to expensive repairs. Don\'t wait!'
        })
      }
    } else if (data.serviceTiming === 'unsure') {
      insights.push({
        type: 'info',
        title: 'Track Your Service',
        message: 'We\'ll help you keep a complete service history and remind you when maintenance is due.'
      })
    }

    return insights
  }

  // Loading state
  if (isDecoding) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Decoding your VIN...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Progress Indicator */}
      {currentStep !== 'vin-capture' && currentStep !== 'vehicle-confirm' && (
        <div className="sticky top-0 bg-white border-b border-gray-200 py-4 px-4 z-10">
          <StepProgress currentStep={getStepNumber()} totalSteps={5} />
        </div>
      )}

      {/* Current Step */}
      <div className="pb-8">
        {currentStep === 'vin-capture' && (
          <VinCaptureStep 
            onContinue={handleVinCapture}
            initialValue={data.vin}
            error={error}
          />
        )}

        {currentStep === 'vehicle-confirm' && (
          data.vehicleData?.vehicle ? (
            <VehicleConfirmStep
              year={data.vehicleData.vehicle.year}
              make={data.vehicleData.vehicle.make}
              model={data.vehicleData.vehicle.model}
              trim={data.vehicleData.vehicle.trim}
              vin={data.vin!}
              onConfirm={handleVehicleConfirm}
              onTryAgain={handleTryAgain}
            />
          ) : (
            <div className="w-full max-w-md mx-auto px-4 py-8">
              <div className="text-center">
                <p className="text-red-600 mb-4">
                  Error: Vehicle data structure is invalid
                </p>
                <pre className="text-left text-xs bg-gray-100 p-4 rounded overflow-auto max-h-96">
                  {JSON.stringify(data.vehicleData, null, 2)}
                </pre>
                <Button onClick={handleTryAgain} className="mt-4">
                  Try Again
                </Button>
              </div>
            </div>
          )
        )}

        {currentStep === 'mileage' && (
          <MileageStep
            onContinue={handleMileage}
            onSkip={() => setCurrentStep('ownership')}
          />
        )}

        {currentStep === 'mileage-insight' && (
          <InsightReveal
            insights={data.aiMileageInsights || getMileageInsights()}
            onContinue={() => setCurrentStep('ownership')}
          />
        )}

        {currentStep === 'ownership' && (
          <OwnershipStep
            onContinue={handleOwnership}
            onSkip={() => setCurrentStep('nickname')}
          />
        )}

        {currentStep === 'ownership-insight' && (
          <InsightReveal
            insights={data.aiOwnershipInsights || getOwnershipInsights()}
            onContinue={() => setCurrentStep('nickname')}
          />
        )}

        {currentStep === 'nickname' && data.vehicleData?.vehicle && (
          <NicknameStep
            defaultName={data.vehicleData.vehicle.displayName}
            onContinue={handleNickname}
            onSkip={() => setCurrentStep('service')}
          />
        )}

        {currentStep === 'service' && (
          <ServiceHistoryStep
            onContinue={handleService}
            onSkip={() => setCurrentStep('final-reveal')}
          />
        )}

        {currentStep === 'service-insight' && (
          <InsightReveal
            insights={data.aiServiceInsights || getServiceInsights()}
            onContinue={() => setCurrentStep('final-reveal')}
          />
        )}

        {currentStep === 'final-reveal' && data.vehicleData?.vehicle && (
          <FinalRevealStep
            vehicleName={data.nickname || data.vehicleData.vehicle.displayName}
            safetyInsight={
              data.vehicleData.safetyData
                ? `Good reliability with fewer complaints than ${data.vehicleData.safetyData.comparison.betterThan}% of similar vehicles. Most owners report trouble-free ownership.`
                : 'Reliability data being analyzed. Check back soon for detailed insights.'
            }
            maintenanceInsight={
              data.vehicleData.mockData
                ? `Average annual maintenance costs around $${data.vehicleData.mockData.annualCost}, which is typical for this class.`
                : 'Maintenance cost estimates will be available in your garage.'
            }
            performanceInsight={
              data.vehicleData.specs?.engine
                ? `This ${data.vehicleData.specs.engine} is known for balanced performance and reliability.`
                : 'Performance characteristics will be detailed in your vehicle profile.'
            }
            watchOut={
              data.mileage && data.mileage < 60000
                ? 'Most transmission fluid changes are recommended at 60k miles. Plan ahead!'
                : undefined
            }
            ownerCount={data.vehicleData.safetyData?.totalComplaints}
            onAddToGarage={handleAddToGarage}
            onViewReport={handleViewReport}
          />
        )}
      </div>
    </div>
  )
}
