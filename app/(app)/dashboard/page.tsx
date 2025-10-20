'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Container, Section, Stack, Heading } from '@/components/design-system'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { TopNav } from '@/components/nav/TopNav'
import { Car, X } from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showOnboardingPrompt, setShowOnboardingPrompt] = useState(false)
  
  useEffect(() => {
    // Show prompt if user skipped onboarding or abandoned session
    const skipped = searchParams.get('skippedOnboarding') === 'true'
    const shouldShow = searchParams.get('showOnboardingPrompt') === 'true'
    
    if (skipped || shouldShow) {
      setShowOnboardingPrompt(true)
    }
  }, [searchParams])
  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav />
      
      {/* Onboarding Prompt Banner */}
      {showOnboardingPrompt && (
        <div className="bg-blue-50 border-b border-blue-200">
          <Container size="lg">
            <Alert className="border-0 bg-transparent">
              <Car className="h-5 w-5 text-blue-600" />
              <AlertTitle className="text-blue-900 flex items-center justify-between">
                <span>Ready to add your first vehicle?</span>
                <button
                  onClick={() => setShowOnboardingPrompt(false)}
                  className="text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </AlertTitle>
              <AlertDescription className="flex items-center gap-4 text-blue-800">
                <span className="flex-1">
                  Add a vehicle to unlock tracking, maintenance reminders, and AI insights!
                </span>
                <Button
                  onClick={() => router.push('/onboarding/vin')}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Add Vehicle
                </Button>
              </AlertDescription>
            </Alert>
          </Container>
        </div>
      )}
      
      <Container 
        size="lg" 
        useCase="analytics_views"
        override={{
          reason: "Dashboard requires wider layout for cards and analytics widgets",
          approvedBy: "Dashboard Design"
        }}
      >
        <Section spacing="xl">
          <Stack spacing="xl" className="py-8">
            <div>
              <Heading level="hero">Dashboard</Heading>
              <p className="mt-2 text-lg text-gray-600">
                Welcome to MotoMind! Your vehicle management dashboard.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Vehicles</CardTitle>
                  <CardDescription>Manage your vehicles</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Add and track your vehicles here.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Maintenance</CardTitle>
                  <CardDescription>Track maintenance records</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Keep your vehicles in top condition.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Analytics</CardTitle>
                  <CardDescription>View insights</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Get insights into your fleet.
                  </p>
                </CardContent>
              </Card>
            </div>
          </Stack>
        </Section>
      </Container>
    </div>
  )
}
