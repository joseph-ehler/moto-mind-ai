'use client'

/**
 * Onboarding: AI Analysis Screen
 * Shows loading animation while decoding VIN
 * Time: 5-8 seconds (builds anticipation!)
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Stack, Heading, Text } from '@/components/design-system'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, CheckCircle2, Search, Database, Shield, Sparkles, TrendingUp } from 'lucide-react'
import { Progress } from '@/components/ui/progress'

interface AnalysisStep {
  id: string
  label: string
  icon: React.ReactNode
  duration: number // milliseconds
}

const ANALYSIS_STEPS: AnalysisStep[] = [
  {
    id: 'decoding',
    label: 'Decoding VIN...',
    icon: <Search className="w-5 h-5" />,
    duration: 1000
  },
  {
    id: 'specs',
    label: 'Loading vehicle specifications...',
    icon: <Database className="w-5 h-5" />,
    duration: 1000
  },
  {
    id: 'safety',
    label: 'Checking safety features...',
    icon: <Shield className="w-5 h-5" />,
    duration: 1000
  },
  {
    id: 'costs',
    label: 'Calculating maintenance costs...',
    icon: <TrendingUp className="w-5 h-5" />,
    duration: 1000
  },
  {
    id: 'ai',
    label: 'Generating AI insights...',
    icon: <Sparkles className="w-5 h-5" />,
    duration: 1000
  }
]

export default function AnalyzingPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(0)
  const [vehicleData, setVehicleData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    decodeVIN()
  }, [])

  const decodeVIN = async () => {
    // Get VIN from session storage
    const vin = sessionStorage.getItem('onboarding_vin')
    
    if (!vin) {
      router.push('/onboarding/vin')
      return
    }

    try {
      // Start progress animation
      animateSteps()

      // Call VIN decode API
      const response = await fetch('/api/vin/decode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vin })
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to decode VIN')
      }

      // Store result for confirmation page
      sessionStorage.setItem('onboarding_vehicle_data', JSON.stringify(result.data))
      setVehicleData(result.data)

      // Give user 1 second to see "Vehicle Found!", then redirect
      setTimeout(() => {
        router.push('/onboarding/confirm')
      }, 1000)

    } catch (err: any) {
      console.error('[Onboarding/Analyzing] Error:', err)
      setError(err.message)
      
      // Redirect to manual entry on error
      setTimeout(() => {
        router.push('/onboarding/vehicle?error=' + encodeURIComponent(err.message))
      }, 3000)
    }
  }

  const animateSteps = () => {
    let completedDuration = 0
    const totalDuration = ANALYSIS_STEPS.reduce((sum, step) => sum + step.duration, 0)

    ANALYSIS_STEPS.forEach((step, index) => {
      setTimeout(() => {
        setCurrentStep(index + 1)
        // Cap progress at 100%
        const calculatedProgress = ((completedDuration + step.duration) / totalDuration) * 100
        setProgress(Math.min(calculatedProgress, 100))
      }, completedDuration)
      
      completedDuration += step.duration
    })
  }

  if (error) {
    return (
      <Stack spacing="xl" className="py-12 max-w-lg mx-auto px-4">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 mx-auto mb-4 flex items-center justify-center">
              <Shield className="w-8 h-8 text-red-600" />
            </div>
            <Heading level="h3" className="mb-2 text-red-900">
              Couldn't Decode VIN
            </Heading>
            <Text className="text-red-700 mb-4">
              {error}
            </Text>
            <Text className="text-sm text-red-600">
              Redirecting to manual entry...
            </Text>
          </CardContent>
        </Card>
      </Stack>
    )
  }

  return (
    <Stack spacing="xl" className="py-12 max-w-2xl mx-auto px-4">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
        
        <Heading level="h1" className="mb-4">
          Analyzing Your Vehicle
        </Heading>
        
        <Text className="text-gray-600">
          We're gathering detailed information about your vehicle...
        </Text>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardContent className="pt-6">
          <Progress value={progress} className="mb-4" />
          <Text className="text-sm text-gray-600 text-center">
            {Math.round(progress)}% complete
          </Text>
        </CardContent>
      </Card>

      {/* Analysis Steps */}
      <Stack spacing="sm">
        {ANALYSIS_STEPS.map((step, index) => {
          const isComplete = index < currentStep
          const isActive = index === currentStep - 1
          const isPending = index >= currentStep

          return (
            <Card 
              key={step.id}
              className={
                isComplete ? 'bg-green-50 border-green-200' :
                isActive ? 'bg-blue-50 border-blue-200' :
                'bg-gray-50 border-gray-200'
              }
            >
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  {/* Icon */}
                  <div className={`
                    flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
                    ${isComplete ? 'bg-green-100' : 
                      isActive ? 'bg-blue-100' : 
                      'bg-gray-100'}
                  `}>
                    {isComplete ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : isActive ? (
                      <div className="text-blue-600">
                        <Loader2 className="w-5 h-5 animate-spin" />
                      </div>
                    ) : (
                      <div className="text-gray-400">
                        {step.icon}
                      </div>
                    )}
                  </div>

                  {/* Label */}
                  <Text className={`
                    font-medium
                    ${isComplete ? 'text-green-700' :
                      isActive ? 'text-blue-700' :
                      'text-gray-500'}
                  `}>
                    {step.label}
                  </Text>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </Stack>

      {/* Preview (shows after VIN is decoded) */}
      {vehicleData && currentStep >= 2 && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <Text className="text-sm text-blue-600 font-semibold mb-2">
                Vehicle Found!
              </Text>
              <Heading level="h3" className="text-blue-900">
                {vehicleData.vehicle.displayName}
              </Heading>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress Indicator */}
      <div className="flex justify-center gap-2">
        <div className="w-2 h-2 rounded-full bg-blue-600"></div>
        <div className="w-2 h-2 rounded-full bg-blue-600"></div>
        <div className="w-2 h-2 rounded-full bg-gray-300"></div>
      </div>
      <Text className="text-center text-sm text-gray-500">
        Step 2 of 3
      </Text>
    </Stack>
  )
}
