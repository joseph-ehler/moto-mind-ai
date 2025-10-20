/**
 * Vehicle Confirmation Step
 * 
 * Step 2: Confirm we found the right vehicle
 * Shows decoded vehicle info, user confirms or tries again
 */

'use client'

import { Button } from '@/components/ui/button'
import { Text, Heading } from '@/components/design-system'
import { CheckCircle2, Car } from 'lucide-react'

interface VehicleConfirmStepProps {
  year: number
  make: string
  model: string
  trim?: string
  vin: string
  onConfirm: () => void
  onTryAgain: () => void
}

export function VehicleConfirmStep({
  year,
  make,
  model,
  trim,
  vin,
  onConfirm,
  onTryAgain
}: VehicleConfirmStepProps) {
  const displayName = trim 
    ? `${year} ${make} ${model} ${trim}`
    : `${year} ${make} ${model}`

  return (
    <div className="w-full max-w-md mx-auto px-4 py-8 md:py-12">
      {/* Success Icon with pulse animation */}
      <div className="flex justify-center mb-6">
        <div className="relative">
          <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-20"></div>
          <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 md:w-10 md:h-10 text-green-600" />
          </div>
        </div>
      </div>

      {/* Title */}
      <Heading level="title" className="text-center mb-3">
        Vehicle Found!
      </Heading>
      
      <Text className="text-center text-gray-600 mb-8">
        Is this your vehicle?
      </Text>

      {/* Vehicle Card */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 mb-8">
        {/* Car Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-white/80 flex items-center justify-center">
            <Car className="w-10 h-10 md:w-12 md:h-12 text-blue-600" />
          </div>
        </div>

        {/* Vehicle Name */}
        <Heading level="title" className="text-center text-blue-900 mb-2">
          {displayName}
        </Heading>

        {/* VIN */}
        <Text className="text-center text-blue-700 font-mono text-sm mb-4">
          VIN: {vin.slice(0, 8)}...{vin.slice(-4)}
        </Text>

        {/* Verified Badge */}
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 bg-white/90 rounded-full px-4 py-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <Text className="text-sm font-semibold text-gray-900">
              Vehicle Verified
            </Text>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <Button
          size="lg"
          className="w-full h-12 md:h-14 text-base md:text-lg"
          onClick={onConfirm}
        >
          Yes, That's My Vehicle
        </Button>

        <Button
          variant="outline"
          size="lg"
          className="w-full h-12 md:h-14 text-base"
          onClick={onTryAgain}
        >
          No, Try a Different VIN
        </Button>
      </div>
    </div>
  )
}
