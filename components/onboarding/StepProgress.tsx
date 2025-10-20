/**
 * StepProgress Component
 * 
 * Mobile-first progress indicator for stepped onboarding
 * Shows current step and allows navigation
 */

'use client'

import { Text } from '@/components/design-system'
import { Check } from 'lucide-react'

interface StepProgressProps {
  currentStep: number
  totalSteps: number
  className?: string
}

export function StepProgress({ currentStep, totalSteps, className = '' }: StepProgressProps) {
  return (
    <div className={`w-full ${className}`}>
      {/* Mobile: Simple text progress */}
      <div className="md:hidden">
        <Text className="text-sm text-gray-600 text-center">
          Step {currentStep} of {totalSteps}
        </Text>
      </div>

      {/* Desktop: Visual dots */}
      <div className="hidden md:flex items-center justify-center gap-2">
        {Array.from({ length: totalSteps }).map((_, index) => {
          const stepNumber = index + 1
          const isCompleted = stepNumber < currentStep
          const isCurrent = stepNumber === currentStep
          
          return (
            <div key={stepNumber} className="flex items-center">
              {/* Dot */}
              <div
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold
                  transition-all duration-300
                  ${isCurrent ? 'bg-blue-600 text-white scale-110' : ''}
                  ${isCompleted ? 'bg-green-500 text-white' : ''}
                  ${!isCurrent && !isCompleted ? 'bg-gray-200 text-gray-500' : ''}
                `}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : stepNumber}
              </div>
              
              {/* Connector line */}
              {stepNumber < totalSteps && (
                <div
                  className={`
                    w-8 h-1 mx-1 transition-all duration-300
                    ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}
                  `}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
