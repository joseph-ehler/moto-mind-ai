/**
 * Ownership Timeline Step
 * 
 * Step 4: When did they get the vehicle?
 * Contextual insights based on ownership duration
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Text, Heading } from '@/components/design-system'
import { Calendar, Loader2 } from 'lucide-react'

type OwnershipType = 'just-bought' | 'owned-while' | 'not-original'

interface OwnershipStepProps {
  onContinue: (ownershipType: OwnershipType) => void
  onSkip: () => void
}

export function OwnershipStep({ onContinue, onSkip }: OwnershipStepProps) {
  const [selected, setSelected] = useState<OwnershipType | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleContinue = () => {
    if (!selected) return
    
    setIsProcessing(true)
    setTimeout(() => {
      onContinue(selected)
    }, 500)
  }

  const options: Array<{ value: OwnershipType; label: string; description: string }> = [
    {
      value: 'just-bought',
      label: 'I just bought it',
      description: 'Within the last 30 days'
    },
    {
      value: 'owned-while',
      label: "I've owned it for a while",
      description: 'More than 30 days'
    },
    {
      value: 'not-original',
      label: "I'm not the original owner",
      description: 'Bought used or inherited'
    }
  ]

  return (
    <div className="w-full max-w-md mx-auto px-4 py-8 md:py-12">
      {/* Progress */}
      <Text className="text-sm text-gray-600 text-center mb-6">
        Step 2 of 5
      </Text>

      {/* Icon */}
      <div className="flex justify-center mb-6">
        <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-green-100 flex items-center justify-center">
          <Calendar className="w-8 h-8 md:w-10 md:h-10 text-green-600" />
        </div>
      </div>

      {/* Title */}
      <Heading level="title" className="text-center mb-3">
        When Did You Get This Vehicle?
      </Heading>
      
      <Text className="text-center text-gray-600 mb-8">
        This helps us understand your ownership timeline and provide relevant insights.
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
                ? 'border-blue-600 bg-blue-50' 
                : 'border-gray-200 bg-white hover:border-blue-300'
              }
              ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <div className="flex items-start gap-3">
              <div className={`
                w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center flex-shrink-0
                ${selected === option.value 
                  ? 'border-blue-600 bg-blue-600' 
                  : 'border-gray-300'
                }
              `}>
                {selected === option.value && (
                  <div className="w-2 h-2 rounded-full bg-white"></div>
                )}
              </div>
              
              <div className="flex-1">
                <Text className="font-semibold text-gray-900 mb-1">
                  {option.label}
                </Text>
                <Text className="text-sm text-gray-600">
                  {option.description}
                </Text>
              </div>
            </div>
          </button>
        ))}
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
