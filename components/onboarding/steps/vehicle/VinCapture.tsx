/**
 * VIN Capture Step
 * 
 * Collects and validates VIN with:
 * - Uppercase transformation
 * - Block I/O/Q characters
 * - Paste handler (strips spaces/dashes)
 * - Character counter (17/17)
 * - Help popover
 */

'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { HelpCircle } from 'lucide-react'
import { useValidation } from '@/wizard/validation-context'
import { useVehicleOnboarding } from '@/flows/vehicle/store'
import { useWizardAnalytics } from '@/hooks/useWizardAnalytics'

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

export function VinCapture() {
  const { setValid } = useValidation()
  const { vin: storedVin, setVin } = useVehicleOnboarding()
  const analytics = useWizardAnalytics('vehicle')
  
  const [value, setValue] = useState(storedVin || '')
  const [error, setError] = useState<string | null>(null)
  
  // Track step view
  useEffect(() => {
    analytics.trackStepView('vin', 0, 'vehicle-basics')
  }, [analytics])
  
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
      analytics.trackStepComplete('vin', 0, 'vehicle-basics')
    }
  }, [value, setValid, setVin, analytics])
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    const cleaned = cleanVin(raw)
    setValue(cleaned)
    
    // Track typing
    if (cleaned.length > 0 && cleaned.length <= VIN_LENGTH) {
      analytics.trackStepView('vin_typed', 0, 'vehicle-basics')
    }
  }
  
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const raw = e.clipboardData.getData('text')
    const cleaned = cleanVin(raw)
    setValue(cleaned)
    
    // Track paste
    analytics.trackStepView('vin_pasted', 0, 'vehicle-basics')
    
    // If valid after paste, mark validated
    if (isValidVin(cleaned)) {
      analytics.trackStepComplete('vin_validated', 0, 'vehicle-basics')
    }
  }
  
  const charCount = value.length
  const isComplete = charCount === VIN_LENGTH
  const counterColor = isComplete && isValidVin(value) ? 'text-green-600' : 'text-gray-500'
  
  return (
    <div className="space-y-6 max-w-md mx-auto">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="vin" className="text-base font-medium">
            Vehicle Identification Number (VIN)
          </Label>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-1 text-gray-500 hover:text-gray-700"
                aria-label="Help finding VIN"
              >
                <HelpCircle className="w-4 h-4" />
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
              </div>
            </PopoverContent>
          </Popover>
        </div>
        
        <div className="relative">
          <Input
            id="vin"
            type="text"
            value={value}
            onChange={handleChange}
            onPaste={handlePaste}
            placeholder="Enter 17-character VIN"
            className="pr-16 font-mono text-lg tracking-wide uppercase"
            maxLength={VIN_LENGTH}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="characters"
            spellCheck={false}
            aria-label="Vehicle Identification Number"
            aria-describedby={error ? 'vin-error' : 'vin-help'}
            aria-invalid={error ? 'true' : 'false'}
          />
          
          {/* Character counter */}
          <div
            className={`absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium ${counterColor}`}
            aria-live="polite"
          >
            {charCount}/{VIN_LENGTH}
          </div>
        </div>
        
        {error ? (
          <p id="vin-error" className="text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : (
          <p id="vin-help" className="text-sm text-gray-500">
            Paste or type your 17-character VIN. Letters I, O, and Q are not used.
          </p>
        )}
      </div>
      
      {/* Visual feedback when valid */}
      {isValidVin(value) && (
        <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg p-3">
          <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="font-medium">VIN looks good! Ready to continue.</span>
        </div>
      )}
    </div>
  )
}
