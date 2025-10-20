/**
 * StepIndicator Component
 * 
 * Shows progress through stepped onboarding
 * Clean, minimal, Typeform-inspired
 */

'use client'

import { Text } from '@/components/design-system'

interface StepIndicatorProps {
  currentStep: number
  totalSteps: number
  className?: string
}

export function StepIndicator({ 
  currentStep, 
  totalSteps,
  className = '' 
}: StepIndicatorProps) {
  const percentage = (currentStep / totalSteps) * 100

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Progress Bar */}
      <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="h-full bg-blue-600 transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      {/* Step Counter */}
      <Text className="text-xs text-gray-500">
        Step {currentStep} of {totalSteps}
      </Text>
    </div>
  )
}
