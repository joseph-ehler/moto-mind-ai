/**
 * Mileage Step
 * 
 * Step 3: Capture current mileage
 * First WOW moment - instant service calculation
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Text, Heading } from '@/components/design-system'
import { Gauge, Loader2 } from 'lucide-react'

interface MileageStepProps {
  onContinue: (mileage: number) => void
  onSkip: () => void
}

export function MileageStep({ onContinue, onSkip }: MileageStepProps) {
  const [mileage, setMileage] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleContinue = () => {
    const mileageNum = parseInt(mileage)
    
    if (!mileage || isNaN(mileageNum) || mileageNum < 0) {
      setError('Please enter a valid mileage')
      return
    }
    
    if (mileageNum > 500000) {
      setError('Mileage seems too high. Please check.')
      return
    }
    
    setIsProcessing(true)
    setError(null)
    
    // Simulate processing (parent will show insight)
    setTimeout(() => {
      onContinue(mileageNum)
    }, 500)
  }

  return (
    <div className="w-full max-w-md mx-auto px-4 py-8 md:py-12">
      {/* Progress */}
      <Text className="text-sm text-gray-600 text-center mb-6">
        Step 1 of 5
      </Text>

      {/* Icon */}
      <div className="flex justify-center mb-6">
        <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-purple-100 flex items-center justify-center">
          <Gauge className="w-8 h-8 md:w-10 md:h-10 text-purple-600" />
        </div>
      </div>

      {/* Title */}
      <Heading level="title" className="text-center mb-3">
        What's Your Current Mileage?
      </Heading>
      
      <Text className="text-center text-gray-600 mb-8">
        This helps us track maintenance and predict upcoming service needs.
      </Text>

      {/* Mileage Input */}
      <div className="space-y-4 mb-6">
        <div>
          <Label htmlFor="mileage" className="text-base">
            Current Mileage
          </Label>
          <div className="relative mt-2">
            <Input
              id="mileage"
              type="number"
              inputMode="numeric"
              placeholder="45000"
              value={mileage}
              onChange={(e) => {
                setMileage(e.target.value)
                setError(null)
              }}
              className="text-lg h-12 md:h-14 pr-16"
              disabled={isProcessing}
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
              <Text className="text-sm font-semibold">miles</Text>
            </div>
          </div>
          
          {error && (
            <Text className="text-xs text-red-600 mt-2">
              {error}
            </Text>
          )}
        </div>

        {/* Quick Select */}
        <div className="grid grid-cols-3 gap-2">
          {[10000, 25000, 50000, 75000, 100000, 150000].map((value) => (
            <Button
              key={value}
              variant="outline"
              size="sm"
              onClick={() => setMileage(value.toString())}
              disabled={isProcessing}
              className="text-xs md:text-sm"
            >
              {value.toLocaleString()}
            </Button>
          ))}
        </div>
      </div>

      {/* Why we ask */}
      <div className="bg-blue-50 rounded-lg p-4 mb-6">
        <Text className="text-sm text-blue-900">
          💡 <strong>Why we ask:</strong> We'll use your mileage to calculate exactly when your next oil change, tire rotation, and major services are due.
        </Text>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <Button
          size="lg"
          className="w-full h-12 md:h-14 text-base md:text-lg"
          onClick={handleContinue}
          disabled={isProcessing || !mileage}
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
