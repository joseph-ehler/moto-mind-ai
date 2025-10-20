/**
 * Service History Step
 * 
 * Step 6: When was last service?
 * Predictive maintenance insights
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Text, Heading } from '@/components/design-system'
import { Wrench, Loader2 } from 'lucide-react'

type ServiceTiming = 'recent' | 'medium' | 'overdue' | 'unknown'

interface ServiceHistoryStepProps {
  onContinue: (serviceTiming: ServiceTiming) => void
  onSkip: () => void
}

export function ServiceHistoryStep({ onContinue, onSkip }: ServiceHistoryStepProps) {
  const [selected, setSelected] = useState<ServiceTiming | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleContinue = () => {
    if (!selected) return
    
    setIsProcessing(true)
    setTimeout(() => {
      onContinue(selected)
    }, 500)
  }

  const options: Array<{ value: ServiceTiming; label: string; description: string; emoji: string }> = [
    {
      value: 'recent',
      label: 'Within last 3 months',
      description: "You're on top of it!",
      emoji: '✓'
    },
    {
      value: 'medium',
      label: '3-6 months ago',
      description: 'Coming up soon',
      emoji: '📅'
    },
    {
      value: 'overdue',
      label: 'Over 6 months ago',
      description: 'Time for a checkup',
      emoji: '⚠️'
    },
    {
      value: 'unknown',
      label: 'Not sure / Skip',
      description: "We'll help you figure it out",
      emoji: '❓'
    }
  ]

  return (
    <div className="w-full max-w-md mx-auto px-4 py-8 md:py-12">
      {/* Progress */}
      <Text className="text-sm text-gray-600 text-center mb-6">
        Step 4 of 5
      </Text>

      {/* Icon */}
      <div className="flex justify-center mb-6">
        <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-orange-100 flex items-center justify-center">
          <Wrench className="w-8 h-8 md:w-10 md:h-10 text-orange-600" />
        </div>
      </div>

      {/* Title */}
      <Heading level="title" className="text-center mb-3">
        When Was Your Last Service?
      </Heading>
      
      <Text className="text-center text-gray-600 mb-8">
        We'll help you stay on top of maintenance and predict upcoming service needs.
      </Text>

      {/* Options */}
      <div className="space-y-3 mb-6">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => setSelected(option.value)}
            disabled={isProcessing}
            className={`
              w-full p-4 rounded-xl border-2 text-left transition-all
              ${selected === option.value 
                ? 'border-orange-600 bg-orange-50' 
                : 'border-gray-200 bg-white hover:border-orange-300'
              }
              ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <div className="flex items-start gap-3">
              <div className={`
                w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center flex-shrink-0
                ${selected === option.value 
                  ? 'border-orange-600 bg-orange-600' 
                  : 'border-gray-300'
                }
              `}>
                {selected === option.value && (
                  <div className="w-2 h-2 rounded-full bg-white"></div>
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Text className="text-lg">{option.emoji}</Text>
                  <Text className="font-semibold text-gray-900">
                    {option.label}
                  </Text>
                </div>
                <Text className="text-sm text-gray-600">
                  {option.description}
                </Text>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Why we ask */}
      <div className="bg-orange-50 rounded-lg p-4 mb-6">
        <Text className="text-sm text-orange-900">
          💡 <strong>Why we ask:</strong> Knowing your service history helps us predict when you'll need oil changes, tire rotations, and major maintenance.
        </Text>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <Button
          size="lg"
          className="w-full h-12 md:h-14 text-base md:text-lg"
          onClick={handleContinue}
          disabled={!selected || isProcessing}
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            'Continue'
          )}
        </Button>

        <Button
          variant="ghost"
          size="lg"
          className="w-full h-12 text-gray-600"
          onClick={onSkip}
          disabled={isProcessing}
        >
          Skip for Now
        </Button>
      </div>
    </div>
  )
}
