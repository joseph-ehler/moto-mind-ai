'use client'

/**
 * Onboarding: Welcome Screen
 * First step - introduce value proposition
 * Time: 10 seconds
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Stack, Heading, Text } from '@/components/design-system'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowRight, Wrench, Bell, TrendingDown, Sparkles, Camera, Type, Info } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function WelcomePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isSkipping, setIsSkipping] = useState(false)

  const handleGetStarted = async () => {
    setIsLoading(true)
    
    // Initialize onboarding
    try {
      await fetch('/api/onboarding/initialize', {
        method: 'POST',
      })
    } catch (error) {
      console.error('[Onboarding/Welcome] Failed to initialize:', error)
    }
    
    // Navigate to VIN entry (primary flow)
    router.push('/onboarding/vin')
  }

  const handleSkip = async () => {
    setIsSkipping(true)
    // Skip onboarding - user can add vehicle later from dashboard
    router.push('/dashboard?skippedOnboarding=true')
  }

  return (
    <Stack spacing="xl" className="py-12">
      {/* Hero */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
          <Sparkles className="w-8 h-8 text-blue-600" />
        </div>
        
        <Heading level="hero" className="mb-4">
          Welcome to MotoMind
        </Heading>
        
        <Text className="text-xl text-gray-600 max-w-2xl mx-auto">
          Your Vehicle's AI Assistant
          <br />
          Works with ANY vehicle • AI-powered • Save thousands
        </Text>
        
        <Text className="text-sm text-gray-500 mt-2">
          Cars • Trucks • Motorcycles • EVs • SUVs • Vans
        </Text>
      </div>

      {/* Value Props */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-3">
                <Wrench className="w-6 h-6 text-green-600" />
              </div>
              <Text className="font-semibold mb-2">
                AI-Powered Tracking
              </Text>
              <Text className="text-sm text-gray-600">
                VIN decode pulls exact maintenance schedule
              </Text>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-3">
                <Bell className="w-6 h-6 text-blue-600" />
              </div>
              <Text className="font-semibold mb-2">
                Predictive Reminders
              </Text>
              <Text className="text-sm text-gray-600">
                AI predicts issues before they're expensive
              </Text>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mb-3">
                <TrendingDown className="w-6 h-6 text-purple-600" />
              </div>
              <Text className="font-semibold mb-2">
                Real Cost Estimates
              </Text>
              <Text className="text-sm text-gray-600">
                Know exact service costs before you go in
              </Text>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CTA - VIN-Only Approach */}
      <div className="flex flex-col items-center gap-4 mt-8">
        <div className="w-full max-w-md space-y-3">
          {/* PRIMARY: Scan VIN */}
          <Button
            size="lg"
            onClick={handleGetStarted}
            disabled={isLoading || isSkipping}
            className="w-full"
          >
            <Camera className="mr-2 h-5 w-5" />
            {isLoading ? 'Starting...' : 'Scan VIN Barcode'}
          </Button>
          
          {/* SECONDARY: Type VIN */}
          <Button
            variant="outline"
            size="lg"
            onClick={() => router.push('/onboarding/vin?manualEntry=true')}
            disabled={isLoading || isSkipping}
            className="w-full"
          >
            <Type className="mr-2 h-5 w-5" />
            Enter VIN Manually
          </Button>
          
          {/* Why VIN Required */}
          <Alert className="mt-4">
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <strong>Why we need your VIN:</strong>
              <br />
              Ensures accurate vehicle specs, maintenance tracking, recall notifications,
              and fuel economy data.
              <br />
              <span className="text-muted-foreground mt-1 block">
                Find your VIN on your dashboard or driver's door jamb.
              </span>
            </AlertDescription>
          </Alert>
        </div>
        
        {/* Skip Option */}
        <button
          onClick={handleSkip}
          disabled={isLoading || isSkipping}
          className="text-xs text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50 mt-2"
        >
          {isSkipping ? 'Skipping...' : "I'll add a vehicle later"}
        </button>
      </div>

      {/* Progress Indicator */}
      <div className="flex justify-center items-center gap-2 mt-8">
        <div className="w-8 h-2 rounded-full bg-blue-600" />
        <div className="w-8 h-2 rounded-full bg-gray-200" />
        <div className="w-8 h-2 rounded-full bg-gray-200" />
      </div>
      <Text className="text-center text-sm text-gray-500">
        Step 1 of 3
      </Text>
    </Stack>
  )
}
