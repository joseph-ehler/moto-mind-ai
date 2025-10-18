'use client'

/**
 * Onboarding: Add Vehicle Screen
 * Second step - collect vehicle info
 * Time: 30-60 seconds
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Stack, Heading, Text } from '@/components/design-system'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, ArrowRight } from 'lucide-react'

// Popular motorcycle makes
const MAKES = [
  'Honda',
  'Yamaha',
  'Kawasaki',
  'Suzuki',
  'Harley-Davidson',
  'BMW',
  'Ducati',
  'Triumph',
  'KTM',
  'Indian',
  'Other',
]

// Generate years (current year back to 1980)
const currentYear = new Date().getFullYear()
const YEARS = Array.from({ length: currentYear - 1979 }, (_, i) => currentYear - i)

export default function AddVehiclePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [make, setMake] = useState('')
  const [model, setModel] = useState('')
  const [year, setYear] = useState('')
  const [nickname, setNickname] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!make || !model || !year) {
      setError('Please fill in all required fields')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/onboarding/vehicle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          make,
          model,
          year: parseInt(year),
          nickname: nickname || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add vehicle')
      }

      // Success! Go to completion screen
      router.push('/onboarding/complete')
    } catch (err: any) {
      console.error('[Onboarding] Failed to add vehicle:', err)
      setError(err.message || 'Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <Stack spacing="xl" className="py-12 max-w-lg mx-auto">
      {/* Header */}
      <div>
        <Heading level="title" className="mb-2">
          Add Your First Vehicle
        </Heading>
        <Text className="text-gray-600">
          We'll use this to track maintenance and provide personalized insights
        </Text>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Stack spacing="lg">
          {/* Make */}
          <div>
            <Label htmlFor="make">
              Make <span className="text-red-500">*</span>
            </Label>
            <Select value={make} onValueChange={setMake} required>
              <SelectTrigger id="make">
                <SelectValue placeholder="Select make" />
              </SelectTrigger>
              <SelectContent>
                {MAKES.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Model */}
          <div>
            <Label htmlFor="model">
              Model <span className="text-red-500">*</span>
            </Label>
            <Input
              id="model"
              type="text"
              placeholder="e.g., CBR600RR"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          {/* Year */}
          <div>
            <Label htmlFor="year">
              Year <span className="text-red-500">*</span>
            </Label>
            <Select value={year} onValueChange={setYear} required>
              <SelectTrigger id="year">
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                {YEARS.map((y) => (
                  <SelectItem key={y} value={y.toString()}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Nickname (Optional) */}
          <div>
            <Label htmlFor="nickname">
              Nickname <span className="text-gray-400">(optional)</span>
            </Label>
            <Input
              id="nickname"
              type="text"
              placeholder="e.g., My Bike"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              disabled={loading}
            />
            <Text className="text-sm text-gray-500 mt-1">
              Give your vehicle a friendly name
            </Text>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <Text className="text-sm text-red-800">{error}</Text>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            size="lg"
            disabled={loading || !make || !model || !year}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                Adding Vehicle...
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="ml-2 w-5 h-5" />
              </>
            )}
          </Button>
        </Stack>
      </form>

      {/* Progress Indicator */}
      <div className="flex justify-center items-center gap-2 mt-8">
        <div className="w-8 h-2 rounded-full bg-blue-600" />
        <div className="w-8 h-2 rounded-full bg-blue-600" />
        <div className="w-8 h-2 rounded-full bg-gray-200" />
      </div>
      <Text className="text-center text-sm text-gray-500">
        Step 2 of 3
      </Text>
    </Stack>
  )
}
