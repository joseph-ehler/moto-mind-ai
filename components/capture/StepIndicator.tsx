/**
 * Step Indicator Component
 * 
 * Shows progress through multi-step capture flow
 * Displays: Required, Recommended, Optional badges
 */

'use client'

import React from 'react'
import { Flex, Text } from '@/components/design-system'
import { Check } from 'lucide-react'

interface StepIndicatorProps {
  currentStep: number
  totalSteps: number
  completedSteps: number[]
  stepInfo?: {
    required?: boolean
    recommended?: boolean
  }
}

export function StepIndicator({
  currentStep,
  totalSteps,
  completedSteps,
  stepInfo
}: StepIndicatorProps) {
  return (
    <div className="space-y-3">
      {/* Progress Bar */}
      <div className="relative">
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
            style={{ width: `${(completedSteps.length / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Step Counter & Badge */}
      <Flex align="center" justify="between">
        <Flex align="center" gap="sm">
          <Text className="text-sm font-semibold text-gray-700">
            Step {currentStep} of {totalSteps}
          </Text>
          
          {stepInfo?.required && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
              Required
            </span>
          )}
          
          {stepInfo?.recommended && !stepInfo?.required && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
              Recommended
            </span>
          )}
          
          {!stepInfo?.required && !stepInfo?.recommended && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
              Optional
            </span>
          )}
        </Flex>

        {/* Completed Count */}
        <Flex align="center" gap="xs">
          <Check className="w-4 h-4 text-green-600" />
          <Text className="text-sm text-gray-600">
            {completedSteps.length} completed
          </Text>
        </Flex>
      </Flex>

      {/* Step Dots */}
      <Flex align="center" gap="xs" className="justify-center">
        {Array.from({ length: totalSteps }).map((_, index) => {
          const stepNumber = index + 1
          const isCompleted = completedSteps.includes(stepNumber)
          const isCurrent = stepNumber === currentStep
          
          return (
            <div
              key={stepNumber}
              className={`h-2 rounded-full transition-all duration-300 ${
                isCompleted
                  ? 'w-8 bg-green-500'
                  : isCurrent
                  ? 'w-12 bg-blue-500'
                  : 'w-2 bg-gray-300'
              }`}
            />
          )
        })}
      </Flex>
    </div>
  )
}
