/**
 * Vehicle Onboarding Flow - Phase 1 + Mobile-First Updates
 * 
 * Complete flow with welcome + chapter intro + new form components.
 * 
 * Steps:
 * 1. Welcome - First impression, set context
 * 2. Chapter Intro - Introduce Vehicle Basics chapter
 * 3. VIN Capture - Input + validation (NEW: FormSection + mobile-first)
 * 4. VIN Decoding - API call with timeout
 * 5. Vehicle Confirm - Display + micro-insight
 */

'use client'

import { useEffect, useState } from 'react'
import { OnboardingShell } from '@/components/onboarding/OnboardingShell'
import { ValidationProvider } from '@/wizard/validation-context'
import { VinCaptureV2, VinDecoding, VehicleConfirm } from '@/components/onboarding/steps/vehicle'
import { WelcomeScreen, ChapterIntro } from '@/components/onboarding/WelcomeScreen'
import { useVehicleOnboarding } from '@/flows/vehicle/store'
import type { Chapter } from '@/components/onboarding/ChapterProgress'
import { Car, Clock, Shield } from 'lucide-react'

type StepId = 'welcome' | 'chapter-intro' | 'vin' | 'decoding' | 'confirm'

export default function VehicleOnboardingPage() {
  const { vehicle, reset } = useVehicleOnboarding()
  const [currentStep, setCurrentStep] = useState<StepId>('welcome')
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  // Define chapters (Phase 1: just vehicle-basics)
  // Note: Welcome + Chapter Intro don't count in chapter steps
  const chapters: Chapter[] = [
    {
      id: 'vehicle-basics',
      name: 'Vehicle',
      stepCount: 3, // vin, decoding, confirm
      currentStep: getCurrentStepNumber(currentStep)
    }
  ]

  // Auto-save indicator (triggered by store changes)
  useEffect(() => {
    setLastSaved(new Date())
  }, [vehicle])

  /**
   * Smart Back Navigation
   * 
   * Pattern: Always skip loading/auto-advance steps
   * - Decoding is a loading step (auto-advances) → skip it
   * - Welcome/ChapterIntro are linear (can't go back from them)
   * 
   * This prevents infinite loops where:
   * Confirm → Back → Decoding → Auto-advance → Confirm
   */
  const handleBack = () => {
    // Define loading/auto-advance steps to skip
    const loadingSteps: StepId[] = ['decoding']
    
    // Map each step to its previous user-interactive step
    const backDestinations: Record<StepId, StepId> = {
      welcome: 'welcome',          // First step, nowhere to go
      'chapter-intro': 'welcome',  // Go back to welcome
      vin: 'chapter-intro',        // Go back to chapter intro
      decoding: 'vin',             // Skip back to VIN (user-interactive)
      confirm: 'vin',              // Skip decoding, go to VIN (user-interactive)
    }
    
    const destination = backDestinations[currentStep]
    if (destination && destination !== currentStep) {
      setCurrentStep(destination)
    }
  }

  const handleNext = () => {
    if (currentStep === 'welcome') {
      setCurrentStep('chapter-intro')
    } else if (currentStep === 'chapter-intro') {
      setCurrentStep('vin')
    } else if (currentStep === 'vin') {
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
      setCurrentStep('welcome')
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

  // Step-based logic for footer controls
  const isWelcome = currentStep === 'welcome'
  const isChapterIntro = currentStep === 'chapter-intro'
  const isVin = currentStep === 'vin'
  const isDecoding = currentStep === 'decoding'
  const isConfirm = currentStep === 'confirm'

  // Determine if back button should be shown
  const canGoBack = !isWelcome  // Can't go back from welcome
  const showFooterBack = canGoBack

  // Determine if continue can be pressed
  // Welcome: Always allow (intro step)
  // ChapterIntro: Always allow (intro step)
  // VIN step: handled by validation context (isValid)
  // Decoding step: should not show continue (auto-advances)
  // Confirm step: always allow continue
  const canGoNext = isWelcome || isChapterIntro || isVin || isConfirm
  const hideContinueButton = isDecoding // Hide only on decoding (auto-advances)
  
  // Dynamic continue label
  const continueLabel = 
    isWelcome ? 'Get Started' :
    isChapterIntro ? 'Continue' :
    isConfirm ? 'Looks right' :
    'Continue'
  
  // Skip not needed for this flow
  const canSkip = false

  return (
    <ValidationProvider>
      <OnboardingShell
        title={getStepTitle(currentStep)}
        subtitle={getStepSubtitle(currentStep)}
        chapters={chapters}
        currentChapterId="vehicle-basics"
        canGoBack={canGoBack}
        canGoNext={canGoNext}
        canSkip={canSkip}
        showFooterBack={showFooterBack}
        hideContinueButton={hideContinueButton}
        continueLabel={continueLabel}
        onBack={handleBack}
        onNext={handleNext}
        onExit={handleExit}
        onStartOver={handleStartOver}
        lastSaved={lastSaved}
        mode="fullscreen"
      >
        {currentStep === 'welcome' && (
          <WelcomeScreen
            title="Welcome to MotoMind"
            subtitle="Your vehicle's digital home"
            description="Let's add your first vehicle. It takes about 2 minutes and we'll pull accurate specs, recall info, and service history automatically."
            steps={[
              'Enter your VIN (17 characters)',
              'Confirm vehicle details',
              'You\'re all set!'
            ]}
            benefits={[
              { icon: <Car className="w-6 h-6" />, label: 'Accurate specs' },
              { icon: <Clock className="w-6 h-6" />, label: '2 minutes' },
              { icon: <Shield className="w-6 h-6" />, label: 'Privacy first' },
            ]}
            illustration={<Car className="w-24 h-24 text-blue-600" />}
          />
        )}
        
        {currentStep === 'chapter-intro' && (
          <ChapterIntro
            chapterNumber={1}
            title="Vehicle Basics"
            description="Let's start with your vehicle's VIN. We'll use this 17-character code to pull everything we need."
            icon={<Car className="w-16 h-16" />}
            highlights={[
              'Accurate vehicle specs',
              'Recall information',
              'Service history',
            ]}
          />
        )}
        
        {currentStep === 'vin' && (
          <VinCaptureV2
            stepId="vin"
            stepIndex={0}
            chapterId="vehicle-basics"
          />
        )}
        
        {currentStep === 'decoding' && (
          <VinDecoding
            stepId="vin_decoding"
            stepIndex={1}
            chapterId="vehicle-basics"
          />
        )}
        
        {currentStep === 'confirm' && (
          <VehicleConfirm
            stepId="vehicle_confirm"
            stepIndex={2}
            chapterId="vehicle-basics"
          />
        )}
      </OnboardingShell>
    </ValidationProvider>
  )
}

/**
 * Get current step number for chapter progress
 * Note: Welcome and chapter-intro don't count as chapter steps
 */
function getCurrentStepNumber(step: StepId): number {
  switch (step) {
    case 'welcome': return 0      // Not in chapter
    case 'chapter-intro': return 0 // Not in chapter
    case 'vin': return 1
    case 'decoding': return 2
    case 'confirm': return 3
    default: return 0
  }
}

/**
 * Get step title
 */
function getStepTitle(step: StepId): string {
  switch (step) {
    case 'welcome': return 'Welcome'
    case 'chapter-intro': return 'Vehicle Basics'
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
    case 'welcome': return undefined
    case 'chapter-intro': return undefined
    case 'vin': return 'We\'ll use this to get your vehicle details'
    case 'decoding': return 'Please wait...'
    case 'confirm': return 'Does this look right?'
    default: return undefined
  }
}
