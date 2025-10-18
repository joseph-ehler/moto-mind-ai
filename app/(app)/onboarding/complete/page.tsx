'use client'

/**
 * Onboarding: Complete Screen
 * Final step - celebrate and redirect to dashboard
 * Time: 5 seconds (auto-redirect after 3s)
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Stack, Heading, Text } from '@/components/design-system'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle2, ArrowRight, Sparkles } from 'lucide-react'

export default function CompletePage() {
  const router = useRouter()
  const [countdown, setCountdown] = useState(3)

  useEffect(() => {
    // Mark onboarding as complete
    fetch('/api/onboarding/complete', {
      method: 'POST',
    }).catch((error) => {
      console.error('[Onboarding] Failed to mark complete:', error)
    })

    // Countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Redirect when countdown reaches 0
  useEffect(() => {
    if (countdown === 0) {
      router.push('/dashboard')
    }
  }, [countdown, router])

  const handleGoNow = () => {
    router.push('/dashboard')
  }

  return (
    <Stack spacing="xl" className="py-12 max-w-lg mx-auto">
      {/* Success Icon */}
      <div className="flex justify-center">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>
          <div className="absolute -top-2 -right-2">
            <Sparkles className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="text-center">
        <Heading level="title" className="mb-2">
          🎉 You're All Set!
        </Heading>
        <Text className="text-gray-600">
          Your vehicle has been added and MotoMind is ready to help you track maintenance
        </Text>
      </div>

      {/* What's Next Card */}
      <Card>
        <CardContent className="pt-6">
          <Stack spacing="md">
            <Text className="font-semibold">What's next:</Text>
            
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <Text className="text-sm text-gray-700">
                  Track your first ride to see AI insights
                </Text>
              </div>
              
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <Text className="text-sm text-gray-700">
                  Set up service reminders to never miss maintenance
                </Text>
              </div>
              
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <Text className="text-sm text-gray-700">
                  Log expenses to understand your total cost of ownership
                </Text>
              </div>
            </div>
          </Stack>
        </CardContent>
      </Card>

      {/* CTA */}
      <div className="flex flex-col items-center gap-4">
        <Button size="lg" onClick={handleGoNow} className="w-full max-w-sm">
          Go to Dashboard
          <ArrowRight className="ml-2 w-5 h-5" />
        </Button>
        
        {countdown > 0 && (
          <Text className="text-sm text-gray-500">
            Redirecting in {countdown}...
          </Text>
        )}
      </div>

      {/* Progress Indicator */}
      <div className="flex justify-center items-center gap-2 mt-8">
        <div className="w-8 h-2 rounded-full bg-blue-600" />
        <div className="w-8 h-2 rounded-full bg-blue-600" />
        <div className="w-8 h-2 rounded-full bg-blue-600" />
      </div>
      <Text className="text-center text-sm text-gray-500">
        Step 3 of 3 - Complete! ✨
      </Text>
    </Stack>
  )
}
