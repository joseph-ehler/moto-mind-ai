/**
 * VINField Component
 * 
 * Complete VIN input field with integrated scanner
 * Handles validation, formatting, and scanning
 */

'use client'

import React, { useState } from 'react'
import { Camera, CheckCircle, XCircle } from 'lucide-react'
import { Stack, Flex } from '../../../primitives/Layout'
import { Button } from '../../../primitives/Button'
import { Text } from '../../../primitives/Typography'
import { VINScanner } from '../scanners/VINScanner'
import type { VINData } from '../scanners/VINScanner'

export interface VINFieldProps {
  // Value control
  value?: string
  onChange?: (value: string) => void
  onVINDetected?: (data: VINData) => void
  
  // Field configuration
  label?: string
  placeholder?: string
  disabled?: boolean
  required?: boolean
  
  // react-hook-form integration
  name?: string
  error?: string
  
  // Features
  enableScanner?: boolean
  enableValidation?: boolean
  autoFormat?: boolean
}

/**
 * Validate VIN format (17 characters, no I, O, or Q)
 */
function validateVIN(vin: string): boolean {
  if (vin.length !== 17) return false
  if (/[IOQ]/i.test(vin)) return false
  return /^[A-HJ-NPR-Z0-9]{17}$/i.test(vin)
}

/**
 * Format VIN for display (groups of 3-6-8)
 */
function formatVIN(vin: string): string {
  const cleaned = vin.replace(/[^A-HJ-NPR-Z0-9]/gi, '').toUpperCase()
  if (cleaned.length <= 3) return cleaned
  if (cleaned.length <= 9) return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`
  return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 9)}-${cleaned.slice(9, 17)}`
}

/**
 * VIN input field with scanner and validation
 */
export function VINField({
  value = '',
  onChange,
  onVINDetected,
  label = 'VIN Number',
  placeholder = 'Enter or scan VIN',
  disabled = false,
  required = false,
  name = 'vin',
  error,
  enableScanner = true,
  enableValidation = true,
  autoFormat = true
}: VINFieldProps) {
  const [showScanner, setShowScanner] = useState(false)
  const [touched, setTouched] = useState(false)
  
  const isValid = enableValidation && value.length > 0 ? validateVIN(value) : null
  const showValidation = touched && enableValidation && value.length > 0
  
  const handleChange = (newValue: string) => {
    const cleaned = newValue.replace(/[^A-HJ-NPR-Z0-9]/gi, '').toUpperCase()
    onChange?.(cleaned.slice(0, 17))
  }
  
  const handleScan = (data: VINData) => {
    handleChange(data.vin)
    onVINDetected?.(data)
    setShowScanner(false)
    setTouched(true)
  }
  
  const displayValue = autoFormat ? formatVIN(value) : value
  
  return (
    <>
      <Stack spacing="xs">
        {/* Label */}
        {label && (
          <Flex align="center" justify="between">
            <Text className="text-sm font-medium text-slate-700">
              {label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </Text>
            {showValidation && (
              <Flex align="center" gap="xs">
                {isValid ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <Text className="text-xs text-green-600">Valid VIN</Text>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-red-600" />
                    <Text className="text-xs text-red-600">Invalid VIN</Text>
                  </>
                )}
              </Flex>
            )}
          </Flex>
        )}
        
        {/* Input with scan button */}
        <div className="flex gap-2">
          <input
            type="text"
            name={name}
            value={displayValue}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={() => setTouched(true)}
            placeholder={placeholder}
            disabled={disabled}
            className={`
              flex-1 px-3 py-2 border rounded-md text-sm font-mono
              focus:outline-none focus:ring-2 focus:border-transparent
              disabled:bg-slate-100 disabled:text-slate-500
              ${error || (showValidation && !isValid) 
                ? 'border-red-300 focus:ring-red-500' 
                : 'border-slate-300 focus:ring-blue-500'
              }
            `}
          />
          
          {enableScanner && (
            <Button
              onClick={() => setShowScanner(true)}
              disabled={disabled}
              variant="outline"
              size="lg"
            >
              <Camera className="w-4 h-4" />
            </Button>
          )}
        </div>
        
        {/* Helper text / Error */}
        {error ? (
          <Text className="text-xs text-red-600">
            {error}
          </Text>
        ) : (
          <Text className="text-xs text-slate-500">
            17 characters (excludes I, O, Q)
          </Text>
        )}
      </Stack>
      
      {/* Scanner */}
      {showScanner && (
        <VINScanner
          onVINDetected={handleScan}
          onCancel={() => setShowScanner(false)}
        />
      )}
    </>
  )
}
