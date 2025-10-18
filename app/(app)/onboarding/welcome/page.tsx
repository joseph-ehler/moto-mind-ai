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
import { ArrowRight, Wrench, Bell, TrendingDown, Sparkles } from 'lucide-react'

export default function WelcomePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

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

      {/* CTA */}
      <div className="flex flex-col items-center gap-3 mt-8">
        <Button
          size="lg"
          onClick={handleGetStarted}
          className="min-w-[280px]"
        >
          Scan VIN to Get Started
          <ArrowRight className="ml-2 w-5 h-5" />
        </Button>
        
        <button
          onClick={() => router.push('/onboarding/vehicle')}
          className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          Or enter details manually
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
