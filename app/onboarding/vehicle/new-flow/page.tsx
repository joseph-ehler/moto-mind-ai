/**
 * Vehicle Onboarding Flow - Phase 1
 * 
 * First production wizard using the god-tier infrastructure.
 * 
 * Chapter: Vehicle Basics (3 steps)
 * 1. VIN Capture - Input + validation
 * 2. VIN Decoding - API call with timeout
 * 3. Vehicle Confirm - Display + micro-insight
 */

'use client'

import { useEffect, useState } from 'react'
import { OnboardingShell } from '@/components/onboarding/OnboardingShell'
import { ValidationProvider } from '@/wizard/validation-context'
import { VinCapture, VinDecoding, VehicleConfirm } from '@/components/onboarding/steps/vehicle'
import { useVehicleOnboarding } from '@/flows/vehicle/store'
import type { Chapter } from '@/components/onboarding/ChapterProgress'

type StepId = 'vin' | 'decoding' | 'confirm'

export default function VehicleOnboardingPage() {
  const { vehicle, reset } = useVehicleOnboarding()
  const [currentStep, setCurrentStep] = useState<StepId>('vin')
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  // Define chapters (Phase 1: just vehicle-basics)
  const chapters: Chapter[] = [
    {
      id: 'vehicle-basics',
      name: 'Vehicle',
      stepCount: 3,
      currentStep: getCurrentStepNumber(currentStep)
    }
  ]

  // Auto-save indicator (triggered by store changes)
  useEffect(() => {
    setLastSaved(new Date())
  }, [vehicle])

  const handleBack = () => {
    if (currentStep === 'decoding') {
      setCurrentStep('vin')
    } else if (currentStep === 'confirm') {
      setCurrentStep('vin')
    }
  }

  const handleNext = () => {
    if (currentStep === 'vin') {
      setCurrentStep('decoding')
    } else if (currentStep === 'decoding') {
      setCurrentStep('confirm')
    } else if (currentStep === 'confirm') {
      // TODO: Go to next chapter (ownership)
      alert('Vehicle basics complete! (Next chapter coming in Phase 2)')
    }
  }

  const handleExit = () => {
    // Save & exit
    window.location.href = '/dashboard'
  }

  const handleStartOver = () => {
    if (confirm('Are you sure you want to start over? All progress will be lost.')) {
      reset()
      setCurrentStep('vin')
    }
  }

  // Auto-advance from decoding to confirm when vehicle data is present
  useEffect(() => {
    if (currentStep === 'decoding' && vehicle) {
      // Small delay to show success state
      const timer = setTimeout(() => {
        setCurrentStep('confirm')
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [currentStep, vehicle])

  // Determine if back button should be shown
  const canGoBack = currentStep !== 'vin'

  // Determine if continue can be pressed
  const canGoNext = currentStep === 'confirm'

  return (
    <ValidationProvider>
      <OnboardingShell
        title={getStepTitle(currentStep)}
        subtitle={getStepSubtitle(currentStep)}
        chapters={chapters}
        currentChapterId="vehicle-basics"
        canGoBack={canGoBack}
        canGoNext={canGoNext}
        onBack={handleBack}
        onNext={handleNext}
        onExit={handleExit}
        onStartOver={handleStartOver}
        lastSaved={lastSaved}
        mode="fullscreen"
      >
        {currentStep === 'vin' && <VinCapture />}
        {currentStep === 'decoding' && <VinDecoding />}
        {currentStep === 'confirm' && <VehicleConfirm />}
      </OnboardingShell>
    </ValidationProvider>
  )
}

/**
 * Get current step number for chapter progress
 */
function getCurrentStepNumber(step: StepId): number {
  switch (step) {
    case 'vin': return 1
    case 'decoding': return 2
    case 'confirm': return 3
    default: return 1
  }
}

/**
 * Get step title
 */
function getStepTitle(step: StepId): string {
  switch (step) {
    case 'vin': return 'Enter your VIN'
    case 'decoding': return 'Decoding your VIN'
    case 'confirm': return 'Confirm your vehicle'
    default: return 'Vehicle Information'
  }
}

/**
 * Get step subtitle
 */
function getStepSubtitle(step: StepId): string | undefined {
  switch (step) {
    case 'vin': return 'We\'ll use this to get your vehicle details'
    case 'decoding': return 'Please wait...'
    case 'confirm': return 'Does this look right?'
    default: return undefined
  }
}
