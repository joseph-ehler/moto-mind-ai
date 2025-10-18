'use client'

/**
 * Onboarding: VIN Entry Screen
 * User enters or scans VIN to decode vehicle
 * Time: 15 seconds
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Stack, Heading, Text } from '@/components/design-system'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Camera, Keyboard, FileText, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { isValidVINFormat, sanitizeVIN } from '@/lib/vin/validator'

export default function VINEntryPage() {
  const router = useRouter()
  const [vin, setVIN] = useState('')
  const [isValidating, setIsValidating] = useState(false)
  const [validationState, setValidationState] = useState<'idle' | 'valid' | 'invalid'>('idle')

  // Real-time VIN validation as user types
  const handleVINChange = (value: string) => {
    const sanitized = sanitizeVIN(value)
    setVIN(sanitized)
    
    if (sanitized.length === 0) {
      setValidationState('idle')
    } else if (sanitized.length === 17) {
      setValidationState(isValidVINFormat(sanitized) ? 'valid' : 'invalid')
    } else {
      setValidationState('idle')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (validationState !== 'valid') return
    
    setIsValidating(true)
    
    // Store VIN in session storage for analyzing page
    sessionStorage.setItem('onboarding_vin', vin)
    
    // Route to analyzing screen (which will call API)
    router.push('/onboarding/analyzing')
  }

  const handleManualEntry = () => {
    router.push('/onboarding/vehicle')
  }

  const handleScanVIN = () => {
    // TODO: Implement camera scanning in Week 2
    alert('Camera VIN scanning coming soon! For now, please enter your VIN manually.')
  }

  // Get border color based on validation state
  const getBorderColor = () => {
    if (validationState === 'valid') return 'border-green-500'
    if (validationState === 'invalid') return 'border-red-500'
    return 'border-gray-300'
  }

  return (
    <Stack spacing="xl" className="py-12 max-w-2xl mx-auto px-4">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
          <Camera className="w-8 h-8 text-blue-600" />
        </div>
        
        <Heading level="h1" className="mb-4">
          Add Your Vehicle
        </Heading>
        
        <Text className="text-gray-600 max-w-md mx-auto">
          Enter your VIN to instantly get complete vehicle specs, safety features, and AI-powered insights.
        </Text>
      </div>

      {/* VIN Input Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardContent className="pt-6">
            <Stack spacing="md">
              <div className="space-y-2">
                <Label htmlFor="vin" className="text-base font-semibold">
                  Vehicle Identification Number (VIN)
                </Label>
                <div className="relative">
                  <Input
                    id="vin"
                    type="text"
                    value={vin}
                    onChange={(e) => handleVINChange(e.target.value)}
                    placeholder="Enter 17-character VIN"
                    className={`text-lg font-mono uppercase pr-12 ${getBorderColor()}`}
                    maxLength={17}
                    autoFocus
                    disabled={isValidating}
                  />
                  {/* Validation Icon */}
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {validationState === 'valid' && (
                      <CheckCircle2 className="w-6 h-6 text-green-500" />
                    )}
                    {validationState === 'invalid' && (
                      <AlertCircle className="w-6 h-6 text-red-500" />
                    )}
                  </div>
                </div>
                <Text className="text-sm text-gray-500">
                  {vin.length}/17 characters
                </Text>
              </div>

              {/* Validation Messages */}
              {validationState === 'valid' && (
                <div className="flex items-center gap-2 text-green-700 bg-green-50 p-3 rounded-md">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                  <Text className="text-sm">Valid VIN format - ready to decode!</Text>
                </div>
              )}
              
              {validationState === 'invalid' && (
                <div className="flex items-center gap-2 text-red-700 bg-red-50 p-3 rounded-md">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <Text className="text-sm">Invalid VIN format. Please check and try again.</Text>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={validationState !== 'valid' || isValidating}
              >
                {isValidating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Decoding VIN...
                  </>
                ) : (
                  <>
                    Decode Vehicle
                    <Camera className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </form>

      {/* Scan VIN Button (Placeholder) */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="pt-6">
          <button
            onClick={handleScanVIN}
            className="w-full text-left"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Camera className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <Text className="font-semibold text-blue-900 mb-1">
                  📷 Scan VIN with Camera
                </Text>
                <Text className="text-sm text-blue-700">
                  Point your camera at the VIN on your dashboard or door jamb (Coming soon!)
                </Text>
              </div>
            </div>
          </button>
        </CardContent>
      </Card>

      {/* Where to Find VIN */}
      <Card>
        <CardContent className="pt-6">
          <Stack spacing="sm">
            <Text className="font-semibold text-gray-900 mb-2">
              Where to find your VIN:
            </Text>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>Dashboard (bottom of windshield, driver's side)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>Driver's door jamb sticker</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>Vehicle registration or insurance card</span>
              </li>
            </ul>
          </Stack>
        </CardContent>
      </Card>

      {/* Manual Entry Fallback */}
      <div className="text-center">
        <button
          onClick={handleManualEntry}
          className="text-gray-600 hover:text-gray-900 transition-colors inline-flex items-center gap-2"
        >
          <FileText className="w-4 h-4" />
          <span className="text-sm">Or enter vehicle details manually</span>
        </button>
      </div>

      {/* Test VINs (Development Only) */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="pt-4 pb-4">
            <Text className="text-xs font-semibold text-yellow-900 mb-2">
              Test VINs (Dev Only):
            </Text>
            <div className="space-y-1">
              <button
                onClick={() => handleVINChange('1FTFW1ET5BFC10312')}
                className="text-xs text-yellow-700 hover:text-yellow-900 block font-mono"
              >
                1FTFW1ET5BFC10312 (2011 Ford F-150)
              </button>
              <button
                onClick={() => handleVINChange('5YJSA1E14HF123456')}
                className="text-xs text-yellow-700 hover:text-yellow-900 block font-mono"
              >
                5YJSA1E14HF123456 (2017 Tesla Model S)
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress Indicator */}
      <div className="flex justify-center gap-2">
        <div className="w-2 h-2 rounded-full bg-blue-600"></div>
        <div className="w-2 h-2 rounded-full bg-gray-300"></div>
        <div className="w-2 h-2 rounded-full bg-gray-300"></div>
      </div>
      <Text className="text-center text-sm text-gray-500">
        Step 1 of 3
      </Text>
    </Stack>
  )
}
