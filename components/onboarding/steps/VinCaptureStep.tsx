/**
 * VIN Capture Step
 * 
 * Step 1: Capture VIN from user
 * Mobile-first design with input, scan button, examples
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Text, Heading } from '@/components/design-system'
import { Camera, Loader2 } from 'lucide-react'

interface VinCaptureStepProps {
  onContinue: (vin: string) => void
  initialValue?: string
  error?: string | null
}

export function VinCaptureStep({ onContinue, initialValue = '', error: externalError }: VinCaptureStepProps) {
  const [vin, setVin] = useState(initialValue)
  const [isValidating, setIsValidating] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  
  // Use external error from parent if available, otherwise use local error
  const error = externalError || localError

  const handleContinue = () => {
    const trimmedVin = vin.trim().toUpperCase()
    
    // Basic validation
    if (!trimmedVin) {
      setLocalError('Please enter a VIN')
      return
    }
    
    if (trimmedVin.length !== 17) {
      setLocalError('VIN must be 17 characters')
      return
    }
    
    setIsValidating(true)
    setLocalError(null)
    
    // Simulate validation (actual validation happens in parent)
    setTimeout(() => {
      onContinue(trimmedVin)
    }, 500)
  }

  return (
    <div className="w-full max-w-md mx-auto px-4 py-8 md:py-12">
      {/* Icon */}
      <div className="flex justify-center mb-6">
        <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-blue-100 flex items-center justify-center">
          <svg className="w-8 h-8 md:w-10 md:h-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
      </div>

      {/* Title */}
      <Heading level="title" className="text-center mb-3">
        Let's Find Your Vehicle
      </Heading>
      
      <Text className="text-center text-gray-600 mb-8">
        Enter your VIN to get started. We'll analyze safety data, maintenance history, and more.
      </Text>

      {/* VIN Input */}
      <div className="space-y-4 mb-6">
        <div>
          <Label htmlFor="vin" className="text-base">
            Vehicle Identification Number (VIN)
          </Label>
          <Input
            id="vin"
            type="text"
            placeholder="1HGBH41JXMN109186"
            value={vin}
            onChange={(e) => {
              setVin(e.target.value.toUpperCase())
              setLocalError(null)
            }}
            maxLength={17}
            className="mt-2 text-lg font-mono h-12 md:h-14"
            disabled={isValidating}
          />
          
          {/* Character count */}
          <div className="flex justify-between items-center mt-2">
            <Text className="text-xs text-gray-500">
              {vin.length}/17 characters
            </Text>
            {error && (
              <Text className="text-xs text-red-600">
                {error}
              </Text>
            )}
          </div>
        </div>

        {/* Scan Button (Mobile) */}
        <Button
          variant="outline"
          size="lg"
          className="w-full md:hidden"
          disabled={isValidating}
        >
          <Camera className="w-5 h-5 mr-2" />
          Scan VIN with Camera
        </Button>
      </div>

      {/* Where to find VIN */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <Text className="text-sm font-semibold text-gray-900 mb-2">
          Where to find your VIN:
        </Text>
        <ul className="space-y-1 text-sm text-gray-600">
          <li>• Driver's side dashboard (visible through windshield)</li>
          <li>• Driver's side door jamb sticker</li>
          <li>• Vehicle registration or insurance card</li>
          <li>• Owner's manual</li>
        </ul>
      </div>

      {/* Continue Button */}
      <Button
        size="lg"
        className="w-full h-12 md:h-14 text-base md:text-lg"
        onClick={handleContinue}
        disabled={isValidating || vin.length !== 17}
      >
        {isValidating ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Finding Your Vehicle...
          </>
        ) : (
          'Continue'
        )}
      </Button>

      {/* Example VIN (for testing) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 text-center">
          <Text className="text-xs text-gray-400">
            Test VIN: 1HGBH41JXMN109186
          </Text>
        </div>
      )}
    </div>
  )
}
