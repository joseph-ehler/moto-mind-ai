/**
 * VIN Capture Step V2 - Mobile/Native First
 * 
 * Uses new FormSection + FormInput components for:
 * - Clear section headers (what/why)
 * - Mobile-optimized input
 * - Proper keyboard hints
 * - 44px+ touch targets
 * 
 * VIN-specific features:
 * - Uppercase transformation
 * - Block I/O/Q characters
 * - Paste handler (strips spaces/dashes)
 * - Character counter (17/17)
 * - Help with examples
 */

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { HelpCircle, Car } from 'lucide-react'
import { useValidation } from '@/wizard/validation-context'
import { useVehicleOnboarding } from '@/flows/vehicle/store'
import { useWizardAnalytics } from '@/hooks/useWizardAnalytics'
import { FormSection, FormHelper } from '@/components/ui/form-section'

const VIN_LENGTH = 17
const INVALID_CHARS = /[IOQ]/gi // I, O, Q not allowed in VINs

/**
 * Validate VIN format
 */
function isValidVin(vin: string): boolean {
  if (!vin || vin.length !== VIN_LENGTH) return false
  if (INVALID_CHARS.test(vin)) return false
  return true
}

/**
 * Clean pasted VIN (remove spaces, dashes)
 */
function cleanVin(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/[\s\-]/g, '') // Remove spaces and dashes
    .replace(INVALID_CHARS, '') // Remove invalid chars
    .slice(0, VIN_LENGTH) // Max 17 chars
}

type VinCaptureV2Props = {
  stepId?: string
  stepIndex?: number
  chapterId?: string
}

export function VinCaptureV2({
  stepId = 'vin',
  stepIndex = 0,
  chapterId = 'default'
}: VinCaptureV2Props = {}) {
  const { setValid } = useValidation()
  const { vin: storedVin, setVin } = useVehicleOnboarding()
  const analytics = useWizardAnalytics('vehicle')
  
  const [value, setValue] = useState(storedVin || '')
  const [error, setError] = useState<string | null>(null)
  
  // Track step view (once on mount)
  useEffect(() => {
    analytics.trackStepView(stepId, stepIndex, chapterId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  
  // Validate on change
  useEffect(() => {
    const valid = isValidVin(value)
    setValid(valid)
    
    if (value.length === VIN_LENGTH && !valid) {
      setError('VIN contains invalid characters (I, O, Q not allowed)')
    } else {
      setError(null)
    }
    
    // Save to store when valid
    if (valid) {
      setVin(value)
      analytics.trackStepComplete(stepId, stepIndex, chapterId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    const cleaned = cleanVin(raw)
    setValue(cleaned)
    
    // Track typing
    if (cleaned.length > 0 && cleaned.length <= VIN_LENGTH) {
      analytics.trackStepView(`${stepId}_typed`, stepIndex, chapterId)
    }
  }
  
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const raw = e.clipboardData.getData('text')
    const cleaned = cleanVin(raw)
    setValue(cleaned)
    
    // Track paste
    analytics.trackStepView(`${stepId}_pasted`, stepIndex, chapterId)
    
    // If valid after paste, mark validated
    if (isValidVin(cleaned)) {
      analytics.trackStepComplete(`${stepId}_validated`, stepIndex, chapterId)
    }
  }
  
  const charCount = value.length
  const isComplete = charCount === VIN_LENGTH
  const counterColor = isComplete && isValidVin(value) ? 'text-green-600' : 'text-gray-500'
  
  return (
    <FormSection
      title="What's your vehicle's VIN?"
      description="We'll use this 17-character code to pull accurate specs, recall information, and service history."
      icon={<Car className="w-6 h-6" />}
    >
      {/* VIN Input with Character Counter */}
      <div className="space-y-2">
        {/* Label with Help */}
        <div className="flex items-center justify-between">
          <label htmlFor="vin" className="block text-sm font-medium text-gray-900">
            Vehicle Identification Number (VIN)
            <span className="text-red-500 ml-1" aria-label="required">*</span>
          </label>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-1 text-gray-500 hover:text-gray-700 touch-manipulation"
                aria-label="Help finding VIN"
              >
                <HelpCircle className="w-5 h-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-3">
                <h4 className="font-semibold text-sm">Where to find your VIN:</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Dashboard (driver's side, visible through windshield)</li>
                  <li>• Driver's door jamb (sticker)</li>
                  <li>• Vehicle registration</li>
                  <li>• Insurance card</li>
                  <li>• Owner's manual</li>
                </ul>
                <p className="text-xs text-gray-500 border-t pt-2 mt-2">
                  Example: 1HGCM82633A004352
                </p>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        
        {/* Input with Counter */}
        <div className="relative">
          <input
            id="vin"
            type="text"
            inputMode="text"
            enterKeyHint="done"
            value={value}
            onChange={handleChange}
            onPaste={handlePaste}
            placeholder="Enter 17-character VIN"
            maxLength={VIN_LENGTH}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="characters"
            spellCheck={false}
            required
            aria-label="Vehicle Identification Number"
            aria-describedby={error ? 'vin-error' : 'vin-help'}
            aria-invalid={error ? 'true' : 'false'}
            className={`
              block w-full rounded-lg border px-4 py-3 pr-16
              text-base font-mono tracking-wide uppercase
              transition-colors duration-200
              min-h-[44px] touch-manipulation
              focus:outline-none focus:ring-2 focus:ring-offset-0
              ${error 
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
              }
            `}
          />
          
          {/* Character counter */}
          <div
            className={`absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium ${counterColor}`}
            aria-live="polite"
          >
            {charCount}/{VIN_LENGTH}
          </div>
        </div>
        
        {/* Error or Help Text */}
        {error ? (
          <p id="vin-error" className="text-sm text-red-600 flex items-start gap-1" role="alert">
            <span className="text-base">⚠️</span>
            <span>{error}</span>
          </p>
        ) : (
          <p id="vin-help" className="text-sm text-gray-600">
            Paste or type your 17-character VIN. Letters I, O, and Q are not used.
          </p>
        )}
      </div>
      
      {/* Success Feedback */}
      {isValidVin(value) && (
        <FormHelper type="tip">
          <strong>VIN looks good!</strong> Ready to continue.
        </FormHelper>
      )}
      
      {/* Additional Help */}
      <FormHelper type="info">
        <strong>Can't find your VIN?</strong> It's a 17-character code found on your dashboard, door jamb, or registration.
      </FormHelper>
    </FormSection>
  )
}
